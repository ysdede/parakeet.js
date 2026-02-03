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
}

export interface TokenStreamCallbacks {
    onConfirmedUpdate?: (text: string, tokens: any[]) => void;
    onPendingUpdate?: (text: string, tokens: any[]) => void;
    onMergeInfo?: (info: { lcsLength: number; anchorValid: boolean }) => void;
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
    private _audioBuffer: Float32Array[] = [];
    private _currentTimestamp: number = 0;
    private _chunkCount: number = 0;
    private _isProcessing: boolean = false;
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
     * Process an audio chunk through the windowed streaming pipeline.
     * 
     * @param audio - Float32Array of audio samples (16kHz mono PCM)
     * @returns TokenStreamResult with confirmed/pending text
     */
    async processChunk(audio: Float32Array): Promise<TokenStreamResult> {
        if (!this._merger) {
            throw new Error('TokenStreamTranscriber not initialized. Call initialize() first.');
        }

        if (this._isProcessing) {
            console.warn('[TokenStreamTranscriber] Already processing, skipping chunk');
            return this._getEmptyResult();
        }

        this._isProcessing = true;

        try {
            const model = this._modelManager.getModel();
            if (!model) {
                throw new Error('Model not available');
            }

            // Transcribe with all metadata needed for merging
            const result = await model.transcribe(audio, this._config.sampleRate, {
                returnTimestamps: true,
                returnTokenIds: true,
                returnFrameIndices: true,
                returnLogProbs: true,
                timeOffset: this._currentTimestamp,
            });

            // Merge using LCSPTFAMerger
            const mergeResult = this._merger.processChunk(
                result,
                this._currentTimestamp,
                this._chunkCount > 0 ? this._config.overlapDuration : 0
            );

            // Update timestamp for next chunk
            const chunkDuration = audio.length / this._config.sampleRate;
            this._currentTimestamp += chunkDuration - this._config.overlapDuration;
            this._chunkCount++;

            // Get text representations
            const texts = this._merger.getText(this._tokenizer);

            // Notify callbacks
            this._callbacks.onConfirmedUpdate?.(texts.confirmed, mergeResult.confirmed);
            this._callbacks.onPendingUpdate?.(texts.pending, mergeResult.pending);
            this._callbacks.onMergeInfo?.({
                lcsLength: mergeResult.lcsLength,
                anchorValid: mergeResult.anchorValid
            });

            if (this._config.debug) {
                console.log(`[TokenStreamTranscriber] Chunk ${this._chunkCount}: LCS=${mergeResult.lcsLength}, anchor=${mergeResult.anchorValid}`);
            }

            return {
                confirmedText: texts.confirmed,
                pendingText: texts.pending,
                fullText: texts.full,
                lcsLength: mergeResult.lcsLength,
                anchorValid: mergeResult.anchorValid,
                chunkCount: this._chunkCount,
            };

        } catch (error) {
            console.error('[TokenStreamTranscriber] Process chunk error:', error);
            this._callbacks.onError?.(error as Error);
            throw error;
        } finally {
            this._isProcessing = false;
        }
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
        this._audioBuffer = [];
        this._currentTimestamp = 0;
        this._chunkCount = 0;
        this._isProcessing = false;
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
            async (audio: Float32Array, _startTime: number) => {
                try {
                    await this.processChunk(audio);
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
