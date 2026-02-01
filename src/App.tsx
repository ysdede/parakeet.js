/**
 * BoncukJS v2.0 - Main Application Component
 * 
 * Privacy-first, offline-capable real-time transcription.
 * Uses state-preserving streaming (NVIDIA approach) via parakeet.js.
 */

import { Component, Show, For, Switch, Match, createSignal, onMount, onCleanup } from 'solid-js';
import { appStore } from './stores/appStore';
import { CompactWaveform, ModelLoadingOverlay, Sidebar, DebugPanel } from './components';
import { AudioEngine } from './lib/audio';
import { ModelManager, TranscriptionService } from './lib/transcription';

// Singleton instances
let audioEngine: AudioEngine | null = null;
let modelManager: ModelManager | null = null;

let transcriptionService: TranscriptionService | null = null;
let energyPollInterval: number | undefined;

const Header: Component<{ onTabChange: (tab: string) => void }> = (props) => {
  const isRecording = () => appStore.recordingState() === 'recording';
  const isModelReady = () => appStore.modelState() === 'ready';

  const toggleRecording = async () => {
    if (isRecording()) {
      // Stop recording
      if (energyPollInterval) {
        clearInterval(energyPollInterval);
        energyPollInterval = undefined;
      }
      audioEngine?.stop();

      // Finalize transcription
      if (transcriptionService) {
        const final = transcriptionService.finalize();
        if (final.text) {
          appStore.appendTranscript(final.text + ' ');
        }
      }

      appStore.setAudioLevel(0);
      appStore.stopRecording();
    } else {
      // Start recording
      try {
        // Initialize audio engine if needed
        if (!audioEngine) {
          audioEngine = new AudioEngine({
            sampleRate: 16000,
            bufferDuration: 30,
            energyThreshold: 0.01, // Lower threshold for better sensitivity
            minSpeechDuration: 100,
            minSilenceDuration: 300,
          });
        }

        // Initialize transcription service if model is ready
        if (isModelReady() && modelManager && !transcriptionService) {
          transcriptionService = new TranscriptionService(modelManager, {
            sampleRate: 16000,
            returnTimestamps: true,
            debug: true,
          }, {
            onResult: (result) => {
              if (result.chunkText) {
                appStore.setPendingText(result.chunkText);
              }
              if (result.isFinal && result.text) {
                appStore.appendTranscript(result.text + ' ');
              }
            },
          });
          transcriptionService.initialize();
        }

        // Subscribe to speech segments for transcription
        audioEngine.onSpeechSegment(async (segment) => {
          if (transcriptionService && isModelReady()) {
            try {
              const samples = audioEngine!.getRingBuffer().read(segment.startFrame, segment.endFrame);
              await transcriptionService.processChunk(samples);
            } catch (e) {
              console.error('Transcription error:', e);
            }
          }
        });

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

      } catch (err) {
        console.error('Failed to start recording:', err);
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
            class={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group ${isRecording()
              ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20'
              : 'bg-primary hover:bg-blue-600 shadow-primary/20'
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

const StatusBar: Component = () => {
  const isCompatibilityMode = () => appStore.backend() === 'wasm';

  const modelStatusText = () => {
    switch (appStore.modelState()) {
      case 'unloaded': return 'Model not loaded';
      case 'loading': return appStore.modelMessage() || `Loading... ${appStore.modelProgress()}%`;
      case 'ready': return 'Ready';
      case 'error': return 'Error';
    }
  };

  const statusDotClass = () => {
    switch (appStore.modelState()) {
      case 'ready': return 'bg-green-500';
      case 'loading': return 'bg-yellow-500 animate-pulse';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div class="fixed bottom-4 left-4 flex items-center gap-3">
      {/* Main status badge */}
      <div class="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 text-xs">
        {/* Loading spinner or status dot */}
        <Show
          when={appStore.modelState() !== 'loading'}
          fallback={
            <div class="w-3 h-3 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
          }
        >
          <span class={`w-2 h-2 rounded-full ${statusDotClass()}`} />
        </Show>

        <span class="text-gray-600 dark:text-gray-400">{modelStatusText()}</span>

        {/* Backend indicator */}
        <Show when={appStore.modelState() === 'ready'}>
          <span class={`px-1.5 py-0.5 rounded text-[10px] font-medium ${isCompatibilityMode()
            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
            : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
            }`}>
            {appStore.backend().toUpperCase()}
          </span>
        </Show>
      </div>

      {/* Offline indicator - Story 3.2 */}
      <Show when={!appStore.isOnline()}>
        <div class="flex items-center gap-1 px-2 py-1 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-full text-xs text-red-700 dark:text-red-400 animate-pulse">
          <span class="material-icons-round text-sm">wifi_off</span>
          <span>Offline</span>
        </div>
      </Show>

      {/* Compatibility mode tooltip */}
      <Show when={isCompatibilityMode() && appStore.modelState() === 'ready'}>
        <div class="flex items-center gap-1 px-2 py-1 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-full text-xs text-amber-700 dark:text-amber-400">
          <span class="material-icons-round text-sm">speed</span>
          <span>Compatibility Mode</span>
        </div>
      </Show>

      {/* Offline ready indicator */}
      <Show when={appStore.isOfflineReady() && appStore.modelState() === 'ready' && appStore.isOnline()}>
        <div class="flex items-center gap-1 px-2 py-1 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-full text-xs text-green-700 dark:text-green-400">
          <span class="material-icons-round text-sm">cloud_off</span>
          <span>Offline Ready</span>
        </div>
      </Show>
    </div>
  );
};



// Privacy badge component with tooltip
const PrivacyBadge: Component = () => {
  const [showDetails, setShowDetails] = createSignal(false);

  return (
    <div class="fixed bottom-4 right-4 z-50">
      {/* Privacy tooltip */}
      <Show when={showDetails()}>
        <div class="absolute bottom-full right-0 mb-2 w-72 p-4 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 text-sm">
          <div class="flex items-center gap-2 mb-3 text-green-600 dark:text-green-400 font-semibold">
            <span class="material-icons-round">verified_user</span>
            Privacy Guaranteed
          </div>
          <ul class="space-y-2 text-gray-600 dark:text-gray-400">
            <li class="flex items-start gap-2">
              <span class="material-icons-round text-green-500 text-sm mt-0.5">check</span>
              <span>All audio processing happens <strong>locally in your browser</strong></span>
            </li>
            <li class="flex items-start gap-2">
              <span class="material-icons-round text-green-500 text-sm mt-0.5">check</span>
              <span>Audio is <strong>never sent to any server</strong></span>
            </li>
            <li class="flex items-start gap-2">
              <span class="material-icons-round text-green-500 text-sm mt-0.5">check</span>
              <span>Works <strong>completely offline</strong> after model download</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="material-icons-round text-green-500 text-sm mt-0.5">check</span>
              <span>Your transcripts stay on <strong>your device only</strong></span>
            </li>
          </ul>
          <div class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500">
            Powered by parakeet.js with WebGPU/WASM
          </div>
        </div>
      </Show>

      {/* Badge button */}
      <button
        onClick={() => setShowDetails(!showDetails())}
        class="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 text-xs hover:border-green-500 transition-colors"
      >
        <span class="material-icons-round text-green-500 text-sm">lock</span>
        <span class="text-gray-600 dark:text-gray-400">Audio stays on device</span>
        <span class="material-icons-round text-gray-400 text-sm">
          {showDetails() ? 'expand_more' : 'expand_less'}
        </span>
      </button>
    </div>
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
        backend={appStore.backend()}
        selectedModelId={appStore.selectedModelId()}
        onModelSelect={appStore.setSelectedModelId}
        onStart={loadSelectedModel}
        onLocalLoad={handleLocalLoad}
      />


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
      />

      <StatusBar />
      <PrivacyBadge />
    </div>
  );
};


export default App;
