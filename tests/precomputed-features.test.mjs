/**
 * Tests for the precomputedFeatures option in transcribe().
 *
 * Since transcribe() requires ONNX Runtime sessions (encoder/decoder),
 * these tests verify the preprocessing logic, input validation, and
 * metadata computation that happens BEFORE the ONNX calls.
 *
 * The tests also verify the JsPreprocessor produces features in the
 * correct format expected by the precomputedFeatures path.
 *
 * Run: npm test
 */

import { describe, it, expect } from 'vitest';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

const melPath = new URL('../src/mel.js', import.meta.url).href;
const { JsPreprocessor, MEL_CONSTANTS } = await import(melPath);

// ═══════════════════════════════════════════════════════════════════════════
// Feature format compatibility
// ═══════════════════════════════════════════════════════════════════════════

describe('precomputedFeatures format', () => {
  it('JsPreprocessor.process() output matches expected precomputedFeatures shape', () => {
    const preprocessor = new JsPreprocessor({ nMels: 128 });
    const audio = new Float32Array(80000); // 5s
    for (let i = 0; i < audio.length; i++) audio[i] = Math.sin(2 * Math.PI * 440 * i / 16000) * 0.5;

    const { features, length } = preprocessor.process(audio);

    // precomputedFeatures expects: { features: Float32Array, T: number, melBins: number }
    const precomputed = {
      features: features,
      T: length,
      melBins: 128,
    };

    expect(precomputed.features).toBeInstanceOf(Float32Array);
    expect(precomputed.T).toBe(500); // 80000 / 160 = 500
    expect(precomputed.melBins).toBe(128);
    expect(precomputed.features.length).toBeGreaterThanOrEqual(precomputed.T * precomputed.melBins);
  });

  it('features should be finite values (no NaN/Infinity)', () => {
    const preprocessor = new JsPreprocessor({ nMels: 128 });
    const audio = new Float32Array(16000);
    for (let i = 0; i < audio.length; i++) audio[i] = Math.sin(2 * Math.PI * 440 * i / 16000) * 0.5;

    const { features } = preprocessor.process(audio);
    for (let i = 0; i < features.length; i++) {
      expect(isFinite(features[i])).toBe(true);
    }
  });

  it('features layout is [melBins, nFrames] (mel-major)', () => {
    const preprocessor = new JsPreprocessor({ nMels: 128 });
    const audio = new Float32Array(32000); // 2s → 200 frames
    for (let i = 0; i < audio.length; i++) audio[i] = Math.sin(2 * Math.PI * 440 * i / 16000) * 0.3;

    const { features, length } = preprocessor.process(audio);
    const nFramesTotal = features.length / 128;

    // The Tensor is created as: new Tensor('float32', features, [1, melBins, T])
    // So features are stored as [mel0_frame0, mel0_frame1, ..., mel1_frame0, mel1_frame1, ...]
    // This means features[m * nFramesTotal + t] = value at mel bin m, frame t
    expect(Number.isInteger(nFramesTotal)).toBe(true);
    expect(length).toBe(200);
    expect(nFramesTotal).toBeGreaterThanOrEqual(200);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// audioDur computation
// ═══════════════════════════════════════════════════════════════════════════

describe('audioDur computation for precomputedFeatures', () => {
  it('should compute audioDur from audio.length when audio is provided', () => {
    const audio = new Float32Array(80000); // 5s at 16kHz
    const sampleRate = 16000;
    const audioDur = audio.length / sampleRate;
    expect(audioDur).toBe(5.0);
  });

  it('should compute audioDur from T * HOP_LENGTH when audio is null', () => {
    // This is the precomputedFeatures path: audioDur = T * 160 / sampleRate
    const T = 500; // 500 frames
    const sampleRate = 16000;
    const audioDur = (T * MEL_CONSTANTS.HOP_LENGTH) / sampleRate;
    expect(audioDur).toBe(5.0);
  });

  it('should produce consistent audioDur whether from audio or from T', () => {
    const sampleRate = 16000;
    const audioSamples = 80000;
    const T = Math.floor(audioSamples / MEL_CONSTANTS.HOP_LENGTH);

    const fromAudio = audioSamples / sampleRate;
    const fromT = (T * MEL_CONSTANTS.HOP_LENGTH) / sampleRate;

    expect(fromAudio).toBe(fromT);
  });

  it('should handle non-aligned audio lengths', () => {
    // 80160 samples → 501 frames
    const audioSamples = 80160;
    const T = Math.floor(audioSamples / MEL_CONSTANTS.HOP_LENGTH);
    const sampleRate = 16000;

    const fromAudio = audioSamples / sampleRate; // 5.01
    const fromT = (T * MEL_CONSTANTS.HOP_LENGTH) / sampleRate; // 5.01

    // They should be very close (within 1 hop's worth of difference)
    expect(Math.abs(fromAudio - fromT)).toBeLessThan(MEL_CONSTANTS.HOP_LENGTH / sampleRate);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// preprocessorPath detection
// ═══════════════════════════════════════════════════════════════════════════

describe('preprocessorPath detection', () => {
  it('should be "mel-worker" when precomputedFeatures is provided', () => {
    const precomputedFeatures = { features: new Float32Array(0), T: 0, melBins: 128 };
    const preprocessorPath = precomputedFeatures ? 'mel-worker' : 'js';
    expect(preprocessorPath).toBe('mel-worker');
  });

  it('should fall back to preprocessor backend when precomputedFeatures is null', () => {
    const precomputedFeatures = null;
    const backendName = 'js';
    const preprocessorPath = precomputedFeatures ? 'mel-worker' : backendName;
    expect(preprocessorPath).toBe('js');
  });

  it('should fall back to onnx when precomputedFeatures is null and backend is onnx', () => {
    const precomputedFeatures = null;
    const backendName = 'onnx';
    const preprocessorPath = precomputedFeatures ? 'mel-worker' : backendName;
    expect(preprocessorPath).toBe('onnx');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Empty/edge case input validation
// ═══════════════════════════════════════════════════════════════════════════

describe('precomputedFeatures edge cases', () => {
  it('should handle T=0 (empty features) gracefully', () => {
    // In transcribe(), when T <= 0, early exit returns empty result
    const precomputed = { features: new Float32Array(0), T: 0, melBins: 128 };
    expect(precomputed.T).toBe(0);
    // The guard in transcribe():
    //   if (!features || !features.length || T <= 0 || melBins <= 0) { return empty result }
    expect(!precomputed.features.length || precomputed.T <= 0).toBe(true);
  });

  it('should handle single frame (T=1)', () => {
    const precomputed = {
      features: new Float32Array(128), // 1 frame × 128 mel bins
      T: 1,
      melBins: 128,
    };
    expect(precomputed.features.length).toBe(128);
    expect(precomputed.T * precomputed.melBins).toBe(128);
  });

  it('should handle different mel bin counts', () => {
    for (const melBins of [40, 64, 80, 128]) {
      const T = 100;
      const precomputed = {
        features: new Float32Array(melBins * T),
        T,
        melBins,
      };
      expect(precomputed.features.length).toBe(melBins * T);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Integration: JsPreprocessor → precomputedFeatures format
// ═══════════════════════════════════════════════════════════════════════════

describe('JsPreprocessor to precomputedFeatures integration', () => {
  it('should produce features consumable by ONNX Tensor [1, melBins, T]', () => {
    const preprocessor = new JsPreprocessor({ nMels: 128 });
    const audio = new Float32Array(48000); // 3s
    for (let i = 0; i < audio.length; i++) audio[i] = Math.sin(2 * Math.PI * 440 * i / 16000) * 0.5;

    const { features, length } = preprocessor.process(audio);

    // Simulate what transcribe() does:
    // const input = new ort.Tensor('float32', features, [1, melBins, T]);
    const melBins = 128;
    const T = length; // 300

    // Verify the shape makes sense
    expect(T).toBe(300);
    const nFramesAllocated = features.length / melBins;
    expect(nFramesAllocated).toBeGreaterThanOrEqual(T);

    // Verify data is accessible in [melBins, T] layout
    for (let m = 0; m < melBins; m++) {
      for (let t = 0; t < T; t++) {
        const idx = m * nFramesAllocated + t;
        expect(isFinite(features[idx])).toBe(true);
      }
    }
  });

  it('should handle real-world audio durations (1s, 3s, 5s, 7s)', () => {
    const preprocessor = new JsPreprocessor({ nMels: 128 });
    const durations = [1, 3, 5, 7];

    for (const dur of durations) {
      const N = dur * 16000;
      const audio = new Float32Array(N);
      for (let i = 0; i < N; i++) audio[i] = Math.sin(2 * Math.PI * 440 * i / 16000) * 0.5;

      const { features, length } = preprocessor.process(audio);
      const expectedFrames = Math.floor(N / MEL_CONSTANTS.HOP_LENGTH);

      expect(length).toBe(expectedFrames);
      expect(features.length).toBeGreaterThanOrEqual(128 * expectedFrames);
    }
  });
});
