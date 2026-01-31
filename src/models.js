/**
 * Model configurations for supported Parakeet variants.
 * This module centralizes model metadata to make adding new versions easier.
 */

/**
 * Language configuration with display names and HuggingFace dataset mapping.
 * Uses datasets that have API streaming support (datasets-server).
 * 
 * @type {Object.<string, {displayName: string, dataset: string, config: string, split: string, textField: string, sampleCount: number}>}
 */
export const LANGUAGES = {
  en: { 
    displayName: 'English', 
    dataset: 'MLCommons/peoples_speech',
    config: 'clean',
    split: 'test',
    textField: 'text',
    sampleCount: 100  // API returns up to 100 rows
  },
  fr: { 
    displayName: 'French', 
    dataset: 'facebook/multilingual_librispeech',
    config: 'french',
    split: 'test',
    textField: 'transcript',
    sampleCount: 100
  },
  de: { 
    displayName: 'German', 
    dataset: 'facebook/multilingual_librispeech',
    config: 'german',
    split: 'test',
    textField: 'transcript',
    sampleCount: 100
  },
  es: { 
    displayName: 'Spanish', 
    dataset: 'facebook/multilingual_librispeech',
    config: 'spanish',
    split: 'test',
    textField: 'transcript',
    sampleCount: 100
  },
  it: { 
    displayName: 'Italian', 
    dataset: 'facebook/multilingual_librispeech',
    config: 'italian',
    split: 'test',
    textField: 'transcript',
    sampleCount: 100
  },
  pt: { 
    displayName: 'Portuguese', 
    dataset: 'facebook/multilingual_librispeech',
    config: 'portuguese',
    split: 'test',
    textField: 'transcript',
    sampleCount: 100
  },
  nl: { 
    displayName: 'Dutch', 
    dataset: 'facebook/multilingual_librispeech',
    config: 'dutch',
    split: 'test',
    textField: 'transcript',
    sampleCount: 100
  },
  pl: { 
    displayName: 'Polish', 
    dataset: 'facebook/multilingual_librispeech',
    config: 'polish',
    split: 'test',
    textField: 'transcript',
    sampleCount: 100
  },
  // Note: MLS doesn't have ru, uk, ja, ko, zh - these languages won't have test samples
  ru: { displayName: 'Russian', dataset: null, config: null, split: null, textField: null, sampleCount: 0 },
  uk: { displayName: 'Ukrainian', dataset: null, config: null, split: null, textField: null, sampleCount: 0 },
  ja: { displayName: 'Japanese', dataset: null, config: null, split: null, textField: null, sampleCount: 0 },
  ko: { displayName: 'Korean', dataset: null, config: null, split: null, textField: null, sampleCount: 0 },
  zh: { displayName: 'Chinese', dataset: null, config: null, split: null, textField: null, sampleCount: 0 },
};

/**
 * @typedef {Object} ModelConfig
 * @property {string} repoId - HuggingFace repository ID
 * @property {string} displayName - Human-readable name for UI
 * @property {string[]} languages - Supported languages (ISO 639-1 codes)
 * @property {string} defaultLanguage - Default language for transcription
 * @property {number} vocabSize - Expected vocabulary size
 * @property {number} featuresSize - Mel spectrogram features (80 or 128)
 * @property {string} preprocessor - Default preprocessor variant
 * @property {number} subsampling - Subsampling factor
 * @property {number} predHidden - Prediction network hidden size
 * @property {number} predLayers - Prediction network layers
 */

/**
 * Supported model configurations.
 * @type {Object.<string, ModelConfig>}
 */
export const MODELS = {
  'parakeet-tdt-0.6b-v2': {
    repoId: 'istupakov/parakeet-tdt-0.6b-v2-onnx',
    displayName: 'Parakeet TDT 0.6B v2 (English)',
    languages: ['en'],
    defaultLanguage: 'en',
    vocabSize: 1025,  // 1024 tokens + blank
    featuresSize: 128,
    preprocessor: 'nemo128',
    subsampling: 8,
    predHidden: 640,
    predLayers: 2,
  },
  'parakeet-tdt-0.6b-v3': {
    repoId: 'istupakov/parakeet-tdt-0.6b-v3-onnx',
    displayName: 'Parakeet TDT 0.6B v3 (Multilingual)',
    languages: ['en', 'fr', 'de', 'es', 'it', 'pt', 'nl', 'pl', 'ru', 'uk', 'ja', 'ko', 'zh'],
    defaultLanguage: 'en',
    vocabSize: 4097,  // Larger vocabulary for multilingual support
    featuresSize: 128,
    preprocessor: 'nemo128',
    subsampling: 8,
    predHidden: 640,
    predLayers: 2,
  },
};

/**
 * Default model to use when none specified.
 */
export const DEFAULT_MODEL = 'parakeet-tdt-0.6b-v2';

/**
 * Get model configuration by model key or repo ID.
 * @param {string} modelKeyOrRepoId - Model key (e.g., 'parakeet-tdt-0.6b-v3') or repo ID
 * @returns {ModelConfig|null} Model configuration or null if not found
 */
export function getModelConfig(modelKeyOrRepoId) {
  // Direct key lookup
  if (MODELS[modelKeyOrRepoId]) {
    return MODELS[modelKeyOrRepoId];
  }
  
  // Search by repo ID
  for (const [key, config] of Object.entries(MODELS)) {
    if (config.repoId === modelKeyOrRepoId) {
      return config;
    }
  }
  
  return null;
}

/**
 * Get model key from repo ID.
 * @param {string} repoId - HuggingFace repository ID
 * @returns {string|null} Model key or null if not found
 */
export function getModelKeyFromRepoId(repoId) {
  for (const [key, config] of Object.entries(MODELS)) {
    if (config.repoId === repoId) {
      return key;
    }
  }
  return null;
}

/**
 * Check if a model supports a given language.
 * @param {string} modelKeyOrRepoId - Model key or repo ID
 * @param {string} language - ISO 639-1 language code
 * @returns {boolean} True if language is supported
 */
export function supportsLanguage(modelKeyOrRepoId, language) {
  const config = getModelConfig(modelKeyOrRepoId);
  if (!config) return false;
  return config.languages.includes(language.toLowerCase());
}

/**
 * List all available model keys.
 * @returns {string[]} Array of model keys
 */
export function listModels() {
  return Object.keys(MODELS);
}

/**
 * Get language configuration.
 * @param {string} langCode - ISO 639-1 language code
 * @returns {Object|null} Language config or null if not found
 */
export function getLanguageConfig(langCode) {
  return LANGUAGES[langCode.toLowerCase()] || null;
}

/**
 * Get HuggingFace dataset API URL for speech samples.
 * @param {string} langCode - ISO 639-1 language code
 * @returns {{url: string, textField: string, dataset: string}|null} API URL and metadata, or null if not available
 */
export function getSpeechDatasetUrl(langCode) {
  const langConfig = LANGUAGES[langCode.toLowerCase()];
  if (!langConfig || !langConfig.dataset) return null;
  
  const url = `https://datasets-server.huggingface.co/first-rows?dataset=${langConfig.dataset}&config=${langConfig.config}&split=${langConfig.split}`;
  
  return { 
    url, 
    textField: langConfig.textField,
    dataset: langConfig.dataset,
    sampleCount: langConfig.sampleCount
  };
}

// Keep old function name as alias for backward compatibility
export const getFleursApiUrl = getSpeechDatasetUrl;
