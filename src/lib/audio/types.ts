/**
 * Audio metrics for UI visualization
 */
export interface AudioMetrics {
    /** Current energy level of the audio */
    currentEnergy: number;
    /** Smoothed average energy */
    averageEnergy: number;
    /** Peak energy level (with decay) */
    peakEnergy: number;
    /** Estimated noise floor */
    noiseFloor: number;
    /** Signal-to-noise ratio in dB */
    currentSNR: number;
    /** Whether speech is currently detected */
    isSpeaking: boolean;
}

/**
 * Configuration for the AudioEngine
 */
export interface AudioEngineConfig {
    /** Target sample rate (default: 16000 Hz for Parakeet) */
    sampleRate: number;
    /** Ring buffer duration in seconds (default: 120) */
    bufferDuration: number;
    /** Energy threshold for speech detection (0.0-1.0, default: 0.02) */
    energyThreshold: number;
    /** Minimum speech duration in ms to avoid clicks (default: 100) */
    minSpeechDuration: number;
    /** Minimum silence duration to end segment (default: 100ms for fast triggering) */
    minSilenceDuration: number;
    /** Max segment duration in seconds - splits long utterances for faster streaming (default: 3.0s) */
    maxSegmentDuration: number;
    /** Preferred device ID (optional) */
    deviceId?: string;

    // Advanced VAD properties matching parakeet-ui
    lookbackDuration?: number;
    overlapDuration?: number;
    speechHangover?: number;
    minEnergyIntegral?: number;
    minEnergyPerSecond?: number;
    useAdaptiveEnergyThresholds?: boolean;
    adaptiveEnergyIntegralFactor?: number;
    adaptiveEnergyPerSecondFactor?: number;
    minAdaptiveEnergyIntegral?: number;
    minAdaptiveEnergyPerSecond?: number;
    windowSize?: number;
    maxSilenceWithinSpeech?: number;
    endingSpeechTolerance?: number;
    snrThreshold?: number;
    minSnrThreshold?: number;
}

/**
 * Represents a detected speech segment
 */
export interface AudioSegment {
    /** Global start frame in ring buffer */
    startFrame: number;
    /** Global end frame in ring buffer */
    endFrame: number;
    /** Duration in seconds */
    duration: number;
    /** Average energy level of segment */
    averageEnergy: number;
    /** Timestamp when segment was detected */
    timestamp: number;
}

/**
 * Main audio capture and preprocessing engine
 */
export interface AudioEngine {
    /** Initialize audio context and request microphone */
    init(): Promise<void>;

    /** Start capturing audio */
    start(): Promise<void>;

    /** Stop capturing audio */
    stop(): void;

    /**
     * Reset buffers and VAD state for a new session (keeps audio graph).
     */
    reset(): void;

    /** Get current audio energy level (for visualization) */
    getCurrentEnergy(): number;

    /** Get current signal metrics (noise floor, SNR, thresholds) */
    getSignalMetrics(): { noiseFloor: number; snr: number; threshold: number; snrThreshold: number };

    /** Check if speech is currently detected */
    isSpeechActive(): boolean;

    /** Get ring buffer reference for direct access */
    getRingBuffer(): IRingBuffer;

    /** Subscribe to speech segment events (VAD-based) */
    onSpeechSegment(callback: (segment: AudioSegment) => void): () => void;

    /** 
     * Subscribe to fixed-window chunks for token streaming mode.
     * Fires every triggerInterval seconds with windowDuration of audio.
     * @param windowDuration - Window size in seconds (default 5.0)
     * @param overlapDuration - Overlap with previous window in seconds (default 1.5)
     * @param triggerInterval - How often to fire in seconds (default window - overlap)
     * @param callback - Receives audio samples and window timestamp
     */
    onWindowChunk?(
        windowDuration: number,
        overlapDuration: number,
        triggerInterval: number,
        callback: (audio: Float32Array, startTime: number) => void
    ): () => void;

    /** Update configuration at runtime */
    updateConfig(config: Partial<AudioEngineConfig>): void;

    /** Change active microphone */
    setDevice(deviceId: string): Promise<void>;

    /** Dispose resources */
    dispose(): void;

    /**
     * Get visualization data subsampled to fit the target width.
     * Returns min/max pairs for each pixel to preserve peaks.
     * @param targetWidth - Desired number of data points (canvas width)
     * @returns Float32Array with alternating min/max values
     */
    getVisualizationData(targetWidth: number): Float32Array;

    /**
     * Get current audio metrics for UI visualization.
     */
    getMetrics(): AudioMetrics;

    /**
     * Get current time in seconds (for time markers).
     */
    getCurrentTime(): number;

    /**
     * Get visualization buffer duration in seconds.
     */
    getVisualizationDuration(): number;

    /**
     * Subscribe to visualization updates.
     * Callback is invoked after each audio chunk is processed.
     */
    onVisualizationUpdate(callback: (data: Float32Array, metrics: AudioMetrics, bufferEndTime: number) => void): () => void;

    /**
     * Get recent segments for visualization.
     */
    getSegmentsForVisualization(): Array<{ startTime: number; endTime: number; isProcessed: boolean }>;

    /**
     * Mark a segment as processed (for visualization color coding).
     */
    markSegmentProcessed(startTime: number): void;
}

/**
 * Fixed-size circular buffer for PCM audio samples
 * Addressed via GLOBAL FRAME OFFSETS (0 → ∞)
 */
export interface IRingBuffer {
    /** Sample rate in Hz */
    readonly sampleRate: number;

    /** Maximum capacity in frames */
    readonly maxFrames: number;

    /**
     * Append PCM frames to the buffer
     * @param chunk - Float32Array of mono PCM samples
     */
    write(chunk: Float32Array): void;

    /**
     * Read samples from [startFrame, endFrame)
     * @throws RangeError if data has been overwritten
     */
    read(startFrame: number, endFrame: number): Float32Array;

    /**
     * Read samples from [startFrame, endFrame) into a caller-supplied buffer.
     * Zero-allocation variant of read(). Returns number of samples written.
     * @throws RangeError if data has been overwritten
     */
    readInto?(startFrame: number, endFrame: number, dest: Float32Array): number;

    /** Get global frame offset of the NEXT frame to be written */
    getCurrentFrame(): number;

    /** Get number of valid frames currently in buffer */
    getFillCount(): number;

    /** Get total capacity in frames */
    getSize(): number;

    /** Get current position in seconds */
    getCurrentTime(): number;

    /** Get oldest valid frame offset still in buffer */
    getBaseFrameOffset(): number;

    /** Clear buffer and reset counters */
    reset(): void;
}
