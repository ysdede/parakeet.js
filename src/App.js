import React, { useState, useRef, useEffect } from 'react';
import { ParakeetModel, getParakeetModel } from 'parakeet.js';
import './App.css';

export default function App() {
  const repoId = 'ysdede/parakeet-tdt-0.6b-v2-onnx';
  const [backend, setBackend] = useState('webgpu-hybrid');
  const [quant, setQuant] = useState('fp32');
  const [preprocessor, setPreprocessor] = useState('nemo128');
  const [status, setStatus] = useState('Idle');
  const [progress, setProgress] = useState('');
  const [progressText, setProgressText] = useState('');
  const [progressPct, setProgressPct] = useState(null);
  const [text, setText] = useState('');
  const [latestMetrics, setLatestMetrics] = useState(null);
  const [transcriptions, setTranscriptions] = useState([]);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [verboseLog, setVerboseLog] = useState(false);
  const [decoderInt8, setDecoderInt8] = useState(true);
  const [frameStride, setFrameStride] = useState(1);
  const [dumpDetail, setDumpDetail] = useState(false);
  const maxCores = navigator.hardwareConcurrency || 8;
  const [cpuThreads, setCpuThreads] = useState(Math.max(1, maxCores - 2));
  const modelRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-adjust quant preset when backend changes
  useEffect(() => {
    if (backend.startsWith('webgpu')) {
      setQuant('fp32');
    } else if (backend === 'wasm') {
      setQuant('int8');
    }
  }, [backend]);

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
      const modelUrls = await getParakeetModel(repoId, { 
        quantization: quant, 
        preprocessor,
        backend, // Pass backend to enable automatic fp32 selection for WebGPU
        decoderInt8,
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
        decoderOnWasm: decoderInt8, // if we selected int8 decoder, keep it on WASM
        decoderInt8,
        cpuThreads,
      });

      // 3. Warm-up and verify
      setStatus('Warming up & verifying…');
      setProgressText('Model ready! Upload an audio file to transcribe.');
      setProgressPct(null);

      console.timeEnd('LoadModel');
      setStatus('Model ready ✔');
      setProgressText('');
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
        returnConfidences: true, 
        frameStride
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
        confidence: res.confidence_scores?.overall_log_prob || null,
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
      <h2>🦜 Parakeet.js - HF Spaces Demo</h2>
      <p>NVIDIA Parakeet speech recognition for the browser using WebGPU/WASM</p>

      <div className="controls">
        <p>
          <strong>Model:</strong> {repoId}
        </p>
      </div>

      <div className="controls">
        <label>
          Backend:
          <select value={backend} onChange={e=>setBackend(e.target.value)}>
            <option value="webgpu-hybrid">WebGPU (Hybrid)</option>
            <option value="webgpu-strict">WebGPU (Strict)</option>
            <option value="wasm">WASM (CPU)</option>
          </select>
        </label>
        {' '}
        <label>
          Quant:
          <select value={quant} onChange={e=>setQuant(e.target.value)}>
            <option value="int8">int8 (faster)</option>
            <option value="fp32">fp32 (higher quality)</option>
          </select>
        </label>
        {' '}
        {backend.startsWith('webgpu') && (
          <label style={{ fontSize:'0.9em' }}>
            <input type="checkbox" checked={decoderInt8} onChange={e=>setDecoderInt8(e.target.checked)} />
            Decoder INT8 on CPU
          </label>
        )}
        {' '}
        <label>
          Preprocessor:
          <select value={preprocessor} onChange={e=>setPreprocessor(e.target.value)}>
            <option value="nemo80">nemo80 (smaller)</option>
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
        {(backend === 'wasm' || decoderInt8) && (
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
          WASM will run single-threaded. For better performance, use WebGPU.
        </div>
      )}

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
                <div className="history-meta"><strong>{trans.filename}</strong><span>{trans.timestamp}</span></div>
                <div className="history-stats">Duration: {trans.duration.toFixed(1)}s | Words: {trans.wordCount}{trans.confidence && ` | Confidence: ${trans.confidence.toFixed(2)}`}{trans.metrics && ` | RTF: ${trans.metrics.rtf?.toFixed(2)}x`}</div>
                <div className="history-text">{trans.text}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '4px', fontSize: '0.9em' }}>
        <h4>🔗 Links:</h4>
        <p>
          <a href="https://github.com/ysdede/parakeet.js" target="_blank" rel="noopener noreferrer">
            GitHub Repository
          </a>
          {' | '}
          <a href="https://www.npmjs.com/package/parakeet.js" target="_blank" rel="noopener noreferrer">
            npm Package
          </a>
        </p>
      </div>
    </div>
  );
}
