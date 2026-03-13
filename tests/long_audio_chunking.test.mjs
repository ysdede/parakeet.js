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
      }),
    };

    const result = await ParakeetModel.prototype.transcribeLongAudio.call(model, audio, 16000, {
      timeOffset: 5,
    });

    expect(result).toEqual({ text: 'hello world' });
    expect(model.transcribe).toHaveBeenCalledTimes(1);
    expect(model.transcribe).toHaveBeenCalledWith(audio, 16000, expect.objectContaining({
      _skipAudioValidation: true,
      returnTimestamps: false,
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
    });
    expect(model.transcribe).toHaveBeenCalledWith(audio, 16000, expect.objectContaining({
      _skipAudioValidation: true,
      returnTimestamps: true,
      timeOffset: 1.25,
    }));
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
      },
      {
        utterance_text: 'Next sentence. Another one.',
        words: [
          { text: 'Next', start_time: 24.2, end_time: 24.4 },
          { text: 'sentence.', start_time: 24.4, end_time: 24.8 },
          { text: 'Another', start_time: 26.0, end_time: 26.3 },
          { text: 'one.', start_time: 26.3, end_time: 26.7 },
        ],
      },
      {
        utterance_text: 'Another one. Final bit.',
        words: [
          { text: 'Another', start_time: 26.0, end_time: 26.3 },
          { text: 'one.', start_time: 26.3, end_time: 26.7 },
          { text: 'Final', start_time: 45.2, end_time: 45.5 },
          { text: 'bit.', start_time: 45.5, end_time: 45.9 },
        ],
      },
      {
        utterance_text: 'Final bit.',
        words: [
          { text: 'Final', start_time: 45.2, end_time: 45.5 },
          { text: 'bit.', start_time: 45.5, end_time: 45.9 },
        ],
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
});
