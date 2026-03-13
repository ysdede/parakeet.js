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

function createModelForDecodeLoop({ tEnc, joinerRun, encoderData = null }) {
  const D = 4;
  const encoded = encoderData || new Float32Array(D * tEnc).fill(0.1);
  const encoderSession = {
    run: vi.fn().mockResolvedValue({
      outputs: {
        dims: [1, D, tEnc],
        data: encoded,
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

function softmaxConfidence(logits, winnerIndex, temperature = 1) {
  const scaledWinner = logits[winnerIndex] / temperature;
  const sumExp = logits.reduce((sum, value) => sum + Math.exp((value / temperature) - scaledWinner), 0);
  return 1 / sumExp;
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

  it('clamps token end timestamps to the final encoder frame when TDT overshoots', async () => {
    const queue = [
      makeJoinerOutput([0.1, 9.0, 0.2], [0.1, 0.2, 9.0]), // token=1, step=2
      makeJoinerOutput([0.1, 0.2, 9.0], [0.1, 0.2, 9.0]), // token=2, step=2 at final frame
    ];

    let idx = 0;
    const joinerRun = vi.fn().mockImplementation(async () => {
      const out = queue[Math.min(idx, queue.length - 1)];
      idx += 1;
      return out;
    });

    const model = createModelForDecodeLoop({ tEnc: 3, joinerRun });
    const result = await model.transcribe(new Float32Array(16000), 16000, {
      returnTimestamps: true,
      enableProfiling: false,
    });

    expect(result.tokens.map((token) => [token.start_time, token.end_time])).toEqual([
      [0, 0.16],
      [0.16, 0.24],
    ]);
  });

  it('aggregates frame confidences once per encoder frame even with multiple token emissions', async () => {
    const queue = [
      { token: [0.1, 4.0, 0.2], step: [5.0, 1.0, 0.1] }, // token=1, step=0
      { token: [0.1, 0.2, 8.0], step: [5.0, 1.0, 0.1] }, // token=2, step=0
      { token: [9.0, 0.1, 0.2], step: [0.1, 9.0, 0.2] }, // blank, step=1 to exit
    ].map(({ token, step }) => makeJoinerOutput(token, step));

    let idx = 0;
    const joinerRun = vi.fn().mockImplementation(async () => {
      const out = queue[Math.min(idx, queue.length - 1)];
      idx += 1;
      return out;
    });

    const model = createModelForDecodeLoop({ tEnc: 1, joinerRun });
    const result = await model.transcribe(new Float32Array(16000), 16000, {
      returnConfidences: true,
      enableProfiling: false,
    });

    const expectedFrameConfidence = (
      softmaxConfidence([0.1, 4.0, 0.2], 1) +
      softmaxConfidence([0.1, 0.2, 8.0], 2) +
      softmaxConfidence([9.0, 0.1, 0.2], 0)
    ) / 3;

    expect(result.confidence_scores.token).toHaveLength(2);
    expect(result.confidence_scores.frame).toHaveLength(1);
    expect(result.confidence_scores.frame[0]).toBeCloseTo(expectedFrameConfidence, 4);
    expect(result.confidence_scores.frame_avg).toBeCloseTo(expectedFrameConfidence, 4);
  });

  it('copies the correct transposed frame slice into reusable encoder buffer each step', async () => {
    const tEnc = 3;
    const encoderData = new Float32Array([
      10, 11, 12, // d=0 across time
      20, 21, 22, // d=1 across time
      30, 31, 32, // d=2 across time
      40, 41, 42, // d=3 across time
    ]);

    const model = createModelForDecodeLoop({
      tEnc,
      joinerRun: vi.fn(),
      encoderData,
    });

    const seenFrames = [];
    model._runCombinedStep = vi.fn(async (encTensor) => {
      seenFrames.push(Array.from(encTensor.data));
      return {
        tokenLogits: new Float32Array([9.0, 0.1, 0.1]), // blank
        step: 1, // advance one frame per iteration
        newState: null,
        _logitsTensor: { dispose: vi.fn() },
      };
    });

    await model.transcribe(new Float32Array(16000), 16000, {
      enableProfiling: false,
    });

    expect(seenFrames).toEqual([
      [10, 20, 30, 40],
      [11, 21, 31, 41],
      [12, 22, 32, 42],
    ]);
    expect(model._runCombinedStep).toHaveBeenCalledTimes(tEnc);
  });
});
