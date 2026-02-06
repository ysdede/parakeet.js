/**
 * BoncukJS - Mel Spectrogram Math
 * 
 * Pure computation functions for mel spectrogram feature extraction.
 * Matches NeMo / onnx-asr / parakeet.js mel.js exactly.
 * 
 * Designed to be self-contained and reusable:
 *   - No external dependencies
 *   - All functions are pure (no side effects)
 *   - Can be imported by workers, tests, or bundled as a standalone package
 */

// ═══════════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════════

export const MEL_CONSTANTS = {
    SAMPLE_RATE: 16000,
    N_FFT: 512,
    WIN_LENGTH: 400,
    HOP_LENGTH: 160,
    PREEMPH: 0.97,
    LOG_ZERO_GUARD: 2 ** -24, // float(2**-24) ≈ 5.96e-8
    N_FREQ_BINS: (512 >> 1) + 1, // 257
    DEFAULT_N_MELS: 128,
} as const;

// Slaney Mel Scale constants
const F_SP = 200.0 / 3; // ~66.667 Hz spacing in linear region
const MIN_LOG_HZ = 1000.0;
const MIN_LOG_MEL = MIN_LOG_HZ / F_SP; // = 15.0
const LOG_STEP = Math.log(6.4) / 27.0;

// ═══════════════════════════════════════════════════════════════════════════
// Mel Scale Helpers
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Convert frequency in Hz to mel scale (Slaney variant).
 */
export function hzToMel(freq: number): number {
    return freq >= MIN_LOG_HZ
        ? MIN_LOG_MEL + Math.log(freq / MIN_LOG_HZ) / LOG_STEP
        : freq / F_SP;
}

/**
 * Convert mel scale value back to Hz (Slaney variant).
 */
export function melToHz(mel: number): number {
    return mel >= MIN_LOG_MEL
        ? MIN_LOG_HZ * Math.exp(LOG_STEP * (mel - MIN_LOG_MEL))
        : mel * F_SP;
}

/**
 * Create mel filterbank matrix [nMels × N_FREQ_BINS] with Slaney normalization.
 * Returns a flat Float32Array in row-major order.
 */
export function createMelFilterbank(nMels: number): Float32Array {
    const { SAMPLE_RATE, N_FREQ_BINS } = MEL_CONSTANTS;
    const fMax = SAMPLE_RATE / 2; // 8000

    const allFreqs = new Float64Array(N_FREQ_BINS);
    for (let i = 0; i < N_FREQ_BINS; i++) {
        allFreqs[i] = (fMax * i) / (N_FREQ_BINS - 1);
    }

    const melMin = hzToMel(0);
    const melMax = hzToMel(fMax);
    const nPoints = nMels + 2;
    const fPts = new Float64Array(nPoints);
    for (let i = 0; i < nPoints; i++) {
        fPts[i] = melToHz(melMin + ((melMax - melMin) * i) / (nPoints - 1));
    }

    const fDiff = new Float64Array(nPoints - 1);
    for (let i = 0; i < nPoints - 1; i++) {
        fDiff[i] = fPts[i + 1] - fPts[i];
    }

    const fb = new Float32Array(nMels * N_FREQ_BINS);
    for (let m = 0; m < nMels; m++) {
        const enorm = 2.0 / (fPts[m + 2] - fPts[m]); // slaney normalization
        const fbOffset = m * N_FREQ_BINS;
        for (let k = 0; k < N_FREQ_BINS; k++) {
            const downSlope = (allFreqs[k] - fPts[m]) / fDiff[m];
            const upSlope = (fPts[m + 2] - allFreqs[k]) / fDiff[m + 1];
            fb[fbOffset + k] = Math.max(0, Math.min(downSlope, upSlope)) * enorm;
        }
    }
    return fb;
}

/**
 * Create a Hann window of length WIN_LENGTH, zero-padded to N_FFT.
 */
export function createPaddedHannWindow(): Float64Array {
    const { N_FFT, WIN_LENGTH } = MEL_CONSTANTS;
    const window = new Float64Array(N_FFT);
    const padLeft = (N_FFT - WIN_LENGTH) >> 1; // 56
    for (let n = 0; n < WIN_LENGTH; n++) {
        window[padLeft + n] = 0.5 * (1 - Math.cos((2 * Math.PI * n) / (WIN_LENGTH - 1)));
    }
    return window;
}

/**
 * Precompute FFT twiddle factors for a given size N.
 */
export function precomputeTwiddles(N: number): { cos: Float64Array; sin: Float64Array } {
    const half = N >> 1;
    const cos = new Float64Array(half);
    const sin = new Float64Array(half);
    for (let i = 0; i < half; i++) {
        const angle = (-2 * Math.PI * i) / N;
        cos[i] = Math.cos(angle);
        sin[i] = Math.sin(angle);
    }
    return { cos, sin };
}

/**
 * In-place radix-2 Cooley-Tukey FFT.
 * @param re Real part (modified in-place)
 * @param im Imaginary part (modified in-place)
 * @param n FFT size (must be power of 2)
 * @param tw Precomputed twiddle factors
 */
export function fft(re: Float64Array, im: Float64Array, n: number, tw: { cos: Float64Array; sin: Float64Array }): void {
    // Bit-reversal permutation
    for (let i = 1, j = 0; i < n; i++) {
        let bit = n >> 1;
        while (j & bit) { j ^= bit; bit >>= 1; }
        j ^= bit;
        if (i < j) {
            let tmp = re[i]; re[i] = re[j]; re[j] = tmp;
            tmp = im[i]; im[i] = im[j]; im[j] = tmp;
        }
    }
    // Cooley-Tukey butterfly
    for (let size = 2; size <= n; size <<= 1) {
        const half = size >> 1;
        const step = n / size;
        for (let i = 0; i < n; i += size) {
            for (let j = 0; j < half; j++) {
                const idx = j * step;
                const tRe = re[i + j + half] * tw.cos[idx] - im[i + j + half] * tw.sin[idx];
                const tIm = re[i + j + half] * tw.sin[idx] + im[i + j + half] * tw.cos[idx];
                re[i + j + half] = re[i + j] - tRe;
                im[i + j + half] = im[i + j] - tIm;
                re[i + j] += tRe;
                im[i + j] += tIm;
            }
        }
    }
}

/**
 * Apply pre-emphasis filter to audio samples.
 * @param chunk Raw audio chunk
 * @param lastSample Last sample from previous chunk (for continuity)
 * @param coeff Pre-emphasis coefficient (default 0.97)
 * @returns Pre-emphasized samples
 */
export function preemphasize(chunk: Float32Array, lastSample: number = 0, coeff: number = MEL_CONSTANTS.PREEMPH): Float32Array {
    const out = new Float32Array(chunk.length);
    out[0] = chunk[0] - coeff * lastSample;
    for (let i = 1; i < chunk.length; i++) {
        out[i] = chunk[i] - coeff * chunk[i - 1];
    }
    return out;
}

/**
 * Compute a single mel spectrogram frame from pre-emphasized audio.
 * @param preemphAudio Full pre-emphasized audio buffer
 * @param frameIdx Frame index
 * @param hannWindow Pre-computed Hann window
 * @param twiddles Pre-computed FFT twiddle factors
 * @param melFilterbank Pre-computed mel filterbank
 * @param nMels Number of mel bins
 * @returns Raw (un-normalized) log-mel values for this frame
 */
export function computeMelFrame(
    preemphAudio: Float32Array,
    frameIdx: number,
    hannWindow: Float64Array,
    twiddles: { cos: Float64Array; sin: Float64Array },
    melFilterbank: Float32Array,
    nMels: number,
): Float32Array {
    const { N_FFT, HOP_LENGTH, N_FREQ_BINS, LOG_ZERO_GUARD } = MEL_CONSTANTS;
    const pad = N_FFT >> 1; // 256
    const frameStart = frameIdx * HOP_LENGTH - pad;
    const preemphLen = preemphAudio.length;

    // Window the frame
    const fftRe = new Float64Array(N_FFT);
    const fftIm = new Float64Array(N_FFT);
    for (let k = 0; k < N_FFT; k++) {
        const idx = frameStart + k;
        const sample = (idx >= 0 && idx < preemphLen) ? preemphAudio[idx] : 0;
        fftRe[k] = sample * hannWindow[k];
        fftIm[k] = 0;
    }

    // FFT
    fft(fftRe, fftIm, N_FFT, twiddles);

    // Power spectrum
    const power = new Float32Array(N_FREQ_BINS);
    for (let k = 0; k < N_FREQ_BINS; k++) {
        power[k] = fftRe[k] * fftRe[k] + fftIm[k] * fftIm[k];
    }

    // Mel filterbank multiply + log
    const melFrame = new Float32Array(nMels);
    for (let m = 0; m < nMels; m++) {
        let melVal = 0;
        const fbOff = m * N_FREQ_BINS;
        for (let k = 0; k < N_FREQ_BINS; k++) {
            melVal += power[k] * melFilterbank[fbOff + k];
        }
        melFrame[m] = Math.log(melVal + LOG_ZERO_GUARD);
    }
    return melFrame;
}

/**
 * Normalize mel features per-feature with Bessel-corrected variance.
 * @param features Flat array [nMels × T], mel-major layout
 * @param nMels Number of mel bins
 * @param T Number of time frames
 * @returns Normalized features (new array)
 */
export function normalizeMelFeatures(features: Float32Array, nMels: number, T: number): Float32Array {
    const out = new Float32Array(features.length);

    for (let m = 0; m < nMels; m++) {
        const base = m * T;

        // Copy and compute mean
        let sum = 0;
        for (let t = 0; t < T; t++) {
            out[base + t] = features[base + t];
            sum += features[base + t];
        }
        const mean = sum / T;

        // Variance
        let varSum = 0;
        for (let t = 0; t < T; t++) {
            const d = out[base + t] - mean;
            varSum += d * d;
        }
        const invStd = T > 1
            ? 1.0 / (Math.sqrt(varSum / (T - 1)) + 1e-5)
            : 0;

        // Normalize
        for (let t = 0; t < T; t++) {
            out[base + t] = (out[base + t] - mean) * invStd;
        }
    }

    return out;
}

/**
 * Convert sample offset to frame index.
 */
export function sampleToFrame(sampleOffset: number): number {
    return Math.floor(sampleOffset / MEL_CONSTANTS.HOP_LENGTH);
}
