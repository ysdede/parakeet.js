import { Component, For, createSignal, onCleanup, onMount } from 'solid-js';

interface WaveformProps {
  audioLevel: number;
  isRecording: boolean;
  barCount?: number;
}

export const Waveform: Component<WaveformProps> = (props) => {
  const barCount = () => props.barCount ?? 32;
  const [barHeights, setBarHeights] = createSignal<number[]>([]);

  onMount(() => {
    setBarHeights(Array.from({ length: barCount() }, () => 0.1));
  });

  let animationId: number | undefined;

  const animate = () => {
    if (props.isRecording) {
      const level = props.audioLevel;
      setBarHeights(prev =>
        prev.map(() => {
          // Dynamic bars based on energy
          const base = level * 15.0 + Math.random() * 0.2;
          return Math.min(1, Math.max(0.1, base));
        })
      );
    } else {
      setBarHeights(prev => prev.map(h => Math.max(0.05, h * 0.9)));
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
    <div class="flex items-end justify-center gap-1.5 h-12 w-full opacity-80 overflow-hidden">
      <For each={barHeights()}>
        {(height) => (
          <div
            class="w-1.5 rounded-full transition-all duration-150"
            style={{
              height: `${Math.max(4, height * 100)}%`,
              'background-color': 'var(--color-primary)',
              opacity: props.isRecording ? 0.4 + height * 0.4 : 0.1,
              'box-shadow': props.isRecording ? '0 0 8px var(--color-primary)' : 'none'
            }}
          />
        )}
      </For>
    </div>
  );
};

export const CompactWaveform: Component<WaveformProps> = (props) => {
  return <Waveform {...props} barCount={20} />;
};

export default Waveform;

