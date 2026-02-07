/**
 * BoncukJS v3.0 - Token Stream Transcriber
 * 
 * Uses LCSPTFAMerger for overlapping window transcription with
 * token-level merging (NeMo LCS + PTFA enhancements).
 */

import type {
    TranscriptionResult,
    TranscriptionWord
} from './types';
import { ModelManager } from './ModelManager';

// Import LCSPTFAMerger from parakeet.js (will be available after npm link or install)
// For now, we'll use dynamic import to handle the case where it's linked locally

export interface TokenStreamConfig {
    /** Window duration in seconds (default 5.0) */
    windowDuration?: number;
    /** Overlap duration in seconds (default 1.5) */
    overlapDuration?: number;
    /** Sample rate (default 16000) */
    sampleRate?: number;
    /** Enable debug logging */
    debug?: boolean;
    /** Min sequence anchor length for LCS (default 3) */
    sequenceAnchorLength?: number;
    /** Time tolerance for frame alignment (default 0.15s) */
    timeTolerance?: number;
    /** Decoder frame stride (default 1). Set to 2 to halve decoder steps at cost of coarser timestamps */
    frameStride?: number;
    /** Request log probabilities per token for merger arbitration (default false).
     *  Adds per-frame softmax cost. Disable unless using logProb-based merging. */
    returnLogProbs?: boolean;
}

export interface TokenStreamCallbacks {
    onConfirmedUpdate?: (text: string, tokens: any[]) => void;
    onPendingUpdate?: (text: string, tokens: any[]) => void;
    onMergeInfo?: (info: { lcsLength: number; anchorValid: boolean; anchorTokens?: string[] }) => void;
    onError?: (error: Error) => void;
}

export interface TokenStreamResult {
    /** Confirmed (stable) transcript text */
    confirmedText: string;
    /** Pending (tentative) transcript text */
    pendingText: string;
    /** Full transcript (confirmed + pending) */
    fullText: string;
    /** LCS match length from last merge */
    lcsLength: number;
    /** Whether anchor was validated */
    anchorValid: boolean;
    /** Total chunks processed */
    chunkCount: number;
    /** Tokens used for anchor match (optional) */
    anchorTokens?: string[];
}

/**
 * TokenStreamTranscriber - Windowed streaming transcription with LCS+PTFA merging.
 * 
 * This class implements the v3 streaming architecture:
 * - Short overlapping windows (5-7s)
 * - Token-level merging using LCSPTFAMerger
 * - Frame-aligned verification
 * - Vignetting and logProb arbitration
 */
export class TokenStreamTranscriber {
    private _modelManager: ModelManager;
    private _merger: any = null; // LCSPTFAMerger instance
    private _config: Required<TokenStreamConfig>;
    private _callbacks: TokenStreamCallbacks;

    // State
    private _currentTimestamp: number = 0;
    private _chunkCount: number = 0;
    private _isProcessing: boolean = false;
    private _pendingChunk: { audio: Float32Array; startTime?: number } | null = null;
    private _tokenizer: any = null;

    constructor(
        modelManager: ModelManager,
        config: TokenStreamConfig = {},
        callbacks: TokenStreamCallbacks = {}
    ) {
        this._modelManager = modelManager;
        this._config = {
            windowDuration: config.windowDuration ?? 5.0,
            overlapDuration: config.overlapDuration ?? 1.5,
            sampleRate: config.sampleRate ?? 16000,
            debug: config.debug ?? false,
            sequenceAnchorLength: config.sequenceAnchorLength ?? 3,
            timeTolerance: config.timeTolerance ?? 0.15,
            frameStride: config.frameStride ?? 1,
            returnLogProbs: config.returnLogProbs ?? false,
        };
        this._callbacks = callbacks;
    }

    /**
     * Initialize the transcriber with LCSPTFAMerger.
     * Must be called after model is loaded.
     */
    async initialize(): Promise<void> {
        const model = this._modelManager.getModel();
        if (!model) {
            throw new Error('Model not loaded. Call ModelManager.loadModel() first.');
        }

        // Get tokenizer from model
        this._tokenizer = model.tokenizer;

        // Import and create LCSPTFAMerger
        // Note: parakeet.js should export this class
        try {
            // @ts-ignore - parakeet.js is a JS module
            const parakeet = await import('parakeet.js');

            if (!parakeet.LCSPTFAMerger) {
                throw new Error('LCSPTFAMerger not found in parakeet.js. Make sure you have the latest version.');
            }

            this._merger = new parakeet.LCSPTFAMerger({
                frameTimeStride: model.getFrameTimeStride?.() ?? 0.08,
                timeTolerance: this._config.timeTolerance,
                sequenceAnchorLength: this._config.sequenceAnchorLength,
            });

            if (this._config.debug) {
                console.log('[TokenStreamTranscriber] Initialized with LCSPTFAMerger');
            }
        } catch (err) {
            // Fallback: try to use model's internal LCSPTFAMerger if available
            if ((model as any).LCSPTFAMerger) {
                this._merger = new (model as any).LCSPTFAMerger({
                    frameTimeStride: 0.08,
                    timeTolerance: this._config.timeTolerance,
                    sequenceAnchorLength: this._config.sequenceAnchorLength,
                });
            } else {
                throw new Error(`Failed to initialize LCSPTFAMerger: ${err}`);
            }
        }
    }

    /**
     * Update configuration.
     * Note: Changing window/overlap requires re-connecting to AudioEngine (or reset).
     */
    updateConfig(config: TokenStreamConfig): void {
        this._config = {
            ...this._config,
            ...config,
            // Ensure sensible defaults if partial config provided
            windowDuration: config.windowDuration ?? this._config.windowDuration,
            overlapDuration: config.overlapDuration ?? this._config.overlapDuration,
        };

        if (this._config.debug) {
            console.log('[TokenStreamTranscriber] Config updated:', this._config);
        }
    }

    /**
     * Process an audio chunk through the windowed streaming pipeline.
     * 
     * @param audio - Float32Array of audio samples (16kHz mono PCM)
     * @param startTime - The absolute start time of this chunk in seconds
     * @returns TokenStreamResult with confirmed/pending text
     */
    async processChunk(audio: Float32Array, startTime?: number): Promise<TokenStreamResult> {
        if (!this._merger) {
            throw new Error('TokenStreamTranscriber not initialized. Call initialize() first.');
        }

        if (this._isProcessing) {
            // Queue the latest chunk instead of dropping it entirely.
            // Only the most recent pending chunk is kept (older ones are stale).
            this._pendingChunk = { audio, startTime };
            if (this._config.debug) {
                console.log('[TokenStreamTranscriber] Queued chunk (processing busy)');
            }
            return this._getEmptyResult();
        }

        this._isProcessing = true;

        try {
            const result = await this._processChunkInternal(audio, startTime);

            // After finishing, check if a newer chunk was queued while we were busy
            if (this._pendingChunk) {
                const pending = this._pendingChunk;
                this._pendingChunk = null;
                // Process the queued chunk immediately (non-blocking schedule)
                // We don't await here to avoid blocking the caller, but we do
                // need to keep _isProcessing true until it completes.
                this._isProcessing = false; // Release lock temporarily
                // Use queueMicrotask to process next chunk without starving the event loop
                queueMicrotask(() => {
                    this.processChunk(pending.audio, pending.startTime);
                });
            }

            return result;
        } catch (error) {
            console.error('[TokenStreamTranscriber] Process chunk error:', error);
            this._callbacks.onError?.(error as Error);
            throw error;
        } finally {
            this._isProcessing = false;
        }
    }

    /**
     * Internal processing logic extracted for queue support.
     */
    private async _processChunkInternal(audio: Float32Array, startTime?: number): Promise<TokenStreamResult> {
        const model = this._modelManager.getModel();
        if (!model) {
            throw new Error('Model not available');
        }

        // Use provided startTime or fall back to internal tracking
        const chunkStartTime = startTime !== undefined ? startTime : this._currentTimestamp;
        
        // Calculate actual overlap based on previous chunk end
        let actualOverlap = 0;
        if (this._chunkCount > 0) {
            // If we use explicit startTime, we can calculate overlap precisely:
            // overlap = previousWindowEnd - currentWindowStart
            const previousWindowEnd = this._currentTimestamp + (audio.length / this._config.sampleRate);
            actualOverlap = Math.max(0, previousWindowEnd - chunkStartTime);
        }

        // Transcribe with all metadata needed for merging.
        // Use incremental cache to skip re-decoding the overlap prefix.
        // On subsequent chunks, the decoder resumes from cached state at
        // the boundary of the overlap, saving ~80% of decode frames.
        //
        // prefixSamples enables incremental mel caching (JS preprocessor):
        // the overlap portion's mel features are reused from the previous call,
        // saving ~60-70% of preprocessing time for typical 70% overlap.
        const overlapSeconds = this._chunkCount > 0 ? actualOverlap : 0;
        const overlapSamples = Math.floor(overlapSeconds * this._config.sampleRate);
        const result = await model.transcribe(audio, this._config.sampleRate, {
            returnTimestamps: true,
            returnTokenIds: true,
            returnFrameIndices: true,
            returnLogProbs: this._config.returnLogProbs,
            timeOffset: chunkStartTime,
            frameStride: this._config.frameStride,
            prefixSamples: overlapSamples > 0 ? overlapSamples : 0,
            incremental: overlapSeconds > 0 ? {
                cacheKey: 'streaming',
                prefixSeconds: overlapSeconds,
            } : undefined,
        });

        // Merge using LCSPTFAMerger
        // We use the provided overlap or calculated one
        const mergeResult = this._merger!.processChunk(
            result,
            chunkStartTime,
            this._chunkCount > 0 ? (startTime !== undefined ? actualOverlap : this._config.overlapDuration) : 0
        );

        // Update state for next chunk
        this._currentTimestamp = chunkStartTime;
        this._chunkCount++;

        // Get formatted text from the merger (handles SentencePiece spaces correctly)
        const texts = this._merger!.getText(this._tokenizer);
        const confirmedText = texts.confirmed;
        const pendingText = texts.pending;
        const fullText = texts.full;

        // Notify callbacks
        this._callbacks.onConfirmedUpdate?.(confirmedText, mergeResult.confirmed);
        this._callbacks.onPendingUpdate?.(pendingText, mergeResult.pending);
        this._callbacks.onMergeInfo?.({
            lcsLength: mergeResult.lcsLength,
            anchorValid: mergeResult.anchorValid,
            anchorTokens: mergeResult.anchorTokens
        });

        // Always log preprocessing info from model metrics
        const m = result.metrics;
        if (m) {
            console.log(`[TokenStreamTranscriber] Chunk #${this._chunkCount + 1}: preprocessor=${m.preprocessor_backend || 'unknown'}, preprocess=${m.preprocess_ms}ms, encode=${m.encode_ms}ms, decode=${m.decode_ms}ms, total=${m.total_ms}ms${m.mel_cache ? `, mel_cache: ${m.mel_cache.cached_frames} cached / ${m.mel_cache.new_frames} new` : ''}`);
        }

        if (this._config.debug) {
            console.log(`[TokenStreamTranscriber] Chunk ${this._chunkCount}: start=${chunkStartTime.toFixed(2)}s, overlap=${actualOverlap.toFixed(2)}s, LCS=${mergeResult.lcsLength}, anchor=${mergeResult.anchorValid}`);
        }

        return {
            confirmedText,
            pendingText,
            fullText,
            lcsLength: mergeResult.lcsLength,
            anchorValid: mergeResult.anchorValid,
            chunkCount: this._chunkCount,
            anchorTokens: mergeResult.anchorTokens,
        };
    }

    /**
     * Process a chunk using pre-computed mel features from the mel worker.
     * Bypasses the preprocessor entirely — encoder + decoder only.
     * 
     * @param features - Normalized mel features [melBins, T] from mel worker
     * @param T - Number of time frames
     * @param melBins - Number of mel frequency bins
     * @param startTime - Start time of this audio window in seconds
     * @param overlapSeconds - Overlap with previous window in seconds (for decoder cache)
     */
    async processChunkWithFeatures(
        features: Float32Array,
        T: number,
        melBins: number,
        startTime?: number,
        overlapSeconds?: number,
    ): Promise<TokenStreamResult> {
        if (!this._merger) {
            throw new Error('TokenStreamTranscriber not initialized. Call initialize() first.');
        }

        if (this._isProcessing) {
            if (this._config.debug) {
                console.log('[TokenStreamTranscriber] Queued features chunk (processing busy)');
            }
            return this._getEmptyResult();
        }

        this._isProcessing = true;

        try {
            const result = await this._processChunkWithFeaturesInternal(
                features, T, melBins, startTime, overlapSeconds,
            );
            return result;
        } catch (error) {
            console.error('[TokenStreamTranscriber] Process features chunk error:', error);
            this._callbacks.onError?.(error as Error);
            throw error;
        } finally {
            this._isProcessing = false;
        }
    }

    private async _processChunkWithFeaturesInternal(
        features: Float32Array,
        T: number,
        melBins: number,
        startTime?: number,
        overlapSeconds?: number,
    ): Promise<TokenStreamResult> {
        const model = this._modelManager.getModel();
        if (!model) {
            throw new Error('Model not available');
        }

        const chunkStartTime = startTime !== undefined ? startTime : this._currentTimestamp;

        // Calculate overlap for decoder cache
        let actualOverlap = 0;
        if (this._chunkCount > 0 && overlapSeconds !== undefined) {
            actualOverlap = overlapSeconds;
        } else if (this._chunkCount > 0) {
            // Estimate from config
            actualOverlap = this._config.overlapDuration;
        }

        const overlapSec = this._chunkCount > 0 ? actualOverlap : 0;

        // Call transcribe with pre-computed features (bypasses preprocessor)
        const result = await model.transcribe(null, this._config.sampleRate, {
            returnTimestamps: true,
            returnTokenIds: true,
            returnFrameIndices: true,
            returnLogProbs: this._config.returnLogProbs,
            timeOffset: chunkStartTime,
            frameStride: this._config.frameStride,
            precomputedFeatures: { features, T, melBins },
            incremental: overlapSec > 0 ? {
                cacheKey: 'streaming',
                prefixSeconds: overlapSec,
            } : undefined,
        });

        // Merge using LCSPTFAMerger (same as audio path)
        const mergeResult = this._merger!.processChunk(
            result,
            chunkStartTime,
            this._chunkCount > 0 ? actualOverlap : 0
        );

        // Update state for next chunk
        this._currentTimestamp = chunkStartTime;
        this._chunkCount++;

        // Get formatted text
        const texts = this._merger!.getText(this._tokenizer);
        const confirmedText = texts.confirmed;
        const pendingText = texts.pending;
        const fullText = texts.full;

        // Notify callbacks
        this._callbacks.onConfirmedUpdate?.(confirmedText, mergeResult.confirmed);
        this._callbacks.onPendingUpdate?.(pendingText, mergeResult.pending);
        this._callbacks.onMergeInfo?.({
            lcsLength: mergeResult.lcsLength,
            anchorValid: mergeResult.anchorValid,
            anchorTokens: mergeResult.anchorTokens
        });

        // Always log preprocessing info from model metrics
        const m = result.metrics;
        if (m) {
            console.log(`[TokenStreamTranscriber] Features chunk #${this._chunkCount + 1}: preprocessor=${m.preprocessor_backend || 'unknown'}, preprocess=${m.preprocess_ms}ms, encode=${m.encode_ms}ms, decode=${m.decode_ms}ms, total=${m.total_ms}ms, T=${T}`);
        }

        if (this._config.debug) {
            console.log(`[TokenStreamTranscriber] Features chunk ${this._chunkCount}: start=${chunkStartTime.toFixed(2)}s, overlap=${actualOverlap.toFixed(2)}s, T=${T}, LCS=${mergeResult.lcsLength}`);
        }

        return {
            confirmedText,
            pendingText,
            fullText,
            lcsLength: mergeResult.lcsLength,
            anchorValid: mergeResult.anchorValid,
            chunkCount: this._chunkCount,
            anchorTokens: mergeResult.anchorTokens,
        };
    }

    /**
     * Finalize and get complete transcript.
     * Promotes all pending tokens to confirmed.
     */
    finalize(): TokenStreamResult {
        if (!this._merger) {
            return this._getEmptyResult();
        }

        const texts = this._merger.getText(this._tokenizer);

        return {
            confirmedText: texts.full, // All text is now confirmed
            pendingText: '',
            fullText: texts.full,
            lcsLength: 0,
            anchorValid: true,
            chunkCount: this._chunkCount,
        };
    }

    /**
     * Reset for a new transcription session.
     */
    reset(): void {
        if (this._merger) {
            this._merger.reset();
        }
        // Reset mel cache in the model's JS preprocessor (if available)
        const model = this._modelManager.getModel();
        if (model?.resetMelCache) {
            model.resetMelCache();
        }
        this._currentTimestamp = 0;
        this._chunkCount = 0;
        this._isProcessing = false;
        this._pendingChunk = null;
    }

    /**
     * Get current state for debugging.
     */
    getState(): any {
        return {
            chunkCount: this._chunkCount,
            currentTimestamp: this._currentTimestamp,
            isProcessing: this._isProcessing,
            mergerState: this._merger?.getState() || null,
        };
    }

    /**
     * Check if currently processing.
     */
    isProcessing(): boolean {
        return this._isProcessing;
    }

    private _getEmptyResult(): TokenStreamResult {
        return {
            confirmedText: '',
            pendingText: '',
            fullText: '',
            lcsLength: 0,
            anchorValid: false,
            chunkCount: this._chunkCount,
        };
    }

    /**
     * Connect to AudioEngine for automatic window-based streaming.
     * 
     * Usage:
     * ```
     * const unsubscribe = transcriber.connectToAudioEngine(audioEngine);
     * // ... later
     * unsubscribe();
     * ```
     * 
     * @param audioEngine - AudioEngine instance with onWindowChunk support
     * @returns Unsubscribe function
     */
    connectToAudioEngine(audioEngine: any): () => void {
        if (!audioEngine.onWindowChunk) {
            throw new Error('AudioEngine does not support onWindowChunk. Update to v3.0.');
        }

        return audioEngine.onWindowChunk(
            this._config.windowDuration,
            this._config.overlapDuration,
            this._config.windowDuration - this._config.overlapDuration, // Default trigger interval
            async (audio: Float32Array, startTime: number) => {
                try {
                    await this.processChunk(audio, startTime);
                } catch (e) {
                    console.error('[TokenStreamTranscriber] Window processing error:', e);
                }
            }
        );
    }

    /**
     * Get configuration.
     */
    getConfig(): Required<TokenStreamConfig> {
        return { ...this._config };
    }
}
