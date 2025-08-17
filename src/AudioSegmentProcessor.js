import { SpeechSegment } from './SpeechSegment.js';
import audioParams from './config/audioParams.js'; // Import the defaults

export class AudioSegmentProcessor {
    constructor(options = {}) {
        const sampleRate = options.sampleRate;
        if (!sampleRate) {
            console.error('No sample rate provided to AudioSegmentProcessor');
        }

        // Use 80ms for window size - perfectly divisible by common sample rates
        // 16000Hz: 80ms = 1280 samples
        // 22050Hz: 80ms = 1764 samples
        // 48000Hz: 80ms = 3840 samples
        const windowDuration = 0.080; // 80ms window size
        const windowSize = Math.round(windowDuration * (sampleRate || 48000));

        // Set durations that divide evenly with common sample rates:
        // 16000Hz: 125μs per sample (8 samples per ms)
        // 22050Hz: ~45.35μs per sample (22.05 samples per ms)
        // 48000Hz: ~20.83μs per sample (48 samples per ms)
        // 
        // 40ms = 640 samples at 16kHz, 882 at 22.05kHz, 1920 at 48kHz
        // 80ms = 1280 samples at 16kHz, 1764 at 22.05kHz, 3840 at 48kHz
        // Using these durations ensures we get exact integer sample counts

        this.options = {
            // Start with defaults from audioParams.js
            sampleRate: audioParams.sampleRate || 48000, // Note: sampleRate is usually passed in options
            windowSize: windowSize, // Calculated based on sampleRate
            minSpeechDuration: audioParams.minSpeechDuration,
            silenceThreshold: audioParams.silenceLength, // Use silenceLength from config
            energyThreshold: audioParams.audioThreshold,
            smaLength: audioParams.smaLength,
            lookbackChunks: audioParams.lookbackChunks,
            overlapDuration: audioParams.overlapDuration,
            lookbackDuration: audioParams.lookbackDuration,
            maxHistoryLength: audioParams.maxHistoryLength,
            logger: console.log,
            noiseFloorAdaptationRate: audioParams.noiseFloorAdaptationRate,
            fastAdaptationRate: audioParams.fastAdaptationRate,
            snrThreshold: audioParams.snrThreshold,
            minBackgroundDuration: audioParams.minBackgroundDuration,
            minSnrThreshold: audioParams.minSnrThreshold,
            energyRiseThreshold: audioParams.energyRiseThreshold,

            // New parameter for splitting segments
            maxSegmentDuration: audioParams.maxSegmentDuration,

            // Apply overrides from constructor options
            ...options,

            // Ensure windowSize is always based on actual sampleRate (potentially overridden by options)
            windowSize: Math.round(windowDuration * (options.sampleRate || audioParams.sampleRate || 48000))
        };

        this.log('Initialized with sample-rate-aligned durations', {
            sampleRate: this.options.sampleRate,
            windowDuration: windowDuration,
            windowSize: this.options.windowSize,
            lookbackDuration: this.options.lookbackDuration,
            overlapDuration: this.options.overlapDuration,
            // Log SNR-related parameters
            noiseFloorAdaptationRate: this.options.noiseFloorAdaptationRate,
            fastAdaptationRate: this.options.fastAdaptationRate,
            snrThreshold: this.options.snrThreshold,
            minSnrThreshold: this.options.minSnrThreshold
        });

        this.reset();
    }

    log(message, data = null) {
        if (typeof this.options.logger === 'function') {
            this.options.logger(message, data);
        }
    }

    processAudioData(chunk, currentTime, energy, fullAudioBuffer, lastProcessedTime) {
        if (!chunk || !chunk.length) return [];

        const segments = [];
        const isSpeech = energy > this.options.energyThreshold;

        // Update silence duration tracking
        if (!isSpeech) {
            // When in silence, increment silence duration by the chunk duration
            // Assuming 80ms per chunk (or calculate from chunk.length and sampleRate)
            const chunkDurationSec = chunk.length / this.options.sampleRate;
            this.state.silenceDuration += chunkDurationSec;
        } else {
            // Reset silence duration when speech is detected
            this.state.silenceDuration = 0;
        }

        // Update noise floor and calculate SNR
        this.updateNoiseFloor(energy, isSpeech);
        const snr = this.calculateSNR(energy);

        this.state.recentChunks.push({
            time: currentTime,
            energy: energy,
            isSpeech: isSpeech,
            snr: snr
        });

        if (this.state.recentChunks.length > this.options.maxHistoryLength * 10) {
            this.state.recentChunks.shift();
        }

        // --- Proactive Segment Splitting ---
        // If we are in a speech segment and it has exceeded the max duration,
        // split it and start a new one.
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

                // Start a new speech segment immediately at the current time
                this.startSpeech(currentTime, energy);
            }
        }
        // --- End of Proactive Segment Splitting ---

        if (!this.state.inSpeech && isSpeech) {
            let realStartIndex = this.findSpeechStart();
            let realStartTime = realStartIndex !== -1 
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
            this.state.silenceCounter++;
            
            if (this.state.silenceCounter >= (this.options.silenceThreshold * 10)) {
                if (this.state.speechStartTime !== null) {
                    const speechDuration = currentTime - this.state.speechStartTime;
                    const avgEnergy = this.state.speechEnergies.reduce((a, b) => a + b, 0) / 
                                    this.state.speechEnergies.length;

                    this.state.speechStats.push({
                        startTime: this.state.speechStartTime,
                        endTime: currentTime,
                        duration: speechDuration,
                        avgEnergy: avgEnergy,
                        energyIntegral: avgEnergy * speechDuration
                    });

                    if (this.state.speechStats.length > this.options.maxHistoryLength) {
                        this.state.speechStats.shift();
                    }
                }

                const segment = this.createSegment(
                    this.state.speechStartTime,
                    currentTime,
                    fullAudioBuffer,
                    this.options.sampleRate
                );

                if (segment) {
                    segments.push(segment);
                }

                this.startSilence(currentTime);
            }
        } else {
            if (this.state.inSpeech) {
                this.state.speechEnergies.push(energy);
            } else {
                this.state.silenceEnergies.push(energy);
            }
        }

        this.updateStats();

        // Add a small delay to prevent blocking the main thread
        if (segments.length > 0) {
            setTimeout(() => {}, 0);
        }

        return segments;
    }

    // Improved method to update noise floor with faster adaptation
    updateNoiseFloor(energy, isSpeech) {
        // Update noise floor in different scenarios
        if (!isSpeech) {
            // Determine which adaptation rate to use
            let adaptationRate = this.options.noiseFloorAdaptationRate;
            
            // Use faster adaptation in initial calibration phase or for shorter silences
            if (this.state.silenceDuration < this.options.minBackgroundDuration) {
                // Linear blend between fast and normal rates based on silence duration
                const blendFactor = Math.min(1, this.state.silenceDuration / this.options.minBackgroundDuration);
                adaptationRate = this.options.fastAdaptationRate * (1 - blendFactor) + 
                                this.options.noiseFloorAdaptationRate * blendFactor;
            }
            
            // Previous noise floor before update
            const oldNoiseFloor = this.state.noiseFloor;
            
            // Exponential moving average for noise floor tracking
            this.state.noiseFloor = this.state.noiseFloor * (1 - adaptationRate) + 
                                   energy * adaptationRate;
            
            // Ensure noise floor doesn't drop too low
            this.state.noiseFloor = Math.max(0.00001, this.state.noiseFloor);
            
            // Log noise floor updates periodically
            // if (Math.random() < 0.02) { // Log approximately 2% of updates
            //     this.log('Noise floor updated:', {
            //         oldNoiseFloor: oldNoiseFloor.toFixed(6),
            //         newNoiseFloor: this.state.noiseFloor.toFixed(6),
            //         currentEnergy: energy.toFixed(6),
            //         silenceDuration: this.state.silenceDuration.toFixed(2),
            //         adaptationRate: adaptationRate.toFixed(4),
            //         isFastAdaptation: adaptationRate > this.options.noiseFloorAdaptationRate
            //     });
            // }
        }
        
        // Track recent energies for analysis
        this.state.recentEnergies.push(energy);
        if (this.state.recentEnergies.length > 50) { // Keep last ~4 seconds of energy values
            this.state.recentEnergies.shift();
        }
    }

    // New method to calculate SNR
    calculateSNR(energy) {
        const noiseFloor = Math.max(0.0001, this.state.noiseFloor);
        
        // Calculate SNR in dB
        const snrDb = 10 * Math.log10(energy / noiseFloor);
        return snrDb;
    }

    startSpeech(time, energy) {
        this.state.inSpeech = true;
        this.state.speechStartTime = time;
        this.state.silenceCounter = 0;
        this.state.speechEnergies = [energy];
        this.state.silenceStartTime = null;
        // Always reset silence duration when starting speech
        this.state.silenceDuration = 0;
        
        // Log speech start with SNR info
        const snr = this.calculateSNR(energy);
        this.log('Speech state started', {
            time: time.toFixed(2),
            energy: energy.toFixed(6),
            snr: snr.toFixed(2),
            noiseFloor: this.state.noiseFloor.toFixed(6)
        });
    }

    startSilence(time) {
        this.state.inSpeech = false;
        this.state.silenceStartTime = time;
        this.state.speechStartTime = null;
        this.state.silenceCounter = 0;
        this.state.silenceEnergies = [];
        // Initialize silence duration - it will accumulate as we process silence chunks
        this.state.silenceDuration = 0.001; // Start with a tiny value to avoid division by zero
        
        // Log silence start
        this.log('Silence state started', {
            time: time.toFixed(2),
            noiseFloor: this.state.noiseFloor.toFixed(6)
        });
    }

    updateStats() {
        const stats = {
            silence: {
                avgDuration: 0,
                avgEnergy: 0,
                avgEnergyIntegral: 0
            },
            speech: {
                avgDuration: 0,
                avgEnergy: 0,
                avgEnergyIntegral: 0
            },
            // Add SNR and noise floor to stats
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

    average(arr) {
        return arr.reduce((a, b) => a + b, 0) / arr.length;
    }

    getStats() {
        return this.state.currentStats;
    }

    reset() {
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
                speech: { avgDuration: 0, avgEnergy: 0, avgEnergyIntegral: 0 }
            },
            segmentCounter: 0,
            // New state for noise floor tracking
            noiseFloor: 0.005,        // Lower initial noise floor estimate for better sensitivity
            recentEnergies: [],       // Store recent energy values
            silenceDuration: 0,       // Track duration of silence for noise floor adaptation
            energyTrends: []          // Track energy trends for onset detection
        };
    }

    setThreshold(threshold) {
        this.options.energyThreshold = threshold;
        this.log('Updated energy threshold:', threshold);
    }

    setSilenceLength(length) {
        this.options.silenceThreshold = length;
    }

    setLookbackDuration(duration) {
        this.options.lookbackDuration = duration;
        this.log('Updated lookback duration:', duration);
    }

    setOverlapDuration(duration) {
        this.options.overlapDuration = duration;
        this.log('Updated overlap duration:', duration);
    }

    setLookbackChunks(chunks) {
        this.options.lookbackChunks = chunks;
        this.log('Updated lookback chunks:', chunks);
    }

    // New method to set SNR threshold
    setSnrThreshold(threshold) {
        this.options.snrThreshold = threshold;
        this.log('Updated SNR threshold:', threshold);
    }

    // New method to set minimum SNR threshold
    setMinSnrThreshold(threshold) {
        this.options.minSnrThreshold = threshold;
        this.log('Updated minimum SNR threshold:', threshold);
    }

    // New method to set noise floor adaptation rate
    setNoiseFloorAdaptationRate(rate) {
        this.options.noiseFloorAdaptationRate = rate;
        this.log('Updated noise floor adaptation rate:', rate);
    }

    // New method to set fast adaptation rate
    setFastAdaptationRate(rate) {
        this.options.fastAdaptationRate = rate;
        this.log('Updated fast adaptation rate:', rate);
    }

    // New method to set energy rise threshold
    setEnergyRiseThreshold(threshold) {
        this.options.energyRiseThreshold = threshold;
        this.log('Updated energy rise threshold:', threshold);
    }

    // New method to set minimum background duration
    setMinBackgroundDuration(duration) {
        this.options.minBackgroundDuration = duration;
        this.log('Updated minimum background duration:', duration);
    }

    // New method to set maximum segment duration
    setMaxSegmentDuration(duration) {
        this.options.maxSegmentDuration = duration;
        this.log('Updated maximum segment duration:', duration);
    }

    // Enhanced method to detect speech onset using both SNR and energy trends
    findSpeechStart() {
        const chunks = this.state.recentChunks;
        const snrThreshold = this.options.snrThreshold;
        const minSnrThreshold = this.options.minSnrThreshold; // Using configurable low energy threshold
        
        // First find the most recent speech chunk
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
        
        // Look back through chunks to find rising energy trend or SNR above threshold
        for (let i = firstSpeechIndex - 1; i >= 0; i--) {
            // Check for rising energy trend
            if (i < chunks.length - 1 && 
                chunks[i+1].energy > chunks[i].energy * (1 + this.options.energyRiseThreshold)) {
                // We found a significant rise in energy
                earliestRisingIndex = i;
                foundRisingTrend = true;
            }
            
            // Stop if we find a point where SNR drops significantly below threshold
            if (chunks[i].snr < minSnrThreshold / 2) {
                // We've gone too far back
                break;
            }
            
            // If we've looked back more than 500ms (assuming 80ms chunks), stop 
            // to avoid going too far back
            if (firstSpeechIndex - i > 6) {
                break;
            }
        }
        
        // Use the earliest point where energy is rising or SNR is above minimum threshold
        if (foundRisingTrend) {
            this.log('Found rising energy trend for speech onset at', {
                index: earliestRisingIndex,
                time: chunks[earliestRisingIndex].time.toFixed(3),
                energy: chunks[earliestRisingIndex].energy.toFixed(6),
                snr: chunks[earliestRisingIndex].snr.toFixed(2)
            });
            return earliestRisingIndex;
        }
        
        // If no clear rising trend, check for SNR crossing
        for (let i = firstSpeechIndex; i >= 0; i--) {
            // If we find a point where SNR drops below threshold, the next point is the onset
            if (chunks[i].snr < minSnrThreshold) {
                return Math.min(chunks.length - 1, i + 1);
            }
        }
        
        // If no clear onset found, use a default lookback
        return Math.max(0, firstSpeechIndex - 4);
    }

    createSegment(startTime, endTime) {
        // This method now only creates a metadata object without the audio data.
        // The AudioManager is responsible for slicing the audio from its managed buffer.
        const speechDuration = endTime - startTime;

        if (speechDuration <= 0) {
            this.log('Skipping segment creation for zero/negative duration.');
            return null;
        }

        // Return a lightweight segment object.
        return {
            startTime,
            endTime,
            duration: speechDuration,
            // audioData and sampleRate will be added by AudioManager
        };
    }
} 