export function formatResolvedQuantization(quantisation) {
  return `Resolved quantization: encoder=${quantisation.encoder}, decoder=${quantisation.decoder}`;
}

function toFromUrlsConfig(modelUrls, options) {
  const {
    backend,
    verbose,
    cpuThreads,
  } = options || {};

  return {
    ...modelUrls.urls,
    filenames: modelUrls.filenames,
    preprocessorBackend: modelUrls.preprocessorBackend,
    backend,
    verbose,
    cpuThreads,
  };
}

function shouldRetryWithFp32(quantisation) {
  return quantisation?.encoder === 'fp16' || quantisation?.decoder === 'fp16';
}

/**
 * Check whether an error is likely FP16-related (compilation/capability).
 * Only these errors warrant an FP32 fallback retry; other errors should
 * propagate directly to avoid wasted re-download and re-compile cycles.
 *
 * @param {*} err - Error from ORT session creation or model compilation.
 * @param {{encoder: string, decoder: string}} quantisation - Resolved quantization.
 * @returns {boolean}
 */
function isFp16RelatedError(err, quantisation) {
  const message = (err?.message || String(err)).toLowerCase();
  // Direct FP16 mentions in error
  if (message.includes('fp16')) return true;
  // ORT session creation / compilation failures when FP16 was requested
  if (quantisation?.encoder === 'fp16' || quantisation?.decoder === 'fp16') {
    if (message.includes('compile') || message.includes('session') || message.includes('create')) {
      return true;
    }
  }
  return false;
}

function buildRetryOptions(options, quantisation) {
  const retryOptions = { ...options };
  if (quantisation?.encoder === 'fp16') retryOptions.encoderQuant = 'fp32';
  if (quantisation?.decoder === 'fp16') retryOptions.decoderQuant = 'fp32';
  return retryOptions;
}

/**
 * Resolve model assets from hub and compile with one FP16 -> FP32 runtime retry.
 *
 * @param {Object} params
 * @param {string} params.repoIdOrModelKey
 * @param {Object} params.options
 * @param {(repoIdOrModelKey: string, options: Object) => Promise<any>} params.getParakeetModelFn
 * @param {(cfg: Object) => Promise<any>} params.fromUrlsFn
 * @param {(ctx: {attempt: number, modelUrls: any, options: Object}) => void} [params.onBeforeCompile]
 * @returns {Promise<{model: any, modelUrls: any, retryUsed: boolean}>}
 */
export async function loadModelWithFallback({
  repoIdOrModelKey,
  options,
  getParakeetModelFn,
  fromUrlsFn,
  onBeforeCompile,
}) {
  const firstModelUrls = await getParakeetModelFn(repoIdOrModelKey, options);
  onBeforeCompile?.({ attempt: 1, modelUrls: firstModelUrls, options });

  try {
    const model = await fromUrlsFn(toFromUrlsConfig(firstModelUrls, options));
    return { model, modelUrls: firstModelUrls, retryUsed: false };
  } catch (firstError) {
    if (!shouldRetryWithFp32(firstModelUrls.quantisation) || !isFp16RelatedError(firstError, firstModelUrls.quantisation)) {
      throw firstError;
    }

    const retryOptions = buildRetryOptions(options, firstModelUrls.quantisation);
    let retryModelUrls;
    try {
      retryModelUrls = await getParakeetModelFn(repoIdOrModelKey, retryOptions);
    } catch (retryDownloadError) {
      const firstMessage = firstError?.message || String(firstError);
      const retryDownloadMessage = retryDownloadError?.message || String(retryDownloadError);
      throw new Error(
        `[ModelLoader] Initial compile failed (${firstMessage}). FP32 retry download failed (${retryDownloadMessage}).`
      );
    }

    onBeforeCompile?.({ attempt: 2, modelUrls: retryModelUrls, options: retryOptions });

    try {
      const model = await fromUrlsFn(toFromUrlsConfig(retryModelUrls, retryOptions));
      return { model, modelUrls: retryModelUrls, retryUsed: true };
    } catch (retryError) {
      const firstMessage = firstError?.message || String(firstError);
      const retryMessage = retryError?.message || String(retryError);
      throw new Error(
        `[ModelLoader] Initial compile failed (${firstMessage}). FP32 retry also failed (${retryMessage}).`
      );
    }
  }
}
