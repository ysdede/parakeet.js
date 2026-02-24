import { describe, expect, it } from 'vitest';
import { getModelKeyFromRepoId } from '../src/models.js';

describe('models.getModelKeyFromRepoId', () => {
  it('returns model key for unique repoId', () => {
    expect(getModelKeyFromRepoId('ysdede/parakeet-tdt-0.6b-v2-onnx')).toBe('parakeet-tdt-0.6b-v2');
  });

  it('returns model key for v3 repoId', () => {
    expect(getModelKeyFromRepoId('ysdede/parakeet-tdt-0.6b-v3-onnx')).toBe('parakeet-tdt-0.6b-v3');
  });

  it('returns null for unknown repoId', () => {
    expect(getModelKeyFromRepoId('unknown/repo')).toBeNull();
  });
});
