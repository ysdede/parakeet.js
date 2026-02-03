/**
 * BoncukJS v3.0 - Main Application Component
 * 
 * Privacy-first, offline-capable real-time transcription.
 * Supports two modes:
 * - v2: Per-utterance VAD-based transcription
 * - v3: Overlapping window streaming with LCS+PTFA merge
 */

import { Component, Show, For, Switch, Match, createSignal, onMount, onCleanup } from 'solid-js';
import { appStore } from './stores/appStore';
import { CompactWaveform, ModelLoadingOverlay, Sidebar, DebugPanel, StatusBar, PrivacyBadge } from './components';
import { AudioEngine } from './lib/audio';
import { ModelManager, TranscriptionService, TokenStreamTranscriber } from './lib/transcription';

// Singleton instances
let audioEngine: AudioEngine | null = null;
// Reactive signal for UI components to access the engine
export const [audioEngineSignal, setAudioEngineSignal] = createSignal<AudioEngine | null>(null);

let modelManager: ModelManager | null = null;

// v2: Per-utterance transcription
let transcriptionService: TranscriptionService | null = null;
let segmentUnsubscribe: (() => void) | null = null;

// v3: Token stream transcription with LCS merge
let tokenStreamTranscriber: TokenStreamTranscriber | null = null;
let windowUnsubscribe: (() => void) | null = null;

let energyPollInterval: number | undefined;

const Header: Component<{ onTabChange: (tab: string) => void }> = (props) => {
  const isRecording = () => appStore.recordingState() === 'recording';
  const isModelReady = () => appStore.modelState() === 'ready';

  const toggleRecording = async () => {
    if (isRecording()) {
      // === STOP RECORDING ===
      if (energyPollInterval) {
        clearInterval(energyPollInterval);
        energyPollInterval = undefined;
      }
      audioEngine?.stop();

      // Cleanup subscriptions
      if (segmentUnsubscribe) {
        segmentUnsubscribe();
        segmentUnsubscribe = null;
      }
      if (windowUnsubscribe) {
        windowUnsubscribe();
        windowUnsubscribe = null;
      }

      // Finalize based on mode
      if (appStore.transcriptionMode() === 'v3-streaming' && tokenStreamTranscriber) {
        const final = tokenStreamTranscriber.finalize();
        appStore.setTranscript(final.confirmedText);
        appStore.setPendingText('');
        console.log('[App] v3 finalized:', final.chunkCount, 'chunks processed');
      } else if (transcriptionService) {
        const final = transcriptionService.finalize();
        if (final.text) {
          appStore.appendTranscript(final.text + ' ');
        }
      }

      appStore.setAudioLevel(0);
      appStore.stopRecording();
    } else {
      // === START RECORDING ===
      try {
        // Initialize audio engine if needed
        if (!audioEngine) {
          audioEngine = new AudioEngine({
            sampleRate: 16000,
            bufferDuration: 60, // Increased for v3 windowing
            energyThreshold: 0.01,
            minSpeechDuration: 80,
            minSilenceDuration: 400,
            maxSegmentDuration: 30.0,
            deviceId: appStore.selectedDeviceId(),
          });
          setAudioEngineSignal(audioEngine);
        } else {
          audioEngine.updateConfig({ deviceId: appStore.selectedDeviceId() });
        }

        const mode = appStore.transcriptionMode();
        console.log(`[App] Starting in ${mode} mode`);

        if (isModelReady() && modelManager) {
          if (mode === 'v3-streaming') {
            // === v3: Token Stream with LCS+PTFA merge ===
            if (!tokenStreamTranscriber) {
              tokenStreamTranscriber = new TokenStreamTranscriber(modelManager, {
                windowDuration: 5.0,
                overlapDuration: 1.5,
                sampleRate: 16000,
                debug: true,
              }, {
                onConfirmedUpdate: (text) => {
                  appStore.setTranscript(text);
                },
                onPendingUpdate: (text) => {
                  appStore.setPendingText(text);
                },
                onMergeInfo: (info) => {
                  appStore.setMergeInfo({
                    lcsLength: info.lcsLength,
                    anchorValid: info.anchorValid,
                    chunkCount: tokenStreamTranscriber?.getState()?.chunkCount ?? 0,
                  });
                },
                onError: (err) => {
                  console.error('[v3] Error:', err);
                  appStore.setErrorMessage(err.message);
                },
              });
              await tokenStreamTranscriber.initialize();
              console.log('[App] v3 TokenStreamTranscriber initialized');
            } else {
              tokenStreamTranscriber.reset();
            }

            // Connect to fixed-window audio stream
            windowUnsubscribe = tokenStreamTranscriber.connectToAudioEngine(audioEngine);

          } else {
            // === v2: Per-utterance VAD-based transcription ===
            if (!transcriptionService) {
              transcriptionService = new TranscriptionService(modelManager, {
                sampleRate: 16000,
                returnTimestamps: true,
                returnConfidences: true,
                debug: true,
              }, {});
              transcriptionService.initialize();
              console.log('[App] v2 per-utterance mode initialized');
            }

            // Subscribe to VAD segments
            if (segmentUnsubscribe) segmentUnsubscribe();
            segmentUnsubscribe = audioEngine.onSpeechSegment(async (segment) => {
              if (transcriptionService && isModelReady()) {
                const startTime = Date.now();
                try {
                  const samples = audioEngine!.getRingBuffer().read(segment.startFrame, segment.endFrame);
                  const result = await transcriptionService.transcribeSegment(samples);

                  if (result.text) {
                    appStore.appendTranscript(result.text + ' ');

                    if (result.words && result.words.length > 0) {
                      const lastWords = result.words.slice(-5).map((w, i) => ({
                        id: `TOK_${Date.now()}_${i}`,
                        text: w.text,
                        confidence: w.confidence ?? 0
                      }));
                      appStore.setDebugTokens(prev => [...prev.slice(-15), ...lastWords]);

                      const avgConf = result.words.reduce((acc, w) => acc + (w.confidence || 0), 0) / result.words.length;
                      appStore.setSystemMetrics({
                        throughput: result.words.length / (segment.duration || 0.1),
                        modelConfidence: avgConf,
                      });
                    }
                  }

                  appStore.setInferenceLatency(Date.now() - startTime);
                } catch (e) {
                  console.error('[v2] Transcription error:', e);
                }
              }
            });
          }
        }

        await audioEngine.start();
        appStore.startRecording();

        // Poll energy for visualization
        energyPollInterval = window.setInterval(() => {
          if (audioEngine) {
            const energy = audioEngine.getCurrentEnergy();
            appStore.setAudioLevel(energy);
            appStore.setIsSpeechDetected(energy > 0.01);
          }
        }, 50);

      } catch (err: any) {
        console.error('Failed to start recording:', err);
        appStore.setErrorMessage(err.message || 'Microphone access denied. Please check site permissions.');
      }
    }
  };

  return (
    <header class="flex-none p-4 pb-0">
      <div class="bg-white dark:bg-card-dark rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-3 flex items-center justify-between gap-4">
        <div class="relative flex items-center gap-3 bg-gray-100 dark:bg-gray-900/50 rounded-xl px-4 py-2 border border-transparent hover:border-gray-300 dark:hover:border-gray-600 transition-colors w-64 overflow-hidden">
          <span class="material-icons-round text-gray-500 dark:text-gray-400">mic</span>
          <select
            class="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
            value={appStore.selectedDeviceId()}
            onChange={(e) => {
              const id = e.currentTarget.value;
              appStore.setSelectedDeviceId(id);
              audioEngine?.setDevice(id);
            }}
          >
            <For each={appStore.availableDevices()}>
              {(device) => (
                <option value={device.deviceId}>{device.label || `Mic ${device.deviceId.slice(0, 5)}...`}</option>
              )}
            </For>
          </select>
          <span class="text-sm font-medium flex-1 truncate">
            {appStore.availableDevices().find(d => d.deviceId === appStore.selectedDeviceId())?.label || 'Select Microphone'}
          </span>
          <span class="material-icons-round text-gray-500 text-sm">expand_more</span>
        </div>

        <div class="flex items-center gap-3">
          <button
            onClick={toggleRecording}
            disabled={appStore.modelState() === 'loading'}
            class={`w-12 h-12 rounded-full flex-none flex items-center justify-center shadow-lg transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group ${isRecording()
              ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20'
              : 'bg-blue-500 hover:bg-blue-600 shadow-blue-500/20'
              }`}
          >
            <Show
              when={isRecording()}
              fallback={<div class="w-4 h-4 bg-white rounded-full group-hover:scale-110 transition-transform"></div>}
            >
              <div class="w-4 h-4 bg-white rounded-sm group-hover:scale-110 transition-transform"></div>
            </Show>
          </button>

          <Show when={isRecording()}>
            <button
              onClick={toggleRecording}
              class="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center transition-colors"
            >
              <span class="material-icons-round text-xl">stop</span>
            </button>
          </Show>

          <button
            onClick={() => props.onTabChange('ai')}
            class="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center transition-colors"
          >
            <span class="material-icons-round text-xl">settings</span>
          </button>
        </div>

        <div class="flex-1 h-10">
          <CompactWaveform
            audioLevel={appStore.audioLevel()}
            isRecording={isRecording()}
          />
        </div>
      </div>
    </header>
  );
};

const TranscriptPanel: Component = () => {
  return (
    <section class="flex-1 flex flex-col min-w-0 bg-white dark:bg-card-dark rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700/50 overflow-hidden relative z-10">
      {/* Header */}
      <div class="px-8 py-6 border-b border-gray-100 dark:border-gray-700/50 flex justify-between items-end">
        <div>
          <h1 class="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
            Live Transcript
          </h1>
          <p class="text-gray-400 dark:text-gray-500 text-sm mt-1">
            Session: {formatDuration(appStore.sessionDuration())}
          </p>
        </div>
        <div class="flex gap-2">
          <button
            onClick={() => appStore.copyTranscript()}
            class="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-400 dark:text-gray-500 hover:text-primary dark:hover:text-primary transition-all"
          >
            <span class="material-icons-round text-xl">content_copy</span>
            <span class="text-[10px] font-medium">Copy</span>
          </button>
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: 'BoncukJS Transcript',
                  text: appStore.transcript(),
                });
              } else {
                appStore.copyTranscript();
                alert('Transcript copied to clipboard!');
              }
            }}
            class="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-400 dark:text-gray-500 hover:text-primary dark:hover:text-primary transition-all"
          >
            <span class="material-icons-round text-xl">ios_share</span>
            <span class="text-[10px] font-medium">Share</span>
          </button>
          <button
            onClick={() => appStore.clearTranscript()}
            class="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-400 dark:text-gray-500 hover:text-red-400 dark:hover:text-red-400 transition-all"
          >
            <span class="material-icons-round text-xl">delete_outline</span>
            <span class="text-[10px] font-medium">Clear</span>
          </button>
        </div>
      </div>

      {/* Transcript content */}
      <div class="flex-1 overflow-y-auto p-8 prose prose-lg dark:prose-invert max-w-none leading-relaxed">
        <Show
          when={appStore.transcript() || appStore.pendingText()}
          fallback={
            <p class="text-xl text-gray-400 dark:text-gray-500">
              Click the microphone to start recording...
            </p>
          }
        >
          <p class="text-xl text-gray-600 dark:text-gray-300">
            {appStore.transcript()}
            <Show when={appStore.pendingText()}>
              <span class="opacity-60"> {appStore.pendingText()}</span>
            </Show>
          </p>
          <Show when={appStore.recordingState() === 'recording'}>
            <p class="text-xl text-gray-600 dark:text-gray-300 mt-6 opacity-60">
              <span class="animate-pulse">Listening...</span>
            </p>
          </Show>
        </Show>
      </div>
    </section>
  );
};

// Helper function
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Main App
const App: Component = () => {
  const [activeTab, setActiveTab] = createSignal('transcript');
  const [isDebugVisible, setIsDebugVisible] = createSignal(false);

  // Retry function for model loading
  const retryModelLoad = async () => {
    if (modelManager) {
      try {
        await modelManager.loadModel();
        appStore.setBackend(modelManager.getBackend());
        appStore.setIsOfflineReady(modelManager.isOfflineReady());
      } catch (e) {
        console.error('Failed to load model:', e);
      }
    }
  };

  // Function to load the selected model
  const loadSelectedModel = async () => {
    if (!modelManager) return;

    try {
      await modelManager.loadModel({ modelId: appStore.selectedModelId() });
      appStore.setBackend(modelManager.getBackend());
      appStore.setIsOfflineReady(modelManager.isOfflineReady());
    } catch (e) {
      console.error('Failed to load model:', e);
    }
  };

  // Function to load model from local files
  const handleLocalLoad = async (files: FileList) => {
    if (!modelManager) return;

    try {
      await modelManager.loadLocalModel(files);
      appStore.setBackend(modelManager.getBackend());
      appStore.setIsOfflineReady(modelManager.isOfflineReady());
    } catch (e) {
      console.error('Failed to side-load local model:', e);
    }
  };

  // Initialize model manager on mount (but don't load yet)
  onMount(() => {
    modelManager = new ModelManager({
      onProgress: (progress) => {
        appStore.setModelProgress(progress.progress);
        appStore.setModelMessage(progress.message || '');
        appStore.setModelFile(progress.file || '');
      },
      onStateChange: (state) => {
        appStore.setModelState(state);
      },
      onError: (error) => {
        console.error('Model error:', error);
        appStore.setModelMessage(error.message);
      },
    });

    // Refresh devices on mount
    appStore.refreshDevices();
  });


  // Cleanup on unmount
  onCleanup(() => {
    if (energyPollInterval) clearInterval(energyPollInterval);
    audioEngine?.dispose();
    modelManager?.dispose();
  });

  return (
    <div class="h-screen w-full overflow-hidden flex flex-col bg-background-light dark:bg-background-dark text-gray-800 dark:text-gray-100 font-sans selection:bg-primary selection:text-white transition-colors duration-300">
      {/* Model Selection & Loading Overlay */}
      <ModelLoadingOverlay
        isVisible={appStore.modelState() !== 'ready'}
        state={appStore.modelState()}
        progress={appStore.modelProgress()}
        message={appStore.modelMessage()}
        file={appStore.modelFile()}
        backend={appStore.backend()}
        selectedModelId={appStore.selectedModelId()}
        onModelSelect={appStore.setSelectedModelId}
        onStart={loadSelectedModel}
        onLocalLoad={handleLocalLoad}
      />

      {/* Error Toast */}
      <Show when={appStore.errorMessage()}>
        {(msg) => (
          <div
            class="fixed bottom-12 left-1/2 -translate-x-1/2 z-[100] bg-red-500 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 cursor-pointer animate-bounce"
            onClick={() => appStore.setErrorMessage(null)}
          >
            <span class="material-icons-round">error_outline</span>
            <span class="font-bold">{msg()}</span>
            <span class="text-white/60 text-xs ml-2">Click to dismiss</span>
          </div>
        )}
      </Show>


      <Header onTabChange={setActiveTab} />

      <main class="flex-1 flex overflow-hidden p-4 gap-4 relative">
        <Switch>
          <Match when={activeTab() === 'transcript'}>
            <TranscriptPanel />
          </Match>
          <Match when={activeTab() === 'ai'}>
            <div class="flex-1 bg-white dark:bg-card-dark rounded-3xl p-8 shadow-xl">
              <h2 class="text-2xl font-bold">AI Engine Status</h2>
              <p class="mt-4 text-gray-500">Model: {appStore.selectedModelId()}</p>
              <p class="text-gray-500">Backend: {appStore.backend().toUpperCase()}</p>
              <p class="text-gray-500">Offline Ready: {appStore.isOfflineReady() ? 'Yes' : 'No'}</p>
            </div>
          </Match>
        </Switch>
        <Sidebar
          activeTab={activeTab()}
          onTabChange={setActiveTab}
          onToggleDebug={() => setIsDebugVisible(!isDebugVisible())}
        />
      </main>

      <DebugPanel
        isVisible={isDebugVisible()}
        onClose={() => setIsDebugVisible(false)}
        audioEngine={audioEngineSignal() ?? undefined}
      />

      <StatusBar />
      <PrivacyBadge />
    </div>
  );
};


export default App;
