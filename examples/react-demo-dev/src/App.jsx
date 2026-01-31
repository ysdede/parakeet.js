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
  const maxCores = navigator.hardwareConcurrency || 8;
  const [cpuThreads, setCpuThreads] = useState(Math.max(1, maxCores - 2));
  const modelRef = useRef(null);
  const fileInputRef = useRef(null);

  const isModelReady = status === 'Model ready ✔';
  const isLoading = status !== 'Idle' && !status.toLowerCase().includes('fail') && !isModelReady;

  // Get available languages for test samples (not model languages)
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

    try {
      const sample = await fetchRandomSample(selectedLanguage, {
        targetSampleRate: 16000,
        onProgress: ({ message }) => setStatus(message),
      });

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
  }

  return (
    <div className="app">
      <h2>Parakeet.js Demo</h2>

      {/* Model Configuration Section */}
      <div className="section">
        <div className="section-header">Model Configuration</div>
        <div className="controls">
          <label>
            Model:
            <select 
              value={selectedModel} 
              onChange={e => setSelectedModel(e.target.value)}
              disabled={isLoading || isModelReady}
            >
              {MODEL_OPTIONS.map(opt => (
                <option key={opt.key} value={opt.key}>
                  {opt.displayName}
                </option>
              ))}
            </select>
          </label>
          <label>
            Backend:
            <select value={backend} onChange={e=>setBackend(e.target.value)} disabled={isLoading || isModelReady}>
              <option value="webgpu-hybrid">WebGPU</option>
              <option value="wasm">WASM (CPU)</option>
            </select>
          </label>
          <label>
            Encoder:
            <select value={encoderQuant} onChange={e=>setEncoderQuant(e.target.value)} disabled={isLoading || isModelReady}>
              <option value="fp32">fp32</option>
              <option value="int8">int8</option>
            </select>
          </label>
          <label>
            Decoder:
            <select value={decoderQuant} onChange={e=>setDecoderQuant(e.target.value)} disabled={isLoading || isModelReady}>
              <option value="int8">int8</option>
              <option value="fp32">fp32</option>
            </select>
          </label>
        </div>
        
        <div className="controls">
          <label>
            Threads:
            <input 
              type="number" 
              min="1" 
              max={maxCores} 
              value={cpuThreads} 
              onChange={e=>setCpuThreads(Number(e.target.value))} 
              style={{width:'3.5rem'}} 
              disabled={isLoading || isModelReady}
            />
          </label>
          <label>
            Stride:
            <select value={frameStride} onChange={e=>setFrameStride(Number(e.target.value))}>
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={4}>4</option>
            </select>
          </label>
          <label>
            <input type="checkbox" checked={verboseLog} onChange={e => setVerboseLog(e.target.checked)} disabled={isLoading || isModelReady} />
            Verbose
          </label>
          <label>
            <input type="checkbox" checked={dumpDetail} onChange={e=>setDumpDetail(e.target.checked)} />
            Log results
          </label>
        </div>

        <div className="controls">
          <button 
            onClick={loadModel} 
            disabled={isLoading || isModelReady}
            className={isModelReady ? 'btn-primary btn-loaded' : 'btn-primary'}
          >
            {isModelReady ? '✓ Model Loaded' : isLoading ? 'Loading…' : 'Load Model'}
          </button>
        </div>

        {/* Progress indicator */}
        {progressPct !== null && (
          <div className="progress-wrapper">
            <div className="progress-bar"><div style={{ width: `${progressPct}%` }} /></div>
            <p className="progress-text">{progressText}</p>
          </div>
        )}
        {progressPct === null && progressText && (
          <p className="progress-text">{progressText}</p>
        )}
      </div>

      {/* SharedArrayBuffer warning */}
      {typeof SharedArrayBuffer === 'undefined' && backend === 'wasm' && (
        <div className="warning-box">
          ⚠️ SharedArrayBuffer unavailable. WASM will run single-threaded.
        </div>
      )}

      {/* Status bar */}
      <div className="status-bar">
        Status: <span className={isModelReady ? 'status-ready' : ''}>{status}</span>
      </div>

      {/* Quick Test Section - disabled until model loads */}
      <div className={`test-section ${!isModelReady ? 'disabled' : ''}`}>
        <div className="test-section-header">
          <span className="test-section-title">Quick Test with Sample Audio</span>
          {!isModelReady && <span className="test-section-hint">Load model first</span>}
        </div>
        
        <div className="test-controls">
          <label>
            Language:
            <select 
              value={selectedLanguage} 
              onChange={e => setSelectedLanguage(e.target.value)}
              disabled={!isModelReady}
            >
              {testLanguageOptions.map(lang => (
                <option key={lang.code} value={lang.code}>
                  {lang.displayName}
                </option>
              ))}
            </select>
          </label>
          
          <button 
            onClick={loadRandomSample}
            disabled={!isModelReady || isLoadingSample || isTranscribing}
            className="btn-secondary"
          >
            {isLoadingSample ? 'Loading…' : `Load ${LANGUAGE_NAMES[selectedLanguage]} Sample`}
          </button>
        </div>

        {referenceText && (
          <div className="reference-box">
            <div className="reference-label">Reference (Ground Truth):</div>
            <div className="reference-text">{referenceText}</div>
          </div>
        )}
      </div>

      {/* File upload */}
      <div className="controls">
        <div className="file-input-wrapper">
          <input 
            ref={fileInputRef}
            type="file" 
            accept="audio/*" 
            onChange={transcribeFile} 
            disabled={!isModelReady || isTranscribing} 
          />
          {transcriptions.length > 0 && (
            <button onClick={clearTranscriptions} className="btn-ghost">
              Clear History
            </button>
          )}
        </div>
      </div>

      {/* Latest transcription */}
      <div style={{ marginBottom: '1rem' }}>
        <h3 style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>Transcription Result</h3>
        <textarea 
          value={text} 
          readOnly 
          className="textarea"
          placeholder="Transcribed text will appear here..."
        />
      </div>

      {/* Performance metrics */}
      {latestMetrics && (
        <div className="performance">
          <strong>RTF:</strong> {latestMetrics.rtf?.toFixed(2)}x &nbsp;|&nbsp; 
          <strong>Total:</strong> {latestMetrics.total_ms?.toFixed(0)}ms &nbsp;|&nbsp;
          Encode {latestMetrics.encode_ms?.toFixed(0)}ms · 
          Decode {latestMetrics.decode_ms?.toFixed(0)}ms
        </div>
      )}

      {/* Transcription history */}
      {transcriptions.length > 0 && (
        <div className="history">
          <div className="history-scroll">
            {transcriptions.map((trans) => (
              <div className="history-item" key={trans.id}>
                <div className="history-meta">
                  <span>
                    <strong>{trans.filename}</strong>
                    {trans.language && <span className="history-lang">({LANGUAGE_NAMES[trans.language]})</span>}
                  </span>
                  <span>{trans.timestamp}</span>
                </div>
                <div className="history-stats">
                  {trans.duration.toFixed(1)}s · {trans.wordCount} words
                  {trans.confidence && ` · ${(trans.confidence * 100).toFixed(0)}% conf`}
                  {trans.metrics && ` · RTF ${trans.metrics.rtf?.toFixed(2)}x`}
                </div>
                {trans.reference && (
                  <div className="history-reference">
                    <strong>Ref:</strong> {trans.reference}
                  </div>
                )}
                <div className="history-text">{trans.text}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
