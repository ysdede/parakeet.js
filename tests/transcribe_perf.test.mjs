import { describe, it, expect, vi } from 'vitest';
import { ParakeetModel } from '../src/parakeet.js';

describe('ParakeetModel.transcribe performance logging', () => {
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
    id2token: ['<blank>', 'a', 'b', 'c', '<unk>', '▁foo', '▁bar'], // dummy tokens
    blankToken: '<blank>',
    decode: (ids) => ids.map(id => mockTokenizer.id2token[id]).join(''),
  };

  const mockEncoderSession = {
    run: vi.fn().mockResolvedValue({ outputs: { dims: [1, 64, 10], data: new Float32Array(640) } }),
  };

  const mockJoinerSession = {
    run: vi.fn().mockResolvedValue({
        outputs: { dims: [1, 1, 1, 10], data: new Float32Array(10) }, // logits
        output_states_1: { dims: [2, 1, 640], data: new Float32Array(1280) },
        output_states_2: { dims: [2, 1, 640], data: new Float32Array(1280) },
    }),
  };

  const mockPreprocessor = {
    process: vi.fn().mockResolvedValue({ features: new Float32Array(1280), length: 10 }), // 10 frames, 128 bins
  };

  const model = new ParakeetModel({
    tokenizer: mockTokenizer,
    encoderSession: mockEncoderSession,
    joinerSession: mockJoinerSession,
    preprocessor: mockPreprocessor,
    ort: mockOrt,
    nMels: 128,
  });

  it('should return metrics by default (enableProfiling defaults to true for backward compat)', async () => {
    const result = await model.transcribe(new Float32Array(16000), 16000, {});
    expect(result.metrics).not.toBeNull();
    expect(result.metrics).toHaveProperty('total_ms');
  });

  it('should NOT return metrics when enableProfiling is explicitly false', async () => {
    const result = await model.transcribe(new Float32Array(16000), 16000, { enableProfiling: false });
    expect(result.metrics).toBeNull();
  });

  it('should return metrics when enableProfiling is true', async () => {
    const result = await model.transcribe(new Float32Array(16000), 16000, { enableProfiling: true });
    expect(result.metrics).not.toBeNull();
    expect(result.metrics).toHaveProperty('total_ms');
  });

  it('should return metrics when debug is true', async () => {
    const result = await model.transcribe(new Float32Array(16000), 16000, { debug: true });
    expect(result.metrics).not.toBeNull();
    expect(result.metrics).toHaveProperty('total_ms');
  });
});

describe('ParakeetModel.transcribe tensor disposal', () => {
  it('should dispose per-call tensors (input, lenTensor, encoder output, joiner logits, state tensors)', async () => {
    const disposeCalls = [];

    // Tensor class that tracks dispose calls
    class SpyTensor {
      constructor(type, data, dims) {
        this.type = type;
        this.data = data;
        this.dims = dims;
        this._id = SpyTensor._nextId++;
      }
      dispose() {
        disposeCalls.push(this._id);
      }
    }
    SpyTensor._nextId = 0;

    const spyOrt = { Tensor: SpyTensor };

    const spyTokenizer = {
      blankId: 0,
      id2token: ['<blank>', 'a', 'b'],
      blankToken: '<blank>',
      decode: () => '',
      sanitizedTokens: ['<blank>', 'a', 'b'],
    };

    // Encoder output: needs .dispose() so we can track it
    const makeEncoderOutput = () => {
      const t = { dims: [1, 64, 10], data: new Float32Array(640), dispose: vi.fn() };
      return t;
    };

    // Joiner output: logits + states all with .dispose()
    const makeJoinerOutput = () => {
      const logits = { dims: [1, 1, 1, 3], data: new Float32Array([0.8, 0.1, 0.1]), dispose: vi.fn() };
      const s1 = { dims: [2, 1, 640], data: new Float32Array(1280), dispose: vi.fn() };
      const s2 = { dims: [2, 1, 640], data: new Float32Array(1280), dispose: vi.fn() };
      return { outputs: logits, output_states_1: s1, output_states_2: s2 };
    };

    const encOutput = makeEncoderOutput();
    const joinerOutputs = [];

    const spyEncoderSession = {
      run: vi.fn().mockResolvedValue({ outputs: encOutput }),
    };

    const spyJoinerSession = {
      run: vi.fn().mockImplementation(async () => {
        const out = makeJoinerOutput();
        joinerOutputs.push(out);
        return out;
      }),
    };

    const spyPreprocessor = {
      process: vi.fn().mockResolvedValue({ features: new Float32Array(1280), length: 10 }),
      nMels: 128,
    };

    const spyModel = new ParakeetModel({
      tokenizer: spyTokenizer,
      encoderSession: spyEncoderSession,
      joinerSession: spyJoinerSession,
      preprocessor: spyPreprocessor,
      ort: spyOrt,
      nMels: 128,
    });

    await spyModel.transcribe(new Float32Array(16000), 16000, {});

    // Per-call Tensor instances created via new SpyTensor(...) should be disposed
    // At minimum: input tensor + lenTensor = 2 dispose calls on SpyTensor instances
    expect(disposeCalls.length).toBeGreaterThanOrEqual(2);

    // Encoder output tensor should be disposed
    expect(encOutput.dispose).toHaveBeenCalledTimes(1);

    // Every joiner logits tensor should be disposed (one per decode step)
    expect(joinerOutputs.length).toBeGreaterThan(0);
    for (const out of joinerOutputs) {
      expect(out.outputs.dispose).toHaveBeenCalledTimes(1);
    }

    // State tensors: all blank frames means newState is disposed each step.
    // The last iteration's state disposal happens after the loop.
    // Each state pair should have been disposed exactly once.
    for (const out of joinerOutputs) {
      expect(out.output_states_1.dispose).toHaveBeenCalledTimes(1);
      expect(out.output_states_2.dispose).toHaveBeenCalledTimes(1);
    }
  });
});
