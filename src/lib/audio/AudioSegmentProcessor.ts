/**
 * BoncukJS - Audio Segment Processor
 * Ported from parakeet-ui/AudioSegmentProcessor.js
 * 
 * Sophisticated VAD-based segment processor with:
 * - Speech onset detection with lookback
 * - Rising energy trend analysis
 * - Adaptive noise floor tracking
 * - SNR-based speech detection
 * - Proactive segment splitting for long utterances
 */

import { defaultAudioParams, windowDuration as DEFAULT_WINDOW_DURATION } from './audioParams';

/** Chunk metadata for speech tracking */
interface ChunkInfo {
    time: number;
    energy: number;
    isSpeech: boolean;
    snr: number;
}

/** Speech/silence statistics */
interface SegmentStats {
    startTime: number;
    endTime: number;
    duration: number;
    avgEnergy: number;
    energyIntegral: number;
}

/** Statistics summary */
interface StatsSummary {
    avgDuration: number;
    avgEnergy: number;
    avgEnergyIntegral: number;
}

/** Current stats snapshot */
interface CurrentStats {
    silence: StatsSummary;
    speech: StatsSummary;
    noiseFloor: number;
    snr: number;
    snrThreshold: number;
    minSnrThreshold: number;
    energyRiseThreshold: number;
}

/** Processor state */
interface ProcessorState {
    inSpeech: boolean;
    speechStartTime: number | null;
    silenceStartTime: number | null;
    silenceCounter: number;
    recentChunks: ChunkInfo[];
    speechEnergies: number[];
    silenceEnergies: number[];
    speechStats: SegmentStats[];
    silenceStats: SegmentStats[];
    currentStats: CurrentStats;
    segmentCounter: number;
    noiseFloor: number;
    recentEnergies: number[];
    silenceDuration: number;
}

/** Segment output */
export interface ProcessedSegment {
    startTime: number;
    endTime: number;
    duration: number;
}

/** Processor configuration */
export interface AudioSegmentProcessorConfig {
    sampleRate: number;
    windowSize: number;
    minSpeechDuration: number;
    silenceThreshold: number;
    energyThreshold: number;
    smaLength: number;
    lookbackChunks: number;
    overlapDuration: number;
    lookbackDuration: number;
    maxHistoryLength: number;
    noiseFloorAdaptationRate: number;
    fastAdaptationRate: number;
    snrThreshold: number;
    minBackgroundDuration: number;
    minSnrThreshold: number;
    energyRiseThreshold: number;
    maxSegmentDuration: number;
    maxSilenceWithinSpeech: number;
    endingSpeechTolerance: number;
    logger?: (message: string, data?: unknown) => void;
}

/**
 * AudioSegmentProcessor - Sophisticated VAD with speech onset detection
 */
export class AudioSegmentProcessor {
    private options: AudioSegmentProcessorConfig;
    private state!: ProcessorState;

    constructor(options: Partial<AudioSegmentProcessorConfig> = {}) {
        const sampleRate = options.sampleRate ?? defaultAudioParams.sampleRate ?? 16000;

        // Calculate window size based on sample rate (80ms window)
        const windowSize = Math.round(DEFAULT_WINDOW_DURATION * sampleRate);

        this.options = {
            sampleRate,

            minSpeechDuration: defaultAudioParams.minSpeechDuration,
            silenceThreshold: defaultAudioParams.silenceLength,
            energyThreshold: defaultAudioParams.audioThreshold,
            smaLength: defaultAudioParams.smaLength,
            lookbackChunks: defaultAudioParams.lookbackChunks,
            overlapDuration: defaultAudioParams.overlapDuration,
            lookbackDuration: defaultAudioParams.lookbackDuration,
            maxHistoryLength: defaultAudioParams.maxHistoryLength,
            noiseFloorAdaptationRate: defaultAudioParams.noiseFloorAdaptationRate,
            fastAdaptationRate: defaultAudioParams.fastAdaptationRate,
            snrThreshold: defaultAudioParams.snrThreshold,
            minBackgroundDuration: defaultAudioParams.minBackgroundDuration,
            minSnrThreshold: defaultAudioParams.minSnrThreshold,
            energyRiseThreshold: defaultAudioParams.energyRiseThreshold,
            maxSegmentDuration: defaultAudioParams.maxSegmentDuration,
            maxSilenceWithinSpeech: defaultAudioParams.maxSilenceWithinSpeech,
            endingSpeechTolerance: defaultAudioParams.endingSpeechTolerance,
            logger: console.log,
            ...options,
            // Ensure windowSize is recalculated if sampleRate was overridden
            windowSize: Math.round(DEFAULT_WINDOW_DURATION * (options.sampleRate ?? sampleRate))
        };

        this.log('Initialized AudioSegmentProcessor', {
            sampleRate: this.options.sampleRate,
            windowSize: this.options.windowSize,
            lookbackDuration: this.options.lookbackDuration,
            overlapDuration: this.options.overlapDuration,
            snrThreshold: this.options.snrThreshold,
            minSnrThreshold: this.options.minSnrThreshold
        });

        this.reset();
    }

    private log(message: string, data?: unknown): void {
        if (typeof this.options.logger === 'function') {
            this.options.logger(`[AudioSegmentProcessor] ${message}`, data);
        }
    }

    /**
     * Process an audio chunk and return any detected segments.
     */
    processAudioData(
        chunk: Float32Array,
        currentTime: number,
        energy: number
    ): ProcessedSegment[] {
        if (!chunk || !chunk.length) return [];

        const segments: ProcessedSegment[] = [];
        const isSpeech = energy > this.options.energyThreshold;

        // Update silence duration tracking
        if (!isSpeech) {
            const chunkDurationSec = chunk.length / this.options.sampleRate;
            this.state.silenceDuration += chunkDurationSec;
        } else {
            this.state.silenceDuration = 0;
        }

        // Update noise floor and calculate SNR
        this.updateNoiseFloor(energy, isSpeech);
        const snr = this.calculateSNR(energy);

        // Track recent chunks for lookback
        this.state.recentChunks.push({
            time: currentTime,
            energy,
            isSpeech,
            snr
        });

        if (this.state.recentChunks.length > this.options.maxHistoryLength * 10) {
            this.state.recentChunks.shift();
        }

        // --- Proactive Segment Splitting ---
        if (this.state.inSpeech && this.state.speechStartTime !== null) {
            const currentSpeechDuration = currentTime - this.state.speechStartTime;
            if (currentSpeechDuration > this.options.maxSegmentDuration) {
                this.log('Splitting long segment', {
                    startTime: this.state.speechStartTime.toFixed(2),
                    splitTime: currentTime.toFixed(2),
                    duration: currentSpeechDuration.toFixed(2)
                });

                const segment = this.createSegment(this.state.speechStartTime, currentTime);
                if (segment) {
                    segments.push(segment);
                }

                // Start new segment immediately
                this.startSpeech(currentTime, energy);
            }
        }

        // --- Speech State Machine ---
        if (!this.state.inSpeech && isSpeech) {
            // Transition: Silence -> Speech
            const realStartIndex = this.findSpeechStart();
            const realStartTime = realStartIndex !== -1
                ? this.state.recentChunks[realStartIndex].time
                : currentTime;

            this.startSpeech(realStartTime, energy);

            this.log('Speech start detected', {
                detectedAt: currentTime.toFixed(2),
                actualStart: realStartTime.toFixed(2),
                lookbackDiff: (currentTime - realStartTime).toFixed(2),
                snr: snr.toFixed(2),
                noiseFloor: this.state.noiseFloor.toFixed(6)
            });
        } else if (this.state.inSpeech && !isSpeech) {
            // Transition: Speech -> potentially Silence
            this.state.silenceCounter++;

            const chunksNeeded = Math.ceil(this.options.silenceThreshold / (this.options.windowSize / this.options.sampleRate));

            if (this.state.silenceCounter % 5 === 0) {
                this.log('Silence progressing', {
                    counter: this.state.silenceCounter,
                    needed: chunksNeeded,
                    energy: energy.toFixed(6),
                    snr: snr.toFixed(2)
                });
            }

            // Implement ending speech tolerance and max silence within speech
            const silenceDuration = this.state.silenceCounter * (this.options.windowSize / this.options.sampleRate);
            const isConfirmedSilence = this.state.silenceCounter >= chunksNeeded;

            // Check if we should allow some silence within speech
            if (silenceDuration < this.options.maxSilenceWithinSpeech) {
                // Not yet enough silence to consider it a break
                this.state.speechEnergies.push(energy);
            } else if (isConfirmedSilence) {
                // Confirmed silence - end speech segment
                if (this.state.speechStartTime !== null) {
                    const speechDuration = currentTime - this.state.speechStartTime;
                    const avgEnergy = this.state.speechEnergies.length > 0
                        ? this.state.speechEnergies.reduce((a, b) => a + b, 0) / this.state.speechEnergies.length
                        : 0;

                    this.state.speechStats.push({
                        startTime: this.state.speechStartTime,
                        endTime: currentTime,
                        duration: speechDuration,
                        avgEnergy,
                        energyIntegral: avgEnergy * speechDuration
                    });

                    if (this.state.speechStats.length > this.options.maxHistoryLength) {
                        this.state.speechStats.shift();
                    }
                }

                const segment = this.createSegment(this.state.speechStartTime!, currentTime);
                if (segment) {
                    segments.push(segment);
                }

                this.startSilence(currentTime);
            } else {
                // Accumulate silence energies while deciding
                this.state.silenceEnergies.push(energy);
            }
        } else {
            // Continue in current state
            if (this.state.inSpeech) {
                this.state.speechEnergies.push(energy);
            } else {
                this.state.silenceEnergies.push(energy);
            }
        }

        this.updateStats();

        return segments;
    }

    /**
     * Update noise floor using adaptive exponential moving average.
     */
    private updateNoiseFloor(energy: number, isSpeech: boolean): void {
        if (!isSpeech) {
            // Blend between fast and normal adaptation rates based on silence duration
            let adaptationRate = this.options.noiseFloorAdaptationRate;

            if (this.state.silenceDuration < this.options.minBackgroundDuration) {
                const blendFactor = Math.min(1, this.state.silenceDuration / this.options.minBackgroundDuration);
                adaptationRate = this.options.fastAdaptationRate * (1 - blendFactor) +
                    this.options.noiseFloorAdaptationRate * blendFactor;
            }

            // Exponential moving average for noise floor tracking
            this.state.noiseFloor = this.state.noiseFloor * (1 - adaptationRate) + energy * adaptationRate;
            this.state.noiseFloor = Math.max(0.00001, this.state.noiseFloor);
        }

        // Track recent energies for analysis
        this.state.recentEnergies.push(energy);
        if (this.state.recentEnergies.length > 50) {
            this.state.recentEnergies.shift();
        }
    }

    /**
     * Calculate Signal-to-Noise Ratio in dB.
     */
    private calculateSNR(energy: number): number {
        const noiseFloor = Math.max(0.0001, this.state.noiseFloor);
        return 10 * Math.log10(energy / noiseFloor);
    }

    /**
     * Start tracking a new speech segment.
     */
    private startSpeech(time: number, energy: number): void {
        this.state.inSpeech = true;
        this.state.speechStartTime = time;
        this.state.silenceCounter = 0;
        this.state.speechEnergies = [energy];
        this.state.silenceStartTime = null;
        this.state.silenceDuration = 0;

        const snr = this.calculateSNR(energy);
        this.log('Speech state started', {
            time: time.toFixed(2),
            energy: energy.toFixed(6),
            snr: snr.toFixed(2),
            noiseFloor: this.state.noiseFloor.toFixed(6)
        });
    }

    /**
     * Transition to silence state.
     */
    private startSilence(time: number): void {
        this.state.inSpeech = false;
        this.state.silenceStartTime = time;
        this.state.speechStartTime = null;
        this.state.silenceCounter = 0;
        this.state.silenceEnergies = [];
        this.state.silenceDuration = 0.001; // Avoid division by zero

        this.log('Silence state started', {
            time: time.toFixed(2),
            noiseFloor: this.state.noiseFloor.toFixed(6)
        });
    }

    /**
     * Find the actual speech start using lookback and energy trend analysis.
     */
    private findSpeechStart(): number {
        const chunks = this.state.recentChunks;
        const minSnrThreshold = this.options.minSnrThreshold;

        // Find the most recent speech chunk
        let firstSpeechIndex = 0;
        for (let i = chunks.length - 1; i >= 0; i--) {
            if (chunks[i].isSpeech) {
                firstSpeechIndex = i;
                break;
            }
        }

        // Look for the earliest point where energy starts rising towards speech
        let earliestRisingIndex = firstSpeechIndex;
        let foundRisingTrend = false;

        for (let i = firstSpeechIndex - 1; i >= 0; i--) {
            // Check for rising energy trend
            if (i < chunks.length - 1 &&
                chunks[i + 1].energy > chunks[i].energy * (1 + this.options.energyRiseThreshold)) {
                earliestRisingIndex = i;
                foundRisingTrend = true;
            }

            // Stop if SNR drops significantly below threshold
            if (chunks[i].snr < minSnrThreshold / 2) {
                break;
            }

            // Limit lookback to ~500ms (assuming 80ms chunks)
            if (firstSpeechIndex - i > 6) {
                break;
            }
        }

        if (foundRisingTrend) {
            this.log('Found rising energy trend for speech onset', {
                index: earliestRisingIndex,
                time: chunks[earliestRisingIndex].time.toFixed(3),
                energy: chunks[earliestRisingIndex].energy.toFixed(6),
                snr: chunks[earliestRisingIndex].snr.toFixed(2)
            });
            return earliestRisingIndex;
        }

        // Check for SNR crossing
        for (let i = firstSpeechIndex; i >= 0; i--) {
            if (chunks[i].snr < minSnrThreshold) {
                return Math.min(chunks.length - 1, i + 1);
            }
        }

        // Default lookback
        return Math.max(0, firstSpeechIndex - 4);
    }

    /**
     * Create a segment object from start/end times.
     */
    private createSegment(startTime: number, endTime: number): ProcessedSegment | null {
        const duration = endTime - startTime;

        if (duration <= 0) {
            this.log('Skipping segment with zero/negative duration');
            return null;
        }

        return {
            startTime,
            endTime,
            duration
        };
    }

    /**
     * Update internal statistics.
     */
    private updateStats(): void {
        const stats: CurrentStats = {
            silence: { avgDuration: 0, avgEnergy: 0, avgEnergyIntegral: 0 },
            speech: { avgDuration: 0, avgEnergy: 0, avgEnergyIntegral: 0 },
            noiseFloor: this.state.noiseFloor,
            snr: this.state.recentChunks.length > 0
                ? this.state.recentChunks[this.state.recentChunks.length - 1].snr
                : 0,
            snrThreshold: this.options.snrThreshold,
            minSnrThreshold: this.options.minSnrThreshold,
            energyRiseThreshold: this.options.energyRiseThreshold
        };

        if (this.state.silenceStats.length > 0) {
            stats.silence = {
                avgDuration: this.average(this.state.silenceStats.map(s => s.duration)),
                avgEnergy: this.average(this.state.silenceStats.map(s => s.avgEnergy)),
                avgEnergyIntegral: this.average(this.state.silenceStats.map(s => s.energyIntegral))
            };
        }

        if (this.state.speechStats.length > 0) {
            stats.speech = {
                avgDuration: this.average(this.state.speechStats.map(s => s.duration)),
                avgEnergy: this.average(this.state.speechStats.map(s => s.avgEnergy)),
                avgEnergyIntegral: this.average(this.state.speechStats.map(s => s.energyIntegral))
            };
        }

        this.state.currentStats = stats;
    }

    private average(arr: number[]): number {
        if (arr.length === 0) return 0;
        return arr.reduce((a, b) => a + b, 0) / arr.length;
    }

    /**
     * Get current statistics.
     */
    getStats(): CurrentStats {
        return this.state.currentStats;
    }

    /**
     * Get current state info for debugging.
     */
    getStateInfo(): { inSpeech: boolean; noiseFloor: number; snr: number; speechStartTime: number | null } {
        return {
            inSpeech: this.state.inSpeech,
            noiseFloor: this.state.noiseFloor,
            snr: this.state.currentStats.snr,
            speechStartTime: this.state.speechStartTime
        };
    }

    /**
     * Reset all state.
     */
    reset(): void {
        this.state = {
            inSpeech: false,
            speechStartTime: null,
            silenceStartTime: null,
            silenceCounter: 0,
            recentChunks: [],
            speechEnergies: [],
            silenceEnergies: [],
            speechStats: [],
            silenceStats: [],
            currentStats: {
                silence: { avgDuration: 0, avgEnergy: 0, avgEnergyIntegral: 0 },
                speech: { avgDuration: 0, avgEnergy: 0, avgEnergyIntegral: 0 },
                noiseFloor: 0.005,
                snr: 0,
                snrThreshold: this.options.snrThreshold,
                minSnrThreshold: this.options.minSnrThreshold,
                energyRiseThreshold: this.options.energyRiseThreshold
            },
            segmentCounter: 0,
            noiseFloor: 0.005,
            recentEnergies: [],
            silenceDuration: 0
        };
    }

    // ========================================================================
    // Configuration Setters
    // ========================================================================

    setThreshold(threshold: number): void {
        this.options.energyThreshold = threshold;
        this.log('Updated energy threshold', threshold);
    }

    setSilenceLength(length: number): void {
        this.options.silenceThreshold = length;
        this.log('Updated silence threshold', length);
    }

    setLookbackDuration(duration: number): void {
        this.options.lookbackDuration = duration;
        this.log('Updated lookback duration', duration);
    }

    setOverlapDuration(duration: number): void {
        this.options.overlapDuration = duration;
        this.log('Updated overlap duration', duration);
    }

    setSnrThreshold(threshold: number): void {
        this.options.snrThreshold = threshold;
        this.log('Updated SNR threshold', threshold);
    }

    setMinSnrThreshold(threshold: number): void {
        this.options.minSnrThreshold = threshold;
        this.log('Updated minimum SNR threshold', threshold);
    }

    setNoiseFloorAdaptationRate(rate: number): void {
        this.options.noiseFloorAdaptationRate = rate;
        this.log('Updated noise floor adaptation rate', rate);
    }

    setFastAdaptationRate(rate: number): void {
        this.options.fastAdaptationRate = rate;
        this.log('Updated fast adaptation rate', rate);
    }

    setEnergyRiseThreshold(threshold: number): void {
        this.options.energyRiseThreshold = threshold;
        this.log('Updated energy rise threshold', threshold);
    }

    setMinBackgroundDuration(duration: number): void {
        this.options.minBackgroundDuration = duration;
        this.log('Updated minimum background duration', duration);
    }

    setMaxSegmentDuration(duration: number): void {
        this.options.maxSegmentDuration = duration;
        this.log('Updated maximum segment duration', duration);
    }

    setMinSpeechDuration(duration: number): void {
        this.options.minSpeechDuration = duration;
        this.log('Updated minimum speech duration', duration);
    }

    setMaxSilenceWithinSpeech(duration: number): void {
        this.options.maxSilenceWithinSpeech = duration;
        this.log('Updated max silence within speech', duration);
    }

    setEndingSpeechTolerance(duration: number): void {
        this.options.endingSpeechTolerance = duration;
        this.log('Updated ending speech tolerance', duration);
    }
}
