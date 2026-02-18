/**
 * Model configurations for supported Parakeet variants.
 * This module centralizes model metadata to make adding new versions easier.
 */

/**
 * Language display names for supported languages.
 * @type {Object.<string, string>}
 */
export const LANGUAGE_NAMES = {
  en: 'English',
  fr: 'French',
  de: 'German',
  es: 'Spanish',
  it: 'Italian',
  pt: 'Portuguese',
  nl: 'Dutch',
  pl: 'Polish',
  ru: 'Russian',
  uk: 'Ukrainian',
  ja: 'Japanese',
  ko: 'Korean',
  zh: 'Chinese',
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
    repoId: 'ysdede/parakeet-tdt-0.6b-v2-onnx',
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
 * @type {string}
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
 * Get language display name.
 * @param {string} langCode - ISO 639-1 language code
 * @returns {string} Language display name or the code itself if not found
 */
export function getLanguageName(langCode) {
  return LANGUAGE_NAMES[langCode.toLowerCase()] || langCode;
}
