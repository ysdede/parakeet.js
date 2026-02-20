export {
  ParakeetModel,
  StatefulStreamingTranscriber,
  FrameAlignedMerger,
  LCSPTFAMerger,
} from './parakeet';

export {
  getModelFile,
  getModelText,
  getParakeetModel,
} from './hub';

export {
  MODELS,
  LANGUAGE_NAMES,
  DEFAULT_MODEL,
  getModelConfig,
  getModelKeyFromRepoId,
  supportsLanguage,
  listModels,
  getLanguageName,
} from './models';

export {
  JsPreprocessor,
  IncrementalMelProcessor,
  MEL_CONSTANTS,
  hzToMel,
  melToHz,
  createMelFilterbank,
  createPaddedHannWindow,
  precomputeTwiddles,
  fft,
} from './mel';

import type { FromUrlsConfig, ParakeetModel } from './parakeet';
import type { GetParakeetModelOptions } from './hub';

export type {
  TranscribeResult,
  TranscribeOptions,
  FromUrlsConfig,
} from './parakeet';

export type { ModelConfig } from './models';
export type { GetParakeetModelOptions } from './hub';

export type FromHubOptions =
  GetParakeetModelOptions &
  Partial<Pick<FromUrlsConfig, 'cpuThreads' | 'wasmPaths' | 'enableGraphCapture' | 'verbose' | 'subsampling' | 'windowStride' | 'enableProfiling' | 'nMels'>>;

export function fromUrls(cfg: FromUrlsConfig): Promise<ParakeetModel>;
export function fromHub(repoIdOrModelKey: string, options?: FromHubOptions): Promise<ParakeetModel>;
