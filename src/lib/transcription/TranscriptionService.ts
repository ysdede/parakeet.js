/**
 * BoncukJS v2.0 - Transcription Service
 * 
 * High-level service for real-time transcription using parakeet.js
 * StatefulStreamingTranscriber. No complex merging logic required!
 */

import type { 
  TranscriptionResult, 
  TranscriptionServiceConfig, 
  TranscriptionCallbacks,
  TranscriptionWord 
} from './types';
import { ModelManager } from './ModelManager';

export class TranscriptionService {
  private _modelManager: ModelManager;
  private _streamer: any = null; // StatefulStreamingTranscriber
  private _config: TranscriptionServiceConfig;
  private _callbacks: TranscriptionCallbacks = {};
  private _isProcessing: boolean = false;

  constructor(
    modelManager: ModelManager, 
    config: TranscriptionServiceConfig = {},
    callbacks: TranscriptionCallbacks = {}
  ) {
    this._modelManager = modelManager;
    this._config = {
      sampleRate: config.sampleRate ?? 16000,
      returnTimestamps: config.returnTimestamps ?? true,
      returnConfidences: config.returnConfidences ?? false,
      debug: config.debug ?? false,
    };
    this._callbacks = callbacks;
  }

  /**
   * Initialize the streaming transcriber.
   * Must be called after model is loaded.
   */
  initialize(): void {
    const model = this._modelManager.getModel();
    if (!model) {
      throw new Error('Model not loaded. Call ModelManager.loadModel() first.');
    }

    // Create streaming transcriber using parakeet.js API
    this._streamer = model.createStreamingTranscriber({
      returnTimestamps: this._config.returnTimestamps,
      returnConfidences: this._config.returnConfidences,
      sampleRate: this._config.sampleRate,
      debug: this._config.debug,
    });

    if (this._config.debug) {
      console.log('[TranscriptionService] Initialized streaming transcriber');
    }
  }

  /**
   * Process an audio chunk and get transcription result.
   * 
   * @param audio - Float32Array of audio samples (16kHz mono PCM)
   * @returns Transcription result with cumulative text
   */
  async processChunk(audio: Float32Array): Promise<TranscriptionResult> {
    if (!this._streamer) {
      throw new Error('TranscriptionService not initialized. Call initialize() first.');
    }

    if (this._isProcessing) {
      console.warn('[TranscriptionService] Already processing a chunk, skipping...');
      return this._getEmptyResult();
    }

    this._isProcessing = true;

    try {
      // Process with parakeet.js stateful streaming
      const result = await this._streamer.processChunk(audio);

      // Convert to our format
      const transcriptionResult: TranscriptionResult = {
        chunkText: result.chunkText || '',
        text: result.text || '',
        words: (result.words || []).map((w: any) => ({
          text: w.text,
          start: w.start,
          end: w.end,
          confidence: w.confidence,
        })),
        totalDuration: result.totalDuration || 0,
        isFinal: false,
      };

      // Notify callback
      this._callbacks.onResult?.(transcriptionResult);

      return transcriptionResult;
    } catch (error) {
      console.error('[TranscriptionService] Process chunk error:', error);
      this._callbacks.onError?.(error as Error);
      throw error;
    } finally {
      this._isProcessing = false;
    }
  }

  /**
   * Finalize the session and get complete transcript.
   */
  finalize(): TranscriptionResult {
    if (!this._streamer) {
      return this._getEmptyResult(true);
    }

    const result = this._streamer.finalize();

    return {
      chunkText: '',
      text: result.text || '',
      words: (result.words || []).map((w: any) => ({
        text: w.text,
        start: w.start,
        end: w.end,
        confidence: w.confidence,
      })),
      totalDuration: result.totalDuration || 0,
      isFinal: true,
    };
  }

  /**
   * Reset the streamer for a new session.
   */
  reset(): void {
    if (this._streamer) {
      this._streamer.reset();
    }
    this._isProcessing = false;
  }

  /**
   * Get current state for debugging.
   */
  getState(): any {
    return this._streamer?.getState() || { initialized: false };
  }

  /**
   * Check if currently processing.
   */
  isProcessing(): boolean {
    return this._isProcessing;
  }

  private _getEmptyResult(isFinal: boolean = false): TranscriptionResult {
    return {
      chunkText: '',
      text: '',
      words: [],
      totalDuration: 0,
      isFinal,
    };
  }
}
