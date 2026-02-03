import { AudioEngine as IAudioEngine, AudioEngineConfig, AudioSegment, IRingBuffer } from './types';
import { RingBuffer } from './RingBuffer';
import { EnergyVAD } from '../vad/EnergyVAD';
import { VADResult } from '../vad/types';

/**
 * Simple linear interpolation resampler for downsampling audio.
 * Good enough for speech recognition where we're going 48kHz -> 16kHz.
 */
function resampleLinear(input: Float32Array, fromRate: number, toRate: number): Float32Array {
    if (fromRate === toRate) return input;

    const ratio = fromRate / toRate;
    const outputLength = Math.floor(input.length / ratio);
    const output = new Float32Array(outputLength);

    for (let i = 0; i < outputLength; i++) {
        const srcIndex = i * ratio;
        const srcIndexFloor = Math.floor(srcIndex);
        const srcIndexCeil = Math.min(srcIndexFloor + 1, input.length - 1);
        const t = srcIndex - srcIndexFloor;

        // Linear interpolation
        output[i] = input[srcIndexFloor] * (1 - t) + input[srcIndexCeil] * t;
    }

    return output;
}

/**
 * AudioEngine implementation for capturing audio, buffering it, and performing basic VAD.
 */
export class AudioEngine implements IAudioEngine {
    private config: AudioEngineConfig;
    private ringBuffer: IRingBuffer;
    private energyVad: EnergyVAD;
    private deviceId: string | null = null;
    private lastVadResult: VADResult | null = null;

    private audioContext: AudioContext | null = null;
    private mediaStream: MediaStream | null = null;
    private workletNode: AudioWorkletNode | null = null;
    private sourceNode: MediaStreamAudioSourceNode | null = null;

    // Track device vs target sample rates
    private deviceSampleRate: number = 48000;
    private targetSampleRate: number = 16000;

    private currentEnergy: number = 0;
    private speechStartFrame: number = 0;
    private segmentEnergySum: number = 0;
    private segmentSampleCount: number = 0;

    private segmentCallbacks: Array<(segment: AudioSegment) => void> = [];

    // Fixed-window streaming state (v3 token streaming mode)
    private windowCallbacks: Array<{
        windowDuration: number;
        overlapDuration: number;
        callback: (audio: Float32Array, startTime: number) => void;
        lastWindowEnd: number; // Frame offset of last window end
    }> = [];

    constructor(config: Partial<AudioEngineConfig> = {}) {
        this.config = {
            sampleRate: 16000,
            bufferDuration: 120,
            energyThreshold: 0.02,
            minSpeechDuration: 100,
            minSilenceDuration: 100, // Fast triggering (100ms silence = end of segment)
            maxSegmentDuration: 3.0, // Split long utterances after 3s for faster streaming
            ...config,
        };

        this.deviceId = this.config.deviceId || null;
        this.targetSampleRate = this.config.sampleRate; // 16000 for Parakeet

        // RingBuffer and VAD operate at TARGET sample rate (16kHz)
        this.ringBuffer = new RingBuffer(this.targetSampleRate, this.config.bufferDuration);
        this.energyVad = new EnergyVAD({
            energyThreshold: this.config.energyThreshold,
            minSpeechDuration: this.config.minSpeechDuration,
            minSilenceDuration: this.config.minSilenceDuration,
            sampleRate: this.targetSampleRate,
        });
    }

    private isWorkletInitialized = false;

    async init(): Promise<void> {
        // Request microphone permission with optional deviceId
        try {
            if (this.mediaStream) {
                this.mediaStream.getTracks().forEach(t => t.stop());
            }

            const constraints: MediaStreamConstraints = {
                audio: {
                    deviceId: this.deviceId ? { exact: this.deviceId } : undefined,
                    channelCount: 1,
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false,
                },
            };

            console.log('[AudioEngine] Requesting microphone:', constraints);
            this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
            console.log('[AudioEngine] Microphone stream acquired:', this.mediaStream.id);
        } catch (err) {
            console.error('[AudioEngine] Failed to get media stream:', err);
            throw err;
        }

        const track = this.mediaStream!.getAudioTracks()[0];
        const trackSettings = track?.getSettings?.();
        // Device sample rate (what the mic gives us)
        this.deviceSampleRate = trackSettings?.sampleRate ?? 48000;
        console.log('[AudioEngine] Device sample rate:', this.deviceSampleRate, '-> Target:', this.targetSampleRate);

        if (this.audioContext && this.audioContext.sampleRate !== this.deviceSampleRate) {
            await this.audioContext.close();
            this.audioContext = null;
        }
        if (!this.audioContext) {
            this.audioContext = new AudioContext({
                sampleRate: this.deviceSampleRate,
                latencyHint: 'interactive',
            });
            console.log('[AudioEngine] Created AudioContext:', this.audioContext.state, 'sampleRate:', this.audioContext.sampleRate);
        }

        // RingBuffer and VAD operate at TARGET rate (16kHz) - audio will be resampled
        this.ringBuffer = new RingBuffer(this.targetSampleRate, this.config.bufferDuration);
        this.energyVad = new EnergyVAD({
            energyThreshold: this.config.energyThreshold,
            minSpeechDuration: this.config.minSpeechDuration,
            minSilenceDuration: this.config.minSilenceDuration,
            sampleRate: this.targetSampleRate,
        });

        if (!this.isWorkletInitialized) {
            const windowDuration = 0.080;
            const processorCode = `
                class CaptureProcessor extends AudioWorkletProcessor {
                    constructor(options) {
                        super(options);
                        const sr = (options?.processorOptions?.sampleRate) || 16000;
                        this.bufferSize = Math.round(${windowDuration} * sr);
                        this.buffer = new Float32Array(this.bufferSize);
                        this.index = 0;
                        this._lastLog = 0;
                    }

                    process(inputs, outputs) {
                        const input = inputs[0];
                        if (!input || !input[0]) return true;
                        
                        const channelData = input[0];
                        
                        // Buffer the data
                        for (let i = 0; i < channelData.length; i++) {
                            this.buffer[this.index++] = channelData[i];
                            
                            if (this.index >= this.bufferSize) {
                                // Send buffer
                                this.port.postMessage(this.buffer.slice());
                                this.index = 0;
                                
                                // Debug log every ~5 seconds (roughly every 20 chunks)
                                const now = Date.now();
                                if (now - this._lastLog > 5000) {
                                    console.log('[AudioWorklet] Processed 4096 samples');
                                    this._lastLog = now;
                                }
                            }
                        }
                        
                        return true;
                    }
                }
                registerProcessor('capture-processor', CaptureProcessor);
            `;
            const blob = new Blob([processorCode], { type: 'application/javascript' });
            const url = URL.createObjectURL(blob);
            try {
                await this.audioContext.audioWorklet.addModule(url);
                this.isWorkletInitialized = true;
                console.log('[AudioEngine] AudioWorklet module loaded');
            } catch (err) {
                console.error('[AudioEngine] Failed to load worklet:', err);
                if (err instanceof Error && err.name === 'InvalidStateError') {
                    // Ignore if already registered
                    this.isWorkletInitialized = true;
                }
            }
        }

        // Re-create worklet node if needed (it might handle dispose differently, but safe to new)
        if (this.workletNode) this.workletNode.disconnect();

        this.workletNode = new AudioWorkletNode(this.audioContext, 'capture-processor', {
            processorOptions: { sampleRate: this.deviceSampleRate },
        });
        this.workletNode.port.onmessage = (event: MessageEvent<Float32Array>) => {
            this.handleAudioChunk(event.data);
        };
        this.workletNode.onprocessorerror = (e) => {
            console.error('[AudioEngine] Worklet processor error:', e);
        };

        // Reconnect source node
        this.sourceNode?.disconnect();
        this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);
        this.sourceNode.connect(this.workletNode);

        // Keep graph alive
        this.workletNode.connect(this.audioContext.destination);
        console.log('[AudioEngine] Graph connected: Source -> Worklet -> Destination');
    }

    async start(): Promise<void> {
        if (!this.mediaStream || !this.audioContext || !this.workletNode) {
            await this.init();
        }

        if (this.audioContext?.state === 'suspended') {
            await this.audioContext.resume();
        }
    }

    stop(): void {
        if (this.audioContext?.state === 'running') {
            this.audioContext.suspend();
        }
    }

    getCurrentEnergy(): number {
        return this.currentEnergy;
    }

    getSignalMetrics(): { noiseFloor: number; snr: number; threshold: number; snrThreshold: number } {
        // We cache these from the last processed chunk
        return {
            noiseFloor: this.lastVadResult?.noiseFloor ?? 0.0001,
            snr: this.lastVadResult?.snr ?? 0,
            threshold: this.config.energyThreshold,
            snrThreshold: 3.0 // SNR threshold in dB for speech detection
        };
    }

    isSpeechActive(): boolean {
        return this.currentEnergy > this.config.energyThreshold;
    }

    getRingBuffer(): IRingBuffer {
        return this.ringBuffer;
    }

    onSpeechSegment(callback: (segment: AudioSegment) => void): () => void {
        this.segmentCallbacks.push(callback);
        return () => {
            this.segmentCallbacks = this.segmentCallbacks.filter((cb) => cb !== callback);
        };
    }

    /**
     * Subscribe to fixed-window chunks for token streaming mode.
     * Fires every (windowDuration - overlapDuration) seconds with windowDuration of audio.
     */
    onWindowChunk(
        windowDuration: number,
        overlapDuration: number,
        callback: (audio: Float32Array, startTime: number) => void
    ): () => void {
        const entry = {
            windowDuration,
            overlapDuration,
            callback,
            lastWindowEnd: 0, // Will be set on first chunk
        };
        this.windowCallbacks.push(entry);

        return () => {
            this.windowCallbacks = this.windowCallbacks.filter((e) => e !== entry);
        };
    }

    updateConfig(config: Partial<AudioEngineConfig>): void {
        this.config = { ...this.config, ...config };
        this.energyVad.updateConfig({
            energyThreshold: this.config.energyThreshold,
            minSpeechDuration: this.config.minSpeechDuration,
            minSilenceDuration: this.config.minSilenceDuration,
        });
    }

    async setDevice(deviceId: string): Promise<void> {
        this.deviceId = deviceId;
        await this.init();

        // Reconnect if running
        if (this.audioContext && this.workletNode) {
            this.sourceNode?.disconnect();
            this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream!);
            this.sourceNode.connect(this.workletNode);
        }
    }

    dispose(): void {
        this.stop();
        this.mediaStream?.getTracks().forEach(track => track.stop());
        this.audioContext?.close();
        this.audioContext = null;
        this.mediaStream = null;
        this.workletNode = null;
        this.sourceNode = null;
    }

    private handleAudioChunk(rawChunk: Float32Array): void {
        // 0. Resample from device rate to target rate (e.g., 48kHz -> 16kHz)
        const chunk = resampleLinear(rawChunk, this.deviceSampleRate, this.targetSampleRate);

        // 1. Process VAD on resampled audio
        const vadResult = this.energyVad.process(chunk);
        this.currentEnergy = vadResult.energy;
        this.lastVadResult = vadResult;

        // 2. Write resampled audio to ring buffer
        const endFrame = this.ringBuffer.getCurrentFrame() + chunk.length;
        this.ringBuffer.write(chunk);

        // 3. Handle segments
        if (vadResult.speechStart) {
            this.speechStartFrame = endFrame - chunk.length;
            this.segmentEnergySum = vadResult.energy * chunk.length;
            this.segmentSampleCount = chunk.length;
        } else if (vadResult.isSpeech) {
            this.segmentEnergySum += vadResult.energy * chunk.length;
            this.segmentSampleCount += chunk.length;
        }

        // 4. Proactive segment splitting for long utterances (from parakeet-ui)
        // This ensures transcription happens without waiting for silence
        if (vadResult.isSpeech && this.speechStartFrame > 0) {
            const currentSpeechDuration = (endFrame - this.speechStartFrame) / this.targetSampleRate;

            if (currentSpeechDuration >= this.config.maxSegmentDuration) {
                console.log(`[AudioEngine] Splitting long segment at ${currentSpeechDuration.toFixed(2)}s`);

                const segment: AudioSegment = {
                    startFrame: this.speechStartFrame,
                    endFrame: endFrame,
                    duration: currentSpeechDuration,
                    averageEnergy: this.segmentEnergySum / this.segmentSampleCount,
                    timestamp: Date.now(),
                };

                this.notifySegment(segment);

                // Start new segment immediately (continues speech)
                this.speechStartFrame = endFrame;
                this.segmentEnergySum = vadResult.energy * chunk.length;
                this.segmentSampleCount = chunk.length;
            }
        }

        // 5. Handle natural speech end (silence detected)
        if (vadResult.speechEnd) {
            const segment: AudioSegment = {
                startFrame: this.speechStartFrame,
                endFrame: endFrame - Math.ceil((this.energyVad.getConfig().minSilenceDuration / 1000) * this.targetSampleRate),
                duration: (endFrame - this.speechStartFrame) / this.targetSampleRate,
                averageEnergy: this.segmentEnergySum / this.segmentSampleCount,
                timestamp: Date.now(),
            };

            // Adjust endFrame to be more accurate (excluding the silence that triggered the end)
            const silenceFrames = Math.ceil((this.energyVad.getConfig().minSilenceDuration / 1000) * this.targetSampleRate);
            segment.endFrame = endFrame - silenceFrames;
            segment.duration = (segment.endFrame - segment.startFrame) / this.targetSampleRate;

            if (segment.duration > 0) {
                this.notifySegment(segment);
            }
        }

        // 6. Fixed-window streaming (v3 token streaming mode)
        this.processWindowCallbacks(endFrame);
    }

    /**
     * Process fixed-window callbacks for token streaming mode.
     * Fires when enough audio has accumulated for a new window.
     */
    private processWindowCallbacks(currentFrame: number): void {
        for (const entry of this.windowCallbacks) {
            const windowFrames = Math.floor(entry.windowDuration * this.targetSampleRate);
            const stepFrames = Math.floor((entry.windowDuration - entry.overlapDuration) * this.targetSampleRate);

            // Initialize lastWindowEnd on first call
            if (entry.lastWindowEnd === 0) {
                entry.lastWindowEnd = currentFrame;
                continue;
            }

            // Check if we have enough new audio for the next window
            const framesSinceLastWindow = currentFrame - entry.lastWindowEnd;
            if (framesSinceLastWindow >= stepFrames) {
                // Calculate window boundaries
                const windowEnd = currentFrame;
                const windowStart = windowEnd - windowFrames;

                // Ensure we have enough data in the ring buffer
                const baseOffset = this.ringBuffer.getBaseFrameOffset();
                if (windowStart >= baseOffset) {
                    try {
                        const audio = this.ringBuffer.read(windowStart, windowEnd);
                        const startTime = windowStart / this.targetSampleRate;

                        entry.callback(audio, startTime);
                        entry.lastWindowEnd = windowEnd;
                    } catch (e) {
                        console.warn('[AudioEngine] Window read failed:', e);
                    }
                }
            }
        }
    }

    private notifySegment(segment: AudioSegment): void {
        this.segmentCallbacks.forEach((cb) => cb(segment));
    }
}
