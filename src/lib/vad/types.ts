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
    /** Current estimated noise floor */
    noiseFloor?: number;
    /** Current Signal-to-Noise Ratio in dB */
    snr?: number;
}

/**
 * Configuration for Silero VAD ONNX model
 */
export interface SileroVADConfig {
    /** URL or path to the Silero VAD ONNX model file */
    modelUrl: string;
    /** Speech probability threshold (default: 0.5) */
    threshold: number;
    /** Negative threshold for speech offset (default: threshold - 0.15) */
    negThreshold: number;
    /** Sample rate in Hz. Silero supports 8000 or 16000 (default: 16000) */
    sampleRate: 8000 | 16000;
}

/**
 * Result of a Silero VAD processing step
 */
export interface SileroVADResult {
    /** Speech probability from the neural network (0-1) */
    probability: number;
    /** Whether the probability exceeds the threshold */
    isSpeech: boolean;
    /** Timestamp of the result */
    timestamp: number;
}

/**
 * Hybrid VAD states
 */
export type HybridVADState =
    | 'silence'
    | 'speech_candidate'
    | 'speech_confirmed'
    | 'speech_ending'
    ;

/**
 * Configuration for HybridVAD
 */
export interface HybridVADConfig {
    /** Energy VAD configuration */
    energyConfig?: Partial<EnergyVADConfig>;
    /** Silero VAD configuration */
    sileroConfig?: Partial<SileroVADConfig>;
    /** Silero speech probability threshold (default: 0.5) */
    sileroThreshold: number;
    /** Number of consecutive Silero confirmations needed for speech onset (default: 2) */
    onsetConfirmations: number;
    /** Number of consecutive Silero non-speech results needed for speech offset (default: 3) */
    offsetConfirmations: number;
    /** Sample rate (default: 16000) */
    sampleRate: number;
}

/**
 * Result of a HybridVAD processing step
 */
export interface HybridVADResult {
    /** Whether speech is currently detected */
    isSpeech: boolean;
    /** Current state of the hybrid state machine */
    state: HybridVADState;
    /** RMS energy from EnergyVAD */
    energy: number;
    /** Silero speech probability (undefined if Silero was skipped) */
    sileroProbability?: number;
    /** Timestamp of the result */
    timestamp: number;
    /** If speech just started (confirmed by Silero) */
    speechStart?: boolean;
    /** If speech just ended (confirmed by Silero) */
    speechEnd?: boolean;
    /** SNR from EnergyVAD */
    snr?: number;
    /** Noise floor from EnergyVAD */
    noiseFloor?: number;
}
