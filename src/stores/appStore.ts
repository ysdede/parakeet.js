/**
 * BoncukJS v3.0 - App Store
 * 
 * Central state management using SolidJS signals.
 * Manages recording state, model status, and transcript.
 */

import { createSignal, createRoot, onCleanup } from 'solid-js';
import type { RecordingState, ModelState, BackendType } from '../types';

export interface DebugToken {
  id: string;
  text: string;
  confidence: number;
}

export interface SystemMetrics {
  throughput: number; // tokens/sec
  modelConfidence: number; // 0-1
  vramUsage?: string;
}

/** Transcription mode: v2 (per-utterance VAD), v3 (overlapping windows + LCS merge), v4 (utterance-based merger) */
export type TranscriptionMode = 'v2-utterance' | 'v3-streaming' | 'v4-utterance';

/** Merge info for v3 streaming mode */
export interface MergeInfo {
  lcsLength: number;
  anchorValid: boolean;
  chunkCount: number;
  anchorTokens?: string[];
}

/** VAD state for UI display */
export interface VADState {
  isSpeech: boolean;
  energy: number;
  snr: number;
  sileroProbability: number;
  hybridState: string;
}

/** Merger stats for v4 mode */
export interface V4MergerStats {
  sentencesFinalized: number;
  cursorUpdates: number;
  utterancesProcessed: number;
}

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
  const [modelFile, setModelFile] = createSignal('');
  const [backend, setBackend] = createSignal<BackendType>('webgpu');
  const [errorMessage, setErrorMessage] = createSignal<string | null>(null);


  // Transcript state
  const [transcript, setTranscript] = createSignal('');
  const [pendingText, setPendingText] = createSignal('');

  // Audio state
  const [audioLevel, setAudioLevel] = createSignal(0);
  const [isSpeechDetected, setIsSpeechDetected] = createSignal(false);

  // Offline state
  const [isOfflineReady, setIsOfflineReady] = createSignal(false);
  const [isOnline, setIsOnline] = createSignal(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Debug metrics
  const [inferenceLatency, setInferenceLatency] = createSignal(0);
  const [debugTokens, setDebugTokens] = createSignal<DebugToken[]>([]);
  const [systemMetrics, setSystemMetrics] = createSignal<SystemMetrics>({
    throughput: 0,
    modelConfidence: 0,
  });

  // Transcription mode toggle (v4-utterance is the new default)
  const [transcriptionMode, setTranscriptionMode] = createSignal<TranscriptionMode>('v4-utterance');
  const [mergeInfo, setMergeInfo] = createSignal<MergeInfo>({
    lcsLength: 0,
    anchorValid: false,
    chunkCount: 0,
    anchorTokens: [],
  });

  // Performance Telemetry
  const [rtf, setRtf] = createSignal(0); // Real-Time Factor (Inference/AudioDuration)
  const [bufferMetrics, setBufferMetrics] = createSignal({
    fillRatio: 0,
    latencyMs: 0,
  });

  // v3 Streaming config
  // Window=5s gives ~62 encoder frames (vs 87 for 7s) - 30% less decode work.
  // Overlap=3.5s with trigger=1.5s provides enough context for LCS merging
  // while giving the transcriber 1.5s headroom per chunk.
  const [streamingWindow, setStreamingWindow] = createSignal(5.0);
  const [streamingOverlap, setStreamingOverlap] = createSignal(3.5);
  const [triggerInterval, setTriggerInterval] = createSignal(1.5);
  const [energyThreshold, setEnergyThreshold] = createSignal(0.08);
  // Decoder frame stride: 1 = full precision, 2 = halves decoder steps (faster, coarser timestamps)
  const [frameStride, setFrameStride] = createSignal(1);

  // v4 Pipeline config
  const [v4InferenceIntervalMs, setV4InferenceIntervalMs] = createSignal(480); // Transcription tick frequency in ms (320-8000)
  const [v4SilenceFlushSec, setV4SilenceFlushSec] = createSignal(1.0); // Silence duration to flush pending sentence
  const [sileroThreshold, setSileroThreshold] = createSignal(0.5); // Silero VAD probability threshold

  // v4 Utterance-based state
  const [matureText, setMatureText] = createSignal('');
  const [immatureText, setImmatureText] = createSignal('');
  const [matureCursorTime, setMatureCursorTime] = createSignal(0);
  const [vadState, setVadState] = createSignal<VADState>({
    isSpeech: false,
    energy: 0,
    snr: 0,
    sileroProbability: 0,
    hybridState: 'silence',
  });
  const [v4MergerStats, setV4MergerStats] = createSignal<V4MergerStats>({
    sentencesFinalized: 0,
    cursorUpdates: 0,
    utterancesProcessed: 0,
  });


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
    modelFile,
    backend,
    transcript,
    pendingText,
    audioLevel,
    isSpeechDetected,
    isOfflineReady,
    isOnline,
    inferenceLatency,
    rtf,
    bufferMetrics,
    debugTokens,
    systemMetrics,
    errorMessage,
    transcriptionMode,
    mergeInfo,
    streamingWindow,
    streamingOverlap,
    triggerInterval,
    energyThreshold,
    frameStride,
    // v4 config
    v4InferenceIntervalMs,
    v4SilenceFlushSec,
    sileroThreshold,
    // v4 state
    matureText,
    immatureText,
    matureCursorTime,
    vadState,
    v4MergerStats,

    // Setters (for internal use)
    setRecordingState,
    setSessionDuration,
    setAvailableDevices,
    setSelectedDeviceId,
    setModelState,
    setSelectedModelId,
    setModelProgress,
    setModelMessage,
    setModelFile,
    setBackend,
    setErrorMessage,

    setTranscript,
    setPendingText,
    setAudioLevel,
    setIsSpeechDetected,
    setIsOfflineReady,
    setInferenceLatency,
    setRtf,
    setBufferMetrics,
    setDebugTokens,
    setSystemMetrics,
    setTranscriptionMode,
    setMergeInfo,
    setStreamingWindow,
    setStreamingOverlap,
    setTriggerInterval,
    setEnergyThreshold,
    setFrameStride,
    // v4 setters
    setV4InferenceIntervalMs,
    setV4SilenceFlushSec,
    setSileroThreshold,
    setMatureText,
    setImmatureText,
    setMatureCursorTime,
    setVadState,
    setV4MergerStats,

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

