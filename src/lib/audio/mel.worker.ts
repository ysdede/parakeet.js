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

// Pre-emphasized audio buffer (compacted after each pushAudio to stay bounded).
// Only retains samples needed for the next mel frame's FFT window.
let preemphBuffer = new Float32Array(0);
let preemphBaseIdx = 0;  // Global sample index corresponding to preemphBuffer[0]
let preemphLen = 0;      // Number of valid samples currently in preemphBuffer
let lastRawSample = 0;
let totalSamples = 0;

// Raw mel frame buffer: fixed-size circular, mel-major layout [nMels * maxFrames].
// For mel bin m at frame t: rawMelBuffer[m * maxFrames + (t % maxFrames)].
let rawMelBuffer: Float32Array | null = null;
let maxFrames = 0;
let computedFrames = 0;  // Monotonic: total frames computed (next frame index)
let baseFrame = 0;       // Oldest frame still available in the circular buffer

// Pre-allocated FFT buffers (reused per frame)
let fftRe: Float64Array;
let fftIm: Float64Array;
let powerBuf: Float32Array;

// Pre-computed constants
let melFilterbank: Float32Array;
let hannWindow: Float64Array;
let twiddles: { cos: Float64Array; sin: Float64Array };

// Logging throttle for getFeatures (avoid console spam)
let lastGetFeaturesLogTime = 0;
const GET_FEATURES_LOG_INTERVAL = 5000; // Log every 5 seconds max

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

    // Fixed-size circular mel buffer for ~120 seconds (12000 frames at 100 fps).
    // Old frames are silently overwritten; no reallocation ever occurs.
    maxFrames = 12000;
    rawMelBuffer = new Float32Array(nMels * maxFrames);
    computedFrames = 0;
    baseFrame = 0;

    // Pre-emphasized audio buffer: only needs to hold the FFT overlap window
    // plus one incoming chunk. Compacted after each pushAudio call so it
    // stays bounded to roughly N_FFT + chunk_size samples.
    preemphBuffer = new Float32Array(N_FFT + 16000); // N_FFT overlap + up to 1s chunk
    preemphBaseIdx = 0;
    preemphLen = 0;
    lastRawSample = 0;
    totalSamples = 0;

    const melBufMB = (nMels * maxFrames * 4 / 1024 / 1024).toFixed(1);
    console.log(`[MelWorker] Initialized: nMels=${nMels}, maxFrames=${maxFrames} (circular), ${melBufMB}MB mel buffer, preemph=${preemphBuffer.length} samples, init ${(performance.now() - t0).toFixed(1)} ms`);
}

// ═══════════════════════════════════════════════════════════════════════════
// Incremental Mel Computation
// ═══════════════════════════════════════════════════════════════════════════

function pushAudio(chunk: Float32Array) {
    if (!rawMelBuffer) return;

    const chunkLen = chunk.length;
    if (chunkLen === 0) return;

    const t0 = performance.now();

    // 1. Pre-emphasize the new chunk incrementally.
    //    Grow preemph buffer if needed (safety net; compaction below keeps it small).
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
    if (newTotalFrames <= computedFrames) {
        compactPreemphBuffer();
        return;
    }

    // 3. Compute each new frame, writing into the circular mel buffer.
    //    No reallocation: old frames are silently overwritten via modulo.
    const pad = N_FFT >> 1; // 256

    for (let t = computedFrames; t < newTotalFrames; t++) {
        const frameStart = t * HOP_LENGTH - pad;
        const circularT = t % maxFrames;

        // a) Window the frame (using local index into compacted preemph buffer)
        for (let k = 0; k < N_FFT; k++) {
            const globalIdx = frameStart + k;
            const localIdx = globalIdx - preemphBaseIdx;
            const sample = (localIdx >= 0 && localIdx < preemphLen) ? preemphBuffer[localIdx] : 0;
            fftRe[k] = sample * hannWindow[k];
            fftIm[k] = 0;
        }

        // b) 512-point FFT
        fft(fftRe, fftIm, N_FFT, twiddles);

        // c) Power spectrum
        for (let k = 0; k < N_FREQ_BINS; k++) {
            powerBuf[k] = fftRe[k] * fftRe[k] + fftIm[k] * fftIm[k];
        }

        // d) Mel filterbank multiply + log (circular write)
        for (let m = 0; m < nMels; m++) {
            let melVal = 0;
            const fbOff = m * N_FREQ_BINS;
            for (let k = 0; k < N_FREQ_BINS; k++) {
                melVal += powerBuf[k] * melFilterbank[fbOff + k];
            }
            rawMelBuffer![m * maxFrames + circularT] = Math.log(melVal + LOG_ZERO_GUARD);
        }
    }

    const prevFrames = computedFrames;
    computedFrames = newTotalFrames;

    // Advance baseFrame when the circular buffer has wrapped
    if (computedFrames - baseFrame > maxFrames) {
        baseFrame = computedFrames - maxFrames;
    }

    // 4. Compact preemph buffer: discard samples no longer needed
    compactPreemphBuffer();

    const newFramesComputed = newTotalFrames - prevFrames;
    if (newFramesComputed > 0) {
        const elapsed = performance.now() - t0;
        // Log every ~50 chunks (~4s) to avoid spam
        if (computedFrames % 50 < newFramesComputed) {
            console.log(`[MelWorker] pushAudio: +${chunkLen} samples, +${newFramesComputed} frames, total ${computedFrames} frames (${(totalSamples / 16000).toFixed(1)}s), buf [${baseFrame}..${computedFrames}), preemph ${preemphLen} samples, ${elapsed.toFixed(1)} ms`);
        }
    }
}

/**
 * Compact the preemph buffer by discarding samples that are no longer needed.
 * The next mel frame to be computed (computedFrames) requires samples starting
 * at global index (computedFrames * HOP_LENGTH - N_FFT/2). Everything before
 * that can be safely discarded.
 */
function compactPreemphBuffer() {
    const pad = N_FFT >> 1;
    const nextFrameStart = computedFrames * HOP_LENGTH - pad;
    const discardBefore = Math.max(0, nextFrameStart);
    const discardLocal = discardBefore - preemphBaseIdx;

    if (discardLocal > 0 && discardLocal < preemphLen) {
        // Shift remaining samples to front of buffer
        const remaining = preemphLen - discardLocal;
        preemphBuffer.copyWithin(0, discardLocal, discardLocal + remaining);
        preemphLen = remaining;
        preemphBaseIdx = discardBefore;
    } else if (discardLocal >= preemphLen) {
        // All current samples are stale
        preemphLen = 0;
        preemphBaseIdx = discardBefore;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// Feature Extraction (normalize a requested range)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Extract mel features for a frame range.
 * 
 * @param startFrame - Start frame index
 * @param endFrame - End frame index (exclusive)
 * @param normalize - If true (default), apply per-feature mean/variance normalization
 *   (required for ASR). If false, return raw log-mel values (for visualization with
 *   fixed dB scaling to avoid "gain hunting" during silence).
 * 
 * PERFORMANCE NOTE (2026-02-09): When normalize=false, the caller (e.g. visualizer)
 * still incurs the cost of extracting frames from the circular buffer. If visualization
 * performance becomes an issue, consider:
 * 1. Reducing visualizer update frequency
 * 2. Caching/reusing extracted frames between draws
 * 3. Downsampling the spectrogram (skip frames for display)
 */
function getFeatures(startFrame: number, endFrame: number, normalize: boolean = true): {
    features: Float32Array;
    T: number;
    melBins: number;
} | null {
    const t0 = performance.now();

    if (!rawMelBuffer || computedFrames === 0) {
        console.warn(`[MelWorker] getFeatures: no data (computedFrames=${computedFrames})`);
        return null;
    }

    // Clamp to available circular range [baseFrame, computedFrames)
    const sf = Math.max(baseFrame, startFrame);
    const ef = Math.min(computedFrames, endFrame);
    const T = ef - sf;

    if (T <= 0) {
        console.warn(`[MelWorker] getFeatures: empty range (requested ${startFrame}..${endFrame}, available ${baseFrame}..${computedFrames})`);
        return null;
    }

    // Extract the requested window from circular buffer (mel-major layout [nMels, T])
    const raw = new Float32Array(nMels * T);
    for (let m = 0; m < nMels; m++) {
        const srcRowBase = m * maxFrames;
        const dstBase = m * T;
        for (let i = 0; i < T; i++) {
            const circularIdx = (sf + i) % maxFrames;
            raw[dstBase + i] = rawMelBuffer![srcRowBase + circularIdx];
        }
    }

    // Optionally normalize (ASR requires normalized; visualizer uses raw for fixed dB scale)
    const features = normalize ? normalizeMelFeatures(raw, nMels, T) : raw;

    // Throttled logging to avoid console spam (was causing noticeable CPU overhead)
    const now = performance.now();
    if (now - lastGetFeaturesLogTime > GET_FEATURES_LOG_INTERVAL) {
        lastGetFeaturesLogTime = now;
        const elapsed = now - t0;
        console.log(`[MelWorker] getFeatures: frames ${sf}..${ef} (${T} frames, ${(T * HOP_LENGTH / 16000).toFixed(2)}s), normalize=${normalize}, ${elapsed.toFixed(1)} ms, buf [${baseFrame}..${computedFrames})`);
    }

    return { features, T, melBins: nMels };
}

// ═══════════════════════════════════════════════════════════════════════════
// Reset
// ═══════════════════════════════════════════════════════════════════════════

function reset() {
    preemphLen = 0;
    preemphBaseIdx = 0;
    lastRawSample = 0;
    totalSamples = 0;
    computedFrames = 0;
    baseFrame = 0;
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
                const { startSample, endSample, normalize = true } = payload;
                const startFrame = sampleToFrame(startSample);
                const endFrame = sampleToFrame(endSample);
                const result = getFeatures(startFrame, endFrame, normalize);

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
