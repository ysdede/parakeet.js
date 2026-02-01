/**
 * Configuration for EnergyVAD
 */
export interface EnergyVADConfig {
    /** RMS energy threshold above which speech is considered active (default: 0.01) */
    energyThreshold: number;
    /** Minimum duration (ms) that energy must stay above threshold to trigger speech (default: 100) */
    minSpeechDuration: number;
    /** Minimum duration (ms) that energy must stay below threshold to end speech (default: 300) */
    minSilenceDuration: number;
    /** Sample rate in Hz (default: 16000) */
    sampleRate: number;
}

/**
 * Result of a VAD processing step
 */
export interface VADResult {
    /** Whether speech is currently detected by the state machine */
    isSpeech: boolean;
    /** Instantaneous RMS energy of the processed chunk */
    energy: number;
    /** Timestamp of the result */
    timestamp: number;
    /** If speech just started on this chunk */
    speechStart?: boolean;
    /** If speech just ended on this chunk */
    speechEnd?: boolean;
}
