import { describe, it, expect, vi } from 'vitest';
import { ParakeetModel } from '../src/parakeet.js';

describe('ParakeetModel Incremental Cache', () => {
  const mockOrt = {
    Tensor: class {
      constructor(type, data, dims) {
        this.type = type;
        this.data = data;
        this.dims = dims;
      }
      dispose() {}
    }
  };

  const mockTokenizer = {
    blankId: 0,
    blankToken: '<blank>',
    id2token: ['<blank>', 'a', 'b'],
    decode: () => 'test',
  };

  const mockEncoderSession = {
    run: async () => ({
      outputs: {
        dims: [1, 64, 10], // B, D, T
        data: new Float32Array(64 * 10).fill(0.1),
      }
    }),
  };

  // Return blank token so we advance frames quickly
  const mockJoinerSession = {
    run: async () => ({
      outputs: {
        dims: [1, 1, 1, 3], // B, U, V, vocab (3) + dur (0)
        data: new Float32Array([0.8, 0.1, 0.1]), // logits, index 0 (blank) is max
      },
      output_states_1: { data: new Float32Array(10), dims: [1, 1, 10] },
      output_states_2: { data: new Float32Array(10), dims: [1, 1, 10] },
    }),
  };

  const mockPreprocessor = {
    process: async () => ({
      features: new Float32Array(128 * 10).fill(0.1),
      length: 10,
    }),
    nMels: 128
  };

  it('should respect maxIncrementalCacheSize and evict oldest entries', async () => {
    // Set small limit for testing
    const model = new ParakeetModel({
      tokenizer: mockTokenizer,
      encoderSession: mockEncoderSession,
      joinerSession: mockJoinerSession,
      preprocessor: mockPreprocessor,
      ort: mockOrt,
      nMels: 128,
      maxIncrementalCacheSize: 5,
    });

    expect(model._incrementalCache.size).toBe(0);

    // Add 10 items
    for (let i = 0; i < 10; i++) {
      await model.transcribe(new Float32Array(16000), 16000, {
        incremental: { cacheKey: `key-${i}`, prefixSeconds: 0.1 },
      });
    }

    // Size should be capped at 5
    expect(model._incrementalCache.size).toBe(5);

    // Should contain the last 5 keys (5-9)
    for (let i = 5; i < 10; i++) {
      expect(model._incrementalCache.has(`key-${i}`)).toBe(true);
    }
    // Should NOT contain the first 5 keys (0-4)
    for (let i = 0; i < 5; i++) {
      expect(model._incrementalCache.has(`key-${i}`)).toBe(false);
    }
  });

  it('should clear cache via clearIncrementalCache()', async () => {
    const model = new ParakeetModel({
      tokenizer: mockTokenizer,
      encoderSession: mockEncoderSession,
      joinerSession: mockJoinerSession,
      preprocessor: mockPreprocessor,
      ort: mockOrt,
      nMels: 128,
    });

    await model.transcribe(new Float32Array(16000), 16000, {
      incremental: { cacheKey: `key-1`, prefixSeconds: 0.1 },
    });

    expect(model._incrementalCache.size).toBe(1);

    model.clearIncrementalCache();

    expect(model._incrementalCache.size).toBe(0);
  });

  it('should skip prefix frames only when cacheKey and prefixSeconds match', async () => {
    const joinerRun = vi.fn().mockResolvedValue({
      outputs: {
        dims: [1, 1, 1, 3],
        data: new Float32Array([0.8, 0.1, 0.1]), // blank
      },
      output_states_1: { data: new Float32Array(10), dims: [1, 1, 10] },
      output_states_2: { data: new Float32Array(10), dims: [1, 1, 10] },
    });

    const model = new ParakeetModel({
      tokenizer: mockTokenizer,
      encoderSession: mockEncoderSession,
      joinerSession: { run: joinerRun },
      preprocessor: mockPreprocessor,
      ort: mockOrt,
      nMels: 128,
    });

    // First call seeds cache for key "k" at prefix=0.16s => 2 encoder frames
    await model.transcribe(new Float32Array(16000), 16000, {
      incremental: { cacheKey: 'k', prefixSeconds: 0.16 },
      enableProfiling: false,
    });
    const callsAfterSeed = joinerRun.mock.calls.length;
    expect(callsAfterSeed).toBe(10);

    // Matching cacheKey + prefixSeconds should skip 2 frames => 8 decode steps
    await model.transcribe(new Float32Array(16000), 16000, {
      incremental: { cacheKey: 'k', prefixSeconds: 0.16 },
      enableProfiling: false,
    });
    const callsAfterHit = joinerRun.mock.calls.length - callsAfterSeed;
    expect(callsAfterHit).toBe(8);

    // Different prefixSeconds for same key must miss cache => full 10 steps
    await model.transcribe(new Float32Array(16000), 16000, {
      incremental: { cacheKey: 'k', prefixSeconds: 0.24 },
      enableProfiling: false,
    });
    const callsAfterPrefixMismatch = joinerRun.mock.calls.length - callsAfterSeed - callsAfterHit;
    expect(callsAfterPrefixMismatch).toBe(10);

    // Different key must also miss cache => full 10 steps
    await model.transcribe(new Float32Array(16000), 16000, {
      incremental: { cacheKey: 'k2', prefixSeconds: 0.16 },
      enableProfiling: false,
    });
    const callsAfterKeyMismatch = joinerRun.mock.calls.length - callsAfterSeed - callsAfterHit - callsAfterPrefixMismatch;
    expect(callsAfterKeyMismatch).toBe(10);
  });
});
