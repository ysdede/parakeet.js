/**
 * BoncukJS v2.0 - App Store
 * 
 * Central state management using SolidJS signals.
 * Manages recording state, model status, and transcript.
 */

import { createSignal, createRoot, onCleanup } from 'solid-js';
import type { RecordingState, ModelState, BackendType } from '../types';

function createAppStore() {
  // Recording state
  const [recordingState, setRecordingState] = createSignal<RecordingState>('idle');
  const [sessionDuration, setSessionDuration] = createSignal(0);
  const [availableDevices, setAvailableDevices] = createSignal<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = createSignal('');

  let timerInterval: number | undefined;

  // Model state
  const [modelState, setModelState] = createSignal<ModelState>('unloaded');
  const [selectedModelId, setSelectedModelId] = createSignal('parakeet-tdt-0.6b-v2');
  const [modelProgress, setModelProgress] = createSignal(0);
  const [modelMessage, setModelMessage] = createSignal('');
  const [backend, setBackend] = createSignal<BackendType>('webgpu');


  // Transcript state
  const [transcript, setTranscript] = createSignal('');
  const [pendingText, setPendingText] = createSignal('');

  // Audio state
  const [audioLevel, setAudioLevel] = createSignal(0);
  const [isSpeechDetected, setIsSpeechDetected] = createSignal(false);

  // Offline state
  const [isOfflineReady, setIsOfflineReady] = createSignal(false);
  const [isOnline, setIsOnline] = createSignal(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Network status listeners
  if (typeof window !== 'undefined') {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
  }

  // Actions
  const startRecording = () => {
    setRecordingState('recording');
    setSessionDuration(0);

    if (timerInterval) clearInterval(timerInterval);
    timerInterval = window.setInterval(() => {
      setSessionDuration(prev => prev + 1);
    }, 1000);
  };

  const stopRecording = () => {
    setRecordingState('idle');
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = undefined;
    }
  };

  const refreshDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const mics = devices.filter(d => d.kind === 'audioinput');
      setAvailableDevices(mics);
      if (mics.length > 0 && !selectedDeviceId()) {
        setSelectedDeviceId(mics[0].deviceId);
      }
    } catch (e) {
      console.error('Failed to enum devices:', e);
    }
  };

  const appendTranscript = (text: string) => {
    setTranscript(prev => prev + text);
    setPendingText('');
  };

  const clearTranscript = () => {
    setTranscript('');
    setPendingText('');
  };

  const copyTranscript = async () => {
    try {
      await navigator.clipboard.writeText(transcript());
      return true;
    } catch {
      return false;
    }
  };

  return {
    // State (readonly)
    recordingState,
    availableDevices,
    selectedDeviceId,
    sessionDuration,
    modelState,
    selectedModelId,
    modelProgress,
    modelMessage,
    backend,
    transcript,
    pendingText,
    audioLevel,
    isSpeechDetected,
    isOfflineReady,
    isOnline,

    // Setters (for internal use)
    setRecordingState,
    setSessionDuration,
    setAvailableDevices,
    setSelectedDeviceId,
    setModelState,
    setSelectedModelId,
    setModelProgress,
    setModelMessage,
    setBackend,

    setTranscript,
    setPendingText,
    setAudioLevel,
    setIsSpeechDetected,
    setIsOfflineReady,

    // Actions
    startRecording,
    stopRecording,
    refreshDevices,
    appendTranscript,
    clearTranscript,
    copyTranscript,
  };
}

// Create singleton store
export const appStore = createRoot(createAppStore);

