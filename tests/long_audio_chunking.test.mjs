import { describe, it, expect, vi } from 'vitest';
import { ParakeetModel } from '../src/parakeet.js';
import { transcribeLongAudioWithChunks } from '../src/long_audio.js';

describe('long-audio chunking helpers', () => {
  it('returns a simple text result when timestamps are not requested', async () => {
    const audio = new Float32Array(10 * 16000);
    const model = {
      transcribe: vi.fn().mockResolvedValue({
        utterance_text: 'hello world',
        words: [],
        metrics: {
          preprocess_ms: 10,
          encode_ms: 20,
          decode_ms: 30,
          tokenize_ms: 5,
          total_ms: 65,
          rtf: 1,
        },
      }),
    };

    const result = await ParakeetModel.prototype.transcribeLongAudio.call(model, audio, 16000, {
      timeOffset: 5,
    });

    expect(result).toEqual({
      text: 'hello world',
      metrics: {
        preprocess_ms: 10,
        encode_ms: 20,
        decode_ms: 30,
        tokenize_ms: 5,
        total_ms: 65,
        rtf: expect.closeTo(10 / 0.065, 6),
      },
    });
    expect(model.transcribe).toHaveBeenCalledTimes(1);
    expect(model.transcribe).toHaveBeenCalledWith(audio, 16000, expect.objectContaining({
      _skipAudioValidation: true,
      returnTimestamps: true,
      timeOffset: 5,
    }));
  });

  it('returns per-word chunks when requested on a single-window transcription', async () => {
    const audio = new Float32Array(12 * 16000);
    const words = [
      { text: 'Hello', start_time: 0, end_time: 0.4 },
      { text: 'world.', start_time: 0.4, end_time: 0.9 },
    ];
    const model = {
      transcribe: vi.fn().mockResolvedValue({
        utterance_text: 'Hello world.',
        words,
        metrics: {
          preprocess_ms: 12,
          encode_ms: 24,
          decode_ms: 36,
          tokenize_ms: 8,
          total_ms: 80,
          rtf: 1,
        },
      }),
    };

    const result = await transcribeLongAudioWithChunks(model, audio, 16000, {
      returnTimestamps: 'word',
      timeOffset: 1.25,
    });

    expect(result).toEqual({
      text: 'Hello world.',
      words,
      chunks: [
        { text: 'Hello', timestamp: [0, 0.4] },
        { text: 'world.', timestamp: [0.4, 0.9] },
      ],
      metrics: {
        preprocess_ms: 12,
        encode_ms: 24,
        decode_ms: 36,
        tokenize_ms: 8,
        total_ms: 80,
        rtf: expect.closeTo(12 / 0.08, 6),
      },
    });
    expect(model.transcribe).toHaveBeenCalledWith(audio, 16000, expect.objectContaining({
      _skipAudioValidation: true,
      returnTimestamps: true,
      timeOffset: 1.25,
    }));
  });

  it('rescans an audible trailing tail on a single-window transcription', async () => {
    const sampleRate = 16000;
    const audio = new Float32Array(20 * sampleRate);
    audio.fill(0.1, Math.floor(12.6 * sampleRate), Math.floor(13.6 * sampleRate));
    const seenOffsets = [];
    const scriptedOutputs = [
      {
        utterance_text: 'In the next chapter we will stroll further afield.',
        words: [
          { text: 'In', start_time: 8.0, end_time: 8.2 },
          { text: 'the', start_time: 8.2, end_time: 8.4 },
          { text: 'next', start_time: 8.4, end_time: 8.7 },
          { text: 'chapter', start_time: 8.7, end_time: 9.2 },
          { text: 'we', start_time: 9.2, end_time: 9.4 },
          { text: 'will', start_time: 9.4, end_time: 9.6 },
          { text: 'stroll', start_time: 9.6, end_time: 10.1 },
          { text: 'further', start_time: 10.1, end_time: 10.5 },
          { text: 'afield.', start_time: 10.5, end_time: 12.0 },
        ],
        metrics: {
          preprocess_ms: 3,
          encode_ms: 4,
          decode_ms: 5,
          tokenize_ms: 1,
          total_ms: 13,
          rtf: 1,
        },
      },
      {
        utterance_text: 'End of chapter four.',
        words: [
          { text: 'End', start_time: 12.8, end_time: 13.0 },
          { text: 'of', start_time: 13.0, end_time: 13.1 },
          { text: 'chapter', start_time: 13.1, end_time: 13.5 },
          { text: 'four.', start_time: 13.5, end_time: 13.9 },
        ],
        metrics: {
          preprocess_ms: 2,
          encode_ms: 3,
          decode_ms: 4,
          tokenize_ms: 1,
          total_ms: 10,
          rtf: 1,
        },
      },
    ];

    const model = {
      transcribe: vi.fn().mockImplementation(async (_windowAudio, _sampleRate, opts) => {
        seenOffsets.push(opts.timeOffset);
        return scriptedOutputs[seenOffsets.length - 1];
      }),
    };

    const result = await transcribeLongAudioWithChunks(model, audio, sampleRate, {
      timeOffset: 0,
    });

    expect(seenOffsets).toEqual([0, 11.5]);
    expect(result).toEqual({
      text: 'In the next chapter we will stroll further afield. End of chapter four.',
      metrics: {
        preprocess_ms: 5,
        encode_ms: 7,
        decode_ms: 9,
        tokenize_ms: 2,
        total_ms: 23,
        rtf: expect.closeTo(20 / 0.023, 6),
      },
    });
  });

  it('uses sentence-aware window cursoring for long audio chunk assembly', async () => {
    const sampleRate = 16000;
    const audio = new Float32Array(45 * sampleRate);
    const seenOffsets = [];
    const scriptedOutputs = [
      {
        utterance_text: 'Hello world. Next sentence.',
        words: [
          { text: 'Hello', start_time: 5.0, end_time: 5.4 },
          { text: 'world.', start_time: 5.4, end_time: 5.9 },
          { text: 'Next', start_time: 24.2, end_time: 24.4 },
          { text: 'sentence.', start_time: 24.4, end_time: 24.8 },
        ],
        metrics: {
          preprocess_ms: 10,
          encode_ms: 20,
          decode_ms: 30,
          tokenize_ms: 4,
          total_ms: 64,
          rtf: 1,
        },
      },
      {
        utterance_text: 'Next sentence. Another one.',
        words: [
          { text: 'Next', start_time: 24.2, end_time: 24.4 },
          { text: 'sentence.', start_time: 24.4, end_time: 24.8 },
          { text: 'Another', start_time: 26.0, end_time: 26.3 },
          { text: 'one.', start_time: 26.3, end_time: 26.7 },
        ],
        metrics: {
          preprocess_ms: 11,
          encode_ms: 21,
          decode_ms: 31,
          tokenize_ms: 5,
          total_ms: 68,
          rtf: 1,
        },
      },
      {
        utterance_text: 'Another one. Final bit.',
        words: [
          { text: 'Another', start_time: 26.0, end_time: 26.3 },
          { text: 'one.', start_time: 26.3, end_time: 26.7 },
          { text: 'Final', start_time: 45.2, end_time: 45.5 },
          { text: 'bit.', start_time: 45.5, end_time: 45.9 },
        ],
        metrics: {
          preprocess_ms: 12,
          encode_ms: 22,
          decode_ms: 32,
          tokenize_ms: 6,
          total_ms: 72,
          rtf: 1,
        },
      },
      {
        utterance_text: 'Final bit.',
        words: [
          { text: 'Final', start_time: 45.2, end_time: 45.5 },
          { text: 'bit.', start_time: 45.5, end_time: 45.9 },
        ],
        metrics: {
          preprocess_ms: 13,
          encode_ms: 23,
          decode_ms: 33,
          tokenize_ms: 7,
          total_ms: 76,
          rtf: 1,
        },
      },
    ];

    const model = {
      transcribe: vi.fn().mockImplementation(async (_windowAudio, _sampleRate, opts) => {
        seenOffsets.push(opts.timeOffset);
        return scriptedOutputs[seenOffsets.length - 1];
      }),
    };

    const result = await ParakeetModel.prototype.transcribeLongAudio.call(model, audio, sampleRate, {
      returnTimestamps: true,
      chunkLengthS: 20,
      timeOffset: 5,
    });

    expect(seenOffsets).toHaveLength(4);
    expect(seenOffsets[0]).toBeCloseTo(5, 6);
    expect(seenOffsets[1]).toBeCloseTo(24.2, 6);
    expect(seenOffsets[2]).toBeCloseTo(26.0, 6);
    expect(seenOffsets[3]).toBeCloseTo(45.2, 6);
    for (const call of model.transcribe.mock.calls) {
      expect(call[2]._skipAudioValidation).toBe(true);
    }

    expect(result.text).toBe('Hello world. Next sentence. Another one. Final bit.');
    expect(result.chunks).toEqual([
      { text: 'Hello world.', timestamp: [5.0, 5.9] },
      { text: 'Next sentence.', timestamp: [24.2, 24.8] },
      { text: 'Another one.', timestamp: [26.0, 26.7] },
      { text: 'Final bit.', timestamp: [45.2, 45.9] },
    ]);
    expect(result.words).toEqual([
      { text: 'Hello', start_time: 5.0, end_time: 5.4 },
      { text: 'world.', start_time: 5.4, end_time: 5.9 },
      { text: 'Next', start_time: 24.2, end_time: 24.4 },
      { text: 'sentence.', start_time: 24.4, end_time: 24.8 },
      { text: 'Another', start_time: 26.0, end_time: 26.3 },
      { text: 'one.', start_time: 26.3, end_time: 26.7 },
      { text: 'Final', start_time: 45.2, end_time: 45.5 },
      { text: 'bit.', start_time: 45.5, end_time: 45.9 },
    ]);
    expect(result.metrics).toEqual({
      preprocess_ms: 46,
      encode_ms: 86,
      decode_ms: 126,
      tokenize_ms: 22,
      total_ms: 280,
      rtf: expect.closeTo(45 / 0.28, 6),
    });
  });

  it('rejects invalid sampleRate and timeOffset before scheduling windows', async () => {
    const audio = new Float32Array(10 * 16000);
    const model = {
      transcribe: vi.fn(),
    };

    await expect(
      transcribeLongAudioWithChunks(model, audio, 0, {}),
    ).rejects.toThrow('positive finite number');

    await expect(
      transcribeLongAudioWithChunks(model, audio, 16000, { timeOffset: -1 }),
    ).rejects.toThrow('finite non-negative number');

    expect(model.transcribe).not.toHaveBeenCalled();
  });

  it('rebalances the penultimate fallback window to avoid a tiny final tail', async () => {
    const sampleRate = 16000;
    const audio = new Float32Array(183 * sampleRate);
    const seenOffsets = [];
    const model = {
      transcribe: vi.fn().mockImplementation(async (_windowAudio, _sampleRate, opts) => {
        seenOffsets.push(opts.timeOffset);
        return {
          utterance_text: `window-${seenOffsets.length}`,
          words: [
            { text: `window${seenOffsets.length}`, start_time: opts.timeOffset, end_time: opts.timeOffset + 1 },
          ],
          metrics: {
            preprocess_ms: 1,
            encode_ms: 1,
            decode_ms: 1,
            tokenize_ms: 1,
            total_ms: 4,
            rtf: 1,
          },
        };
      }),
    };

    await transcribeLongAudioWithChunks(model, audio, sampleRate, {
      chunkLengthS: 90,
      timeOffset: 0,
    });

    expect(seenOffsets).toEqual([0, 80, 113]);
    expect(model.transcribe).toHaveBeenCalledTimes(3);
  });

  it('replaces stale pending words when the next window refines the same sentence', async () => {
    const sampleRate = 16000;
    const audio = new Float32Array(30 * sampleRate);
    const seenOffsets = [];
    const scriptedOutputs = [
      {
        utterance_text: 'Not a trace of anything edible was to be found. Were they tried to',
        words: [
          { text: 'Not', start_time: 23.84, end_time: 24.0 },
          { text: 'a', start_time: 24.0, end_time: 24.1 },
          { text: 'trace', start_time: 24.1, end_time: 24.4 },
          { text: 'of', start_time: 24.4, end_time: 24.5 },
          { text: 'anything', start_time: 24.5, end_time: 24.9 },
          { text: 'edible', start_time: 24.9, end_time: 25.3 },
          { text: 'was', start_time: 25.3, end_time: 25.5 },
          { text: 'to', start_time: 25.5, end_time: 25.6 },
          { text: 'be', start_time: 25.6, end_time: 25.8 },
          { text: 'found.', start_time: 25.8, end_time: 26.48 },
          { text: 'Were', start_time: 26.48, end_time: 26.80 },
          { text: 'they', start_time: 26.80, end_time: 27.00 },
          { text: 'tried', start_time: 27.00, end_time: 27.16 },
          { text: 'to', start_time: 27.16, end_time: 27.20 },
        ],
        metrics: {
          preprocess_ms: 1,
          encode_ms: 1,
          decode_ms: 1,
          tokenize_ms: 1,
          total_ms: 4,
          rtf: 1,
        },
      },
      {
        utterance_text: 'Were they trying to substitute ice for water?',
        words: [
          { text: 'Were', start_time: 26.80, end_time: 27.04 },
          { text: 'they', start_time: 27.04, end_time: 27.20 },
          { text: 'trying', start_time: 27.20, end_time: 27.60 },
          { text: 'to', start_time: 27.60, end_time: 27.72 },
          { text: 'substitute', start_time: 27.72, end_time: 28.40 },
          { text: 'ice', start_time: 28.40, end_time: 28.64 },
          { text: 'for', start_time: 28.64, end_time: 28.80 },
          { text: 'water?', start_time: 28.80, end_time: 29.68 },
        ],
        metrics: {
          preprocess_ms: 1,
          encode_ms: 1,
          decode_ms: 1,
          tokenize_ms: 1,
          total_ms: 4,
          rtf: 1,
        },
      },
    ];

    const model = {
      transcribe: vi.fn().mockImplementation(async (_windowAudio, _sampleRate, opts) => {
        seenOffsets.push(opts.timeOffset);
        return scriptedOutputs[seenOffsets.length - 1];
      }),
    };

    const result = await transcribeLongAudioWithChunks(model, audio, sampleRate, {
      chunkLengthS: 20,
      returnTimestamps: true,
      timeOffset: 0,
    });

    expect(result.text).toBe('Not a trace of anything edible was to be found. Were they trying to substitute ice for water?');
    expect(result.chunks).toEqual([
      { text: 'Not a trace of anything edible was to be found.', timestamp: [23.84, 26.48] },
      { text: 'Were they trying to substitute ice for water?', timestamp: [26.80, 29.68] },
    ]);
  });

  it('rescans an audible tail after the last chunk window', async () => {
    const sampleRate = 16000;
    const audio = new Float32Array(30 * sampleRate);
    audio.fill(0.1, Math.floor(22.6 * sampleRate), Math.floor(23.8 * sampleRate));
    const seenOffsets = [];
    const scriptedOutputs = [
      {
        utterance_text: 'Earlier context. In the next chapter we will stroll further afield.',
        words: [
          { text: 'Earlier', start_time: 0.0, end_time: 0.4 },
          { text: 'context.', start_time: 0.4, end_time: 0.9 },
          { text: 'In', start_time: 18.0, end_time: 18.2 },
          { text: 'the', start_time: 18.2, end_time: 18.4 },
          { text: 'next', start_time: 18.4, end_time: 18.7 },
          { text: 'chapter', start_time: 18.7, end_time: 19.2 },
          { text: 'we', start_time: 19.2, end_time: 19.4 },
          { text: 'will', start_time: 19.4, end_time: 19.6 },
          { text: 'stroll', start_time: 19.6, end_time: 20.1 },
          { text: 'further', start_time: 20.1, end_time: 20.5 },
          { text: 'afield.', start_time: 20.5, end_time: 22.0 },
        ],
        metrics: {
          preprocess_ms: 1,
          encode_ms: 1,
          decode_ms: 1,
          tokenize_ms: 1,
          total_ms: 4,
          rtf: 1,
        },
      },
      {
        utterance_text: 'In the next chapter we will stroll further afield.',
        words: [
          { text: 'In', start_time: 18.0, end_time: 18.2 },
          { text: 'the', start_time: 18.2, end_time: 18.4 },
          { text: 'next', start_time: 18.4, end_time: 18.7 },
          { text: 'chapter', start_time: 18.7, end_time: 19.2 },
          { text: 'we', start_time: 19.2, end_time: 19.4 },
          { text: 'will', start_time: 19.4, end_time: 19.6 },
          { text: 'stroll', start_time: 19.6, end_time: 20.1 },
          { text: 'further', start_time: 20.1, end_time: 20.5 },
          { text: 'afield.', start_time: 20.5, end_time: 22.0 },
        ],
        metrics: {
          preprocess_ms: 1,
          encode_ms: 1,
          decode_ms: 1,
          tokenize_ms: 1,
          total_ms: 4,
          rtf: 1,
        },
      },
      {
        utterance_text: 'End of chapter four.',
        words: [
          { text: 'End', start_time: 22.8, end_time: 23.0 },
          { text: 'of', start_time: 23.0, end_time: 23.1 },
          { text: 'chapter', start_time: 23.1, end_time: 23.5 },
          { text: 'four.', start_time: 23.5, end_time: 23.9 },
        ],
        metrics: {
          preprocess_ms: 1,
          encode_ms: 1,
          decode_ms: 1,
          tokenize_ms: 1,
          total_ms: 4,
          rtf: 1,
        },
      },
    ];

    const model = {
      transcribe: vi.fn().mockImplementation(async (_windowAudio, _sampleRate, opts) => {
        seenOffsets.push(opts.timeOffset);
        return scriptedOutputs[seenOffsets.length - 1];
      }),
    };

    const result = await transcribeLongAudioWithChunks(model, audio, sampleRate, {
      chunkLengthS: 20,
      returnTimestamps: true,
      timeOffset: 0,
    });

    expect(seenOffsets).toEqual([0, 18, 21.5]);
    expect(result.text).toBe('Earlier context. In the next chapter we will stroll further afield. End of chapter four.');
    expect(result.chunks).toEqual([
      { text: 'Earlier context.', timestamp: [0.0, 0.9] },
      { text: 'In the next chapter we will stroll further afield.', timestamp: [18.0, 22.0] },
      { text: 'End of chapter four.', timestamp: [22.8, 23.9] },
    ]);
  });
});
