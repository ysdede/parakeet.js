import { describe, it, expect, vi } from 'vitest';
import { ParakeetModel } from '../src/parakeet.js';

function createMockOrt() {
  return {
    Tensor: class {
      constructor(type, data, dims) {
        this.type = type;
        this.data = data;
        this.dims = dims;
      }
      dispose() {}
    },
  };
}

function createMockTokenizer() {
  return {
    blankId: 0,
    blankToken: '<blank>',
    id2token: ['<blank>', 'A', 'B'],
    sanitizedTokens: ['<blank>', 'A', 'B'],
    decode: (ids) => ids.map((id) => (id === 1 ? 'A' : id === 2 ? 'B' : '')).join(''),
  };
}

function createModelForDecodeLoop({ tEnc, joinerRun }) {
  const D = 4;
  const encoderSession = {
    run: vi.fn().mockResolvedValue({
      outputs: {
        dims: [1, D, tEnc],
        data: new Float32Array(D * tEnc).fill(0.1),
        dispose: vi.fn(),
      },
    }),
  };

  const preprocessor = {
    process: vi.fn().mockResolvedValue({
      features: new Float32Array(128 * Math.max(1, tEnc)).fill(0.1),
      length: Math.max(1, tEnc),
    }),
    nMels: 128,
  };

  return new ParakeetModel({
    tokenizer: createMockTokenizer(),
    encoderSession,
    joinerSession: { run: joinerRun },
    preprocessor,
    ort: createMockOrt(),
    nMels: 128,
  });
}

function makeJoinerOutput(tokenLogits, durLogits) {
  const data = new Float32Array([...tokenLogits, ...durLogits]);
  const state1 = new Float32Array([tokenLogits[0] || 0, tokenLogits[1] || 0, 0, 0]);
  const state2 = new Float32Array([durLogits[0] || 0, durLogits[1] || 0, 0, 0]);
  return {
    outputs: {
      dims: [1, 1, 1, data.length],
      data,
      dispose: vi.fn(),
    },
    output_states_1: {
      dims: [1, 1, state1.length],
      data: state1,
      dispose: vi.fn(),
    },
    output_states_2: {
      dims: [1, 1, state2.length],
      data: state2,
      dispose: vi.fn(),
    },
  };
}

describe('ParakeetModel decode loop', () => {
  it('emits multiple non-blank tokens on the same frame when step=0', async () => {
    const queue = [
      makeJoinerOutput([0.1, 9.0, 0.2], [5.0, 1.0, 0.1]), // token=1, step=0
      makeJoinerOutput([0.1, 0.2, 9.0], [5.0, 1.0, 0.1]), // token=2, step=0
      makeJoinerOutput([9.0, 0.1, 0.2], [5.0, 1.0, 0.1]), // blank, step=0
    ];

    let idx = 0;
    const joinerRun = vi.fn().mockImplementation(async () => {
      const out = queue[Math.min(idx, queue.length - 1)];
      idx += 1;
      return out;
    });

    const model = createModelForDecodeLoop({ tEnc: 1, joinerRun });
    const result = await model.transcribe(new Float32Array(16000), 16000, {
      returnTokenIds: true,
      returnFrameIndices: true,
      returnTdtSteps: true,
      enableProfiling: false,
    });

    expect(result.tokenIds).toEqual([1, 2]);
    expect(result.frameIndices).toEqual([0, 0]);
    expect(result.tdtSteps).toEqual([0, 0]);
    expect(result.utterance_text).toBe('AB');
    expect(joinerRun).toHaveBeenCalledTimes(3);
  });

  it('advances frame index by TDT step when step>0', async () => {
    const queue = [
      makeJoinerOutput([0.1, 9.0, 0.2], [0.1, 0.2, 9.0]), // token=1, step=2
      makeJoinerOutput([9.0, 0.1, 0.2], [9.0, 0.2, 0.1]), // blank @ frame 2
      makeJoinerOutput([9.0, 0.1, 0.2], [9.0, 0.2, 0.1]), // blank @ frame 3
      makeJoinerOutput([9.0, 0.1, 0.2], [9.0, 0.2, 0.1]), // blank @ frame 4
    ];

    let idx = 0;
    const joinerRun = vi.fn().mockImplementation(async () => {
      const out = queue[Math.min(idx, queue.length - 1)];
      idx += 1;
      return out;
    });

    const model = createModelForDecodeLoop({ tEnc: 5, joinerRun });
    const result = await model.transcribe(new Float32Array(16000), 16000, {
      returnTokenIds: true,
      returnFrameIndices: true,
      returnTdtSteps: true,
      enableProfiling: false,
    });

    expect(result.tokenIds).toEqual([1]);
    expect(result.frameIndices).toEqual([0]);
    expect(result.tdtSteps).toEqual([2]);
    expect(joinerRun).toHaveBeenCalledTimes(4);
  });

  it('stops decoding when cumulative TDT step overshoots tEnc', async () => {
    const queue = [
      makeJoinerOutput([0.1, 9.0, 0.2], [0.1, 0.2, 9.0]), // token=1, step=2 at frame 0
      makeJoinerOutput([0.1, 9.0, 0.2], [0.1, 0.2, 9.0]), // token=1, step=2 at frame 2 => overshoot
    ];

    let idx = 0;
    const joinerRun = vi.fn().mockImplementation(async () => {
      const out = queue[Math.min(idx, queue.length - 1)];
      idx += 1;
      return out;
    });

    const model = createModelForDecodeLoop({ tEnc: 3, joinerRun });
    const result = await model.transcribe(new Float32Array(16000), 16000, {
      returnTokenIds: true,
      returnFrameIndices: true,
      returnTdtSteps: true,
      enableProfiling: false,
    });

    expect(result.tokenIds).toEqual([1, 1]);
    expect(result.frameIndices).toEqual([0, 2]);
    expect(result.tdtSteps).toEqual([2, 2]);
    expect(result.utterance_text).toBe('AA');
    expect(result.frameIndices.every((i) => i <= 2)).toBe(true);
    expect(joinerRun).toHaveBeenCalledTimes(2);
  });
});
