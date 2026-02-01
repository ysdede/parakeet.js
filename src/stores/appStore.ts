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

  // Model state
  const [modelState, setModelState] = createSignal<ModelState>('unloaded');
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
  };

  const stopRecording = () => {
    setRecordingState('idle');
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
    sessionDuration,
    modelState,
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
    setModelState,
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
    appendTranscript,
    clearTranscript,
    copyTranscript,
  };
}

// Create singleton store
export const appStore = createRoot(createAppStore);

