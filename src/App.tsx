/**
 * BoncukJS v2.0 - Main Application Component
 * 
 * Privacy-first, offline-capable real-time transcription.
 * Uses state-preserving streaming (NVIDIA approach) via parakeet.js.
 */

import { Component, Show, onMount, onCleanup } from 'solid-js';
import { appStore } from './stores/appStore';
import { CompactWaveform, EnergyMeter } from './components';
import { AudioEngine } from './lib/audio';

// Audio engine instance (singleton)
let audioEngine: AudioEngine | null = null;
let energyPollInterval: number | undefined;

const Header: Component = () => {
  const isRecording = () => appStore.recordingState() === 'recording';
  
  // Handle recording toggle
  const toggleRecording = async () => {
    if (isRecording()) {
      // Stop recording
      if (energyPollInterval) {
        clearInterval(energyPollInterval);
        energyPollInterval = undefined;
      }
      if (audioEngine) {
        audioEngine.stop();
      }
      appStore.setAudioLevel(0);
      appStore.stopRecording();
    } else {
      // Start recording
      try {
        if (!audioEngine) {
          audioEngine = new AudioEngine({
            sampleRate: 16000,
            bufferDuration: 30,
            energyThreshold: 0.02,
            minSpeechDuration: 100,
            minSilenceDuration: 300,
          });
          
          // Subscribe to speech segments
          audioEngine.onSpeechSegment((segment) => {
            console.log('Speech segment:', segment);
            appStore.setIsSpeechDetected(true);
            // TODO: Send to transcription engine
          });
        }
        
        await audioEngine.start();
        appStore.startRecording();
        
        // Poll energy level for visualization
        energyPollInterval = window.setInterval(() => {
          if (audioEngine) {
            appStore.setAudioLevel(audioEngine.getCurrentEnergy());
            appStore.setIsSpeechDetected(audioEngine.isSpeechActive());
          }
        }, 50);
        
      } catch (err) {
        console.error('Failed to start recording:', err);
      }
    }
  };
  
  return (
    <header class="flex-none p-4 pb-0">
      <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-3 flex items-center justify-between gap-4">
        {/* Mic selector placeholder */}
        <div class="flex items-center gap-3 bg-gray-100 dark:bg-gray-900/50 rounded-xl px-4 py-2 w-64">
          <span class="material-icons-round text-gray-500">mic</span>
          <span class="text-sm font-medium flex-1 truncate">Default Microphone</span>
        </div>
        
        {/* Record button */}
        <div class="flex items-center gap-3">
          <button
            onClick={toggleRecording}
            class={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 ${
              isRecording() 
                ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' 
                : 'bg-blue-500 hover:bg-blue-600 shadow-blue-500/20'
            }`}
          >
            <span class="material-icons-round text-white text-xl">
              {isRecording() ? 'stop' : 'mic'}
            </span>
          </button>
        </div>
        
        {/* Waveform visualization */}
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
    <section class="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700/50 overflow-hidden">
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
            class="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-400 hover:text-blue-500 transition-all"
          >
            <span class="material-icons-round text-xl">content_copy</span>
            <span class="text-[10px] font-medium">Copy</span>
          </button>
          <button
            onClick={() => appStore.clearTranscript()}
            class="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-400 hover:text-red-400 transition-all"
          >
            <span class="material-icons-round text-xl">delete_outline</span>
            <span class="text-[10px] font-medium">Clear</span>
          </button>
        </div>
      </div>
      
      {/* Transcript content */}
      <div class="flex-1 overflow-y-auto p-8 prose prose-lg dark:prose-invert max-w-none leading-relaxed">
        <Show 
          when={appStore.transcript()} 
          fallback={
            <p class="text-xl text-gray-400 dark:text-gray-500">
              Click the microphone to start recording...
            </p>
          }
        >
          <p class="text-xl text-gray-600 dark:text-gray-300">
            {appStore.transcript()}
          </p>
        </Show>
        <Show when={appStore.pendingText()}>
          <span class="text-xl text-gray-400 dark:text-gray-500 opacity-60">
            {appStore.pendingText()}
          </span>
        </Show>
      </div>
    </section>
  );
};

const StatusBar: Component = () => {
  const modelStatus = () => {
    switch (appStore.modelState()) {
      case 'unloaded': return 'Model not loaded';
      case 'loading': return `Loading model... ${appStore.modelProgress()}%`;
      case 'ready': return `Ready (${appStore.backend().toUpperCase()})`;
      case 'error': return 'Model error';
    }
  };
  
  return (
    <div class="fixed bottom-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 text-xs">
      <span class={`w-2 h-2 rounded-full ${
        appStore.modelState() === 'ready' ? 'bg-green-500' :
        appStore.modelState() === 'loading' ? 'bg-yellow-500 animate-pulse' :
        appStore.modelState() === 'error' ? 'bg-red-500' :
        'bg-gray-400'
      }`} />
      <span class="text-gray-600 dark:text-gray-400">{modelStatus()}</span>
      <Show when={appStore.isOfflineReady()}>
        <span class="text-green-500">• Offline Ready</span>
      </Show>
    </div>
  );
};

// Privacy badge component
const PrivacyBadge: Component = () => (
  <div class="fixed bottom-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 text-xs">
    <span class="material-icons-round text-green-500 text-sm">lock</span>
    <span class="text-gray-600 dark:text-gray-400">Audio stays on device</span>
  </div>
);

// Helper function
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Main App
const App: Component = () => {
  return (
    <div class="h-screen w-full overflow-hidden flex flex-col bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100 font-sans">
      <Header />
      
      <main class="flex-1 flex overflow-hidden p-4 gap-4">
        <TranscriptPanel />
      </main>
      
      <StatusBar />
      <PrivacyBadge />
    </div>
  );
};

export default App;
