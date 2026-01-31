export { ParakeetModel } from './parakeet.js';
export { getModelFile, getModelText, getParakeetModel } from './hub.js';
export { MODELS, DEFAULT_MODEL, getModelConfig, getModelKeyFromRepoId, supportsLanguage, listModels } from './models.js';

/**
 * Convenience factory to load from a local path.
 *
 * Example:
 * import { fromUrls } from 'parakeet.js';
 * const model = await fromUrls({ ... });
 */
export async function fromUrls(cfg) {
  const { ParakeetModel } = await import('./parakeet.js');
  return ParakeetModel.fromUrls(cfg);
}

/**
 * Convenience factory to load from HuggingFace Hub.
 *
 * Example:
 * import { fromHub } from 'parakeet.js';
 * const model = await fromHub('nvidia/parakeet-tdt-1.1b', { quantization: 'int8' });
 * 
 * // Or use a model key for known models:
 * const model = await fromHub('parakeet-tdt-0.6b-v3', { quantization: 'int8' });
 */
export async function fromHub(repoIdOrModelKey, options = {}) {
  const { getParakeetModel } = await import('./hub.js');
  const { ParakeetModel } = await import('./parakeet.js');
  const { MODELS } = await import('./models.js');
  
  // Resolve model key to repo ID if needed
  const repoId = MODELS[repoIdOrModelKey]?.repoId || repoIdOrModelKey;
  
  const urls = await getParakeetModel(repoId, options);
  return ParakeetModel.fromUrls({ ...urls, ...options });
} 