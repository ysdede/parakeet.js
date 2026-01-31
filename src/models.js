/**
 * Model configurations for supported Parakeet variants.
 * This module centralizes model metadata to make adding new versions easier.
 */

/**
 * Language configuration with display names and FLEURS dataset mapping.
 * @type {Object.<string, {displayName: string, fleursConfig: string, sampleCount: number}>}
 */
export const LANGUAGES = {
  en: { displayName: 'English', fleursConfig: 'en_us', sampleCount: 647 },
  es: { displayName: 'Spanish', fleursConfig: 'es_419', sampleCount: 647 },
  fr: { displayName: 'French', fleursConfig: 'fr_fr', sampleCount: 647 },
  de: { displayName: 'German', fleursConfig: 'de_de', sampleCount: 647 },
  it: { displayName: 'Italian', fleursConfig: 'it_it', sampleCount: 647 },
  pt: { displayName: 'Portuguese', fleursConfig: 'pt_br', sampleCount: 647 },
  nl: { displayName: 'Dutch', fleursConfig: 'nl_nl', sampleCount: 647 },
  pl: { displayName: 'Polish', fleursConfig: 'pl_pl', sampleCount: 647 },
  ru: { displayName: 'Russian', fleursConfig: 'ru_ru', sampleCount: 647 },
  uk: { displayName: 'Ukrainian', fleursConfig: 'uk_ua', sampleCount: 647 },
  ja: { displayName: 'Japanese', fleursConfig: 'ja_jp', sampleCount: 647 },
  ko: { displayName: 'Korean', fleursConfig: 'ko_kr', sampleCount: 647 },
  zh: { displayName: 'Chinese', fleursConfig: 'cmn_hans_cn', sampleCount: 647 },
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
 * Get FLEURS dataset API URL for a random sample.
 * @param {string} langCode - ISO 639-1 language code
 * @param {number} [offset] - Specific offset (random if not provided)
 * @returns {{url: string, offset: number}|null} API URL and offset, or null if language not supported
 */
export function getFleursApiUrl(langCode, offset) {
  const langConfig = LANGUAGES[langCode.toLowerCase()];
  if (!langConfig) return null;
  
  const randomOffset = offset ?? Math.floor(Math.random() * langConfig.sampleCount);
  const url = `https://datasets-server.huggingface.co/rows?dataset=google/fleurs&config=${langConfig.fleursConfig}&split=test&offset=${randomOffset}&length=1`;
  
  return { url, offset: randomOffset };
}
