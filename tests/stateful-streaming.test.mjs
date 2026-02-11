import { describe, it, expect, vi } from 'vitest';
import { StatefulStreamingTranscriber } from '../src/parakeet.js';

describe('StatefulStreamingTranscriber', () => {
  it('carries decoder state and concatenates chunk words without overlap dedupe', async () => {
    let callIndex = 0;
    const transcribe = vi.fn(async (_audio, _sampleRate, _opts) => {
      callIndex++;
      if (callIndex === 1) {
        return {
          utterance_text: 'hello',
          words: [{ text: 'hello', start_time: 0.0, end_time: 0.2 }],
          decoderState: { marker: 'state-1' },
          metrics: { total_ms: 10 },
        };
      }
      return {
        utterance_text: 'hello world',
        words: [
          { text: 'hello', start_time: 1.0, end_time: 1.2 }, // repeated overlap word
          { text: 'world', start_time: 1.2, end_time: 1.5 },
        ],
        decoderState: { marker: 'state-2' },
        metrics: { total_ms: 12 },
      };
    });

    const streamer = new StatefulStreamingTranscriber({ transcribe }, { sampleRate: 16000 });

    const first = await streamer.processChunk(new Float32Array(16000)); // 1.0s
    expect(first.text).toBe('hello');
    expect(first.totalDuration).toBe(1);

    const second = await streamer.processChunk(new Float32Array(8000)); // +0.5s
    expect(second.text).toBe('hello hello world');
    expect(second.totalDuration).toBe(1.5);

    expect(transcribe).toHaveBeenCalledTimes(2);
    expect(transcribe.mock.calls[0][2].previousDecoderState).toBeNull();
    expect(transcribe.mock.calls[0][2].timeOffset).toBe(0);
    expect(transcribe.mock.calls[1][2].previousDecoderState).toEqual({ marker: 'state-1' });
    expect(transcribe.mock.calls[1][2].timeOffset).toBe(1);
  });

  it('finalize marks stream complete and rejects further chunks', async () => {
    const transcribe = vi.fn(async () => ({
      utterance_text: 'test',
      words: [{ text: 'test' }],
      decoderState: { marker: 'state' },
      metrics: { total_ms: 1 },
    }));

    const streamer = new StatefulStreamingTranscriber({ transcribe }, { sampleRate: 16000 });
    await streamer.processChunk(new Float32Array(3200));

    const finalResult = streamer.finalize();
    expect(finalResult.is_final).toBe(true);
    expect(finalResult.text).toBe('test');

    await expect(streamer.processChunk(new Float32Array(3200))).rejects.toThrow(
      'Streamer is finalized. Create a new instance to process more audio.',
    );
  });

  it('reset clears carried state and restarts offsets from zero', async () => {
    let callIndex = 0;
    const transcribe = vi.fn(async () => {
      callIndex++;
      return {
        utterance_text: callIndex === 1 ? 'first' : 'second',
        words: [{ text: callIndex === 1 ? 'first' : 'second' }],
        decoderState: { marker: `state-${callIndex}` },
        metrics: null,
      };
    });

    const streamer = new StatefulStreamingTranscriber({ transcribe }, { sampleRate: 16000 });

    await streamer.processChunk(new Float32Array(16000));
    streamer.reset();
    const secondSession = await streamer.processChunk(new Float32Array(8000));

    expect(transcribe.mock.calls[1][2].previousDecoderState).toBeNull();
    expect(transcribe.mock.calls[1][2].timeOffset).toBe(0);
    expect(secondSession.text).toBe('second');
    expect(secondSession.totalDuration).toBe(0.5);
  });
});
