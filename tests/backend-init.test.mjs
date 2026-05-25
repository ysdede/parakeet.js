import { describe, expect, it } from 'vitest';
import { initOrt } from '../src/backend.js';

describe('initOrt singleton', () => {
  it('returns the same promise on concurrent calls', () => {
    const p1 = initOrt({ backend: 'wasm' });
    const p2 = initOrt({ backend: 'wasm' });
    expect(p1).toBe(p2); // same promise object — no duplicate init
  });

  it('resolves to the ort module', async () => {
    const ort = await initOrt({ backend: 'wasm' });
    expect(ort).toBeDefined();
    expect(typeof ort.InferenceSession?.create).toBe('function');
    expect(typeof ort.Tensor).toBe('function');
  });

  it('shares result across subsequent calls', async () => {
    const ort1 = await initOrt({ backend: 'wasm' });
    const ort2 = await initOrt({ backend: 'wasm' });
    expect(ort1).toBe(ort2); // same ort instance from shared promise
  });
});
