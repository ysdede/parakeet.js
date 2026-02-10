import { Component, Show, For, Switch, Match, createSignal, onMount, onCleanup, createEffect } from 'solid-js';
import { appStore } from './stores/appStore';
import { CompactWaveform, BufferVisualizer, ModelLoadingOverlay, Sidebar, DebugPanel, StatusBar, TranscriptionDisplay } from './components';
import { getModelDisplayName, MODELS } from './components/ModelLoadingOverlay';
import { AudioEngine } from './lib/audio';
import { MelWorkerClient } from './lib/audio/MelWorkerClient';
import { TranscriptionWorkerClient } from './lib/transcription';
import { formatDuration } from './utils/time';
import { HybridVAD } from './lib/vad';
import { WindowBuilder } from './lib/transcription/WindowBuilder';
import { BufferWorkerClient } from './lib/buffer';
import { TenVADWorkerClient } from './lib/vad/TenVADWorkerClient';
import type { V4ProcessResult } from './lib/transcription/TranscriptionWorkerClient';
import type { BufferWorkerConfig, TenVADResult } from './lib/buffer/types';

// Singleton instances
let audioEngine: AudioEngine | null = null;
export const [audioEngineSignal, setAudioEngineSignal] = createSignal<AudioEngine | null>(null);

let workerClient: TranscriptionWorkerClient | null = null;
let melClient: MelWorkerClient | null = null;
export const [melClientSignal, setMelClientSignal] = createSignal<MelWorkerClient | null>(null);
let segmentUnsubscribe: (() => void) | null = null;
let windowUnsubscribe: (() => void) | null = null;
let melChunkUnsubscribe: (() => void) | null = null;
let energyPollInterval: number | undefined;
// v4 pipeline instances
let hybridVAD: HybridVAD | null = null;
let bufferClient: BufferWorkerClient | null = null;
let tenVADClient: TenVADWorkerClient | null = null;
let windowBuilder: WindowBuilder | null = null;
let v4TickTimeout: number | undefined;
let v4TickRunning = false;
let v4AudioChunkUnsubscribe: (() => void) | null = null;
let v4MelChunkUnsubscribe: (() => void) | null = null;
let v4InferenceBusy = false;
let v4LastInferenceTime = 0;
// Global sample counter for audio chunks (tracks total samples written to BufferWorker)
let v4GlobalSampleOffset = 0;
// Throttle UI updates from TEN-VAD to at most once per frame
let pendingSileroProb: number | null = null;
let sileroUpdateScheduled = false;
let pendingVadState: {
  isSpeech: boolean;
  energy: number;
  snr: number;
  hybridState: string;
  sileroProbability?: number;
} | null = null;
let vadUpdateScheduled = false;

const scheduleSileroUpdate = (prob: number) => {
  pendingSileroProb = prob;
  if (sileroUpdateScheduled) return;
  sileroUpdateScheduled = true;
  requestAnimationFrame(() => {
    sileroUpdateScheduled = false;
    if (pendingSileroProb === null) return;
    const currentState = appStore.vadState();
    appStore.setVadState({
      ...currentState,
      sileroProbability: pendingSileroProb,
    });
  });
};

const scheduleVadStateUpdate = (next: {
  isSpeech: boolean;
  energy: number;
  snr: number;
  hybridState: string;
  sileroProbability?: number;
}) => {
  pendingVadState = next;
  if (vadUpdateScheduled) return;
  vadUpdateScheduled = true;
  requestAnimationFrame(() => {
    vadUpdateScheduled = false;
    if (!pendingVadState) return;
    const currentState = appStore.vadState();
    const sileroProbability =
      pendingVadState.sileroProbability !== undefined
        ? pendingVadState.sileroProbability
        : currentState.sileroProbability;
    appStore.setVadState({
      ...currentState,
      ...pendingVadState,
      sileroProbability,
    });
    appStore.setIsSpeechDetected(pendingVadState.isSpeech);
    pendingVadState = null;
  });
};

interface ModelOption { id: string; name: string; desc?: string }

const Header: Component<{
  isRecording: boolean;
  audioLevel: number;
  modelLabel: () => string;
  models: ModelOption[];
  selectedModelId: () => string;
  onModelSelect: (id: string) => void;
  isModelLoading: boolean;
}> = (props) => {
  return (
    <header class="bg-white border-b border-slate-200 shrink-0 z-10 transition-all duration-300">
      <div class="px-8 h-20 flex items-center justify-between">
        <div class="flex items-center gap-10">
          <div>
            <div class="flex items-center gap-2">
              <span class="flex h-2 w-2">
                <span class={`absolute inline-flex h-2 w-2 rounded-full opacity-75 ${props.isRecording ? 'animate-ping bg-red-400' : 'bg-slate-300'}`}></span>
                <span class={`relative inline-flex rounded-full h-2 w-2 ${props.isRecording ? 'bg-red-500' : 'bg-slate-400'}`}></span>
              </span>
              <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {props.isRecording ? 'Live' : 'Standby'}
              </span>
            </div>
            <div class="text-[10px] text-slate-500 mt-1">
              <div>parakeet.js {typeof __PARAKEET_VERSION__ !== 'undefined' ? __PARAKEET_VERSION__ : 'unknown'} ({typeof __PARAKEET_SOURCE__ !== 'undefined' ? __PARAKEET_SOURCE__ : 'unknown'})</div>
              <div>onnxruntime-web {typeof __ONNXRUNTIME_VERSION__ !== 'undefined' ? __ONNXRUNTIME_VERSION__ : 'unknown'}</div>
            </div>
          </div>

          <div class="flex items-center gap-8 border-l border-slate-100 pl-10">
            <div class="flex flex-col gap-0.5">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Model</span>
              <select
                class="text-sm font-bold text-slate-700 bg-transparent border border-slate-200 rounded-lg px-2 py-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30 min-w-[140px]"
                value={props.selectedModelId()}
                onInput={(e) => props.onModelSelect((e.target as HTMLSelectElement).value)}
                disabled={props.isModelLoading}
              >
                <For each={props.models}>{(m) => <option value={m.id}>{m.name}</option>}</For>
              </select>
              <span class="text-[10px] text-slate-500">{props.modelLabel()}</span>
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
  let v4ModelNotReadyLogged = false;
  const v4Tick = async () => {
    if (!workerClient || !windowBuilder || !audioEngine || !bufferClient || v4InferenceBusy) return;

    // Skip inference if model is not ready (but still allow audio/mel/VAD to process)
    if (appStore.modelState() !== 'ready') {
      if (!v4ModelNotReadyLogged) {
        console.log('[v4Tick] Model not ready yet - audio is being captured and preprocessed');
        v4ModelNotReadyLogged = true;
      }
      return;
    }
    // Reset the flag once model becomes ready
    if (v4ModelNotReadyLogged) {
      console.log('[v4Tick] Model is now ready - starting inference');
      v4ModelNotReadyLogged = false;
      // Initialize the v4 service now that model is ready
      await workerClient.initV4Service({ debug: false });
    }

    v4TickCount++;
    const now = performance.now();
    // Use the store's configurable inference interval (minus a small margin for the tick jitter)
    const minInterval = Math.max(200, appStore.v4InferenceIntervalMs() - 100);
    if (now - v4LastInferenceTime < minInterval) return;

    // Check if there is speech via the BufferWorker (async query).
    // We check both energy and inference VAD layers; either one detecting speech triggers inference.
    const cursorSample = windowBuilder.getMatureCursorFrame(); // frame === sample in our pipeline
    const currentSample = v4GlobalSampleOffset;
    const startSample = cursorSample > 0 ? cursorSample : 0;

    let hasSpeech = false;
    if (currentSample > startSample) {
      // Check energy VAD first (always available, low latency)
      const energyResult = await bufferClient.hasSpeech('energyVad', startSample, currentSample, 0.3);

      // When inference VAD is ready, require BOTH energy AND inference to agree
      // This prevents false positives from music/noise that has high energy but no speech
      if (tenVADClient?.isReady()) {
        const inferenceResult = await bufferClient.hasSpeech('inferenceVad', startSample, currentSample, 0.5);
        // Require both energy and inference VAD to agree (AND logic)
        hasSpeech = energyResult.hasSpeech && inferenceResult.hasSpeech;
      } else {
        // Fall back to energy-only if inference VAD is not available
        hasSpeech = energyResult.hasSpeech;
      }
    }

    if (v4TickCount <= 5 || v4TickCount % 20 === 0) {
      const vadState = appStore.vadState();
      const rb = audioEngine.getRingBuffer();
      const rbFrame = rb.getCurrentFrame();
      const rbBase = rb.getBaseFrameOffset();
      console.log(
        `[v4Tick #${v4TickCount}] hasSpeech=${hasSpeech}, vadState=${vadState.hybridState}, ` +
        `energy=${vadState.energy.toFixed(4)}, inferenceVAD=${(vadState.sileroProbability || 0).toFixed(2)}, ` +
        `samples=[${startSample}:${currentSample}], ` +
        `ringBuf=[base=${rbBase}, head=${rbFrame}, avail=${rbFrame - rbBase}]`
      );
    }

    // Periodic buffer worker state dump (every 40 ticks)
    if (v4TickCount % 40 === 0 && bufferClient) {
      try {
        const state = await bufferClient.getState();
        const layerSummary = Object.entries(state.layers)
          .map(([id, l]) => `${id}:${l.fillCount}/${l.maxEntries}@${l.currentSample}`)
          .join(', ');
        console.log(`[v4Tick #${v4TickCount}] BufferState: ${layerSummary}`);
      } catch (_) { /* ignore state query errors */ }
    }

    if (!hasSpeech) {
      // Check for silence-based flush using BufferWorker
      const silenceDuration = await bufferClient.getSilenceTailDuration('energyVad', 0.3);
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
        const rb = audioEngine.getRingBuffer();
        const rbHead = rb.getCurrentFrame();
        const rbBase = rb.getBaseFrameOffset();
        console.log(
          `[v4Tick #${v4TickCount}] buildWindow=null, ` +
          `ringBuf=[base=${rbBase}, head=${rbHead}, avail=${rbHead - rbBase}], ` +
          `cursor=${windowBuilder.getMatureCursorFrame()}`
        );
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
    if (tenVADClient) {
      tenVADClient.dispose();
      tenVADClient = null;
    }
    if (bufferClient) {
      bufferClient.dispose();
      bufferClient = null;
    }
    windowBuilder = null;
    v4InferenceBusy = false;
    v4LastInferenceTime = 0;
    v4GlobalSampleOffset = 0;
  };

  const toggleRecording = async () => {
    if (isRecording()) {
      // Update UI immediately so the stop button always takes effect even if cleanup throws
      if (energyPollInterval) {
        clearInterval(energyPollInterval);
        energyPollInterval = undefined;
      }
      appStore.stopRecording();
      appStore.setAudioLevel(0);

      try {
        audioEngine?.stop();

        if (segmentUnsubscribe) segmentUnsubscribe();
        if (windowUnsubscribe) windowUnsubscribe();
        if (melChunkUnsubscribe) melChunkUnsubscribe();
        cleanupV4Pipeline();

        if (workerClient) {
          const final = await workerClient.finalize();
          let text = '';
          if ('text' in final && typeof final.text === 'string') {
            text = final.text;
          } else if ('fullText' in final && typeof final.fullText === 'string') {
            text = final.fullText;
          }
          appStore.setTranscript(text);
          appStore.setPendingText('');
        }

        melClient?.reset();
        audioEngine?.reset();
      } catch (err) {
        console.warn('[App] Error during stop recording cleanup:', err);
      }
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

        // v4 mode: Always start audio capture, mel preprocessing, and VAD
        // Inference only runs when model is ready (checked in v4Tick)
        if (mode === 'v4-utterance') {
          // ---- v4: Utterance-based pipeline with BufferWorker + TEN-VAD ----

          // Initialize merger in worker only if model is ready
          if (isModelReady() && workerClient) {
            await workerClient.initV4Service({ debug: false });
          }

          // Initialize mel worker (always needed for preprocessing)
          if (!melClient) {
            melClient = new MelWorkerClient();
            setMelClientSignal(melClient);
          }
          try {
            await melClient.init({ nMels: 128 });
          } catch (e) {
            melClient.dispose();
            melClient = null;
            setMelClientSignal(null);
          }

          // Initialize BufferWorker (centralized multi-layer data store)
          bufferClient = new BufferWorkerClient();
          const bufferConfig: BufferWorkerConfig = {
            sampleRate: 16000,
            layers: {
              audio: { hopSamples: 1, entryDimension: 1, maxDurationSec: 120 },
              mel: { hopSamples: 160, entryDimension: 128, maxDurationSec: 120 },
              energyVad: { hopSamples: 1280, entryDimension: 1, maxDurationSec: 120 },
              inferenceVad: { hopSamples: 256, entryDimension: 1, maxDurationSec: 120 },
            },
          };
          await bufferClient.init(bufferConfig);

          // Initialize TEN-VAD worker (inference-based VAD)
          tenVADClient = new TenVADWorkerClient();
          tenVADClient.onResult((result: TenVADResult) => {
            if (!bufferClient) return;
            // Batch-write hop probabilities to inferenceVad (single worker message)
            if (result.hopCount > 0) {
              const lastProb = result.probabilities[result.hopCount - 1];
              if (bufferClient.writeBatchTransfer) {
                bufferClient.writeBatchTransfer('inferenceVad', result.probabilities, result.globalSampleOffset);
              } else {
                bufferClient.writeBatch('inferenceVad', result.probabilities, result.globalSampleOffset);
              }

              // Update UI at most once per frame with the latest probability
              scheduleSileroUpdate(lastProb);
            }
          });
          // TEN-VAD init is non-blocking; falls back gracefully if WASM fails
          tenVADClient.init({ hopSize: 256, threshold: 0.5 }).catch((err) => {
            console.warn('[v4] TEN-VAD init failed, using energy-only:', err);
          });

          // Initialize hybrid VAD for energy-based detection (always runs, fast)
          hybridVAD = new HybridVAD({
            sileroThreshold: 0.5,
            onsetConfirmations: 2,
            offsetConfirmations: 3,
            sampleRate: 16000,
          });
          // Do NOT init Silero in HybridVAD (TEN-VAD replaces it)

          // NOTE: WindowBuilder is created AFTER audioEngine.start() below,
          // because start() may re-create the internal RingBuffer.

          // Reset global sample counter
          v4GlobalSampleOffset = 0;

          // Feed audio chunks to mel worker from the main v4 audio handler below
          v4MelChunkUnsubscribe = null;

          // Process each audio chunk: energy VAD + write to BufferWorker + forward to TEN-VAD
          v4AudioChunkUnsubscribe = audioEngine.onAudioChunk((chunk) => {
            if (!hybridVAD || !bufferClient) return;

            const chunkOffset = v4GlobalSampleOffset;
            v4GlobalSampleOffset += chunk.length;

            // 1. Run energy VAD (synchronous, fast) and write to BufferWorker
            const vadResult = hybridVAD.processEnergyOnly(chunk);
            const energyProb = vadResult.isSpeech ? 0.9 : 0.1;
            bufferClient.writeScalar('energyVad', energyProb);

            // 2. Forward audio to mel worker (copy, keep chunk for TEN-VAD transfer)
            melClient?.pushAudioCopy(chunk);

            // 3. Forward audio to TEN-VAD worker for inference-based VAD (transfer, no copy)
            if (tenVADClient?.isReady()) {
              tenVADClient.processTransfer(chunk, chunkOffset);
            }

            // 4. Update VAD state for UI
            const sileroProbability = tenVADClient?.isReady()
              ? undefined
              : (vadResult.sileroProbability || 0);
            scheduleVadStateUpdate({
              isSpeech: vadResult.isSpeech,
              energy: vadResult.energy,
              snr: vadResult.snr || 0,
              hybridState: vadResult.state,
              ...(sileroProbability !== undefined ? { sileroProbability } : {}),
            });
          });

          // Start adaptive inference tick loop (reads interval from appStore)
          // Note: v4Tick internally checks if model is ready before running inference
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

        } else if (isModelReady() && workerClient) {
          // v3 and v2 modes still require model to be ready
          if (mode === 'v3-streaming') {
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
              setMelClientSignal(melClient);
            }
            try {
              await melClient.init({ nMels: 128 });
            } catch (e) {
              melClient.dispose();
              melClient = null;
              setMelClientSignal(null);
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

        // Create WindowBuilder AFTER start() so we get the final RingBuffer reference
        // (AudioEngine.init() re-creates the RingBuffer internally)
        if (mode === 'v4-utterance') {
          windowBuilder = new WindowBuilder(
            audioEngine.getRingBuffer(),
            null, // No VADRingBuffer; hasSpeech now goes through BufferWorker
            {
              sampleRate: 16000,
              minDurationSec: 3.0,
              maxDurationSec: 30.0,
              minInitialDurationSec: 1.5,
              useVadBoundaries: false, // VAD boundaries now managed by BufferWorker
              vadSilenceThreshold: 0.3,
              debug: true, // Enable debug logging for diagnostics
            }
          );
        }

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
    if (appStore.modelState() === 'ready') return;
    if (appStore.modelState() === 'loading') return;
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
        onLoadModel={() => loadSelectedModel()}
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
        <Header
          isRecording={isRecording()}
          audioLevel={appStore.audioLevel()}
          modelLabel={() => appStore.modelState() === 'ready' ? getModelDisplayName(appStore.selectedModelId()) : 'Not loaded'}
          models={MODELS}
          selectedModelId={appStore.selectedModelId}
          onModelSelect={(id) => appStore.setSelectedModelId(id)}
          isModelLoading={appStore.modelState() === 'loading'}
        />

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
            <div class="flex flex-col items-center min-w-[2rem]">
              <span class="text-[9px] font-bold text-slate-400 uppercase tracking-tighter w-full text-center">RTFx</span>
              <span class={`text-xs font-bold tabular-nums min-w-[3ch] text-center ${appStore.rtfxAverage() > 0 && appStore.rtfxAverage() < 5 ? 'text-red-500' : appStore.rtfxAverage() >= 10 ? 'text-emerald-600' : appStore.rtfxAverage() >= 5 ? 'text-green-600' : 'text-slate-900'}`}>{appStore.rtfxAverage() > 0 ? Math.round(appStore.rtfxAverage()) : '–'}</span>
            </div>
            <div class="w-px h-5 bg-slate-200"></div>
            <button
              onClick={() => appStore.copyTranscript()}
              class="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-[10px] font-bold rounded-lg hover:bg-blue-600 transition-all shadow-md active:scale-95 active:shadow-sm"
            >
              <span class="material-symbols-outlined text-[14px]">content_copy</span>
              <span>Copy</span>
            </button>
            <div class="w-px h-5 bg-slate-200"></div>
            <button
              onClick={() => appStore.setShowDebugPanel(!appStore.showDebugPanel())}
              class={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all shadow-md active:scale-95 active:shadow-sm ${appStore.showDebugPanel() ? 'bg-slate-700 text-white hover:bg-slate-800' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
              title={appStore.showDebugPanel() ? 'Hide debug panel (improves performance)' : 'Show debug panel'}
            >
              <span class="material-symbols-outlined text-[14px]">{appStore.showDebugPanel() ? 'bug_report' : 'bug_report'}</span>
              <span>{appStore.showDebugPanel() ? 'Debug' : 'Debug'}</span>
            </button>
          </div>
        </div>

        <Show when={appStore.showDebugPanel()}>
          <DebugPanel
            audioEngine={audioEngineSignal() ?? undefined}
            melClient={melClientSignal() ?? undefined}
          />
        </Show>
      </main>
    </div>
  );
};

export default App;

