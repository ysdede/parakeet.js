import React, { useState, useRef, useEffect } from 'react';
import { ParakeetModel, getParakeetModel, MODELS, LANGUAGE_NAMES } from 'parakeet.js';
import { fetchRandomSample, hasTestSamples, SPEECH_DATASETS } from './utils/speechDatasets';
import './App.css';

// Available models for selection
const MODEL_OPTIONS = Object.entries(MODELS).map(([key, config]) => ({
  key,
  repoId: config.repoId,
  displayName: config.displayName,
  languages: config.languages,
}));

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
  const [selectedModel, setSelectedModel] = useState('parakeet-tdt-0.6b-v2');
  const modelConfig = MODELS[selectedModel];
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [backend, setBackend] = useState('webgpu-hybrid');
  const [encoderQuant, setEncoderQuant] = useState('fp32');
  const [decoderQuant, setDecoderQuant] = useState('int8');
  const [preprocessor, setPreprocessor] = useState('nemo128');
  const [status, setStatus] = useState('Idle');
  const [progressText, setProgressText] = useState('');
  const [progressPct, setProgressPct] = useState(null);
  const [text, setText] = useState('');
  const [referenceText, setReferenceText] = useState('');
  const [latestMetrics, setLatestMetrics] = useState(null);
  const [transcriptions, setTranscriptions] = useState([]);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isLoadingSample, setIsLoadingSample] = useState(false);
  const [verboseLog, setVerboseLog] = useState(false);
  const [frameStride, setFrameStride] = useState(1);
  const [dumpDetail, setDumpDetail] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const maxCores = navigator.hardwareConcurrency || 8;
  const [cpuThreads, setCpuThreads] = useState(Math.max(1, maxCores - 2));
  const modelRef = useRef(null);
  const fileInputRef = useRef(null);
  const audioRef = useRef(null);

  const isModelReady = modelLoaded;
  const isLoading = !modelLoaded && status !== 'Idle' && !status.toLowerCase().includes('fail');

  // Get available languages for test samples
  const testLanguageOptions = Object.entries(SPEECH_DATASETS).map(([code, config]) => ({
    code,
    displayName: config.displayName,
  }));

  // Auto-adjust quant presets when backend changes
  useEffect(() => {
    if (backend.startsWith('webgpu')) {
      setEncoderQuant('fp32');
      setDecoderQuant('int8');
    } else {
      setEncoderQuant('int8');
      setDecoderQuant('int8');
    }
  }, [backend]);

  // Cleanup audio URL on unmount
  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
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
        frameStride
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
      setStatus('Model ready ✔');

    } catch (error) {
      console.error('[Dataset] Error:', error);
      setStatus(`Error: ${error.message}`);
    } finally {
      setIsLoadingSample(false);
      setIsTranscribing(false);
    }
  }

  async function loadModel() {
    setStatus('Downloading model…');
    setProgressText('');
    setProgressPct(0);
    console.time('LoadModel');

    try {
      const progressCallback = ({ loaded, total, file }) => {
        const pct = total > 0 ? Math.round((loaded / total) * 100) : 0;
        setProgressText(`${file}: ${pct}%`);
        setProgressPct(pct);
      };

      const modelUrls = await getParakeetModel(selectedModel, { 
        encoderQuant,
        decoderQuant,
        preprocessor,
        backend,
        progress: progressCallback 
      });

      setStatus('Compiling model…');
      setProgressText('This may take ~10s on first load');
      setProgressPct(null);

      modelRef.current = await ParakeetModel.fromUrls({ 
        ...modelUrls.urls,
        filenames: modelUrls.filenames,
        backend, 
        verbose: verboseLog,
        cpuThreads,
      });

      setStatus('Verifying…');
      setProgressText('Running test transcription');
      const expectedText = 'it is not life as we know or understand it';
      
      try {
        const audioRes = await fetch('/assets/life_Jim.wav');
        const buf = await audioRes.arrayBuffer();
        const audioCtx = new AudioContext({ sampleRate: 16000 });
        const decoded = await audioCtx.decodeAudioData(buf);
        const pcm = decoded.getChannelData(0);
        
        const { utterance_text } = await modelRef.current.transcribe(pcm, 16000);
        const normalize = (str) => str.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");

        if (normalize(utterance_text).includes(normalize(expectedText))) {
          console.log('[App] Model verification successful.');
          setStatus('Model ready ✔');
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
    }
  }

  async function transcribeFile(e) {
    if (!modelRef.current) return alert('Load model first');
    const file = e.target.files?.[0];
    if (!file) return;

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
        frameStride
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
      setStatus('Model ready ✔');
      
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

  return (
    <div className="bg-background-light dark:bg-background-dark text-gray-800 dark:text-gray-200 font-sans min-h-screen p-6 md:p-10 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Parakeet.js Demo
          </h1>
          <button 
            className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
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
                    Model
                  </label>
                  <div className="relative">
                    <select 
                      value={selectedModel}
                      onChange={e => setSelectedModel(e.target.value)}
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
                      <option value="fp32">fp32</option>
                      <option value="int8">int8</option>
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
                      <option value="int8">int8</option>
                      <option value="fp32">fp32</option>
                    </select>
                    <span className="material-icons-outlined absolute right-2 top-2 text-gray-400 pointer-events-none text-lg">
                      expand_more
                    </span>
                  </div>
                </div>

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
                      onChange={e => setSelectedLanguage(e.target.value)}
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
