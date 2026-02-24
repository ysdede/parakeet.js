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

function usesRequestedFp16(options) {
  return options?.encoderQuant === 'fp16' || options?.decoderQuant === 'fp16';
}

function buildFp16CompileHint(options) {
  const backend = String(options?.backend || '');
  const isWebgpu = backend.startsWith('webgpu');
  const decoderFp16 = options?.decoderQuant === 'fp16';

  if (isWebgpu && decoderFp16) {
    return "Decoder runs on WASM in WebGPU modes; try decoderQuant: 'int8' or 'fp32'.";
  }

  return "Try encoderQuant/decoderQuant: 'fp32' (or 'int8' where supported).";
}

/**
 * Convenience factory to load from HuggingFace Hub.
 *
 * Behavior notes:
 * - Requested quantization is strict; this function does not auto-switch `fp16` to `fp32`.
 * - If model compile/session creation fails, the original error is propagated.
 * - For FP16 requests, an additional actionable hint is included in the thrown error.
 *
 * @param {string} repoIdOrModelKey - Hugging Face repo ID or known model key.
 * @param {Object} [options={}] - Download/runtime options forwarded to hub/model loaders (e.g. encoderQuant, decoderQuant: 'int8'|'fp32'|'fp16', backend, progress).
 * @returns {Promise<ParakeetModel>} Loaded Parakeet model instance.
 * @example
 * import { fromHub } from 'parakeet.js';
 * const model = await fromHub('ysdede/parakeet-tdt-0.6b-v3-onnx', { decoderQuant: 'int8' });
 *
 * // Or use a model key for known models:
 * const model = await fromHub('parakeet-tdt-0.6b-v3', { backend: 'webgpu-hybrid' });
 */
export async function fromHub(repoIdOrModelKey, options = {}) {
  const repoId = MODELS[repoIdOrModelKey]?.repoId || repoIdOrModelKey;
  const result = await getParakeetModel(repoId, options);
  const fromUrlsConfig = {
    ...result.urls,
    filenames: result.filenames,
    preprocessorBackend: result.preprocessorBackend,
    ...options,
  };

  try {
    return await ParakeetModel.fromUrls(fromUrlsConfig);
  } catch (error) {
    if (!usesRequestedFp16(options)) {
      throw error;
    }

    const hint = buildFp16CompileHint(options);
    const baseMessage = error?.message || String(error);
    console.warn(`[fromHub] FP16 compile/session load failed. ${hint}`, error);
    throw new Error(`[fromHub] FP16 compile/session load failed. ${hint} Original error: ${baseMessage}`);
  }
}
