/**
 * BoncukJS - Continuous Mel Producer Worker
 * 
 * Runs in a separate Web Worker thread, continuously computing raw log-mel
 * spectrogram frames as audio arrives. When the inference pipeline needs
 * features for a time window, it requests normalized features from this worker.
 * 
 * Architecture:
 *   AudioEngine → pushAudio(chunk) → mel.worker computes raw mel frames incrementally
 *   Inference trigger → getFeatures(startFrame, endFrame) → mel.worker normalizes & returns
 * 
 * This decouples mel computation from the inference thread entirely.
 * Features are always ready when the encoder needs them → zero wait for preprocessing.
 * 
 * Imports from mel-math.ts (local module, no external deps).
 */

import {
    MEL_CONSTANTS,
    createMelFilterbank,
    createPaddedHannWindow,
    precomputeTwiddles,
    fft,
    normalizeMelFeatures,
    sampleToFrame,
} from './mel-math';

const { N_FFT, HOP_LENGTH, N_FREQ_BINS, PREEMPH, LOG_ZERO_GUARD } = MEL_CONSTANTS;

// ═══════════════════════════════════════════════════════════════════════════
// Worker State
// ═══════════════════════════════════════════════════════════════════════════

let nMels = 128;

// Pre-emphasized audio buffer (grows as audio arrives)
let preemphBuffer = new Float32Array(0);
let preemphLen = 0;
let lastRawSample = 0;
let totalSamples = 0;

// Raw mel frame buffer: [nMels * maxFrames], mel-major layout
let rawMelBuffer: Float32Array | null = null;
let maxFrames = 0;
let computedFrames = 0;

// Pre-allocated FFT buffers (reused per frame)
let fftRe: Float64Array;
let fftIm: Float64Array;
let powerBuf: Float32Array;

// Pre-computed constants
let melFilterbank: Float32Array;
let hannWindow: Float64Array;
let twiddles: { cos: Float64Array; sin: Float64Array };

// ═══════════════════════════════════════════════════════════════════════════
// Initialization
// ═══════════════════════════════════════════════════════════════════════════

function init(config: { nMels?: number }) {
    const t0 = performance.now();
    nMels = config.nMels || 128;

    // Build mel computation constants
    melFilterbank = createMelFilterbank(nMels);
    hannWindow = createPaddedHannWindow();
    twiddles = precomputeTwiddles(N_FFT);

    // Allocate FFT buffers
    fftRe = new Float64Array(N_FFT);
    fftIm = new Float64Array(N_FFT);
    powerBuf = new Float32Array(N_FREQ_BINS);

    // Pre-allocate raw mel buffer for ~120 seconds (12000 frames at 100 fps)
    maxFrames = 12000;
    rawMelBuffer = new Float32Array(nMels * maxFrames);
    computedFrames = 0;

    // Reset audio state
    preemphBuffer = new Float32Array(16000 * 120); // Pre-allocate for 120s
    preemphLen = 0;
    lastRawSample = 0;
    totalSamples = 0;

    console.log(`[MelWorker] Initialized: nMels=${nMels}, maxFrames=${maxFrames}, prealloc=${(preemphBuffer.length / 16000).toFixed(0)}s audio, ${(nMels * maxFrames * 4 / 1024 / 1024).toFixed(1)}MB mel buffer, init ${(performance.now() - t0).toFixed(1)} ms`);
}

// ═══════════════════════════════════════════════════════════════════════════
// Incremental Mel Computation
// ═══════════════════════════════════════════════════════════════════════════

function pushAudio(chunk: Float32Array) {
    if (!rawMelBuffer) return;

    const chunkLen = chunk.length;
    if (chunkLen === 0) return;

    const t0 = performance.now();

    // 1. Pre-emphasize the new chunk incrementally
    // Grow preemph buffer if needed
    if (preemphLen + chunkLen > preemphBuffer.length) {
        const newSize = Math.max(preemphBuffer.length * 2, preemphLen + chunkLen);
        const newBuf = new Float32Array(newSize);
        newBuf.set(preemphBuffer.subarray(0, preemphLen));
        preemphBuffer = newBuf;
    }

    // Pre-emphasize
    preemphBuffer[preemphLen] = chunk[0] - PREEMPH * lastRawSample;
    for (let i = 1; i < chunkLen; i++) {
        preemphBuffer[preemphLen + i] = chunk[i] - PREEMPH * chunk[i - 1];
    }
    preemphLen += chunkLen;
    lastRawSample = chunk[chunkLen - 1];
    totalSamples += chunkLen;

    // 2. Compute new valid frames
    const newTotalFrames = Math.floor(totalSamples / HOP_LENGTH);
    if (newTotalFrames <= computedFrames) return;

    // Grow raw mel buffer if needed
    if (newTotalFrames > maxFrames) {
        const newMaxFrames = Math.max(maxFrames * 2, newTotalFrames + 1000);
        const newMelBuf = new Float32Array(nMels * newMaxFrames);
        // Copy existing data (mel-major layout)
        for (let m = 0; m < nMels; m++) {
            const srcOff = m * maxFrames;
            const dstOff = m * newMaxFrames;
            newMelBuf.set(rawMelBuffer!.subarray(srcOff, srcOff + computedFrames), dstOff);
        }
        rawMelBuffer = newMelBuf;
        maxFrames = newMaxFrames;
    }

    // 3. Compute each new frame
    const pad = N_FFT >> 1; // 256

    for (let t = computedFrames; t < newTotalFrames; t++) {
        const frameStart = t * HOP_LENGTH - pad;

        // a) Window the frame
        for (let k = 0; k < N_FFT; k++) {
            const idx = frameStart + k;
            const sample = (idx >= 0 && idx < preemphLen) ? preemphBuffer[idx] : 0;
            fftRe[k] = sample * hannWindow[k];
            fftIm[k] = 0;
        }

        // b) 512-point FFT
        fft(fftRe, fftIm, N_FFT, twiddles);

        // c) Power spectrum
        for (let k = 0; k < N_FREQ_BINS; k++) {
            powerBuf[k] = fftRe[k] * fftRe[k] + fftIm[k] * fftIm[k];
        }

        // d) Mel filterbank multiply + log
        for (let m = 0; m < nMels; m++) {
            let melVal = 0;
            const fbOff = m * N_FREQ_BINS;
            for (let k = 0; k < N_FREQ_BINS; k++) {
                melVal += powerBuf[k] * melFilterbank[fbOff + k];
            }
            rawMelBuffer![m * maxFrames + t] = Math.log(melVal + LOG_ZERO_GUARD);
        }
    }

    const prevFrames = computedFrames;
    computedFrames = newTotalFrames;
    const newFramesComputed = newTotalFrames - prevFrames;
    if (newFramesComputed > 0) {
        const elapsed = performance.now() - t0;
        // Log every ~50 chunks (~4s) to avoid spam
        if (computedFrames % 50 < newFramesComputed) {
            console.log(`[MelWorker] pushAudio: +${chunkLen} samples, +${newFramesComputed} frames → total ${computedFrames} frames (${(totalSamples / 16000).toFixed(1)}s), ${elapsed.toFixed(1)} ms`);
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// Feature Extraction (normalize a requested range)
// ═══════════════════════════════════════════════════════════════════════════

function getFeatures(startFrame: number, endFrame: number): {
    features: Float32Array;
    T: number;
    melBins: number;
} | null {
    const t0 = performance.now();

    if (!rawMelBuffer || computedFrames === 0) {
        console.warn(`[MelWorker] getFeatures: no data (computedFrames=${computedFrames})`);
        return null;
    }

    // Clamp to available range
    const sf = Math.max(0, startFrame);
    const ef = Math.min(computedFrames, endFrame);
    const T = ef - sf;

    if (T <= 0) {
        console.warn(`[MelWorker] getFeatures: empty range (requested ${startFrame}..${endFrame}, available 0..${computedFrames})`);
        return null;
    }

    // Extract the requested window (mel-major layout [nMels, T])
    const raw = new Float32Array(nMels * T);
    for (let m = 0; m < nMels; m++) {
        const srcBase = m * maxFrames + sf;
        const dstBase = m * T;
        for (let t = 0; t < T; t++) {
            raw[dstBase + t] = rawMelBuffer![srcBase + t];
        }
    }

    // Normalize
    const features = normalizeMelFeatures(raw, nMels, T);

    const elapsed = performance.now() - t0;
    console.log(`[MelWorker] getFeatures: frames ${sf}..${ef} (${T} frames, ${(T * HOP_LENGTH / 16000).toFixed(2)}s), normalize ${elapsed.toFixed(1)} ms, buffer ${computedFrames} total frames`);

    return { features, T, melBins: nMels };
}

// ═══════════════════════════════════════════════════════════════════════════
// Reset
// ═══════════════════════════════════════════════════════════════════════════

function reset() {
    preemphLen = 0;
    lastRawSample = 0;
    totalSamples = 0;
    computedFrames = 0;
    console.log('[MelWorker] Reset');
}

// ═══════════════════════════════════════════════════════════════════════════
// Message Handler
// ═══════════════════════════════════════════════════════════════════════════

self.onmessage = (e: MessageEvent) => {
    const { type, payload, id } = e.data;

    try {
        switch (type) {
            case 'INIT': {
                init(payload || {});
                postMessage({ type: 'INIT_DONE', id });
                break;
            }

            case 'PUSH_AUDIO': {
                pushAudio(payload);
                // No response needed — fire and forget for continuous production
                break;
            }

            case 'GET_FEATURES': {
                const { startSample, endSample } = payload;
                const startFrame = sampleToFrame(startSample);
                const endFrame = sampleToFrame(endSample);
                const result = getFeatures(startFrame, endFrame);

                if (result) {
                    // Transfer the features buffer for zero-copy
                    postMessage(
                        { type: 'GET_FEATURES_DONE', payload: result, id },
                        [result.features.buffer] as any
                    );
                } else {
                    postMessage({
                        type: 'GET_FEATURES_DONE',
                        payload: null,
                        id
                    });
                }
                break;
            }

            case 'GET_STATUS': {
                postMessage({
                    type: 'GET_STATUS_DONE',
                    payload: {
                        totalSamples,
                        computedFrames,
                        bufferCapacityFrames: maxFrames,
                        melBins: nMels,
                    },
                    id,
                });
                break;
            }

            case 'RESET': {
                reset();
                postMessage({ type: 'RESET_DONE', id });
                break;
            }

            default:
                console.warn('[MelWorker] Unknown message type:', type);
        }
    } catch (err: any) {
        console.error('[MelWorker] Error:', err);
        postMessage({ type: 'ERROR', payload: err.message, id });
    }
};

console.log('[MelWorker] Worker script loaded');
