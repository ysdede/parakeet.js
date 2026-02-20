export declare const MEL_CONSTANTS: {
  SAMPLE_RATE: number;
  N_FFT: number;
  WIN_LENGTH: number;
  HOP_LENGTH: number;
  PREEMPH: number;
  LOG_ZERO_GUARD: number;
  N_FREQ_BINS: number;
};

export function hzToMel(freq: number): number;
export function melToHz(mel: number): number;
export function createMelFilterbank(nMels: number): Float32Array;
export function createPaddedHannWindow(): Float64Array;
export function precomputeTwiddles(N: number): { cos: Float64Array; sin: Float64Array };
export function fft(re: Float64Array, im: Float64Array, N: number, tw: { cos: Float64Array; sin: Float64Array }): void;

export class JsPreprocessor {
  readonly nMels: number;
  constructor(opts?: { nMels?: number });
  process(audio: Float32Array): { features: Float32Array; length: number };
  computeRawMel(audio: Float32Array, startFrame?: number): { rawMel: Float32Array; nFrames: number; featuresLen: number };
  normalizeFeatures(rawMel: Float32Array, nFrames: number, featuresLen: number): Float32Array;
}

export class IncrementalMelProcessor {
  readonly nMels: number;
  constructor(opts?: { nMels?: number; boundaryFrames?: number });
  reset(): void;
  process(audio: Float32Array, prefixSamples?: number): {
    features: Float32Array;
    length: number;
    cached: boolean;
    cachedFrames: number;
    newFrames: number;
  };
  clear(): void;
}
