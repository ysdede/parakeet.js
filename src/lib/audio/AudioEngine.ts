import { AudioEngine as IAudioEngine, AudioEngineConfig, AudioSegment, IRingBuffer, AudioMetrics } from './types';
import { RingBuffer } from './RingBuffer';
import { AudioSegmentProcessor, ProcessedSegment } from './AudioSegmentProcessor';

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

/** Duration of the visualization buffer in seconds */
const VISUALIZATION_BUFFER_DURATION = 30;

/**
 * AudioEngine implementation for capturing audio, buffering it, and performing VAD.
 * Uses AudioSegmentProcessor for robust speech detection (incl. lookback).
 */
export class AudioEngine implements IAudioEngine {
    private config: AudioEngineConfig;
    private ringBuffer: IRingBuffer;
    private audioProcessor: AudioSegmentProcessor; // Replaces EnergyVAD
    private deviceId: string | null = null;

    private audioContext: AudioContext | null = null;
    private mediaStream: MediaStream | null = null;
    private workletNode: AudioWorkletNode | null = null;
    private sourceNode: MediaStreamAudioSourceNode | null = null;

    // Track device vs target sample rates
    private deviceSampleRate: number = 48000;
    private targetSampleRate: number = 16000;

    private currentEnergy: number = 0;

    private segmentCallbacks: Array<(segment: AudioSegment) => void> = [];

    // Fixed-window streaming state (v3 token streaming mode)
    private windowCallbacks: Array<{
        windowDuration: number;
        overlapDuration: number;
        triggerInterval: number;
        callback: (audio: Float32Array, startTime: number) => void;
        lastWindowEnd: number; // Frame offset of last window end
    }> = [];

    // Resampled audio chunk callbacks (for mel worker, etc.)
    private audioChunkCallbacks: Array<(chunk: Float32Array) => void> = [];

    // SMA buffer for energy calculation
    private energyHistory: number[] = [];

    // Visualization Summary Buffer (Low-Res Min/Max pairs)
    private visualizationSummary: Float32Array | null = null;
    private visualizationSummaryPosition: number = 0;
    private readonly VIS_SUMMARY_SIZE = 2000; // 2000 min/max pairs for 30 seconds = 15ms resolution

    // Raw visualization buffer (still kept for higher-res requests if needed, but summary is preferred)
    private visualizationBuffer: Float32Array | null = null;
    private visualizationBufferPosition: number = 0;
    private visualizationBufferSize: number = 0;

    // Metrics for UI components
    private metrics: AudioMetrics = {
        currentEnergy: 0,
        averageEnergy: 0,
        peakEnergy: 0,
        noiseFloor: 0.01,
        currentSNR: 0,
        isSpeaking: false,
    };

    // Subscribers for visualization updates
    private visualizationCallbacks: Array<(data: Float32Array, metrics: AudioMetrics, bufferEndTime: number) => void> = [];
    private lastVisualizationNotifyTime: number = 0;
    private readonly VISUALIZATION_NOTIFY_INTERVAL_MS = 33; // ~30fps (approx 3 updates per 80ms chunk window)

    // Recent segments for visualization (stores timing info only)
    private recentSegments: Array<{ startTime: number; endTime: number; isProcessed: boolean }> = [];
    private readonly MAX_SEGMENTS_FOR_VISUALIZATION = 50;

    constructor(config: Partial<AudioEngineConfig> = {}) {
        this.config = {
            sampleRate: 16000,
            bufferDuration: 120,
            energyThreshold: 0.08, // Match Parakeet-UI 'medium'
            minSpeechDuration: 240, // Match Parakeet-UI
            minSilenceDuration: 400, // Match Parakeet-UI
            maxSegmentDuration: 4.8, // Match Parakeet-UI

            // Advanced VAD defaults
            lookbackDuration: 0.120,
            speechHangover: 0.16,
            minEnergyIntegral: 22,
            minEnergyPerSecond: 5,
            useAdaptiveEnergyThresholds: true,
            adaptiveEnergyIntegralFactor: 25.0,
            adaptiveEnergyPerSecondFactor: 10.0,
            minAdaptiveEnergyIntegral: 3,
            minAdaptiveEnergyPerSecond: 1,
            maxSilenceWithinSpeech: 0.160,
            endingSpeechTolerance: 0.240,
            ...config,
        };

        this.deviceId = this.config.deviceId || null;
        this.targetSampleRate = this.config.sampleRate;

        // RingBuffer operates at TARGET sample rate (16kHz)
        this.ringBuffer = new RingBuffer(this.targetSampleRate, this.config.bufferDuration);

        // Initialize AudioSegmentProcessor
        this.audioProcessor = new AudioSegmentProcessor({
            sampleRate: this.targetSampleRate,
            energyThreshold: this.config.energyThreshold,
            minSpeechDuration: this.config.minSpeechDuration,
            silenceThreshold: this.config.minSilenceDuration,
            maxSegmentDuration: this.config.maxSegmentDuration,
            lookbackDuration: this.config.lookbackDuration,
            maxSilenceWithinSpeech: this.config.maxSilenceWithinSpeech,
            endingSpeechTolerance: this.config.endingSpeechTolerance,
            snrThreshold: 3.0,
            minSnrThreshold: 1.0,
            noiseFloorAdaptationRate: 0.05,
            fastAdaptationRate: 0.15,
            minBackgroundDuration: 1.0,
            energyRiseThreshold: 0.08
        });

        // Initialize visualization buffer (30 seconds at target sample rate)
        this.visualizationBufferSize = Math.round(this.targetSampleRate * VISUALIZATION_BUFFER_DURATION);
        this.visualizationBuffer = new Float32Array(this.visualizationBufferSize);
        this.visualizationBufferPosition = 0;

        // Initialize visualization summary (2000 points for 30s)
        this.visualizationSummary = new Float32Array(this.VIS_SUMMARY_SIZE * 2);
        this.visualizationSummaryPosition = 0;

        console.log('[AudioEngine] Initialized with config:', this.config);
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

        // Re-initialize components with correct rates
        this.ringBuffer = new RingBuffer(this.targetSampleRate, this.config.bufferDuration);

        // Update processor config
        this.audioProcessor = new AudioSegmentProcessor({
            sampleRate: this.targetSampleRate,
            energyThreshold: this.config.energyThreshold,
            minSpeechDuration: this.config.minSpeechDuration,
            silenceThreshold: this.config.minSilenceDuration,
            maxSegmentDuration: this.config.maxSegmentDuration,
        });

        if (!this.isWorkletInitialized) {
            const windowDuration = 0.080;
            const processorCode = `
                class CaptureProcessor extends AudioWorkletProcessor {
                    constructor(options) {
                        super(options);
                        const opts = options?.processorOptions || {};
                        this.inputSampleRate = opts.inputSampleRate || 16000;
                        this.targetSampleRate = opts.targetSampleRate || this.inputSampleRate;
                        this.ratio = this.inputSampleRate / this.targetSampleRate;
                        this.bufferSize = Math.round(${windowDuration} * this.inputSampleRate);
                        this.buffer = new Float32Array(this.bufferSize);
                        this.index = 0;
                        this._lastLog = 0;
                    }

                    _emitChunk() {
                        let out;
                        let maxAbs = 0;

                        if (this.targetSampleRate === this.inputSampleRate) {
                            out = new Float32Array(this.bufferSize);
                            for (let i = 0; i < this.bufferSize; i++) {
                                const v = this.buffer[i];
                                out[i] = v;
                                const a = v < 0 ? -v : v;
                                if (a > maxAbs) maxAbs = a;
                            }
                        } else {
                            const outLength = Math.floor(this.bufferSize / this.ratio);
                            out = new Float32Array(outLength);
                            for (let i = 0; i < outLength; i++) {
                                const srcIndex = i * this.ratio;
                                const srcIndexFloor = Math.floor(srcIndex);
                                const srcIndexCeil = Math.min(srcIndexFloor + 1, this.bufferSize - 1);
                                const t = srcIndex - srcIndexFloor;
                                const v = this.buffer[srcIndexFloor] * (1 - t) + this.buffer[srcIndexCeil] * t;
                                out[i] = v;
                                const a = v < 0 ? -v : v;
                                if (a > maxAbs) maxAbs = a;
                            }
                        }

                        this.port.postMessage(
                            { type: 'audio', samples: out, sampleRate: this.targetSampleRate, maxAbs },
                            [out.buffer]
                        );
                    }

                    process(inputs) {
                        const input = inputs[0];
                        if (!input || !input[0]) return true;
                        
                        const channelData = input[0];
                        
                        // Buffer the data
                        for (let i = 0; i < channelData.length; i++) {
                            this.buffer[this.index++] = channelData[i];
                            
                            if (this.index >= this.bufferSize) {
                                this._emitChunk();
                                this.index = 0;
                                
                                // Debug log every ~5 seconds
                                const now = Date.now();
                                if (now - this._lastLog > 5000) {
                                    this.port.postMessage({ type: 'log', message: '[AudioWorklet] Active' });
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
            processorOptions: { inputSampleRate: this.deviceSampleRate, targetSampleRate: this.targetSampleRate },
        });
        this.workletNode.port.onmessage = (event: MessageEvent<any>) => {
            if (event.data?.type === 'audio' && event.data.samples instanceof Float32Array) {
                this.handleAudioChunk(event.data.samples, event.data.maxAbs, event.data.sampleRate);
            } else if (event.data instanceof Float32Array) {
                this.handleAudioChunk(event.data, undefined, this.deviceSampleRate);
            } else if (event.data?.type === 'log') {
                console.log(event.data.message);
            }
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

    /**
     * Reset buffers and VAD state for a new session while keeping the audio graph.
     * Aligns visualization + segment timebase to 0, matching parakeet-ui behavior.
     */
    reset(): void {
        // Reset audio/VAD state
        this.ringBuffer.reset();
        this.audioProcessor.reset();
        this.currentEnergy = 0;

        // Reset metrics
        this.metrics = {
            currentEnergy: 0,
            averageEnergy: 0,
            peakEnergy: 0,
            noiseFloor: 0.01,
            currentSNR: 0,
            isSpeaking: false,
        };

        // Clear segment history used by the visualizer
        this.recentSegments = [];

        // Reset visualization buffer
        if (this.visualizationBuffer) {
            this.visualizationBuffer.fill(0);
        }
        this.visualizationBufferPosition = 0;

        // Reset windowed streaming cursors
        for (const entry of this.windowCallbacks) {
            entry.lastWindowEnd = 0;
        }

        // Push a blank update so UI clears stale waveform/segments
        this.notifyVisualizationUpdate();
    }

    getCurrentEnergy(): number {
        return this.currentEnergy;
    }

    getSignalMetrics(): { noiseFloor: number; snr: number; threshold: number; snrThreshold: number } {
        const stats = this.audioProcessor.getStats();
        return {
            noiseFloor: stats.noiseFloor ?? 0.0001,
            snr: stats.snr ?? 0,
            threshold: this.config.energyThreshold,
            snrThreshold: stats.snrThreshold ?? 3.0
        };
    }

    isSpeechActive(): boolean {
        return this.audioProcessor.getStateInfo().inSpeech;
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
     * Fires every triggerInterval seconds with windowDuration of audio.
     */
    onWindowChunk(
        windowDuration: number,
        overlapDuration: number,
        triggerInterval: number,
        callback: (audio: Float32Array, startTime: number) => void
    ): () => void {
        const entry = {
            windowDuration,
            overlapDuration,
            triggerInterval,
            callback,
            lastWindowEnd: 0, // Will be set on first chunk
        };
        this.windowCallbacks.push(entry);

        return () => {
            this.windowCallbacks = this.windowCallbacks.filter((e) => e !== entry);
        };
    }

    /**
     * Subscribe to every resampled audio chunk (16kHz).
     * Used to feed the continuous mel producer worker.
     * Returns an unsubscribe function.
     */
    onAudioChunk(callback: (chunk: Float32Array) => void): () => void {
        this.audioChunkCallbacks.push(callback);
        return () => {
            this.audioChunkCallbacks = this.audioChunkCallbacks.filter((cb) => cb !== callback);
        };
    }

    updateConfig(config: Partial<AudioEngineConfig>): void {
        this.config = { ...this.config, ...config };

        // Update processor config
        if (config.energyThreshold !== undefined) this.audioProcessor.setThreshold(config.energyThreshold);
        if (config.minSpeechDuration !== undefined) this.audioProcessor.setMinSpeechDuration(config.minSpeechDuration);
        if (config.minSilenceDuration !== undefined) this.audioProcessor.setSilenceLength(config.minSilenceDuration);
        if (config.maxSegmentDuration !== undefined) this.audioProcessor.setMaxSegmentDuration(config.maxSegmentDuration);

        // Advanced VAD updates
        if (config.lookbackDuration !== undefined) this.audioProcessor.setLookbackDuration(config.lookbackDuration);
        if (config.overlapDuration !== undefined) this.audioProcessor.setOverlapDuration(config.overlapDuration);
        if (config.maxSilenceWithinSpeech !== undefined) this.audioProcessor.setMaxSilenceWithinSpeech(config.maxSilenceWithinSpeech);
        if (config.endingSpeechTolerance !== undefined) this.audioProcessor.setEndingSpeechTolerance(config.endingSpeechTolerance);

        if (config.snrThreshold !== undefined) this.audioProcessor.setSnrThreshold(config.snrThreshold);
        if (config.minSnrThreshold !== undefined) this.audioProcessor.setMinSnrThreshold(config.minSnrThreshold);
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

    private handleAudioChunk(rawChunk: Float32Array, precomputedMaxAbs?: number, chunkSampleRate?: number): void {
        // 0. Ensure chunk is at target sample rate (resample only if needed)
        const sampleRate = chunkSampleRate ?? this.targetSampleRate;
        const needsResample = sampleRate !== this.targetSampleRate;
        const chunk = needsResample
            ? resampleLinear(rawChunk, sampleRate, this.targetSampleRate)
            : rawChunk;

        // Calculate chunk energy (Peak Amplitude) + SMA for VAD compatibility
        let maxAbs = (!needsResample && precomputedMaxAbs !== undefined) ? precomputedMaxAbs : 0;
        if (precomputedMaxAbs === undefined || needsResample) {
            for (let i = 0; i < chunk.length; i++) {
                const abs = Math.abs(chunk[i]);
                if (abs > maxAbs) maxAbs = abs;
            }
        }

        // SMA Smoothing (matching Parakeet-UI logic)
        this.energyHistory.push(maxAbs);
        if (this.energyHistory.length > 6) {
            this.energyHistory.shift();
        }
        const energy = this.energyHistory.reduce((a: number, b: number) => a + b, 0) / this.energyHistory.length;

        this.currentEnergy = energy;

        // Log when energy crosses threshold if state is close to changing
        const isSpeech = energy > this.config.energyThreshold;
        const wasSpeaking = this.metrics.isSpeaking;
        if (isSpeech !== wasSpeaking) {
            console.debug(`[AudioEngine] Energy threshold crossed: ${energy.toFixed(6)} > ${this.config.energyThreshold} = ${isSpeech}`);
        }

        // 1. Write to ring buffer before any callbacks can transfer the chunk.
        this.ringBuffer.write(chunk);

        const endFrame = this.ringBuffer.getCurrentFrame();

        // 2. Process VAD on resampled audio
        // The processor uses its own internal history for lookback, but we pull full audio from ring buffer later.
        const currentTime = this.ringBuffer.getCurrentTime();
        const segments = this.audioProcessor.processAudioData(chunk, currentTime, energy);

        // 2.5 Update visualization buffer
        this.updateVisualizationBuffer(chunk);

        // 2.6 Update metrics
        const stats = this.audioProcessor.getStats();
        const stateInfo = this.audioProcessor.getStateInfo();

        this.metrics.currentEnergy = energy;
        this.metrics.averageEnergy = this.metrics.averageEnergy * 0.95 + energy * 0.05;
        this.metrics.peakEnergy = Math.max(this.metrics.peakEnergy * 0.99, energy);
        this.metrics.noiseFloor = stats.noiseFloor ?? 0.01;
        this.metrics.currentSNR = stats.snr ?? 0;
        this.metrics.isSpeaking = stateInfo.inSpeech;

        // Periodic debug log
        if (Math.random() < 0.05) {
            console.debug(`[AudioEngine] Metrics: E=${energy.toFixed(6)}, NF=${this.metrics.noiseFloor.toFixed(6)}, SNR=${this.metrics.currentSNR.toFixed(2)}, Speaking=${this.metrics.isSpeaking}`);
        }

        // 3. Handle segments
        if (segments.length > 0) {
            for (const seg of segments) {
                // Apply lookback and overlap adjustments matching parakeet-ui
                const lookbackDuration = this.config.lookbackDuration ?? 0.120;
                const startTime = Math.max(0, seg.startTime - lookbackDuration);

                // Calculate the sample positions for audio extraction
                const startFrame = Math.round(startTime * this.targetSampleRate);
                const endFrame = Math.round(seg.endTime * this.targetSampleRate);

                // Retrieval with padding (hangover)
                const speechHangover = this.config.speechHangover ?? 0.16;
                const paddedEndFrame = Math.min(
                    this.ringBuffer.getCurrentFrame(),
                    endFrame + Math.round(speechHangover * this.targetSampleRate)
                );

                try {
                    const audioData = this.ringBuffer.read(startFrame, paddedEndFrame);

                    // Calculate precise energy metrics for filtering
                    const metrics = this.calculateSegmentEnergyMetrics(audioData, this.targetSampleRate);

                    // Normalize power to 16kHz equivalent
                    const normalizedPowerAt16k = metrics.averagePower * 16000;
                    const normalizedEnergyIntegralAt16k = normalizedPowerAt16k * metrics.duration;

                    // Adaptive threshold calculation
                    let minEnergyIntegralThreshold = this.config.minEnergyIntegral ?? 22;
                    let minEnergyPerSecondThreshold = this.config.minEnergyPerSecond ?? 5;

                    if (this.config.useAdaptiveEnergyThresholds) {
                        const windowSize = this.config.windowSize ?? Math.round(0.080 * this.targetSampleRate);
                        const normalizedNoiseFloor = windowSize > 0 ? this.metrics.noiseFloor / windowSize : 0;
                        const noiseFloorAt16k = normalizedNoiseFloor * 16000;

                        const adaptiveMinEnergyIntegral = noiseFloorAt16k * (this.config.adaptiveEnergyIntegralFactor ?? 25.0);
                        minEnergyIntegralThreshold = Math.max(this.config.minAdaptiveEnergyIntegral ?? 3, adaptiveMinEnergyIntegral);

                        const adaptiveMinEnergyPerSecond = noiseFloorAt16k * (this.config.adaptiveEnergyPerSecondFactor ?? 10.0);
                        minEnergyPerSecondThreshold = Math.max(this.config.minAdaptiveEnergyPerSecond ?? 1, adaptiveMinEnergyPerSecond);
                    }

                    const isValidSpeech =
                        metrics.duration >= (this.config.minSpeechDuration / 1000) &&
                        normalizedPowerAt16k >= minEnergyPerSecondThreshold &&
                        normalizedEnergyIntegralAt16k >= minEnergyIntegralThreshold;

                    if (isValidSpeech) {
                        const audioSegment: AudioSegment = {
                            startFrame: startFrame,
                            endFrame: paddedEndFrame,
                            duration: metrics.duration,
                            averageEnergy: metrics.averagePower,
                            timestamp: Date.now(),
                        };
                        this.notifySegment(audioSegment);
                    } else {
                        console.log('[AudioEngine] Filtered out noise segment:', {
                            duration: metrics.duration,
                            power: normalizedPowerAt16k,
                            integral: normalizedEnergyIntegralAt16k
                        });
                    }
                } catch (err) {
                    console.warn('[AudioEngine] Failed to extract audio for validation:', err);
                }
            }
        }

        // 6. Fixed-window streaming (v3 token streaming mode)
        this.processWindowCallbacks(endFrame);

        // 7. Notify audio chunk subscribers AFTER internal processing.
        // Callbacks may transfer the chunk's buffer; do not use `chunk` after this.
        for (const cb of this.audioChunkCallbacks) {
            cb(chunk);
        }

        // 8. Notify visualization subscribers
        this.notifyVisualizationUpdate();
    }

    /**
     * Helper to read audio from ring buffer and calculate energy metrics for a detected segment.
     */
    private calculateSegmentEnergyMetrics(audioData: Float32Array, sampleRate: number): { averagePower: number; duration: number; numSamples: number } {
        if (!audioData || audioData.length === 0) {
            return { averagePower: 0, duration: 0, numSamples: 0 };
        }

        const numSamples = audioData.length;
        let sumOfSquares = 0;

        for (let i = 0; i < numSamples; i++) {
            sumOfSquares += audioData[i] * audioData[i];
        }

        const duration = numSamples / sampleRate;
        const averagePower = numSamples > 0 ? sumOfSquares / numSamples : 0;

        return {
            averagePower,
            duration,
            numSamples
        };
    }

    /**
     * Process fixed-window callbacks for token streaming mode.
     * Fires when enough audio has accumulated for a new window.
     */
    private processWindowCallbacks(currentFrame: number): void {
        for (const entry of this.windowCallbacks) {
            const windowFrames = Math.floor(entry.windowDuration * this.targetSampleRate);
            const stepFrames = Math.floor(entry.triggerInterval * this.targetSampleRate);

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
        // Track segment for visualization
        this.recentSegments.push({
            startTime: segment.startFrame / this.targetSampleRate,
            endTime: segment.endFrame / this.targetSampleRate,
            isProcessed: false
        });

        // Limit segments count
        if (this.recentSegments.length > this.MAX_SEGMENTS_FOR_VISUALIZATION) {
            this.recentSegments.shift();
        }

        this.segmentCallbacks.forEach((cb) => cb(segment));
    }

    /**
     * Get recent segments for visualization.
     */
    getSegmentsForVisualization(): Array<{ startTime: number; endTime: number; isProcessed: boolean }> {
        const segments = [...this.recentSegments];

        // Add pending segment if speech is currently active
        const vadState = this.audioProcessor.getStateInfo();
        if (vadState.inSpeech && vadState.speechStartTime !== null) {
            segments.push({
                startTime: vadState.speechStartTime,
                endTime: this.ringBuffer.getCurrentTime(),
                isProcessed: false // Pending
            });
        }

        return segments;
    }

    /**
     * Mark a segment as processed (for visualization color coding).
     */
    markSegmentProcessed(startTime: number): void {
        const segment = this.recentSegments.find(s => Math.abs(s.startTime - startTime) < 0.1);
        if (segment) {
            segment.isProcessed = true;
        }
    }

    /**
     * Update the visualization buffer and summary with new audio data.
     */
    private updateVisualizationBuffer(chunk: Float32Array): void {
        if (!this.visualizationBuffer || !this.visualizationSummary) return;

        const chunkLength = chunk.length;
        const bufferLength = this.visualizationBufferSize;

        // 1. Update raw circular buffer
        if (chunkLength >= bufferLength) {
            this.visualizationBuffer.set(chunk.subarray(chunkLength - bufferLength));
            this.visualizationBufferPosition = 0;
        } else {
            const endPosition = this.visualizationBufferPosition + chunkLength;
            if (endPosition <= bufferLength) {
                this.visualizationBuffer.set(chunk, this.visualizationBufferPosition);
                this.visualizationBufferPosition = endPosition % bufferLength;
            } else {
                const firstPart = bufferLength - this.visualizationBufferPosition;
                this.visualizationBuffer.set(chunk.subarray(0, firstPart), this.visualizationBufferPosition);
                this.visualizationBuffer.set(chunk.subarray(firstPart), 0);
                this.visualizationBufferPosition = (chunkLength - firstPart) % bufferLength;
            }
        }

        // 2. Update summary buffer (Low-res min/max pairs)
        // Each point in VIS_SUMMARY_SIZE represents bufferLength / VIS_SUMMARY_SIZE samples
        const samplesPerPoint = bufferLength / this.VIS_SUMMARY_SIZE;
        const numNewPoints = Math.round(chunkLength / samplesPerPoint);

        for (let i = 0; i < numNewPoints; i++) {
            const start = Math.floor(i * samplesPerPoint);
            const end = Math.min(chunkLength, Math.floor((i + 1) * samplesPerPoint));
            if (start >= end) continue;

            let min = chunk[start];
            let max = chunk[start];
            for (let s = start + 1; s < end; s++) {
                const v = chunk[s];
                if (v < min) min = v;
                if (v > max) max = v;
            }

            // Write to circular summary
            const targetIdx = this.visualizationSummaryPosition * 2;
            this.visualizationSummary[targetIdx] = min;
            this.visualizationSummary[targetIdx + 1] = max;
            this.visualizationSummaryPosition = (this.visualizationSummaryPosition + 1) % this.VIS_SUMMARY_SIZE;
        }
    }

    /**
     * Get visualization data subsampled to fit the target width.
     * Returns min/max pairs for each pixel to preserve peaks in the waveform.
     * Zero-allocation except for the returned result.
     * @param targetWidth - The desired number of data points (e.g., canvas width).
     * @returns Float32Array containing alternating min/max values, length targetWidth * 2.
     */
    getVisualizationData(targetWidth: number): Float32Array {
        if (!this.visualizationSummary || !targetWidth || targetWidth <= 0) {
            return new Float32Array(0);
        }

        // If targetWidth is close to or less than our summary size, use the summary (MUCH faster)
        if (targetWidth <= this.VIS_SUMMARY_SIZE) {
            const subsampledBuffer = new Float32Array(targetWidth * 2);
            const samplesPerTarget = this.VIS_SUMMARY_SIZE / targetWidth;

            for (let i = 0; i < targetWidth; i++) {
                const rangeStart = i * samplesPerTarget;
                const rangeEnd = (i + 1) * samplesPerTarget;

                let minVal = 0;
                let maxVal = 0;
                let first = true;

                for (let s = Math.floor(rangeStart); s < Math.floor(rangeEnd); s++) {
                    const idx = ((this.visualizationSummaryPosition + s) % this.VIS_SUMMARY_SIZE) * 2;
                    const vMin = this.visualizationSummary[idx];
                    const vMax = this.visualizationSummary[idx + 1];

                    if (first) {
                        minVal = vMin;
                        maxVal = vMax;
                        first = false;
                    } else {
                        if (vMin < minVal) minVal = vMin;
                        if (vMax > maxVal) maxVal = vMax;
                    }
                }

                subsampledBuffer[i * 2] = minVal;
                subsampledBuffer[i * 2 + 1] = maxVal;
            }
            return subsampledBuffer;
        }

        return this.getVisualizationDataFromRaw(targetWidth);
    }

    private getVisualizationDataFromRaw(targetWidth: number): Float32Array {
        if (!this.visualizationBuffer) return new Float32Array(0);
        const buffer = this.visualizationBuffer;
        const bufferLength = this.visualizationBufferSize;
        const pos = this.visualizationBufferPosition;
        const samplesPerPoint = bufferLength / targetWidth;
        const subsampledBuffer = new Float32Array(targetWidth * 2);

        // Logical index s maps to physical index:
        // if s < wrapS: pos + s
        // else: s - wrapS (which is s - (bufferLength - pos) = s + pos - bufferLength)
        const wrapS = bufferLength - pos;

        for (let i = 0; i < targetWidth; i++) {
            const startS = Math.floor(i * samplesPerPoint);
            const endS = Math.floor((i + 1) * samplesPerPoint);

            let minVal = 0;
            let maxVal = 0;
            let first = true;

            // Part 1: Before wrap (Logical indices < wrapS)
            // Physical indices: pos + s
            const end1 = (endS < wrapS) ? endS : wrapS;
            if (startS < end1) {
                let p = pos + startS;
                const pEnd = pos + end1;

                if (first && p < pEnd) {
                    const val = buffer[p];
                    minVal = val;
                    maxVal = val;
                    first = false;
                    p++;
                }

                for (; p < pEnd; p++) {
                    const val = buffer[p];
                    if (val < minVal) minVal = val;
                    else if (val > maxVal) maxVal = val;
                }
            }

            // Part 2: After wrap (Logical indices >= wrapS)
            // Physical indices: s - wrapS
            const start2 = (startS > wrapS) ? startS : wrapS;
            if (start2 < endS) {
                let p = start2 - wrapS;
                const pEnd = endS - wrapS;

                if (first && p < pEnd) {
                    const val = buffer[p];
                    minVal = val;
                    maxVal = val;
                    first = false;
                    p++;
                }

                for (; p < pEnd; p++) {
                    const val = buffer[p];
                    if (val < minVal) minVal = val;
                    else if (val > maxVal) maxVal = val;
                }
            }

            subsampledBuffer[i * 2] = minVal;
            subsampledBuffer[i * 2 + 1] = maxVal;
        }
        return subsampledBuffer;
    }


    /**
     * Get current audio metrics for UI visualization.
     */
    getMetrics(): AudioMetrics {
        return { ...this.metrics };
    }

    /**
     * Get current time in seconds (for waveform time markers).
     */
    getCurrentTime(): number {
        return this.ringBuffer.getCurrentTime();
    }

    /**
     * Get the visualization buffer duration in seconds.
     */
    getVisualizationDuration(): number {
        return VISUALIZATION_BUFFER_DURATION;
    }

    /**
     * Subscribe to visualization updates.
     * Callback is invoked after each audio chunk is processed.
     */
    onVisualizationUpdate(callback: (data: Float32Array, metrics: AudioMetrics, bufferEndTime: number) => void): () => void {
        this.visualizationCallbacks.push(callback);
        return () => {
            this.visualizationCallbacks = this.visualizationCallbacks.filter((cb) => cb !== callback);
        };
    }

    /**
     * Notify visualization subscribers with updated data.
     * Throttled to ~30fps to avoid UI stuttering.
     */
    private notifyVisualizationUpdate(): void {
        const now = performance.now();
        if (now - this.lastVisualizationNotifyTime < this.VISUALIZATION_NOTIFY_INTERVAL_MS) {
            return;
        }
        this.lastVisualizationNotifyTime = now;

        const data = this.getVisualizationData(400); // 400 points is enough for modern displays and saves CPU
        const bufferEndTime = this.ringBuffer.getCurrentTime();
        this.visualizationCallbacks.forEach((cb) => cb(data, this.getMetrics(), bufferEndTime));
    }
}
