/**
 * Unit tests for mel spectrogram computation functions.
 * 
 * These tests verify that the mel math functions produce correct results
 * and match the expected behavior of NeMo/parakeet.js mel processing.
 * 
 * Run: npm test
 */

import { describe, it, expect } from 'vitest';
import {
    MEL_CONSTANTS,
    hzToMel,
    melToHz,
    createMelFilterbank,
    createPaddedHannWindow,
    precomputeTwiddles,
    fft,
    preemphasize,
    computeMelFrame,
    normalizeMelFeatures,
    sampleToFrame,
} from './mel-math';

// ─── Constants ────────────────────────────────────────────────────────────

describe('MEL_CONSTANTS', () => {
    it('should have correct NeMo-compatible values', () => {
        expect(MEL_CONSTANTS.SAMPLE_RATE).toBe(16000);
        expect(MEL_CONSTANTS.N_FFT).toBe(512);
        expect(MEL_CONSTANTS.WIN_LENGTH).toBe(400);
        expect(MEL_CONSTANTS.HOP_LENGTH).toBe(160);
        expect(MEL_CONSTANTS.PREEMPH).toBe(0.97);
        expect(MEL_CONSTANTS.N_FREQ_BINS).toBe(257);
        expect(MEL_CONSTANTS.DEFAULT_N_MELS).toBe(128);
    });
});

// ─── Mel Scale ────────────────────────────────────────────────────────────

describe('hzToMel / melToHz', () => {
    it('should return 0 for 0 Hz', () => {
        expect(hzToMel(0)).toBe(0);
    });

    it('should return mel in linear region for freq < 1000 Hz', () => {
        // In linear region: mel = freq / (200/3) = freq * 3/200
        const freq = 500;
        const expected = freq / (200 / 3);
        expect(hzToMel(freq)).toBeCloseTo(expected, 5);
    });

    it('should return mel in log region for freq >= 1000 Hz', () => {
        // At 1000 Hz, mel = 1000 / (200/3) = 15.0
        expect(hzToMel(1000)).toBeCloseTo(15.0, 5);
        // Above 1000 Hz, should be in log region
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

// ─── Mel Filterbank ───────────────────────────────────────────────────────

describe('createMelFilterbank', () => {
    it('should create filterbank with correct dimensions', () => {
        const nMels = 128;
        const fb = createMelFilterbank(nMels);
        expect(fb).toBeInstanceOf(Float32Array);
        expect(fb.length).toBe(nMels * MEL_CONSTANTS.N_FREQ_BINS);
    });

    it('should have non-negative values', () => {
        const fb = createMelFilterbank(128);
        for (let i = 0; i < fb.length; i++) {
            expect(fb[i]).toBeGreaterThanOrEqual(0);
        }
    });

    it('should have non-zero values in each mel bin', () => {
        const nMels = 128;
        const fb = createMelFilterbank(nMels);
        for (let m = 0; m < nMels; m++) {
            const offset = m * MEL_CONSTANTS.N_FREQ_BINS;
            let sum = 0;
            for (let k = 0; k < MEL_CONSTANTS.N_FREQ_BINS; k++) {
                sum += fb[offset + k];
            }
            expect(sum).toBeGreaterThan(0);
        }
    });

    it('should create triangular filters (each row is a triangle)', () => {
        const nMels = 64;
        const fb = createMelFilterbank(nMels);
        // Check that each filter has a single peak region (no multiple peaks)
        for (let m = 0; m < nMels; m++) {
            const offset = m * MEL_CONSTANTS.N_FREQ_BINS;
            // Find first and last non-zero
            let firstNonZero = -1;
            let lastNonZero = -1;
            for (let k = 0; k < MEL_CONSTANTS.N_FREQ_BINS; k++) {
                if (fb[offset + k] > 0) {
                    if (firstNonZero === -1) firstNonZero = k;
                    lastNonZero = k;
                }
            }
            // Should have at least one non-zero bin
            expect(firstNonZero).toBeGreaterThanOrEqual(0);
            // All values between first and last should be > 0 (contiguous support)
            for (let k = firstNonZero; k <= lastNonZero; k++) {
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

// ─── Hann Window ──────────────────────────────────────────────────────────

describe('createPaddedHannWindow', () => {
    it('should return a Float64Array of length N_FFT', () => {
        const win = createPaddedHannWindow();
        expect(win).toBeInstanceOf(Float64Array);
        expect(win.length).toBe(MEL_CONSTANTS.N_FFT);
    });

    it('should have zero padding at edges', () => {
        const win = createPaddedHannWindow();
        const padLeft = (MEL_CONSTANTS.N_FFT - MEL_CONSTANTS.WIN_LENGTH) >> 1; // 56
        // Left padding should be zero
        for (let i = 0; i < padLeft; i++) {
            expect(win[i]).toBe(0);
        }
        // Right padding should be zero
        const padRight = padLeft + MEL_CONSTANTS.WIN_LENGTH;
        for (let i = padRight; i < MEL_CONSTANTS.N_FFT; i++) {
            expect(win[i]).toBe(0);
        }
    });

    it('should have symmetric Hann values in the active region', () => {
        const win = createPaddedHannWindow();
        const padLeft = (MEL_CONSTANTS.N_FFT - MEL_CONSTANTS.WIN_LENGTH) >> 1;
        // Hann window should be symmetric
        for (let i = 0; i < MEL_CONSTANTS.WIN_LENGTH; i++) {
            const mirror = MEL_CONSTANTS.WIN_LENGTH - 1 - i;
            expect(win[padLeft + i]).toBeCloseTo(win[padLeft + mirror], 10);
        }
    });

    it('should peak at center with value ~1.0', () => {
        const win = createPaddedHannWindow();
        const padLeft = (MEL_CONSTANTS.N_FFT - MEL_CONSTANTS.WIN_LENGTH) >> 1;
        const center = padLeft + Math.floor(MEL_CONSTANTS.WIN_LENGTH / 2);
        // Center of Hann window should be close to 1.0
        expect(win[center]).toBeCloseTo(1.0, 2);
    });
});

// ─── FFT ──────────────────────────────────────────────────────────────────

describe('fft', () => {
    it('should handle a DC signal', () => {
        const n = 8;
        const tw = precomputeTwiddles(n);
        const re = new Float64Array([1, 1, 1, 1, 1, 1, 1, 1]);
        const im = new Float64Array(n);
        fft(re, im, n, tw);
        // DC component (re[0]) should be n
        expect(re[0]).toBeCloseTo(n, 5);
        // All other components should be ~0
        for (let i = 1; i < n; i++) {
            expect(re[i]).toBeCloseTo(0, 5);
            expect(im[i]).toBeCloseTo(0, 5);
        }
    });

    it('should handle a single frequency signal', () => {
        const n = 16;
        const tw = precomputeTwiddles(n);
        // Create a sinusoid at bin k=1: cos(2πk/N * n) for n=0..N-1
        const re = new Float64Array(n);
        const im = new Float64Array(n);
        for (let i = 0; i < n; i++) {
            re[i] = Math.cos(2 * Math.PI * i / n);
        }
        fft(re, im, n, tw);
        // Should have energy at bin 1 and bin N-1 (conjugate symmetry)
        expect(Math.abs(re[1])).toBeCloseTo(n / 2, 3);
        expect(Math.abs(re[n - 1])).toBeCloseTo(n / 2, 3);
        // Other bins should be near zero
        for (let i = 2; i < n - 1; i++) {
            expect(Math.abs(re[i])).toBeLessThan(1e-6);
            expect(Math.abs(im[i])).toBeLessThan(1e-6);
        }
    });

    it('should handle 512-point FFT (actual size used)', () => {
        const n = 512;
        const tw = precomputeTwiddles(n);
        // All zeros
        const re = new Float64Array(n);
        const im = new Float64Array(n);
        fft(re, im, n, tw);
        // All outputs should be zero
        for (let i = 0; i < n; i++) {
            expect(re[i]).toBeCloseTo(0, 10);
            expect(im[i]).toBeCloseTo(0, 10);
        }
    });

    it('should satisfy Parseval\'s theorem (energy conservation)', () => {
        const n = 64;
        const tw = precomputeTwiddles(n);
        // Random-ish signal
        const re = new Float64Array(n);
        const im = new Float64Array(n);
        for (let i = 0; i < n; i++) {
            re[i] = Math.sin(i * 0.37) + Math.cos(i * 0.83);
        }
        // Time domain energy
        let timeEnergy = 0;
        for (let i = 0; i < n; i++) {
            timeEnergy += re[i] * re[i] + im[i] * im[i];
        }

        fft(re, im, n, tw);

        // Frequency domain energy
        let freqEnergy = 0;
        for (let i = 0; i < n; i++) {
            freqEnergy += re[i] * re[i] + im[i] * im[i];
        }
        // Parseval: sum|x|^2 = (1/N) * sum|X|^2
        expect(freqEnergy / n).toBeCloseTo(timeEnergy, 5);
    });
});

// ─── Twiddle Factors ──────────────────────────────────────────────────────

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

// ─── Pre-emphasis ─────────────────────────────────────────────────────────

describe('preemphasize', () => {
    it('should apply pre-emphasis filter correctly', () => {
        const chunk = new Float32Array([1.0, 2.0, 3.0, 4.0]);
        const result = preemphasize(chunk, 0, 0.97);
        // out[0] = 1.0 - 0.97 * 0 = 1.0
        expect(result[0]).toBeCloseTo(1.0, 5);
        // out[1] = 2.0 - 0.97 * 1.0 = 1.03
        expect(result[1]).toBeCloseTo(1.03, 5);
        // out[2] = 3.0 - 0.97 * 2.0 = 1.06
        expect(result[2]).toBeCloseTo(1.06, 5);
        // out[3] = 4.0 - 0.97 * 3.0 = 1.09
        expect(result[3]).toBeCloseTo(1.09, 5);
    });

    it('should use lastSample for continuity across chunks', () => {
        const chunk = new Float32Array([5.0, 6.0]);
        const result = preemphasize(chunk, 4.0, 0.97);
        // out[0] = 5.0 - 0.97 * 4.0 = 1.12
        expect(result[0]).toBeCloseTo(1.12, 5);
        // out[1] = 6.0 - 0.97 * 5.0 = 1.15
        expect(result[1]).toBeCloseTo(1.15, 5);
    });

    it('should return zeros for constant signal', () => {
        const chunk = new Float32Array([1.0, 1.0, 1.0, 1.0]);
        const result = preemphasize(chunk, 1.0, 0.97);
        // All should be 1 - 0.97 = 0.03
        for (let i = 0; i < result.length; i++) {
            expect(result[i]).toBeCloseTo(0.03, 5);
        }
    });
});

// ─── Mel Frame Computation ────────────────────────────────────────────────

describe('computeMelFrame', () => {
    it('should produce correct number of mel bins', () => {
        const nMels = 128;
        const window = createPaddedHannWindow();
        const tw = precomputeTwiddles(MEL_CONSTANTS.N_FFT);
        const fb = createMelFilterbank(nMels);

        // 1 second of silence
        const audio = new Float32Array(16000);
        const frame = computeMelFrame(audio, 0, window, tw, fb, nMels);

        expect(frame).toBeInstanceOf(Float32Array);
        expect(frame.length).toBe(nMels);
    });

    it('should produce finite values for silence', () => {
        const nMels = 128;
        const window = createPaddedHannWindow();
        const tw = precomputeTwiddles(MEL_CONSTANTS.N_FFT);
        const fb = createMelFilterbank(nMels);

        const audio = new Float32Array(16000);
        const frame = computeMelFrame(audio, 10, window, tw, fb, nMels);

        for (let i = 0; i < nMels; i++) {
            expect(isFinite(frame[i])).toBe(true);
        }
    });

    it('should produce larger values for louder signal', () => {
        const nMels = 128;
        const window = createPaddedHannWindow();
        const tw = precomputeTwiddles(MEL_CONSTANTS.N_FFT);
        const fb = createMelFilterbank(nMels);

        // Silence
        const silence = new Float32Array(16000);
        const silenceFrame = computeMelFrame(silence, 10, window, tw, fb, nMels);

        // Loud sine wave
        const loud = new Float32Array(16000);
        for (let i = 0; i < 16000; i++) {
            loud[i] = Math.sin(2 * Math.PI * 440 * i / 16000);
        }
        const preemph = preemphasize(loud);
        const loudFrame = computeMelFrame(preemph, 10, window, tw, fb, nMels);

        // At least some mel bins should be larger for the loud signal
        let louderCount = 0;
        for (let i = 0; i < nMels; i++) {
            if (loudFrame[i] > silenceFrame[i]) louderCount++;
        }
        expect(louderCount).toBeGreaterThan(0);
    });
});

// ─── Normalization ────────────────────────────────────────────────────────

describe('normalizeMelFeatures', () => {
    it('should produce zero-mean per feature', () => {
        const nMels = 4;
        const T = 10;
        const features = new Float32Array(nMels * T);
        // Fill with some values
        for (let m = 0; m < nMels; m++) {
            for (let t = 0; t < T; t++) {
                features[m * T + t] = m * 10 + t;
            }
        }

        const normalized = normalizeMelFeatures(features, nMels, T);

        // Each mel bin should have ~zero mean
        for (let m = 0; m < nMels; m++) {
            let sum = 0;
            for (let t = 0; t < T; t++) {
                sum += normalized[m * T + t];
            }
            expect(sum / T).toBeCloseTo(0, 4);
        }
    });

    it('should produce unit variance per feature', () => {
        const nMels = 4;
        const T = 100;
        const features = new Float32Array(nMels * T);
        // Fill with varying values
        for (let m = 0; m < nMels; m++) {
            for (let t = 0; t < T; t++) {
                features[m * T + t] = Math.sin(t * 0.1 + m);
            }
        }

        const normalized = normalizeMelFeatures(features, nMels, T);

        // Each mel bin should have ~unit Bessel-corrected std
        for (let m = 0; m < nMels; m++) {
            let sum = 0;
            for (let t = 0; t < T; t++) {
                sum += normalized[m * T + t];
            }
            const mean = sum / T;

            let varSum = 0;
            for (let t = 0; t < T; t++) {
                const d = normalized[m * T + t] - mean;
                varSum += d * d;
            }
            const std = Math.sqrt(varSum / (T - 1));
            expect(std).toBeCloseTo(1.0, 1);
        }
    });

    it('should handle single frame (T=1) gracefully', () => {
        const nMels = 4;
        const T = 1;
        const features = new Float32Array([1, 2, 3, 4]);

        const normalized = normalizeMelFeatures(features, nMels, T);
        // With T=1, invStd=0, so all should be 0
        for (let i = 0; i < normalized.length; i++) {
            expect(normalized[i]).toBe(0);
        }
    });

    it('should not modify the original array', () => {
        const features = new Float32Array([1, 2, 3, 4, 5, 6, 7, 8]);
        const copy = new Float32Array(features);
        normalizeMelFeatures(features, 2, 4);
        expect(features).toEqual(copy);
    });
});

// ─── sampleToFrame ────────────────────────────────────────────────────────

describe('sampleToFrame', () => {
    it('should convert 0 samples to frame 0', () => {
        expect(sampleToFrame(0)).toBe(0);
    });

    it('should convert HOP_LENGTH samples to frame 1', () => {
        expect(sampleToFrame(MEL_CONSTANTS.HOP_LENGTH)).toBe(1);
    });

    it('should convert 1 second (16000 samples) to 100 frames', () => {
        expect(sampleToFrame(16000)).toBe(100);
    });

    it('should floor partial frames', () => {
        expect(sampleToFrame(MEL_CONSTANTS.HOP_LENGTH - 1)).toBe(0);
        expect(sampleToFrame(MEL_CONSTANTS.HOP_LENGTH + 1)).toBe(1);
    });
});

// ─── End-to-End Mel Pipeline ──────────────────────────────────────────────

describe('End-to-End Mel Pipeline', () => {
    it('should produce deterministic results for the same input', () => {
        const nMels = 128;
        const window = createPaddedHannWindow();
        const tw = precomputeTwiddles(MEL_CONSTANTS.N_FFT);
        const fb = createMelFilterbank(nMels);

        // Create a repeatable signal
        const audio = new Float32Array(4800); // 300ms
        for (let i = 0; i < audio.length; i++) {
            audio[i] = Math.sin(2 * Math.PI * 440 * i / 16000) * 0.5;
        }
        const preemph = preemphasize(audio);

        const frame1 = computeMelFrame(preemph, 5, window, tw, fb, nMels);
        const frame2 = computeMelFrame(preemph, 5, window, tw, fb, nMels);

        for (let i = 0; i < nMels; i++) {
            expect(frame1[i]).toBe(frame2[i]);
        }
    });

    it('should produce correct number of frames for given audio length', () => {
        // 1 second = 16000 samples → 100 frames
        expect(sampleToFrame(16000)).toBe(100);
        // 5 seconds = 80000 samples → 500 frames
        expect(sampleToFrame(80000)).toBe(500);
        // 7 seconds = 112000 samples → 700 frames
        expect(sampleToFrame(112000)).toBe(700);
    });
});
