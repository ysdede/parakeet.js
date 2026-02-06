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
                  confirmedText={appStore.transcript()}
                  pendingText={appStore.pendingText()}
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
        <div class="fixed bottom-8 right-12 flex gap-4 z-30">
          <div class="bg-white/80 backdrop-blur-md px-5 py-3 rounded-2xl border border-slate-200 shadow-xl flex items-center gap-6">
            <div class="flex flex-col">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">RTF</span>
              <span class={`text-sm font-bold ${appStore.rtf() > 1 ? 'text-red-500' : 'text-slate-900'}`}>{appStore.rtf().toFixed(2)}</span>
            </div>
            <div class="w-px h-6 bg-slate-200"></div>
            <button
              onClick={() => appStore.copyTranscript()}
              class="flex items-center gap-2 px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg active:scale-95"
            >
              <span class="material-symbols-outlined text-sm">content_copy</span>
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

