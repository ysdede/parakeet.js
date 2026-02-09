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

  it('should NOT return metrics by default (metrics should be null)', async () => {
    const result = await model.transcribe(new Float32Array(16000), 16000, {});
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
