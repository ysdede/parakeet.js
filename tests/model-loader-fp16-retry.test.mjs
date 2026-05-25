import { describe, expect, it, vi } from 'vitest';
import { loadModelWithFallback } from '../examples/demo/src/shared/modelLoader.js';

function stubModelUrls(overrides = {}) {
  return {
    urls: { encoderUrl: 'blob:enc', decoderUrl: 'blob:dec', tokenizerUrl: 'blob:vocab' },
    filenames: { encoder: 'enc.onnx', decoder: 'dec.onnx' },
    preprocessorBackend: 'js',
    quantisation: { encoder: 'fp16', decoder: 'fp16', ...overrides.quantisation },
    ...overrides,
  };
}

function stubOptions() {
  return { backend: 'webgpu', encoderQuant: 'fp16', decoderQuant: 'fp16' };
}

describe('loadModelWithFallback FP16 retry scoping', () => {
  it('retries with FP32 on FP16 compile failure', async () => {
    const getModelFn = vi.fn().mockResolvedValue(stubModelUrls());
    const fromUrlsFn = vi
      .fn()
      .mockRejectedValueOnce(new Error('compile failed'))
      .mockResolvedValueOnce({});

    const result = await loadModelWithFallback({
      repoIdOrModelKey: 'test/model',
      options: stubOptions(),
      getParakeetModelFn: getModelFn,
      fromUrlsFn,
    });

    expect(result.retryUsed).toBe(true);
    expect(getModelFn).toHaveBeenCalledTimes(2);
    expect(getModelFn.mock.calls[1][1].encoderQuant).toBe('fp32');
    expect(getModelFn.mock.calls[1][1].decoderQuant).toBe('fp32');
  });

  it('does NOT retry when no FP16 quantization was requested', async () => {
    const getModelFn = vi.fn().mockResolvedValue(stubModelUrls({
      quantisation: { encoder: 'fp32', decoder: 'int8' },
    }));
    const fromUrlsFn = vi.fn().mockRejectedValue(new Error('compile failed'));

    await expect(
      loadModelWithFallback({
        repoIdOrModelKey: 'test/model',
        options: { ...stubOptions(), encoderQuant: 'fp32', decoderQuant: 'int8' },
        getParakeetModelFn: getModelFn,
        fromUrlsFn,
      })
    ).rejects.toThrow('compile failed');

    expect(getModelFn).toHaveBeenCalledTimes(1); // no retry
  });

  it('does NOT retry on non-compile errors even with FP16', async () => {
    const getModelFn = vi.fn().mockResolvedValue(stubModelUrls());
    const fromUrlsFn = vi.fn().mockRejectedValue(new Error('network error'));

    await expect(
      loadModelWithFallback({
        repoIdOrModelKey: 'test/model',
        options: stubOptions(),
        getParakeetModelFn: getModelFn,
        fromUrlsFn,
      })
    ).rejects.toThrow('network error');

    expect(getModelFn).toHaveBeenCalledTimes(1); // no retry
  });

  it('retries on session creation failure with FP16', async () => {
    const getModelFn = vi.fn().mockResolvedValue(stubModelUrls());
    const fromUrlsFn = vi
      .fn()
      .mockRejectedValueOnce(new Error('session creation failed'))
      .mockResolvedValueOnce({});

    const result = await loadModelWithFallback({
      repoIdOrModelKey: 'test/model',
      options: stubOptions(),
      getParakeetModelFn: getModelFn,
      fromUrlsFn,
    });

    expect(result.retryUsed).toBe(true);
  });

  it('retries when error message contains "fp16" explicitly', async () => {
    const getModelFn = vi.fn().mockResolvedValue(stubModelUrls({
      quantisation: { encoder: 'fp16', decoder: 'fp16' },
    }));
    const fromUrlsFn = vi
      .fn()
      .mockRejectedValueOnce(new Error('FP16 shader compilation not supported'))
      .mockResolvedValueOnce({});

    const result = await loadModelWithFallback({
      repoIdOrModelKey: 'test/model',
      options: stubOptions(),
      getParakeetModelFn: getModelFn,
      fromUrlsFn,
    });

    expect(result.retryUsed).toBe(true);
  });
});
