/**
 * Pure JavaScript log-mel spectrogram computation matching NeMo / onnx-asr nemo preprocessor.
 * Drop-in replacement for OnnxPreprocessor, enabling incremental computation for streaming.
 *
 * Pipeline (matching onnx-asr/preprocessors/nemo.py exactly):
 *   1. Pre-emphasis:       x[n] = x[n] - 0.97 * x[n-1]  (Float32)
 *   2. Time masking:       Zero samples beyond waveform length after pre-emphasis
 *                          (implicit in JS — we process exact-length audio, no batch padding)
 *   3. Zero-pad:           N_FFT/2 = 256 samples on each side
 *   4. STFT:               Cast to Float64, symmetric Hann window (400→512 zero-padded),
 *                          512-point FFT, hop_length=160
 *   5. Power spectrum:     |real|² + |imag|²  → cast back to Float32
 *   6. Mel filterbank:     MatMul with slaney-normalized triangular filterbank
 *   7. Log:                log(mel + 2^-24)
 *   8. Normalize:          Per-feature mean/variance (Bessel-corrected, N-1 denominator),
 *                          standardize valid frames, zero out invalid frames
 *
 * NeMo's original FilterbankFeatures also has dither, narrowband augmentation,
 * frame splicing, and pad-to-multiple — all disabled at inference and correctly
 * omitted by both onnx-asr and this JS implementation.
 *
 * Parameters: sample_rate=16000, n_fft=512, win_length=400, hop_length=160,
 *             preemph=0.97, mel_scale="slaney", norm="slaney",
 *             log_zero_guard=2^-24
 */

// ═══════════════════════════════════════════════════════════════════════════════
// Constants (matching NeMo / onnx-asr nemo.py)
// ═══════════════════════════════════════════════════════════════════════════════
const SAMPLE_RATE = 16000;
const N_FFT = 512;
const WIN_LENGTH = 400;
const HOP_LENGTH = 160;
const PREEMPH = 0.97;
const LOG_ZERO_GUARD = 2 ** -24; // float(2**-24) ≈ 5.96e-8
const N_FREQ_BINS = (N_FFT >> 1) + 1; // 257

// Shared precompute caches to avoid per-instance allocations.
const MEL_FILTERBANK_CACHE = new Map();
const FFT_TWIDDLE_CACHE = new Map();
let SHARED_HANN_WINDOW = null;

// ═══════════════════════════════════════════════════════════════════════════════
// Slaney Mel Scale (matching torchaudio.functional.melscale_fbanks)
// ═══════════════════════════════════════════════════════════════════════════════
const F_SP = 200.0 / 3; // ~66.667 Hz spacing in linear region
const MIN_LOG_HZ = 1000.0; // transition from linear to log
const MIN_LOG_MEL = MIN_LOG_HZ / F_SP; // = 15.0
const LOG_STEP = Math.log(6.4) / 27.0; // step size in log region

function hzToMel(freq) {
  return freq >= MIN_LOG_HZ
    ? MIN_LOG_MEL + Math.log(freq / MIN_LOG_HZ) / LOG_STEP
    : freq / F_SP;
}

function melToHz(mel) {
  return mel >= MIN_LOG_MEL
    ? MIN_LOG_HZ * Math.exp(LOG_STEP * (mel - MIN_LOG_MEL))
    : mel * F_SP;
}

/**
 * Create mel filterbank matrix matching torchaudio.functional.melscale_fbanks
 * with norm="slaney" and mel_scale="slaney".
 *
 * Layout: [nMels × N_FREQ_BINS] row-major (transposed from torchaudio's [257, nMels])
 * for cache-friendly access during per-frame matmul.
 *
 * @param {number} nMels - Number of mel bins (80 or 128)
 * @returns {Float32Array} Filterbank [nMels × N_FREQ_BINS]
 */
function createMelFilterbank(nMels) {
  const fMin = 0;
  const fMax = SAMPLE_RATE / 2; // 8000

  // Linearly spaced frequency bins: torch.linspace(0, 8000, 257)
  const allFreqs = new Float64Array(N_FREQ_BINS);
  for (let i = 0; i < N_FREQ_BINS; i++) {
    allFreqs[i] = (fMax * i) / (N_FREQ_BINS - 1);
  }

  // Mel-spaced center frequencies (nMels + 2 points)
  const melMin = hzToMel(fMin);
  const melMax = hzToMel(fMax);
  const nPoints = nMels + 2;
  const fPts = new Float64Array(nPoints);
  for (let i = 0; i < nPoints; i++) {
    fPts[i] = melToHz(melMin + ((melMax - melMin) * i) / (nPoints - 1));
  }

  // Differences between consecutive mel-Hz points
  const fDiff = new Float64Array(nPoints - 1);
  for (let i = 0; i < nPoints - 1; i++) {
    fDiff[i] = fPts[i + 1] - fPts[i];
  }

  // Build triangular filterbank with slaney normalization
  // Matching torchaudio: fb = max(0, min(down_slopes, up_slopes)) * enorm
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

function getCachedMelFilterbank(nMels) {
  let fb = MEL_FILTERBANK_CACHE.get(nMels);
  if (!fb) {
    fb = createMelFilterbank(nMels);
    MEL_FILTERBANK_CACHE.set(nMels, fb);
  }
  return fb;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Hann Window (symmetric, zero-padded to N_FFT)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Create symmetric Hann window (periodic=0) of WIN_LENGTH samples,
 * zero-padded to N_FFT. Uses Float64Array to match ONNX's DOUBLE precision.
 *
 * Matches: op.Pad(op.HannWindow(400, periodic=0, output_datatype=DOUBLE), [56, 56])
 * @returns {Float64Array} Zero-padded Hann window of length `N_FFT`.
 */
function createPaddedHannWindow() {
  const window = new Float64Array(N_FFT); // zeros
  const padLeft = (N_FFT - WIN_LENGTH) >> 1; // (512-400)/2 = 56

  for (let n = 0; n < WIN_LENGTH; n++) {
    // Symmetric Hann: 0.5 * (1 - cos(2πn / (N-1)))
    window[padLeft + n] =
      0.5 * (1 - Math.cos((2 * Math.PI * n) / (WIN_LENGTH - 1)));
  }

  return window;
}

function getCachedPaddedHannWindow() {
  if (!SHARED_HANN_WINDOW) {
    SHARED_HANN_WINDOW = createPaddedHannWindow();
  }
  return SHARED_HANN_WINDOW;
}

// ═══════════════════════════════════════════════════════════════════════════════
// FFT (Radix-2 Cooley-Tukey, in-place)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Precompute twiddle factors for N-point FFT.
 * @param {number} N - FFT size (must be power of 2)
 * @returns {{cos: Float64Array, sin: Float64Array}}
 */
function precomputeTwiddles(N) {
  const cached = FFT_TWIDDLE_CACHE.get(N);
  if (cached) return cached;

  const bits = Math.log2(N);
  if ((1 << bits) !== N) {
    throw new Error(`FFT size must be power-of-two. Received: ${N}`);
  }

  const half = N >> 1;
  const cos = new Float64Array(half);
  const sin = new Float64Array(half);
  for (let i = 0; i < half; i++) {
    const angle = (-2 * Math.PI * i) / N;
    cos[i] = Math.cos(angle);
    sin[i] = Math.sin(angle);
  }

  // Precompute bit-reversal indices once per FFT size.
  const bitrev = new Uint32Array(N);
  for (let i = 0; i < N; i++) {
    let x = i;
    let r = 0;
    for (let b = 0; b < bits; b++) {
      r = (r << 1) | (x & 1);
      x >>= 1;
    }
    bitrev[i] = r;
  }

  const tw = { cos, sin, bitrev };
  FFT_TWIDDLE_CACHE.set(N, tw);
  return tw;
}

/**
 * In-place radix-2 Cooley-Tukey FFT.
 * @param {Float64Array} re - Real part (modified in-place)
 * @param {Float64Array} im - Imaginary part (modified in-place)
 * @param {number} N - FFT size (must be power of 2)
 * @param {{cos: Float64Array, sin: Float64Array}} tw - Precomputed twiddle factors
 * @returns {void}
 */
function fft(re, im, N, tw) {
  // Bit-reversal permutation
  if (tw.bitrev && tw.bitrev.length === N) {
    const bitrev = tw.bitrev;
    for (let i = 0; i < N; i++) {
      const j = bitrev[i];
      if (i < j) {
        let tmp = re[i];
        re[i] = re[j];
        re[j] = tmp;
        tmp = im[i];
        im[i] = im[j];
        im[j] = tmp;
      }
    }
  } else {
    let j = 0;
    for (let i = 0; i < N - 1; i++) {
      if (i < j) {
        let tmp = re[i];
        re[i] = re[j];
        re[j] = tmp;
        tmp = im[i];
        im[i] = im[j];
        im[j] = tmp;
      }
      let k = N >> 1;
      while (k <= j) {
        j -= k;
        k >>= 1;
      }
      j += k;
    }
  }

  // Butterfly stages
  for (let len = 2; len <= N; len <<= 1) {
    const halfLen = len >> 1;
    const step = N / len; // twiddle index stride
    for (let i = 0; i < N; i += len) {
      for (let k = 0; k < halfLen; k++) {
        const twIdx = k * step;
        const wCos = tw.cos[twIdx];
        const wSin = tw.sin[twIdx];
        const p = i + k;
        const q = p + halfLen;
        const tRe = re[q] * wCos - im[q] * wSin;
        const tIm = re[q] * wSin + im[q] * wCos;
        re[q] = re[p] - tRe;
        im[q] = im[p] - tIm;
        re[p] += tRe;
        im[p] += tIm;
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// JsPreprocessor - Drop-in replacement for OnnxPreprocessor
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Pure JS preprocessor for NeMo-style log-mel spectrogram computation.
 * Produces identical output to nemo80.onnx / nemo128.onnx.
 *
 * Usage:
 *   const preprocessor = new JsPreprocessor({ nMels: 128 });
 *   const { features, length } = preprocessor.process(audioFloat32Array);
 */
export class JsPreprocessor {
  /**
   * @param {Object} [opts]
   * @param {number} [opts.nMels=128] Number of mel bins (80 or 128)
   */
  constructor(opts = {}) {
    this.nMels = opts.nMels || 128;

    // Share immutable precomputed constants across instances.
    this.melFilterbank = getCachedMelFilterbank(this.nMels);
    this.hannWindow = getCachedPaddedHannWindow();
    this.twiddles = precomputeTwiddles(N_FFT);

    // Pre-allocate reusable buffers
    this._fftRe = new Float64Array(N_FFT);
    this._fftIm = new Float64Array(N_FFT);
    this._powerBuf = new Float32Array(N_FREQ_BINS);

    // Precompute sparse filterbank bounds (start/end indices for each mel filter)
    this.fbBounds = new Int32Array(this.nMels * 2);
    for (let m = 0; m < this.nMels; m++) {
      const fbOff = m * N_FREQ_BINS;
      let start = -1, end = -1;
      for (let k = 0; k < N_FREQ_BINS; k++) {
        if (this.melFilterbank[fbOff + k] > 0) {
          if (start === -1) start = k;
          end = k;
        }
      }
      if (start === -1) { // Should not happen for valid mel filters
        start = 0;
        end = -1;
      }
      this.fbBounds[m * 2] = start;
      this.fbBounds[m * 2 + 1] = end + 1; // exclusive end
    }
  }

  /**
   * Convert PCM audio to normalized log-mel spectrogram features.
   * Drop-in replacement for OnnxPreprocessor.process().
   *
   * @param {Float32Array} audio - Mono PCM [-1,1] at 16kHz
   * @returns {{features: Float32Array, length: number}}
   */
  process(audio) {
    const { rawMel, nFrames, featuresLen } = this.computeRawMel(audio);

    if (featuresLen === 0) {
      return { features: new Float32Array(0), length: 0 };
    }

    const features = this.normalizeFeatures(rawMel, nFrames, featuresLen);

    return {
      features,
      length: featuresLen,
    };
  }

  /**
   * Compute raw (pre-normalization) mel features for a given audio segment.
   * Used for incremental mel computation in streaming mode.
   *
   * @param {Float32Array} audio - Mono PCM [-1,1] at 16kHz
   * @param {number} [startFrame=0] - Frame index to start computation from (0 to nFrames-1). Frames before this are left as zero.
   * @param {Float32Array} [outBuffer=null] - Optional buffer to reuse for rawMel output. If too small, a new buffer is allocated.
   * @returns {{rawMel: Float32Array, nFrames: number, featuresLen: number}}
   */
  computeRawMel(audio, startFrame = 0, outBuffer = null) {
    const N = audio.length;
    if (N === 0) {
      return { rawMel: outBuffer ? outBuffer.subarray(0, 0) : new Float32Array(0), nFrames: 0, featuresLen: 0 };
    }

    // Pre-emphasis
    // TODO: Reuse preemph buffer too? For now, rawMel/features are the biggest allocs.
    const preemph = new Float32Array(N);
    preemph[0] = audio[0];
    for (let i = 1; i < N; i++) {
      preemph[i] = audio[i] - PREEMPH * audio[i - 1];
    }

    // Pad
    const pad = N_FFT >> 1;
    const paddedLen = N + 2 * pad;
    const padded = new Float64Array(paddedLen);
    for (let i = 0; i < N; i++) {
      padded[pad + i] = preemph[i];
    }

    // Frame counts
    const nFrames = Math.floor((paddedLen - N_FFT) / HOP_LENGTH) + 1;
    const featuresLen = Math.floor(N / HOP_LENGTH);

    if (featuresLen === 0) {
      return { rawMel: new Float32Array(0), nFrames: 0, featuresLen: 0 };
    }

    // STFT + power + mel + log (no normalization)
    const reqSize = this.nMels * nFrames;
    let rawMel;
    if (outBuffer && outBuffer.length >= reqSize) {
      // Reuse provided buffer
      rawMel = outBuffer.subarray(0, reqSize);
      // Zero out prefix frame slots across all mel rows to avoid stale data.
      // Layout is [nMels × nFrames] row-major, so prefix frame t is at m*nFrames+t.
      // We only need to zero the slots that computeRawMel won't write
      // (i.e. frames 0..startFrame-1 for each mel row).
      if (startFrame > 0) {
        for (let m = 0; m < this.nMels; m++) {
          rawMel.fill(0, m * nFrames, m * nFrames + startFrame);
        }
      }
    } else {
      rawMel = new Float32Array(reqSize);
    }

    const fftRe = this._fftRe;
    const fftIm = this._fftIm;
    const powerBuf = this._powerBuf;
    const window = this.hannWindow;
    const fb = this.melFilterbank;
    const nMels = this.nMels;
    const tw = this.twiddles;
    const fbBounds = this.fbBounds;

    for (let t = startFrame; t < nFrames; t++) {
      const offset = t * HOP_LENGTH;
      for (let k = 0; k < N_FFT; k++) {
        fftRe[k] = padded[offset + k] * window[k];
        fftIm[k] = 0;
      }
      fft(fftRe, fftIm, N_FFT, tw);
      for (let k = 0; k < N_FREQ_BINS; k++) {
        powerBuf[k] = fftRe[k] * fftRe[k] + fftIm[k] * fftIm[k];
      }
      for (let m = 0; m < nMels; m++) {
        let melVal = 0;
        const fbOff = m * N_FREQ_BINS;
        const start = fbBounds[m * 2];
        const end = fbBounds[m * 2 + 1];
        for (let k = start; k < end; k++) {
          melVal += powerBuf[k] * fb[fbOff + k];
        }
        rawMel[m * nFrames + t] = Math.log(melVal + LOG_ZERO_GUARD);
      }
    }

    return { rawMel, nFrames, featuresLen };
  }

  /**
   * Apply per-feature normalization to raw mel features.
   * Separated from computation to enable incremental workflows.
   *
   * @param {Float32Array} rawMel - Pre-normalization features [nMels, nFrames]
   * @param {number} nFrames - Total number of frames in rawMel
   * @param {number} featuresLen - Number of valid frames to normalize over
   * @param {Float32Array} [outBuffer=null] - Optional buffer to reuse for features output.
   * @returns {Float32Array} Normalized features
   */
  normalizeFeatures(rawMel, nFrames, featuresLen, outBuffer = null) {
    const nMels = this.nMels;
    const reqSize = nMels * featuresLen;
    let features;

    if (outBuffer && outBuffer.length >= reqSize) {
      features = outBuffer.subarray(0, reqSize);
    } else {
      features = new Float32Array(reqSize);
    }

    for (let m = 0; m < nMels; m++) {
      const srcBase = m * nFrames;
      const dstBase = m * featuresLen;

      let sum = 0;
      for (let t = 0; t < featuresLen; t++) {
        sum += rawMel[srcBase + t];
      }
      const mean = sum / featuresLen;

      let varSum = 0;
      for (let t = 0; t < featuresLen; t++) {
        const d = rawMel[srcBase + t] - mean;
        varSum += d * d;
      }
      const invStd =
        featuresLen > 1
          ? 1.0 / (Math.sqrt(varSum / (featuresLen - 1)) + 1e-5)
          : 0;

      for (let t = 0; t < featuresLen; t++) {
        features[dstBase + t] = (rawMel[srcBase + t] - mean) * invStd;
      }
    }

    return features;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// IncrementalMelProcessor - Caches mel frames for streaming overlap reuse
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Incrementally computes mel features for streaming with overlapping windows.
 * Caches raw (pre-normalization) mel frames from the overlap prefix,
 * computes only new frames for non-overlapping audio, then normalizes the full sequence.
 *
 * Typical streaming scenario: 5s window, 3.5s overlap, 1.5s new audio.
 * Without caching: compute 500 frames (5s).
 * With caching: reuse ~350 cached frames, compute ~150 new frames. ~70% savings.
 */
export class IncrementalMelProcessor {
  /**
   * @param {Object} [opts]
   * @param {number} [opts.nMels=128] Number of mel bins
   * @param {number} [opts.boundaryFrames=3] Extra frames to recompute at boundary
   */
  constructor(opts = {}) {
    this.preprocessor = new JsPreprocessor({ nMels: opts.nMels || 128 });
    this.nMels = this.preprocessor.nMels;
    this.boundaryFrames = opts.boundaryFrames || 3;

    // Cache state
    this._cachedRawMel = null; // Float32Array [nMels, cachedFrames] - VIEW into one of the _rawBuffers
    this._cachedNFrames = 0;
    this._cachedAudioLen = 0; // length of audio that produced the cache
    this._cachedFeaturesLen = 0;

    // Double buffering for raw mel to allow safe reuse while copying from cache
    // _rawBuffers[0] and [1] will grow as needed.
    this._rawBuffers = [null, null];
    this._bufIdx = 0;

    // Single buffer for features (no dependency on previous features)
    this._featuresBuffer = null;
  }

  /**
   * Reset the incremental cache. Call when starting a new utterance or recording session.
   * @returns {void}
   */
  reset() {
    this._cachedRawMel = null;
    this._cachedNFrames = 0;
    this._cachedAudioLen = 0;
    this._cachedFeaturesLen = 0;
    // We retain the allocated buffers to avoid re-allocation next time
    this._bufIdx = 0;
  }

  /**
   * Process audio with incremental mel computation.
   * If the prefix of the audio matches the cached audio, reuse cached frames.
   *
   * @param {Float32Array} audio - Full audio window (mono PCM [-1,1] at 16kHz)
   * @param {number} [prefixSamples=0] - Number of leading samples identical to previous call
   * @returns {{features: Float32Array, length: number, cached: boolean, cachedFrames: number, newFrames: number}}
   */
  process(audio, prefixSamples = 0) {
    const N = audio.length;
    if (N === 0) {
      return {
        features: new Float32Array(0),
        length: 0,
        cached: false,
        cachedFrames: 0,
        newFrames: 0,
      };
    }

    // Check if we can reuse cached prefix
    const canReuse =
      prefixSamples > 0 &&
      this._cachedRawMel !== null &&
      prefixSamples <= this._cachedAudioLen;

    // Calculate required size for raw mel buffer
    // nFrames = floor((N + 512 - 512) / 160) + 1 = floor(N / 160) + 1
    const predictedNFrames = Math.floor(N / HOP_LENGTH) + 1;
    const reqRawSize = this.nMels * predictedNFrames;

    // Manage Raw Buffer (Double Buffering)
    // We use double buffering because if we reuse the same buffer in-place,
    // and nFrames changes (stride changes), we might overwrite data we need to copy from (the "cache").
    // With two buffers, we always read from 'other' and write to 'current'.
    let currentRawBuf = this._rawBuffers[this._bufIdx];
    if (!currentRawBuf || currentRawBuf.length < reqRawSize) {
      // Allocate with 20% growth factor to avoid frequent reallocs
      const newSize = Math.ceil(reqRawSize * 1.2);
      currentRawBuf = new Float32Array(newSize);
      this._rawBuffers[this._bufIdx] = currentRawBuf;
    }

    // Manage Features Buffer (Single Buffer)
    // featuresLen = floor(N / 160)
    const predictedFeaturesLen = Math.floor(N / HOP_LENGTH);
    const reqFeatSize = this.nMels * predictedFeaturesLen;

    if (!this._featuresBuffer || this._featuresBuffer.length < reqFeatSize) {
      const newSize = Math.ceil(reqFeatSize * 1.2);
      this._featuresBuffer = new Float32Array(newSize);
    }

    if (!canReuse) {
      // Full computation
      // Pass currentRawBuf to reuse it.
      const { rawMel, nFrames, featuresLen } =
        this.preprocessor.computeRawMel(audio, 0, currentRawBuf);

      // Pass featuresBuffer to reuse it.
      const features = this.preprocessor.normalizeFeatures(
        rawMel,
        nFrames,
        featuresLen,
        this._featuresBuffer
      );

      // Cache raw mel for next call (view into currentRawBuf)
      this._cachedRawMel = rawMel;
      this._cachedNFrames = nFrames;
      this._cachedAudioLen = N;
      this._cachedFeaturesLen = featuresLen;

      // Flip buffer for next time
      this._bufIdx ^= 1;

      return {
        features: new Float32Array(features),
        length: featuresLen,
        cached: false,
        cachedFrames: 0,
        newFrames: featuresLen,
      };
    }

    // ── Incremental path ──────────────────────────────────────────────
    const prefixFrames = Math.floor(prefixSamples / HOP_LENGTH);
    const safeFrames = Math.max(
      0,
      Math.min(prefixFrames - this.boundaryFrames, this._cachedFeaturesLen)
    );

    // Compute mel, writing into currentRawBuf
    const { rawMel, nFrames, featuresLen } =
      this.preprocessor.computeRawMel(audio, safeFrames, currentRawBuf);

    // Copy cached prefix from previous buffer (this._cachedRawMel) to current buffer (rawMel)
    // _cachedRawMel is a view into the *other* buffer (since we flipped _bufIdx last time).
    // So this copy is safe (no overlap/overwrite issues).
    if (safeFrames > 0 && this._cachedRawMel) {
      // Optimization: if both buffers are large and nFrames (stride) hasn't changed,
      // and we happened to not flip buffers (not possible here due to logic), we could skip copy.
      // But with double buffering, we MUST copy because we switched buffers.
      // The copy is still fast (sequential memory).

      for (let m = 0; m < this.nMels; m++) {
        const srcBase = m * this._cachedNFrames;
        const dstBase = m * nFrames;
        rawMel.set(this._cachedRawMel.subarray(srcBase, srcBase + safeFrames), dstBase);
      }
    }

    // Normalize
    const features = this.preprocessor.normalizeFeatures(
      rawMel,
      nFrames,
      featuresLen,
      this._featuresBuffer
    );

    // Update cache
    this._cachedRawMel = rawMel;
    this._cachedNFrames = nFrames;
    this._cachedAudioLen = N;
    this._cachedFeaturesLen = featuresLen;

    // Flip buffer
    this._bufIdx ^= 1;

    return {
      features: new Float32Array(features),
      length: featuresLen,
      cached: true,
      cachedFrames: safeFrames,
      newFrames: featuresLen - safeFrames,
    };
  }

  /**
   * Clear the cache (e.g., on recording restart).
   * @returns {void}
   */
  clear() {
    this.reset();
  }
}

/**
 * Internal mel/STFT constants exported for tests and diagnostics.
 * @type {{SAMPLE_RATE: number, N_FFT: number, WIN_LENGTH: number, HOP_LENGTH: number, PREEMPH: number, LOG_ZERO_GUARD: number, N_FREQ_BINS: number}}
 */
export const MEL_CONSTANTS = {
  SAMPLE_RATE,
  N_FFT,
  WIN_LENGTH,
  HOP_LENGTH,
  PREEMPH,
  LOG_ZERO_GUARD,
  N_FREQ_BINS,
};

// Export internal functions for testing
export { hzToMel, melToHz, createMelFilterbank, createPaddedHannWindow, precomputeTwiddles, fft };
