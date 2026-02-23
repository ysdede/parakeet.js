import { afterEach, describe, expect, it, vi } from 'vitest';
import { getParakeetModel } from '../src/hub.js';

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function binaryResponse(status = 200) {
  return new Response(new Uint8Array([1, 2, 3]), {
    status,
    headers: {
      'content-type': 'application/octet-stream',
      'content-length': '3',
    },
  });
}

function installFetchMock({ repoId, siblings, missing = [] }) {
  const missingSet = new Set(missing);
  const calls = [];

  const mock = vi.fn(async (url) => {
    const href = String(url);
    calls.push(href);

    if (href.includes(`/api/models/${repoId}`)) {
      return jsonResponse({
        siblings: siblings.map((name) => ({ rfilename: name })),
      });
    }

    const match = href.match(/\/resolve\/[^/]+\/(.+)$/);
    if (!match) return binaryResponse(404);
    const filename = match[1];
    if (missingSet.has(filename)) {
      return new Response('missing', { status: 404, statusText: 'Not Found' });
    }
    return binaryResponse(200);
  });

  vi.stubGlobal('fetch', mock);
  vi.stubGlobal('indexedDB', undefined);
  return { calls, mock };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('getParakeetModel quantization resolution', () => {
  it('uses FP16 files when available', async () => {
    const repoId = 'test/repo-fp16-present';
    installFetchMock({
      repoId,
      siblings: [
        'encoder-model.fp16.onnx',
        'decoder_joint-model.fp16.onnx',
        'vocab.txt',
      ],
    });

    const res = await getParakeetModel(repoId, {
      backend: 'webgpu-hybrid',
      encoderQuant: 'fp16',
      decoderQuant: 'fp16',
      preprocessorBackend: 'js',
    });

    expect(res.filenames.encoder).toBe('encoder-model.fp16.onnx');
    expect(res.filenames.decoder).toBe('decoder_joint-model.fp16.onnx');
    expect(res.quantisation.encoder).toBe('fp16');
    expect(res.quantisation.decoder).toBe('fp16');
  });

  it('falls back FP16 to FP32 when FP16 files are missing', async () => {
    const repoId = 'test/repo-fp16-fallback';
    const { calls } = installFetchMock({
      repoId,
      siblings: [
        'encoder-model.onnx',
        'decoder_joint-model.onnx',
        'vocab.txt',
      ],
    });

    const res = await getParakeetModel(repoId, {
      backend: 'webgpu-hybrid',
      encoderQuant: 'fp16',
      decoderQuant: 'fp16',
      preprocessorBackend: 'js',
    });

    expect(res.filenames.encoder).toBe('encoder-model.onnx');
    expect(res.filenames.decoder).toBe('decoder_joint-model.onnx');
    expect(res.quantisation.encoder).toBe('fp32');
    expect(res.quantisation.decoder).toBe('fp32');
    expect(calls.some((x) => x.includes('encoder-model.fp16.onnx'))).toBe(false);
    expect(calls.some((x) => x.includes('decoder_joint-model.fp16.onnx'))).toBe(false);
  });

  it('throws actionable error when both FP16 and FP32 are unavailable', async () => {
    const repoId = 'test/repo-fp16-missing';
    installFetchMock({
      repoId,
      siblings: [
        'encoder-model.int8.onnx',
        'decoder_joint-model.int8.onnx',
        'vocab.txt',
      ],
    });

    await expect(
      getParakeetModel(repoId, {
        backend: 'webgpu-hybrid',
        encoderQuant: 'fp16',
        decoderQuant: 'fp16',
        preprocessorBackend: 'js',
      })
    ).rejects.toThrow(/requested encoder-model\.fp16\.onnx/i);
  });

  it('keeps webgpu int8 encoder override behavior', async () => {
    const repoId = 'test/repo-webgpu-int8';
    installFetchMock({
      repoId,
      siblings: [
        'encoder-model.onnx',
        'decoder_joint-model.int8.onnx',
        'vocab.txt',
      ],
    });

    const res = await getParakeetModel(repoId, {
      backend: 'webgpu-hybrid',
      encoderQuant: 'int8',
      decoderQuant: 'int8',
      preprocessorBackend: 'js',
    });

    expect(res.filenames.encoder).toBe('encoder-model.onnx');
    expect(res.quantisation.encoder).toBe('fp32');
    expect(res.filenames.decoder).toBe('decoder_joint-model.int8.onnx');
    expect(res.quantisation.decoder).toBe('int8');
  });

  it('encodes slash branch names in API and resolve URLs', async () => {
    const repoId = 'test/repo-branch-slash';
    const revision = 'feat/fp16-canonical-v2';
    const { calls } = installFetchMock({
      repoId,
      siblings: [
        'encoder-model.fp16.onnx',
        'decoder_joint-model.fp16.onnx',
        'vocab.txt',
      ],
    });

    const res = await getParakeetModel(repoId, {
      revision,
      backend: 'webgpu-hybrid',
      encoderQuant: 'fp16',
      decoderQuant: 'fp16',
      preprocessorBackend: 'js',
    });

    expect(res.filenames.encoder).toBe('encoder-model.fp16.onnx');
    expect(calls.some((x) => x.includes(`/api/models/${repoId}?revision=feat%2Ffp16-canonical-v2`))).toBe(true);
    expect(calls.some((x) => x.includes('/resolve/feat%2Ffp16-canonical-v2/encoder-model.fp16.onnx'))).toBe(true);
  });
});
