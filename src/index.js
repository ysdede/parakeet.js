import { ParakeetModel } from './parakeet.js';
import { getParakeetModel } from './hub.js';
import { MODELS } from './models.js';

export { ParakeetModel, StatefulStreamingTranscriber, FrameAlignedMerger, LCSPTFAMerger } from './parakeet.js';
export { getModelFile, getModelText, getParakeetModel } from './hub.js';
export { MODELS, LANGUAGE_NAMES, DEFAULT_MODEL, getModelConfig, getModelKeyFromRepoId, supportsLanguage, listModels, getLanguageName } from './models.js';
export { JsPreprocessor, IncrementalMelProcessor, MEL_CONSTANTS, hzToMel, melToHz, createMelFilterbank, createPaddedHannWindow, precomputeTwiddles, fft } from './mel.js';

/**
 * Convenience factory to load from a local path.
 * @param {Object} cfg - Model URL/configuration object passed to `ParakeetModel.fromUrls`.
 * @returns {Promise<ParakeetModel>} Loaded Parakeet model instance.
 * @example
 * import { fromUrls } from 'parakeet.js';
 * const model = await fromUrls({ encoderUrl, decoderUrl, tokenizerUrl, preprocessorUrl });
 */
export async function fromUrls(cfg) {
  return ParakeetModel.fromUrls(cfg);
}

/**
 * Convenience factory to load from HuggingFace Hub.
 * @param {string} repoIdOrModelKey - Hugging Face repo ID or known model key.
 * @param {Object} [options={}] - Download/runtime options forwarded to hub/model loaders.
 * @returns {Promise<ParakeetModel>} Loaded Parakeet model instance.
 * @example
 * import { fromHub } from 'parakeet.js';
 * const model = await fromHub('ysdede/parakeet-tdt-0.6b-v3-onnx', { decoderQuant: 'int8' });
 *
 * // Or use a model key for known models:
 * const model = await fromHub('parakeet-tdt-0.6b-v3', { backend: 'webgpu-hybrid' });
 */
export async function fromHub(repoIdOrModelKey, options = {}) {
  // Resolve model key to repo ID if needed
  const repoId = MODELS[repoIdOrModelKey]?.repoId || repoIdOrModelKey;

  const result = await getParakeetModel(repoId, options);
  return ParakeetModel.fromUrls({
    ...result.urls,
    filenames: result.filenames,
    preprocessorBackend: result.preprocessorBackend,
    ...options,
  });
}
