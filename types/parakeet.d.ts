export type BackendMode = 'webgpu' | 'webgpu-hybrid' | 'webgpu-strict' | 'wasm';
export type PreprocessorBackend = 'js' | 'onnx';

export interface DecoderStateSnapshot {
  s1: Float32Array;
  s2: Float32Array;
  dims1: number[];
  dims2: number[];
}

export interface ComputeFeaturesResult {
  features: Float32Array;
  T: number;
  melBins: number;
  validLength?: number;
  cached?: boolean;
  cachedFrames?: number;
  newFrames?: number;
}

export interface PrecomputedFeatures {
  features: Float32Array;
  T: number;
  melBins: number;
}

export interface TranscribeOptions {
  returnTimestamps?: boolean;
  returnConfidences?: boolean;
  temperature?: number;
  debug?: boolean;
  enableProfiling?: boolean;
  skipCMVN?: boolean;
  frameStride?: number;
  previousDecoderState?: DecoderStateSnapshot | null;
  returnDecoderState?: boolean;
  timeOffset?: number;
  returnTokenIds?: boolean;
  returnFrameIndices?: boolean;
  returnLogProbs?: boolean;
  returnTdtSteps?: boolean;
  prefixSamples?: number;
  precomputedFeatures?: PrecomputedFeatures | null;
  incremental?: {
    cacheKey: string;
    prefixSeconds: number;
  } | null;
}

export interface TranscribeWord {
  text: string;
  start_time: number;
  end_time: number;
  confidence?: number;
}

export interface TranscribeToken {
  token: string;
  raw_token?: string;
  is_word_start?: boolean;
  start_time?: number;
  end_time?: number;
  confidence?: number;
}

export interface TranscribeConfidenceScoresDetailed {
  token: number[];
  token_avg: number | null;
  word: number[];
  word_avg: number | null;
  frame: number[];
  frame_avg: number | null;
  overall_log_prob: number;
}

export interface TranscribeConfidenceScoresMinimal {
  overall_log_prob: null;
  frame: null;
  frame_avg: null;
}

export type TranscribeConfidenceScores =
  | TranscribeConfidenceScoresDetailed
  | TranscribeConfidenceScoresMinimal;

export interface TranscribeResult {
  utterance_text: string;
  words: TranscribeWord[];
  tokens?: TranscribeToken[];
  confidence_scores?: TranscribeConfidenceScores;
  metrics?: {
    preprocess_ms: number;
    encode_ms: number;
    decode_ms: number;
    tokenize_ms: number;
    total_ms: number;
    rtf: number;
    mel_cache?: { cached_frames: number; new_frames: number };
  } | null;
  is_final: boolean;
  decoderState?: DecoderStateSnapshot;
  tokenIds?: number[];
  frameIndices?: number[];
  logProbs?: number[];
  tdtSteps?: number[];
}

export interface FromUrlsConfig {
  encoderUrl: string;
  decoderUrl: string;
  tokenizerUrl: string;
  preprocessorUrl?: string;
  encoderDataUrl?: string | null;
  decoderDataUrl?: string | null;
  filenames?: { encoder: string; decoder: string };
  backend?: BackendMode;
  wasmPaths?: string;
  subsampling?: number;
  windowStride?: number;
  verbose?: boolean;
  enableProfiling?: boolean;
  enableGraphCapture?: boolean;
  cpuThreads?: number;
  preprocessorBackend?: PreprocessorBackend;
  nMels?: number;
}

export interface StreamingTranscriberOptions {
  returnTimestamps?: boolean;
  returnConfidences?: boolean;
  returnTokenIds?: boolean;
  sampleRate?: number;
  debug?: boolean;
}

export class ParakeetModel {
  static fromUrls(cfg: FromUrlsConfig): Promise<ParakeetModel>;
  computeFeatures(audio: Float32Array, sampleRate?: number, opts?: { prefixSamples?: number }): Promise<ComputeFeaturesResult>;
  setPreprocessorBackend(backend: PreprocessorBackend): void;
  getPreprocessorBackend(): PreprocessorBackend;
  resetMelCache(): void;
  clearIncrementalCache(): void;
  getFrameTimeStride(): number;
  frameToTime(frameIndex: number, timeOffset?: number): number;
  getStreamingConstants(): {
    subsampling: number;
    windowStride: number;
    frameTimeStride: number;
    melBins: number;
    blankId: number;
    maxTokensPerStep: number;
  };
  transcribe(audio: Float32Array | null, sampleRate?: number, opts?: TranscribeOptions): Promise<TranscribeResult>;
  createStreamingTranscriber(opts?: StreamingTranscriberOptions): StatefulStreamingTranscriber;
  endProfiling(): Record<string, { gpu_us: number; cpu_us: number; total_us: number }> | null;
}

export class StatefulStreamingTranscriber {
  constructor(model: ParakeetModel, opts?: StreamingTranscriberOptions);
  processChunk(audio: Float32Array): Promise<{
    chunkText: string;
    chunkWords: TranscribeWord[];
    text: string;
    words: TranscribeWord[];
    totalDuration: number;
    chunkCount: number;
    is_final: boolean;
    tokenIds?: number[];
    confidence_scores?: TranscribeConfidenceScores;
    metrics?: TranscribeResult['metrics'];
  }>;
  finalize(): {
    text: string;
    words: TranscribeWord[];
    totalDuration: number;
    chunkCount: number;
    is_final: boolean;
    tokenIds?: number[];
  };
  reset(): void;
  getState(): {
    hasDecoderState: boolean;
    currentOffset: number;
    wordCount: number;
    chunkCount: number;
    isFinalized: boolean;
  };
}

export class MelFeatureCache {
  constructor(opts?: { maxCacheSizeMB?: number });
  getFeatures(model: ParakeetModel, audio: Float32Array): Promise<{ features: Float32Array; T: number; melBins: number; cached: boolean }>;
  clear(): void;
  getStats(): { entries: number; sizeMB: string; maxSizeMB: number };
}

export interface MergedToken {
  id: number;
  frameIndex: number;
  absTime: number;
  logProb: number;
  text: string;
  vignetteWeight?: number;
}

export interface FrameAlignedProcessChunkInput {
  tokenIds: number[];
  frameIndices: number[];
  timestamps?: number[][];
  logProbs?: number[];
  tokens?: Array<{ token?: string }>;
}

export interface FrameAlignedProcessChunkResult {
  confirmed: MergedToken[];
  pending: MergedToken[];
  anchorsFound: number;
  totalTokens: number;
}

export class FrameAlignedMerger {
  constructor(opts?: { frameTimeStride?: number; timeTolerance?: number; stabilityThreshold?: number });
  processChunk(result: FrameAlignedProcessChunkInput, chunkStartTime: number, overlapDuration?: number): FrameAlignedProcessChunkResult;
  getText(tokenizer: { decode(ids: number[]): string }): string;
  getAllTokens(): MergedToken[];
  reset(): void;
  getState(): { confirmedCount: number; pendingCount: number; stabilityMapSize: number };
}

export interface LCSPTFAProcessChunkInput {
  tokenIds: number[];
  frameIndices: number[];
  logProbs?: number[];
  tokens?: Array<{ token?: string }>;
}

export interface LCSPTFAProcessChunkResult {
  confirmed: MergedToken[];
  pending: MergedToken[];
  lcsLength: number;
  anchorValid: boolean;
  overlapTokenCount?: number;
  isFirstChunk?: boolean;
}

export class LCSPTFAMerger {
  constructor(opts?: { frameTimeStride?: number; timeTolerance?: number; sequenceAnchorLength?: number; vignetteSigmaFactor?: number });
  processChunk(result: LCSPTFAProcessChunkInput, chunkStartTime: number, overlapDuration?: number): LCSPTFAProcessChunkResult;
  getText(tokenizer: { decode(ids: number[]): string }): { confirmed: string; pending: string; full: string };
  getAllTokens(): MergedToken[];
  reset(): void;
  getState(): {
    confirmedCount: number;
    pendingCount: number;
    lastConfirmedTime: number;
    lastPendingTime: number;
  };
}
