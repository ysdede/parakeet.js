import { describe, it, expect } from 'vitest';
import { MelFeatureCache } from '../src/parakeet.js';

describe('MelFeatureCache', () => {
  it('rejects invalid cache size limits', () => {
    expect(() => new MelFeatureCache({ maxCacheSizeMB: 0 })).toThrow('positive number');
    expect(() => new MelFeatureCache({ maxCacheSizeMB: Number.NaN })).toThrow('positive number');
    expect(() => new MelFeatureCache({ maxCacheSizeMB: -1 })).toThrow('positive number');
  });

  it('hashes the full audio buffer when generating cache keys', () => {
    const cache = new MelFeatureCache({ maxCacheSizeMB: 1 });
    const first = new Float32Array(4096);
    const second = new Float32Array(4096);

    second[2048] = 0.25;

    expect(cache._generateKey(first)).not.toBe(cache._generateKey(second));
  });
});
