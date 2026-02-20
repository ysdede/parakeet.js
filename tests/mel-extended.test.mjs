/**
 * Extended unit tests for src/mel.js covering additional edge cases and
 * methods not directly tested in mel.test.mjs.
 *
 * This test suite focuses on:
 *   - computeRawMel() method with startFrame parameter
 *   - normalizeFeatures() method in isolation
 *   - Edge cases for IncrementalMelProcessor optimization
 *   - Boundary conditions and negative test cases
 *   - Regression tests for incremental mel calculation optimization
 *
 * Run: npm test
 */

import { describe, it, expect, beforeEach } from 'vitest';

// Import from mel.js
const melPath = new URL('../src/mel.js', import.meta.url).href;
const {
  JsPreprocessor,
  IncrementalMelProcessor,
  MEL_CONSTANTS,
} = await import(melPath);

// ═══════════════════════════════════════════════════════════════════════════
// JsPreprocessor.computeRawMel() - Direct Testing
// ═══════════════════════════════════════════════════════════════════════════

describe('JsPreprocessor.computeRawMel()', () => {
  let preprocessor;

  beforeEach(() => {
    preprocessor = new JsPreprocessor({ nMels: 128 });
  });

  it('should compute raw mel features without normalization', () => {
    const audio = new Float32Array(16000); // 1 second
    for (let i = 0; i < audio.length; i++) {
      audio[i] = Math.sin(2 * Math.PI * 440 * i / 16000) * 0.5;
    }

    const { rawMel, nFrames, featuresLen } = preprocessor.computeRawMel(audio);

    expect(rawMel).toBeInstanceOf(Float32Array);
    expect(nFrames).toBeGreaterThan(0);
    expect(featuresLen).toBe(Math.floor(audio.length / MEL_CONSTANTS.HOP_LENGTH));
    expect(rawMel.length).toBe(128 * nFrames);

    // Raw mel should have non-zero values (not normalized to zero mean)
    let sum = 0;
    for (let i = 0; i < rawMel.length; i++) {
      sum += Math.abs(rawMel[i]);
    }
    expect(sum).toBeGreaterThan(0);
  });

  it('should handle empty audio', () => {
    const { rawMel, nFrames, featuresLen } = preprocessor.computeRawMel(new Float32Array(0));
    expect(rawMel.length).toBe(0);
    expect(nFrames).toBe(0);
    expect(featuresLen).toBe(0);
  });

  it('should handle audio shorter than one frame', () => {
    const audio = new Float32Array(100); // < 160 samples (HOP_LENGTH)
    const { rawMel, nFrames, featuresLen } = preprocessor.computeRawMel(audio);
    expect(rawMel.length).toBe(0);
    expect(nFrames).toBe(0);
    expect(featuresLen).toBe(0);
  });

  it('should support startFrame parameter to skip initial frames', () => {
    const audio = new Float32Array(32000); // 2 seconds
    for (let i = 0; i < audio.length; i++) {
      audio[i] = Math.sin(2 * Math.PI * 440 * i / 16000) * 0.5;
    }

    const startFrame = 50;
    const { rawMel, nFrames } = preprocessor.computeRawMel(audio, startFrame);

    // First startFrame frames should be zero (not computed)
    for (let m = 0; m < 128; m++) {
      for (let t = 0; t < startFrame; t++) {
        expect(rawMel[m * nFrames + t]).toBe(0);
      }
    }

    // Frames after startFrame should be non-zero
    let nonZeroCount = 0;
    for (let m = 0; m < 128; m++) {
      for (let t = startFrame; t < nFrames; t++) {
        if (Math.abs(rawMel[m * nFrames + t]) > 1e-10) {
          nonZeroCount++;
        }
      }
    }
    expect(nonZeroCount).toBeGreaterThan(0);
  });

  it('should produce identical frames when computed with different startFrame values', () => {
    const audio = new Float32Array(32000);
    for (let i = 0; i < audio.length; i++) {
      audio[i] = Math.sin(2 * Math.PI * 440 * i / 16000) * 0.5;
    }

    // Compute full
    const fullResult = preprocessor.computeRawMel(audio, 0);

    // Compute from frame 30
    const partialResult = preprocessor.computeRawMel(audio, 30);

    // Compare frames 30 onwards
    for (let m = 0; m < 128; m++) {
      for (let t = 30; t < fullResult.nFrames; t++) {
        const fullVal = fullResult.rawMel[m * fullResult.nFrames + t];
        const partialVal = partialResult.rawMel[m * partialResult.nFrames + t];
        expect(Math.abs(fullVal - partialVal)).toBeLessThan(1e-10);
      }
    }
  });

  it('should work with nMels=80', () => {
    const proc80 = new JsPreprocessor({ nMels: 80 });
    const audio = new Float32Array(16000);
    for (let i = 0; i < audio.length; i++) {
      audio[i] = Math.sin(2 * Math.PI * 440 * i / 16000) * 0.5;
    }

    const { rawMel, nFrames, featuresLen } = proc80.computeRawMel(audio);
    expect(rawMel.length).toBe(80 * nFrames);
    expect(featuresLen).toBeGreaterThan(0);
  });

  it('should produce finite values for all mel bins', () => {
    const audio = new Float32Array(16000);
    for (let i = 0; i < audio.length; i++) {
      audio[i] = Math.random() * 0.5 - 0.25; // White noise
    }

    const { rawMel } = preprocessor.computeRawMel(audio);
    for (let i = 0; i < rawMel.length; i++) {
      expect(isFinite(rawMel[i])).toBe(true);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// JsPreprocessor.normalizeFeatures() - Direct Testing
// ═══════════════════════════════════════════════════════════════════════════

describe('JsPreprocessor.normalizeFeatures()', () => {
  let preprocessor;

  beforeEach(() => {
    preprocessor = new JsPreprocessor({ nMels: 128 });
  });

  it('should normalize features to zero mean and unit variance', () => {
    const audio = new Float32Array(32000); // 2 seconds
    for (let i = 0; i < audio.length; i++) {
      audio[i] = Math.sin(2 * Math.PI * 440 * i / 16000) * 0.5;
    }

    const { rawMel, nFrames, featuresLen } = preprocessor.computeRawMel(audio);
    const normalized = preprocessor.normalizeFeatures(rawMel, nFrames, featuresLen);

    expect(normalized.length).toBe(128 * featuresLen);

    // Check mean is near zero for each mel bin
    for (let m = 0; m < 128; m++) {
      let sum = 0;
      for (let t = 0; t < featuresLen; t++) {
        sum += normalized[m * featuresLen + t];
      }
      const mean = sum / featuresLen;
      expect(Math.abs(mean)).toBeLessThan(1e-6);
    }

    // Check variance is near 1 for each mel bin (with Bessel correction)
    for (let m = 0; m < 128; m++) {
      let varSum = 0;
      for (let t = 0; t < featuresLen; t++) {
        varSum += normalized[m * featuresLen + t] ** 2;
      }
      const variance = varSum / (featuresLen - 1);
      // Should be close to 1, allowing some numerical error
      expect(variance).toBeGreaterThan(0.5);
      expect(variance).toBeLessThan(2.0);
    }
  });

  it('should handle single frame (featuresLen=1) by outputting zeros', () => {
    const audio = new Float32Array(160); // Exactly 1 frame worth of samples
    for (let i = 0; i < audio.length; i++) {
      audio[i] = Math.sin(2 * Math.PI * 440 * i / 16000);
    }

    const { rawMel, nFrames, featuresLen } = preprocessor.computeRawMel(audio);
    if (featuresLen === 1) {
      const normalized = preprocessor.normalizeFeatures(rawMel, nFrames, featuresLen);

      // With single frame, normalization should output zeros (invStd = 0)
      for (let i = 0; i < normalized.length; i++) {
        expect(normalized[i]).toBe(0);
      }
    }
  });

  it('should produce deterministic output', () => {
    const audio = new Float32Array(16000);
    for (let i = 0; i < audio.length; i++) {
      audio[i] = Math.sin(2 * Math.PI * 440 * i / 16000) * 0.5;
    }

    const { rawMel, nFrames, featuresLen } = preprocessor.computeRawMel(audio);
    const normalized1 = preprocessor.normalizeFeatures(rawMel, nFrames, featuresLen);
    const normalized2 = preprocessor.normalizeFeatures(rawMel, nFrames, featuresLen);

    for (let i = 0; i < normalized1.length; i++) {
      expect(normalized1[i]).toBe(normalized2[i]);
    }
  });

  it('should handle different nMels values', () => {
    for (const nMels of [40, 64, 80, 128]) {
      const proc = new JsPreprocessor({ nMels });
      const audio = new Float32Array(16000);
      for (let i = 0; i < audio.length; i++) {
        audio[i] = Math.sin(2 * Math.PI * 440 * i / 16000) * 0.5;
      }

      const { rawMel, nFrames, featuresLen } = proc.computeRawMel(audio);
      const normalized = proc.normalizeFeatures(rawMel, nFrames, featuresLen);

      expect(normalized.length).toBe(nMels * featuresLen);
    }
  });

  it('should produce finite values only', () => {
    const audio = new Float32Array(16000);
    for (let i = 0; i < audio.length; i++) {
      audio[i] = Math.random() * 0.5 - 0.25;
    }

    const { rawMel, nFrames, featuresLen } = preprocessor.computeRawMel(audio);
    const normalized = preprocessor.normalizeFeatures(rawMel, nFrames, featuresLen);

    for (let i = 0; i < normalized.length; i++) {
      expect(isFinite(normalized[i])).toBe(true);
      expect(isNaN(normalized[i])).toBe(false);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// IncrementalMelProcessor - Extended Edge Cases
// ═══════════════════════════════════════════════════════════════════════════

describe('IncrementalMelProcessor - Extended Edge Cases', () => {
  it('should handle zero prefix (no caching)', () => {
    const inc = new IncrementalMelProcessor({ nMels: 128 });
    const audio = new Float32Array(32000);
    for (let i = 0; i < audio.length; i++) {
      audio[i] = Math.sin(2 * Math.PI * 440 * i / 16000) * 0.5;
    }

    const result = inc.process(audio, 0);
    expect(result.cached).toBe(false);
    expect(result.cachedFrames).toBe(0);
    expect(result.length).toBeGreaterThan(0);
  });

  it('should handle full audio prefix (maximum caching)', () => {
    const inc = new IncrementalMelProcessor({ nMels: 128 });
    const audio = new Float32Array(32000);
    for (let i = 0; i < audio.length; i++) {
      audio[i] = Math.sin(2 * Math.PI * 440 * i / 16000) * 0.5;
    }

    // First call
    inc.process(audio, 0);

    // Second call with full prefix
    const result = inc.process(audio, audio.length);
    expect(result.cached).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it('should handle different boundaryFrames values', () => {
    for (const boundaryFrames of [0, 1, 3, 5, 10]) {
      const inc = new IncrementalMelProcessor({ nMels: 128, boundaryFrames });
      const audio = new Float32Array(32000);
      for (let i = 0; i < audio.length; i++) {
        audio[i] = Math.sin(2 * Math.PI * 440 * i / 16000) * 0.5;
      }

      inc.process(audio, 0);
      const prefixSamples = Math.floor(audio.length * 0.5);
      const result = inc.process(audio, prefixSamples);

      expect(result.length).toBeGreaterThan(0);
      expect(result.features).toBeInstanceOf(Float32Array);
    }
  });

  it('should handle very small prefix (< boundary frames)', () => {
    const inc = new IncrementalMelProcessor({ nMels: 128, boundaryFrames: 3 });
    const audio = new Float32Array(32000);
    for (let i = 0; i < audio.length; i++) {
      audio[i] = Math.sin(2 * Math.PI * 440 * i / 16000) * 0.5;
    }

    inc.process(audio, 0);

    // Prefix of only 320 samples = 2 frames, less than boundaryFrames (3)
    const result = inc.process(audio, 320);
    expect(result.length).toBeGreaterThan(0);
  });

  it('should handle reset() method', () => {
    const inc = new IncrementalMelProcessor({ nMels: 128 });
    const audio = new Float32Array(16000);
    for (let i = 0; i < audio.length; i++) {
      audio[i] = Math.sin(2 * Math.PI * 440 * i / 16000);
    }

    inc.process(audio, 0);
    inc.reset();

    // After reset, should not use cache
    const result = inc.process(audio, audio.length);
    expect(result.cached).toBe(false);
  });

  it('should handle multiple resets and reprocessing', () => {
    const inc = new IncrementalMelProcessor({ nMels: 128 });
    const audio = new Float32Array(16000);
    for (let i = 0; i < audio.length; i++) {
      audio[i] = Math.sin(2 * Math.PI * 440 * i / 16000);
    }

    for (let i = 0; i < 3; i++) {
      inc.reset();
      const result = inc.process(audio, 0);
      expect(result.cached).toBe(false);
      expect(result.length).toBeGreaterThan(0);
    }
  });

  it('should produce consistent results across various overlap percentages', () => {
    const full = new JsPreprocessor({ nMels: 128 });
    const audio = new Float32Array(80000); // 5s
    for (let i = 0; i < audio.length; i++) {
      audio[i] = Math.sin(2 * Math.PI * 440 * i / 16000) * 0.5;
    }

    const fullResult = full.process(audio);

    const overlapPercentages = [0, 0.1, 0.25, 0.5, 0.7, 0.9, 1.0];
    for (const overlapPct of overlapPercentages) {
      const inc = new IncrementalMelProcessor({ nMels: 128 });
      inc.process(audio, 0); // Prime cache

      const prefixSamples = Math.floor(audio.length * overlapPct);
      const incResult = inc.process(audio, prefixSamples);

      expect(incResult.length).toBe(fullResult.length);

      // Compare features
      const nFramesFull = fullResult.features.length / 128;
      const nFramesInc = incResult.features.length / 128;
      let maxErr = 0;
      for (let i = 0; i < Math.min(fullResult.features.length, incResult.features.length); i++) {
        const err = Math.abs(fullResult.features[i] - incResult.features[i]);
        if (err > maxErr) maxErr = err;
      }

      expect(maxErr).toBeLessThan(1e-5);
    }
  });

  it('should handle nMels=80 in incremental mode', () => {
    const inc = new IncrementalMelProcessor({ nMels: 80 });
    const audio = new Float32Array(32000);
    for (let i = 0; i < audio.length; i++) {
      audio[i] = Math.sin(2 * Math.PI * 440 * i / 16000) * 0.5;
    }

    const result1 = inc.process(audio, 0);
    expect(result1.features.length).toBe(80 * result1.length);

    const prefixSamples = Math.floor(audio.length * 0.6);
    const result2 = inc.process(audio, prefixSamples);
    expect(result2.cached).toBe(true);
    expect(result2.features.length).toBe(80 * result2.length);
  });

  it('should handle changing audio lengths between calls', () => {
    const inc = new IncrementalMelProcessor({ nMels: 128 });

    // First: 1 second
    const audio1 = new Float32Array(16000);
    for (let i = 0; i < audio1.length; i++) {
      audio1[i] = Math.sin(2 * Math.PI * 440 * i / 16000) * 0.5;
    }
    const result1 = inc.process(audio1, 0);

    // Second: 2 seconds (longer)
    const audio2 = new Float32Array(32000);
    for (let i = 0; i < audio2.length; i++) {
      audio2[i] = Math.sin(2 * Math.PI * 440 * i / 16000) * 0.5;
    }
    const result2 = inc.process(audio2, 0);

    // Third: 0.5 seconds (shorter)
    const audio3 = new Float32Array(8000);
    for (let i = 0; i < audio3.length; i++) {
      audio3[i] = Math.sin(2 * Math.PI * 440 * i / 16000) * 0.5;
    }
    const result3 = inc.process(audio3, 0);

    expect(result1.length).toBeGreaterThan(0);
    expect(result2.length).toBeGreaterThan(result1.length);
    expect(result3.length).toBeLessThan(result1.length);
  });

  it('should handle prefix larger than cached audio (cache invalidation)', () => {
    const inc = new IncrementalMelProcessor({ nMels: 128 });
    const audio1 = new Float32Array(16000);
    for (let i = 0; i < audio1.length; i++) {
      audio1[i] = Math.sin(2 * Math.PI * 440 * i / 16000) * 0.5;
    }
    inc.process(audio1, 0);

    // Claim prefix longer than cached audio — should fall back to full computation
    const audio2 = new Float32Array(32000);
    for (let i = 0; i < audio2.length; i++) {
      audio2[i] = Math.sin(2 * Math.PI * 440 * i / 16000) * 0.5;
    }
    const result = inc.process(audio2, audio1.length + 1000);

    expect(result.cached).toBe(false);
    expect(result.length).toBeGreaterThan(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Regression Tests for Incremental Optimization
// ═══════════════════════════════════════════════════════════════════════════

describe('Regression: Incremental Mel Optimization', () => {
  it('should save computation time with caching (regression test)', () => {
    const inc = new IncrementalMelProcessor({ nMels: 128 });
    const audio = new Float32Array(80000); // 5s
    for (let i = 0; i < audio.length; i++) {
      audio[i] = Math.sin(2 * Math.PI * 440 * i / 16000) * 0.5;
    }

    // First call
    const r1 = inc.process(audio, 0);
    expect(r1.cached).toBe(false);
    expect(r1.cachedFrames).toBe(0);

    // Second call with 70% overlap
    const prefixSamples = Math.floor(audio.length * 0.7);
    const r2 = inc.process(audio, prefixSamples);
    expect(r2.cached).toBe(true);
    expect(r2.cachedFrames).toBeGreaterThan(0);
    expect(r2.newFrames).toBeLessThan(r2.length);

    // Verify cache benefit: cachedFrames should be substantial
    expect(r2.cachedFrames).toBeGreaterThan(r2.length * 0.5);
  });

  it('should handle streaming scenario: overlapping windows', () => {
    const inc = new IncrementalMelProcessor({ nMels: 128 });
    const windowSize = 80000; // 5s
    const hopSize = 24000; // 1.5s new audio
    const overlapSize = windowSize - hopSize; // 3.5s overlap

    // Simulate 3 streaming windows
    const fullAudio = new Float32Array(windowSize + 2 * hopSize);
    for (let i = 0; i < fullAudio.length; i++) {
      fullAudio[i] = Math.sin(2 * Math.PI * 440 * i / 16000) * 0.5;
    }

    // Window 1: [0, windowSize)
    const window1 = fullAudio.slice(0, windowSize);
    const r1 = inc.process(window1, 0);
    expect(r1.cached).toBe(false);

    // Window 2: [hopSize, windowSize + hopSize) — overlaps with window1
    const window2 = fullAudio.slice(hopSize, windowSize + hopSize);
    const r2 = inc.process(window2, overlapSize);
    expect(r2.cached).toBe(true);
    expect(r2.cachedFrames).toBeGreaterThan(0);

    // Window 3: [2*hopSize, windowSize + 2*hopSize) — overlaps with window2
    const window3 = fullAudio.slice(2 * hopSize, windowSize + 2 * hopSize);
    const r3 = inc.process(window3, overlapSize);
    expect(r3.cached).toBe(true);
    expect(r3.cachedFrames).toBeGreaterThan(0);
  });

  it('should maintain accuracy with boundary frame adjustment', () => {
    const full = new JsPreprocessor({ nMels: 128 });
    const inc = new IncrementalMelProcessor({ nMels: 128, boundaryFrames: 3 });

    const audio = new Float32Array(80000);
    for (let i = 0; i < audio.length; i++) {
      audio[i] = Math.sin(2 * Math.PI * 440 * i / 16000) * 0.5 +
                 Math.sin(2 * Math.PI * 880 * i / 16000) * 0.3;
    }

    const fullResult = full.process(audio);

    // Prime incremental cache
    inc.process(audio, 0);

    // Process with 60% overlap
    const prefixSamples = Math.floor(audio.length * 0.6);
    const incResult = inc.process(audio, prefixSamples);

    // Should match full computation
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
});

// ═══════════════════════════════════════════════════════════════════════════
// Negative Test Cases and Edge Conditions
// ═══════════════════════════════════════════════════════════════════════════

describe('Negative Test Cases', () => {
  it('should handle all-zero audio without errors', () => {
    const preprocessor = new JsPreprocessor({ nMels: 128 });
    const silence = new Float32Array(16000); // All zeros

    const { features, length } = preprocessor.process(silence);
    expect(length).toBeGreaterThan(0);

    // Normalized silence should be near-zero
    for (let i = 0; i < features.length; i++) {
      expect(isFinite(features[i])).toBe(true);
      expect(Math.abs(features[i])).toBeLessThan(0.01);
    }
  });

  it('should handle very high amplitude audio', () => {
    const preprocessor = new JsPreprocessor({ nMels: 128 });
    const audio = new Float32Array(16000);
    for (let i = 0; i < audio.length; i++) {
      audio[i] = 0.99; // Near clipping
    }

    const { features, length } = preprocessor.process(audio);
    expect(length).toBeGreaterThan(0);

    for (let i = 0; i < features.length; i++) {
      expect(isFinite(features[i])).toBe(true);
    }
  });

  it('should handle audio with extreme values', () => {
    const preprocessor = new JsPreprocessor({ nMels: 128 });
    const audio = new Float32Array(16000);
    for (let i = 0; i < audio.length; i++) {
      audio[i] = i % 2 === 0 ? -1.0 : 1.0; // Square wave at max amplitude
    }

    const { features, length } = preprocessor.process(audio);
    expect(length).toBeGreaterThan(0);

    for (let i = 0; i < features.length; i++) {
      expect(isFinite(features[i])).toBe(true);
      expect(isNaN(features[i])).toBe(false);
    }
  });

  it('should handle audio with single non-zero sample', () => {
    const preprocessor = new JsPreprocessor({ nMels: 128 });
    const audio = new Float32Array(16000);
    audio[8000] = 1.0; // Single impulse in middle

    const { features, length } = preprocessor.process(audio);
    expect(length).toBeGreaterThan(0);

    for (let i = 0; i < features.length; i++) {
      expect(isFinite(features[i])).toBe(true);
    }
  });

  it('should handle IncrementalMelProcessor with empty audio', () => {
    const inc = new IncrementalMelProcessor({ nMels: 128 });
    const result = inc.process(new Float32Array(0), 0);

    expect(result.features.length).toBe(0);
    expect(result.length).toBe(0);
    expect(result.cached).toBe(false);
  });

  it('should handle clear() after processing', () => {
    const inc = new IncrementalMelProcessor({ nMels: 128 });
    const audio = new Float32Array(16000);
    for (let i = 0; i < audio.length; i++) {
      audio[i] = Math.sin(2 * Math.PI * 440 * i / 16000);
    }

    inc.process(audio, 0);
    inc.clear();

    // Process again — should not use cache
    const result = inc.process(audio, audio.length);
    expect(result.cached).toBe(false);
  });

  it('should not crash with unusual nMels values', () => {
    for (const nMels of [1, 2, 16, 32, 256]) {
      const preprocessor = new JsPreprocessor({ nMels });
      const audio = new Float32Array(16000);
      for (let i = 0; i < audio.length; i++) {
        audio[i] = Math.sin(2 * Math.PI * 440 * i / 16000) * 0.5;
      }

      const { features, length } = preprocessor.process(audio);
      expect(length).toBeGreaterThan(0);
      expect(features.length).toBe(nMels * (features.length / nMels));
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Additional Boundary Conditions
// ═══════════════════════════════════════════════════════════════════════════

describe('Boundary Conditions', () => {
  it('should handle audio length exactly equal to N_FFT', () => {
    const preprocessor = new JsPreprocessor({ nMels: 128 });
    const audio = new Float32Array(MEL_CONSTANTS.N_FFT);
    for (let i = 0; i < audio.length; i++) {
      audio[i] = Math.sin(2 * Math.PI * 440 * i / 16000);
    }

    const { features, length } = preprocessor.process(audio);
    expect(length).toBeGreaterThanOrEqual(0);
  });

  it('should handle audio length exactly equal to HOP_LENGTH', () => {
    const preprocessor = new JsPreprocessor({ nMels: 128 });
    const audio = new Float32Array(MEL_CONSTANTS.HOP_LENGTH);
    for (let i = 0; i < audio.length; i++) {
      audio[i] = Math.sin(2 * Math.PI * 440 * i / 16000);
    }

    const { features, length } = preprocessor.process(audio);
    expect(length).toBe(1);
  });

  it('should handle audio length = N_FFT + HOP_LENGTH', () => {
    const preprocessor = new JsPreprocessor({ nMels: 128 });
    const audioLen = MEL_CONSTANTS.N_FFT + MEL_CONSTANTS.HOP_LENGTH;
    const audio = new Float32Array(audioLen);
    for (let i = 0; i < audio.length; i++) {
      audio[i] = Math.sin(2 * Math.PI * 440 * i / 16000);
    }

    const { features, length } = preprocessor.process(audio);
    expect(length).toBeGreaterThan(0);
  });

  it('should handle startFrame at boundary (last frame)', () => {
    const preprocessor = new JsPreprocessor({ nMels: 128 });
    const audio = new Float32Array(32000);
    for (let i = 0; i < audio.length; i++) {
      audio[i] = Math.sin(2 * Math.PI * 440 * i / 16000);
    }

    const { nFrames } = preprocessor.computeRawMel(audio, 0);
    const { rawMel: lastFrameOnly } = preprocessor.computeRawMel(audio, nFrames - 1);

    // Should compute only the last frame
    let nonZeroCount = 0;
    for (let m = 0; m < 128; m++) {
      if (Math.abs(lastFrameOnly[m * nFrames + (nFrames - 1)]) > 1e-10) {
        nonZeroCount++;
      }
    }
    expect(nonZeroCount).toBeGreaterThan(0);
  });

  it('should handle prefixSamples exactly at frame boundary', () => {
    const inc = new IncrementalMelProcessor({ nMels: 128 });
    const audio = new Float32Array(32000);
    for (let i = 0; i < audio.length; i++) {
      audio[i] = Math.sin(2 * Math.PI * 440 * i / 16000);
    }

    inc.process(audio, 0);

    // Prefix exactly at frame boundaries
    for (const numFrames of [10, 50, 100]) {
      const prefixSamples = numFrames * MEL_CONSTANTS.HOP_LENGTH;
      const result = inc.process(audio, prefixSamples);
      expect(result.length).toBeGreaterThan(0);
    }
  });
});