import React, { useState, useRef, useEffect } from 'react';
import { ParakeetModel, getParakeetModel, MODELS, LANGUAGE_NAMES } from 'parakeet.js';
import { fetchRandomSample, hasTestSamples, SPEECH_DATASETS } from './utils/speechDatasets';
import {
  DEFAULT_MODEL_REVISIONS,
  fetchModelRevisions,
  fetchModelFiles,
  getAvailableQuantModes,
  pickPreferredQuant,
} from '../../shared/modelSelection.js';
import { formatResolvedQuantization, loadModelWithFallback } from '../../shared/modelLoader.js';
import './App.css';

const SETTINGS_STORAGE_KEY = 'parakeet.demo.settings.v1';
const LOCAL_MODEL_DB_NAME = 'parakeet-demo-local-model';
const LOCAL_MODEL_STORE_NAME = 'handles';
const LOCAL_MODEL_DIR_KEY = 'directory-handle';
const MODEL_SOURCE_OPTIONS = {
  HUGGINGFACE: 'huggingface',
  LOCAL: 'local',
};
const QUANT_TO_FILENAME = {
  fp32: '.onnx',
  fp16: '.fp16.onnx',
  int8: '.int8.onnx',
};

function getBasename(path) {
  return String(path || '').split('/').pop() || '';
}

function normalizeRelPath(path) {
  return String(path || '').replace(/\\/g, '/').replace(/^\.\//, '');
}

function detectLocalQuantModes(entries, baseName) {
  const names = new Set(entries.map((entry) => entry.basename.toLowerCase()));
  const out = [];
  if (names.has(`${baseName}.onnx`)) out.push('fp32');
  if (names.has(`${baseName}.fp16.onnx`)) out.push('fp16');
  if (names.has(`${baseName}.int8.onnx`)) out.push('int8');
  return out;
}

function findLocalEntry(entries, expectedName) {
  const lower = expectedName.toLowerCase();
  return (
    entries.find((entry) => entry.path.toLowerCase() === lower) ||
    entries.find((entry) => entry.basename.toLowerCase() === lower) ||
    entries.find((entry) => entry.path.toLowerCase().endsWith(`/${lower}`)) ||
    null
  );
}

function quantizedModelName(baseName, quant) {
  return `${baseName}${QUANT_TO_FILENAME[quant] || '.onnx'}`;
}

async function collectDirectoryFilesRecursive(dirHandle, prefix = '') {
  const entries = [];
  for await (const [name, handle] of dirHandle.entries()) {
    if (handle.kind === 'directory' && name === '.git') {
      continue;
    }
    const relPath = prefix ? `${prefix}/${name}` : name;
    if (handle.kind === 'file') {
      entries.push({
        path: normalizeRelPath(relPath),
        basename: getBasename(relPath),
        handle,
      });
      continue;
    }
    if (handle.kind === 'directory') {
      const nested = await collectDirectoryFilesRecursive(handle, relPath);
      entries.push(...nested);
    }
  }
  return entries;
}

async function getEntryFile(entry) {
  if (entry.file) return entry.file;
  if (entry.handle?.kind === 'file') return entry.handle.getFile();
  throw new Error(`Could not access local file entry: ${entry?.path || entry?.basename || 'unknown'}`);
}

function supportsDirectoryHandlePersistence() {
  return typeof window !== 'undefined' && typeof window.showDirectoryPicker === 'function' && typeof indexedDB !== 'undefined';
}

function openLocalModelDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(LOCAL_MODEL_DB_NAME, 1);
    request.onerror = () => reject(new Error('Failed to open local model IndexedDB'));
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(LOCAL_MODEL_STORE_NAME)) {
        db.createObjectStore(LOCAL_MODEL_STORE_NAME);
      }
    };
  });
}

async function readPersistedDirectoryHandle() {
  const db = await openLocalModelDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([LOCAL_MODEL_STORE_NAME], 'readonly');
    const store = tx.objectStore(LOCAL_MODEL_STORE_NAME);
    const req = store.get(LOCAL_MODEL_DIR_KEY);
    req.onerror = () => reject(new Error('Failed to read persisted folder handle'));
    req.onsuccess = () => resolve(req.result || null);
  });
}

async function persistDirectoryHandle(dirHandle) {
  const db = await openLocalModelDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([LOCAL_MODEL_STORE_NAME], 'readwrite');
    const store = tx.objectStore(LOCAL_MODEL_STORE_NAME);
    const req = store.put(dirHandle, LOCAL_MODEL_DIR_KEY);
    req.onerror = () => reject(new Error('Failed to persist folder handle'));
    req.onsuccess = () => resolve();
  });
}

async function clearPersistedDirectoryHandle() {
  const db = await openLocalModelDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([LOCAL_MODEL_STORE_NAME], 'readwrite');
    const store = tx.objectStore(LOCAL_MODEL_STORE_NAME);
    const req = store.delete(LOCAL_MODEL_DIR_KEY);
    req.onerror = () => reject(new Error('Failed to clear persisted folder handle'));
    req.onsuccess = () => resolve();
  });
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function saveSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage failures (private mode/quota).
  }
}

// Available models for selection
const MODEL_OPTIONS = Object.entries(MODELS).map(([key, config]) => ({
  key,
  repoId: config.repoId,
  displayName: config.displayName,
  languages: config.languages,
}));

// Cache audio file from GitHub raw URL to IndexedDB
async function getCachedAudioFile(url, cacheKey) {
  const dbName = 'parakeet-demo-cache';
  const storeName = 'audio-files';

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);

    request.onerror = () => reject(new Error('Failed to open IndexedDB'));
    request.onsuccess = async (event) => {
      const db = event.target.result;
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const getReq = store.get(cacheKey);

      getReq.onsuccess = async () => {
        if (getReq.result) {
          // Cache hit - return cached blob
          console.log(`[Cache] Using cached audio: ${cacheKey}`);
          resolve(getReq.result.blob);
        } else {
          // Cache miss - fetch from URL and cache
          console.log(`[Cache] Fetching audio from: ${url}`);
          try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const blob = await response.blob();

            // Store in cache
            const writeTx = db.transaction(storeName, 'readwrite');
            const writeStore = writeTx.objectStore(storeName);
            writeStore.put({ key: cacheKey, blob, timestamp: Date.now() });
            writeTx.oncomplete = () => {
              console.log(`[Cache] Cached audio: ${cacheKey}`);
              resolve(blob);
            };
            writeTx.onerror = () => resolve(blob); // Fallback: return without caching
          } catch (err) {
            reject(err);
          }
        }
      };
      getReq.onerror = () => reject(new Error('Failed to read from cache'));
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName, { keyPath: 'key' });
      }
    };
  });
}

// Convert Float32Array PCM to WAV blob for playback
function pcmToWavBlob(pcm, sampleRate = 16000) {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * bitsPerSample / 8;
  const blockAlign = numChannels * bitsPerSample / 8;
  const dataSize = pcm.length * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // WAV header
  const writeString = (offset, str) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  // PCM data
  let offset = 44;
  for (let i = 0; i < pcm.length; i++) {
    const s = Math.max(-1, Math.min(1, pcm[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    offset += 2;
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

export default function App() {
  const initialSettings = loadSettings();
  const initialSelectedModel = initialSettings.selectedModel;
  const initialModelSource = initialSettings.modelSource;
  const [modelSource, setModelSource] = useState(
    initialModelSource === MODEL_SOURCE_OPTIONS.LOCAL
      ? MODEL_SOURCE_OPTIONS.LOCAL
      : MODEL_SOURCE_OPTIONS.HUGGINGFACE
  );
  const [selectedModel, setSelectedModel] = useState(
    MODELS[initialSelectedModel] ? initialSelectedModel : 'parakeet-tdt-0.6b-v2'
  );
  const [modelRevision, setModelRevision] = useState(initialSettings.modelRevision || 'main');
  const [modelRevisions, setModelRevisions] = useState(DEFAULT_MODEL_REVISIONS);
  const modelConfig = MODELS[selectedModel];
  const [selectedLanguage, setSelectedLanguage] = useState(initialSettings.selectedLanguage || 'en');
  // Use hybrid mode by default (WebGPU encoder + WASM decoder)
  const [backend, setBackend] = useState(initialSettings.backend || 'webgpu-hybrid');
  const [threadingStatus, setThreadingStatus] = useState({ sab: false, threads: 1 });
  const [encoderQuant, setEncoderQuant] = useState(initialSettings.encoderQuant || 'fp32');
  const [decoderQuant, setDecoderQuant] = useState(initialSettings.decoderQuant || 'int8');
  const [encoderQuantOptions, setEncoderQuantOptions] = useState(['fp16', 'int8', 'fp32']);
  const [decoderQuantOptions, setDecoderQuantOptions] = useState(['fp16', 'int8', 'fp32']);
  const [localEntries, setLocalEntries] = useState([]);
  const [localFolderName, setLocalFolderName] = useState('');
  const [hasPersistedLocalHandle, setHasPersistedLocalHandle] = useState(false);
  const [needsLocalHandleReconnect, setNeedsLocalHandleReconnect] = useState(false);
  const [localHandlePersistenceSupported] = useState(supportsDirectoryHandlePersistence());
  const [localTokenizerOptions, setLocalTokenizerOptions] = useState(['vocab.txt']);
  const [localTokenizerName, setLocalTokenizerName] = useState('vocab.txt');
  const [localPreprocessorOptions, setLocalPreprocessorOptions] = useState(['nemo128']);
  const [localDetectedArtifacts, setLocalDetectedArtifacts] = useState({
    encoder: [],
    decoder: [],
    tokenizers: [],
    preprocessors: [],
  });
  const [preprocessor, setPreprocessor] = useState(initialSettings.preprocessor || 'nemo128');
  const [preprocessorBackend, setPreprocessorBackend] = useState(initialSettings.preprocessorBackend || 'onnx');
  const [status, setStatus] = useState('Idle');
  const [progressText, setProgressText] = useState('');
  const [progressPct, setProgressPct] = useState(null);
  const [text, setText] = useState('');
  const [referenceText, setReferenceText] = useState('');
  const [latestMetrics, setLatestMetrics] = useState(null);
  const [transcriptions, setTranscriptions] = useState([]);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isLoadingSample, setIsLoadingSample] = useState(false);
  const [verboseLog, setVerboseLog] = useState(Boolean(initialSettings.verboseLog));
  const [frameStride, setFrameStride] = useState(Number.isInteger(initialSettings.frameStride) ? initialSettings.frameStride : 1);
  const [dumpDetail, setDumpDetail] = useState(Boolean(initialSettings.dumpDetail));
  const [enableProfiling, setEnableProfiling] = useState(
    initialSettings.enableProfiling === undefined ? true : Boolean(initialSettings.enableProfiling)
  );
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [darkMode, setDarkMode] = useState(Boolean(initialSettings.darkMode));
  const [modelLoaded, setModelLoaded] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const maxCores = navigator.hardwareConcurrency || 8;
  const [cpuThreads, setCpuThreads] = useState(
    Number.isInteger(initialSettings.cpuThreads)
      ? Math.min(maxCores, Math.max(1, initialSettings.cpuThreads))
      : Math.max(1, maxCores - 2)
  );
  const modelRef = useRef(null);
  const fileInputRef = useRef(null);
  const modelFolderInputRef = useRef(null);
  const audioRef = useRef(null);
  const localModelBlobUrlsRef = useRef([]);

  const isModelReady = modelLoaded;
  const isLoading = isModelLoading;

  // Get available languages for test samples
  const testLanguageOptions = Object.entries(SPEECH_DATASETS).map(([code, config]) => ({
    code,
    displayName: config.displayName,
  }));

  // Auto-adjust quant presets when backend changes (within available options).
  useEffect(() => {
    setEncoderQuant((current) =>
      encoderQuantOptions.includes(current) ? current : pickPreferredQuant(encoderQuantOptions, backend, 'encoder')
    );
    setDecoderQuant((current) =>
      decoderQuantOptions.includes(current) ? current : pickPreferredQuant(decoderQuantOptions, backend, 'decoder')
    );
  }, [backend, encoderQuantOptions, decoderQuantOptions]);

  // List available branches for the selected model repo from HF refs API.
  useEffect(() => {
    if (modelSource !== MODEL_SOURCE_OPTIONS.HUGGINGFACE) return;
    let cancelled = false;
    const repoId = MODELS[selectedModel]?.repoId;

    (async () => {
      const revisions = await fetchModelRevisions(repoId);
      if (cancelled) return;
      setModelRevisions(revisions);
      setModelRevision((current) => (revisions.includes(current) ? current : revisions[0] || 'main'));
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedModel]);

  // Inspect selected repo+branch files and filter quantization options accordingly.
  useEffect(() => {
    if (modelSource !== MODEL_SOURCE_OPTIONS.HUGGINGFACE) return;
    let cancelled = false;
    const repoId = MODELS[selectedModel]?.repoId;
    const revision = modelRevision || 'main';
    if (!modelRevisions.includes(revision)) return;

    (async () => {
      const files = await fetchModelFiles(repoId, revision);
      if (cancelled) return;

      const encOptions = getAvailableQuantModes(files, 'encoder-model');
      const decOptions = getAvailableQuantModes(files, 'decoder_joint-model');
      setEncoderQuantOptions(encOptions);
      setDecoderQuantOptions(decOptions);
      setEncoderQuant((current) =>
        encOptions.includes(current) ? current : pickPreferredQuant(encOptions, backend, 'encoder')
      );
      setDecoderQuant((current) =>
        decOptions.includes(current) ? current : pickPreferredQuant(decOptions, backend, 'decoder')
      );
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedModel, modelRevision, modelRevisions, modelSource]);

  // Detect SharedArrayBuffer and threading capabilities
  useEffect(() => {
    const sabAvailable = typeof SharedArrayBuffer !== 'undefined';
    const threads = sabAvailable ? (navigator.hardwareConcurrency || 1) : 1;
    setThreadingStatus({ sab: sabAvailable, threads });
  }, []);

  useEffect(() => {
    saveSettings({
      modelSource,
      selectedModel,
      modelRevision,
      selectedLanguage,
      backend,
      encoderQuant,
      decoderQuant,
      preprocessor,
      preprocessorBackend,
      verboseLog,
      frameStride,
      dumpDetail,
      enableProfiling,
      darkMode,
      cpuThreads,
    });
  }, [
    modelSource,
    selectedModel,
    modelRevision,
    selectedLanguage,
    backend,
    encoderQuant,
    decoderQuant,
    preprocessor,
    preprocessorBackend,
    verboseLog,
    frameStride,
    dumpDetail,
    enableProfiling,
    darkMode,
    cpuThreads,
  ]);

  // Cleanup audio URL on unmount
  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      for (const url of localModelBlobUrlsRef.current) {
        URL.revokeObjectURL(url);
      }
      localModelBlobUrlsRef.current = [];
    };
  }, [audioUrl]);

  // Toggle dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Restore persisted local folder handle when local source is active.
  useEffect(() => {
    let cancelled = false;
    if (modelSource !== MODEL_SOURCE_OPTIONS.LOCAL) return () => {};
    if (!localHandlePersistenceSupported) return () => {};
    if (localEntries.length > 0) return () => {};

    (async () => {
      const restored = await restorePersistedLocalFolder({ requestPermission: false });
      if (cancelled || !restored) return;
      console.log('[LocalFolder] Local folder restored automatically from persisted handle');
    })();

    return () => {
      cancelled = true;
    };
  }, [modelSource, localHandlePersistenceSupported, localEntries.length]);

  function playAudio() {
    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }

  function pauseAudio() {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }

  function handleLanguageChange(nextLanguage) {
    if (nextLanguage === selectedLanguage) return;

    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setText('');
    setReferenceText('');
    setSelectedLanguage(nextLanguage);
  }

  function handleModelChange(nextModel) {
    if (nextModel === selectedModel) return;
    setSelectedModel(nextModel);
    setModelRevisions(DEFAULT_MODEL_REVISIONS);
    setModelRevision('main');
  }

  function applyLocalEntries(entries, folderName = '') {
    console.log('[LocalFolder] Parsing selected local folder entries…', { count: entries.length, folderName });
    setLocalEntries(entries);
    setLocalFolderName(folderName);

    const encOptions = detectLocalQuantModes(entries, 'encoder-model');
    const decOptions = detectLocalQuantModes(entries, 'decoder_joint-model');
    const nextEncOptions = encOptions.length ? encOptions : ['fp32'];
    const nextDecOptions = decOptions.length ? decOptions : ['fp32'];

    setEncoderQuantOptions(nextEncOptions);
    setDecoderQuantOptions(nextDecOptions);
    setEncoderQuant((current) =>
      nextEncOptions.includes(current) ? current : pickPreferredQuant(nextEncOptions, backend, 'encoder')
    );
    setDecoderQuant((current) =>
      nextDecOptions.includes(current) ? current : pickPreferredQuant(nextDecOptions, backend, 'decoder')
    );

    const tokenizerCandidates = [];
    if (findLocalEntry(entries, 'vocab.txt')) tokenizerCandidates.push('vocab.txt');
    if (findLocalEntry(entries, 'tokens.txt')) tokenizerCandidates.push('tokens.txt');
    if (!tokenizerCandidates.length) {
      for (const entry of entries) {
        if (entry.basename.toLowerCase().endsWith('.txt')) {
          tokenizerCandidates.push(entry.basename);
        }
      }
    }
    const dedupedTokenizer = [...new Set(tokenizerCandidates)];
    if (dedupedTokenizer.length) {
      setLocalTokenizerOptions(dedupedTokenizer);
      setLocalTokenizerName((current) => (dedupedTokenizer.includes(current) ? current : dedupedTokenizer[0]));
    }

    const preprocessorCandidates = [];
    if (findLocalEntry(entries, 'nemo128.onnx')) preprocessorCandidates.push('nemo128');
    if (findLocalEntry(entries, 'nemo80.onnx')) preprocessorCandidates.push('nemo80');
    const dedupedPreprocessor = [...new Set(preprocessorCandidates)];
    if (dedupedPreprocessor.length) {
      setLocalPreprocessorOptions(dedupedPreprocessor);
      setPreprocessor((current) => (dedupedPreprocessor.includes(current) ? current : dedupedPreprocessor[0]));
    } else {
      setLocalPreprocessorOptions([]);
    }

    setLocalDetectedArtifacts({
      encoder: nextEncOptions,
      decoder: nextDecOptions,
      tokenizers: dedupedTokenizer,
      preprocessors: dedupedPreprocessor,
    });

    console.log('[LocalFolder] Detected artifacts', {
      encoder: nextEncOptions,
      decoder: nextDecOptions,
      tokenizers: dedupedTokenizer,
      preprocessors: dedupedPreprocessor,
    });
    setStatus(`Local folder selected (${entries.length} files)`);
  }

  async function restorePersistedLocalFolder({ requestPermission = false } = {}) {
    if (!localHandlePersistenceSupported) return false;
    try {
      const dirHandle = await readPersistedDirectoryHandle();
      if (!dirHandle) {
        setHasPersistedLocalHandle(false);
        setNeedsLocalHandleReconnect(false);
        return false;
      }

      setHasPersistedLocalHandle(true);
      const queryState = typeof dirHandle.queryPermission === 'function'
        ? await dirHandle.queryPermission({ mode: 'read' })
        : 'granted';

      let permissionState = queryState;
      if (permissionState !== 'granted' && requestPermission && typeof dirHandle.requestPermission === 'function') {
        permissionState = await dirHandle.requestPermission({ mode: 'read' });
      }

      if (permissionState !== 'granted') {
        setNeedsLocalHandleReconnect(true);
        console.log('[LocalFolder] Persisted folder found but permission is not granted yet');
        return false;
      }

      console.log('[LocalFolder] Restoring persisted directory handle', { name: dirHandle.name });
      const entries = await collectDirectoryFilesRecursive(dirHandle);
      applyLocalEntries(entries, dirHandle.name || '');
      setNeedsLocalHandleReconnect(false);
      setStatus(`Restored local folder "${dirHandle.name || ''}"`);
      return true;
    } catch (error) {
      console.warn('[LocalFolder] Failed to restore persisted handle, clearing it', error);
      try {
        await clearPersistedDirectoryHandle();
      } catch {}
      setHasPersistedLocalHandle(false);
      setNeedsLocalHandleReconnect(false);
      return false;
    }
  }

  async function pickLocalModelFolder() {
    try {
      console.log('[LocalFolder] Folder selection requested');
      if (typeof window !== 'undefined' && typeof window.showDirectoryPicker === 'function') {
        const dirHandle = await window.showDirectoryPicker({ mode: 'read' });
        console.log('[LocalFolder] Directory handle acquired', { name: dirHandle.name });
        const entries = await collectDirectoryFilesRecursive(dirHandle);
        applyLocalEntries(entries, dirHandle.name || '');
        if (localHandlePersistenceSupported) {
          try {
            await persistDirectoryHandle(dirHandle);
            setHasPersistedLocalHandle(true);
            setNeedsLocalHandleReconnect(false);
            console.log('[LocalFolder] Persisted directory handle for future visits');
          } catch (persistError) {
            console.warn('[LocalFolder] Could not persist directory handle', persistError);
          }
        }
        return;
      }

      if (modelFolderInputRef.current) {
        modelFolderInputRef.current.click();
        setStatus('Directory-handle persistence is unavailable in this browser. Folder will need to be reselected next visit.');
        return;
      }

      alert('Directory picker is not available in this browser. Use Chromium-based browser or provide local files via folder input.');
    } catch (error) {
      if (error?.name === 'AbortError') return;
      console.error('[LocalFolder] Failed to read directory', error);
      setStatus(`Failed to read folder: ${error.message}`);
    }
  }

  function handleLocalFolderInput(event) {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    console.log('[LocalFolder] Folder input fallback selected files', { count: files.length });
    const entries = files.map((file) => {
      const relPath = normalizeRelPath(file.webkitRelativePath || file.name);
      return {
        path: relPath,
        basename: getBasename(relPath),
        file,
      };
    });
    const folderName = entries[0]?.path?.split('/')?.[0] || '';
    applyLocalEntries(entries, folderName);
    if (!localHandlePersistenceSupported) {
      setStatus(`Local folder selected (${entries.length} files). This browser cannot persist folder access; reselect next visit.`);
    }
    event.target.value = '';
  }

  async function reconnectPersistedFolder() {
    const restored = await restorePersistedLocalFolder({ requestPermission: true });
    if (!restored) {
      setStatus('Could not restore saved folder access. Please choose folder again.');
    }
  }

  // Fetch random audio sample from HuggingFace speech dataset
  async function loadRandomSample() {
    if (!modelRef.current) return;

    if (!hasTestSamples(selectedLanguage)) {
      alert(`No test dataset available for ${LANGUAGE_NAMES[selectedLanguage] || selectedLanguage}.`);
      return;
    }

    setIsLoadingSample(true);
    setReferenceText('');
    setText('');
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }

    try {
      const sample = await fetchRandomSample(selectedLanguage, {
        targetSampleRate: 16000,
        onProgress: ({ message }) => setStatus(message),
      });

      // Create audio blob for playback
      const wavBlob = pcmToWavBlob(sample.pcm, 16000);
      const url = URL.createObjectURL(wavBlob);
      setAudioUrl(url);

      setReferenceText(sample.transcription);
      console.log(`[Dataset] Reference: "${sample.transcription}"`);

      setStatus('Transcribing…');
      setIsTranscribing(true);

      console.time('Transcribe-Sample');
      const res = await modelRef.current.transcribe(sample.pcm, 16000, {
        returnTimestamps: true,
        returnConfidences: true,
        frameStride,
        enableProfiling
      });
      console.timeEnd('Transcribe-Sample');

      if (dumpDetail) {
        console.log('[Dataset] Transcription result:', res);
      }

      setText(res.utterance_text);
      setLatestMetrics(res.metrics);

      const langName = LANGUAGE_NAMES[selectedLanguage] || selectedLanguage;
      const datasetName = sample.dataset.split('/').pop();
      const newTranscription = {
        id: Date.now(),
        filename: `${datasetName}-${langName}-#${sample.sampleIndex}`,
        text: res.utterance_text,
        reference: sample.transcription,
        timestamp: new Date().toLocaleTimeString(),
        duration: sample.duration,
        wordCount: res.words?.length || 0,
        confidence: res.confidence_scores?.token_avg ?? res.confidence_scores?.word_avg ?? null,
        metrics: res.metrics,
        language: selectedLanguage
      };
      setTranscriptions(prev => [newTranscription, ...prev]);
      setStatus('Model ready');

    } catch (error) {
      console.error('[Dataset] Error:', error);
      setStatus(`Error: ${error.message}`);
    } finally {
      setIsLoadingSample(false);
      setIsTranscribing(false);
    }
  }

  async function loadModel() {
    const isLocalSource = modelSource === MODEL_SOURCE_OPTIONS.LOCAL;
    setIsModelLoading(true);
    setStatus(isLocalSource ? 'Preparing local model…' : 'Downloading model…');
    setProgressText('');
    setProgressPct(isLocalSource ? null : 0);
    console.time('LoadModel');

    try {
      for (const url of localModelBlobUrlsRef.current) {
        URL.revokeObjectURL(url);
      }
      localModelBlobUrlsRef.current = [];

      if (isLocalSource) {
        console.log('[LocalFolder] Starting model load from local artifacts');
        if (!localEntries.length) {
          throw new Error('Pick a local model folder first.');
        }

        const createdBlobUrls = [];
        const toBlobUrl = (file) => {
          const url = URL.createObjectURL(file);
          createdBlobUrls.push(url);
          return url;
        };

        const encoderName = quantizedModelName('encoder-model', encoderQuant);
        const decoderName = quantizedModelName('decoder_joint-model', decoderQuant);
        const encoderEntry = findLocalEntry(localEntries, encoderName);
        const decoderEntry = findLocalEntry(localEntries, decoderName);
        const tokenizerEntry = findLocalEntry(localEntries, localTokenizerName);
        console.log('[LocalFolder] Selected artifacts', {
          encoder: encoderName,
          decoder: decoderName,
          tokenizer: localTokenizerName,
          preprocessorBackend,
          preprocessor: preprocessorBackend === 'onnx' ? `${preprocessor}.onnx` : null,
        });

        if (!encoderEntry) throw new Error(`Missing encoder file: ${encoderName}`);
        if (!decoderEntry) throw new Error(`Missing decoder file: ${decoderName}`);
        if (!tokenizerEntry) throw new Error(`Missing tokenizer file: ${localTokenizerName}`);

        const cfg = {
          encoderUrl: toBlobUrl(await getEntryFile(encoderEntry)),
          decoderUrl: toBlobUrl(await getEntryFile(decoderEntry)),
          tokenizerUrl: toBlobUrl(await getEntryFile(tokenizerEntry)),
          filenames: {
            encoder: encoderEntry.basename,
            decoder: decoderEntry.basename,
          },
          preprocessorBackend,
          backend,
          verbose: verboseLog,
          cpuThreads,
        };

        if (preprocessorBackend === 'onnx') {
          const preprocessorName = `${preprocessor}.onnx`;
          const preprocessorEntry = findLocalEntry(localEntries, preprocessorName);
          if (!preprocessorEntry) {
            throw new Error(`Missing preprocessor file: ${preprocessorName} (switch to JS preprocessor or add file to folder).`);
          }
          cfg.preprocessorUrl = toBlobUrl(await getEntryFile(preprocessorEntry));
        }

        const encoderDataEntry = findLocalEntry(localEntries, `${encoderEntry.basename}.data`);
        if (encoderDataEntry) {
          cfg.encoderDataUrl = toBlobUrl(await getEntryFile(encoderDataEntry));
        }
        const decoderDataEntry = findLocalEntry(localEntries, `${decoderEntry.basename}.data`);
        if (decoderDataEntry) {
          cfg.decoderDataUrl = toBlobUrl(await getEntryFile(decoderDataEntry));
        }

        setStatus('Compiling model…');
        setProgressText('Compiling local model artifacts');
        setProgressPct(null);

        console.log('[LocalFolder] Calling ParakeetModel.fromUrls with local blob URLs');
        modelRef.current = await ParakeetModel.fromUrls(cfg);
        localModelBlobUrlsRef.current = createdBlobUrls;
        console.log('[LocalFolder] Model sessions created from local artifacts');
      } else {
      console.log('[Hub] Starting model load from HuggingFace');
      const progressCallback = ({ loaded, total, file }) => {
        const pct = total > 0 ? Math.round((loaded / total) * 100) : 0;
        setProgressText(`${file}: ${pct}%`);
        setProgressPct(pct);
      };

      const modelLoadResult = await loadModelWithFallback({
        repoIdOrModelKey: selectedModel,
        options: {
          revision: modelRevision,
          encoderQuant,
          decoderQuant,
          preprocessor,
          preprocessorBackend,
          backend,
          progress: progressCallback,
          verbose: verboseLog,
          cpuThreads,
        },
        getParakeetModelFn: getParakeetModel,
        fromUrlsFn: ParakeetModel.fromUrls,
        onBeforeCompile: ({ attempt, modelUrls }) => {
          const resolvedQuant = formatResolvedQuantization(modelUrls.quantisation);
          console.log(`[App] ${resolvedQuant}`);

          if (attempt === 2) {
            setStatus('Retrying compile with FP32…');
            setProgressText(`${resolvedQuant} · retrying after FP16 compile failure`);
          } else {
            setStatus('Compiling model…');
            setProgressText(`${resolvedQuant} · compiling may take ~10s on first load`);
          }
          setProgressPct(null);
        },
      });

      modelRef.current = modelLoadResult.model;
      console.log('[Hub] Model sessions created from HuggingFace artifacts');
      }

      setStatus('Verifying…');
      setProgressText('Running test transcription');
      console.log('[LoadModel] Running warm-up verification transcription');
      const expectedText = 'it is not life as we know or understand it';

      try {
        // Use GitHub raw URL for the test audio file
        const audioUrl = './assets/life_Jim.wav';
        const audioBlob = await getCachedAudioFile(audioUrl, 'life_Jim.wav');
        const buf = await audioBlob.arrayBuffer();
        const audioCtx = new AudioContext({ sampleRate: 16000 });
        const decoded = await audioCtx.decodeAudioData(buf);
        const pcm = decoded.getChannelData(0);

        const { utterance_text } = await modelRef.current.transcribe(pcm, 16000, { enableProfiling });
        const normalize = (str) => str.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");

        if (normalize(utterance_text).includes(normalize(expectedText))) {
          console.log('[App] Model verification successful.');
          setStatus('Model ready');
          setModelLoaded(true);
        } else {
          console.error(`[App] Verification failed! Expected: "${expectedText}", Got: "${utterance_text}"`);
          setStatus('Verification failed');
        }
      } catch (err) {
        console.error('[App] Warm-up failed', err);
        setStatus('Warm-up failed');
      }

      console.timeEnd('LoadModel');
      setProgressText('');
      setProgressPct(null);
    } catch (e) {
      console.error(e);
      setStatus(`Failed: ${e.message}`);
    } finally {
      setIsModelLoading(false);
    }
  }

  async function transcribeFile(e) {
    if (!modelRef.current) return alert('Load model first');
    const file = e.target.files?.[0];
    if (!file) return;

    setText('');
    setReferenceText('');
    setIsTranscribing(true);
    setStatus(`Transcribing "${file.name}"…`);

    try {
      const buf = await file.arrayBuffer();
      const audioCtx = new AudioContext({ sampleRate: 16000 });
      const decoded = await audioCtx.decodeAudioData(buf);
      const pcm = decoded.getChannelData(0);

      console.time(`Transcribe-${file.name}`);
      const res = await modelRef.current.transcribe(pcm, 16_000, {
        returnTimestamps: true,
        returnConfidences: true,
        frameStride,
        enableProfiling
      });
      console.timeEnd(`Transcribe-${file.name}`);

      if (dumpDetail) {
        console.log('[Parakeet] Result:', res);
      }
      setLatestMetrics(res.metrics);

      const newTranscription = {
        id: Date.now(),
        filename: file.name,
        text: res.utterance_text,
        timestamp: new Date().toLocaleTimeString(),
        duration: pcm.length / 16000,
        wordCount: res.words?.length || 0,
        confidence: res.confidence_scores?.token_avg ?? res.confidence_scores?.word_avg ?? null,
        metrics: res.metrics
      };

      setTranscriptions(prev => [newTranscription, ...prev]);
      setText(res.utterance_text);
      setStatus('Model ready');

    } catch (error) {
      console.error('Transcription failed:', error);
      setStatus('Transcription failed');
      alert(`Failed: ${error.message}`);
    } finally {
      setIsTranscribing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  function clearTranscriptions() {
    setTranscriptions([]);
    setText('');
    setReferenceText('');
    setLatestMetrics(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
  }

  const parakeetVersion = typeof __PARAKEET_VERSION__ !== 'undefined' ? __PARAKEET_VERSION__ : 'unknown';
  const parakeetSource = typeof __PARAKEET_SOURCE__ !== 'undefined' ? __PARAKEET_SOURCE__ : 'unknown';

  return (
    <div className="bg-background-light dark:bg-background-dark text-gray-800 dark:text-gray-200 font-sans min-h-screen p-6 md:p-10 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              Parakeet.js Demo
            </h1>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              <div>parakeet.js {parakeetVersion} ({parakeetSource})</div>
            </div>
          </div>
          <button
            className="flex items-center justify-center p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            onClick={() => setDarkMode(!darkMode)}
          >
            <span className="material-icons-outlined text-gray-600 dark:text-gray-300">
              brightness_4
            </span>
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left Column - Model Configuration */}
          <div className="lg:col-span-1 flex flex-col gap-4">
            <div className="bg-card-light dark:bg-card-dark rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-5">
                Model Configuration
              </h2>
              <div className="space-y-4">
                {/* Model Selection */}
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Model Source
                  </label>
                  <div className="relative">
                    <select
                      value={modelSource}
                      onChange={(e) => setModelSource(e.target.value)}
                      disabled={isLoading || isModelReady}
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-primary focus:border-primary dark:text-white appearance-none"
                    >
                      <option value={MODEL_SOURCE_OPTIONS.HUGGINGFACE}>HuggingFace</option>
                      <option value={MODEL_SOURCE_OPTIONS.LOCAL}>Local folder</option>
                    </select>
                    <span className="material-icons-outlined absolute right-2 top-2 text-gray-400 pointer-events-none text-lg">
                      expand_more
                    </span>
                  </div>
                </div>

                {modelSource === MODEL_SOURCE_OPTIONS.HUGGINGFACE && (
                  <>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Model
                  </label>
                  <div className="relative">
                    <select
                      value={selectedModel}
                      onChange={e => handleModelChange(e.target.value)}
                      disabled={isLoading || isModelReady}
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-primary focus:border-primary dark:text-white appearance-none"
                    >
                      {MODEL_OPTIONS.map(opt => (
                        <option key={opt.key} value={opt.key}>
                          {opt.displayName}
                        </option>
                      ))}
                    </select>
                    <span className="material-icons-outlined absolute right-2 top-2 text-gray-400 pointer-events-none text-lg">
                      expand_more
                    </span>
                  </div>
                </div>
                  </>
                )}

                {modelSource === MODEL_SOURCE_OPTIONS.LOCAL && (
                  <div className="space-y-2">
                    <input
                      ref={modelFolderInputRef}
                      type="file"
                      webkitdirectory=""
                      directory=""
                      multiple
                      onChange={handleLocalFolderInput}
                      className="hidden"
                    />
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                      Local Model Folder
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-200 truncate">
                        {localFolderName || 'No folder selected'}
                      </div>
                      <button
                        onClick={pickLocalModelFolder}
                        disabled={isLoading || isModelReady}
                        title="Browse local model folder"
                        className="h-[38px] w-[38px] flex items-center justify-center rounded-lg bg-yellow-400 hover:bg-yellow-500 text-gray-900 border border-yellow-500 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="material-icons-outlined text-lg">folder_open</span>
                      </button>
                    </div>
                    {localHandlePersistenceSupported && hasPersistedLocalHandle && needsLocalHandleReconnect && (
                      <button
                        onClick={reconnectPersistedFolder}
                        disabled={isLoading || isModelReady}
                        className="w-full bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-100 font-medium py-2 px-4 rounded-lg transition-all border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Restore Saved Folder
                      </button>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {localEntries.length
                        ? `Selected ${localEntries.length} files${localFolderName ? ` from "${localFolderName}"` : ''}.`
                        : 'Pick a folder containing encoder/decoder ONNX files and tokenizer text.'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {localHandlePersistenceSupported
                        ? 'Folder access can be persisted in this browser (you may be asked permission on revisit).'
                        : 'This browser cannot persist folder access for local models. User must reselect folder on next visit.'}
                    </p>
                    {localEntries.length > 0 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                        <p>Encoder dtypes: {localDetectedArtifacts.encoder.length ? localDetectedArtifacts.encoder.join(', ') : 'none'}</p>
                        <p>Decoder dtypes: {localDetectedArtifacts.decoder.length ? localDetectedArtifacts.decoder.join(', ') : 'none'}</p>
                        <p>Tokenizers: {localDetectedArtifacts.tokenizers.length ? localDetectedArtifacts.tokenizers.join(', ') : 'none'}</p>
                        <p>Preprocessors: {localDetectedArtifacts.preprocessors.length ? localDetectedArtifacts.preprocessors.join(', ') : 'none'}</p>
                      </div>
                    )}
                  </div>
                )}
                {modelSource === MODEL_SOURCE_OPTIONS.HUGGINGFACE && (
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                      Model Branch
                    </label>
                    <div className="relative">
                      <select
                        value={modelRevision}
                        onChange={e => setModelRevision(e.target.value)}
                        disabled={isLoading || isModelReady}
                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-primary focus:border-primary dark:text-white appearance-none"
                      >
                        {modelRevisions.map(rev => (
                          <option key={rev} value={rev}>
                            {rev}
                          </option>
                        ))}
                      </select>
                      <span className="material-icons-outlined absolute right-2 top-2 text-gray-400 pointer-events-none text-lg">
                        expand_more
                      </span>
                    </div>
                  </div>
                )}

                {/* Backend and Precision */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                      Backend
                    </label>
                    <div className="relative">
                      <select
                        value={backend}
                        onChange={e => setBackend(e.target.value)}
                        disabled={isLoading || isModelReady}
                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-primary focus:border-primary dark:text-white appearance-none"
                      >
                        <option value="webgpu-hybrid">WebGPU</option>
                        <option value="wasm">WASM</option>
                      </select>
                      <span className="material-icons-outlined absolute right-2 top-2 text-gray-400 pointer-events-none text-lg">
                        expand_more
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                      Threads
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={maxCores}
                      value={cpuThreads}
                      onChange={e => setCpuThreads(Number(e.target.value))}
                      disabled={isLoading || isModelReady}
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-primary focus:border-primary dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                      Stride
                    </label>
                    <input
                      type="number"
                      value={frameStride}
                      onChange={e => setFrameStride(Number(e.target.value))}
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-primary focus:border-primary dark:text-white"
                    />
                  </div>
                </div>

                {/* Encoder */}
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Encoder
                  </label>
                  <div className="relative">
                    <select
                      value={encoderQuant}
                      onChange={e => setEncoderQuant(e.target.value)}
                      disabled={isLoading || isModelReady}
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-primary focus:border-primary dark:text-white appearance-none"
                    >
                      {encoderQuantOptions.map((quant) => (
                        <option key={quant} value={quant}>{quant}</option>
                      ))}
                    </select>
                    <span className="material-icons-outlined absolute right-2 top-2 text-gray-400 pointer-events-none text-lg">
                      expand_more
                    </span>
                  </div>
                </div>

                {/* Decoder */}
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Decoder
                  </label>
                  <div className="relative">
                    <select
                      value={decoderQuant}
                      onChange={e => setDecoderQuant(e.target.value)}
                      disabled={isLoading || isModelReady}
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-primary focus:border-primary dark:text-white appearance-none"
                    >
                      {decoderQuantOptions.map((quant) => (
                        <option key={quant} value={quant}>{quant}</option>
                      ))}
                    </select>
                    <span className="material-icons-outlined absolute right-2 top-2 text-gray-400 pointer-events-none text-lg">
                      expand_more
                    </span>
                  </div>
                </div>

                {/* Preprocessor */}
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Preprocessor
                  </label>
                  <div className="relative">
                    <select
                      value={preprocessorBackend}
                      onChange={e => setPreprocessorBackend(e.target.value)}
                      disabled={isLoading || isModelReady}
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-primary focus:border-primary dark:text-white appearance-none"
                    >
                      <option value="js">JS (mel.js)</option>
                      <option value="onnx">ONNX (nemo128.onnx)</option>
                    </select>
                    <span className="material-icons-outlined absolute right-2 top-2 text-gray-400 pointer-events-none text-lg">
                      expand_more
                    </span>
                  </div>
                  {modelSource === MODEL_SOURCE_OPTIONS.LOCAL && preprocessorBackend === 'onnx' && localPreprocessorOptions.length > 0 && (
                    <div className="relative mt-2">
                      <select
                        value={preprocessor}
                        onChange={(e) => setPreprocessor(e.target.value)}
                        disabled={isLoading || isModelReady}
                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-primary focus:border-primary dark:text-white appearance-none"
                      >
                        {localPreprocessorOptions.map((name) => (
                          <option key={name} value={name}>{name}.onnx</option>
                        ))}
                      </select>
                      <span className="material-icons-outlined absolute right-2 top-2 text-gray-400 pointer-events-none text-lg">
                        expand_more
                      </span>
                    </div>
                  )}
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {preprocessorBackend === 'js'
                      ? 'Pure JS: no ONNX download, supports streaming caching'
                      : 'ONNX WASM+SIMD: slightly faster per-call, requires nemo128.onnx download'}
                  </p>
                </div>

                {modelSource === MODEL_SOURCE_OPTIONS.LOCAL && (
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                      Tokenizer
                    </label>
                    <div className="relative">
                      <select
                        value={localTokenizerName}
                        onChange={(e) => setLocalTokenizerName(e.target.value)}
                        disabled={isLoading || isModelReady}
                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-primary focus:border-primary dark:text-white appearance-none"
                      >
                        {localTokenizerOptions.map((name) => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                      </select>
                      <span className="material-icons-outlined absolute right-2 top-2 text-gray-400 pointer-events-none text-lg">
                        expand_more
                      </span>
                    </div>
                  </div>
                )}

                {/* Toggles */}
                <div className="flex flex-col gap-3 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Verbose</span>
                    <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                      <input
                        type="checkbox"
                        checked={verboseLog}
                        onChange={e => setVerboseLog(e.target.checked)}
                        disabled={isLoading || isModelReady}
                        className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer border-gray-300 dark:border-gray-600 checked:right-0"
                        id="verbose"
                      />
                      <label
                        htmlFor="verbose"
                        className="toggle-label block overflow-hidden h-5 rounded-full bg-gray-300 dark:bg-gray-700 cursor-pointer"
                      ></label>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Log results</span>
                    <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                      <input
                        type="checkbox"
                        checked={dumpDetail}
                        onChange={e => setDumpDetail(e.target.checked)}
                        className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer border-gray-300 dark:border-gray-600 checked:right-0"
                        id="log"
                      />
                      <label
                        htmlFor="log"
                        className="toggle-label block overflow-hidden h-5 rounded-full bg-gray-300 dark:bg-gray-700 cursor-pointer"
                      ></label>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Enable profiling</span>
                    <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                      <input
                        type="checkbox"
                        checked={enableProfiling}
                        onChange={e => setEnableProfiling(e.target.checked)}
                        className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer border-gray-300 dark:border-gray-600 checked:right-0"
                        id="profiling"
                      />
                      <label
                        htmlFor="profiling"
                        className="toggle-label block overflow-hidden h-5 rounded-full bg-gray-300 dark:bg-gray-700 cursor-pointer"
                      ></label>
                    </div>
                  </div>
                </div>

                {/* Load Model Button */}
                <button
                  onClick={loadModel}
                  disabled={isLoading || isModelReady}
                  className="w-full bg-primary hover:bg-opacity-90 text-white font-medium py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="material-icons-outlined text-sm">bolt</span>
                  {isModelReady ? 'Model Loaded' : isLoading ? 'Loading…' : 'Load Model'}
                </button>

                {/* Progress */}
                {progressPct !== null && (
                  <div className="space-y-1">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1 overflow-hidden">
                      <div
                        className="bg-primary h-full transition-all duration-300"
                        style={{ width: `${progressPct}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{progressText}</p>
                  </div>
                )}
                {progressPct === null && progressText && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">{progressText}</p>
                )}
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center gap-2 px-1">
              <span className="font-medium text-gray-900 dark:text-white">Status:</span>
              <span className={`font-medium ${isModelReady ? 'text-primary' : 'text-gray-600 dark:text-gray-400'}`}>
                {status}
              </span>
            </div>

            {/* Threading Status Indicator */}
            <div className="flex items-center gap-2 px-1 mt-2">
              <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${threadingStatus.sab
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                }`}>
                <span className="material-icons-outlined text-xs">
                  {threadingStatus.sab ? 'check_circle' : 'warning'}
                </span>
                {threadingStatus.sab
                  ? `Multi-threaded (${threadingStatus.threads} cores)`
                  : 'Single-threaded'}
              </span>
            </div>
          </div>

          {/* Right Column - Test & Transcribe */}
          <div className="lg:col-span-2 space-y-6">
            {/* Test Section */}
            <div className="bg-card-light dark:bg-card-dark rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-5">
                Test & Transcribe
              </h2>

              {/* Language & Sample Controls */}
              <div className="flex flex-col md:flex-row gap-4 mb-6 items-end">
                <div className="flex-grow w-full md:w-auto">
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Language
                  </label>
                  <div className="relative">
                    <select
                      value={selectedLanguage}
                      onChange={e => handleLanguageChange(e.target.value)}
                      disabled={!isModelReady}
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-primary focus:border-primary dark:text-white appearance-none"
                    >
                      {testLanguageOptions.map(lang => (
                        <option key={lang.code} value={lang.code}>
                          {lang.displayName}
                        </option>
                      ))}
                    </select>
                    <span className="material-icons-outlined absolute right-2 top-2 text-gray-400 pointer-events-none text-lg">
                      expand_more
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  {audioUrl && (
                    <>
                      <audio
                        ref={audioRef}
                        src={audioUrl}
                        onEnded={() => setIsPlaying(false)}
                        onPause={() => setIsPlaying(false)}
                        onPlay={() => setIsPlaying(true)}
                      />
                      <button
                        onClick={isPlaying ? pauseAudio : playAudio}
                        className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-white rounded-full w-[38px] h-[38px] flex items-center justify-center shadow-sm transition-all flex-shrink-0 group border border-gray-300 dark:border-gray-600"
                        title={isPlaying ? 'Pause' : 'Play Sample'}
                      >
                        <span className="material-icons-outlined text-lg text-primary group-hover:text-primary/80">
                          {isPlaying ? 'pause' : 'play_arrow'}
                        </span>
                      </button>
                    </>
                  )}
                  <button
                    onClick={loadRandomSample}
                    disabled={!isModelReady || isLoadingSample || isTranscribing}
                    className="bg-primary hover:bg-opacity-90 text-white font-medium py-2 px-4 rounded-lg whitespace-nowrap shadow-sm transition-all text-sm h-[38px] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoadingSample ? 'Loading…' : `Load ${LANGUAGE_NAMES[selectedLanguage]} Sample`}
                  </button>
                </div>
              </div>

              {/* File Upload Area */}
              <div className="relative border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-800/50 p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={transcribeFile}
                  disabled={!isModelReady || isTranscribing}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />
                <span className="material-icons-outlined text-4xl text-gray-400 group-hover:text-primary mb-2 transition-colors">
                  cloud_upload
                </span>
                <p className="text-gray-500 dark:text-gray-400 font-medium">
                  Drag & drop audio file here, or click to select
                </p>
                <p className="text-xs text-gray-400 mt-1">Supports .wav, .mp3, .ogg</p>
              </div>
            </div>

            {/* Transcription Comparison */}
            <div className="bg-card-light dark:bg-card-dark rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 flex flex-col h-full">
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-6">
                Transcription Comparison
              </h2>

              <div className="space-y-6">
                {/* Transcription */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                      Transcription
                    </label>
                    {text && (
                      <button
                        onClick={() => copyToClipboard(text)}
                        className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-primary bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded border border-gray-200 dark:border-gray-700 transition-colors"
                      >
                        <span className="material-icons-outlined text-xs">content_copy</span>
                        Copy
                      </button>
                    )}
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 min-h-[160px]">
                    <p className="text-lg leading-relaxed text-gray-800 dark:text-gray-200 font-medium">
                      {text || 'Transcription will appear here...'}
                    </p>
                  </div>
                </div>

                {/* Reference Text */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                      Reference Text
                    </label>
                    {referenceText && (
                      <button
                        onClick={() => copyToClipboard(referenceText)}
                        className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-primary bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded border border-gray-200 dark:border-gray-700 transition-colors"
                      >
                        <span className="material-icons-outlined text-xs">content_copy</span>
                        Copy
                      </button>
                    )}
                  </div>
                  <textarea
                    value={referenceText}
                    onChange={e => setReferenceText(e.target.value)}
                    className="w-full min-h-[160px] bg-white dark:bg-gray-900/50 rounded-lg p-4 border border-primary dark:border-primary/50 text-lg leading-relaxed text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-primary focus:border-primary placeholder-gray-400 dark:placeholder-gray-600 resize-y"
                    placeholder="Paste or type reference text here for comparison..."
                  />
                </div>
              </div>

              {/* Performance Metrics */}
              {latestMetrics && (
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex flex-wrap gap-4 text-xs font-mono text-gray-600 dark:text-gray-400">
                    <span><strong className="text-gray-900 dark:text-white">RTF:</strong> {latestMetrics.rtf?.toFixed(2)}x</span>
                    <span><strong className="text-gray-900 dark:text-white">Total:</strong> {latestMetrics.total_ms?.toFixed(0)}ms</span>
                    <span><strong className="text-gray-900 dark:text-white">Encode:</strong> {latestMetrics.encode_ms?.toFixed(0)}ms</span>
                    <span><strong className="text-gray-900 dark:text-white">Decode:</strong> {latestMetrics.decode_ms?.toFixed(0)}ms</span>
                  </div>
                </div>
              )}
            </div>

            {/* History */}
            {transcriptions.length > 0 && (
              <div className="bg-card-light dark:bg-card-dark rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Transcription History
                  </h2>
                  <button
                    onClick={clearTranscriptions}
                    className="text-xs font-medium text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                  >
                    Clear All
                  </button>
                </div>
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {transcriptions.map(trans => (
                    <div key={trans.id} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {trans.filename}
                          {trans.language && (
                            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                              ({LANGUAGE_NAMES[trans.language]})
                            </span>
                          )}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {trans.timestamp}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mb-2 font-mono">
                        {trans.duration.toFixed(1)}s · {trans.wordCount} words
                        {trans.confidence && ` · ${(trans.confidence * 100).toFixed(0)}% conf`}
                        {trans.metrics && ` · RTF ${trans.metrics.rtf?.toFixed(2)}x`}
                      </div>
                      {trans.reference && (
                        <div className="mb-2 p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded text-sm text-emerald-800 dark:text-emerald-300">
                          <strong>Ref:</strong> {trans.reference}
                        </div>
                      )}
                      <div className="text-sm text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-900/30 p-3 rounded border border-gray-200 dark:border-gray-700">
                        {trans.text}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Warning for SharedArrayBuffer */}
        {typeof SharedArrayBuffer === 'undefined' && backend === 'wasm' && (
          <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm text-yellow-800 dark:text-yellow-200">
            <strong>Warning:</strong> SharedArrayBuffer unavailable. WASM will run single-threaded.
          </div>
        )}
      </div>
    </div>
  );
}
