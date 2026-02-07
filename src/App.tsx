import { Component, Show, For, Switch, Match, createSignal, onMount, onCleanup, createEffect } from 'solid-js';
import { appStore } from './stores/appStore';
import { CompactWaveform, BufferVisualizer, ModelLoadingOverlay, Sidebar, DebugPanel, StatusBar, TranscriptionDisplay } from './components';
import { AudioEngine } from './lib/audio';
import { MelWorkerClient } from './lib/audio/MelWorkerClient';
import { TranscriptionWorkerClient } from './lib/transcription';
import { HybridVAD, VADRingBuffer } from './lib/vad';
import { WindowBuilder } from './lib/transcription/WindowBuilder';
import type { V4ProcessResult } from './lib/transcription/TranscriptionWorkerClient';

// Singleton instances
let audioEngine: AudioEngine | null = null;
export const [audioEngineSignal, setAudioEngineSignal] = createSignal<AudioEngine | null>(null);

let workerClient: TranscriptionWorkerClient | null = null;
let melClient: MelWorkerClient | null = null;
let segmentUnsubscribe: (() => void) | null = null;
let windowUnsubscribe: (() => void) | null = null;
let melChunkUnsubscribe: (() => void) | null = null;
let energyPollInterval: number | undefined;

// v4 pipeline instances
let hybridVAD: HybridVAD | null = null;
let vadRingBuffer: VADRingBuffer | null = null;
let windowBuilder: WindowBuilder | null = null;
let v4TickTimeout: number | undefined;
let v4TickRunning = false;
let v4AudioChunkUnsubscribe: (() => void) | null = null;
let v4MelChunkUnsubscribe: (() => void) | null = null;
let v4InferenceBusy = false;
let v4LastInferenceTime = 0;

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h > 0 ? h.toString().padStart(2, '0') + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

const Header: Component<{ isRecording: boolean, audioLevel: number }> = (props) => {
  return (
    <header class="bg-white border-b border-slate-200 shrink-0 z-10 transition-all duration-300">
      <div class="px-8 h-20 flex items-center justify-between">
        <div class="flex items-center gap-10">
          <div>
            <h1 class="text-xl font-extrabold text-[#0f172a] tracking-tight">Boncuk AI</h1>
            <div class="flex items-center gap-2 mt-0.5">
              <span class="flex h-2 w-2">
                <span class={`absolute inline-flex h-2 w-2 rounded-full opacity-75 ${props.isRecording ? 'animate-ping bg-red-400' : 'bg-slate-300'}`}></span>
                <span class={`relative inline-flex rounded-full h-2 w-2 ${props.isRecording ? 'bg-red-500' : 'bg-slate-400'}`}></span>
              </span>
              <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {props.isRecording ? 'Live' : 'Standby'}
              </span>
            </div>
          </div>

          <div class="flex items-center gap-8 border-l border-slate-100 pl-10">
            <div class="flex flex-col">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Model</span>
              <span class="text-sm font-bold text-slate-700 capitalize">
                {appStore.selectedModelId().split('-').slice(0, 2).join(' ')}
              </span>
            </div>
            <div class="flex flex-col">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Inference</span>
              <span class="text-sm font-bold text-slate-700">
                {appStore.inferenceLatency().toFixed(0)} ms
              </span>
            </div>
            <div class="flex flex-col">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Duration</span>
              <span class="text-sm font-bold text-slate-700">{formatDuration(appStore.sessionDuration())}</span>
            </div>
          </div>
        </div>

        <div class="flex-1 max-w-md h-12 mx-12 flex items-center justify-center">
          <CompactWaveform audioLevel={props.audioLevel} isRecording={props.isRecording} />
        </div>

        <div class="flex items-center gap-4">
          <div class="text-right mr-2 hidden sm:block">
            <p class="text-xs font-bold text-slate-700">On-Device AI</p>
            <p class="text-[10px] text-slate-500">{appStore.backend().toUpperCase()} Backend</p>
          </div>
          <div class="w-10 h-10 rounded-full bg-neu-bg shadow-neu-flat flex items-center justify-center border border-slate-100">
            <span class="material-symbols-outlined text-primary">shield</span>
          </div>
        </div>
      </div>
    </header>
  );
};

const App: Component = () => {
  const [activeTab, setActiveTab] = createSignal('transcript');
  const [showModelOverlay, setShowModelOverlay] = createSignal(false);

  const isRecording = () => appStore.recordingState() === 'recording';
  const isModelReady = () => appStore.modelState() === 'ready';

  onMount(() => {
    workerClient = new TranscriptionWorkerClient();

    workerClient.onModelProgress = (p) => {
      appStore.setModelProgress(p.progress);
      appStore.setModelMessage(p.message || '');
      if (p.file) appStore.setModelFile(p.file);
    };

    workerClient.onModelStateChange = (s) => {
      appStore.setModelState(s);
    };

    workerClient.onV3Confirmed = (text) => {
      appStore.setTranscript(text);
    };

    workerClient.onV3Pending = (text) => {
      appStore.setPendingText(text);
    };

    workerClient.onError = (msg) => {
      appStore.setErrorMessage(msg);
    };

    appStore.refreshDevices();
  });

  onCleanup(() => {
    if (energyPollInterval) clearInterval(energyPollInterval);
    cleanupV4Pipeline();
    melClient?.dispose();
    workerClient?.dispose();
  });

  // ---- v4 pipeline tick: periodic window building + inference ----
  let v4TickCount = 0;
  const v4Tick = async () => {
    if (!workerClient || !windowBuilder || !audioEngine || v4InferenceBusy) return;

    v4TickCount++;
    const now = performance.now();
    // Use the store's configurable inference interval (minus a small margin for the tick jitter)
    const minInterval = Math.max(200, appStore.v4InferenceIntervalMs() - 100);
    if (now - v4LastInferenceTime < minInterval) return;

    // Check if there is speech in the pending window (skip silent windows)
    const hasSpeech = windowBuilder.hasSpeechInPendingWindow();
    if (v4TickCount <= 5 || v4TickCount % 20 === 0) {
      const vadState = appStore.vadState();
      console.log(`[v4Tick #${v4TickCount}] hasSpeech=${hasSpeech}, vadState=${vadState.hybridState}, energy=${vadState.energy.toFixed(4)}, silero=${(vadState.sileroProbability || 0).toFixed(2)}`);
    }

    if (!hasSpeech) {
      // Check for silence-based flush
      const silenceDuration = windowBuilder.getSilenceTailDuration();
      if (silenceDuration >= appStore.v4SilenceFlushSec()) {
        // Flush pending sentence via timeout finalization
        try {
          const flushResult = await workerClient.v4FinalizeTimeout();
          if (flushResult) {
            appStore.setMatureText(flushResult.matureText);
            appStore.setImmatureText(flushResult.immatureText);
            appStore.setMatureCursorTime(flushResult.matureCursorTime);
            appStore.setTranscript(flushResult.fullText);
            // Advance window builder cursor
            windowBuilder.advanceMatureCursorByTime(flushResult.matureCursorTime);
          }
        } catch (err) {
          console.error('[v4Tick] Flush error:', err);
        }
      }
      return;
    }

    // Build window from cursor to current position
    const window = windowBuilder.buildWindow();
    if (!window) {
      if (v4TickCount <= 10 || v4TickCount % 20 === 0) {
        console.log(`[v4Tick #${v4TickCount}] buildWindow returned null (waiting for min duration)`);
      }
      return;
    }

    console.log(`[v4Tick #${v4TickCount}] Window [${window.startFrame}:${window.endFrame}] ${window.durationSeconds.toFixed(2)}s (initial=${window.isInitial})`);

    v4InferenceBusy = true;
    v4LastInferenceTime = now;

    try {
      const inferenceStart = performance.now();

      // Get mel features for the window
      let features: { features: Float32Array; T: number; melBins: number } | null = null;
      if (melClient) {
        features = await melClient.getFeatures(window.startFrame, window.endFrame);
      }

      if (!features) {
        v4InferenceBusy = false;
        return;
      }

      // Calculate time offset for absolute timestamps
      const timeOffset = window.startFrame / 16000;

      // Calculate incremental cache parameters
      const cursorFrame = windowBuilder.getMatureCursorFrame();
      const prefixSeconds = cursorFrame > 0 ? (window.startFrame - cursorFrame) / 16000 : 0;

      const result: V4ProcessResult = await workerClient.processV4ChunkWithFeatures({
        features: features.features,
        T: features.T,
        melBins: features.melBins,
        timeOffset,
        endTime: window.endFrame / 16000,
        segmentId: `v4_${Date.now()}`,
        incrementalCache: prefixSeconds > 0 ? {
          cacheKey: 'v4-stream',
          prefixSeconds,
        } : undefined,
      });

      const inferenceMs = performance.now() - inferenceStart;

      // Update UI state
      appStore.setMatureText(result.matureText);
      appStore.setImmatureText(result.immatureText);
      appStore.setTranscript(result.fullText);
      appStore.setPendingText(result.immatureText);
      appStore.setInferenceLatency(inferenceMs);

      // Update RTF
      const audioDurationMs = window.durationSeconds * 1000;
      appStore.setRtf(inferenceMs / audioDurationMs);

      // Advance cursor if merger advanced it
      if (result.matureCursorTime > windowBuilder.getMatureCursorTime()) {
        appStore.setMatureCursorTime(result.matureCursorTime);
        windowBuilder.advanceMatureCursorByTime(result.matureCursorTime);
        windowBuilder.markSentenceEnd(Math.round(result.matureCursorTime * 16000));
      }

      // Update stats
      appStore.setV4MergerStats({
        sentencesFinalized: result.matureSentenceCount,
        cursorUpdates: result.stats?.matureCursorUpdates || 0,
        utterancesProcessed: result.stats?.utterancesProcessed || 0,
      });

      // Update buffer metrics
      const ring = audioEngine.getRingBuffer();
      appStore.setBufferMetrics({
        fillRatio: ring.getFillCount() / ring.getSize(),
        latencyMs: (ring.getFillCount() / 16000) * 1000,
      });

      // Update metrics
      if (result.metrics) {
        appStore.setSystemMetrics({
          throughput: 0,
          modelConfidence: 0,
        });
      }
    } catch (err: any) {
      console.error('[v4Tick] Inference error:', err);
    } finally {
      v4InferenceBusy = false;
    }
  };

  // ---- Cleanup v4 pipeline resources ----
  const cleanupV4Pipeline = () => {
    v4TickRunning = false;
    if (v4TickTimeout) {
      clearTimeout(v4TickTimeout);
      v4TickTimeout = undefined;
    }
    if (v4AudioChunkUnsubscribe) {
      v4AudioChunkUnsubscribe();
      v4AudioChunkUnsubscribe = null;
    }
    if (v4MelChunkUnsubscribe) {
      v4MelChunkUnsubscribe();
      v4MelChunkUnsubscribe = null;
    }
    hybridVAD = null;
    vadRingBuffer = null;
    windowBuilder = null;
    v4InferenceBusy = false;
    v4LastInferenceTime = 0;
  };

  const toggleRecording = async () => {
    if (isRecording()) {
      if (energyPollInterval) {
        clearInterval(energyPollInterval);
        energyPollInterval = undefined;
      }
      audioEngine?.stop();

      if (segmentUnsubscribe) segmentUnsubscribe();
      if (windowUnsubscribe) windowUnsubscribe();
      if (melChunkUnsubscribe) melChunkUnsubscribe();
      cleanupV4Pipeline();

      if (workerClient) {
        const final = await workerClient.finalize();
        const text = (final as any).text || (final as any).fullText || '';
        appStore.setTranscript(text);
        appStore.setPendingText('');
      }

      melClient?.reset();
      audioEngine?.reset();
      appStore.setAudioLevel(0);
      appStore.stopRecording();
    } else {
      try {
        if (!audioEngine) {
          audioEngine = new AudioEngine({
            sampleRate: 16000,
            deviceId: appStore.selectedDeviceId(),
          });
          setAudioEngineSignal(audioEngine);
        } else {
          audioEngine.updateConfig({ deviceId: appStore.selectedDeviceId() });
          audioEngine.reset();
        }

        const mode = appStore.transcriptionMode();
        if (isModelReady() && workerClient) {
          if (mode === 'v4-utterance') {
            // ---- v4: Utterance-based pipeline ----

            // Initialize merger in worker
            await workerClient.initV4Service({ debug: false });

            // Initialize mel worker
            if (!melClient) {
              melClient = new MelWorkerClient();
            }
            try {
              await melClient.init({ nMels: 128 });
            } catch (e) {
              melClient.dispose();
              melClient = null;
            }

            // Feed audio chunks to mel worker
            v4MelChunkUnsubscribe = audioEngine.onAudioChunk((chunk) => {
              melClient?.pushAudioCopy(chunk);
            });

            // Initialize hybrid VAD
            hybridVAD = new HybridVAD({
              sileroThreshold: 0.5,
              onsetConfirmations: 2,
              offsetConfirmations: 3,
              sampleRate: 16000,
            });

            // Try to load Silero model (non-blocking; falls back to energy-only)
            hybridVAD.init().catch((err) => {
              console.warn('[v4] Silero VAD init failed, using energy-only:', err);
            });

            // Initialize VAD ring buffer (120s at 16kHz, hop=1280 matching AudioWorklet chunk size)
            vadRingBuffer = new VADRingBuffer(16000, 120, 1280);

            // Initialize window builder
            windowBuilder = new WindowBuilder(
              audioEngine.getRingBuffer(),
              vadRingBuffer,
              {
                sampleRate: 16000,
                minDurationSec: 3.0,
                maxDurationSec: 30.0,
                minInitialDurationSec: 1.5,
                useVadBoundaries: true,
                vadSilenceThreshold: 0.3,
                debug: false,
              }
            );

            // Process each audio chunk through hybrid VAD
            v4AudioChunkUnsubscribe = audioEngine.onAudioChunk(async (chunk) => {
              if (!hybridVAD || !vadRingBuffer) return;

              const vadResult = await hybridVAD.process(chunk);

              // Write VAD probability to ring buffer.
              // hopSize matches AudioWorklet chunk size (1280), so 1 write per chunk.
              const prob = vadResult.sileroProbability !== undefined
                ? vadResult.sileroProbability
                : (vadResult.isSpeech ? 0.9 : 0.1);
              vadRingBuffer.write(prob);

              // Update VAD state for UI
              appStore.setVadState({
                isSpeech: vadResult.isSpeech,
                energy: vadResult.energy,
                snr: vadResult.snr || 0,
                sileroProbability: vadResult.sileroProbability || 0,
                hybridState: vadResult.state,
              });
              appStore.setIsSpeechDetected(vadResult.isSpeech);
            });

            // Start adaptive inference tick loop (reads interval from appStore)
            v4TickRunning = true;
            const scheduleNextTick = () => {
              if (!v4TickRunning) return;
              v4TickTimeout = window.setTimeout(async () => {
                if (!v4TickRunning) return;
                await v4Tick();
                scheduleNextTick();
              }, appStore.v4InferenceIntervalMs());
            };
            scheduleNextTick();

          } else if (mode === 'v3-streaming') {
            // ---- v3: Fixed-window token streaming (existing) ----
            const windowDur = appStore.streamingWindow();
            const triggerInt = appStore.triggerInterval();
            const overlapDur = Math.max(1.0, windowDur - triggerInt);

            await workerClient.initV3Service({
              windowDuration: windowDur,
              overlapDuration: overlapDur,
              sampleRate: 16000,
              frameStride: appStore.frameStride(),
            });

            if (!melClient) {
              melClient = new MelWorkerClient();
            }
            try {
              await melClient.init({ nMels: 128 });
            } catch (e) {
              melClient.dispose();
              melClient = null;
            }

            melChunkUnsubscribe = audioEngine.onAudioChunk((chunk) => {
              melClient?.pushAudioCopy(chunk);
            });

            windowUnsubscribe = audioEngine.onWindowChunk(
              windowDur,
              overlapDur,
              triggerInt,
              async (audio, startTime) => {
                if (!workerClient) return;
                const start = performance.now();

                let result;
                if (melClient) {
                  const startSample = Math.round(startTime * 16000);
                  const endSample = startSample + audio.length;
                  const melFeatures = await melClient.getFeatures(startSample, endSample);

                  if (melFeatures) {
                    result = await workerClient.processV3ChunkWithFeatures(
                      melFeatures.features,
                      melFeatures.T,
                      melFeatures.melBins,
                      startTime,
                      overlapDur,
                    );
                  } else {
                    result = await workerClient.processV3Chunk(audio, startTime);
                  }
                } else {
                  result = await workerClient.processV3Chunk(audio, startTime);
                }

                const duration = performance.now() - start;
                const stride = appStore.triggerInterval();
                appStore.setRtf(duration / (stride * 1000));
                appStore.setInferenceLatency(duration);

                if (audioEngine) {
                  const ring = audioEngine.getRingBuffer();
                  appStore.setBufferMetrics({
                    fillRatio: ring.getFillCount() / ring.getSize(),
                    latencyMs: (ring.getFillCount() / 16000) * 1000,
                  });
                }

                appStore.setMergeInfo({
                  lcsLength: result.lcsLength,
                  anchorValid: result.anchorValid,
                  chunkCount: result.chunkCount,
                  anchorTokens: result.anchorTokens
                });
              }
            );
          } else {
            // ---- v2: Per-utterance (existing) ----
            await workerClient.initService({ sampleRate: 16000 });
            segmentUnsubscribe = audioEngine.onSpeechSegment(async (segment) => {
              if (workerClient) {
                const start = Date.now();
                const samples = audioEngine!.getRingBuffer().read(segment.startFrame, segment.endFrame);
                const result = await workerClient.transcribeSegment(samples);
                if (result.text) appStore.appendTranscript(result.text + ' ');
                appStore.setInferenceLatency(Date.now() - start);
              }
            });
          }
        }

        await audioEngine.start();
        appStore.startRecording();

        energyPollInterval = window.setInterval(() => {
          if (audioEngine) {
            appStore.setAudioLevel(audioEngine.getCurrentEnergy());
            // Only set speech detected here for non-v4 modes (v4 handles it in VAD callback)
            if (appStore.transcriptionMode() !== 'v4-utterance') {
              appStore.setIsSpeechDetected(audioEngine.isSpeechActive());
            }
          }
        }, 100);
      } catch (err: any) {
        appStore.setErrorMessage(err.message);
      }
    }
  };

  const loadSelectedModel = async () => {
    if (!workerClient) return;
    setShowModelOverlay(true);
    try {
      await workerClient.initModel(appStore.selectedModelId());
      setTimeout(() => setShowModelOverlay(false), 1500);
    } catch (e) { }
  };

  const openModelSelection = () => {
    if (!workerClient) return;
    if (appStore.modelState() !== 'loading' && appStore.modelState() !== 'ready') {
      appStore.setModelState('unloaded');
    }
    setShowModelOverlay(true);
  };

  const handleLocalLoad = async (files: FileList) => {
    if (!workerClient) return;
    setShowModelOverlay(true);
    try {
      await workerClient.initLocalModel(files);
      setTimeout(() => setShowModelOverlay(false), 1500);
    } catch (e) {
      console.error('Failed to load local model:', e);
    }
  };

  return (
    <div class="h-screen bg-neu-bg flex overflow-hidden selection:bg-primary/20">
      <ModelLoadingOverlay
        isVisible={showModelOverlay()}
        state={appStore.modelState()}
        progress={appStore.modelProgress()}
        message={appStore.modelMessage()}
        file={appStore.modelFile()}
        backend={appStore.backend()}
        selectedModelId={appStore.selectedModelId()}
        onModelSelect={(id: string) => appStore.setSelectedModelId(id)}
        onStart={() => loadSelectedModel()}
        onLocalLoad={handleLocalLoad}
        onClose={() => setShowModelOverlay(false)}
      />

      <Sidebar
        activeTab={activeTab()}
        onTabChange={setActiveTab}
        isRecording={isRecording()}
        onToggleRecording={toggleRecording}
        isModelReady={isModelReady()}
        onLoadModel={openModelSelection}
        modelState={appStore.modelState()}
        availableDevices={appStore.availableDevices()}
        selectedDeviceId={appStore.selectedDeviceId()}
        onDeviceSelect={(id: string) => {
          appStore.setSelectedDeviceId(id);
          if (audioEngine) {
            audioEngine.updateConfig({ deviceId: id });
          }
        }}
        audioLevel={appStore.audioLevel()}
      />

      <main class="flex-1 flex flex-col min-w-0 bg-workspace-bg overflow-hidden">
        <Header isRecording={isRecording()} audioLevel={appStore.audioLevel()} />

        <div class="flex-1 overflow-y-auto relative">
          <Switch>
            <Match when={activeTab() === 'transcript'}>
              <div class="px-8 py-10 max-w-5xl mx-auto w-full h-full">
                <TranscriptionDisplay
                  confirmedText={appStore.transcriptionMode() === 'v4-utterance' ? appStore.matureText() : appStore.transcript()}
                  pendingText={appStore.transcriptionMode() === 'v4-utterance' ? appStore.immatureText() : appStore.pendingText()}
                  isRecording={isRecording()}
                  lcsLength={appStore.mergeInfo().lcsLength}
                  anchorValid={appStore.mergeInfo().anchorValid}
                  showConfidence={appStore.transcriptionMode() === 'v3-streaming'}
                  class="h-full"
                />
              </div>
            </Match>
            <Match when={activeTab() === 'settings'}>
              <div class="px-12 py-10 max-w-5xl mx-auto w-full">
                <h2 class="text-2xl font-extrabold text-[#0f172a] mb-8">System Settings</h2>
                <div class="nm-flat rounded-3xl p-8 space-y-8">
                  <section>
                    <h3 class="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">Device Configuration</h3>
                    <p class="text-slate-600">Model: <span class="font-bold text-primary">{appStore.selectedModelId()}</span></p>
                    <p class="text-slate-600">Backend: <span class="font-bold text-primary">{appStore.backend().toUpperCase()}</span></p>
                  </section>
                </div>
              </div>
            </Match>
          </Switch>
        </div>

        {/* Floating Metrics Block */}
        <div class="fixed top-24 right-8 flex gap-4 z-30">
          <div class="bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-200 shadow-lg flex items-center gap-4 transition-all hover:shadow-xl hover:bg-white">
            <div class="flex flex-col">
              <span class="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">RTF</span>
              <span class={`text-xs font-bold ${appStore.rtf() > 1 ? 'text-red-500' : 'text-slate-900'}`}>{appStore.rtf().toFixed(2)}</span>
            </div>
            <div class="w-px h-5 bg-slate-200"></div>
            <button
              onClick={() => appStore.copyTranscript()}
              class="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-[10px] font-bold rounded-lg hover:bg-blue-600 transition-all shadow-md active:scale-95 active:shadow-sm"
            >
              <span class="material-symbols-outlined text-[14px]">content_copy</span>
              <span>Copy</span>
            </button>
          </div>
        </div>

        <DebugPanel audioEngine={audioEngineSignal() ?? undefined} />
      </main>
    </div>
  );
};

export default App;

