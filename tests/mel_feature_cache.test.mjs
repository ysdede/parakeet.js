import { describe, it, expect, vi } from 'vitest';
import { MelFeatureCache } from '../src/parakeet.js';

describe('MelFeatureCache', () => {
  it('rejects invalid cache size limits', () => {
    expect(() => new MelFeatureCache({ maxCacheSizeMB: Number.NaN })).toThrow('non-negative number');
    expect(() => new MelFeatureCache({ maxCacheSizeMB: -1 })).toThrow('non-negative number');
  });

  it('treats zero cache size as disabled cache for compatibility', async () => {
    const cache = new MelFeatureCache({ maxCacheSizeMB: 0 });
    const audio = new Float32Array(1600);
    const model = {
      computeFeatures: vi.fn().mockResolvedValue({
        features: new Float32Array(1024),
        T: 8,
        melBins: 128,
      }),
    };

    const first = await cache.getFeatures(model, audio);
    const second = await cache.getFeatures(model, audio);

    expect(first.cached).toBe(false);
    expect(second.cached).toBe(false);
    expect(model.computeFeatures).toHaveBeenCalledTimes(2);
    expect(cache.getStats()).toEqual({
      entries: 0,
      sizeMB: '0.00',
      maxSizeMB: 0,
    });
  });

  it('hashes the full audio buffer when generating cache keys', () => {
    const cache = new MelFeatureCache({ maxCacheSizeMB: 1 });
    const first = new Float32Array(4096);
    const second = new Float32Array(4096);

    second[2048] = 0.25;

    expect(cache._generateKey(first)).not.toBe(cache._generateKey(second));
  });

  it('uses a deterministic large-buffer hash path for huge audio buffers', () => {
    const cache = new MelFeatureCache({ maxCacheSizeMB: 1 });
    const first = new Float32Array(1_100_000);
    const second = new Float32Array(1_100_000);

    second[1_099_999] = 0.25;

    expect(cache._generateKey(first)).not.toBe(cache._generateKey(second));
  });

  it('does not cache entries that exceed the cache size by themselves', async () => {
    const cache = new MelFeatureCache({ maxCacheSizeMB: 0.001 });
    const audio = new Float32Array(1600);
    const model = {
      computeFeatures: vi.fn().mockResolvedValue({
        features: new Float32Array(1024),
        T: 8,
        melBins: 128,
      }),
    };

    const first = await cache.getFeatures(model, audio);
    const second = await cache.getFeatures(model, audio);

    expect(first.cached).toBe(false);
    expect(second.cached).toBe(false);
    expect(model.computeFeatures).toHaveBeenCalledTimes(2);
    expect(cache.getStats().entries).toBe(0);
  });
});
