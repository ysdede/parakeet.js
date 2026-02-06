#!/usr/bin/env node
/**
 * Test script comparing pure JS mel computation against ONNX reference.
 *
 * Usage:
 *   1. Generate reference: python tests/generate_mel_reference.py
 *   2. Run this test:      node tests/test_mel.mjs
 *
 * Tests:
 *   - Mel filterbank matrix accuracy
 *   - Full pipeline (PCM → normalized log-mel) accuracy
 *   - Multiple signal types (sine, noise, different lengths)
 *   - Incremental mel processor correctness
 */

import { readFileSync } from "fs";
import { fileURLToPath, pathToFileURL } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");

// Import mel.js (use pathToFileURL for Windows compatibility)
const melPath = pathToFileURL(join(projectRoot, "src", "mel.js")).href;
const {
  JsPreprocessor,
  IncrementalMelProcessor,
  MEL_CONSTANTS,
  createMelFilterbank,
} = await import(melPath);

// ═══════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════

function base64ToFloat32(b64) {
  const buf = Buffer.from(b64, "base64");
  return new Float32Array(
    buf.buffer,
    buf.byteOffset,
    buf.byteLength / Float32Array.BYTES_PER_ELEMENT
  );
}

function computeError(actual, expected, validCount = null) {
  const n = validCount || Math.min(actual.length, expected.length);
  let maxErr = 0;
  let sumErr = 0;
  let sumSqErr = 0;
  let maxErrIdx = -1;

  for (let i = 0; i < n; i++) {
    const err = Math.abs(actual[i] - expected[i]);
    sumErr += err;
    sumSqErr += err * err;
    if (err > maxErr) {
      maxErr = err;
      maxErrIdx = i;
    }
  }

  return {
    maxAbsError: maxErr,
    maxAbsErrorIdx: maxErrIdx,
    meanAbsError: sumErr / n,
    rmsError: Math.sqrt(sumSqErr / n),
    n,
  };
}

function formatError(err) {
  return (
    `max=${err.maxAbsError.toExponential(3)} (idx ${err.maxAbsErrorIdx}), ` +
    `mean=${err.meanAbsError.toExponential(3)}, ` +
    `rms=${err.rmsError.toExponential(3)}`
  );
}

// ═══════════════════════════════════════════════════════════════════
// Test: Mel Filterbank Matrix
// ═══════════════════════════════════════════════════════════════════

function testMelFilterbank(reference) {
  console.log("\n─── Test: Mel Filterbank Matrix ───────────────────────");

  if (!reference.melFilterbank) {
    console.log("  SKIP: No filterbank reference in JSON (rerun Python with --include-filterbank)");
    return true;
  }

  const refFb = base64ToFloat32(reference.melFilterbank.data);
  const refShape = reference.melFilterbank.shape; // [257, 128]
  console.log(`  Reference shape: [${refShape}]`);

  // Our JS filterbank is [nMels, nFreqs] = [128, 257] (transposed for cache efficiency)
  const jsFb = createMelFilterbank(128);
  console.log(`  JS filterbank size: ${jsFb.length} (${128} × ${257})`);

  // Compare - need to transpose for comparison
  // ref: [257, 128] row-major → ref[freq * 128 + mel]
  // js:  [128, 257] row-major → js[mel * 257 + freq]
  let maxErr = 0;
  let sumErr = 0;
  let n = 0;

  for (let freq = 0; freq < 257; freq++) {
    for (let mel = 0; mel < 128; mel++) {
      const refVal = refFb[freq * 128 + mel];
      const jsVal = jsFb[mel * 257 + freq];
      const err = Math.abs(refVal - jsVal);
      maxErr = Math.max(maxErr, err);
      sumErr += err;
      n++;
    }
  }

  const meanErr = sumErr / n;
  console.log(`  Max absolute error: ${maxErr.toExponential(3)}`);
  console.log(`  Mean absolute error: ${meanErr.toExponential(3)}`);

  const pass = maxErr < 1e-5;
  console.log(`  ${pass ? "PASS ✓" : "FAIL ✗"}`);
  return pass;
}

// ═══════════════════════════════════════════════════════════════════
// Test: Full Pipeline (PCM → Normalized Log-Mel)
// ═══════════════════════════════════════════════════════════════════

function testFullPipeline(reference) {
  console.log("\n─── Test: Full Pipeline ───────────────────────────────");

  const preprocessor = new JsPreprocessor({ nMels: reference.nMels });
  let allPass = true;

  for (const [name, test] of Object.entries(reference.tests)) {
    console.log(`\n  Signal: "${name}" (${test.audioLength} samples, ${(test.audioLength / 16000).toFixed(2)}s)`);

    const audio = base64ToFloat32(test.audio);
    const refFeatures = base64ToFloat32(test.features);

    // Run JS preprocessor
    const t0 = performance.now();
    const { features: jsFeatures, length: jsLen } = preprocessor.process(audio);
    const elapsed = performance.now() - t0;

    console.log(`    JS: ${jsLen} valid frames, ${jsFeatures.length} total values (${elapsed.toFixed(1)}ms)`);
    console.log(`    Ref: ${test.featuresLen} valid frames, ${refFeatures.length} total values`);

    // Check dimensions
    if (jsLen !== test.featuresLen) {
      console.log(`    FAIL ✗ Feature length mismatch: JS=${jsLen} vs Ref=${test.featuresLen}`);
      allPass = false;
      continue;
    }

    // Compare features (only valid frames)
    // Both are [nMels, nFrames] layout, compare first nMels * featuresLen values
    const nMels = reference.nMels;
    const nFramesJs = jsFeatures.length / nMels;
    const nFramesRef = refFeatures.length / nMels;

    // Compare mel-by-mel for valid frames
    let totalErr = { maxAbsError: 0, sumErr: 0, n: 0 };

    for (let m = 0; m < nMels; m++) {
      for (let t = 0; t < jsLen; t++) {
        const jsVal = jsFeatures[m * nFramesJs + t];
        const refVal = refFeatures[m * nFramesRef + t];
        const err = Math.abs(jsVal - refVal);
        totalErr.sumErr += err;
        totalErr.n++;
        if (err > totalErr.maxAbsError) {
          totalErr.maxAbsError = err;
        }
      }
    }

    const meanErr = totalErr.sumErr / totalErr.n;
    console.log(`    Max absolute error: ${totalErr.maxAbsError.toExponential(3)}`);
    console.log(`    Mean absolute error: ${meanErr.toExponential(3)}`);

    // Thresholds: ONNX uses float32, our FFT is float64, so differences come from
    // the float32 truncation of power spectrum + mel matmul accumulation differences
    const pass = totalErr.maxAbsError < 0.05 && meanErr < 0.005;
    console.log(`    ${pass ? "PASS ✓" : "FAIL ✗"} (thresholds: max<0.05, mean<0.005)`);
    if (!pass) allPass = false;
  }

  return allPass;
}

// ═══════════════════════════════════════════════════════════════════
// Test: Incremental Mel Processor
// ═══════════════════════════════════════════════════════════════════

function testIncrementalMel(reference) {
  console.log("\n─── Test: Incremental Mel Processor ───────────────────");

  // Use the 5s signal if available, otherwise 2s
  const testKey =
    "sine_mix_5s" in reference.tests ? "sine_mix_5s" : "sine_mix_2s";
  const test = reference.tests[testKey];
  if (!test) {
    console.log("  SKIP: No suitable test signal found");
    return true;
  }

  const audio = base64ToFloat32(test.audio);
  console.log(`  Signal: "${testKey}" (${audio.length} samples)`);

  // Full computation (reference)
  const preprocessor = new JsPreprocessor({ nMels: reference.nMels });
  const fullResult = preprocessor.process(audio);

  // Incremental computation: simulate 70% overlap
  const inc = new IncrementalMelProcessor({ nMels: reference.nMels });

  // First call: full audio (no prefix)
  const t0 = performance.now();
  const r1 = inc.process(audio, 0);
  const t1 = performance.now();

  // Second call: same audio but with 70% prefix hint
  const prefixSamples = Math.floor(audio.length * 0.7);
  const r2 = inc.process(audio, prefixSamples);
  const t2 = performance.now();

  console.log(`  Full computation: ${(t1 - t0).toFixed(1)}ms`);
  console.log(`  Incremental (70% overlap): ${(t2 - t1).toFixed(1)}ms`);
  console.log(`    Cached frames: ${r2.cachedFrames}, New frames: ${r2.newFrames}`);

  // Compare incremental result against full computation
  const nMels = reference.nMels;
  const nFrames1 = r1.features.length / nMels;
  const nFrames2 = r2.features.length / nMels;
  const nFramesFull = fullResult.features.length / nMels;

  let maxErr = 0;
  let n = 0;
  for (let m = 0; m < nMels; m++) {
    for (let t = 0; t < fullResult.length; t++) {
      const fullVal = fullResult.features[m * nFramesFull + t];
      const incVal = r2.features[m * nFrames2 + t];
      const err = Math.abs(fullVal - incVal);
      if (err > maxErr) maxErr = err;
      n++;
    }
  }

  console.log(`  Max error vs full: ${maxErr.toExponential(3)}`);

  // Incremental should match full exactly (same audio, just cached prefix)
  const pass = maxErr < 1e-6;
  console.log(`  ${pass ? "PASS ✓" : "FAIL ✗"} (threshold: <1e-6)`);
  return pass;
}

// ═══════════════════════════════════════════════════════════════════
// Test: Performance Benchmark
// ═══════════════════════════════════════════════════════════════════

function testPerformance() {
  console.log("\n─── Test: Performance Benchmark ───────────────────────");

  const preprocessor = new JsPreprocessor({ nMels: 128 });

  const durations = [0.5, 1, 2, 5, 10]; // seconds
  for (const dur of durations) {
    const N = dur * 16000;
    const audio = new Float32Array(N);
    // Generate simple test signal
    for (let i = 0; i < N; i++) {
      const t = i / 16000;
      audio[i] = 0.5 * Math.sin(2 * Math.PI * 440 * t);
    }

    // Warm-up
    preprocessor.process(audio);

    // Benchmark (5 runs)
    const times = [];
    for (let r = 0; r < 5; r++) {
      const t0 = performance.now();
      preprocessor.process(audio);
      times.push(performance.now() - t0);
    }

    const avg = times.reduce((a, b) => a + b) / times.length;
    const min = Math.min(...times);
    console.log(`  ${dur}s audio (${N} samples): avg=${avg.toFixed(1)}ms, min=${min.toFixed(1)}ms`);
  }

  return true;
}

// ═══════════════════════════════════════════════════════════════════
// Test: Standalone (no reference needed)
// ═══════════════════════════════════════════════════════════════════

function testStandalone() {
  console.log("\n─── Test: Standalone Sanity Checks ────────────────────");

  const preprocessor = new JsPreprocessor({ nMels: 128 });
  let allPass = true;

  // Test 1: Empty audio
  {
    const { features, length } = preprocessor.process(new Float32Array(0));
    const pass = features.length === 0 && length === 0;
    console.log(`  Empty audio: ${pass ? "PASS ✓" : "FAIL ✗"}`);
    allPass = allPass && pass;
  }

  // Test 2: Very short audio (< 1 frame)
  {
    const { features, length } = preprocessor.process(new Float32Array(100));
    const pass = length === 0;
    console.log(`  Very short audio (100 samples): length=${length} ${pass ? "PASS ✓" : "FAIL ✗"}`);
    allPass = allPass && pass;
  }

  // Test 3: Silence should have near-zero normalized output
  {
    const silence = new Float32Array(16000); // 1s of silence
    const { features, length } = preprocessor.process(silence);
    // Pre-emphasis of silence = silence, mel of silence = LOG_ZERO_GUARD,
    // normalization of constant = 0 (zero variance → invStd=0 → output=0 for N>1 case)
    // Actually for pure silence, all frames are identical, so variance is 0,
    // invStd = 1/(sqrt(0) + 1e-5) = 1/1e-5 = 100000, and (x-mean) = 0 → normalized = 0
    let maxAbs = 0;
    for (let i = 0; i < features.length; i++) {
      maxAbs = Math.max(maxAbs, Math.abs(features[i]));
    }
    const pass = maxAbs < 1e-3;
    console.log(`  Silence: maxAbs=${maxAbs.toExponential(3)} ${pass ? "PASS ✓" : "FAIL ✗"}`);
    allPass = allPass && pass;
  }

  // Test 4: Frame count calculation
  {
    const audio = new Float32Array(32000); // 2s
    const { length } = preprocessor.process(audio);
    const expected = Math.floor(32000 / 160); // 200
    const pass = length === expected;
    console.log(`  Frame count: JS=${length}, expected=${expected} ${pass ? "PASS ✓" : "FAIL ✗"}`);
    allPass = allPass && pass;
  }

  // Test 5: Output dimensions
  {
    const audio = new Float32Array(32000);
    for (let i = 0; i < audio.length; i++) audio[i] = Math.sin(2 * Math.PI * 440 * i / 16000);
    const { features, length } = preprocessor.process(audio);
    const nFramesTotal = features.length / 128;
    const pass = Number.isInteger(nFramesTotal) && length <= nFramesTotal;
    console.log(`  Output shape: [128, ${nFramesTotal}], valid=${length} ${pass ? "PASS ✓" : "FAIL ✗"}`);
    allPass = allPass && pass;
  }

  return allPass;
}

// ═══════════════════════════════════════════════════════════════════
// Main
// ═══════════════════════════════════════════════════════════════════

async function main() {
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  Pure JS Mel Spectrogram Validation Test");
  console.log("═══════════════════════════════════════════════════════════");
  console.log(`  Constants: n_fft=${MEL_CONSTANTS.N_FFT}, hop=${MEL_CONSTANTS.HOP_LENGTH}, win=${MEL_CONSTANTS.WIN_LENGTH}`);
  console.log(`  Preemph: ${MEL_CONSTANTS.PREEMPH}, nMels: 128, sampleRate: ${MEL_CONSTANTS.SAMPLE_RATE}`);

  const results = {};

  // Always run standalone tests
  results.standalone = testStandalone();

  // Try to load reference
  const refPath = join(projectRoot, "tests", "mel_reference.json");
  let reference = null;
  try {
    const content = readFileSync(refPath, "utf-8");
    reference = JSON.parse(content);
    console.log(`\n  Reference loaded: ${refPath}`);
    console.log(`  ONNX model: ${reference.onnxModel}`);
    console.log(`  Tests: ${Object.keys(reference.tests).join(", ")}`);
  } catch (e) {
    console.log(`\n  ⚠ No reference file found at: ${refPath}`);
    console.log("  Run: python tests/generate_mel_reference.py");
    console.log("  Skipping ONNX comparison tests.\n");
  }

  if (reference) {
    results.filterbank = testMelFilterbank(reference);
    results.fullPipeline = testFullPipeline(reference);
    results.incremental = testIncrementalMel(reference);
  }

  // Performance benchmark
  results.performance = testPerformance();

  // Summary
  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("  RESULTS SUMMARY");
  console.log("═══════════════════════════════════════════════════════════");
  let allPass = true;
  for (const [name, pass] of Object.entries(results)) {
    console.log(`  ${pass ? "✓" : "✗"} ${name}`);
    if (!pass) allPass = false;
  }
  console.log(`\n  Overall: ${allPass ? "ALL PASSED ✓" : "SOME FAILED ✗"}`);

  process.exit(allPass ? 0 : 1);
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
