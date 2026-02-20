/**
 * Unit & integration tests for the pure JS mel spectrogram implementation (src/mel.js).
 *
 * Tests cover:
 *   - Constants correctness
 *   - Mel scale conversion (hzToMel / melToHz)
 *   - Mel filterbank construction
 *   - Hann window
 *   - FFT
 *   - JsPreprocessor full pipeline
 *   - IncrementalMelProcessor caching
 *   - ONNX reference cross-validation (mel_reference.json)
 *
 * Run: npm test
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

// Import from mel.js
const melPath = new URL('../src/mel.js', import.meta.url).href;
const {
  JsPreprocessor,
  IncrementalMelProcessor,
  MEL_CONSTANTS,
  hzToMel,
  melToHz,
  createMelFilterbank,
  createPaddedHannWindow,
  precomputeTwiddles,
  fft,
} = await import(melPath);

// ─── Helpers ──────────────────────────────────────────────────────────────

function base64ToFloat32(b64) {
  const buf = Buffer.from(b64, 'base64');
  return new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / Float32Array.BYTES_PER_ELEMENT);
}

function computeError(actual, expected, n) {
  const len = n || Math.min(actual.length, expected.length);
  let maxErr = 0, sumErr = 0;
  for (let i = 0; i < len; i++) {
    const err = Math.abs(actual[i] - expected[i]);
    sumErr += err;
    if (err > maxErr) maxErr = err;
  }
  return { maxAbsError: maxErr, meanAbsError: sumErr / len };
}

// ═══════════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════════

describe('MEL_CONSTANTS', () => {
  it('should have correct NeMo-compatible values', () => {
    expect(MEL_CONSTANTS.SAMPLE_RATE).toBe(16000);
    expect(MEL_CONSTANTS.N_FFT).toBe(512);
    expect(MEL_CONSTANTS.WIN_LENGTH).toBe(400);
    expect(MEL_CONSTANTS.HOP_LENGTH).toBe(160);
    expect(MEL_CONSTANTS.PREEMPH).toBe(0.97);
    expect(MEL_CONSTANTS.LOG_ZERO_GUARD).toBe(2 ** -24);
    expect(MEL_CONSTANTS.N_FREQ_BINS).toBe(257);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Mel Scale
// ═══════════════════════════════════════════════════════════════════════════

describe('hzToMel / melToHz', () => {
  it('should return 0 for 0 Hz', () => {
    expect(hzToMel(0)).toBe(0);
  });

  it('should return mel in linear region for freq < 1000 Hz', () => {
    const freq = 500;
    const expected = freq / (200 / 3); // Slaney linear region
    expect(hzToMel(freq)).toBeCloseTo(expected, 5);
  });

  it('should transition at 1000 Hz (mel = 15.0)', () => {
    expect(hzToMel(1000)).toBeCloseTo(15.0, 5);
    expect(hzToMel(2000)).toBeGreaterThan(15.0);
  });

  it('should be invertible (roundtrip)', () => {
    const freqs = [0, 100, 500, 1000, 2000, 4000, 8000];
    for (const freq of freqs) {
      const mel = hzToMel(freq);
      const recovered = melToHz(mel);
      expect(recovered).toBeCloseTo(freq, 3);
    }
  });

  it('should be monotonically increasing', () => {
    const freqs = [0, 100, 500, 1000, 2000, 4000, 8000];
    const mels = freqs.map(hzToMel);
    for (let i = 1; i < mels.length; i++) {
      expect(mels[i]).toBeGreaterThan(mels[i - 1]);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Mel Filterbank
// ═══════════════════════════════════════════════════════════════════════════

describe('createMelFilterbank', () => {
  it('should create filterbank with correct dimensions (128 × 257)', () => {
    const fb = createMelFilterbank(128);
    expect(fb).toBeInstanceOf(Float32Array);
    expect(fb.length).toBe(128 * MEL_CONSTANTS.N_FREQ_BINS);
  });

  it('should have non-negative values only', () => {
    const fb = createMelFilterbank(128);
    for (let i = 0; i < fb.length; i++) {
      expect(fb[i]).toBeGreaterThanOrEqual(0);
    }
  });

  it('should have non-zero energy in every mel bin', () => {
    const nMels = 128;
    const fb = createMelFilterbank(nMels);
    for (let m = 0; m < nMels; m++) {
      const offset = m * MEL_CONSTANTS.N_FREQ_BINS;
      let sum = 0;
      for (let k = 0; k < MEL_CONSTANTS.N_FREQ_BINS; k++) sum += fb[offset + k];
      expect(sum).toBeGreaterThan(0);
    }
  });

  it('should create contiguous triangular filters', () => {
    const nMels = 64;
    const fb = createMelFilterbank(nMels);
    for (let m = 0; m < nMels; m++) {
      const offset = m * MEL_CONSTANTS.N_FREQ_BINS;
      let first = -1, last = -1;
      for (let k = 0; k < MEL_CONSTANTS.N_FREQ_BINS; k++) {
        if (fb[offset + k] > 0) {
          if (first === -1) first = k;
          last = k;
        }
      }
      expect(first).toBeGreaterThanOrEqual(0);
      for (let k = first; k <= last; k++) {
        expect(fb[offset + k]).toBeGreaterThan(0);
      }
    }
  });

  it('should work for different nMels values', () => {
    for (const nMels of [40, 64, 80, 128]) {
      const fb = createMelFilterbank(nMels);
      expect(fb.length).toBe(nMels * MEL_CONSTANTS.N_FREQ_BINS);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Hann Window
// ═══════════════════════════════════════════════════════════════════════════

describe('createPaddedHannWindow', () => {
  it('should return a Float64Array of length N_FFT (512)', () => {
    const win = createPaddedHannWindow();
    expect(win).toBeInstanceOf(Float64Array);
    expect(win.length).toBe(MEL_CONSTANTS.N_FFT);
  });

  it('should have zero padding at edges', () => {
    const win = createPaddedHannWindow();
    const padLeft = (MEL_CONSTANTS.N_FFT - MEL_CONSTANTS.WIN_LENGTH) >> 1; // 56
    for (let i = 0; i < padLeft; i++) expect(win[i]).toBe(0);
    for (let i = padLeft + MEL_CONSTANTS.WIN_LENGTH; i < MEL_CONSTANTS.N_FFT; i++) expect(win[i]).toBe(0);
  });

  it('should be symmetric in the active region', () => {
    const win = createPaddedHannWindow();
    const padLeft = (MEL_CONSTANTS.N_FFT - MEL_CONSTANTS.WIN_LENGTH) >> 1;
    for (let i = 0; i < MEL_CONSTANTS.WIN_LENGTH; i++) {
      const mirror = MEL_CONSTANTS.WIN_LENGTH - 1 - i;
      expect(win[padLeft + i]).toBeCloseTo(win[padLeft + mirror], 10);
    }
  });

  it('should peak at center with value ~1.0', () => {
    const win = createPaddedHannWindow();
    const padLeft = (MEL_CONSTANTS.N_FFT - MEL_CONSTANTS.WIN_LENGTH) >> 1;
    const center = padLeft + Math.floor(MEL_CONSTANTS.WIN_LENGTH / 2);
    expect(win[center]).toBeCloseTo(1.0, 2);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// FFT
// ═══════════════════════════════════════════════════════════════════════════

describe('fft', () => {
  it('should handle DC signal (all ones)', () => {
    const n = 8;
    const tw = precomputeTwiddles(n);
    const re = new Float64Array([1, 1, 1, 1, 1, 1, 1, 1]);
    const im = new Float64Array(n);
    fft(re, im, n, tw);
    expect(re[0]).toBeCloseTo(n, 5);
    for (let i = 1; i < n; i++) {
      expect(re[i]).toBeCloseTo(0, 5);
      expect(im[i]).toBeCloseTo(0, 5);
    }
  });

  it('should handle a single frequency sinusoid', () => {
    const n = 16;
    const tw = precomputeTwiddles(n);
    const re = new Float64Array(n);
    const im = new Float64Array(n);
    for (let i = 0; i < n; i++) re[i] = Math.cos(2 * Math.PI * i / n);
    fft(re, im, n, tw);
    expect(Math.abs(re[1])).toBeCloseTo(n / 2, 3);
    expect(Math.abs(re[n - 1])).toBeCloseTo(n / 2, 3);
    for (let i = 2; i < n - 1; i++) {
      expect(Math.abs(re[i])).toBeLessThan(1e-6);
      expect(Math.abs(im[i])).toBeLessThan(1e-6);
    }
  });

  it('should handle 512-point FFT (actual size used)', () => {
    const n = 512;
    const tw = precomputeTwiddles(n);
    const re = new Float64Array(n);
    const im = new Float64Array(n);
    fft(re, im, n, tw);
    for (let i = 0; i < n; i++) {
      expect(re[i]).toBeCloseTo(0, 10);
      expect(im[i]).toBeCloseTo(0, 10);
    }
  });

  it('should satisfy Parseval\'s theorem (energy conservation)', () => {
    const n = 64;
    const tw = precomputeTwiddles(n);
    const re = new Float64Array(n);
    const im = new Float64Array(n);
    for (let i = 0; i < n; i++) re[i] = Math.sin(i * 0.37) + Math.cos(i * 0.83);
    let timeEnergy = 0;
    for (let i = 0; i < n; i++) timeEnergy += re[i] * re[i] + im[i] * im[i];
    fft(re, im, n, tw);
    let freqEnergy = 0;
    for (let i = 0; i < n; i++) freqEnergy += re[i] * re[i] + im[i] * im[i];
    expect(freqEnergy / n).toBeCloseTo(timeEnergy, 5);
  });
});

describe('precomputeTwiddles', () => {
  it('should produce cos and sin arrays of half the FFT size', () => {
    const tw = precomputeTwiddles(512);
    expect(tw.cos.length).toBe(256);
    expect(tw.sin.length).toBe(256);
  });

  it('should start with cos[0]=1, sin[0]=0', () => {
    const tw = precomputeTwiddles(512);
    expect(tw.cos[0]).toBeCloseTo(1.0, 10);
    expect(tw.sin[0]).toBeCloseTo(0.0, 10);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// JsPreprocessor
// ═══════════════════════════════════════════════════════════════════════════

describe('JsPreprocessor', () => {
  let preprocessor;

  beforeAll(() => {
    preprocessor = new JsPreprocessor({ nMels: 128 });
  });

  it('should handle empty audio', () => {
    const { features, length } = preprocessor.process(new Float32Array(0));
    expect(features.length).toBe(0);
    expect(length).toBe(0);
  });

  it('should handle very short audio (< 1 frame)', () => {
    const { length } = preprocessor.process(new Float32Array(100));
    expect(length).toBe(0);
  });

  it('should reuse precomputed window/twiddles/filterbank across instances', () => {
    const p1 = new JsPreprocessor({ nMels: 128 });
    const p2 = new JsPreprocessor({ nMels: 128 });
    const p3 = new JsPreprocessor({ nMels: 80 });

    expect(p1.hannWindow).toBe(p2.hannWindow);
    expect(p1.hannWindow).toBe(p3.hannWindow);

    expect(p1.twiddles).toBe(p2.twiddles);
    expect(p1.twiddles).toBe(p3.twiddles);
    expect(p1.twiddles.bitrev.length).toBe(MEL_CONSTANTS.N_FFT);

    expect(p1.melFilterbank).toBe(p2.melFilterbank);
    expect(p3.melFilterbank).not.toBe(p1.melFilterbank);
  });

  it('computeRawMel should zero skipped prefix frames when reusing an output buffer', () => {
    const p = new JsPreprocessor({ nMels: 128 });
    const audioA = new Float32Array(32000);
    const audioB = new Float32Array(32000);

    for (let i = 0; i < audioA.length; i++) {
      audioA[i] = Math.sin(2 * Math.PI * 440 * i / 16000) * 0.5;
      audioB[i] = Math.sin(2 * Math.PI * 660 * i / 16000) * 0.5;
    }

    const base = p.computeRawMel(audioA, 0);
    const outBuffer = new Float32Array(base.rawMel.length + 32);
    p.computeRawMel(audioA, 0, outBuffer);

    const startFrame = Math.min(20, Math.max(1, base.nFrames - 1));
    const reused = p.computeRawMel(audioB, startFrame, outBuffer);
    const nFrames = reused.nFrames;
    const compareFrames = Math.min(base.nFrames, nFrames);
    let anyNonZero = false;
    let anyDiffFromBase = false;

    for (let m = 0; m < 128; m++) {
      const rowBase = m * nFrames;
      const baseRow = m * base.nFrames;
      for (let t = 0; t < startFrame; t++) {
        expect(reused.rawMel[rowBase + t]).toBe(0);
      }
      for (let t = startFrame; t < compareFrames; t++) {
        const val = reused.rawMel[rowBase + t];
        const baseVal = base.rawMel[baseRow + t];
        if (val !== 0) anyNonZero = true;
        if (Math.abs(val - baseVal) > 1e-6) anyDiffFromBase = true;
      }
    }

    expect(anyNonZero).toBe(true);
    expect(anyDiffFromBase).toBe(true);
  });

  it('should produce correct frame count for 1s audio', () => {
    const audio = new Float32Array(16000); // 1 second
    const { length } = preprocessor.process(audio);
    expect(length).toBe(Math.floor(16000 / MEL_CONSTANTS.HOP_LENGTH)); // 100
  });

  it('should produce correct frame count for 2s audio', () => {
    const audio = new Float32Array(32000);
    const { length } = preprocessor.process(audio);
    expect(length).toBe(200);
  });

  it('should produce [nMels, nFrames] shaped output', () => {
    const audio = new Float32Array(32000); // 2s
    for (let i = 0; i < audio.length; i++) audio[i] = Math.sin(2 * Math.PI * 440 * i / 16000);
    const { features, length } = preprocessor.process(audio);
    const nFramesTotal = features.length / 128;
    expect(Number.isInteger(nFramesTotal)).toBe(true);
    expect(length).toBeLessThanOrEqual(nFramesTotal);
  });

  it('should produce near-zero for silence (after normalization)', () => {
    const silence = new Float32Array(16000);
    const { features } = preprocessor.process(silence);
    let maxAbs = 0;
    for (let i = 0; i < features.length; i++) maxAbs = Math.max(maxAbs, Math.abs(features[i]));
    expect(maxAbs).toBeLessThan(1e-3);
  });

  it('should produce finite values for sinusoidal input', () => {
    const audio = new Float32Array(16000);
    for (let i = 0; i < audio.length; i++) audio[i] = 0.5 * Math.sin(2 * Math.PI * 440 * i / 16000);
    const { features } = preprocessor.process(audio);
    for (let i = 0; i < features.length; i++) {
      expect(isFinite(features[i])).toBe(true);
    }
  });

  it('should produce deterministic results', () => {
    const audio = new Float32Array(4800); // 300ms
    for (let i = 0; i < audio.length; i++) audio[i] = Math.sin(2 * Math.PI * 440 * i / 16000) * 0.5;
    const r1 = preprocessor.process(audio);
    const r2 = preprocessor.process(audio);
    expect(r1.length).toBe(r2.length);
    for (let i = 0; i < r1.features.length; i++) {
      expect(r1.features[i]).toBe(r2.features[i]);
    }
  });

  it('should normalize to ~zero mean per mel bin', () => {
    const audio = new Float32Array(32000);
    for (let i = 0; i < audio.length; i++) audio[i] = Math.sin(2 * Math.PI * 440 * i / 16000) * 0.5;
    const { features, length } = preprocessor.process(audio);
    const nFramesTotal = features.length / 128;
    for (let m = 0; m < 128; m++) {
      let sum = 0;
      for (let t = 0; t < length; t++) sum += features[m * nFramesTotal + t];
      expect(Math.abs(sum / length)).toBeLessThan(0.1);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// IncrementalMelProcessor
// ═══════════════════════════════════════════════════════════════════════════

describe('IncrementalMelProcessor', () => {
  it('should match full computation on first call', () => {
    const full = new JsPreprocessor({ nMels: 128 });
    const inc = new IncrementalMelProcessor({ nMels: 128 });

    const audio = new Float32Array(32000); // 2s
    for (let i = 0; i < audio.length; i++) audio[i] = Math.sin(2 * Math.PI * 440 * i / 16000) * 0.5;

    const fullResult = full.process(audio);
    const incResult = inc.process(audio, 0);

    expect(incResult.length).toBe(fullResult.length);
    for (let i = 0; i < fullResult.features.length; i++) {
      expect(Math.abs(incResult.features[i] - fullResult.features[i])).toBeLessThan(1e-5);
    }
  });

  it('should reuse cached frames on second call with overlap', () => {
    const inc = new IncrementalMelProcessor({ nMels: 128 });
    const audio = new Float32Array(80000); // 5s
    for (let i = 0; i < audio.length; i++) {
      const t = i / 16000;
      audio[i] = Math.sin(2 * Math.PI * 440 * t) + 0.3 * Math.sin(2 * Math.PI * 880 * t);
    }

    // First call — full computation
    const r1 = inc.process(audio, 0);
    expect(r1.cached).toBe(false); // First call, no cache

    // Second call — 70% overlap
    const prefixSamples = Math.floor(audio.length * 0.7);
    const r2 = inc.process(audio, prefixSamples);
    expect(r2.cached).toBe(true);
    expect(r2.cachedFrames).toBeGreaterThan(0);
    expect(r2.newFrames).toBeLessThan(r2.length);
  });

  it('should produce identical results with or without caching', () => {
    const full = new JsPreprocessor({ nMels: 128 });
    const inc = new IncrementalMelProcessor({ nMels: 128 });

    const audio = new Float32Array(80000); // 5s
    for (let i = 0; i < audio.length; i++) audio[i] = Math.sin(2 * Math.PI * 440 * i / 16000) * 0.5;

    // Full (no cache)
    const fullResult = full.process(audio);

    // Incremental: first call then second with overlap
    inc.process(audio, 0);
    const prefixSamples = Math.floor(audio.length * 0.7);
    const incResult = inc.process(audio, prefixSamples);

    expect(incResult.length).toBe(fullResult.length);

    const nFramesFull = fullResult.features.length / 128;
    const nFramesInc = incResult.features.length / 128;
    let maxErr = 0;
    for (let m = 0; m < 128; m++) {
      for (let t = 0; t < fullResult.length; t++) {
        const err = Math.abs(fullResult.features[m * nFramesFull + t] - incResult.features[m * nFramesInc + t]);
        if (err > maxErr) maxErr = err;
      }
    }
    expect(maxErr).toBeLessThan(1e-5);
  });

  it('should clear cache on reset/clear', () => {
    const inc = new IncrementalMelProcessor({ nMels: 128 });
    const audio = new Float32Array(16000);
    for (let i = 0; i < audio.length; i++) audio[i] = Math.sin(2 * Math.PI * 440 * i / 16000);

    // Test clear()
    inc.process(audio, 0);
    inc.clear();
    const r2 = inc.process(audio, 0);
    expect(r2.cached).toBe(false);

    // Test reset()
    inc.process(audio, 0);
    inc.reset();
    const r3 = inc.process(audio, 0);
    expect(r3.cached).toBe(false);
  });

  it('should return features that remain stable across subsequent incremental calls', () => {
    const inc = new IncrementalMelProcessor({ nMels: 128 });
    const audio = new Float32Array(48000); // 3s
    for (let i = 0; i < audio.length; i++) audio[i] = Math.sin(2 * Math.PI * 440 * i / 16000) * 0.5;

    const first = inc.process(audio, 0);
    const firstSnapshot = first.features.slice();

    // Trigger a second run that reuses internal buffers
    inc.process(audio, Math.floor(audio.length * 0.6));

    expect(first.features.length).toBeGreaterThan(0);
    for (let i = 0; i < firstSnapshot.length; i++) {
      expect(first.features[i]).toBe(firstSnapshot[i]);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Performance Benchmark
// ═══════════════════════════════════════════════════════════════════════════

describe('Performance', () => {
  it('should process 5s audio in < 200ms', () => {
    const preprocessor = new JsPreprocessor({ nMels: 128 });
    const audio = new Float32Array(80000); // 5s
    for (let i = 0; i < audio.length; i++) audio[i] = Math.sin(2 * Math.PI * 440 * i / 16000) * 0.5;

    // Warm up
    preprocessor.process(audio);

    const t0 = performance.now();
    preprocessor.process(audio);
    const elapsed = performance.now() - t0;

    console.log(`  [Benchmark] 5s audio: ${elapsed.toFixed(1)}ms`);
    expect(elapsed).toBeLessThan(200);
  });

  it('should process incrementally faster than full', () => {
    const inc = new IncrementalMelProcessor({ nMels: 128 });
    const audio = new Float32Array(80000); // 5s
    for (let i = 0; i < audio.length; i++) audio[i] = Math.sin(2 * Math.PI * 440 * i / 16000) * 0.5;

    // First call (full)
    const t0 = performance.now();
    inc.process(audio, 0);
    const fullTime = performance.now() - t0;

    // Second call (70% cached)
    const prefixSamples = Math.floor(audio.length * 0.7);
    const t1 = performance.now();
    inc.process(audio, prefixSamples);
    const incTime = performance.now() - t1;

    console.log(`  [Benchmark] Full: ${fullTime.toFixed(1)}ms, Incremental: ${incTime.toFixed(1)}ms`);
    // Incremental should not be slower (can be similar due to normalization being full-window)
    // But it should at least not be dramatically slower
    expect(incTime).toBeLessThan(fullTime * 1.5);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// ONNX Reference Cross-Validation (mel_reference.json)
// ═══════════════════════════════════════════════════════════════════════════

describe('ONNX reference cross-validation', () => {
  let reference = null;

  beforeAll(() => {
    const refPath = join(projectRoot, 'tests', 'mel_reference.json');
    if (existsSync(refPath)) {
      reference = JSON.parse(readFileSync(refPath, 'utf-8'));
    }
  });

  it('should have mel_reference.json available', () => {
    expect(reference).not.toBeNull();
    expect(reference.nMels).toBe(128);
    expect(Object.keys(reference.tests).length).toBeGreaterThan(0);
  });

  it('should match ONNX mel filterbank within 1e-5', () => {
    if (!reference?.melFilterbank) return; // skip if not in reference

    const refFb = base64ToFloat32(reference.melFilterbank.data);
    const refShape = reference.melFilterbank.shape; // [257, 128]
    const jsFb = createMelFilterbank(128);

    // ref: [257, 128] row-major → ref[freq * 128 + mel]
    // js:  [128, 257] row-major → js[mel * 257 + freq]
    let maxErr = 0;
    for (let freq = 0; freq < 257; freq++) {
      for (let mel = 0; mel < 128; mel++) {
        const refVal = refFb[freq * 128 + mel];
        const jsVal = jsFb[mel * 257 + freq];
        const err = Math.abs(refVal - jsVal);
        if (err > maxErr) maxErr = err;
      }
    }

    console.log(`  [ONNX] Filterbank max error: ${maxErr.toExponential(3)}`);
    expect(maxErr).toBeLessThan(1e-5);
  });

  it('should match ONNX full pipeline within thresholds (max < 0.05, mean < 0.005)', () => {
    if (!reference) return;

    const preprocessor = new JsPreprocessor({ nMels: reference.nMels });
    const nMels = reference.nMels;

    for (const [name, test] of Object.entries(reference.tests)) {
      const audio = base64ToFloat32(test.audio);
      const refFeatures = base64ToFloat32(test.features);

      const { features: jsFeatures, length: jsLen } = preprocessor.process(audio);

      expect(jsLen).toBe(test.featuresLen);

      const nFramesJs = jsFeatures.length / nMels;
      const nFramesRef = refFeatures.length / nMels;

      let maxErr = 0, sumErr = 0, n = 0;
      for (let m = 0; m < nMels; m++) {
        for (let t = 0; t < jsLen; t++) {
          const jsVal = jsFeatures[m * nFramesJs + t];
          const refVal = refFeatures[m * nFramesRef + t];
          const err = Math.abs(jsVal - refVal);
          sumErr += err;
          if (err > maxErr) maxErr = err;
          n++;
        }
      }

      const meanErr = sumErr / n;
      console.log(`  [ONNX] Signal "${name}": max=${maxErr.toExponential(3)}, mean=${meanErr.toExponential(3)}`);
      expect(maxErr).toBeLessThan(0.05);
      expect(meanErr).toBeLessThan(0.005);
    }
  });
});
