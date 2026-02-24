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

function buildRetryOptions(options, quantisation) {
  const retryOptions = { ...options };
  if (quantisation?.encoder === 'fp16') retryOptions.encoderQuant = 'fp32';
  if (quantisation?.decoder === 'fp16') retryOptions.decoderQuant = 'fp32';
  return retryOptions;
}

function revokeBlobUrls(urls) {
  for (const value of Object.values(urls || {})) {
    if (typeof value === 'string' && value.startsWith('blob:')) {
      URL.revokeObjectURL(value);
    }
  }
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
    if (!shouldRetryWithFp32(firstModelUrls.quantisation)) {
      throw firstError;
    }

    // Free first-attempt blobs before downloading retry artifacts.
    revokeBlobUrls(firstModelUrls.urls);

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
