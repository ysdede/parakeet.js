import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fromUrls, fromHub } from '../src/index.js';
import { ParakeetModel } from '../src/parakeet.js';
import { getParakeetModel } from '../src/hub.js';

vi.mock('../src/parakeet.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    ParakeetModel: {
      fromUrls: vi.fn(),
    },
  };
});

vi.mock('../src/hub.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    getParakeetModel: vi.fn(),
  };
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('index.js', () => {
  it('fromUrls should call ParakeetModel.fromUrls', async () => {
    const cfg = { some: 'config' };
    await fromUrls(cfg);
    expect(ParakeetModel.fromUrls).toHaveBeenCalledWith(cfg);
  });

  it('fromHub should call getParakeetModel and ParakeetModel.fromUrls once', async () => {
    const repoId = 'some-repo';
    const options = { opt: 'val' };
    const mockModelData = {
      urls: { u: 1 },
      filenames: { f: 1 },
      preprocessorBackend: 'js',
      quantisation: { encoder: 'fp16', decoder: 'fp16' },
    };

    getParakeetModel.mockResolvedValue(mockModelData);

    await fromHub(repoId, options);

    expect(getParakeetModel).toHaveBeenCalledWith(repoId, options);
    expect(getParakeetModel).toHaveBeenCalledTimes(1);
    expect(ParakeetModel.fromUrls).toHaveBeenCalledTimes(1);
    expect(ParakeetModel.fromUrls).toHaveBeenCalledWith({
      ...mockModelData.urls,
      filenames: mockModelData.filenames,
      preprocessorBackend: mockModelData.preprocessorBackend,
      ...options,
    });
  });

  it('fromHub should throw actionable FP16 compile hint without internal retry', async () => {
    const repoId = 'some-repo';
    const options = { backend: 'webgpu-hybrid', encoderQuant: 'fp16', decoderQuant: 'fp16' };

    const modelData = {
      urls: { encoderUrl: 'enc-fp16', decoderUrl: 'dec-fp16', tokenizerUrl: 'tok' },
      filenames: { encoder: 'encoder-model.fp16.onnx', decoder: 'decoder_joint-model.fp16.onnx' },
      preprocessorBackend: 'js',
      quantisation: { encoder: 'fp16', decoder: 'fp16' },
    };

    getParakeetModel.mockResolvedValue(modelData);
    ParakeetModel.fromUrls.mockRejectedValue(new Error('compile failed'));

    const error = await fromHub(repoId, options).catch((err) => err);
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toMatch(/FP16 compile\/session load failed/i);
    expect(error.message).toMatch(/decoderQuant: 'int8' or 'fp32'/i);
    expect(error.message).toMatch(/compile failed/i);
    expect(getParakeetModel).toHaveBeenCalledTimes(1);
    expect(ParakeetModel.fromUrls).toHaveBeenCalledTimes(1);
  });
});
