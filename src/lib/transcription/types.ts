/**
 * BoncukJS v2.0 - Transcription Types
 */

export type ModelState = 'unloaded' | 'loading' | 'ready' | 'error';
export type BackendType = 'webgpu' | 'wasm';

export interface ModelConfig {
  modelId: string;
  encoderUrl: string;
  decoderUrl: string;
  tokenizerUrl: string;
  preprocessorUrl: string;
  backend?: BackendType;
}

export interface ModelProgress {
  stage: string;
  progress: number; // 0-100
  message?: string;
}

export interface TranscriptionWord {
  text: string;
  start: number;
  end: number;
  confidence?: number;
}

export interface TranscriptionResult {
  /** Current chunk text */
  chunkText: string;
  /** Cumulative full transcript */
  text: string;
  /** Word-level details */
  words: TranscriptionWord[];
  /** Total audio duration processed */
  totalDuration: number;
  /** Whether this is the final result */
  isFinal: boolean;
}

export interface TranscriptionServiceConfig {
  sampleRate?: number;
  returnTimestamps?: boolean;
  returnConfidences?: boolean;
  debug?: boolean;
}

/**
 * Callbacks for model loading events
 */
export interface ModelManagerCallbacks {
  onProgress?: (progress: ModelProgress) => void;
  onStateChange?: (state: ModelState) => void;
  onError?: (error: Error) => void;
}

/**
 * Callbacks for transcription events
 */
export interface TranscriptionCallbacks {
  onResult?: (result: TranscriptionResult) => void;
  onError?: (error: Error) => void;
}
