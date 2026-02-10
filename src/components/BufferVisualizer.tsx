/**
"""""""""" * BoncukJS - Buffer Visualizer Component
 * Canvas-based real-time audio waveform visualization.
 * Ported from parakeet-ui (Svelte) to SolidJS.
 */

import { Component, createSignal, onMount, onCleanup, createEffect } from 'solid-js';
import type { AudioEngine, AudioMetrics } from '../lib/audio';

interface BufferVisualizerProps {
  /** AudioEngine instance for subscribing to visualization updates */
  audioEngine?: AudioEngine;
  /** Height of the canvas in pixels (default: 80) */
  height?: number;
  /** Whether to show SNR threshold line (default: true) */
  showThreshold?: boolean;
  /** SNR threshold in dB for visualization (default: 6.0) */
  snrThreshold?: number;
  /** Whether to show time markers (default: true) */
  showTimeMarkers?: boolean;
  /** Whether the visualizer is visible (optimization - reduces frame rate when hidden) */
  visible?: boolean;
}

export const BufferVisualizer: Component<BufferVisualizerProps> = (props) => {
  // Canvas element ref
  let canvasRef: HTMLCanvasElement | undefined;
  let ctx: CanvasRenderingContext2D | null = null;
  let parentRef: HTMLDivElement | undefined;

  // State
  const [isDarkSignal, setIsDarkSignal] = createSignal(false);
  const [canvasWidth, setCanvasWidth] = createSignal(0);
  const [waveformData, setWaveformData] = createSignal<Float32Array>(new Float32Array(0));
  const [metrics, setMetrics] = createSignal<AudioMetrics>({
    currentEnergy: 0,
    averageEnergy: 0,
    peakEnergy: 0,
    noiseFloor: 0.01,
    currentSNR: 0,
    isSpeaking: false,
  });
  const [segments, setSegments] = createSignal<Array<{ startTime: number; endTime: number; isProcessed: boolean }>>([]);
  // Track the end time of the current waveform snapshot for strict synchronization
  const [bufferEndTime, setBufferEndTime] = createSignal(0);

  const height = () => props.height ?? 80;
  const showThreshold = () => props.showThreshold ?? true;
  const snrThreshold = () => props.snrThreshold ?? 6.0;
  const showTimeMarkers = () => props.showTimeMarkers ?? true;
  const visible = () => props.visible ?? true;

  let animationFrameId: number | undefined;
  let resizeObserver: ResizeObserver | null = null;
  let needsRedraw = true;
  let lastDrawTime = 0;
  const DRAW_INTERVAL_MS = 33;

  // Draw function
  const draw = () => {
    if (!ctx || !canvasRef) return;

    const width = canvasRef.width;
    const canvasHeight = canvasRef.height;
    const centerY = canvasHeight / 2;
    const data = waveformData();
    const currentMetrics = metrics();

    // Clear canvas
    ctx.clearRect(0, 0, width, canvasHeight);

    // Optimized theme detection (using signal instead of DOM access)
    const isDarkMode = isDarkSignal();

    // Colors (Mechanical Etched Palette) - Cached values
    const bgColor = isDarkMode ? '#1e293b' : '#f1f5f9';
    const highlightColor = isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.8)';
    const shadowColor = isDarkMode ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.1)';
    const etchColor = isDarkMode ? '#334155' : '#cbd5e1';
    const signalActiveColor = '#3b82f6';

    // Background
    if (ctx) {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, width, canvasHeight);

      // Baseline (Etched indent)
      ctx.beginPath();
      ctx.strokeStyle = shadowColor;
      ctx.lineWidth = 0.5;
      ctx.moveTo(0, centerY);
      ctx.lineTo(width, centerY);
      ctx.stroke();

      // Draw time markers at the top
      if (showTimeMarkers() && props.audioEngine) {
        // Use the new textColor and tickColor based on the etched palette
        const textColor = isDarkMode ? '#94a3b8' : '#94a3b8';
        const tickColor = isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
        drawTimeMarkers(width, canvasHeight, textColor, tickColor);
      }

      // Draw segment boundaries (before waveform so they appear behind)
      if (props.audioEngine) {
        drawSegments(width, canvasHeight, isDarkMode);
      }

      // Draw waveform using Parakeet-UI logic (Etched Mercury Style)
      if (data.length >= 2) {
        // Data is already subsampled to ~400 points (min, max pairs)
        const numPoints = data.length / 2;
        const step = width / numPoints; // Use simple step as points ~ width/2

        // Helper to draw the full waveform path
        // Optimized Waveform Path (Consolidated passes)
        ctx.lineCap = 'round';

        // Helper to draw the full waveform path
        const drawPath = (offsetX: number, offsetY: number) => {
          if (!ctx) return;
          ctx.beginPath();
          for (let i = 0; i < numPoints; i++) {
            const x = i * step + offsetX;
            // Ensure min/max have at least 1px difference for visibility even when silent
            let minVal = data[i * 2];
            let maxVal = data[i * 2 + 1];

            // Scaled values
            let yMin = centerY - (minVal * centerY * 0.9) + offsetY;
            let yMax = centerY - (maxVal * centerY * 0.9) + offsetY;

            // Ensure tiny signals are visible (min 1px height)
            if (Math.abs(yMax - yMin) < 1) {
              yMin = centerY - 0.5 + offsetY;
              yMax = centerY + 0.5 + offsetY;
            }

            ctx.moveTo(x, yMin);
            ctx.lineTo(x, yMax);
          }
          ctx.stroke();
        };

        // 1. Highlight Pass (Sharp top-left edge)
        ctx.strokeStyle = highlightColor;
        ctx.lineWidth = 1.0;
        drawPath(-0.5, -0.5);

        // 2. Shadow Pass (Depressed groove)
        ctx.strokeStyle = shadowColor;
        ctx.lineWidth = 1.2;
        drawPath(0.5, 0.5);

        // 3. Main Etch Pass (Base material) - Slate color for contrast
        ctx.strokeStyle = etchColor;
        ctx.lineWidth = 1.0;
        drawPath(0, 0);

        // 4. Active signal glow
        if (currentMetrics.isSpeaking) {
          ctx.globalAlpha = 0.5;
          ctx.shadowBlur = 4;
          ctx.shadowColor = signalActiveColor;
          ctx.strokeStyle = signalActiveColor;
          ctx.lineWidth = 1.0;
          drawPath(0, 0);
          ctx.shadowBlur = 0;
          ctx.globalAlpha = 1.0;
        }
      }

      // Draw adaptive threshold (Etched dashes)
      if (showThreshold() && currentMetrics.noiseFloor > 0) {
        const snrRatio = Math.pow(10, snrThreshold() / 10);
        const adaptiveThreshold = currentMetrics.noiseFloor * snrRatio;

        const drawThresholdLine = (offsetY: number, color: string) => {
          if (!ctx) return;
          ctx.beginPath();
          ctx.strokeStyle = color;
          ctx.lineWidth = 1;
          ctx.setLineDash([2, 4]);
          const adaptiveYPos = centerY - adaptiveThreshold * centerY + offsetY;
          ctx.moveTo(0, adaptiveYPos); ctx.lineTo(width, adaptiveYPos);
          const adaptiveYNeg = centerY + adaptiveThreshold * centerY + offsetY;
          ctx.moveTo(0, adaptiveYNeg); ctx.lineTo(width, adaptiveYNeg);
          ctx.stroke();
        };

        drawThresholdLine(1, highlightColor);
        drawThresholdLine(0, shadowColor);
        ctx.setLineDash([]);

        // Label (Etched text)
        ctx.fillStyle = isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.2)';
        ctx.font = '900 9px "JetBrains Mono", monospace';
        const labelY = centerY - adaptiveThreshold * centerY - 8;
        ctx.fillText(`THRSH: ${snrThreshold().toFixed(1)}dB`, 10, labelY);
      }

      // Draw noise floor level (retained original style for clarity)
      if (currentMetrics.noiseFloor > 0) {
        const nfColor = isDarkMode ? 'rgba(74, 222, 128, 0.1)' : 'rgba(34, 197, 94, 0.1)';
        const noiseFloorY = centerY - currentMetrics.noiseFloor * centerY;
        const noiseFloorYNeg = centerY + currentMetrics.noiseFloor * centerY;

        ctx.beginPath();
        ctx.strokeStyle = nfColor;
        ctx.lineWidth = 1;
        ctx.moveTo(0, noiseFloorY);
        ctx.lineTo(width, noiseFloorY);
        ctx.moveTo(0, noiseFloorYNeg);
        ctx.lineTo(width, noiseFloorYNeg);
        ctx.stroke();
      }

      // Draw speaking indicator (Neumorphic dot)
      if (currentMetrics.isSpeaking) {
        const speakingColor = '#22c55e';
        const indicatorX = width - 60;
        const indicatorY = 25;
        const radius = 6;

        // Glow effect
        ctx.shadowBlur = 10;
        ctx.shadowColor = speakingColor;

        ctx.beginPath();
        ctx.arc(indicatorX, indicatorY, radius, 0, Math.PI * 2);
        ctx.fillStyle = speakingColor;
        ctx.fill();

        ctx.shadowBlur = 0;

        // Pulse ring
        const time = performance.now() / 1000;
        const rippleRadius = radius + (time % 1) * 10;
        const rippleOpacity = 1 - (time % 1);

        ctx.beginPath();
        ctx.arc(indicatorX, indicatorY, rippleRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(34, 197, 94, ${rippleOpacity})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // SNR meter on the right side - Etched mechanical gauge
      if (currentMetrics.currentSNR > 0) {
        const meterPadding = 15;
        const meterWidth = 6;
        const meterX = width - 20;
        const meterHeight = canvasHeight - (meterPadding * 2);

        // Meter Housing (Inset)
        ctx.fillStyle = shadowColor;
        ctx.beginPath();
        ctx.roundRect(meterX, meterPadding, meterWidth, meterHeight, 3);
        ctx.fill();

        ctx.strokeStyle = highlightColor;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Gauge Level
        const maxSNR = 60;
        const cappedSNR = Math.min(maxSNR, currentMetrics.currentSNR);
        const fillHeight = (cappedSNR / maxSNR) * meterHeight;
        const fillY = (meterPadding + meterHeight) - fillHeight;

        // Glow for the active portion
        ctx.shadowBlur = 8;
        ctx.shadowColor = currentMetrics.currentSNR >= snrThreshold() ? 'rgba(34, 197, 94, 0.4)' : 'rgba(96, 165, 250, 0.4)';

        ctx.fillStyle = currentMetrics.currentSNR >= snrThreshold() ? '#22c55e' : signalActiveColor;
        ctx.beginPath();
        ctx.roundRect(meterX, fillY, meterWidth, fillHeight, 3);
        ctx.fill();

        ctx.shadowBlur = 0;

        // Threshold marker notched in
        const thresholdMarkerY = (meterPadding + meterHeight) - (Math.min(maxSNR, snrThreshold()) / maxSNR * meterHeight);
        ctx.beginPath();
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.moveTo(meterX - 4, thresholdMarkerY);
        ctx.lineTo(meterX + meterWidth + 4, thresholdMarkerY);
        ctx.stroke();

        // Digital Readout
        ctx.fillStyle = isDarkMode ? '#f8fafc' : '#1e293b';
        ctx.font = '900 10px "JetBrains Mono", monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`${currentMetrics.currentSNR.toFixed(0)}`, meterX - 8, thresholdMarkerY + 4);
        ctx.textAlign = 'left';
      }
    }
  };

  // Draw time markers
  const drawTimeMarkers = (width: number, canvasHeight: number, textColor: string, tickColor: string) => {
    if (!ctx || !props.audioEngine) return;

    const bufferDuration = props.audioEngine.getVisualizationDuration();
    const currentTime = bufferEndTime(); // Use synchronized end time of buffer
    const windowStart = currentTime - bufferDuration;

    ctx.fillStyle = textColor;
    ctx.font = '10px system-ui, sans-serif';

    const markerInterval = 5; // Every 5 seconds
    const firstMarkerTime = Math.ceil(windowStart / markerInterval) * markerInterval;

    for (let time = firstMarkerTime; time <= currentTime; time += markerInterval) {
      const x = ((time - windowStart) / bufferDuration) * width;

      // Draw tick mark
      ctx.beginPath();
      ctx.strokeStyle = tickColor;
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 15);
      ctx.stroke();

      // Draw time label
      ctx.fillText(`${time}s`, x + 2, 12);
    }
  };

  // Draw segment boundaries
  const drawSegments = (width: number, canvasHeight: number, isDarkMode: boolean) => {
    const context = ctx;
    if (!context || !props.audioEngine) return;

    const bufferDuration = props.audioEngine.getVisualizationDuration();
    const currentTime = bufferEndTime(); // Use synchronized end time of buffer
    const windowStart = currentTime - bufferDuration;
    const segmentList = segments();

    // Colors for segments
    const pendingColor = isDarkMode ? 'rgba(250, 204, 21, 0.15)' : 'rgba(234, 179, 8, 0.15)';
    const processedColor = isDarkMode ? 'rgba(34, 197, 94, 0.15)' : 'rgba(22, 163, 74, 0.15)';
    const pendingBorderColor = isDarkMode ? 'rgba(250, 204, 21, 0.5)' : 'rgba(234, 179, 8, 0.5)';
    const processedBorderColor = isDarkMode ? 'rgba(34, 197, 94, 0.5)' : 'rgba(22, 163, 74, 0.5)';

    // Log segment count for debugging
    // console.log('Drawing segments:', segmentList.length);

    segmentList.forEach(segment => {
      // Calculate relative position in visualization window
      const relativeStart = segment.startTime - windowStart;
      const relativeEnd = segment.endTime - windowStart;

      // Only draw if segment is within visible window
      if (relativeEnd > 0 && relativeStart < bufferDuration) {
        // Pixel-snap boundaries to prevent anti-aliasing jitter/widening
        const startX = Math.floor(Math.max(0, (relativeStart / bufferDuration)) * width);
        const endX = Math.ceil(Math.min(1, (relativeEnd / bufferDuration)) * width);

        // Fill segment area - increased opacity for visibility
        context.fillStyle = segment.isProcessed ?
          (isDarkMode ? 'rgba(34, 197, 94, 0.3)' : 'rgba(22, 163, 74, 0.3)') :
          (isDarkMode ? 'rgba(250, 204, 21, 0.3)' : 'rgba(234, 179, 8, 0.3)');

        context.fillRect(startX, 0, endX - startX, canvasHeight);

        // Draw segment boundaries (snap to pixel + 0.5 for sharp 1px lines)
        context.strokeStyle = segment.isProcessed ? processedBorderColor : pendingBorderColor;
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(startX + 0.5, 0);
        context.lineTo(startX + 0.5, canvasHeight);
        context.moveTo(endX - 0.5, 0);
        context.lineTo(endX - 0.5, canvasHeight);
        context.stroke();
      }
    });
  };

  // Animation loop
  const drawLoop = () => {
    if (!ctx || !canvasRef || canvasRef.width === 0) {
      if (visible()) {
        animationFrameId = requestAnimationFrame(drawLoop);
      } else {
        animationFrameId = window.setTimeout(drawLoop, 100) as unknown as number;
      }
      return;
    }

    if (visible()) {
      const now = performance.now();
      if (needsRedraw && now - lastDrawTime >= DRAW_INTERVAL_MS) {
        lastDrawTime = now;
        needsRedraw = false;
        draw();
      }
      animationFrameId = requestAnimationFrame(drawLoop);
    } else {
      // When not visible, check less frequently to save CPU
      animationFrameId = window.setTimeout(drawLoop, 100) as unknown as number;
    }
  };

  // Resize handler
  const handleResize = () => {
    if (canvasRef && parentRef) {
      const newWidth = parentRef.clientWidth;
      if (newWidth > 0 && newWidth !== canvasWidth()) {
        canvasRef.width = newWidth;
        canvasRef.height = height();
        setCanvasWidth(newWidth);

        // Refetch visualization data for new width
        if (props.audioEngine && visible()) {
          setWaveformData(props.audioEngine.getVisualizationData(newWidth));
          needsRedraw = true;
          // Note: can't update bufferEndTime here easily without calling another method on engine,
          // but next update loop will catch it.
        }
      }
    }
  };

  // Subscribe to audio engine updates
  createEffect(() => {
    const engine = props.audioEngine;
    if (engine && visible()) {
      // Initial data fetch
      if (canvasWidth() > 0) {
        setWaveformData(engine.getVisualizationData(canvasWidth()));
        setBufferEndTime(engine.getCurrentTime());
      }

      // Subscribe to updates
      const sub = engine.onVisualizationUpdate((data, newMetrics, endTime) => {
        if (visible()) {
          setWaveformData(data);
          setMetrics(newMetrics);
          setBufferEndTime(endTime);

          // Fetch segments for visualization
          setSegments(engine.getSegmentsForVisualization());
          needsRedraw = true;
        } else {
          // Still update metrics even when not visible
          setMetrics(newMetrics);
        }
      });

      onCleanup(() => sub());
    }
  });

  // Mark for redraw when visibility toggles
  createEffect(() => {
    if (visible()) {
      needsRedraw = true;
    }
  });

  onMount(() => {
    if (canvasRef) {
      ctx = canvasRef.getContext('2d');
    }

    // Setup dark mode observer
    setIsDarkSignal(document.documentElement.classList.contains('dark'));
    const themeObserver = new MutationObserver(() => {
      setIsDarkSignal(document.documentElement.classList.contains('dark'));
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    onCleanup(() => themeObserver.disconnect());

    // Setup resize observer
    handleResize();
    resizeObserver = new ResizeObserver(handleResize);
    if (parentRef) {
      resizeObserver.observe(parentRef);
    }

    // Start animation loop
    animationFrameId = requestAnimationFrame(drawLoop);
  });

  onCleanup(() => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      clearTimeout(animationFrameId);
    }
    if (resizeObserver) {
      resizeObserver.disconnect();
    }
  });

  return (
    <div ref={parentRef} class="w-full relative" style={{ height: `${height()}px` }}>
      <canvas
        ref={canvasRef}
        class="w-full h-full block"
        style={{ 'image-rendering': 'auto' }}
        aria-label="Audio waveform visualization"
      />
    </div>
  );
};

export default BufferVisualizer;
