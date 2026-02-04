/**
 * BoncukJS - Buffer Visualizer Component
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

  const height = () => props.height ?? 80;
  const showThreshold = () => props.showThreshold ?? true;
  const snrThreshold = () => props.snrThreshold ?? 6.0;
  const showTimeMarkers = () => props.showTimeMarkers ?? true;
  const visible = () => props.visible ?? true;

  let animationFrameId: number | undefined;
  let unsubscribe: (() => void) | null = null;
  let resizeObserver: ResizeObserver | null = null;

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

    // Get CSS variables for theme-aware colors
    const computedStyle = getComputedStyle(document.documentElement);
    const isDarkMode = document.documentElement.classList.contains('dark');

    // Colors (fallbacks for light/dark mode)
    const bgColor = isDarkMode ? '#1a1a2e' : '#f8fafc';
    const waveformColor = isDarkMode ? 'rgba(148, 163, 184, 0.8)' : 'rgba(71, 85, 105, 0.8)';
    const thresholdColor = isDarkMode ? 'rgba(59, 130, 246, 0.8)' : 'rgba(37, 99, 235, 0.8)';
    const noiseFloorColor = isDarkMode ? 'rgba(34, 197, 94, 0.6)' : 'rgba(22, 163, 74, 0.6)';
    const textColor = isDarkMode ? 'rgba(148, 163, 184, 0.8)' : 'rgba(100, 116, 139, 0.8)';
    const tickColor = isDarkMode ? 'rgba(100, 116, 139, 0.5)' : 'rgba(148, 163, 184, 0.5)';
    const speakingColor = '#22c55e';

    // Background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, canvasHeight);

    // Draw time markers at the top
    if (showTimeMarkers() && props.audioEngine) {
      drawTimeMarkers(width, canvasHeight, textColor, tickColor);
    }

    // Draw segment boundaries (before waveform so they appear behind)
    if (props.audioEngine) {
      drawSegments(width, canvasHeight, isDarkMode);
    }

    // Draw waveform using min/max data
    if (data.length >= 2) {
      ctx.beginPath();
      ctx.strokeStyle = waveformColor;
      ctx.lineWidth = 1;

      const numPoints = data.length / 2; // Number of min/max pairs
      const step = width / numPoints;

      for (let i = 0; i < numPoints; i++) {
        const x = i * step;
        const minVal = data[i * 2];
        const maxVal = data[i * 2 + 1];

        // Scale values to canvas coordinates
        const yMin = centerY - minVal * centerY;
        const yMax = centerY - maxVal * centerY;

        // Draw vertical line for this point
        ctx.moveTo(x, yMin);
        ctx.lineTo(x, yMax);
      }
      ctx.stroke();
    }

    // Draw adaptive threshold based on SNR
    if (showThreshold() && currentMetrics.noiseFloor > 0) {
      const snrRatio = Math.pow(10, snrThreshold() / 10);
      const adaptiveThreshold = currentMetrics.noiseFloor * snrRatio;

      // Positive threshold line
      ctx.beginPath();
      ctx.strokeStyle = thresholdColor;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([]);

      const adaptiveYPos = centerY - adaptiveThreshold * centerY;
      ctx.moveTo(0, adaptiveYPos);
      ctx.lineTo(width, adaptiveYPos);

      // Negative threshold line (mirror)
      const adaptiveYNeg = centerY + adaptiveThreshold * centerY;
      ctx.moveTo(0, adaptiveYNeg);
      ctx.lineTo(width, adaptiveYNeg);
      ctx.stroke();

      // Label
      ctx.fillStyle = thresholdColor;
      ctx.font = '10px system-ui, sans-serif';
      ctx.fillText(`SNR ${snrThreshold().toFixed(1)}dB`, 5, adaptiveYPos - 5);
    }

    // Draw noise floor level
    if (currentMetrics.noiseFloor > 0) {
      const noiseFloorY = centerY - currentMetrics.noiseFloor * centerY;

      ctx.beginPath();
      ctx.strokeStyle = noiseFloorColor;
      ctx.lineWidth = 1;
      ctx.setLineDash([1, 1]);
      ctx.moveTo(0, noiseFloorY);
      ctx.lineTo(width, noiseFloorY);
      ctx.stroke();

      // Mirror for negative
      const noiseFloorYNeg = centerY + currentMetrics.noiseFloor * centerY;
      ctx.beginPath();
      ctx.moveTo(0, noiseFloorYNeg);
      ctx.lineTo(width, noiseFloorYNeg);
      ctx.stroke();

      ctx.setLineDash([]);
    }

    // Draw speaking indicator
    if (currentMetrics.isSpeaking) {
      const indicatorX = width - 15;
      const indicatorY = 15;
      const radius = 5;

      ctx.beginPath();
      ctx.arc(indicatorX, indicatorY, radius, 0, Math.PI * 2);
      ctx.fillStyle = speakingColor;
      ctx.fill();

      // Ripple effect when speaking
      const time = performance.now() / 1000;
      const rippleRadius = radius + Math.sin(time * 5) * 2;

      ctx.beginPath();
      ctx.arc(indicatorX, indicatorY, rippleRadius, 0, Math.PI * 2);
      ctx.strokeStyle = speakingColor;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Draw SNR meter on the right side
    if (currentMetrics.currentSNR > 0) {
      const snrHeight = Math.min(60, currentMetrics.currentSNR * 2);
      const meterX = width - 30;
      const meterWidth = 20;
      const meterY = canvasHeight - 10 - snrHeight;

      // Background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fillRect(meterX, canvasHeight - 70, meterWidth, 60);

      // SNR level
      ctx.fillStyle = currentMetrics.currentSNR > snrThreshold() ? speakingColor : tickColor;
      ctx.fillRect(meterX, meterY, meterWidth, snrHeight);

      // Threshold marker
      const thresholdLineY = canvasHeight - 10 - snrThreshold() * 2;
      ctx.beginPath();
      ctx.strokeStyle = thresholdColor;
      ctx.setLineDash([]);
      ctx.moveTo(meterX, thresholdLineY);
      ctx.lineTo(meterX + meterWidth, thresholdLineY);
      ctx.stroke();

      // Label
      ctx.fillStyle = textColor;
      ctx.font = '10px system-ui, sans-serif';
      ctx.fillText(`SNR: ${currentMetrics.currentSNR.toFixed(1)}dB`, meterX - 5, canvasHeight - 75);
    }
  };

  // Draw time markers
  const drawTimeMarkers = (width: number, canvasHeight: number, textColor: string, tickColor: string) => {
    if (!ctx || !props.audioEngine) return;

    const bufferDuration = props.audioEngine.getVisualizationDuration();
    const currentTime = props.audioEngine.getCurrentTime();
    const windowStart = currentTime - bufferDuration;

    ctx.fillStyle = textColor;
    ctx.font = '10px system-ui, sans-serif';

    const markerInterval = 5; // Every 5 seconds
    for (let i = 0; i <= bufferDuration; i += markerInterval) {
      const x = (i / bufferDuration) * width;
      const time = Math.floor(windowStart + i);

      if (time >= 0) {
        // Draw tick mark
        ctx.beginPath();
        ctx.strokeStyle = tickColor;
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 15);
        ctx.stroke();

        // Draw time label
        ctx.fillText(`${time}s`, x + 2, 12);
      }
    }
  };

  // Draw segment boundaries
  const drawSegments = (width: number, canvasHeight: number, isDarkMode: boolean) => {
    const context = ctx;
    if (!context || !props.audioEngine) return;

    const bufferDuration = props.audioEngine.getVisualizationDuration();
    const currentTime = props.audioEngine.getCurrentTime();
    const windowStart = currentTime - bufferDuration;
    const segmentList = segments();

    // Colors for segments
    const pendingColor = isDarkMode ? 'rgba(250, 204, 21, 0.15)' : 'rgba(234, 179, 8, 0.15)';
    const processedColor = isDarkMode ? 'rgba(34, 197, 94, 0.15)' : 'rgba(22, 163, 74, 0.15)';
    const pendingBorderColor = isDarkMode ? 'rgba(250, 204, 21, 0.5)' : 'rgba(234, 179, 8, 0.5)';
    const processedBorderColor = isDarkMode ? 'rgba(34, 197, 94, 0.5)' : 'rgba(22, 163, 74, 0.5)';

    segmentList.forEach(segment => {
      // Calculate relative position in visualization window
      const relativeStart = segment.startTime - windowStart;
      const relativeEnd = segment.endTime - windowStart;

      // Only draw if segment is within visible window
      if (relativeEnd > 0 && relativeStart < bufferDuration) {
        const startX = Math.max(0, (relativeStart / bufferDuration)) * width;
        const endX = Math.min(1, (relativeEnd / bufferDuration)) * width;

        // Fill segment area
        context.fillStyle = segment.isProcessed ? processedColor : pendingColor;
        context.fillRect(startX, 0, endX - startX, canvasHeight);

        // Draw segment boundaries
        context.strokeStyle = segment.isProcessed ? processedBorderColor : pendingBorderColor;
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(startX, 0);
        context.lineTo(startX, canvasHeight);
        context.moveTo(endX, 0);
        context.lineTo(endX, canvasHeight);
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
      draw();
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
      }
    }
  });

  onMount(() => {
    if (canvasRef) {
      ctx = canvasRef.getContext('2d');
    }

    // Setup resize observer
    handleResize();
    resizeObserver = new ResizeObserver(handleResize);
    if (parentRef) {
      resizeObserver.observe(parentRef);
    }

    // Subscribe to visualization updates from AudioEngine
    if (props.audioEngine) {
      unsubscribe = props.audioEngine.onVisualizationUpdate((data, newMetrics) => {
        if (visible()) {
          // Refetch data for current canvas width (more accurate)
          if (canvasWidth() > 0) {
            setWaveformData(props.audioEngine!.getVisualizationData(canvasWidth()));
          } else {
            setWaveformData(data);
          }
          setMetrics(newMetrics);

          // Fetch segments for visualization
          setSegments(props.audioEngine!.getSegmentsForVisualization());
        } else {
          // Still update metrics even when not visible
          setMetrics(newMetrics);
        }
      });
    }

    // Start animation loop
    animationFrameId = requestAnimationFrame(drawLoop);
  });

  onCleanup(() => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      clearTimeout(animationFrameId);
    }
    if (unsubscribe) {
      unsubscribe();
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
        style={{ 'image-rendering': 'crisp-edges' }}
        aria-label="Audio waveform visualization"
      />
    </div>
  );
};

export default BufferVisualizer;
