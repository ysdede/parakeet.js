import { AudioEngine as IAudioEngine, AudioEngineConfig, AudioSegment, IRingBuffer, AudioMetrics } from './types';
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

/** Duration of the visualization buffer in seconds */
const VISUALIZATION_BUFFER_DURATION = 30;

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

    // Visualization buffer (separate from ring buffer for efficient min/max subsampling)
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
    private visualizationCallbacks: Array<(data: Float32Array, metrics: AudioMetrics) => void> = [];

    // Recent segments for visualization (stores timing info only)
    private recentSegments: Array<{ startTime: number; endTime: number; isProcessed: boolean }> = [];
    private readonly MAX_SEGMENTS_FOR_VISUALIZATION = 50;

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

        // Initialize visualization buffer (30 seconds at target sample rate)
        this.visualizationBufferSize = Math.round(this.targetSampleRate * VISUALIZATION_BUFFER_DURATION);
        this.visualizationBuffer = new Float32Array(this.visualizationBufferSize);
        this.visualizationBufferPosition = 0;
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

        // 2.5 Update visualization buffer
        this.updateVisualizationBuffer(chunk);

        // 2.6 Update metrics
        this.metrics.currentEnergy = vadResult.energy;
        this.metrics.averageEnergy = this.metrics.averageEnergy * 0.95 + vadResult.energy * 0.05;
        this.metrics.peakEnergy = Math.max(this.metrics.peakEnergy * 0.99, vadResult.energy);
        this.metrics.noiseFloor = vadResult.noiseFloor ?? this.metrics.noiseFloor;
        this.metrics.currentSNR = vadResult.snr ?? this.metrics.currentSNR;
        this.metrics.isSpeaking = vadResult.isSpeech;

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

        // 7. Notify visualization subscribers
        this.notifyVisualizationUpdate();
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
        return [...this.recentSegments];
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
     * Update the visualization buffer with new audio data.
     * This is a circular buffer that stores the most recent VISUALIZATION_BUFFER_DURATION seconds.
     */
    private updateVisualizationBuffer(chunk: Float32Array): void {
        if (!this.visualizationBuffer) return;

        const chunkLength = chunk.length;
        const bufferLength = this.visualizationBufferSize;

        // If chunk is larger than buffer, only take the last portion
        if (chunkLength >= bufferLength) {
            this.visualizationBuffer.set(chunk.subarray(chunkLength - bufferLength));
            this.visualizationBufferPosition = 0;
            return;
        }

        // Calculate where to write the new chunk
        const endPosition = this.visualizationBufferPosition + chunkLength;
        if (endPosition <= bufferLength) {
            // Simple case: just write the chunk
            this.visualizationBuffer.set(chunk, this.visualizationBufferPosition);
            this.visualizationBufferPosition = endPosition;
        } else {
            // Split case: wrap around the buffer
            const firstPart = bufferLength - this.visualizationBufferPosition;
            const secondPart = chunkLength - firstPart;

            // Write first part at current position
            this.visualizationBuffer.set(chunk.subarray(0, firstPart), this.visualizationBufferPosition);

            // Write second part at beginning
            this.visualizationBuffer.set(chunk.subarray(firstPart), 0);

            this.visualizationBufferPosition = secondPart;
        }
    }

    /**
     * Get visualization data subsampled to fit the target width.
     * Returns min/max pairs for each pixel to preserve peaks in the waveform.
     * @param targetWidth - The desired number of data points (e.g., canvas width).
     * @returns Float32Array containing alternating min/max values, length targetWidth * 2.
     */
    getVisualizationData(targetWidth: number): Float32Array {
        if (!this.visualizationBuffer || !targetWidth || targetWidth <= 0) {
            return new Float32Array(0);
        }

        const bufferLength = this.visualizationBufferSize;
        if (bufferLength === 0) return new Float32Array(0);

        // Arrange the circular buffer into chronological order
        const orderedBuffer = new Float32Array(bufferLength);
        const pos = this.visualizationBufferPosition;
        orderedBuffer.set(this.visualizationBuffer.subarray(pos), 0);
        orderedBuffer.set(this.visualizationBuffer.subarray(0, pos), bufferLength - pos);

        // Determine samples per point/pixel
        const numPoints = Math.floor(targetWidth);
        if (numPoints <= 0) return new Float32Array(0);

        const samplesPerPoint = Math.max(1, Math.floor(bufferLength / numPoints));

        // Create output buffer (2 values per point: min and max)
        const outputNumPoints = Math.floor(bufferLength / samplesPerPoint);
        const subsampledBuffer = new Float32Array(outputNumPoints * 2);

        // Process buffer in chunks and find min/max for each chunk
        let outputIndex = 0;
        for (let i = 0; i < outputNumPoints; i++) {
            const startIndex = i * samplesPerPoint;
            const endIndex = Math.min(startIndex + samplesPerPoint, bufferLength);

            if (startIndex >= endIndex) continue;

            let minVal = orderedBuffer[startIndex];
            let maxVal = orderedBuffer[startIndex];

            for (let j = startIndex + 1; j < endIndex; j++) {
                const val = orderedBuffer[j];
                if (val < minVal) minVal = val;
                if (val > maxVal) maxVal = val;
            }

            // Store min and max for this interval
            subsampledBuffer[outputIndex++] = minVal;
            subsampledBuffer[outputIndex++] = maxVal;
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
    onVisualizationUpdate(callback: (data: Float32Array, metrics: AudioMetrics) => void): () => void {
        this.visualizationCallbacks.push(callback);
        return () => {
            this.visualizationCallbacks = this.visualizationCallbacks.filter((cb) => cb !== callback);
        };
    }

    /**
     * Notify visualization subscribers with updated data.
     */
    private notifyVisualizationUpdate(): void {
        const data = this.getVisualizationData(800); // Default width for subscribers
        this.visualizationCallbacks.forEach((cb) => cb(data, this.getMetrics()));
    }
}
