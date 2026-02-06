/**
 * BoncukJS v3.0 - Main Application Component
 * 
 * Privacy-first, offline-capable real-time transcription.
 * Optimized performance via Transcription Web Worker to prevent UI stuttering.
 */

import { Component, Show, For, Switch, Match, createSignal, onMount, onCleanup, createEffect } from 'solid-js';
import { appStore } from './stores/appStore';
import { CompactWaveform, BufferVisualizer, ModelLoadingOverlay, Sidebar, DebugPanel, StatusBar, TranscriptionDisplay } from './components';
import { AudioEngine } from './lib/audio';
import { MelWorkerClient } from './lib/audio/MelWorkerClient';
import { TranscriptionWorkerClient } from './lib/transcription';

// Singleton instances
let audioEngine: AudioEngine | null = null;
export const [audioEngineSignal, setAudioEngineSignal] = createSignal<AudioEngine | null>(null);

let workerClient: TranscriptionWorkerClient | null = null;
let melClient: MelWorkerClient | null = null;
let segmentUnsubscribe: (() => void) | null = null;
let windowUnsubscribe: (() => void) | null = null;
let melChunkUnsubscribe: (() => void) | null = null;
let energyPollInterval: number | undefined;

const TranscriptPanel: Component = () => {
  const isRecording = () => appStore.recordingState() === 'recording';

  return (
    <section class="flex-1 flex flex-col min-w-0 nm-flat rounded-2xl overflow-hidden relative z-10 transition-all duration-500">
      <Show when={isRecording()}>
        <div class="px-4 pt-4">
          <div class="rounded-xl overflow-hidden nm-inset border-2 border-transparent">
            <BufferVisualizer
              audioEngine={audioEngineSignal() ?? undefined}
              height={100}
              showThreshold={true}
              snrThreshold={6.0}
              showTimeMarkers={true}
              visible={isRecording()}
            />
          </div>
        </div>
      </Show>

      <div class="flex-1 overflow-y-auto px-4 pb-4 pt-2 relative group">
        <div class="absolute top-6 right-8 z-20 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div class="nm-flat rounded-xl px-3 py-1 flex items-center gap-3">
            <div class="flex items-center gap-2 pr-2 border-r border-slate-200 dark:border-slate-700">
              <div class={`w-1.5 h-1.5 rounded-full ${isRecording() ? 'bg-red-500 animate-pulse' : 'bg-slate-300'}`} />
              <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                {formatDuration(appStore.sessionDuration())}
              </span>
            </div>

            <div class="flex gap-2">
              <button onClick={() => appStore.copyTranscript()} class="w-7 h-7 rounded-lg nm-button flex items-center justify-center text-slate-500 hover:text-blue-500 transition-all" title="Copy">
                <span class="material-icons-round text-sm">content_copy</span>
              </button>
              <button onClick={() => appStore.clearTranscript()} class="w-7 h-7 rounded-lg nm-button flex items-center justify-center text-slate-500 hover:text-red-500 transition-all" title="Clear">
                <span class="material-icons-round text-sm">delete_outline</span>
              </button>
            </div>
          </div>
        </div>

        <div class="nm-inset rounded-2xl min-h-full p-4 leading-relaxed relative">
          <TranscriptionDisplay
            confirmedText={appStore.transcript()}
            pendingText={appStore.pendingText()}
            isRecording={isRecording()}
            lcsLength={appStore.mergeInfo().lcsLength}
            anchorValid={appStore.mergeInfo().anchorValid}
            showConfidence={appStore.transcriptionMode() === 'v3-streaming'}
            class="h-full"
          />
        </div>
      </div>
    </section>
  );
};

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

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
    melClient?.dispose();
    workerClient?.dispose();
  });

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

      if (workerClient) {
        const final = await workerClient.finalize();
        // Handle both TranscriptionResult (v2) and TokenStreamResult (v3)
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
          if (mode === 'v3-streaming') {
            // Calculate optimal overlap for the current trigger frequency
            // overlap = window - trigger
            const windowDur = appStore.streamingWindow();
            const triggerInt = appStore.triggerInterval();
            const overlapDur = Math.max(1.0, windowDur - triggerInt);

            await workerClient.initV3Service({
              windowDuration: windowDur,
              overlapDuration: overlapDur,
              sampleRate: 16000,
              frameStride: appStore.frameStride(),
            });

            // Initialize mel worker for continuous mel production
            if (!melClient) {
              melClient = new MelWorkerClient();
            }
            try {
              await melClient.init({ nMels: 128 });
              console.log('[App] Mel worker initialized successfully');
            } catch (e) {
              console.error('[App] Mel worker init failed, will use fallback path:', e);
              melClient.dispose();
              melClient = null;
            }

            // Subscribe to resampled audio chunks → feed mel worker continuously
            melChunkUnsubscribe = audioEngine.onAudioChunk((chunk) => {
              // pushAudioCopy: mel worker gets a copy since chunk is shared with ring buffer
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
                  // Request pre-computed mel features from mel worker
                  const startSample = Math.round(startTime * 16000);
                  const endSample = startSample + audio.length;

                  const melStart = performance.now();
                  const melFeatures = await melClient.getFeatures(startSample, endSample);
                  const melFetchMs = performance.now() - melStart;

                  if (melFeatures) {
                    // Use pre-computed features → skip preprocessor in inference worker
                    console.log(`[App] Preprocessor: mel-worker, ${melFeatures.T} frames × ${melFeatures.melBins} bins, fetch ${melFetchMs.toFixed(1)} ms (samples ${startSample}..${endSample})`);
                    const inferStart = performance.now();
                    result = await workerClient.processV3ChunkWithFeatures(
                      melFeatures.features,
                      melFeatures.T,
                      melFeatures.melBins,
                      startTime,
                      overlapDur,
                    );
                    console.log(`[App] Inference (encoder+decoder only): ${(performance.now() - inferStart).toFixed(1)} ms`);
                  } else {
                    // Mel worker returned null — fall back
                    console.warn('[App] Preprocessor: FALLBACK (mel worker returned null)');
                    result = await workerClient.processV3Chunk(audio, startTime);
                  }
                } else {
                  // No mel worker — use internal preprocessor
                  console.log('[App] Preprocessor: internal (no mel worker)');
                  result = await workerClient.processV3Chunk(audio, startTime);
                }

                const duration = performance.now() - start;

                const stride = appStore.triggerInterval();
                appStore.setRtf(duration / (stride * 1000));
                appStore.setInferenceLatency(duration);

                // Update buffer metrics
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
            appStore.setIsSpeechDetected(audioEngine.isSpeechActive());
          }
        }, 100);
      } catch (err: any) {
        appStore.setErrorMessage(err.message);
      }
    }
  };

  createEffect(() => {
    const isRecording = appStore.recordingState() === 'recording';
    const isV3 = appStore.transcriptionMode() === 'v3-streaming';

    if (isRecording && isV3 && workerClient && audioEngine) {
      // Handle dynamic config updates if needed
      // For now, keep it simple as toggleRecording handles initial state
    }
  });

  // Renamed to clarify intent: this actually triggers the load
  const loadSelectedModel = async () => {
    if (!workerClient) return;
    // Don't show overlay here, it should already be open.
    // But setting it to true doesn't hurt as a safeguard.
    setShowModelOverlay(true);
    try {
      await workerClient.initModel(appStore.selectedModelId());
      setTimeout(() => setShowModelOverlay(false), 1500);
    } catch (e) { }
  };

  // New handler: just opens the modal in selection mode
  const openModelSelection = () => {
    if (!workerClient) return;
    // Ensure state is clean for selection
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
    <div class="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-500/30">
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

      <div class="flex h-screen overflow-hidden p-4 gap-4">
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

        <main class="flex-1 flex flex-col gap-4 min-w-0 h-full overflow-hidden">
          <Switch>
            <Match when={activeTab() === 'transcript'}>
              <TranscriptPanel />
            </Match>
            <Match when={activeTab() === 'settings'}>
              <div class="flex-1 nm-flat rounded-2xl p-6 overflow-y-auto">
                <h2 class="text-xl font-bold mb-6 flex items-center gap-2">
                  <span class="material-icons-round text-blue-500">settings</span>
                  Settings
                </h2>
                <div class="space-y-8">
                  <section>
                    <h3 class="text-sm font-black uppercase tracking-widest text-slate-400 mb-4">Transcription Engine</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Simplified Settings View for now */}
                      <p class="text-slate-500 italic">Settings migrated to Worker thread.</p>
                    </div>
                  </section>
                </div>
              </div>
            </Match>
          </Switch>

          <DebugPanel audioEngine={audioEngineSignal() ?? undefined} />

          <StatusBar
            isRecording={isRecording()}
            onToggleRecording={toggleRecording}
            rtf={appStore.rtf()}
            latency={appStore.inferenceLatency()}
          />
        </main>
      </div>
    </div>
  );
};

export default App;
