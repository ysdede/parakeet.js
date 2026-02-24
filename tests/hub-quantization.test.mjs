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

function installFetchMock({
  repoId,
  siblings = [],
  missing = [],
  treeFiles,
  treeShouldFail = false,
  metadataShouldFail = false,
}) {
  const missingSet = new Set(missing);
  const calls = [];
  const state = {
    treeCalls: 0,
    metadataCalls: 0,
  };

  const mock = vi.fn(async (url) => {
    const href = String(url);
    calls.push(href);

    if (href.includes(`/api/models/${repoId}/tree/`)) {
      state.treeCalls += 1;
      const failTree = treeShouldFail === true || (typeof treeShouldFail === 'number' && state.treeCalls <= treeShouldFail);
      if (failTree) {
        return jsonResponse({ error: 'tree failed' }, 500);
      }

      if (Array.isArray(treeFiles)) {
        return jsonResponse(treeFiles);
      }

      return jsonResponse(
        siblings.map((name) => ({ type: 'file', path: name }))
      );
    }

    if (href.includes(`/api/models/${repoId}`)) {
      state.metadataCalls += 1;
      const failMetadata =
        metadataShouldFail === true ||
        (typeof metadataShouldFail === 'number' && state.metadataCalls <= metadataShouldFail);
      if (failMetadata) {
        return jsonResponse({ error: 'metadata failed' }, 500);
      }

      return jsonResponse({
        siblings: siblings.map((name) => ({ rfilename: name })),
      });
    }

    const match = href.match(/\/resolve\/[^/]+\/(.+)$/);
    if (!match) return binaryResponse(404);

    const filename = decodeURIComponent(match[1]);
    if (missingSet.has(filename)) {
      return new Response('missing', { status: 404, statusText: 'Not Found' });
    }

    return binaryResponse(200);
  });

  vi.stubGlobal('fetch', mock);
  vi.stubGlobal('indexedDB', undefined);
  return { calls, mock, state };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('getParakeetModel quantization resolution (strict mode)', () => {
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

  it('uses tree API array shape for quantization resolution', async () => {
    const repoId = 'test/repo-tree-shape';
    installFetchMock({
      repoId,
      siblings: [],
      treeFiles: [
        { type: 'file', path: 'nested/encoder-model.fp16.onnx' },
        { type: 'file', path: 'nested/decoder_joint-model.fp16.onnx' },
        { type: 'file', path: 'vocab.txt' },
      ],
    });

    const res = await getParakeetModel(repoId, {
      backend: 'webgpu-hybrid',
      encoderQuant: 'fp16',
      decoderQuant: 'fp16',
      preprocessorBackend: 'js',
    });

    expect(res.quantisation.encoder).toBe('fp16');
    expect(res.quantisation.decoder).toBe('fp16');
  });

  it('falls back to metadata listing when tree API fails', async () => {
    const repoId = 'test/repo-tree-fails';
    const { state } = installFetchMock({
      repoId,
      treeShouldFail: true,
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

    expect(state.treeCalls).toBeGreaterThan(0);
    expect(state.metadataCalls).toBeGreaterThan(0);
    expect(res.quantisation.encoder).toBe('fp16');
    expect(res.quantisation.decoder).toBe('fp16');
  });

  it('throws explicit error when FP16 is missing but FP32 exists', async () => {
    const repoId = 'test/repo-fp16-missing-but-fp32-present';
    const { calls } = installFetchMock({
      repoId,
      siblings: [
        'encoder-model.onnx',
        'decoder_joint-model.onnx',
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
    ).rejects.toThrow(/strict|explicitly/i);

    // Error is preflight, before resolve downloads.
    expect(calls.some((x) => x.includes('/resolve/'))).toBe(false);
  });

  it('throws explicit error when FP16 download fails and listing is unavailable', async () => {
    const repoId = 'test/repo-fp16-download-fail-strict';
    const { calls } = installFetchMock({
      repoId,
      treeShouldFail: true,
      metadataShouldFail: true,
      missing: [
        'encoder-model.fp16.onnx',
      ],
      siblings: [
        'encoder-model.fp16.onnx',
        'decoder_joint-model.fp16.onnx',
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
    ).rejects.toThrow(/strict|explicitly/i);

    expect(calls.some((x) => x.includes('encoder-model.fp16.onnx'))).toBe(true);
    expect(calls.some((x) => x.includes('encoder-model.onnx'))).toBe(false);
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

  it('does not cache failed file-listing lookups', async () => {
    const repoId = 'test/repo-no-cache-poison';
    const { state } = installFetchMock({
      repoId,
      // Fail first listing attempt only, then recover.
      treeShouldFail: 1,
      metadataShouldFail: 1,
      treeFiles: [
        { type: 'file', path: 'encoder-model.fp16.onnx' },
        { type: 'file', path: 'decoder_joint-model.fp16.onnx' },
        { type: 'file', path: 'vocab.txt' },
      ],
      siblings: [
        'encoder-model.fp16.onnx',
        'decoder_joint-model.fp16.onnx',
        'vocab.txt',
      ],
    });

    const first = await getParakeetModel(repoId, {
      backend: 'webgpu-hybrid',
      encoderQuant: 'fp16',
      decoderQuant: 'fp16',
      preprocessorBackend: 'js',
    });

    const second = await getParakeetModel(repoId, {
      backend: 'webgpu-hybrid',
      encoderQuant: 'fp16',
      decoderQuant: 'fp16',
      preprocessorBackend: 'js',
    });

    expect(first.quantisation.encoder).toBe('fp16');
    expect(second.quantisation.encoder).toBe('fp16');
    expect(state.treeCalls).toBeGreaterThanOrEqual(2);
  });

  it('skips optional .data downloads when listing is unavailable', async () => {
    const repoId = 'test/repo-no-listing-no-data-probe';
    const { calls } = installFetchMock({
      repoId,
      treeShouldFail: true,
      metadataShouldFail: true,
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

    expect(res.quantisation.encoder).toBe('fp16');
    expect(calls.some((x) => x.includes('.onnx.data'))).toBe(false);
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
    expect(calls.some((x) => x.includes(`/api/models/${repoId}/tree/feat%2Ffp16-canonical-v2`))).toBe(true);
    expect(calls.some((x) => x.includes('/resolve/feat%2Ffp16-canonical-v2/encoder-model.fp16.onnx'))).toBe(true);
  });
});
