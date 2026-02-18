import type { BackendMode, PreprocessorBackend } from './parakeet';
import type { ModelConfig } from './models';

export interface HubProgress {
  loaded: number;
  total: number;
  file: string;
}

export interface GetModelFileOptions {
  revision?: string;
  subfolder?: string;
  progress?: (progress: HubProgress) => void;
}

export interface GetParakeetModelOptions {
  revision?: string;
  encoderQuant?: 'int8' | 'fp32';
  decoderQuant?: 'int8' | 'fp32';
  preprocessor?: 'nemo80' | 'nemo128';
  preprocessorBackend?: PreprocessorBackend;
  backend?: BackendMode;
  progress?: (progress: HubProgress) => void;
}

export interface GetParakeetModelResult {
  urls: {
    encoderUrl: string;
    decoderUrl: string;
    tokenizerUrl: string;
    preprocessorUrl?: string;
    encoderDataUrl?: string | null;
    decoderDataUrl?: string | null;
  };
  filenames: {
    encoder: string;
    decoder: string;
  };
  quantisation: {
    encoder: 'int8' | 'fp32';
    decoder: 'int8' | 'fp32';
  };
  modelConfig: ModelConfig | null;
  preprocessorBackend: PreprocessorBackend;
}

export function getModelFile(repoId: string, filename: string, options?: GetModelFileOptions): Promise<string>;
export function getModelText(repoId: string, filename: string, options?: GetModelFileOptions): Promise<string>;
export function getParakeetModel(repoIdOrModelKey: string, options?: GetParakeetModelOptions): Promise<GetParakeetModelResult>;
