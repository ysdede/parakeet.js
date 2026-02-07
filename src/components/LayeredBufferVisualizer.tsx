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

    // Store last known DPR to handle zoom changes
    let lastDpr = 1;

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
        }

        // Create offscreen canvas 
        specCanvas = document.createElement('canvas');
        specCtx = specCanvas.getContext('2d', { alpha: false });

        loop();
    });

    onCleanup(() => {
        cancelAnimationFrame(animationFrameId);
    });

    const loop = () => {
        if (!ctx || !canvasRef || !props.audioEngine) {
            animationFrameId = requestAnimationFrame(loop);
            return;
        }

        const dpr = window.devicePixelRatio || 1;
        const rect = canvasRef.getBoundingClientRect();

        // Logical size
        const logicalWidth = rect.width;
        const logicalHeight = rect.height;

        // Physical size
        const width = Math.floor(logicalWidth * dpr);
        const height = Math.floor(logicalHeight * dpr);

        // Resize if needed (avoid clearing if size hasn't changed)
        if (canvasRef.width !== width || canvasRef.height !== height) {
            canvasRef.width = width;
            canvasRef.height = height;
        }

        // Initialize offscreen if needed
        if (specCanvas && (specCanvas.width !== width || specCanvas.height !== height)) {
            specCanvas.width = width;
            specCanvas.height = height;
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
            const now = performance.now();
            if (now - lastSpecFetchTime > SPEC_FETCH_INTERVAL) {
                lastSpecFetchTime = now;

                const fetchStartSample = Math.round(startTime * sampleRate);
                const fetchEndSample = Math.round(currentTime * sampleRate);

                props.melClient.getFeatures(fetchStartSample, fetchEndSample).then(features => {
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

        // 2. Waveform (sync with current time window)
        try {
            const startSample = Math.floor(startTime * sampleRate);
            const endSample = Math.floor(currentTime * sampleRate);

            const baseFrame = ringBuffer.getBaseFrameOffset();
            if (startSample >= baseFrame) {
                const audioData = ringBuffer.read(startSample, endSample);
                drawWaveform(ctx, audioData, width, waveHeight, waveY);
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
        // Map features to canvas
        // features is [timeSteps * melBins] (row-major or col-major?)
        // Usually [time][mel] in many libs, but PyTorch/ONNX might be [mel][time].
        // Parakeet/NeMo usually uses [B, D, T]. 
        // Let's try to interpret as [melBins, T] (vertical columns are time, rows are freq)
        // or [T, melBins] (rows are time).

        // Let's assume [T, melBins] so features[t * melBins + m].

        if (timeSteps === 0) return;

        const imgData = ctx.createImageData(width, height);
        const data = imgData.data;

        // Scaling factors
        const timeScale = timeSteps / width;
        const freqScale = melBins / height;

        for (let x = 0; x < width; x++) {
            const t = Math.floor(x * timeScale);
            if (t >= timeSteps) break;

            for (let y = 0; y < height; y++) {
                // y=0 is top (high freq?), y=height is bottom (low freq).
                // Spectrograms usually have low freq at bottom.
                // So y canvas 0 -> mel high. y canvas height -> mel 0.
                const m = Math.floor((height - 1 - y) * freqScale);
                if (m >= melBins) continue;

                // Access feature value
                // Assuming row-major [time][mel] -> features[t * melBins + m]
                // If col-major [mel][time] -> features[m * timeSteps + t]

                // Most likely [melBins * timeSteps] flattened from [mel, time].
                // Let's try features[m * timeSteps + t].

                const val = features[m * timeSteps + t];

                // Normalize for visualization (log mel stats typically -10 to 0 or so, or normalized)
                // NeMo features are usually normalized (mean 0, std 1). Map roughly -2 to 2 -> 0..1.
                const intensity = Math.max(0, Math.min(1, (val + 2.0) / 4.0));

                // GoldWave-style colormap: black -> blue -> purple -> green -> yellow -> orange -> red
                // High energy speech (formants) in yellow, orange, red; medium in green; low in blue/purple.
                const stops: [number, number, number, number][] = [
                    [0, 0, 0, 0],       // black
                    [0.12, 0, 0, 180],  // blue
                    [0.30, 120, 0, 160], // purple
                    [0.48, 0, 180, 80],  // green
                    [0.65, 220, 220, 0], // yellow
                    [0.82, 255, 140, 0], // orange
                    [1, 255, 0, 0],      // red
                ];
                let r = 0, g = 0, b = 0;
                for (let i = 0; i < stops.length - 1; i++) {
                    const [t0, r0, g0, b0] = stops[i];
                    const [t1, r1, g1, b1] = stops[i + 1];
                    if (intensity >= t0 && intensity <= t1) {
                        const t = (intensity - t0) / (t1 - t0);
                        r = Math.round(r0 + t * (r1 - r0));
                        g = Math.round(g0 + t * (g1 - g0));
                        b = Math.round(b0 + t * (b1 - b0));
                        break;
                    }
                }
                if (intensity <= stops[0][0]) {
                    r = stops[0][1];
                    g = stops[0][2];
                    b = stops[0][3];
                } else if (intensity >= stops[stops.length - 1][0]) {
                    const last = stops[stops.length - 1];
                    r = last[1];
                    g = last[2];
                    b = last[3];
                }

                const idx = (y * width + x) * 4;
                data[idx] = r;
                data[idx + 1] = g;
                data[idx + 2] = b;
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
