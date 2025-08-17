import { AudioSegmentProcessor } from './AudioSegmentProcessor';
import { parakeetService } from './ParakeetService';
import { transcriptionDataManager } from './TranscriptionDataManager'; // Still needed for results
import audioParams from './config/audioParams.js';
import RingBuffer from './utils/ringBuffer.js'; // Ring buffer for efficient audio storage
import { SessionBuffer } from './audio/SessionBuffer.js';

/**
 * Singleton class to manage audio state and processing across components
 * @class AudioManager
 */
export class AudioManager {
    static instance = null;
    
    constructor() {
        if (AudioManager.instance) {
            return AudioManager.instance;
        }
        
        this.audioContext = null;
        this.processor = null;
        this.listeners = new Set();
        this.initialized = false;
        
        this.transcriptionResults = new Map();
        
        // Initialize parameters using defaults from audioParams.js
        this.parameters = {
            threshold: audioParams.audioThreshold,
            silenceLength: audioParams.silenceLength,
            speechHangover: audioParams.speechHangover,
            lookbackDuration: audioParams.lookbackDuration,
            minSpeechDuration: audioParams.minSpeechDuration,
            maxSilenceWithinSpeech: audioParams.maxSilenceWithinSpeech,
            endingSpeechTolerance: audioParams.endingSpeechTolerance,
            minEnergyPerSecond: audioParams.minEnergyPerSecond,
            minEnergyIntegral: audioParams.minEnergyIntegral,
            snrThreshold: audioParams.snrThreshold,
            minSnrThreshold: audioParams.minSnrThreshold,
            noiseFloorAdaptationRate: audioParams.noiseFloorAdaptationRate,
            fastAdaptationRate: audioParams.fastAdaptationRate,
            minBackgroundDuration: audioParams.minBackgroundDuration,
            energyRiseThreshold: audioParams.energyRiseThreshold,
            useAdaptiveEnergyThresholds: audioParams.useAdaptiveEnergyThresholds,
            adaptiveEnergyIntegralFactor: audioParams.adaptiveEnergyIntegralFactor,
            adaptiveEnergyPerSecondFactor: audioParams.adaptiveEnergyPerSecondFactor,
            minAdaptiveEnergyIntegral: audioParams.minAdaptiveEnergyIntegral,
            minAdaptiveEnergyPerSecond: audioParams.minAdaptiveEnergyPerSecond,
            overlapDuration: audioParams.overlapDuration, // Use existing overlap duration parameter
            maxSegmentDuration: audioParams.maxSegmentDuration // Add max segment duration parameter
        };
        
        this.segments = [];
        this.recordedChunks = [];
        
        // Legacy fields kept for backward-compatibility with other parts of the codebase ↓
        // They now proxy the state held inside the ring buffer.
        this.audioBuffer = new Float32Array(0);
        this.audioBufferSampleOffset = 0;

        // New circular buffer (instantiated when we know the sample-rate)
        this.ringBuffer = null;
        
        this.lastProcessedTime = 0;
        
        this._activeTranscriptions = new Set();
        this.worker = null;
        this.language = 'en'; // Will be set by App component
        this.audioFormat = 'pcm_f32le'; // Default format, can be updated
        
        this._nextSegmentId = 0;
        
        // Initialize metrics with default values
        this._metrics = {
            currentEnergy: 0,
            averageEnergy: 0,
            peakEnergy: 0,
            rawPeakValue: 0,
            bufferDuration: 0,
            recentAudioData: null,
            isSpeaking: false,       // Added: track VAD state
            noiseFloor: 0.01,        // Initial noise floor estimate
            currentSNR: 0,           // Initial SNR value
            snrThreshold: 6,         // SNR threshold for speech detection
            minSnrThreshold: 1.5,    // Minimum SNR threshold for low energy speech
            energyRiseThreshold: 0.08 // Threshold for detecting rising energy trend
        };
        
        // Initialize aggregated segment statistics
        this._aggregatedSegmentMetrics = {
            valid: {
                count: 0,
                totalDuration: 0,
                totalEnergyIntegralEquivalent: 0, // Sum of pAvgEquivalentAt16k
                totalNormalizedEnergyPerSecond: 0 // Sum of normalizedEnergyPerSecond
            },
            discarded: {
                count: 0,
                reasons: {} // e.g., { "Too short": 10, "Low energy": 5 }
            }
        };
        
        // Initialize visualization buffer with a small default size
        // Will be resized when actual sample rate is known
        this._visualizationBuffer = null; // Will be initialized properly later
        this._visualizationBufferPosition = 0;
        
        this.selectedModel = null;
        this.sessionId = null;
        this.inputSampleRate = null;
        
        this.sessionBuffer = null;
        // The worker now manages its own transcription lock

        AudioManager.instance = this;
    }

    /**
     * Initialize audio context and processor
     * @param {Object} options - Configuration options
     * @param {number} options.sampleRate - Sample rate for audio processing
     * @param {Function} options.onSegmentDetected - Callback for new segments
     */
    async initialize(options = {}) {
        if (this.initialized) return;

        try {
            this.options = options;
            
            // Don't initialize buffers yet if we don't have a sample rate
            if (!this.inputSampleRate) {
                console.log('Deferring buffer initialization until sample rate is known');
                this.initialized = true;
                this.notifyListeners('initialized');
                return;
            }
            
            // Use sample-rate aligned durations:
            // 3 seconds at 16kHz = 48,000 samples
            // 3 seconds at 22.05kHz = 66,150 samples
            // 3 seconds at 48kHz = 144,000 samples
            // 30 seconds will be exactly divisible for all sample rates
            const recentAudioDuration = 3.0; // 3 seconds
            const visualizationDuration = 30.0; // 30 seconds
            
            // Initialize buffers with actual sample rate and round to ensure exact sample counts
            this._metrics.recentAudioData = new Float32Array(Math.round(this.inputSampleRate * recentAudioDuration));
            this._visualizationBuffer = new Float32Array(Math.round(this.inputSampleRate * visualizationDuration));
            
            // Log the actual buffer sizes
            console.log('Initialized buffers with sample-rate-aligned durations:', {
                sampleRate: this.inputSampleRate,
                recentAudioDuration,
                recentAudioSamples: this._metrics.recentAudioData.length,
                visualizationDuration,
                visualizationSamples: this._visualizationBuffer.length
            });
            
            this.processor = new AudioSegmentProcessor({
                sampleRate: this.inputSampleRate,
                onSegmentDetected: this.handleNewSegment.bind(this),
                threshold: this.parameters.threshold,
                silenceLength: this.parameters.silenceLength,
                speechHangover: this.parameters.speechHangover,
                minSpeechDuration: this.parameters.minSpeechDuration,
                maxSilenceWithinSpeech: this.parameters.maxSilenceWithinSpeech,
                endingSpeechTolerance: this.parameters.endingSpeechTolerance,
                minEnergyPerSecond: this.parameters.minEnergyPerSecond,
                minEnergyIntegral: this.parameters.minEnergyIntegral,
                lookbackDuration: this.parameters.lookbackDuration,
                overlapDuration: this.parameters.overlapDuration,
                snrThreshold: this.parameters.snrThreshold,
                minSnrThreshold: this.parameters.minSnrThreshold,
                noiseFloorAdaptationRate: this.parameters.noiseFloorAdaptationRate,
                fastAdaptationRate: this.parameters.fastAdaptationRate,
                minBackgroundDuration: this.parameters.minBackgroundDuration,
                energyRiseThreshold: this.parameters.energyRiseThreshold,
                maxSegmentDuration: this.parameters.maxSegmentDuration
            });
            
            this.initialized = true;
            this.notifyListeners('initialized');
        } catch (error) {
            console.error('Failed to initialize AudioManager:', error);
            throw error;
        }
    }

    /**
     * Update sample rate and reinitialize buffers if needed
     * @param {number} newSampleRate - New sample rate
     */
    updateSampleRate(newSampleRate) {
        if (this.inputSampleRate === newSampleRate) return;
        
        console.log('Updating sample rate from', this.inputSampleRate || 'unset', 'to', newSampleRate);
        this.inputSampleRate = newSampleRate;

        // Re-initialize session buffer with new sample rate
        this.sessionBuffer = new SessionBuffer({
            sessionId: this.sessionId || 'default',
            sampleRate: newSampleRate
        });
        
        // Create / update ring buffer (120 s)
        this.ringBuffer = new RingBuffer(120, newSampleRate);
        this.audioBufferSampleOffset = this.ringBuffer.getBaseFrameOffset();
        this.audioBuffer = this.ringBuffer.getInternalBuffer();
        
        // Initialize or update processor
        this.processor = new AudioSegmentProcessor({
            sampleRate: newSampleRate,
            onSegmentDetected: this.handleNewSegment.bind(this),
            threshold: this.parameters.threshold,
            silenceLength: this.parameters.silenceLength,
            speechHangover: this.parameters.speechHangover,
            minSpeechDuration: this.parameters.minSpeechDuration,
            maxSilenceWithinSpeech: this.parameters.maxSilenceWithinSpeech,
            endingSpeechTolerance: this.parameters.endingSpeechTolerance,
            minEnergyPerSecond: this.parameters.minEnergyPerSecond,
            minEnergyIntegral: this.parameters.minEnergyIntegral,
            lookbackDuration: this.parameters.lookbackDuration,
            overlapDuration: this.parameters.overlapDuration,
            snrThreshold: this.parameters.snrThreshold,
            minSnrThreshold: this.parameters.minSnrThreshold,
            noiseFloorAdaptationRate: this.parameters.noiseFloorAdaptationRate,
            fastAdaptationRate: this.parameters.fastAdaptationRate,
            minBackgroundDuration: this.parameters.minBackgroundDuration,
            energyRiseThreshold: this.parameters.energyRiseThreshold,
            maxSegmentDuration: this.parameters.maxSegmentDuration
        });
        
        // Initialize visualization buffers if they haven't been initialized yet
        if (!this._metrics.recentAudioData || !this._visualizationBuffer) {
            this._metrics.recentAudioData = new Float32Array(newSampleRate * 3);
            this._visualizationBuffer = new Float32Array(newSampleRate * 30);
            return;
        }
        
        // Save old data
        const oldRecentData = this._metrics.recentAudioData;
        const oldVisualizationData = this._visualizationBuffer;
        
        // Create new buffers
        this._metrics.recentAudioData = new Float32Array(newSampleRate * 3);
        this._visualizationBuffer = new Float32Array(newSampleRate * 30);
        
        // Copy old data if it exists (could implement resampling here if needed)
        if (oldRecentData) {
            this._metrics.recentAudioData.set(oldRecentData.subarray(0, Math.min(oldRecentData.length, this._metrics.recentAudioData.length)));
        }
        if (oldVisualizationData) {
            this._visualizationBuffer.set(oldVisualizationData.subarray(0, Math.min(oldVisualizationData.length, this._visualizationBuffer.length)));
        }
    }

    /**
     * Process new audio chunk
     * @param {Float32Array} chunk - Audio data
     * @param {number} energy - Energy level of the chunk
     * @param {number} sampleRate - Sample rate of the chunk
     */
    processNewChunk(chunk, energy, sampleRate) {
        if (sampleRate && this.inputSampleRate !== sampleRate) {
            this.updateSampleRate(sampleRate);
        }
        
        // Update visualization buffer
        this.updateVisualizationBuffer(chunk);
        
        // --- RingBuffer write (replaces costly concatenation) ---
        if (!this.ringBuffer) {
            // Lazily create if not yet available (should be rare)
            this.ringBuffer = new RingBuffer(120, this.inputSampleRate || sampleRate);
        }
        this.ringBuffer.write(chunk);
        // Mirror legacy fields so downstream code that still references them does not break.
        this.audioBufferSampleOffset = this.ringBuffer.getBaseFrameOffset();
        this.audioBuffer = this.ringBuffer.getInternalBuffer();
        
        const currentTime = this.getCurrentTime();
        const newSegments = this.processor?.processAudioData(
            chunk,
            currentTime,
            energy,
            null, // full buffer no longer needed – handled by AudioManager via ring buffer
            this.lastProcessedTime,
            this.inputSampleRate
        ) || [];

        // Update last processed time
        this.lastProcessedTime = currentTime;

        // Process any new segments that were detected
        if (newSegments.length > 0) {
            // Process segments asynchronously to prevent blocking
            setTimeout(() => {
                for (const segment of newSegments) {
                    this.handleNewSegment(segment);
                }
            }, 0);
        }
        
        // Now get the updated processor stats including SNR and noise floor
        const processorStats = this.processor?.getStats() || {};
        
        // Update metrics
        this._metrics.currentEnergy = energy;
        this._metrics.averageEnergy = (this._metrics.averageEnergy * 0.95) + (energy * 0.05);
        this._metrics.peakEnergy = Math.max(this._metrics.peakEnergy * 0.99, energy);
        this._metrics.rawPeakValue = Math.max(...Array.from(chunk).map(Math.abs));
        this._metrics.bufferDuration = this.ringBuffer ? (this.ringBuffer.getCurrentFrame() - this.ringBuffer.getBaseFrameOffset()) / this.inputSampleRate : 0;
        
        // Add SNR and noise floor to metrics directly from processor stats
        this._metrics.noiseFloor = processorStats.noiseFloor || 0.01;
        this._metrics.currentSNR = processorStats.snr || 0;
        this._metrics.snrThreshold = processorStats.snrThreshold || 6;
        
        // Debug output noise floor and SNR periodically (approximately every second)
        if (Math.random() < 0.01) {
            console.debug('Current audio metrics:', {
                energy: energy.toFixed(6),
                noiseFloor: this._metrics.noiseFloor.toFixed(6),
                snr: this._metrics.currentSNR.toFixed(2),
                threshold: this._metrics.snrThreshold,
                isSpeaking: this._metrics.isSpeaking
            });
        }

        // Determine if speaking based on processor state if available
        this._metrics.isSpeaking = 
            (this.processor && this.processor.state && this.processor.state.inSpeech) || 
            (processorStats && processorStats.snr > processorStats.snrThreshold) ||
            energy > this.parameters.threshold;

        // Buffer maintenance is handled internally by RingBuffer – legacy trim disabled

        // Notify listeners about the update for visualization
        // Throttle visualization updates to prevent excessive processing
        if (this.lastVisualizationUpdate === undefined || (Date.now() - this.lastVisualizationUpdate) > 50) {
            this.lastVisualizationUpdate = Date.now();
            this.notifyListeners('visualizationUpdate', { 
                waveformData: this.getVisualizationData(), // Send the ordered waveform buffer
                metrics: this.getMetrics() // Also send current metrics for StatsWidget
            });
        }
    }

    /**
     * Keeps the main audio buffer constrained to a specific duration by trimming from the start.
     * This version uses a sample-based offset and a tolerance to reduce trim frequency.
     * It intelligently trims only up to the end of a segment that is safely outside the target retention window.
     */
    _manageAudioBuffer() {
        // Deprecated – ring buffer automatically overwrites old data.
        return;
    }

    /**
     * Update visualization buffer with new audio data
     * @param {Float32Array} chunk - New audio chunk
     */
    updateVisualizationBuffer(chunk) {
        if (!this._visualizationBuffer) {
            // Initialize if not already done - use 30 seconds at sample rate
            // 30 seconds will be exactly divisible for all sample rates
            const bufferDuration = 30.0; // 30 seconds
            this._visualizationBuffer = new Float32Array(Math.round(this.inputSampleRate * bufferDuration));
        }

        const bufferLength = this._visualizationBuffer.length;
        const chunkLength = chunk.length;

        // If chunk is larger than buffer, only take the last portion
        if (chunkLength >= bufferLength) {
            this._visualizationBuffer.set(chunk.subarray(chunkLength - bufferLength));
            this._visualizationBufferPosition = 0;
            return;
        }

        // Calculate where to write the new chunk
        const endPosition = this._visualizationBufferPosition + chunkLength;
        if (endPosition <= bufferLength) {
            // Simple case: just write the chunk
            this._visualizationBuffer.set(chunk, this._visualizationBufferPosition);
            this._visualizationBufferPosition = endPosition;
        } else {
            // Split case: wrap around the buffer
            const firstPart = bufferLength - this._visualizationBufferPosition;
            const secondPart = chunkLength - firstPart;
            
            // Write first part at current position
            this._visualizationBuffer.set(
                chunk.subarray(0, firstPart), 
                this._visualizationBufferPosition
            );
            
            // Write second part at beginning
            this._visualizationBuffer.set(
                chunk.subarray(firstPart)
            );
            
            this._visualizationBufferPosition = secondPart;
        }
    }

    /**
     * Gets the current absolute time in seconds since the recording started.
     * This is now calculated based on the sample offset and the current buffer length
     * to ensure it's always monotonically increasing, even with buffer trimming.
     * @returns {number} Current time in seconds.
     */
    getCurrentTime() {
        if (this.ringBuffer) {
            return this.ringBuffer.getCurrentTime();
        }
        const totalSamples = this.audioBufferSampleOffset + this.audioBuffer.length;
        return totalSamples / this.inputSampleRate;
    }

    /**
     * Start audio context (must be called after user gesture)
     */
    async startAudioContext() {
        if (!this.audioContext) {
            // Use the actual input sample rate from the microphone if available
            const sampleRate = this.inputSampleRate || 48000; // Default to common rate if not set
            console.log('Creating AudioContext with sample rate:', sampleRate);
            this.audioContext = new AudioContext({ sampleRate });
            
            // Warn if resampling will occur
            if (this.inputSampleRate && this.audioContext.sampleRate !== this.inputSampleRate) {
                console.warn(`Audio resampling will occur: Input rate ${this.inputSampleRate}Hz -> Context rate ${this.audioContext.sampleRate}Hz`);
            }
        }
        
        if (this.audioContext.state !== 'running') {
            await this.audioContext.resume();
        }
        
        console.log('AudioManager using sample rate:', this.audioContext.sampleRate);
        this.notifyListeners('audioContextStarted');
    }

    /**
     * Subscribe to audio state changes
     * @param {Function} callback - Listener callback
     * @returns {Function} Unsubscribe function
     */
    subscribe(callback) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    /**
     * Notify all listeners of state change
     * @param {string} event - Event type
     * @param {*} data - Event data
     */
    notifyListeners(event, data) {
        this.listeners.forEach(listener => listener(event, data));
    }

    /**
     * Handle new segment detection
     * @param {object} segment - The segment object from the processor
     */
    async handleNewSegment(segment) {
        const sampleRate = this.inputSampleRate;
        segment.sampleRate = sampleRate;

        // First apply lookback to the start time to capture the beginning of speech
        segment.startTime = Math.max(0, segment.startTime - this.parameters.lookbackDuration);
        segment.duration = segment.endTime - segment.startTime;

        // Then check for overlap with previous segment and adjust if needed
        if (this.segments.length > 0) {
            const lastSegment = this.segments[this.segments.length - 1];
            const timeSinceLastSegment = segment.startTime - lastSegment.endTime;
            
            // If segments are close enough, create overlap by adjusting start time
            if (timeSinceLastSegment < this.parameters.overlapDuration) {
                // Adjust start time to create overlap, but don't go before the lookback point
                segment.startTime = Math.max(
                    lastSegment.endTime - this.parameters.overlapDuration,
                    segment.startTime - this.parameters.overlapDuration
                );
                segment.duration = segment.endTime - segment.startTime;
            }
        }

        // Calculate the sample positions for audio extraction
        const speechStartSample = Math.round(segment.startTime * sampleRate);
        const speechEndSample = Math.round(segment.endTime * sampleRate);

        // Apply additional padding for audio extraction
        const paddedStartSample = Math.max(0, speechStartSample);
        const paddedEndSample = Math.min(
            this.ringBuffer ? this.ringBuffer.getCurrentFrame() : (this.audioBufferSampleOffset + this.audioBuffer.length),
            speechEndSample + Math.round(this.parameters.speechHangover * sampleRate)
        );

        // Retrieve audio directly from ring buffer
        try {
            segment.audioData = this.ringBuffer.read(paddedStartSample, paddedEndSample);
        } catch (err) {
            console.error('[AudioManager] Failed to extract audio from ring buffer:', err);
            segment.audioData = new Float32Array(0);
        }

        // Instead of processing locally, send the segment to the worker
        if (this.worker && segment.audioData && segment.audioData.length > 0) {
            const audioBuffer = segment.audioData.buffer;
            this.worker.postMessage({
                type: 'chunk',
                data: {
                    audio: segment.audioData,
                    start: segment.startTime,
                    end: segment.endTime,
                    seqId: segment.id,
                    rate: this.inputSampleRate
                }
            }, [audioBuffer]); // Transfer ownership for performance
        } else {
            if (!this.worker) console.warn("[AudioManager] Worker not available to process audio chunk.");
            return;
        }

        // The AudioVisualizer expects the segments list from AudioManager.
        // We will push a simplified object here for that purpose.
        this.segments.push({
            id: segment.id,
            startTime: segment.startTime,
            endTime: segment.endTime,
            duration: segment.duration,
            vadStatus: 'speech' // Mark as speech for visualization
        });

        // Limit the number of segments stored for visualization
        if (this.segments.length > 100) {
            this.segments.shift();
        }

        // Notify UI to re-render the waveform with the new segment
        this.notifyListeners('segmentsUpdated', this.segments);
    }

    // New method to calculate Fs-independent and Fs-dependent energy metrics
    getSegmentEnergyMetrics(segment) {
        if (!segment || !segment.audioData || segment.audioData.length === 0 || !segment.sampleRate) {
            return {
                averagePower: 0,
                duration: 0,
                numSamples: 0
            };
        }

        const audioData = segment.audioData;
        const numSamples = audioData.length;
        let sumOfSquares = 0;

        for (let i = 0; i < numSamples; i++) {
            sumOfSquares += audioData[i] * audioData[i];
        }

        const duration = numSamples / segment.sampleRate;
        
        // averagePower is sum of squares per sample (Fs-independent)
        const averagePower = numSamples > 0 ? sumOfSquares / numSamples : 0;
        
        return {
            averagePower: averagePower,
            duration: duration,
            numSamples: numSamples
        };
    }

    getMergedAudioData(segments) {
        if (!segments.length) return new Float32Array(0);
        
        const startTime = Math.min(...segments.map(s => s.startTime));
        const endTime = Math.max(...segments.map(s => s.endTime));
        
        const startSample = Math.floor(startTime * this.inputSampleRate);
        const endSample = Math.ceil(endTime * this.inputSampleRate);
        
        try {
            return this.ringBuffer.read(startSample, endSample);
        } catch (err) {
            console.warn('[AudioManager] Failed to merge audio data from ring buffer:', err);
            return new Float32Array(0);
        }
    }

    // Update trimSilence method with sample-rate-aligned durations
    trimSilence(audioData, sampleRate, threshold = null, lookbackDuration = 0.080, overlapDuration = 0.040) {
        if (!audioData || audioData.length === 0) return audioData;

        // Use sample-rate-aligned durations:
        // 20ms = 320 samples at 16kHz, 441 at 22.05kHz, 960 at 48kHz
        // 40ms = 640 samples at 16kHz, 882 at 22.05kHz, 1920 at 48kHz
        // 80ms = 1280 samples at 16kHz, 1764 at 22.05kHz, 3840 at 48kHz
        const windowDuration = 0.020; // 20ms window (exactly divisible by common sample rates)
        
        // Convert time to samples using Math.round for consistency
        const lookbackSamples = Math.round(lookbackDuration * sampleRate);
        const overlapSamples = Math.round(overlapDuration * sampleRate);
        const windowSize = Math.round(windowDuration * sampleRate);
        
        // Use Math.round for consistent sample position calculations
        let startIndex = lookbackSamples;  // Start from lookback point
        let endIndex = audioData.length - overlapSamples - 1; // End before overlap point

        // Use instance threshold if none provided
        const effectiveThreshold = threshold ?? this.parameters.threshold;

        // Log details for debugging
        console.log('Sample-aligned trimSilence parameters:', {
            sampleRate,
            windowDuration,
            windowSize,
            lookbackDuration,
            lookbackSamples,
            overlapDuration,
            overlapSamples,
            threshold: effectiveThreshold
        });

        // Find start index (trim leading silence)
        for (let i = lookbackSamples; i < audioData.length - windowSize - overlapSamples; i += windowSize) {
            let windowEnergy = 0;
            for (let j = 0; j < windowSize; j++) {
                windowEnergy += Math.abs(audioData[i + j]);
            }
            windowEnergy /= windowSize;

            if (windowEnergy > effectiveThreshold) {
                startIndex = Math.max(lookbackSamples, i - windowSize); // Keep at least lookback samples
                break;
            }
        }

        // Find end index (trim trailing silence)
        for (let i = audioData.length - overlapSamples - windowSize; i >= lookbackSamples; i -= windowSize) {
            let windowEnergy = 0;
            for (let j = 0; j < windowSize; j++) {
                windowEnergy += Math.abs(audioData[i + j]);
            }
            windowEnergy /= windowSize;

            if (windowEnergy > effectiveThreshold) {
                endIndex = Math.min(audioData.length - overlapSamples, i + windowSize * 2);
                break;
            }
        }

        // Create trimmed copy while preserving minimum padding
        return audioData.slice(startIndex, endIndex);
    }

    // New local transcription path using Parakeet.js (no backend)
    // This function is now deprecated in favor of transcribeRecentWindow
    // async sendForTranscription(segment) { ... }

    handleTranscriptionResult({ segmentId, output, isMerged }) {
        // Find the segment
        const segment = this.segments.find(s => s.id === segmentId);
        if (!segment) {
            console.warn('Segment not found:', segmentId);
            return;
        }

        // Update segment with transcription
        segment.transcription = output;
        segment.isProcessed = true;

        // Feed words into transcription data manager for UI
        if (output && Array.isArray(output.words)) {
            try {
                const changed = transcriptionDataManager.processWordUpdates(output.words);
                if (changed) {
                    transcriptionDataManager.emit('dataUpdate', {
                        mergedWords: transcriptionDataManager.mergedWords,
                        stats: transcriptionDataManager.stats,
                        matureCursorTime: transcriptionDataManager.matureCursorTime,
                    });
                }
            } catch (err) {
                console.error('Failed to update transcriptionDataManager:', err);
            }
        }

        // Notify subscribers
        this.notifyListeners('segmentsUpdated', this.segments);

        console.log('Received transcription result:', {
            segmentId,
            output,
            isMerged
        });
    }

    /**
     * Reset all state
     */
    reset() {
        console.log('[AudioManager] Resetting state...');
        
        // Clear audio buffers and state
        this.audioBuffer = new Float32Array(0);
        this.audioBufferSampleOffset = 0;
        this.lastProcessedTime = 0;
        
        // Clear segments and transcription data
        this.segments = [];
        this.recordedChunks = [];

        if (this.sessionBuffer) {
            this.sessionBuffer.reset();
        }

        if (this.processor) {
            this.processor.reset();
        }
        // Reset aggregated metrics
        this._aggregatedSegmentMetrics = {
            valid: {
                count: 0,
                totalDuration: 0,
                totalEnergyIntegralEquivalent: 0,
                totalNormalizedEnergyPerSecond: 0
            },
            discarded: {
                count: 0,
                reasons: {}
            }
        };
        this.notifyListeners('reset');
        // Also notify about reset of aggregated stats
        this.notifyListeners('aggregatedStatsUpdated', this.getAggregatedSegmentMetrics());
    }

    /**
     * Update all parameters at once
     * @param {Object} params - Object containing parameter updates
     */
    updateParameters(params) {
        const changes = [];
        if (params.threshold !== undefined && params.threshold !== this.parameters.threshold) {
            this.parameters.threshold = params.threshold;
            changes.push(`threshold: ${params.threshold}`);
            this.processor?.setThreshold(params.threshold);
        }
        if (params.silenceLength !== undefined && params.silenceLength !== this.parameters.silenceLength) {
            this.parameters.silenceLength = params.silenceLength;
            changes.push(`silenceLength: ${params.silenceLength}`);
            this.processor?.setSilenceLength(params.silenceLength);
        }
        if (params.minSpeechDuration !== undefined && params.minSpeechDuration !== this.parameters.minSpeechDuration) {
            this.parameters.minSpeechDuration = params.minSpeechDuration;
            changes.push(`minSpeechDuration: ${params.minSpeechDuration}`);
            this.processor?.setMinSpeechDuration(params.minSpeechDuration);
        }
        if (params.minEnergyPerSecond !== undefined && params.minEnergyPerSecond !== this.parameters.minEnergyPerSecond) {
            this.parameters.minEnergyPerSecond = params.minEnergyPerSecond;
            changes.push(`minEnergyPerSecond: ${params.minEnergyPerSecond}`);
        }
        if (params.minEnergyIntegral !== undefined && params.minEnergyIntegral !== this.parameters.minEnergyIntegral) {
            this.parameters.minEnergyIntegral = params.minEnergyIntegral;
            changes.push(`minEnergyIntegral: ${params.minEnergyIntegral}`);
        }
        if (params.speechHangover !== undefined && params.speechHangover !== this.parameters.speechHangover) {
            this.parameters.speechHangover = params.speechHangover;
            changes.push(`speechHangover: ${params.speechHangover}`);
            // Assuming processor has a method to set this
            // this.processor?.setSpeechHangover(params.speechHangover); 
        }

        // SNR parameters
        if (params.snrThreshold !== undefined && params.snrThreshold !== this.parameters.snrThreshold) {
            this.parameters.snrThreshold = params.snrThreshold;
            changes.push(`snrThreshold: ${params.snrThreshold}`);
            this.processor?.setSnrThreshold(params.snrThreshold);
        }
        if (params.minSnrThreshold !== undefined && params.minSnrThreshold !== this.parameters.minSnrThreshold) {
            this.parameters.minSnrThreshold = params.minSnrThreshold;
            changes.push(`minSnrThreshold: ${params.minSnrThreshold}`);
            this.processor?.setMinSnrThreshold(params.minSnrThreshold);
        }
        if (params.noiseFloorAdaptationRate !== undefined && params.noiseFloorAdaptationRate !== this.parameters.noiseFloorAdaptationRate) {
            this.parameters.noiseFloorAdaptationRate = params.noiseFloorAdaptationRate;
            changes.push(`noiseFloorAdaptationRate: ${params.noiseFloorAdaptationRate}`);
            this.processor?.setNoiseFloorAdaptationRate(params.noiseFloorAdaptationRate);
        }
        if (params.fastAdaptationRate !== undefined && params.fastAdaptationRate !== this.parameters.fastAdaptationRate) {
            this.parameters.fastAdaptationRate = params.fastAdaptationRate;
            changes.push(`fastAdaptationRate: ${params.fastAdaptationRate}`);
            this.processor?.setFastAdaptationRate(params.fastAdaptationRate);
        }
        if (params.minBackgroundDuration !== undefined && params.minBackgroundDuration !== this.parameters.minBackgroundDuration) {
            this.parameters.minBackgroundDuration = params.minBackgroundDuration;
            changes.push(`minBackgroundDuration: ${params.minBackgroundDuration}`);
            this.processor?.setMinBackgroundDuration(params.minBackgroundDuration);
        }
        if (params.energyRiseThreshold !== undefined && params.energyRiseThreshold !== this.parameters.energyRiseThreshold) {
            this.parameters.energyRiseThreshold = params.energyRiseThreshold;
            changes.push(`energyRiseThreshold: ${params.energyRiseThreshold}`);
            this.processor?.setEnergyRiseThreshold(params.energyRiseThreshold);
        }
        if (params.maxSegmentDuration !== undefined && params.maxSegmentDuration !== this.parameters.maxSegmentDuration) {
            this.parameters.maxSegmentDuration = params.maxSegmentDuration;
            changes.push(`maxSegmentDuration: ${params.maxSegmentDuration}`);
            this.processor?.setMaxSegmentDuration(params.maxSegmentDuration);
        }
        
        // Adaptive energy threshold parameters
        if (params.useAdaptiveEnergyThresholds !== undefined && params.useAdaptiveEnergyThresholds !== this.parameters.useAdaptiveEnergyThresholds) {
            this.parameters.useAdaptiveEnergyThresholds = params.useAdaptiveEnergyThresholds;
            changes.push(`useAdaptiveEnergyThresholds: ${params.useAdaptiveEnergyThresholds}`);
        }
        if (params.adaptiveEnergyIntegralFactor !== undefined && params.adaptiveEnergyIntegralFactor !== this.parameters.adaptiveEnergyIntegralFactor) {
            this.parameters.adaptiveEnergyIntegralFactor = params.adaptiveEnergyIntegralFactor;
            changes.push(`adaptiveEnergyIntegralFactor: ${params.adaptiveEnergyIntegralFactor}`);
        }
        if (params.adaptiveEnergyPerSecondFactor !== undefined && params.adaptiveEnergyPerSecondFactor !== this.parameters.adaptiveEnergyPerSecondFactor) {
            this.parameters.adaptiveEnergyPerSecondFactor = params.adaptiveEnergyPerSecondFactor;
            changes.push(`adaptiveEnergyPerSecondFactor: ${params.adaptiveEnergyPerSecondFactor}`);
        }
        if (params.minAdaptiveEnergyIntegral !== undefined && params.minAdaptiveEnergyIntegral !== this.parameters.minAdaptiveEnergyIntegral) {
            this.parameters.minAdaptiveEnergyIntegral = params.minAdaptiveEnergyIntegral;
            changes.push(`minAdaptiveEnergyIntegral: ${params.minAdaptiveEnergyIntegral}`);
        }
        if (params.minAdaptiveEnergyPerSecond !== undefined && params.minAdaptiveEnergyPerSecond !== this.parameters.minAdaptiveEnergyPerSecond) {
            this.parameters.minAdaptiveEnergyPerSecond = params.minAdaptiveEnergyPerSecond;
            changes.push(`minAdaptiveEnergyPerSecond: ${params.minAdaptiveEnergyPerSecond}`);
        }

        if (changes.length > 0) {
            console.log('AudioManager parameters updated:', changes.join(', '));
            this.notifyListeners('parametersUpdated', this.parameters);
        }
    }

    mergeOverlappingSegments(segments) {
        return segments; // Return segments without merging
    }

    async mergeSegments(segments) {
        return segments; // Return segments without merging
    }

    // Add method to generate unique segment IDs
    generateSegmentId() {
        return `segment_${this._nextSegmentId++}`;
    }

    // Add method to update language
    updateLanguage(language) {
        console.log('AudioManager: Updating language from', this.language, 'to:', language);
        this.language = language;
        // Notify subscribers
        this.notifyListeners('languageUpdated', language);
    }

    /**
     * Get visualization data subsampled to fit the target width.
     * Calculates min/max pairs for each target pixel/point for better peak representation.
     * @param {number} targetWidth - The desired number of data points (e.g., canvas width).
     * @returns {Float32Array} - Subsampled buffer containing alternating min/max values, length targetWidth * 2.
     */
    getVisualizationData(targetWidth) {
        if (!this._visualizationBuffer || !this.inputSampleRate || !targetWidth || targetWidth <= 0) {
            // console.warn('Visualization buffer, sample rate not initialized, or targetWidth invalid.');
            return new Float32Array(0); // Return empty array if prerequisites not met
        }

        // 1. Arrange the circular buffer into chronological order
        const bufferLength = this._visualizationBuffer.length; // Total samples in 30s buffer
        if (bufferLength === 0) return new Float32Array(0);
        
        const orderedBuffer = new Float32Array(bufferLength);
        const pos = this._visualizationBufferPosition;
        orderedBuffer.set(this._visualizationBuffer.slice(pos), 0);
        orderedBuffer.set(this._visualizationBuffer.slice(0, pos), bufferLength - pos);

        // 2. Determine samples per point/pixel
        // Ensure targetWidth is an integer
        const numPoints = Math.floor(targetWidth);
        if (numPoints <= 0) return new Float32Array(0);

        const samplesPerPoint = Math.max(1, Math.floor(bufferLength / numPoints));

        // 3. Create output buffer (2 values per point: min and max)
        // The actual number of points might be slightly less than numPoints if bufferLength is not divisible
        const outputNumPoints = Math.floor(bufferLength / samplesPerPoint);
        const subsampledBuffer = new Float32Array(outputNumPoints * 2); // Store min/max pairs

        // 4. Process buffer in chunks and find min/max for each chunk
        let outputIndex = 0;
        for (let i = 0; i < outputNumPoints; i++) {
            const startIndex = i * samplesPerPoint;
            const endIndex = Math.min(startIndex + samplesPerPoint, bufferLength);

            if (startIndex >= endIndex) continue; // Skip if chunk is empty

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

        return subsampledBuffer; // Return the buffer with actual min/max pairs
    }

    // Add method to get current metrics
    getMetrics() {
        // Get latest processor stats to ensure fresh SNR and noise floor values
        if (this.processor) {
            const processorStats = this.processor.getStats() || {};
            this._metrics.noiseFloor = processorStats.noiseFloor || this._metrics.noiseFloor;
            this._metrics.currentSNR = processorStats.snr || this._metrics.currentSNR;
            this._metrics.snrThreshold = processorStats.snrThreshold || this._metrics.snrThreshold;
            this._metrics.minSnrThreshold = processorStats.minSnrThreshold || this._metrics.minSnrThreshold;
            this._metrics.energyRiseThreshold = processorStats.energyRiseThreshold || this._metrics.energyRiseThreshold;
        }
        
        return { ...this._metrics };
    }

    // Add methods to update model and session
    setModel(model) {
        this.selectedModel = model;
        console.log('AudioManager: Model updated to:', model);
    }

    setSessionId(newSessionId) {
        if (this.sessionId !== newSessionId) {
            console.log(`AudioManager: Session ID changed from ${this.sessionId} to ${newSessionId}`);
            this.sessionId = newSessionId;

            // Create a new session buffer for the new session
            if (this.inputSampleRate) {
                this.sessionBuffer = new SessionBuffer({
                    sessionId: newSessionId,
                    sampleRate: this.inputSampleRate
                });
            }

            // Potentially notify listeners or reset state if needed
            this.notifyListeners('sessionIdChanged', { sessionId: this.sessionId });
        }
    }

    setLanguage(newLanguage) {
        if (this.language !== newLanguage) {
            console.log(`AudioManager: Language changed from ${this.language} to ${newLanguage}`);
            this.language = newLanguage;
            // Notify worker or other components if needed
            this.notifyListeners('languageChanged', { language: this.language });
        }
    }

    setAudioFormat(newFormat) {
        if (this.audioFormat !== newFormat) {
            console.log(`AudioManager: Audio format changed from ${this.audioFormat} to ${newFormat}`);
            this.audioFormat = newFormat;
            this.notifyListeners('formatChanged', newFormat);
        }
    }

    seekToSegment(segment) {
        if (!segment || typeof segment.startTime !== 'number') {
            console.error('AudioManager: Invalid segment provided for seek', segment);
            return;
        }
        console.log(`AudioManager: Seek requested to segment ${segment.id} at ${segment.startTime.toFixed(2)}s`);
        // TODO: Implement actual seek logic if AudioManager controls playback
        // This might involve pausing, setting currentTime on an AudioBufferSourceNode,
        // or notifying a playback component.
        this.notifyListeners('seekRequested', { startTime: segment.startTime });
    }

    deleteSegment(segmentToDelete) {
        if (!segmentToDelete || typeof segmentToDelete.id === 'undefined') {
            console.error('AudioManager: Invalid segment provided for deletion', segmentToDelete);
            return;
        }
        console.log(`AudioManager: Deletion requested for segment ${segmentToDelete.id}`);
        const initialLength = this.segments.length;
        this.segments = this.segments.filter(s => s.id !== segmentToDelete.id);
        
        if (this.segments.length < initialLength) {
            console.log(`AudioManager: Segment ${segmentToDelete.id} deleted.`);
            // Notify listeners that segments have changed
            this.notifyListeners('segmentsUpdated', this.segments);
            // Potentially re-calculate and notify aggregated stats if deletion affects them
            // For now, we assume deletion does not affect historical aggregates of valid/discarded
        } else {
            console.warn(`AudioManager: Segment ${segmentToDelete.id} not found for deletion.`);
        }
    }

    // Getter for the new aggregated metrics
    getAggregatedSegmentMetrics() {
        const validAvgDuration = this._aggregatedSegmentMetrics.valid.count > 0 ?
            this._aggregatedSegmentMetrics.valid.totalDuration / this._aggregatedSegmentMetrics.valid.count : 0;
        const validAvgEnergyIntegral = this._aggregatedSegmentMetrics.valid.count > 0 ?
            this._aggregatedSegmentMetrics.valid.totalEnergyIntegralEquivalent / this._aggregatedSegmentMetrics.valid.count : 0;
        const validAvgNormalizedEnergyPerSecond = this._aggregatedSegmentMetrics.valid.count > 0 ?
            this._aggregatedSegmentMetrics.valid.totalNormalizedEnergyPerSecond / this._aggregatedSegmentMetrics.valid.count : 0;

        return {
            valid: {
                count: this._aggregatedSegmentMetrics.valid.count,
                avgDuration: validAvgDuration,
                avgEnergyIntegralEquivalent: validAvgEnergyIntegral,
                avgNormalizedEnergyPerSecond: validAvgNormalizedEnergyPerSecond,
                // raw totals also available if needed
                totalDuration: this._aggregatedSegmentMetrics.valid.totalDuration,
                totalEnergyIntegralEquivalent: this._aggregatedSegmentMetrics.valid.totalEnergyIntegralEquivalent,
                totalNormalizedEnergyPerSecond: this._aggregatedSegmentMetrics.valid.totalNormalizedEnergyPerSecond,
            },
            discarded: {
                count: this._aggregatedSegmentMetrics.discarded.count,
                reasons: { ...this._aggregatedSegmentMetrics.discarded.reasons }
            }
        };
    }

    // New method to update VAD classification for a segment
    updateSegmentVadClassification(segmentId, isSpeech, classificationStatus) {
        const segment = this.segments.find(s => s.id === segmentId);
        if (segment) {
            segment.vadStatus = isSpeech ? 'speech' : 'non-speech';
            segment.vadClassificationDetail = classificationStatus;
            console.log(`AudioManager: Updated VAD status for segment ${segmentId} to ${segment.vadStatus} (${classificationStatus})`);
            this.notifyListeners('segmentsUpdated', this.segments); // Notify to trigger UI updates
        } else {
            console.warn(`AudioManager: Segment ${segmentId} not found for VAD status update.`);
        }
    }

    /**
     * Purges audio segments that end before the given timestamp.
     * This is called when the transcription merger has finalized a section of the transcript.
     * @param {number} matureCursorTime - The timestamp in seconds. Segments ending before this time will be removed.
     */
    purgeAudioBefore(matureCursorTime) {
        if (typeof matureCursorTime !== 'number' || matureCursorTime <= 0) {
            return;
        }

        let purgedCount = 0;
        let freedMemoryApprox = 0;

        for (const segment of this.segments) {
            // Check if segment ends before the cursor and hasn't been purged already
            if (segment.endTime < matureCursorTime && segment.audioData) {
                freedMemoryApprox += segment.audioData.byteLength;
                segment.audioData = null; // Release the large Float32Array for GC
                segment.isPurged = true;  // Mark as purged
                purgedCount++;
            }
        }

        if (purgedCount > 0) {
            console.log(`[AudioManager] Purged audio data from ${purgedCount} old segments before ${matureCursorTime.toFixed(2)}s. ` +
                        `Freed approx ${(freedMemoryApprox / 1024 / 1024).toFixed(3)} MB.`);
            
            // We notify listeners so the UI can update if needed (e.g., disable playback for purged segments)
            this.notifyListeners('segmentsUpdated', this.segments);
        }
    }
}

// Export singleton instance
export const audioManager = new AudioManager();