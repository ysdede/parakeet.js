import { Component, createMemo, For, Show, createSignal, onCleanup, createEffect } from 'solid-js';
import { appStore, type TranscriptionMode } from '../stores/appStore';
import type { AudioEngine } from '../lib/audio/types';
import type { MelWorkerClient } from '../lib/audio/MelWorkerClient';
import { LayeredBufferVisualizer } from './LayeredBufferVisualizer';

interface DebugPanelProps {
  audioEngine?: AudioEngine;
  melClient?: MelWorkerClient;
}

const MODES: { id: TranscriptionMode; label: string; short: string }[] = [
  { id: 'v4-utterance', label: 'Utterance (v4)', short: 'v4' },
  { id: 'v3-streaming', label: 'Streaming (v3)', short: 'v3' },
  { id: 'v2-utterance', label: 'Legacy (v2)', short: 'v2' },
];

export const DebugPanel: Component<DebugPanelProps> = (props) => {
  const isRecording = () => appStore.recordingState() === 'recording';
  const isV4 = () => appStore.transcriptionMode() === 'v4-utterance';
  const isV3 = () => appStore.transcriptionMode() === 'v3-streaming';

  const [height, setHeight] = createSignal(260);
  const [isResizing, setIsResizing] = createSignal(false);

  let startY = 0;
  let startHeight = 0;
  let scrollContainer: HTMLDivElement | undefined;

  // Auto-scroll to bottom of finalized sentences
  createEffect(() => {
    appStore.matureText(); // Track dependency
    if (scrollContainer) {
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  });

  const handleMouseDown = (e: MouseEvent) => {
    setIsResizing(true);
    startY = e.clientY;
    startHeight = height();
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing()) return;
    const delta = startY - e.clientY;
    const newHeight = Math.min(Math.max(startHeight + delta, 150), 600);
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

  const rtfColor = createMemo(() => {
    const rtfx = appStore.rtfxAverage();
    if (rtfx === 0) return 'text-slate-400';
    if (rtfx >= 2) return 'text-green-600 font-bold';
    if (rtfx >= 1) return 'text-orange-500 font-bold';
    return 'text-red-500 font-bold';
  });

  // Format interval as readable string
  const formatInterval = (ms: number) => {
    if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
    return `${ms}ms`;
  };

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

      {/* ---- Column 1: System & Performance ---- */}
      <div class="w-56 flex flex-col p-3 gap-2.5 border-r border-slate-200 bg-slate-50/50">
        {/* Header with backend indicator */}
        <div class="flex items-center justify-between pb-2 border-b border-slate-200">
          <span class="font-bold tracking-wider uppercase text-slate-500">System</span>
          <div class="flex items-center gap-2">
            <span class="font-bold text-slate-400 uppercase text-[9px]">{appStore.backend()}</span>
            <div class={`w-2 h-2 rounded-full border border-white shadow-sm transition-all duration-300 ${isRecording() ? 'bg-red-500 animate-pulse' : 'bg-slate-300'}`} />
          </div>
        </div>

        {/* Mode Selector */}
        <div class="space-y-1.5">
          <span class="font-bold text-[9px] text-slate-400 uppercase tracking-wider">Mode</span>
          <div class="flex gap-1">
            <For each={MODES}>
              {(mode) => (
                <button
                  class={`flex-1 px-1 py-1 rounded text-[9px] font-bold uppercase tracking-wide border transition-all ${appStore.transcriptionMode() === mode.id
                    ? 'bg-primary text-white border-primary shadow-sm'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    } ${isRecording() ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  onClick={() => {
                    if (!isRecording()) {
                      appStore.setTranscriptionMode(mode.id);
                    }
                  }}
                  disabled={isRecording()}
                  title={isRecording() ? 'Stop recording to change mode' : mode.label}
                >
                  {mode.short}
                </button>
              )}
            </For>
          </div>
        </div>

        {/* Performance Metrics */}
        <div class="grid grid-cols-2 gap-1.5">
          <div class="bg-white border border-slate-200 rounded p-1.5 flex flex-col items-center justify-center">
            <span class="font-bold text-slate-400 uppercase tracking-tight text-[8px] mb-0.5">RTFx</span>
            <span class={`text-xs ${rtfColor()}`}>
              {appStore.rtfxAverage() > 0 ? Math.round(appStore.rtfxAverage()) : '–'}
            </span>
          </div>
          <div class="bg-white border border-slate-200 rounded p-1.5 flex flex-col items-center justify-center">
            <span class="font-bold text-slate-400 uppercase tracking-tight text-[8px] mb-0.5">Latency</span>
            <span class="text-xs font-bold text-slate-700">{Math.round(appStore.inferenceLatencyAverage())}ms</span>
          </div>
        </div>

        {/* Buffer Fill */}
        <div class="space-y-1">
          <div class="flex justify-between font-bold text-slate-500 uppercase px-0.5 text-[9px]">
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

        {/* v4 Merger Stats */}
        <Show when={isV4()}>
          <div class="space-y-1 pt-1 border-t border-slate-200">
            <span class="font-bold text-[8px] text-slate-400 uppercase tracking-wider">Merger</span>
            <div class="grid grid-cols-3 gap-1">
              <div class="bg-white border border-slate-200 rounded px-1 py-0.5 text-center">
                <div class="text-[7px] font-bold text-slate-400 uppercase">Sent</div>
                <div class="text-[10px] font-bold text-slate-700">{appStore.v4MergerStats().sentencesFinalized}</div>
              </div>
              <div class="bg-white border border-slate-200 rounded px-1 py-0.5 text-center">
                <div class="text-[7px] font-bold text-slate-400 uppercase">Cursor</div>
                <div class="text-[10px] font-bold text-slate-700">{appStore.matureCursorTime().toFixed(1)}s</div>
              </div>
              <div class="bg-white border border-slate-200 rounded px-1 py-0.5 text-center">
                <div class="text-[7px] font-bold text-slate-400 uppercase">Uttr</div>
                <div class="text-[10px] font-bold text-slate-700">{appStore.v4MergerStats().utterancesProcessed}</div>
              </div>
            </div>
          </div>
        </Show>
      </div>

      {/* ---- Column 2: Live Context (mode-dependent) ---- */}
      <div class="flex-1 flex flex-col min-w-0 bg-white">
        <div class="px-3 py-2 border-b border-slate-200 bg-slate-50/30 flex items-center justify-between">
          <span class="font-bold tracking-wider uppercase text-slate-500">
            {isV4() ? 'Transcript State' : isV3() ? 'Stream Sync' : 'Segments'}
          </span>

          {/* v3: LCS indicators */}
          <Show when={isV3()}>
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
          </Show>

          {/* v4: VAD state indicator */}
          <Show when={isV4()}>
            <div class="flex items-center gap-3">
              <div class="flex items-center gap-1.5 px-2 py-0.5 bg-white rounded border border-slate-200">
                <div class={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${appStore.vadState().isSpeech ? 'bg-orange-500 animate-pulse' : 'bg-slate-300'}`} />
                <div class="w-24 overflow-hidden text-ellipsis whitespace-nowrap">
                  <span class="font-bold uppercase text-slate-500 tracking-wide">{appStore.vadState().hybridState}</span>
                </div>
              </div>
              <div class={`flex items-center gap-1.5 px-2 py-0.5 bg-white rounded border border-slate-200 transition-opacity duration-300 ${appStore.vadState().sileroProbability > 0 ? 'opacity-100' : 'opacity-0'}`}>
                <span class="font-bold uppercase text-slate-500 text-[9px]">VAD</span>
                <span class={`font-bold ${appStore.vadState().sileroProbability > 0.5 ? 'text-orange-500' : 'text-slate-400'}`}>
                  {(appStore.vadState().sileroProbability * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </Show>
        </div>

        <div class="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-thin scrollbar-thumb-slate-300 hover:scrollbar-thumb-slate-400">
          {/* v4: Mature + Immature text display */}
          <Show when={isV4()}>
            <div class="space-y-3">
              {/* Mature (finalized) sentences */}
              <div class="space-y-1.5">
                <h4 class="font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 text-[9px]">
                  <span class="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
                  Finalized Sentences
                </h4>
                <div
                  ref={scrollContainer}
                  class="p-2 border border-emerald-100 bg-emerald-50/30 rounded h-32 overflow-y-auto resize-y"
                >
                  <Show when={appStore.matureText()} fallback={
                    <span class="text-slate-400 italic text-[10px] opacity-50">No finalized sentences yet...</span>
                  }>
                    <span class="text-[11px] text-slate-800 leading-relaxed">{appStore.matureText()}</span>
                  </Show>
                </div>
              </div>

              {/* Immature (active) sentence */}
              <div class="space-y-1.5">
                <h4 class="font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 text-[9px]">
                  <span class="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse"></span>
                  Active Sentence
                </h4>
                <div class="p-2 border border-amber-100 bg-amber-50/30 rounded min-h-[36px]">
                  <Show when={appStore.immatureText()} fallback={
                    <span class="text-slate-400 italic text-[10px] opacity-50">Waiting for speech...</span>
                  }>
                    <span class="text-[11px] text-primary italic leading-relaxed">{appStore.immatureText()}</span>
                    <span class="inline-block w-0.5 h-3 bg-primary animate-pulse ml-0.5 align-middle"></span>
                  </Show>
                </div>
              </div>

              {/* Pending sentence info */}
              <Show when={appStore.v4MergerStats().sentencesFinalized > 0}>
                <div class="text-[9px] text-slate-400 flex items-center gap-3 pt-1">
                  <span>{appStore.v4MergerStats().sentencesFinalized} sentences finalized</span>
                  <span class="text-slate-300">|</span>
                  <span>Cursor at {appStore.matureCursorTime().toFixed(2)}s</span>
                  <span class="text-slate-300">|</span>
                  <span>{appStore.v4MergerStats().utterancesProcessed} windows processed</span>
                </div>
              </Show>
            </div>
          </Show>

          {/* v3: Transition cache + anchors */}
          <Show when={isV3()}>
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
          </Show>

          {/* v2: basic info */}
          <Show when={!isV3() && !isV4()}>
            <div class="text-slate-400 italic text-center py-4">
              Legacy per-utterance mode. Segments are transcribed individually.
            </div>
          </Show>

          {/* New Layered Buffer Visualizer */}
          <div class="pt-2 border-t border-slate-200">
            <LayeredBufferVisualizer
              audioEngine={props.audioEngine}
              melClient={props.melClient}
              height={120} // Compact height
              windowDuration={8.0}
            />
          </div>
        </div>
      </div>

      {/* ---- Column 3: Settings & VAD ---- */}
      <div class="w-64 flex flex-col p-3 gap-2.5 border-l border-slate-200 bg-slate-50/50">
        <div class="flex items-center justify-between pb-2 border-b border-slate-200">
          <span class="font-bold tracking-wider uppercase text-slate-500">Signal & Config</span>
          <span class={`font-bold text-white bg-orange-500 px-1.5 py-px rounded text-[9px] transition-opacity duration-100 ${appStore.isSpeechDetected() ? 'opacity-100 animate-pulse' : 'opacity-0'}`}>VAD</span>
        </div>

        <div class="space-y-2.5 flex-1 overflow-y-auto">
          {/* RMS Energy Meter */}
          <div class="space-y-1">
            <div class="flex justify-between font-bold text-slate-500 uppercase text-[9px]">
              <span>RMS Energy</span>
              <span class={appStore.audioLevel() > appStore.energyThreshold() ? 'text-primary' : 'text-slate-400'}>
                {(appStore.audioLevel() * 100).toFixed(1)}%
              </span>
            </div>
            <div class="h-2 w-full bg-slate-200 rounded overflow-hidden relative">
              <div class="absolute top-0 bottom-0 w-px bg-red-400 z-10" style={{ left: `${appStore.energyThreshold() * 100}%` }} title="Energy threshold"></div>
              <div
                class={`h-full transition-all duration-75 ${appStore.isSpeechDetected() ? 'bg-orange-400' : 'bg-primary'}`}
                style={{ width: `${Math.min(100, appStore.audioLevel() * 100)}%` }}
              />
            </div>
          </div>

          {/* v4 VAD probability bar */}
          <Show when={isV4()}>
            <div class={`space-y-1 transition-opacity duration-300 ${appStore.vadState().sileroProbability > 0 ? 'opacity-100' : 'opacity-40'}`}>
              <div class="flex justify-between font-bold text-slate-500 uppercase text-[9px]">
                <span>VAD Prob</span>
                <span class={appStore.vadState().sileroProbability > appStore.sileroThreshold() ? 'text-orange-500 font-bold' : 'text-slate-400'}>
                  {(appStore.vadState().sileroProbability * 100).toFixed(0)}%
                </span>
              </div>
              <div class="h-2 w-full bg-slate-200 rounded overflow-hidden relative">
                <div class="absolute top-0 bottom-0 w-px bg-red-400 z-10" style={{ left: `${appStore.sileroThreshold() * 100}%` }} title="VAD threshold"></div>
                <div
                  class={`h-full transition-all duration-75 ${appStore.vadState().sileroProbability > appStore.sileroThreshold() ? 'bg-orange-400' : 'bg-slate-400'}`}
                  style={{ width: `${Math.min(100, appStore.vadState().sileroProbability * 100)}%` }}
                />
              </div>
            </div>
          </Show>

          {/* SNR indicator */}
          <Show when={isV4()}>
            <div class={`flex justify-between items-center bg-white p-1.5 rounded border border-slate-200 transition-opacity duration-300 ${appStore.vadState().snr !== 0 ? 'opacity-100' : 'opacity-40'}`}>
              <span class="font-bold text-[9px] text-slate-500 uppercase">SNR</span>
              <span class={`font-bold text-[10px] ${appStore.vadState().snr > 3 ? 'text-green-600' : 'text-slate-400'}`}>
                {appStore.vadState().snr.toFixed(1)} dB
              </span>
            </div>
          </Show>

          {/* --- Configurable Settings --- */}
          <div class="pt-1 border-t border-slate-200 space-y-2.5">

            {/* Energy VAD Threshold */}
            <div class="bg-white p-2 rounded border border-slate-200 space-y-1.5">
              <div class="flex justify-between font-bold text-slate-500 text-[9px] uppercase">
                <span>Energy Threshold</span>
                <span class="text-primary">{(appStore.energyThreshold() * 100).toFixed(1)}%</span>
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

            {/* v4: VAD Threshold */}
            <Show when={isV4()}>
              <div class="bg-white p-2 rounded border border-slate-200 space-y-1.5">
                <div class="flex justify-between font-bold text-slate-500 text-[9px] uppercase">
                  <span>VAD Threshold</span>
                  <span class="text-primary">{(appStore.sileroThreshold() * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range" min="0.1" max="0.9" step="0.05"
                  value={appStore.sileroThreshold()}
                  onInput={(e) => appStore.setSileroThreshold(parseFloat(e.currentTarget.value))}
                  class="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>
            </Show>

            {/* v4: Transcription Frequency */}
            <Show when={isV4()}>
              <div class="bg-white p-2 rounded border border-slate-200 space-y-1.5">
                <div class="flex justify-between font-bold text-slate-500 text-[9px] uppercase">
                  <span>Tick Interval</span>
                  <span class="text-primary">{formatInterval(appStore.v4InferenceIntervalMs())}</span>
                </div>
                <input
                  type="range" min="320" max="8000" step="80"
                  value={appStore.v4InferenceIntervalMs()}
                  onInput={(e) => appStore.setV4InferenceIntervalMs(parseInt(e.currentTarget.value))}
                  class="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div class="flex justify-between text-[8px] text-slate-400 font-bold">
                  <span>320ms</span>
                  <span>8.0s</span>
                </div>
              </div>
            </Show>

            {/* v4: Silence Flush Threshold */}
            <Show when={isV4()}>
              <div class="bg-white p-2 rounded border border-slate-200 space-y-1.5">
                <div class="flex justify-between font-bold text-slate-500 text-[9px] uppercase">
                  <span>Silence Flush</span>
                  <span class="text-primary">{appStore.v4SilenceFlushSec().toFixed(1)}s</span>
                </div>
                <input
                  type="range" min="0.3" max="5.0" step="0.1"
                  value={appStore.v4SilenceFlushSec()}
                  onInput={(e) => appStore.setV4SilenceFlushSec(parseFloat(e.currentTarget.value))}
                  class="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>
            </Show>

            {/* v3: Window Duration */}
            <Show when={isV3()}>
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
            </Show>
          </div>

          {/* Bottom stats row */}
          <div class="mt-auto grid grid-cols-2 gap-1.5">
            <Show when={isV3()}>
              <div class="bg-white border border-slate-200 rounded p-1.5 text-center">
                <div class="text-[7px] font-bold text-slate-400 uppercase mb-px">Overlap</div>
                <div class="text-[10px] font-bold text-slate-700">{appStore.streamingOverlap().toFixed(1)}s</div>
              </div>
              <div class="bg-white border border-slate-200 rounded p-1.5 text-center">
                <div class="text-[7px] font-bold text-slate-400 uppercase mb-px">Chunks</div>
                <div class="text-[10px] font-bold text-slate-700">{appStore.mergeInfo().chunkCount}</div>
              </div>
            </Show>
            <Show when={isV4()}>
              <div class="bg-white border border-slate-200 rounded p-1.5 text-center">
                <div class="text-[7px] font-bold text-slate-400 uppercase mb-px">State</div>
                <div class={`text-[10px] font-bold whitespace-nowrap w-24 overflow-hidden text-ellipsis mx-auto ${appStore.vadState().isSpeech ? 'text-orange-500' : 'text-slate-500'}`}>
                  {appStore.vadState().hybridState}
                </div>
              </div>
              <div class="bg-white border border-slate-200 rounded p-1.5 text-center">
                <div class="text-[7px] font-bold text-slate-400 uppercase mb-px">Windows</div>
                <div class="text-[10px] font-bold text-slate-700">{appStore.v4MergerStats().utterancesProcessed}</div>
              </div>
            </Show>
          </div>
        </div>
      </div>
    </div>
  );
};
