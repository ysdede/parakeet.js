/**
 * BoncukJS v2.0 - Waveform Visualization Component
 */

import { Component, For, createSignal, onCleanup, onMount } from 'solid-js';

interface WaveformProps {
  audioLevel: number;
  isRecording: boolean;
  barCount?: number;
}

export const Waveform: Component<WaveformProps> = (props) => {
  const barCount = () => props.barCount ?? 24;
  const [barHeights, setBarHeights] = createSignal<number[]>([]);

  onMount(() => {
    setBarHeights(Array.from({ length: barCount() }, () => Math.random()));
  });

  let animationId: number | undefined;

  const animate = () => {
    if (props.isRecording) {
      const level = props.audioLevel;
      setBarHeights(prev =>
        prev.map(() => {
          // Significant boost for visualization sensitivity
          const base = level * 20.0 + Math.random() * 0.1;
          return Math.min(1, Math.max(0.1, base));
        })
      );
    } else {
      setBarHeights(prev => prev.map(() => 0.05 + Math.random() * 0.05));
    }
    animationId = requestAnimationFrame(animate);
  };

  onMount(() => {
    animationId = requestAnimationFrame(animate);
  });

  onCleanup(() => {
    if (animationId) cancelAnimationFrame(animationId);
  });

  return (
    <div class="flex items-center justify-end gap-[3px] h-10 opacity-80 mask-image-linear-to-r">
      <For each={barHeights()}>
        {(height) => (
          <div
            class="w-1 bg-primary rounded-full transition-all duration-75 waveform-bar"
            style={{
              height: `${Math.max(10, height * 100)}%`,
              opacity: props.isRecording ? 0.8 + height * 0.2 : 0.4,
            }}
          />
        )}
      </For>
    </div>
  );
};

export const CompactWaveform: Component<WaveformProps> = (props) => {
  return <Waveform {...props} barCount={24} />;
};

export default Waveform;
