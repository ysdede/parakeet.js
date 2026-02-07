import { Component, createMemo, For, Show, createSignal, onCleanup } from 'solid-js';
import { appStore } from '../stores/appStore';
import type { AudioEngine } from '../lib/audio/types';

interface DebugPanelProps {
  audioEngine?: AudioEngine;
}

export const DebugPanel: Component<DebugPanelProps> = (props) => {
  const isRecording = () => appStore.recordingState() === 'recording';
  const [height, setHeight] = createSignal(250); // Default height
  const [isResizing, setIsResizing] = createSignal(false);

  let startY = 0;
  let startHeight = 0;

  const handleMouseDown = (e: MouseEvent) => {
    setIsResizing(true);
    startY = e.clientY;
    startHeight = height();
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing()) return;
    const delta = startY - e.clientY; // Dragging up increases height
    const newHeight = Math.min(Math.max(startHeight + delta, 150), 600); // Min 150px, Max 600px
    setHeight(newHeight);
  };

  const handleMouseUp = () => {
    setIsResizing(false);
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  };

  onCleanup(() => {
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  });

  // Color code for RTF
  const rtfColor = createMemo(() => {
    const val = appStore.rtf();
    if (val === 0) return 'text-slate-400';
    if (val < 0.5) return 'text-green-600 font-bold';
    if (val < 0.9) return 'text-orange-500 font-bold';
    return 'text-red-500 font-bold';
  });

  return (
    <div
      class="bg-white border-t border-slate-200 text-[10px] font-mono text-slate-600 flex overflow-hidden shrink-0 transition-colors duration-300 selection:bg-primary/10 selection:text-primary z-20 relative"
      style={{ height: `${height()}px` }}
    >
      {/* Resize Handle */}
      <div
        class="absolute top-0 left-0 w-full h-1 cursor-ns-resize z-50 hover:bg-primary/50 transition-colors bg-transparent"
        onMouseDown={handleMouseDown}
      />

      {/* 1. System & Performance Column */}
      <div class="w-56 flex flex-col p-3 gap-3 border-r border-slate-200 bg-slate-50/50">
        <div class="flex items-center justify-between pb-2 border-b border-slate-200">
          <span class="font-bold tracking-wider uppercase text-slate-500">System</span>
          <div class="flex items-center gap-2">
            <span class="font-bold text-slate-400 uppercase">{appStore.backend()}</span>
            <div class={`w-2 h-2 rounded-full border border-white shadow-sm transition-all duration-300 ${isRecording() ? 'bg-red-500 animate-pulse' : 'bg-slate-300'}`} />
          </div>
        </div>

        <div class="space-y-2 flex-1 overflow-y-auto">
          <div class="flex justify-between items-center bg-white p-1.5 rounded border border-slate-200">
            <span class="font-bold text-slate-500 uppercase">Mode</span>
            <span class="text-primary font-bold bg-blue-50 px-1.5 py-0.5 rounded text-[9px]">{appStore.transcriptionMode()}</span>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div class="bg-white border border-slate-200 rounded p-1.5 flex flex-col items-center justify-center">
              <span class="font-bold text-slate-400 uppercase tracking-tight mb-0.5">RTF</span>
              <span class={`text-xs ${rtfColor()}`}>{appStore.rtf().toFixed(3)}x</span>
            </div>

            <div class="bg-white border border-slate-200 rounded p-1.5 flex flex-col items-center justify-center">
              <span class="font-bold text-slate-400 uppercase tracking-tight mb-0.5">Late</span>
              <span class="text-xs font-bold text-slate-700">{appStore.inferenceLatency().toFixed(0)}ms</span>
            </div>
          </div>

          <div class="space-y-1">
            <div class="flex justify-between font-bold text-slate-500 uppercase px-0.5">
              <span>Buffer</span>
              <span>{(appStore.bufferMetrics().fillRatio * 100).toFixed(0)}%</span>
            </div>
            <div class="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
              <div
                class="h-full bg-primary transition-all duration-300 ease-out rounded-full"
                style={{ width: `${(appStore.bufferMetrics().fillRatio * 100).toFixed(0)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Streaming Buffer & LCS Context */}
      <div class="flex-1 flex flex-col min-w-0 bg-white">
        <div class="px-3 py-2 border-b border-slate-200 bg-slate-50/30 flex items-center justify-between">
          <span class="font-bold tracking-wider uppercase text-slate-500">Stream Sync</span>
          <div class="flex items-center gap-3">
            <div class="flex items-center gap-1.5 px-2 py-0.5 bg-white rounded border border-slate-200">
              <div class={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${appStore.mergeInfo().anchorValid ? 'bg-emerald-500' : 'bg-amber-400'}`} />
              <span class="font-bold uppercase text-slate-500 tracking-wide">Lock</span>
            </div>
            <div class="flex items-center gap-1.5 px-2 py-0.5 bg-white rounded border border-slate-200">
              <span class="material-symbols-outlined text-[14px] text-slate-400">join_inner</span>
              <span class="font-bold uppercase text-slate-600">Match: <span class="text-primary">{appStore.mergeInfo().lcsLength}</span></span>
            </div>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-thin scrollbar-thumb-slate-300 hover:scrollbar-thumb-slate-400">
          {/* Transition Cache Visualization */}
          <div class="space-y-2">
            <h4 class="font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 text-[9px]">
              <span class="w-1 h-1 bg-slate-300 rounded-full"></span>
              Transition Cache
            </h4>
            <div class="p-2 border border-slate-200 bg-slate-50 rounded min-h-[48px] flex flex-wrap gap-1.5 content-start">
              <For each={appStore.debugTokens().slice(-24)}>
                {(token) => (
                  <div
                    class="px-1.5 py-0.5 rounded text-[10px] font-medium border transition-colors"
                    style={{
                      "background-color": token.confidence > 0.8 ? '#fff' : 'rgba(255,255,255,0.5)',
                      "border-color": `rgba(19, 91, 236, ${Math.max(0.2, token.confidence * 0.4)})`,
                      "color": token.confidence > 0.8 ? '#0f172a' : '#64748b',
                      "opacity": Math.max(0.5, token.confidence)
                    }}
                    title={`Confidence: ${(token.confidence * 100).toFixed(0)}%`}
                  >
                    {token.text}
                  </div>
                )}
              </For>
              <Show when={appStore.pendingText()}>
                <span class="px-1.5 py-0.5 text-primary/70 font-medium italic border border-dashed border-primary/30 rounded bg-blue-50/50">
                  {appStore.pendingText()}...
                </span>
              </Show>
              <Show when={!appStore.debugTokens().length && !appStore.pendingText()}>
                <span class="text-slate-400 italic text-[10px] w-full text-center py-2 op-50">Waiting for speech input...</span>
              </Show>
            </div>
          </div>

          {/* Anchor Tokens */}
          <div class="space-y-2">
            <h4 class="font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 text-[9px]">
              <span class="w-1 h-1 bg-emerald-400 rounded-full"></span>
              Stable Anchors
            </h4>
            <div class="flex flex-wrap gap-1">
              <For each={appStore.mergeInfo().anchorTokens || []}>
                {(token) => (
                  <span class="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded font-medium">
                    {token}
                  </span>
                )}
              </For>
              <Show when={!appStore.mergeInfo().anchorTokens?.length}>
                <span class="text-slate-400 text-[10px] italic px-1 opacity-50">No stable anchors locked yet.</span>
              </Show>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Controls & VAD Dashboard */}
      <div class="w-60 flex flex-col p-3 gap-3 border-l border-slate-200 bg-slate-50/50">
        <div class="flex items-center justify-between pb-2 border-b border-slate-200">
          <span class="font-bold tracking-wider uppercase text-slate-500">Signal</span>
          <Show when={appStore.isSpeechDetected()}>
            <span class="font-bold text-white bg-orange-500 px-1.5 py-px rounded text-[9px]">VAD</span>
          </Show>
        </div>

        <div class="space-y-3 flex-1 overflow-y-auto">
          {/* Energy Meter */}
          <div class="space-y-1">
            <div class="flex justify-between font-bold text-slate-500 uppercase text-[9px]">
              <span>RMS</span>
              <span class={appStore.audioLevel() > appStore.energyThreshold() ? 'text-primary' : 'text-slate-400'}>
                {(appStore.audioLevel() * 100).toFixed(1)}%
              </span>
            </div>
            <div class="h-2 w-full bg-slate-200 rounded overflow-hidden relative">
              <div class="absolute top-0 bottom-0 w-px bg-slate-400 z-10" style={{ left: `${appStore.energyThreshold() * 100}%` }}></div>
              <div
                class={`h-full transition-all duration-75 ${appStore.isSpeechDetected() ? 'bg-orange-400' : 'bg-primary'}`}
                style={{ width: `${Math.min(100, appStore.audioLevel() * 100)}%` }}
              />
            </div>
          </div>

          {/* Config Grid */}
          <div class="grid grid-cols-1 gap-3">
            <div class="bg-white p-2 rounded border border-slate-200 space-y-1.5">
              <div class="flex justify-between font-bold text-slate-500 text-[9px] uppercase">
                <span>VAD Gate</span>
                <span class="text-primary">{(appStore.energyThreshold() * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range" min="0.005" max="0.3" step="0.005"
                value={appStore.energyThreshold()}
                onInput={(e) => {
                  const val = parseFloat(e.currentTarget.value);
                  appStore.setEnergyThreshold(val);
                  props.audioEngine?.updateConfig({ energyThreshold: val });
                }}
                class="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>

            <div class="bg-white p-2 rounded border border-slate-200 space-y-1.5">
              <div class="flex justify-between font-bold text-slate-500 text-[9px] uppercase">
                <span>Window</span>
                <span class="text-primary">{appStore.streamingWindow().toFixed(1)}s</span>
              </div>
              <input
                type="range" min="2.0" max="15.0" step="0.5"
                value={appStore.streamingWindow()}
                onInput={(e) => appStore.setStreamingWindow(parseFloat(e.currentTarget.value))}
                class="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>
          </div>

          <div class="mt-auto grid grid-cols-2 gap-2">
            <div class="bg-white border border-slate-200 rounded p-1.5 text-center">
              <div class="text-[8px] font-bold text-slate-400 uppercase mb-px">Overlap</div>
              <div class="text-[10px] font-bold text-slate-700">{appStore.streamingOverlap().toFixed(1)}s</div>
            </div>
            <div class="bg-white border border-slate-200 rounded p-1.5 text-center">
              <div class="text-[8px] font-bold text-slate-400 uppercase mb-px">Seg</div>
              <div class="text-[10px] font-bold text-slate-700">{appStore.mergeInfo().chunkCount}</div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
