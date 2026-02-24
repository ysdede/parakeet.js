import { describe, expect, it, vi } from 'vitest';
import { loadModelWithFallback } from '../examples/shared/modelLoader.js';

describe('loadModelWithFallback', () => {
  it('preserves first compile error context when fp32 retry download fails', async () => {
    const getParakeetModelFn = vi
      .fn()
      .mockResolvedValueOnce({
        urls: {},
        filenames: {
          encoder: 'encoder-model.fp16.onnx',
          decoder: 'decoder_joint-model.int8.onnx',
        },
        quantisation: { encoder: 'fp16', decoder: 'int8' },
        preprocessorBackend: 'js',
      })
      .mockRejectedValueOnce(new Error('fp32 artifact download failed'));

    const fromUrlsFn = vi.fn().mockRejectedValueOnce(new Error('fp16 session compile failed'));

    await expect(
      loadModelWithFallback({
        repoIdOrModelKey: 'parakeet-tdt-0.6b-v3',
        options: { backend: 'webgpu-hybrid', encoderQuant: 'fp16', decoderQuant: 'int8' },
        getParakeetModelFn,
        fromUrlsFn,
      })
    ).rejects.toThrow(
      /Initial compile failed \(fp16 session compile failed\).*FP32 retry download failed \(fp32 artifact download failed\)/i
    );

    expect(getParakeetModelFn).toHaveBeenCalledTimes(2);
    expect(fromUrlsFn).toHaveBeenCalledTimes(1);
  });
});
