export interface ModelConfig {
  repoId: string;
  displayName: string;
  languages: string[];
  defaultLanguage: string;
  vocabSize: number;
  featuresSize: number;
  preprocessor: string;
  subsampling: number;
  predHidden: number;
  predLayers: number;
}

export declare const LANGUAGE_NAMES: Record<string, string>;
export declare const MODELS: Record<string, ModelConfig>;
export declare const DEFAULT_MODEL: string;

export function getModelConfig(modelKeyOrRepoId: string): ModelConfig | null;
export function getModelKeyFromRepoId(repoId: string): string | null;
export function supportsLanguage(modelKeyOrRepoId: string, language: string): boolean;
export function listModels(): string[];
export function getLanguageName(langCode: string): string;
