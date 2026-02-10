import { Component, onMount, onCleanup, createSignal } from 'solid-js';
import type { AudioEngine } from '../lib/audio/types';
import type { MelWorkerClient } from '../lib/audio/MelWorkerClient';
import { appStore } from '../stores/appStore';

interface LayeredBufferVisualizerProps {
    audioEngine?: AudioEngine;
    melClient?: MelWorkerClient;
    height?: number; // Total height
    windowDuration?: number; // default 8.0s
}

const MEL_BINS = 128; // Standard for this app

// ═══════════════════════════════════════════════════════════════════════════
// Fixed dB scaling for spectrogram visualization (2026-02-09)
// ═══════════════════════════════════════════════════════════════════════════
// Raw log-mel features (unnormalized) have typical range:
//   - Silence: ~-11 to -8 (log of the zero guard + quiet noise)
//   - Speech:  ~-4 to 0 (energetic speech peaks near 0)
//
// Using fixed scaling avoids "gain hunting" where per-window normalization
// causes silence to stretch to full brightness (GitHub issue #89).
//
// To tune: set MAX_DB higher if clipping occurs on loud speech;
// set MIN_DB lower if you want more contrast in quiet passages.
const MIN_DB = -11.0; // Black: noise floor / silence
const MAX_DB = 0.0;   // Red: loudest speech peaks
const DB_RANGE = MAX_DB - MIN_DB; // 11.0

// Pre-computed 256-entry RGB lookup table for mel heatmap (black to red).
// Built once at module load; indexed by Math.round(intensity * 255).
// Colormap: black -> blue -> purple -> green -> yellow -> orange -> red.
const COLORMAP_LUT = (() => {
    const stops: [number, number, number, number][] = [
        [0, 0, 0, 0],       // black
        [0.12, 0, 0, 180],  // blue
        [0.30, 120, 0, 160], // purple
        [0.48, 0, 180, 80],  // green
        [0.65, 220, 220, 0], // yellow
        [0.82, 255, 140, 0], // orange
        [1, 255, 0, 0],      // red
    ];
    // 256 entries * 3 channels (R, G, B) packed into a Uint8Array
    const lut = new Uint8Array(256 * 3);
    for (let i = 0; i < 256; i++) {
        const intensity = i / 255;
        let r = 0, g = 0, b = 0;
        for (let s = 0; s < stops.length - 1; s++) {
            const [t0, r0, g0, b0] = stops[s];
            const [t1, r1, g1, b1] = stops[s + 1];
            if (intensity >= t0 && intensity <= t1) {
                const t = (intensity - t0) / (t1 - t0);
                r = Math.round(r0 + t * (r1 - r0));
                g = Math.round(g0 + t * (g1 - g0));
                b = Math.round(b0 + t * (b1 - b0));
                break;
            }
        }
        if (intensity >= stops[stops.length - 1][0]) {
            const last = stops[stops.length - 1];
            r = last[1]; g = last[2]; b = last[3];
        }
        const base = i * 3;
        lut[base] = r;
        lut[base + 1] = g;
        lut[base + 2] = b;
    }
    return lut;
})();

export const LayeredBufferVisualizer: Component<LayeredBufferVisualizerProps> = (props) => {
    let canvasRef: HTMLCanvasElement | undefined;
    let ctx: CanvasRenderingContext2D | null = null;
    let animationFrameId: number;

    const getWindowDuration = () => props.windowDuration || 8.0;

    // Offscreen canvas for spectrogram caching (scrolling)
    let specCanvas: HTMLCanvasElement | undefined;
    let specCtx: CanvasRenderingContext2D | null = null;

    // State for last fetch to throttle spectrogram updates
    let lastSpecFetchTime = 0;
    const SPEC_FETCH_INTERVAL = 100; // Update spectrogram every 100ms (10fps)
    const DRAW_INTERVAL_MS = 33; // Throttle full redraw to ~30fps
    let lastDrawTime = 0;

    // --- Cached layout dimensions (updated via ResizeObserver, NOT per-frame) ---
    // Avoids getBoundingClientRect() every animation frame which forces synchronous
    // layout reflow and was the #1 perf bottleneck (1.5s layout-shift clusters).
    let cachedPhysicalWidth = 0;
    let cachedPhysicalHeight = 0;
    let cachedDpr = window.devicePixelRatio || 1;
    let resizeObserver: ResizeObserver | null = null;
    let dprMediaQuery: MediaQueryList | null = null;

    /** Recompute physical canvas dimensions from cached logical size + DPR. */
    const updateCanvasDimensions = (logicalW: number, logicalH: number) => {
        cachedDpr = window.devicePixelRatio || 1;
        cachedPhysicalWidth = Math.floor(logicalW * cachedDpr);
        cachedPhysicalHeight = Math.floor(logicalH * cachedDpr);

        // Resize canvases immediately so next frame uses correct size
        if (canvasRef && (canvasRef.width !== cachedPhysicalWidth || canvasRef.height !== cachedPhysicalHeight)) {
            canvasRef.width = cachedPhysicalWidth;
            canvasRef.height = cachedPhysicalHeight;
        }
        if (specCanvas && (specCanvas.width !== cachedPhysicalWidth || specCanvas.height !== cachedPhysicalHeight)) {
            specCanvas.width = cachedPhysicalWidth;
            specCanvas.height = cachedPhysicalHeight;
        }
    };

    // --- Pre-allocated ImageData for spectrogram rendering ---
    // Avoids creating a new ImageData object every spectrogram draw (~10fps),
    // which caused GC pressure from large short-lived allocations.
    let cachedSpecImgData: ImageData | null = null;
    let cachedSpecImgWidth = 0;
    let cachedSpecImgHeight = 0;

    // --- Pre-allocated waveform read buffer ---
    // Avoids allocating a new Float32Array(~128000) every animation frame.
    // Grows only when the required size exceeds current capacity.
    let waveformReadBuf: Float32Array | null = null;

    // Store spectrogram data with its time alignment
    let cachedSpecData: {
        features: Float32Array;
        melBins: number;
        timeSteps: number;
        startTime: number;
        endTime: number;
    } | null = null;

    onMount(() => {
        if (canvasRef) {
            ctx = canvasRef.getContext('2d', { alpha: false });

            // Use ResizeObserver to cache dimensions instead of per-frame getBoundingClientRect
            resizeObserver = new ResizeObserver((entries) => {
                for (const entry of entries) {
                    // contentRect gives CSS-pixel (logical) dimensions without forcing layout
                    const cr = entry.contentRect;
                    updateCanvasDimensions(cr.width, cr.height);
                }
            });
            resizeObserver.observe(canvasRef);

            // Watch for DPR changes (browser zoom, display change)
            const setupDprWatch = () => {
                dprMediaQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
                const onDprChange = () => {
                    if (canvasRef) {
                        const rect = canvasRef.getBoundingClientRect(); // one-time on zoom change only
                        updateCanvasDimensions(rect.width, rect.height);
                    }
                    // Re-register for the next change at the new DPR
                    setupDprWatch();
                };
                dprMediaQuery.addEventListener('change', onDprChange, { once: true });
            };
            setupDprWatch();

            // Initial dimensions (one-time)
            const rect = canvasRef.getBoundingClientRect();
            updateCanvasDimensions(rect.width, rect.height);
        }

        // Create offscreen canvas
        specCanvas = document.createElement('canvas');
        specCtx = specCanvas.getContext('2d', { alpha: false });

        loop();
    });

    onCleanup(() => {
        cancelAnimationFrame(animationFrameId);
        if (resizeObserver) {
            resizeObserver.disconnect();
            resizeObserver = null;
        }
    });

    const loop = (now: number = performance.now()) => {
        if (!ctx || !canvasRef || !props.audioEngine) {
            animationFrameId = requestAnimationFrame(loop);
            return;
        }

        if (now - lastDrawTime < DRAW_INTERVAL_MS) {
            animationFrameId = requestAnimationFrame(loop);
            return;
        }
        lastDrawTime = now;

        // Use cached dimensions (updated by ResizeObserver / DPR watcher)
        const dpr = cachedDpr;
        const width = cachedPhysicalWidth;
        const height = cachedPhysicalHeight;

        if (width === 0 || height === 0) {
            animationFrameId = requestAnimationFrame(loop);
            return;
        }

        // Colors
        const bgColor = '#0f172a';
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, width, height);

        const ringBuffer = props.audioEngine.getRingBuffer();
        const currentTime = ringBuffer.getCurrentTime();
        const duration = getWindowDuration();
        const startTime = currentTime - duration;
        const sampleRate = ringBuffer.sampleRate;

        // Layout: 
        // Top 55%: Spectrogram
        // Middle 35%: Waveform
        // Bottom 10%: VAD signal
        const specHeight = Math.floor(height * 0.55);
        const waveHeight = Math.floor(height * 0.35);
        const vadHeight = height - specHeight - waveHeight;
        const waveY = specHeight;
        const vadY = specHeight + waveHeight;

        // 1. Spectrogram (async fetch with stored alignment)
        if (props.melClient && specCtx && specCanvas) {
            if (now - lastSpecFetchTime > SPEC_FETCH_INTERVAL) {
                lastSpecFetchTime = now;

                const fetchStartSample = Math.round(startTime * sampleRate);
                const fetchEndSample = Math.round(currentTime * sampleRate);

                // Request RAW (unnormalized) features for fixed dB scaling.
                // ASR transcription still uses normalized features (default).
                props.melClient.getFeatures(fetchStartSample, fetchEndSample, false).then(features => {
                    if (features && specCtx && specCanvas) {
                        // Store with time alignment info
                        cachedSpecData = {
                            features: features.features,
                            melBins: features.melBins,
                            timeSteps: features.T,
                            startTime: startTime,
                            endTime: currentTime
                        };
                        drawSpectrogramToCanvas(specCtx, features.features, features.melBins, features.T, width, specHeight);
                    }
                }).catch(() => { });
            }

            // Draw cached spectrogram aligned to current view
            if (cachedSpecData && cachedSpecData.timeSteps > 0) {
                // Calculate offset to align cached data with current time window
                const cachedDuration = cachedSpecData.endTime - cachedSpecData.startTime;
                const timeOffset = startTime - cachedSpecData.startTime;
                const offsetX = Math.floor((timeOffset / cachedDuration) * width);

                // Draw the portion of cached spectrogram that's still visible
                ctx.drawImage(specCanvas, offsetX, 0, width - offsetX, specHeight, 0, 0, width - offsetX, specHeight);
            }
        }

        // 2. Waveform (sync with current time window, zero-allocation read)
        try {
            const startSample = Math.floor(startTime * sampleRate);
            const endSample = Math.floor(currentTime * sampleRate);
            const neededLen = endSample - startSample;

            const baseFrame = ringBuffer.getBaseFrameOffset();
            if (startSample >= baseFrame && neededLen > 0) {
                // Use readInto if available (zero-alloc), fall back to read()
                if (ringBuffer.readInto) {
                    // Grow the pre-allocated buffer only when capacity is insufficient
                    if (!waveformReadBuf || waveformReadBuf.length < neededLen) {
                        waveformReadBuf = new Float32Array(neededLen);
                    }
                    const written = ringBuffer.readInto(startSample, endSample, waveformReadBuf);
                    // Pass a subarray view (no copy) of the exact length
                    drawWaveform(ctx, waveformReadBuf.subarray(0, written), width, waveHeight, waveY);
                } else {
                    const audioData = ringBuffer.read(startSample, endSample);
                    drawWaveform(ctx, audioData, width, waveHeight, waveY);
                }
            }
        } catch (e) {
            // Data likely overwritten or not available
        }

        // 3. VAD Signal Layer
        drawVadLayer(ctx, width, vadHeight, vadY, startTime, duration, dpr);

        // 4. Overlay (time labels, trigger line)
        drawOverlay(ctx, width, height, startTime, duration, dpr);

        animationFrameId = requestAnimationFrame(loop);
    };

    const drawSpectrogramToCanvas = (
        ctx: CanvasRenderingContext2D,
        features: Float32Array,
        melBins: number,
        timeSteps: number,
        width: number,
        height: number
    ) => {
        // features layout: [melBins, T] (mel-major, flattened from [mel, time])
        // So features[m * timeSteps + t].

        if (timeSteps === 0) return;

        // Reuse cached ImageData if dimensions match; allocate only on size change
        if (!cachedSpecImgData || cachedSpecImgWidth !== width || cachedSpecImgHeight !== height) {
            cachedSpecImgData = ctx.createImageData(width, height);
            cachedSpecImgWidth = width;
            cachedSpecImgHeight = height;
        }
        const imgData = cachedSpecImgData;
        const data = imgData.data;

        // Scaling factors
        const timeScale = timeSteps / width;
        const freqScale = melBins / height;

        for (let x = 0; x < width; x++) {
            const t = Math.floor(x * timeScale);
            if (t >= timeSteps) break;

            for (let y = 0; y < height; y++) {
                // y=0 is top (high freq), y=height is bottom (low freq).
                const m = Math.floor((height - 1 - y) * freqScale);
                if (m >= melBins) continue;

                const val = features[m * timeSteps + t];

                // Fixed dB scaling: map MIN_DB..MAX_DB to 0..1, then to LUT index.
                // Raw log-mel values are in range ~-11 (silence) to ~0 (loud speech).
                // This avoids "gain hunting" where silence is stretched to full brightness.
                const normalized = (val - MIN_DB) / DB_RANGE;
                const clamped = Math.max(0, Math.min(1, normalized));
                const lutIdx = (clamped * 255) | 0;
                const lutBase = lutIdx * 3;

                const idx = (y * width + x) * 4;
                data[idx] = COLORMAP_LUT[lutBase];
                data[idx + 1] = COLORMAP_LUT[lutBase + 1];
                data[idx + 2] = COLORMAP_LUT[lutBase + 2];
                data[idx + 3] = 255;
            }
        }
        ctx.putImageData(imgData, 0, 0);
    };

    // Fixed gain so typical mic levels are visible; avoids jumps from per-buffer scaling
    const WAVEFORM_GAIN = 4;

    const drawWaveform = (ctx: CanvasRenderingContext2D, data: Float32Array, width: number, height: number, offsetY: number) => {
        if (data.length === 0) return;

        const step = Math.ceil(data.length / width);
        const amp = (height / 2) * WAVEFORM_GAIN;
        const centerY = offsetY + height / 2;

        ctx.strokeStyle = '#4ade80'; // Green
        ctx.lineWidth = 1;
        ctx.beginPath();

        for (let x = 0; x < width; x++) {
            const startIdx = x * step;
            const endIdx = Math.min((x + 1) * step, data.length);

            let min = 1;
            let max = -1;
            let hasData = false;

            for (let i = startIdx; i < endIdx; i += Math.max(1, Math.floor((endIdx - startIdx) / 10))) {
                const s = data[i];
                if (s < min) min = s;
                if (s > max) max = s;
                hasData = true;
            }

            if (hasData) {
                const yMin = centerY - min * amp;
                const yMax = centerY - max * amp;
                ctx.moveTo(x, Math.max(offsetY, Math.min(offsetY + height, yMin)));
                ctx.lineTo(x, Math.max(offsetY, Math.min(offsetY + height, yMax)));
            }
        }
        ctx.stroke();
    };

    const drawVadLayer = (ctx: CanvasRenderingContext2D, width: number, height: number, offsetY: number, startTime: number, duration: number, dpr: number) => {
        // Draw VAD state as a colored bar
        // For now, just show current VAD state as a solid bar (could be enhanced with historical data)
        const vadState = appStore.vadState();
        const isSpeech = vadState.isSpeech;

        // Background
        ctx.fillStyle = isSpeech ? 'rgba(249, 115, 22, 0.4)' : 'rgba(100, 116, 139, 0.2)'; // Orange when speech, slate when silence
        ctx.fillRect(0, offsetY, width, height);

        // If energy-based detection is active, show energy level as a bar
        const energyLevel = appStore.audioLevel();
        const energyThreshold = appStore.energyThreshold();

        if (energyLevel > 0) {
            const barWidth = Math.min(width, width * (energyLevel / 0.3)); // Scale to max 30% energy
            ctx.fillStyle = energyLevel > energyThreshold ? 'rgba(249, 115, 22, 0.8)' : 'rgba(74, 222, 128, 0.6)';
            ctx.fillRect(width - barWidth, offsetY, barWidth, height);
        }

        // Draw a thin separator line at top
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
        ctx.lineWidth = 1 * dpr;
        ctx.beginPath();
        ctx.moveTo(0, offsetY);
        ctx.lineTo(width, offsetY);
        ctx.stroke();

        // Label
        ctx.fillStyle = isSpeech ? '#fb923c' : '#64748b';
        ctx.font = `${8 * dpr}px monospace`;
        ctx.fillText(isSpeech ? 'SPEECH' : 'SILENCE', 4 * dpr, offsetY + height - 2 * dpr);
    };

    const drawOverlay = (ctx: CanvasRenderingContext2D, width: number, height: number, startTime: number, duration: number, dpr: number) => {
        // Draw Trigger line (1.5s from right) if in V3 mode
        const triggerX = width - (1.5 / duration) * width;
        ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)';
        ctx.lineWidth = 1 * dpr;
        ctx.beginPath();
        ctx.moveTo(triggerX, 0);
        ctx.lineTo(triggerX, height);
        ctx.stroke();

        // Time labels
        ctx.fillStyle = '#94a3b8';
        ctx.font = `${10 * dpr}px monospace`;
        for (let i = 0; i <= 8; i += 2) {
            const t = i;
            const x = width - (t / duration) * width;
            ctx.fillText(`-${t}s`, x + 3 * dpr, height - 6 * dpr);
        }
    };

    return (
        <div
            class="relative w-full bg-slate-900 rounded border border-slate-700 overflow-hidden shadow-inner"
            style={{ height: `${props.height || 200}px` }}
        >
            <canvas ref={canvasRef} class="w-full h-full block" />
            <div class="absolute top-2 left-2 text-[10px] text-slate-400 pointer-events-none">
                SPECTROGRAM + WAVEFORM ({getWindowDuration()}s)
            </div>
        </div>
    );
};
