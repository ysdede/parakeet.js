/**
 * BoncukJS v2.0 - Waveform Visualization Component
 * 
 * Real-time audio level visualization with animated bars.
 * Designed to match the UI draft aesthetic.
 */

import { Component, For, createMemo, createSignal, onCleanup, onMount } from 'solid-js';

interface WaveformProps {
  /** Audio level from 0-1 */
  audioLevel: number;
  /** Whether recording is active */
  isRecording: boolean;
  /** Number of bars to display */
  barCount?: number;
  /** Base color class for bars */
  colorClass?: string;
}

export const Waveform: Component<WaveformProps> = (props) => {
  const barCount = () => props.barCount ?? 24;
  const colorClass = () => props.colorClass ?? 'bg-blue-500';
  
  // Generate random heights for animation variety
  const [barHeights, setBarHeights] = createSignal<number[]>([]);
  
  // Initialize bar heights
  onMount(() => {
    setBarHeights(Array.from({ length: barCount() }, () => Math.random()));
  });
  
  // Animate bars when recording
  let animationId: number | undefined;
  
  const animate = () => {
    if (props.isRecording) {
      const level = props.audioLevel;
      setBarHeights(prev => 
        prev.map(() => {
          // Mix audio level with randomness for natural look
          const base = level * 0.7 + Math.random() * 0.3;
          return Math.min(1, Math.max(0.1, base));
        })
      );
    } else {
      // Idle state - minimal animation
      setBarHeights(prev => 
        prev.map(() => 0.1 + Math.random() * 0.1)
      );
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
        {(height, index) => (
          <div
            class={`w-1 rounded-full transition-all duration-75 ${colorClass()}`}
            style={{
              height: `${Math.max(10, height * 100)}%`,
              opacity: props.isRecording ? 0.8 + height * 0.2 : 0.4,
              'animation-delay': `${index() * 50}ms`,
            }}
          />
        )}
      </For>
    </div>
  );
};

/**
 * Compact waveform for header display
 */
export const CompactWaveform: Component<WaveformProps> = (props) => {
  return (
    <Waveform 
      {...props} 
      barCount={24}
    />
  );
};

/**
 * Mini energy meter (single bar)
 */
interface EnergyMeterProps {
  level: number;
  threshold?: number;
  isActive: boolean;
}

export const EnergyMeter: Component<EnergyMeterProps> = (props) => {
  const threshold = () => props.threshold ?? 0.01;
  const isSpeech = () => props.level > threshold();
  
  const levelPercent = createMemo(() => {
    // Scale level for better visibility (log scale)
    const scaled = Math.log10(1 + props.level * 9) * 100;
    return Math.min(100, Math.max(0, scaled));
  });
  
  return (
    <div class="flex items-center gap-2">
      {/* Energy bar */}
      <div class="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div 
          class={`h-full rounded-full transition-all duration-75 ${
            isSpeech() ? 'bg-green-500' : 'bg-gray-400'
          }`}
          style={{ width: `${levelPercent()}%` }}
        />
      </div>
      
      {/* Speech indicator */}
      <span class={`w-2 h-2 rounded-full ${
        isSpeech() ? 'bg-green-500' : 'bg-gray-400'
      }`} />
      
      {/* Level readout */}
      <span class="text-xs text-gray-500 font-mono w-12">
        {props.level.toFixed(3)}
      </span>
    </div>
  );
};

export default Waveform;
