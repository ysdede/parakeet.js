/**
 * BoncukJS - Audio Processing Parameters
 * Ported from parakeet-ui/config/audioParams.js
 * 
 * Contains all parameters for Voice Activity Detection (VAD) and segment processing.
 * Values are sample-rate-aligned to ensure exact integer sample counts.
 */

/** Segmentation preset configuration */
export interface SegmentationPreset {
    name: string;
    icon: string;
    speechHangover: number;
    audioThreshold: number;
    silenceLength: number;
}

/** All audio processing parameters */
export interface AudioParams {
    // Basic VAD settings
    audioThreshold: number;
    silenceLength: number;
    speechHangover: number;

    // Advanced VAD settings
    energyScale: number;
    hysteresisRatio: number;
    minSpeechDuration: number;
    maxSilenceWithinSpeech: number;
    endingSpeechTolerance: number;
    endingEnergyThreshold: number;
    minEnergyIntegral: number;
    minEnergyPerSecond: number;

    // Sample-rate-aligned timing parameters
    windowDuration: number;
    lookbackDuration: number;
    overlapDuration: number;

    // Buffer durations
    recentAudioDuration: number;
    visualizationDuration: number;

    // SNR and Noise Floor adaptation settings
    snrThreshold: number;
    minSnrThreshold: number;
    noiseFloorAdaptationRate: number;
    fastAdaptationRate: number;
    minBackgroundDuration: number;
    energyRiseThreshold: number;

    // Processor-specific parameters
    smaLength: number;
    lookbackChunks: number;
    maxHistoryLength: number;
    maxSegmentDuration: number;

    // Adaptive energy threshold settings
    useAdaptiveEnergyThresholds: boolean;
    adaptiveEnergyIntegralFactor: number;
    adaptiveEnergyPerSecondFactor: number;
    minAdaptiveEnergyIntegral: number;
    minAdaptiveEnergyPerSecond: number;

    // Default sample rate
    sampleRate: number;
}

/**
 * Segmentation presets for different use cases
 */
export const segmentationPresets: Record<'fast' | 'medium' | 'slow', SegmentationPreset> = {
    fast: {
        name: 'Fast (Short Segments)',
        icon: 'bolt',
        speechHangover: 0.08,
        audioThreshold: 0.120, // Higher threshold
        silenceLength: 0.1    // Short silence duration (2 windows)
    },
    medium: {
        name: 'Medium (Balanced)',
        icon: 'av_timer',
        speechHangover: 0.16,
        audioThreshold: 0.08,  // Medium threshold
        silenceLength: 0.4    // Medium silence duration (5 windows)
    },
    slow: {
        name: 'Slow (Long Segments)',
        icon: 'hourglass_bottom',
        speechHangover: 0.24,
        audioThreshold: 0.06,  // Lower threshold (original default)
        silenceLength: 1.0    // Long silence duration (10 windows)
    }
};

// ============================================================================
// Default Parameter Values (derived from 'medium' preset)
// ============================================================================

// Basic VAD settings - Derived from 'medium' preset
export const audioThreshold = segmentationPresets.medium.audioThreshold;
export const silenceLength = segmentationPresets.medium.silenceLength;
export const speechHangover = segmentationPresets.medium.speechHangover;

// Advanced VAD settings
export const energyScale = 2.0;              // Scaling factor for energy calculation
export const hysteresisRatio = 1.2;          // Hysteresis ratio for threshold comparison
export const minSpeechDuration = 0.240;      // 240ms minimum speech duration (3 * 80ms)
export const maxSilenceWithinSpeech = 0.160; // 160ms max silence within speech (2 * 80ms)
export const endingSpeechTolerance = 0.240;  // 240ms tolerance for ending speech
export const endingEnergyThreshold = 0.600;  // Threshold multiplier for ending speech detection
export const minEnergyIntegral = 22;         // Minimum energy integral for speech detection
export const minEnergyPerSecond = 5;         // Minimum energy per second for speech detection

// Adaptive energy threshold settings
export const useAdaptiveEnergyThresholds = true;
export const adaptiveEnergyIntegralFactor = 25.0;  // Multiplier for noise floor to get integral threshold
export const adaptiveEnergyPerSecondFactor = 10.0; // Multiplier for noise floor to get per-second threshold
export const minAdaptiveEnergyIntegral = 3;        // Floor for the adaptive threshold
export const minAdaptiveEnergyPerSecond = 1;       // Floor for the adaptive threshold

// Sample-rate-aligned timing parameters
export const windowDuration = 0.080;     // 80ms window - Perfectly divisible by common sample rates
export const lookbackDuration = 0.120;   // 120ms lookback - Perfectly divisible by common sample rates
export const overlapDuration = 0.080;    // 80ms overlap - Perfectly divisible by common sample rates

// Buffer durations
export const recentAudioDuration = 3.0;      // 3 seconds of recent audio storage
export const visualizationDuration = 30.0;   // 30 seconds of visualization buffer

// SNR and Noise Floor adaptation settings
export const snrThreshold = 3.0;                   // SNR threshold in dB for speech detection
export const minSnrThreshold = 1.0;                // Minimum SNR threshold for low energy speech
export const noiseFloorAdaptationRate = 0.05;      // Standard adaptation rate for noise floor (0-1)
export const fastAdaptationRate = 0.15;            // Fast adaptation rate for initial calibration
export const minBackgroundDuration = 1.0;          // Minimum silence duration to be "background" for fast adaptation
export const energyRiseThreshold = 0.08;           // Threshold for detecting rising energy trend

// Processor-specific parameters
export const smaLength = 6;                  // Length of Simple Moving Average for energy smoothing
export const lookbackChunks = 3;             // Number of chunks to look back for speech start
export const maxHistoryLength = 20;          // Max length for storing speech/silence stats history
export const maxSegmentDuration = 4.8;       // Automatically split segments longer than this (seconds)
export const sampleRate = 16000;             // Default sample rate for Parakeet models

/**
 * Get sample counts for different parameters at a given sample rate
 */
export function getSampleCounts(sampleRate: number): {
    windowSamples: number;
    lookbackSamples: number;
    overlapSamples: number;
    recentAudioSamples: number;
    visualizationSamples: number;
    minSpeechSamples: number;
    silenceSamples: number;
} {
    return {
        windowSamples: Math.round(windowDuration * sampleRate),
        lookbackSamples: Math.round(lookbackDuration * sampleRate),
        overlapSamples: Math.round(overlapDuration * sampleRate),
        recentAudioSamples: Math.round(recentAudioDuration * sampleRate),
        visualizationSamples: Math.round(visualizationDuration * sampleRate),
        minSpeechSamples: Math.round(minSpeechDuration * sampleRate),
        silenceSamples: Math.round(silenceLength * sampleRate)
    };
}

/**
 * Default audio parameters object
 */
export const defaultAudioParams: AudioParams = {
    audioThreshold,
    silenceLength,
    speechHangover,
    energyScale,
    hysteresisRatio,
    minSpeechDuration,
    maxSilenceWithinSpeech,
    endingSpeechTolerance,
    endingEnergyThreshold,
    minEnergyIntegral,
    minEnergyPerSecond,
    windowDuration,
    lookbackDuration,
    overlapDuration,
    recentAudioDuration,
    visualizationDuration,
    snrThreshold,
    minSnrThreshold,
    noiseFloorAdaptationRate,
    fastAdaptationRate,
    minBackgroundDuration,
    energyRiseThreshold,
    smaLength,
    lookbackChunks,
    maxHistoryLength,
    maxSegmentDuration,
    useAdaptiveEnergyThresholds,
    adaptiveEnergyIntegralFactor,
    adaptiveEnergyPerSecondFactor,
    minAdaptiveEnergyIntegral,
    minAdaptiveEnergyPerSecond,
    sampleRate
};

export default defaultAudioParams;
