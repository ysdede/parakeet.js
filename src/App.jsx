import { createSignal, onMount, onCleanup, Show, For, createEffect } from 'solid-js';

// Import stores and providers
import { UIProvider, useUI } from './stores/uiStore';
import { SettingsProvider, useSettings } from './stores/settingsStore';
import { TranscriptionProvider, useTranscription } from './stores/transcriptionStore';
import { ModelSettingsProvider, useModelSettings } from './stores/modelStore';
import { AudioProvider, useAudio } from './stores/audioStore';
import { LogProvider, useLogs } from './stores/logStore';
// WebSocket dependencies removed – fully client-side

// Import components
import AppHeader from './components/AppHeader';
import SettingsWidget from './components/SettingsWidget';
import MergedTranscriptionWidget from './components/MergedTranscriptionWidget';
import AudioVisualizer from './components/AudioVisualizer';
import LLMProcessor from './components/LLMProcessor';
import PromptEditorModal from './components/PromptEditorModal';
import CompactStatsSnr from './components/CompactStatsSnr';
import ThemeToggle from './components/ThemeToggle';
import TranscriptionOutput from './components/TranscriptionOutput';
import Timestamp from './components/Timestamp';
import LiveView from './components/LiveView';
import OfflineTester from './components/OfflineTester';
import ModelSettingsPanel from './components/ModelSettingsPanel';
import SetupOverlay from './components/SetupOverlay';

import { audioManager } from './AudioManager';
import { transcriptionDataManager } from './TranscriptionDataManager';
import { settingsManager } from './utils/settingsManager';
import TranscriptionWorkerModule from './workers/transcription.worker.js?worker';
import ResamplingWorkerModule from './workers/resampling.worker.js?url';
import audioProcessorUrl from './audio-processor.js?url';
import { segmentationPresets } from './config/audioParams.js';
import SentenceProcessor from './utils/sentenceProcessor.js';
import { setupSettingsEffects, saveSettingsToStorage, restoreSettingsWithDevices } from './utils/settingsHandler.js';
import { generateSessionId } from './utils/sessionId.js';
import { useAudioRecorder } from './hooks/useAudioRecorder.js';

function AppContent() {
  const [ui, { 
    toggleSettingsPanel, setDarkMode, setActiveTab, toggleModelSettingsPanel,
    togglePlainTextVisibility, toggleMergedTranscriptionVisibility,
    toggleWaveformVisibility, setTranscriptDisplayMode, setAutoScrollEnabled,
    setMergedTranscriptionWidgetLoaded, setShowLivePreview
  }] = useUI();

  const [settings, { 
    updateSetting, setMultipleSettings, setAllSettings, setSettingsLoaded, saveSettings
  }] = useSettings();

  const [transcription, { 
    setData: setTranscriptionData, 
    setMatureTimestamp, 
    resetTranscription: resetTranscriptionData,
    setLivePreviewText,
    setAllMatureSentences,
    updateWordLock,
  }] = useTranscription();
  
  const [audio, { setAudioDevices, setRecording, setSegmentsForViz, setAudioMetrics }] = useAudio();
  const [logs, { addLog }] = useLogs();
  const [modelSettings] = useModelSettings();
  // WebSocket store removed

  const {
    status,
    statusMessage,
    micPermissionError,
    audioContext,
    handleStartAudio,
    handleStopAudio
  } = useAudioRecorder();

  // Local component state
  const [sessionId, setSessionId] = createSignal(generateSessionId());
  const [worker, setWorker] = createSignal(null);
  const [isSavingSession, setIsSavingSession] = createSignal(false);
  const [showPromptEditorModal, setShowPromptEditorModal] = createSignal(false);
  const [isSetupComplete, setIsSetupComplete] = createSignal(false);

  let sentenceContainerRef;
  let plainTextContainerRef;
  let sentenceProcessor;

  // --- Helper Functions ---

  // WebSocket config handlers removed

  const handleReset = () => {
    addLog('Reset requested.');
    handleStopAudio();
    resetTranscriptionData();
    setSessionId(generateSessionId());
    audioManager.reset();
    transcriptionDataManager.reset();
    if (sentenceProcessor) sentenceProcessor.reset();
    worker()?.postMessage({ type: 'reset', data: { sessionId: sessionId() } });
    addLog('State cleared.');
  };

  const handleClearSettings = () => {
    addLog('Clearing all saved settings from localStorage.');
    settingsManager.clearSettings();
    // Reload the page to apply the default settings cleanly
    window.location.reload();
  };

  const handleSettingChange = (e) => {
    const { setting, value } = e.detail;
    updateSetting(setting, value);
  };

  const cycleSegmentationPreset = () => {
    const presetsOrder = ['medium', 'fast', 'slow'];
    const currentIndex = presetsOrder.indexOf(settings.segmentationPreset);
    const nextIndex = (currentIndex + 1) % presetsOrder.length;
    const nextPresetKey = presetsOrder[nextIndex];
    const preset = segmentationPresets[nextPresetKey];
    setMultipleSettings({
      segmentationPreset: nextPresetKey,
      audioThreshold: preset.audioThreshold,
      silenceLength: preset.silenceLength,
      speechHangover: preset.speechHangover,
    });
  };

  const handleSaveSession = () => {
    if (!worker()) return;
    setIsSavingSession(true);
    worker().postMessage({ type: 'get_session_data' });
  };

  const copyHandler = () => {
    const textToCopy = ui.transcriptDisplayMode === 'plain' 
      ? transcription.mergedWords.map(w=>w.text || w.word).join(' ') 
      : transcription.allMatureSentences.map(s => s.text).join('\\n');
    navigator.clipboard.writeText(textToCopy);
    addLog('Copied to clipboard.');
  };

  // --- Lifecycle and Effects ---

  onMount(() => {
    addLog('AppContent mounted');
    
    sentenceProcessor = new SentenceProcessor({
        useNLPSentenceDetection: settings.useNLPSentenceDetection,
        nlpSentenceDetectionDebug: settings.nlpSentenceDetectionDebug
    });

    setupSettingsEffects(settings, audio, worker, sentenceProcessor, handleStartAudio, handleStopAudio);

    const unsubDataUpdate = transcriptionDataManager.subscribe('dataUpdate', (data) => {
      setTranscriptionData(data);
    });
    const unsubMatureCursor = transcriptionDataManager.subscribe('matureCursorUpdate', (data) => {
      setMatureTimestamp(data.time);
      audioManager.purgeAudioBefore(data.time);
      // Inform the worker so it can exclude already-stable audio from the next window
      worker()?.postMessage({ type: 'cursor', data: { time: data.time } });
    });
    
    // Subscribe to AudioManager events
    const unsubAudioSegments = audioManager.subscribe((event, data) => {
      if (event === 'segmentsUpdated') {
        setSegmentsForViz(data);
      } else if (event === 'aggregatedStatsUpdated') {
        // Handle aggregated stats if needed
        addLog(`Audio stats updated: ${data.valid.count} valid, ${data.discarded.count} discarded`, 'debug');
      }
    });
    
    // Set up periodic audio metrics updates
    const metricsInterval = setInterval(() => {
      if (audio.recording) {
        const metrics = audioManager.getMetrics();
        setAudioMetrics(metrics);
      }
    }, 100); // Update every 100ms
    
    enumerateAudioDevices();
    navigator.mediaDevices.addEventListener('devicechange', enumerateAudioDevices);

    const asrWorker = new TranscriptionWorkerModule();

    // Give the data-manager ownership of the worker → it will listen for
    //  merged_transcription_update / merged_transcription events automatically.
    transcriptionDataManager.setWorker(asrWorker);

    asrWorker.onmessage = (e) => {
      if (e.data.type === 'ready') {
        setIsSetupComplete(true);
      }
      // All other messages are handled by TranscriptionDataManager.
    };

    // Initialize the resampling worker in the transcription worker
    asrWorker.postMessage({ 
      type: 'init_resampling_worker', 
      data: { 
        workerUrl: ResamplingWorkerModule 
      } 
    });

    audioManager.worker = asrWorker;
    setWorker(asrWorker); // Save worker instance

    onCleanup(() => {
      unsubDataUpdate();
      unsubMatureCursor();
      unsubAudioSegments();
      clearInterval(metricsInterval);
      navigator.mediaDevices.removeEventListener('devicechange', enumerateAudioDevices);
      worker()?.terminate();
      handleStopAudio();
    });
  });
  
  createEffect(() => {
    // Auto-scroll for sentence list - pure SolidJS approach
    if (ui.autoScrollEnabled && sentenceContainerRef && transcription.allMatureSentences.length > 0) {
      // Use RAF to ensure DOM has updated
      requestAnimationFrame(() => {
        sentenceContainerRef.scrollTo({
          top: sentenceContainerRef.scrollHeight,
          behavior: 'smooth'
        });
      });
    }
  });

  createEffect(() => {
    // Auto-scroll for plain text view
    const text = transcription.mergedWords.map(w=>w.text || w.word).join(' ');
    if (ui.autoScrollEnabled && plainTextContainerRef && text) {
        const textarea = plainTextContainerRef.querySelector('textarea');
        if (textarea) {
            const { scrollTop, scrollHeight, clientHeight } = textarea;
            const isScrolledToBottom = scrollHeight - scrollTop - clientHeight < 50;
            
            if (isScrolledToBottom) {
                textarea.scrollTo({ top: scrollHeight, behavior: 'smooth' });
            }
        }
    }
  });

  createEffect(() => {
    // Initialize parakeetService with settings from store
    // parakeetService.config = { ...modelSettings }; // This line was removed as per the edit hint
  });

  // Worker/WebSocket path disabled – fully client-side mode

  createEffect(() => {
    // Persist settings to storage
    if (settings.settingsLoaded) {
      saveSettingsToStorage(settings, audio, addLog);
    }
  });

  createEffect(() => {
    // Process sentences from transcription data
    const matureTime = transcription.matureTimestamp;
    const words = transcription.mergedWords;
    
    // Debug logging to understand data flow
    if (words.length > 0) {
      addLog(`Sentence processing: ${words.length} words, matureTime: ${matureTime}s`, 'debug');
    }
    
    if (matureTime > 0 && words.length > 0 && sentenceProcessor) {
      const { newSentences, updatedSentences } = sentenceProcessor.process(matureTime, words);

      // Always update the UI with all sentences, not just when there are new ones
      console.log('[App] About to call setAllMatureSentences with:', updatedSentences.length, updatedSentences);
      setAllMatureSentences(Array.isArray(updatedSentences) ? [...updatedSentences] : updatedSentences);
      addLog(`UI updated with ${updatedSentences.length} total sentences`, 'debug');
      if (newSentences.length > 0) {
        addLog(`Processed ${newSentences.length} new sentences. Total: ${updatedSentences.length}`, 'debug');
      }
      
      const newLivePreview = words
        .filter(w => w.start > matureTime)
        .map(w => w.word || w.text)
        .join(' ')
        .trim();
      setLivePreviewText(newLivePreview);
    } else if (matureTime === 0) {
        if (sentenceProcessor) sentenceProcessor.reset();
        setAllMatureSentences([]);
        addLog('Sentence processor reset - matureTime is 0', 'debug');
    }
  });

  // Pure SolidJS approach - no virtual list needed!

  const enumerateAudioDevices = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter(device => device.kind === 'audioinput');
      setAudioDevices(audioInputs);
      addLog(`Found ${audioInputs.length} audio input devices.`);
      const deviceWasRestored = restoreSettingsWithDevices(audioInputs, setAllSettings, updateSetting, addLog, setSettingsLoaded);
      if (!deviceWasRestored && audioInputs.length > 0) {
        updateSetting('selectedDeviceId', audioInputs[0].deviceId);
      }
    } catch (error) {
      console.error('Failed to enumerate devices:', error);
      addLog(`Failed to enumerate devices: ${error}`, 'error');
      // Even if device enumeration fails, we should still load settings
      setSettingsLoaded(true);
    }
  };

  return (
    <div class="app-container">
      <Show when={!isSetupComplete()}>
        {/* Pass the worker instance to the overlay */}
        <SetupOverlay worker={worker()} />
      </Show>
      
      <AppHeader
        handleStartAudio={handleStartAudio}
        handleStopAudio={handleStopAudio}
        cycleSegmentationPreset={cycleSegmentationPreset}
        // setShowWsConfig={setShowWsConfig} // Removed
        // iconTitle={iconTitle} // Removed
        // iconColorClass={iconColorClass} // Removed
        handleSaveSession={handleSaveSession}
        isSavingSession={isSavingSession}
        worker={worker}
        status={status}
        audioContext={audioContext}
      />
      <main class="app-main">
        <Show when={ui.activeTab === 'live'}>
          <LiveView
            micPermissionError={micPermissionError}
            statusMessage={statusMessage}
            handleSettingChange={handleSettingChange}
            handleClearSettings={handleClearSettings}
            handleReset={handleReset}
            copyHandler={copyHandler}
            setSentenceContainerRef={el => sentenceContainerRef = el}
            setPlainTextContainerRef={el => plainTextContainerRef = el}
          />
        </Show>
        <Show when={ui.activeTab === 'offline'}>
          <div class="p-4">
            <OfflineTester />
          </div>
        </Show>
      </main>
      <Show when={showPromptEditorModal()}>
        <PromptEditorModal
          showModal={showPromptEditorModal()}
          promptValue={settings.prompts[settings.selectedPromptKey]?.prompt}
          on:close={() => setShowPromptEditorModal(false)}
          on:save={(e) => {
            // Logic to save prompt
            setShowPromptEditorModal(false);
          }}
        />
      </Show>
      <ModelSettingsPanel
        isOpen={ui.isModelSettingsPanelOpen}
        onClose={() => toggleModelSettingsPanel(false)}
      />
      {/* WebSocketConfigPanel removed */}
    </div>
  );
}

// The main App component that wraps everything in providers
function App() {
  return (
    <UIProvider>
      <SettingsProvider>
        <ModelSettingsProvider>
          <TranscriptionProvider>
            <AudioProvider>
              <LogProvider>
                <AppContent />
              </LogProvider>
            </AudioProvider>
          </TranscriptionProvider>
        </ModelSettingsProvider>
      </SettingsProvider>
    </UIProvider>
  );
}

export default App; 