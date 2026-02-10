import { Component, onCleanup, onMount } from 'solid-js';

interface WaveformProps {
  audioLevel: number;
  isRecording: boolean;
  barCount?: number;
}

/**
 * Canvas-based waveform visualizer.
 *
 * Previous implementation used 32 DOM <div> elements with inline styles,
 * updated at 60fps via requestAnimationFrame + SolidJS signal. This caused
 * 32 style recalculations and layout passes per frame, contributing to the
 * layout-shift clusters seen in the performance profile.
 *
 * This canvas version renders all bars in a single draw call with zero DOM
 * updates, throttled to ~30fps which is perceptually smooth for this UI.
 */
export const Waveform: Component<WaveformProps> = (props) => {
  const count = () => props.barCount ?? 32;

  let canvasRef: HTMLCanvasElement | undefined;
  let ctx: CanvasRenderingContext2D | null = null;
  let animationId: number | undefined;
  let resizeObserver: ResizeObserver | null = null;

  // Persistent bar heights array (mutated in-place, no allocations per frame)
  let bars: Float32Array = new Float32Array(0);

  // Throttle to ~30fps (33ms) - plenty smooth for a decorative visualizer
  let lastDrawTime = 0;
  const DRAW_INTERVAL_MS = 33;

  // Cache CSS color; refresh occasionally to avoid per-frame style recalcs
  let primaryColor = '#14b8a6';
  let lastColorCheck = 0;
  const COLOR_CHECK_INTERVAL_MS = 1000;

  const updateCanvasSize = () => {
    if (!canvasRef) return;
    const parent = canvasRef.parentElement;
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const nextW = Math.floor(rect.width * dpr);
    const nextH = Math.floor(rect.height * dpr);
    if (canvasRef.width !== nextW || canvasRef.height !== nextH) {
      canvasRef.width = nextW;
      canvasRef.height = nextH;
    }
  };

  const animate = (now: number) => {
    animationId = requestAnimationFrame(animate);

    if (now - lastDrawTime < DRAW_INTERVAL_MS) return;
    lastDrawTime = now;

    if (!ctx || !canvasRef) return;

    if (now - lastColorCheck > COLOR_CHECK_INTERVAL_MS) {
      lastColorCheck = now;
      primaryColor = getComputedStyle(canvasRef).getPropertyValue('--color-primary').trim() || '#14b8a6';
    }

    const n = count();

    // Lazily init or resize the bars array
    if (bars.length !== n) {
      bars = new Float32Array(n);
      bars.fill(0.1);
    }

    // Update bar heights in-place
    if (props.isRecording) {
      const level = props.audioLevel;
      for (let i = 0; i < n; i++) {
        const base = level * 15.0 + Math.random() * 0.2;
        bars[i] = Math.min(1, Math.max(0.1, base));
      }
    } else {
      for (let i = 0; i < n; i++) {
        bars[i] = Math.max(0.05, bars[i] * 0.9);
      }
    }

    // Draw
    const w = canvasRef.width;
    const h = canvasRef.height;
    if (w === 0 || h === 0) return;

    ctx.clearRect(0, 0, w, h);

    const gap = 2;
    const barWidth = Math.max(1, (w - gap * (n - 1)) / n);
    const recording = props.isRecording;
    const alphaBase = recording ? 0.4 : 0.1;
    const alphaRange = recording ? 0.4 : 0;

    for (let i = 0; i < n; i++) {
      const barH = Math.max(2, bars[i] * h);
      const x = i * (barWidth + gap);
      const y = h - barH;
      const alpha = alphaBase + bars[i] * alphaRange;

      ctx.globalAlpha = alpha * 0.8; // match the container's opacity-80
      ctx.fillStyle = primaryColor;

      // Rounded rect (top corners only for bar effect)
      const radius = Math.min(barWidth / 2, 3);
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + barWidth - radius, y);
      ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
      ctx.lineTo(x + barWidth, y + barH);
      ctx.lineTo(x, y + barH);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
  };

  onMount(() => {
    if (canvasRef) {
      updateCanvasSize();
      ctx = canvasRef.getContext('2d', { alpha: true });
      primaryColor = getComputedStyle(canvasRef).getPropertyValue('--color-primary').trim() || '#14b8a6';

      if (typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(() => {
          updateCanvasSize();
          lastColorCheck = 0;
        });
        resizeObserver.observe(canvasRef.parentElement ?? canvasRef);
      }
    }
    animationId = requestAnimationFrame(animate);
  });

  onCleanup(() => {
    if (animationId) cancelAnimationFrame(animationId);
    resizeObserver?.disconnect();
    resizeObserver = null;
  });

  return (
    <div class="h-12 w-full overflow-hidden">
      <canvas ref={canvasRef} class="w-full h-full block" />
    </div>
  );
};

export const CompactWaveform: Component<WaveformProps> = (props) => {
  return <Waveform {...props} barCount={20} />;
};

export default Waveform;
