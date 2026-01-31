import React, { useState, useRef, useEffect } from 'react';
import { ParakeetModel, getParakeetModel, MODELS, LANGUAGES, getSpeechDatasetUrl } from 'parakeet.js';
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
  const repoId = modelConfig?.repoId || selectedModel;
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [backend, setBackend] = useState('webgpu-hybrid');
  const [encoderQuant, setEncoderQuant] = useState('fp32');
  const [decoderQuant, setDecoderQuant] = useState('int8');
  const [preprocessor, setPreprocessor] = useState('nemo128');
  const [status, setStatus] = useState('Idle');
  const [progress, setProgress] = useState('');
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

  // Get available languages for selected model
  const availableLanguages = modelConfig?.languages || ['en'];
  const languageOptions = availableLanguages.map(lang => ({
    code: lang,
    ...LANGUAGES[lang]
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

  // Reset language to default when model changes (if current language not supported)
  useEffect(() => {
    const supportedLangs = MODELS[selectedModel]?.languages || ['en'];
    if (!supportedLangs.includes(selectedLanguage)) {
      setSelectedLanguage(MODELS[selectedModel]?.defaultLanguage || 'en');
    }
  }, [selectedModel]);

  // Fetch random audio sample from HuggingFace speech dataset
  async function fetchRandomSample() {
    if (!modelRef.current) {
      alert('Please load the model first');
      return;
    }

    const datasetInfo = getSpeechDatasetUrl(selectedLanguage);
    if (!datasetInfo) {
      alert(`No test dataset available for ${LANGUAGES[selectedLanguage]?.displayName || selectedLanguage}. Try English, French, German, Spanish, Italian, Portuguese, Dutch, or Polish.`);
      return;
    }

    setIsLoadingSample(true);
    setReferenceText('');
    setText('');

    try {
      console.log(`[Dataset] Fetching from: ${datasetInfo.url}`);
      
      // Fetch the dataset rows
      const response = await fetch(datasetInfo.url);
      if (!response.ok) {
        throw new Error(`Dataset API error: ${response.status}`);
      }
      
      const data = await response.json();
      const rows = data.rows || [];
      
      if (rows.length === 0) {
        throw new Error('No data returned from dataset API');
      }

      // Pick a random row
      const randomIndex = Math.floor(Math.random() * rows.length);
      const row = rows[randomIndex].row || rows[randomIndex];

      // Get the audio URL and transcription
      const audio = row.audio;
      const audioUrl = Array.isArray(audio) ? audio[0]?.src : audio?.src;
      const transcription = row[datasetInfo.textField] || '';
      
      if (!audioUrl) {
        throw new Error('No audio URL in dataset response');
      }

      setReferenceText(transcription);
      console.log(`[Dataset] Reference: "${transcription}"`);
      console.log(`[Dataset] Audio URL: ${audioUrl.substring(0, 80)}...`);

      // Fetch and decode the audio
      setStatus('Fetching audio…');
      const audioRes = await fetch(audioUrl);
      const buf = await audioRes.arrayBuffer();
      
      // Decode audio (resampling to 16kHz)
      const audioCtx = new AudioContext({ sampleRate: 16000 });
      const decoded = await audioCtx.decodeAudioData(buf);
      const pcm = decoded.getChannelData(0);
      await audioCtx.close();

      // Transcribe
      setStatus('Transcribing sample…');
      setIsTranscribing(true);
      
      console.time('Transcribe-Sample');
      const res = await modelRef.current.transcribe(pcm, 16000, {
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

      // Add to history
      const langName = LANGUAGES[selectedLanguage]?.displayName || selectedLanguage;
      const datasetName = datasetInfo.dataset.split('/').pop();
      const newTranscription = {
        id: Date.now(),
        filename: `${datasetName}-${langName}-#${randomIndex}`,
        text: res.utterance_text,
        reference: transcription,
        timestamp: new Date().toLocaleTimeString(),
        duration: pcm.length / 16000,
        wordCount: res.words?.length || 0,
        confidence: res.confidence_scores?.token_avg ?? res.confidence_scores?.word_avg ?? null,
        metrics: res.metrics,
        language: selectedLanguage
      };
      setTranscriptions(prev => [newTranscription, ...prev]);
      setStatus('Model ready ✔');

    } catch (error) {
      console.error('[Dataset] Error:', error);
      setStatus(`Dataset error: ${error.message}`);
    } finally {
      setIsLoadingSample(false);
      setIsTranscribing(false);
    }
  }

  async function loadModel() {
    setStatus('Loading model…');
    setProgress('');
    setProgressText('');
    setProgressPct(0);
    console.time('LoadModel');

    try {
      const progressCallback = ({ loaded, total, file }) => {
        const pct = total > 0 ? Math.round((loaded / total) * 100) : 0;
        setProgressText(`${file}: ${pct}%`);
        setProgressPct(pct);
      };

      // 1. Download all model files from HuggingFace Hub
      // Use model key for known models (enables auto-config), or repo ID for custom
      const modelUrls = await getParakeetModel(selectedModel, { 
        encoderQuant,
        decoderQuant,
        preprocessor,
        backend,
        progress: progressCallback 
      });

      // Show compiling sessions stage
      setStatus('Creating sessions…');
      setProgressText('Compiling model (this may take ~10 s)…');
      setProgressPct(null);

      // 2. Create the model instance with all file URLs
      modelRef.current = await ParakeetModel.fromUrls({ 
        ...modelUrls.urls,
        filenames: modelUrls.filenames,
        backend, 
        verbose: verboseLog,
        cpuThreads,
      });

      // 3. Warm-up and verify
      setStatus('Warming up & verifying…');
      setProgressText('Running a test transcription…');
      const expectedText = 'it is not life as we know or understand it';
      
      try {
        const audioRes = await fetch('/assets/life_Jim.wav');
        const buf = await audioRes.arrayBuffer();
        const audioCtx = new AudioContext({ sampleRate: 16000 });
        const decoded = await audioCtx.decodeAudioData(buf);
        const pcm = decoded.getChannelData(0);
        
        const { utterance_text } = await modelRef.current.transcribe(pcm, 16000);

        // Normalize both texts: lowercase and remove punctuation
        const normalize = (str) => str.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");

        if (normalize(utterance_text).includes(normalize(expectedText))) {
          console.log('[App] Model verification successful.');
          setStatus('Model ready ✔');
        } else {
          console.error(`[App] Model verification failed! Expected: "${expectedText}", Got: "${utterance_text}"`);
          setStatus('Model verification failed!');
        }
      } catch (err) {
        console.error('[App] Warm-up transcription failed', err);
        setStatus('Warm-up failed!');
      }

      console.timeEnd('LoadModel');
      // setStatus('Model ready ✔'); // Status is now set by verification
      setProgressText('');
      setProgressPct(null);
    } catch (e) {
      console.error(e);
      setStatus(`Failed: ${e.message}`);
      setProgress('');
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
        returnConfidences: true , frameStride
      });
      console.timeEnd(`Transcribe-${file.name}`);

      if (dumpDetail) {
        console.log('[Parakeet] Detailed transcription output', res);
      }
      setLatestMetrics(res.metrics);
      // Add to transcriptions list
      const newTranscription = {
        id: Date.now(),
        filename: file.name,
        text: res.utterance_text,
        timestamp: new Date().toLocaleTimeString(),
        duration: pcm.length / 16000, // duration in seconds
        wordCount: res.words?.length || 0,
        confidence: res.confidence_scores?.token_avg ?? res.confidence_scores?.word_avg ?? null,
        metrics: res.metrics
      };

      setTranscriptions(prev => [newTranscription, ...prev]);
      setText(res.utterance_text); // Show latest transcription
      setStatus('Model ready ✔'); // Ready for next file
      
    } catch (error) {
      console.error('Transcription failed:', error);
      setStatus('Transcription failed');
      alert(`Failed to transcribe "${file.name}": ${error.message}`);
    } finally {
      setIsTranscribing(false);
      // Clear the file input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  function clearTranscriptions() {
    setTranscriptions([]);
    setText('');
  }

  return (
    <div className="app">
      <h2>Parakeet JS React Demo (Dev)</h2>

      <div className="controls">
        <label>
          <strong>Model:</strong>{' '}
          <select 
            value={selectedModel} 
            onChange={e => setSelectedModel(e.target.value)}
            disabled={status !== 'Idle' && !status.toLowerCase().includes('fail')}
          >
            {MODEL_OPTIONS.map(opt => (
              <option key={opt.key} value={opt.key}>
                {opt.displayName}
              </option>
            ))}
          </select>
        </label>
        {' '}
        <label>
          <strong>Language:</strong>{' '}
          <select 
            value={selectedLanguage} 
            onChange={e => setSelectedLanguage(e.target.value)}
          >
            {languageOptions.map(lang => (
              <option key={lang.code} value={lang.code}>
                {lang.displayName} ({lang.code})
              </option>
            ))}
          </select>
        </label>
        {availableLanguages.length === 1 && (
          <span style={{ marginLeft: '0.5rem', fontSize: '0.85em', color: '#888' }}>
            (v2 is English-only)
          </span>
        )}
      </div>

      <div className="controls">
        <label>
          Backend:
          <select value={backend} onChange={e=>setBackend(e.target.value)}>
            <option value="webgpu-hybrid">WebGPU</option>
            <option value="wasm">WASM (CPU)</option>
          </select>
        </label>
        {' '}
        <label>
          Encoder Quant:
          <select value={encoderQuant} onChange={e=>setEncoderQuant(e.target.value)}>
            <option value="int8">int8 (faster)</option>
            <option value="fp32">fp32 (higher quality)</option>
          </select>
        </label>
        {' '}
        <label>
          Decoder Quant:
          <select value={decoderQuant} onChange={e=>setDecoderQuant(e.target.value)}>
            <option value="int8">int8 (faster)</option>
            <option value="fp32">fp32 (higher quality)</option>
          </select>
        </label>
        {' '}
        <label>
          Preprocessor:
          <select value={preprocessor} onChange={e=>setPreprocessor(e.target.value)}>
            <option value="nemo128">nemo128 (default)</option>
          </select>
        </label>
        {' '}
        <label>
          Stride:
          <select value={frameStride} onChange={e=>setFrameStride(Number(e.target.value))}>
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={4}>4</option>
          </select>
        </label>
        {' '}
        <label>
          <input type="checkbox" checked={verboseLog} onChange={e => setVerboseLog(e.target.checked)} />
          Verbose Log
        </label>
        {' '}
        <label style={{fontSize:'0.9em'}}>
          <input type="checkbox" checked={dumpDetail} onChange={e=>setDumpDetail(e.target.checked)} />
          Dump result to console
        </label>
        {(backend === 'wasm' || backend.startsWith('webgpu')) && (
          <label style={{fontSize:'0.9em'}}>
            Threads:
            <input type="number" min="1" max={maxCores} value={cpuThreads} onChange={e=>setCpuThreads(Number(e.target.value))} style={{width:'4rem'}} />
          </label>
        )}
        <button 
          onClick={loadModel} 
          disabled={!status.toLowerCase().includes('fail') && status !== 'Idle'}
          className="primary"
        >
          {status === 'Model ready ✔' ? 'Model Loaded' : 'Load Model'}
        </button>
      </div>

      {typeof SharedArrayBuffer === 'undefined' && backend === 'wasm' && (
        <div style={{ 
          marginBottom: '1rem', 
          padding: '0.5rem', 
          backgroundColor: '#fff3cd', 
          border: '1px solid #ffeaa7',
          borderRadius: '4px',
          fontSize: '0.9em'
        }}>
          ⚠️ <strong>Performance Note:</strong> SharedArrayBuffer is not available. 
          WASM will run single-threaded. For better performance, serve over HTTPS 
          with proper headers or use WebGPU.
        </div>
      )}

      {/* Quick Test Section */}
      <div className="controls" style={{ 
        backgroundColor: '#f0f7ff', 
        padding: '1rem', 
        borderRadius: '8px',
        marginBottom: '1rem',
        border: '1px solid #cce0ff'
      }}>
        <div style={{ marginBottom: '0.5rem' }}>
          <strong>🎯 Quick Test with HuggingFace Speech Datasets</strong>
          <span style={{ marginLeft: '0.5rem', fontSize: '0.85em', color: '#666' }}>
            (People's Speech, MLS)
          </span>
        </div>
        <button 
          onClick={fetchRandomSample}
          disabled={status !== 'Model ready ✔' || isLoadingSample || isTranscribing || !LANGUAGES[selectedLanguage]?.dataset}
          className="primary"
          style={{ marginRight: '1rem' }}
        >
          {isLoadingSample ? '⏳ Loading…' : `🎲 Load Random ${LANGUAGES[selectedLanguage]?.displayName || selectedLanguage} Sample`}
        </button>
        {!LANGUAGES[selectedLanguage]?.dataset && (
          <span style={{ fontSize: '0.85em', color: '#d32f2f' }}>
            ⚠️ No test dataset available for this language
          </span>
        )}
        {referenceText && (
          <div style={{ marginTop: '0.75rem' }}>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 'bold', fontSize: '0.9em' }}>
              📝 Reference Text (Ground Truth):
            </label>
            <div style={{ 
              backgroundColor: '#e8f5e9', 
              padding: '0.5rem 0.75rem', 
              borderRadius: '4px',
              border: '1px solid #c8e6c9',
              fontFamily: 'inherit',
              fontSize: '0.95em'
            }}>
              {referenceText}
            </div>
          </div>
        )}
      </div>

      <div className="controls">
        <input 
          ref={fileInputRef}
          type="file" 
          accept="audio/*" 
          onChange={transcribeFile} 
          disabled={status !== 'Model ready ✔' || isTranscribing} 
        />
        {transcriptions.length > 0 && (
          <button 
            onClick={clearTranscriptions} 
            style={{ marginLeft: '1rem', padding: '0.25rem 0.5rem' }}
          >
            Clear History
          </button>
        )}
      </div>

      <p>Status: {status}</p>
      {progressPct!==null && (
        <div className="progress-wrapper">
          <div className="progress-bar"><div style={{ width: `${progressPct}%` }} /></div>
          <p className="progress-text">{progressText}</p>
        </div>
      )}

      {/* Latest transcription */}
      <div className="controls">
        <h3>Latest Transcription:</h3>
        <textarea 
          value={text} 
          readOnly 
          className="textarea"
          placeholder="Transcribed text will appear here..."
        />
      </div>

      {/* Latest transcription performace info */}
      {latestMetrics && (
        <div className="performance">
          <strong>RTF:</strong> {latestMetrics.rtf?.toFixed(2)}x &nbsp;|&nbsp; Total: {latestMetrics.total_ms} ms<br/>
          Preprocess {latestMetrics.preprocess_ms} ms · Encode {latestMetrics.encode_ms} ms · Decode {latestMetrics.decode_ms} ms · Tokenize {latestMetrics.tokenize_ms} ms
        </div>
      )}

      {/* Transcription history */}
      {transcriptions.length > 0 && (
        <div className="history">
          <h3>Transcription History ({transcriptions.length} files):</h3>
          <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '4px' }}>
            {transcriptions.map((trans) => (
              <div className="history-item" key={trans.id}>
                <div className="history-meta">
                  <strong>{trans.filename}</strong>
                  {trans.language && <span style={{ marginLeft: '0.5rem', fontSize: '0.85em', color: '#666' }}>({LANGUAGES[trans.language]?.displayName})</span>}
                  <span>{trans.timestamp}</span>
                </div>
                <div className="history-stats">Duration: {trans.duration.toFixed(1)}s | Words: {trans.wordCount}{trans.confidence && ` | Confidence: ${trans.confidence.toFixed(2)}`}{trans.metrics && ` | RTF: ${trans.metrics.rtf?.toFixed(2)}x`}</div>
                {trans.reference && (
                  <div style={{ fontSize: '0.9em', color: '#2e7d32', marginBottom: '0.25rem' }}>
                    <strong>Reference:</strong> {trans.reference}
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