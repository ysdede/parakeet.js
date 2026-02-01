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
          const base = level * 0.7 + Math.random() * 0.3;
          return Math.min(1, Math.max(0.1, base));
        })
      );
    } else {
      setBarHeights(prev => prev.map(() => 0.1 + Math.random() * 0.1));
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
    <div class="flex items-center justify-end gap-[3px] h-10 opacity-80">
      <For each={barHeights()}>
        {(height) => (
          <div
            class="w-1 rounded-full transition-all duration-75 bg-blue-500"
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
