import { initOrt } from './backend.js';
import { ParakeetTokenizer } from './tokenizer.js';
import { OnnxPreprocessor } from './preprocessor.js';
import { JsPreprocessor, IncrementalMelProcessor } from './mel.js';

/**
 * Lightweight Parakeet model wrapper designed for browser usage.
 * Currently supports the *combined* decoder_joint-model ONNX (encoder+decoder+joiner in '
 * transformerjs' style) exported by parakeet TDT.
 */
export class ParakeetModel {
  constructor({ tokenizer, encoderSession, joinerSession, preprocessor, ort, subsampling = 8, windowStride = 0.01, normalizer = (s) => s, onnxPreprocessor = null, nMels, maxIncrementalCacheSize = 50 }) {
    this.tokenizer = tokenizer;
    this.encoderSession = encoderSession;
    this.joinerSession = joinerSession;
    this.preprocessor = preprocessor;
    this.ort = ort;

    // Keep ONNX preprocessor reference for runtime switching
    this._onnxPreprocessor = onnxPreprocessor;
    this._jsPreprocessor = preprocessor instanceof JsPreprocessor ? preprocessor : null;

    // Incremental mel processor for streaming with overlap caching
    this._incrementalMel = preprocessor instanceof JsPreprocessor
      ? new IncrementalMelProcessor({ nMels: preprocessor.nMels })
      : null;

    // Read blank ID from tokenizer (dynamic instead of hardcoded)
    this.blankId = tokenizer.blankId;

    // Combined model specific constants
    this.predHidden = 640;
    this.predLayers = 2;
    this.maxTokensPerStep = 10;

    // Allocate zero LSTM states for the combined decoder; will be reused.
    const numLayers = this.predLayers;
    const hidden = this.predHidden;
    const size = numLayers * 1 * hidden;
    const z = new Float32Array(size); // zeros
    this._combState1 = new ort.Tensor('float32', z, [numLayers, 1, hidden]);
    this._combState2 = new ort.Tensor('float32', z.slice(), [numLayers, 1, hidden]);

    this._normalizer = normalizer;
    this.subsampling = subsampling;
    this.windowStride = windowStride;
    this._nMels = nMels || 128;

    // Pre-allocate reusable tensors for decoder loop to reduce GC pressure
    this._targetIdArray = new Int32Array(1);
    this._targetTensor = new ort.Tensor('int32', this._targetIdArray, [1, 1]);
    this._targetLenArray = new Int32Array([1]);
    this._targetLenTensor = new ort.Tensor('int32', this._targetLenArray, [1]);
    this._encoderFrameBuffer = null; // Will be allocated when we know the dimension D
    this._encoderFrameTensor = null; // Will be allocated when we know D

    // Incremental decode cache: stores decoder state at the end of the prefix
    // keyed by a caller-provided cacheKey. This lets us skip decoding the
    // left-context on subsequent calls when the prefix is unchanged.
    this._incrementalCache = new Map();
    this.maxIncrementalCacheSize = maxIncrementalCacheSize;
  }

  /**
   * Create ParakeetModel by downloading all required assets.
   * @param {Object} cfg
   * @param {string} cfg.encoderUrl URL to encoder-model.onnx
   * @param {string} cfg.decoderUrl URL to decoder_joint-model.onnx
   * @param {string} cfg.tokenizerUrl URL to vocab.txt or tokens.txt
   * @param {string} cfg.preprocessorUrl URL to nemo80/128.onnx (not needed if preprocessorBackend='js')
   * @param {('webgpu'|'wasm')} [cfg.backend='webgpu']
   * @param {('onnx'|'js')} [cfg.preprocessorBackend='js'] Preprocessor backend: 'js' (default) uses pure JS mel computation (faster, no ONNX overhead, enables incremental streaming), 'onnx' uses nemo*.onnx via WASM
   * @param {number} [cfg.nMels] Number of mel bins (auto-detected from model config, or 128)
   */
  static async fromUrls(cfg) {
    const {
      encoderUrl,
      decoderUrl,
      tokenizerUrl,
      preprocessorUrl,
      encoderDataUrl,
      decoderDataUrl,
      filenames,
      backend = 'webgpu-hybrid',
      wasmPaths,
      subsampling = 8,
      windowStride = 0.01,
      verbose = false,
      enableProfiling = false,
      enableGraphCapture,
      cpuThreads = undefined,
      preprocessorBackend = 'js',
      nMels,
    } = cfg;

    const useJsPreprocessor = preprocessorBackend === 'js';
    console.log(`[Parakeet.js] Preprocessor backend requested: '${preprocessorBackend}' → ${useJsPreprocessor ? 'JS (mel.js)' : 'ONNX'}`);

    if (!encoderUrl || !decoderUrl || !tokenizerUrl || (!preprocessorUrl && !useJsPreprocessor)) {
      throw new Error('fromUrls requires encoderUrl, decoderUrl, tokenizerUrl and preprocessorUrl (preprocessorUrl not needed if preprocessorBackend="js")');
    }

    // 1. Init ONNX Runtime
    let ortBackend = backend;
    if (backend.startsWith('webgpu')) {
      ortBackend = 'webgpu';
    }
    const ort = await initOrt({ backend: ortBackend, wasmPaths, numThreads: cpuThreads });

    // 2. Configure session options for better performance
    const graphCaptureEnabled = !!enableGraphCapture && backend === 'webgpu-strict';
    const isFullWasm = backend === 'wasm';

    const baseSessionOptions = {
      executionProviders: [],
      graphOptimizationLevel: 'all',
      executionMode: 'parallel',
      enableCpuMemArena: true,
      enableMemPattern: true,
      enableProfiling,
      enableGraphCapture: graphCaptureEnabled,
      logSeverityLevel: verbose ? 0 : 2,
    };

    // Set execution provider based on backend
    if (backend === 'webgpu-hybrid') {
      baseSessionOptions.executionProviders = [
        {
          name: 'webgpu',
          deviceType: 'gpu',
          powerPreference: 'high-performance'
        },
        'wasm'
      ];
    } else if (backend === 'webgpu-strict') {
      baseSessionOptions.executionProviders = [
        {
          name: 'webgpu',
          deviceType: 'gpu',
          powerPreference: 'high-performance'
        }
      ];
    } else if (backend === 'wasm') {
      baseSessionOptions.executionProviders = ['wasm'];
    }

    console.log(`[Parakeet.js] Creating ONNX sessions with execution mode '${backend}'. Providers:`, baseSessionOptions.executionProviders);
    if (verbose) {
      console.log('[Parakeet.js] Verbose logging enabled for ONNX Runtime.');
    }

    // Create separate options for sessions that might have external data
    const encoderSessionOptions = { ...baseSessionOptions };
    if (encoderDataUrl && filenames?.encoder) {
      encoderSessionOptions.externalData = [{
        data: encoderDataUrl,
        path: filenames.encoder + '.data',
      }];
    }

    const decoderSessionOptions = { ...baseSessionOptions };
    if (decoderDataUrl && filenames?.decoder) {
      decoderSessionOptions.externalData = [{
        data: decoderDataUrl,
        path: filenames.decoder + '.data',
      }];
    }

    // In hybrid mode, the decoder is always run on WASM
    if (backend.startsWith('webgpu')) {
      decoderSessionOptions.executionProviders = ['wasm'];
    }

    // 3. Load tokenizer & preprocessor in parallel with model sessions
    async function createSession(url, opts) {
      try {
        return await ort.InferenceSession.create(url, opts);
      } catch (e) {
        const msg = (e.message || '') + '';
        if (opts.enableGraphCapture && msg.includes('graph capture')) {
          console.warn('[Parakeet] Graph-capture unsupported for this model/backend; retrying without it');
          const retryOpts = { ...opts, enableGraphCapture: false };
          return await ort.InferenceSession.create(url, retryOpts);
        }
        throw e;
      }
    }

    const tokenizerPromise = ParakeetTokenizer.fromUrl(tokenizerUrl);

    // Create preprocessor based on selected backend
    const detectedMels = nMels || 128;
    const jsPreprocessor = new JsPreprocessor({ nMels: detectedMels });

    // Only create ONNX preprocessor if explicitly requested AND URL is available
    let onnxPreprocessor = null;
    if (!useJsPreprocessor && preprocessorUrl) {
      onnxPreprocessor = new OnnxPreprocessor(preprocessorUrl, {
        backend: 'wasm',
        wasmPaths,
        enableProfiling,
        enableGraphCapture: false,
        numThreads: cpuThreads
      });
      console.log(`[Parakeet.js] ONNX preprocessor session created (${detectedMels} mel bins)`);
    } else if (!useJsPreprocessor && !preprocessorUrl) {
      console.warn(`[Parakeet.js] ONNX preprocessor requested but no URL provided — falling back to JS`);
    }

    const activePreprocessor = useJsPreprocessor ? jsPreprocessor : (onnxPreprocessor || jsPreprocessor);
    const preprocPromise = Promise.resolve(activePreprocessor);
    const actualBackend = activePreprocessor === jsPreprocessor ? 'js' : 'onnx';
    console.log(`[Parakeet.js] Active preprocessor: ${actualBackend === 'js' ? 'JS (mel.js) — no ONNX preprocessor needed' : 'ONNX (nemo128.onnx)'}, ${detectedMels} mel bins`);

    let encoderSession, joinerSession;
    if (backend === 'webgpu-hybrid') {
      // avoid parallel create to prevent double initWasm race
      encoderSession = await createSession(encoderUrl, encoderSessionOptions);
      joinerSession = await createSession(decoderUrl, decoderSessionOptions);
    } else {
      [encoderSession, joinerSession] = await Promise.all([
        createSession(encoderUrl, encoderSessionOptions),
        createSession(decoderUrl, decoderSessionOptions),
      ]);
    }

    const [tokenizer, preprocessor] = await Promise.all([tokenizerPromise, preprocPromise]);

    // Warm up preprocessor to avoid first-call latency (ONNX session creation / JIT)
    try {
      const warmupAudio = new Float32Array(1600); // 0.1s of silence
      await preprocessor.process(warmupAudio);
      if (verbose) console.log('[Parakeet.js] Preprocessor warmed up');
    } catch (e) {
      console.warn('[Parakeet.js] Preprocessor warm-up failed (non-fatal):', e.message);
    }

    return new ParakeetModel({
      tokenizer, encoderSession, joinerSession, preprocessor, ort, subsampling, windowStride,
      onnxPreprocessor: onnxPreprocessor !== preprocessor ? onnxPreprocessor : null,
      nMels: detectedMels,
    });
  }

  async _runCombinedStep(encTensor, token, currentState = null) {
    const singleToken = typeof token === 'number' ? token : this.blankId;

    // Reuse pre-allocated tensors
    this._targetIdArray[0] = singleToken;
    // Note: _targetTensor and _targetLenTensor are already created with the right arrays

    const state1 = currentState?.state1 || this._combState1;
    const state2 = currentState?.state2 || this._combState2;

    const feeds = {
      encoder_outputs: encTensor,
      targets: this._targetTensor,
      target_length: this._targetLenTensor,
      input_states_1: state1,
      input_states_2: state2,
    };

    const out = await this.joinerSession.run(feeds);
    const logits = out['outputs'];

    const vocab = this.tokenizer.id2token.length;
    const totalDim = logits.dims[3];
    const data = logits.data;

    // subarray(): zero-copy view into joiner output buffer.
    // Do NOT mutate tokenLogits/durLogits without copying first (.slice()).
    const tokenLogits = data.subarray(0, vocab);
    const durLogits = data.subarray(vocab, totalDim);

    let step = 0;
    if (durLogits.length) {
      let maxVal = -Infinity;
      for (let i = 0; i < durLogits.length; ++i) if (durLogits[i] > maxVal) { maxVal = durLogits[i]; step = i; }
    }

    const newState = {
      state1: out['output_states_1'] || state1,
      state2: out['output_states_2'] || state2,
    };

    return { tokenLogits, step, newState, _logitsTensor: logits };
  }

  _snapshotDecoderState(state) {
    if (!state) return null;
    const s1 = state.state1;
    const s2 = state.state2;
    return {
      s1: new Float32Array(s1.data),
      s2: new Float32Array(s2.data),
      dims1: s1.dims.slice(),
      dims2: s2.dims.slice(),
    };
  }

  _restoreDecoderState(snap) {
    if (!snap) return null;
    const state1 = new this.ort.Tensor('float32', new Float32Array(snap.s1), snap.dims1);
    const state2 = new this.ort.Tensor('float32', new Float32Array(snap.s2), snap.dims2);
    return { state1, state2 };
  }

  /**
   * Compute mel spectrogram features from audio.
   * Supports incremental caching when using JS preprocessor in streaming mode.
   *
   * @param {Float32Array} audio - 16 kHz mono PCM
   * @param {number} [sampleRate=16000] - Sample rate
   * @param {Object} [opts] - Optional feature extraction options
   * @param {number} [opts.prefixSamples=0] - Number of leading samples identical to previous call
   *   (enables incremental mel caching — only new frames are computed, ~60-70% savings for typical streaming overlap)
   * @returns {{features: Float32Array, T: number, melBins: number, cached?: boolean, cachedFrames?: number, newFrames?: number}}
   */
  async computeFeatures(audio, sampleRate = 16000, opts = {}) {
    const { prefixSamples = 0 } = opts;

    // Use incremental mel processor if available and prefix is specified
    if (this._incrementalMel && prefixSamples > 0) {
      const result = this._incrementalMel.process(audio, prefixSamples);
      const T = result.length;
      return {
        features: result.features, T, melBins: this._nMels,
        cached: result.cached, cachedFrames: result.cachedFrames, newFrames: result.newFrames,
      };
    }

    // Standard path (no caching, works for both JS and ONNX preprocessors)
    // The preprocessor returns:
    //   features — flat Float32Array, row-major [nMels, nFrames]
    //   length   — valid frame count (features_lens from ONNX)
    // For the ONNX preprocessor, nFrames may be > length (extra STFT padding frame).
    // Per the NeMo reference (onnx-asr), the encoder expects the FULL tensor as
    // audio_signal and features_lens as a SEPARATE length input. We must NOT
    // truncate or re-layout — just pass the data as-is with both values.
    const { features, length } = await this.preprocessor.process(audio);
    const nFrames = features.length / this._nMels;          // actual tensor dim (may be length+1)
    return { features, T: nFrames, melBins: this._nMels, validLength: length };
  }

  /**
   * Switch preprocessor backend at runtime.
   * @param {('js'|'onnx')} backend - 'js' for pure JS mel (default, faster, enables caching), 'onnx' for ONNX WASM
   * @throws {Error} If ONNX backend requested but no ONNX preprocessor was loaded
   */
  setPreprocessorBackend(backend) {
    if (backend === 'onnx') {
      if (!this._onnxPreprocessor) {
        throw new Error('ONNX preprocessor not available. Load model with preprocessorUrl to enable ONNX backend.');
      }
      this.preprocessor = this._onnxPreprocessor;
      this._incrementalMel = null; // ONNX doesn't support incremental mel
      console.log('[Parakeet.js] Switched to ONNX preprocessor');
    } else if (backend === 'js') {
      if (!this._jsPreprocessor) {
        // Create one on the fly
        this._jsPreprocessor = new JsPreprocessor({ nMels: 128 });
      }
      this.preprocessor = this._jsPreprocessor;
      this._incrementalMel = new IncrementalMelProcessor({ nMels: this._jsPreprocessor.nMels });
      console.log('[Parakeet.js] Switched to JS preprocessor (incremental caching enabled)');
    } else {
      throw new Error(`Unknown preprocessor backend: ${backend}. Use 'js' or 'onnx'.`);
    }
  }

  /**
   * Get the current preprocessor backend type.
   * @returns {('js'|'onnx')} Current preprocessor backend
   */
  getPreprocessorBackend() {
    return this.preprocessor instanceof JsPreprocessor ? 'js' : 'onnx';
  }

  /**
   * Reset the incremental mel cache. Call this when starting a new utterance
   * or when the audio context changes (e.g., new recording session).
   */
  resetMelCache() {
    if (this._incrementalMel) {
      this._incrementalMel.reset();
    }
  }

  /**
   * Clear the incremental decoder state cache.
   * This releases memory used by cached decoder states.
   */
  clearIncrementalCache() {
    this._incrementalCache.clear();
  }

  /**
   * Dispose ORT tensors inside a decoder state object.
   * Safely skips null states, pre-allocated initial states, and tensors
   * shared with a `keepState` (to avoid double-dispose when the joiner
   * falls back to reusing its input state).
   * @param {object|null} state  - The state whose tensors should be freed.
   * @param {object|null} [keepState] - A state whose tensors must NOT be freed.
   */
  _disposeDecoderState(state, keepState = null) {
    if (!state) return;
    if (state.state1 && state.state1 !== this._combState1 && state.state1 !== keepState?.state1) {
      state.state1.dispose?.();
    }
    if (state.state2 && state.state2 !== this._combState2 && state.state2 !== keepState?.state2) {
      state.state2.dispose?.();
    }
  }

  /**
   * Get the time stride per encoder frame in seconds.
   * This is useful for converting frame indices to timestamps.
   * @returns {number} Time stride in seconds (typically 0.08s for 8x subsampling @ 10ms)
   */
  getFrameTimeStride() {
    return this.subsampling * this.windowStride;
  }

  /**
   * Convert a frame index to absolute time in seconds.
   * @param {number} frameIndex - Encoder frame index
   * @param {number} timeOffset - Optional offset to add (default 0)
   * @returns {number} Time in seconds
   */
  frameToTime(frameIndex, timeOffset = 0) {
    return timeOffset + (frameIndex * this.getFrameTimeStride());
  }

  /**
   * Get streaming constants for external use.
   * @returns {Object} Constants for streaming calculations
   */
  getStreamingConstants() {
    return {
      subsampling: this.subsampling,
      windowStride: this.windowStride,
      frameTimeStride: this.getFrameTimeStride(),
      melBins: 80, // Standard for Parakeet models
      blankId: this.blankId,
      maxTokensPerStep: this.maxTokensPerStep,
    };
  }

  /**
   * Transcribe 16-kHz mono PCM. Returns full rich output (timestamps/confidences opt-in).
   * 
   * Streaming Mode:
   * Pass `previousDecoderState` from a prior call to continue decoding from that state.
   * Set `returnDecoderState: true` to receive the decoder state for the next chunk.
   * Use `timeOffset` to adjust all timestamps by a fixed offset (for absolute timeline).
   * 
   * Frame-Aligned Streaming (for advanced merging):
   * Use `returnFrameIndices`, `returnLogProbs`, and `returnTdtSteps` to get detailed
   * per-token information for precise alignment when merging overlapping transcriptions.
   * 
   * @param {Float32Array} audio - 16-kHz mono PCM audio samples
   * @param {number} sampleRate - Sample rate (default 16000)
   * @param {Object} opts - Transcription options
   * @param {boolean} opts.returnTimestamps - Include word/token timestamps
   * @param {boolean} opts.returnConfidences - Include confidence scores
   * @param {number} opts.temperature - Decoding temperature (default 1.0 for greedy)
   * @param {Object} opts.previousDecoderState - Decoder state from previous chunk (for streaming)
   * @param {boolean} opts.returnDecoderState - Return decoder state for next chunk
   * @param {number} opts.timeOffset - Add this offset to all timestamps (seconds)
   * @param {boolean} opts.returnTokenIds - Include raw token IDs in output
   * @param {boolean} opts.returnFrameIndices - Include encoder frame index per token (for alignment)
   * @param {boolean} opts.returnLogProbs - Include raw log probability per token
   * @param {boolean} opts.returnTdtSteps - Include TDT duration prediction per token
   * @param {number} opts.prefixSamples - Number of leading audio samples identical to previous call
   *   (enables incremental mel caching — ~60-70% preprocessing savings for typical streaming overlap)
   * @param {Object} opts.precomputedFeatures - Pre-computed mel features (bypasses preprocessor entirely)
   * @param {Float32Array} opts.precomputedFeatures.features - Normalized mel features [melBins, T]
   * @param {number} opts.precomputedFeatures.T - Number of time frames
   * @param {number} opts.precomputedFeatures.melBins - Number of mel frequency bins
   */
  async transcribe(audio, sampleRate = 16000, opts = {}) {
    const {
      returnTimestamps = false,
      returnConfidences = false,
      temperature = 1.0, // Greedy decoding (1.0) is better for ASR than sampling (1.2)
      debug = false,
      enableProfiling = true,
      skipCMVN = false,
      frameStride = 1,
      // NEW: Streaming options
      previousDecoderState = null,  // Accept state from previous chunk
      returnDecoderState = false,   // Return state for next chunk
      timeOffset = 0,               // Offset to add to all timestamps
      returnTokenIds = false,       // Include raw token IDs
      // NEW: Frame-aligned streaming options (for advanced merging)
      returnFrameIndices = false,   // Include encoder frame index per token
      returnLogProbs = false,       // Include raw log probabilities per token
      returnTdtSteps = false,       // Include TDT duration predictions per token
      // Incremental mel caching for streaming
      prefixSamples = 0,            // Number of leading samples identical to previous call
      // Pre-computed mel features (bypass preprocessor entirely)
      precomputedFeatures = null,    // { features: Float32Array, T: number, melBins: number }
    } = opts;

    const perfEnabled = debug || enableProfiling; // collect timings & populate result.metrics (default: true for backward compat)
    let t0, tPreproc = 0, tEncode = 0, tDecode = 0, tToken = 0;
    if (perfEnabled) t0 = performance.now();

    // 1. Feature extraction (with optional incremental mel caching)
    let features, T, melBins, melCacheInfo, validLength;
    // Track which preprocessor path was used
    let preprocessorPath = precomputedFeatures ? 'mel-worker' : this.getPreprocessorBackend();

    if (precomputedFeatures) {
      // Bypass preprocessor — features already computed by external mel worker
      features = precomputedFeatures.features;
      T = precomputedFeatures.T;
      melBins = precomputedFeatures.melBins;
      melCacheInfo = {};
      console.log(`[Parakeet] Preprocessor: mel-worker (precomputed ${T} frames × ${melBins} mel bins, 0 ms)`);
    } else if (perfEnabled) {
      const s = performance.now();
      ({ features, T, melBins, validLength, ...melCacheInfo } = await this.computeFeatures(audio, sampleRate, { prefixSamples }));
      tPreproc = performance.now() - s;
      const cacheStr = melCacheInfo?.cached
        ? ` (cached: ${melCacheInfo.cachedFrames} frames, new: ${melCacheInfo.newFrames} frames)`
        : '';
      console.log(`[Parakeet] Preprocessor: ${preprocessorPath}, ${T} frames × ${melBins} mel bins, ${tPreproc.toFixed(1)} ms${cacheStr}`);
    } else {
      ({ features, T, melBins, validLength, ...melCacheInfo } = await this.computeFeatures(audio, sampleRate, { prefixSamples }));
    }

    // 2. Encode entire utterance
    // Guard for empty input; return quickly to avoid ORT errors
    if (!features || !features.length || T <= 0 || melBins <= 0) {
      return {
        utterance_text: '',
        words: [],
        tokens: [],
        confidence_scores: { overall_log_prob: null, frame: null, frame_avg: null },
        metrics: perfEnabled ? {
          preprocess_ms: +tPreproc.toFixed(1), encode_ms: 0, decode_ms: 0, tokenize_ms: 0, total_ms: +((performance.now() - t0).toFixed(1)), rtf: 0
        } : null,
        is_final: !opts?.incremental,
      };
    }

    // Compute audio duration for metrics (handle precomputed features where audio may be null)
    const audioDur = audio ? audio.length / sampleRate : (T * 160 / sampleRate);

    const input = new this.ort.Tensor('float32', features, [1, melBins, T]);
    // Per NeMo reference (onnx-asr): encoder receives the FULL tensor (including
    // any padding frames from STFT), but 'length' carries features_lens — the
    // count of *valid* frames.  For the JS preprocessor T === validLength;
    // for the ONNX preprocessor T may be validLength+1.
    const encoderLength = validLength ?? T;
    const lenTensor = new this.ort.Tensor('int64', BigInt64Array.from([BigInt(encoderLength)]), [1]);
    let enc;
    if (perfEnabled) {
      const s = performance.now();
      const encOut = await this.encoderSession.run({ audio_signal: input, length: lenTensor });
      tEncode = performance.now() - s;
      enc = encOut['outputs'] ?? Object.values(encOut)[0];
    } else {
      const encOut = await this.encoderSession.run({ audio_signal: input, length: lenTensor });
      enc = encOut['outputs'] ?? Object.values(encOut)[0];
    }

    // Dispose per-call input tensors (data is now in encOut; inputs no longer needed)
    input.dispose?.();
    lenTensor.dispose?.();

    // Transpose encoder output [B, D, T] ➔ [T, D] for B=1
    const [, D, Tenc] = enc.dims;

    // Fast-path check: if already in [T, D] format, skip transpose
    let transposed;
    if (enc.dims.length === 3 && enc.dims[0] === 1 && enc.dims[1] === D && enc.dims[2] === Tenc) {
      // Need to transpose from [1, D, T] to [T, D]
      transposed = new Float32Array(Tenc * D);
      const encData = enc.data;

      // Optimized transpose with tight loops and better cache locality
      // Process in blocks to improve cache performance
      const blockSize = Math.min(64, D); // Tune block size for cache efficiency

      for (let dBlock = 0; dBlock < D; dBlock += blockSize) {
        const dEnd = Math.min(dBlock + blockSize, D);
        for (let t = 0; t < Tenc; t++) {
          const tOffset = t * D;
          for (let d = dBlock; d < dEnd; d++) {
            transposed[tOffset + d] = encData[d * Tenc + t];
          }
        }
      }
    } else {
      // Unexpected format - fallback to direct use (shouldn't happen with current models)
      console.warn('[Parakeet] Unexpected encoder output format:', enc.dims);
      transposed = new Float32Array(enc.data);
    }

    // Dispose encoder output tensor (data fully copied into transposed Float32Array)
    enc.dispose?.();

    // Pre-allocate encoder frame buffer for reuse
    if (!this._encoderFrameBuffer || this._encoderFrameBuffer.length !== D) {
      this._encoderFrameBuffer = new Float32Array(D);
      this._encoderFrameTensor = new this.ort.Tensor('float32', this._encoderFrameBuffer, [1, D, 1]);
    }

    // --- Decode frame-by-frame ----------------------------------------
    const ids = [];
    const tokenTimes = [];
    const tokenConfs = [];
    const frameConfs = [];
    let overallLogProb = 0;

    // NEW: Frame-aligned streaming data
    const tokenFrameIndices = [];  // Which encoder frame emitted each token
    const tokenLogProbs = [];      // Raw log probability for each token
    const tokenTdtSteps = [];      // TDT duration prediction for each token

    // Incremental decode settings
    const TIME_STRIDE = this.subsampling * this.windowStride;
    let startFrame = 0;
    let effectiveTimeOffset = timeOffset;  // Use the passed-in timeOffset

    // NEW: Initialize decoder state from previous chunk if provided (streaming mode)
    let decoderState = null;
    if (previousDecoderState) {
      // Restore state from the snapshot format
      decoderState = this._restoreDecoderState(previousDecoderState);
      if (debug) console.log('[Parakeet] Restored decoder state from previous chunk');
    }

    let prefixFrames = 0;
    const inc = opts.incremental;
    if (inc && inc.cacheKey) {
      prefixFrames = Math.max(0, Math.min(Tenc, Math.floor(((inc.prefixSeconds || 0) + 1e-6) / TIME_STRIDE)));
      const cached = this._incrementalCache.get(inc.cacheKey);
      if (cached && cached.prefixFrames === prefixFrames && cached.D === D) {
        startFrame = prefixFrames;
        effectiveTimeOffset = timeOffset + prefixFrames * TIME_STRIDE;  // Preserve caller's timeOffset base
        decoderState = this._restoreDecoderState(cached.state);
        if (debug) console.log(`[Parakeet] Incremental cache hit: skipping ${prefixFrames}/${Tenc} frames (${(prefixFrames/Tenc*100).toFixed(0)}%)`);

        // LRU update: move to end
        this._incrementalCache.delete(inc.cacheKey);
        this._incrementalCache.set(inc.cacheKey, cached);
      }
    }
    let emittedTokens = 0;


    const decStartTime = perfEnabled ? performance.now() : 0;

    // When not using cache, we will capture decoder state at prefixFrames once
    let prefixStateCaptured = startFrame > 0 || prefixFrames === 0;
    for (let t = startFrame; t < Tenc;) {
      // Copy frame data to reusable buffer
      const frameStart = t * D;
      for (let i = 0; i < D; i++) {
        this._encoderFrameBuffer[i] = transposed[frameStart + i];
      }
      // const encTensor = new this.ort.Tensor('float32', this._encoderFrameBuffer, [1, D, 1]);

      const prevTok = ids.length ? ids[ids.length - 1] : this.blankId;
      const { tokenLogits, step, newState, _logitsTensor } = await this._runCombinedStep(this._encoderFrameTensor, prevTok, decoderState);
      // NOTE: State update moved below - only update on non-blank token (matching Python reference)

      // Temperature scaling & argmax
      let maxVal = -Infinity, maxId = 0;
      for (let i = 0; i < tokenLogits.length; i++) {
        const v = tokenLogits[i] / temperature;
        if (v > maxVal) { maxVal = v; maxId = i; }
      }

      let confVal = 1.0; // Default confidence when not computing softmax
      let logProbVal = 0; // Raw log probability for this token

      // Compute softmax denominator when confidences OR logProbs are requested
      if (returnConfidences || returnLogProbs) {
        let sumExp = 0;
        for (let i = 0; i < tokenLogits.length; i++) {
          sumExp += Math.exp((tokenLogits[i] / temperature) - maxVal);
        }
        confVal = 1 / sumExp;
        // Log probability: log(softmax(logit)) = logit - log(sum(exp(logits)))
        logProbVal = (tokenLogits[maxId] / temperature) - maxVal - Math.log(sumExp);

        if (returnConfidences) {
          frameConfs.push(confVal);
          overallLogProb += Math.log(confVal);
        }
      }

      // Dispose the joiner logits tensor (tokenLogits subarray has been fully consumed)
      _logitsTensor?.dispose?.();

      if (maxId !== this.blankId) {
        // CRITICAL FIX: Only update decoder state on non-blank token emission
        // This matches the Python reference in onnx-asr/src/onnx_asr/asr.py line 212
        this._disposeDecoderState(decoderState, newState); // free old state tensors
        decoderState = newState;
        ids.push(maxId);

        // NEW: Track frame index for this token (always cheap to compute)
        if (returnFrameIndices) tokenFrameIndices.push(t);

        // NEW: Track log probability for this token
        if (returnLogProbs) tokenLogProbs.push(logProbVal);

        // NEW: Track TDT step (duration prediction) for this token
        if (returnTdtSteps) tokenTdtSteps.push(step);

        if (returnTimestamps) {
          const durFrames = step > 0 ? step : 1;
          // Use effectiveTimeOffset for streaming mode
          const start = effectiveTimeOffset + (t * TIME_STRIDE);
          const end = effectiveTimeOffset + ((t + durFrames) * TIME_STRIDE);
          tokenTimes.push([start, end]);
        }
        if (returnConfidences) tokenConfs.push(confVal);
        emittedTokens += 1;
      } else {
        // Blank token: newState is unused, free its tensors (keep current decoderState)
        this._disposeDecoderState(newState, decoderState);
      }

      // Frame advancement logic matching onnx-asr exactly:
      // 1. If step > 0 (TDT duration prediction), advance by step and reset counter
      // 2. Otherwise, advance by 1 ONLY if blank OR max tokens per step reached
      // 3. If neither condition met, STAY on same frame to emit more tokens
      //    (This is critical for multi-token-per-frame emission like "'s" + " no")
      if (step > 0) {
        t += step;
        emittedTokens = 0;  // Reset on TDT step advance
      } else if (maxId === this.blankId || emittedTokens >= this.maxTokensPerStep) {
        t += frameStride;
        emittedTokens = 0;  // Reset on blank or max tokens
      }
      // NOTE: No "safety" advance here - staying on the same frame when step=0,
      // non-blank token, and emittedTokens < maxTokensPerStep is CORRECT behavior.
      // The decoder will emit another token from the same frame.

      // Capture decoder state at end of prefix when decoding from frame 0
      if (inc && inc.cacheKey && !prefixStateCaptured && t >= prefixFrames) {
        const snap = this._snapshotDecoderState(decoderState);

        // Enforce cache limit (LRU eviction)
        if (!this._incrementalCache.has(inc.cacheKey) && this._incrementalCache.size >= this.maxIncrementalCacheSize) {
          const oldestKey = this._incrementalCache.keys().next().value;
          if (debug) {
            console.log(`[Parakeet] Incremental cache full (${this.maxIncrementalCacheSize}); evicting oldest entry: ${oldestKey}`);
          }
          this._incrementalCache.delete(oldestKey);
        }
        // Update/Insert (moves to end)
        if (this._incrementalCache.has(inc.cacheKey)) {
          this._incrementalCache.delete(inc.cacheKey);
        }
        this._incrementalCache.set(inc.cacheKey, { state: snap, prefixFrames, D });
        prefixStateCaptured = true;
      }
    }

    if (perfEnabled) {
      tDecode = performance.now() - decStartTime;
    }

    let tokenStart;
    if (perfEnabled) tokenStart = performance.now();
    const text = this._normalizer(this.tokenizer.decode(ids));
    if (perfEnabled) tToken = performance.now() - tokenStart;

    // Early exit if no extras requested
    if (!returnTimestamps && !returnConfidences) {
      if (perfEnabled) {
        const total = performance.now() - t0;
        const rtf = audioDur / (total / 1000);
        console.log(`[Perf] RTF: ${rtf.toFixed(2)}x (audio ${audioDur.toFixed(2)} s, time ${(total / 1000).toFixed(2)} s)`);
        console.table({ Preprocess: `${tPreproc.toFixed(1)} ms`, Encode: `${tEncode.toFixed(1)} ms`, Decode: `${tDecode.toFixed(1)} ms`, Tokenize: `${tToken.toFixed(1)} ms`, Total: `${total.toFixed(1)} ms` });
      }
      const metrics = perfEnabled ? {
        preprocess_ms: +tPreproc.toFixed(1),
        encode_ms: +tEncode.toFixed(1),
        decode_ms: +tDecode.toFixed(1),
        tokenize_ms: +tToken.toFixed(1),
        total_ms: +((performance.now() - t0).toFixed(1)),
        rtf: +(audioDur / ((performance.now() - t0) / 1000)).toFixed(2),
        preprocessor_backend: preprocessorPath,
        mel_cache: melCacheInfo?.cached ? {
          cached_frames: melCacheInfo.cachedFrames,
          new_frames: melCacheInfo.newFrames,
        } : null,
      } : null;

      const result = { utterance_text: text, words: [], metrics, is_final: !previousDecoderState };

      // NEW: Include decoder state for streaming continuation
      if (returnDecoderState) {
        result.decoderState = this._snapshotDecoderState(decoderState);
      }
      // NEW: Include raw token IDs
      if (returnTokenIds) {
        result.tokenIds = ids.slice();
      }
      // NEW: Include frame-aligned streaming data
      if (returnFrameIndices) {
        result.frameIndices = tokenFrameIndices.slice();
      }
      if (returnLogProbs) {
        result.logProbs = tokenLogProbs.slice();
      }
      if (returnTdtSteps) {
        result.tdtSteps = tokenTdtSteps.slice();
      }

      // Dispose final decoder state tensors (snapshots already copied the data)
      this._disposeDecoderState(decoderState);

      return result;
    }

    // --- Build words & detailed token arrays ---------------------------
    const words = [];
    const tokensDetailed = [];
    let currentWord = '', wordStart = 0, wordEnd = 0;
    let wordConfs = [];

    ids.forEach((tokId, i) => {
      const raw = this.tokenizer.id2token[tokId];
      if (raw === this.tokenizer.blankToken) return;

      const isWordStart = raw.startsWith('▁');
      const cleanTok = isWordStart ? raw.slice(1) : raw;
      const ts = tokenTimes[i] || [null, null];
      const conf = tokenConfs[i];

      // tokensDetailed entry
      const tokEntry = { token: cleanTok, raw_token: raw, is_word_start: isWordStart };
      if (returnTimestamps) { tokEntry.start_time = +ts[0].toFixed(3); tokEntry.end_time = +ts[1].toFixed(3); }
      if (returnConfidences) tokEntry.confidence = +conf.toFixed(4);
      tokensDetailed.push(tokEntry);

      // accumulate into words
      if (isWordStart) {
        if (currentWord) {
          const avg = wordConfs.length ? wordConfs.reduce((a, b) => a + b, 0) / wordConfs.length : 0;
          words.push({ text: currentWord, start_time: +wordStart.toFixed(3), end_time: +wordEnd.toFixed(3), confidence: +avg.toFixed(4) });
        }
        currentWord = cleanTok;
        if (returnTimestamps) { wordStart = ts[0]; wordEnd = ts[1]; }
        wordConfs = returnConfidences ? [conf] : [];
      } else {
        currentWord += cleanTok;
        if (returnTimestamps) wordEnd = ts[1];
        if (returnConfidences) wordConfs.push(conf);
      }
    });

    if (currentWord) {
      const avg = wordConfs.length ? wordConfs.reduce((a, b) => a + b, 0) / wordConfs.length : 0;
      words.push({ text: currentWord, start_time: +wordStart.toFixed(3), end_time: +wordEnd.toFixed(3), confidence: +avg.toFixed(4) });
    }

    const avgWordConf = words.length && returnConfidences ? words.reduce((a, b) => a + b.confidence, 0) / words.length : null;
    const avgTokenConf = tokensDetailed.length && returnConfidences ? tokensDetailed.reduce((a, b) => a + (b.confidence || 0), 0) / tokensDetailed.length : null;

    if (perfEnabled) {
      const total = performance.now() - t0;
      const rtf = audioDur / (total / 1000);
      console.log(`[Perf] RTF: ${rtf.toFixed(2)}x (audio ${audioDur.toFixed(2)} s, time ${(total / 1000).toFixed(2)} s)`);
      console.table({ Preprocess: `${tPreproc.toFixed(1)} ms`, Encode: `${tEncode.toFixed(1)} ms`, Decode: `${tDecode.toFixed(1)} ms`, Tokenize: `${tToken.toFixed(1)} ms`, Total: `${total.toFixed(1)} ms` });
    }

    const result = {
      utterance_text: text,
      words,
      tokens: tokensDetailed,
      confidence_scores: returnConfidences ? {
        token: tokenConfs.map(c => +c.toFixed(4)),
        token_avg: +avgTokenConf?.toFixed(4),
        word: words.map(w => w.confidence),
        word_avg: +avgWordConf?.toFixed(4),
        frame: frameConfs.map(f => +f.toFixed(4)),
        frame_avg: frameConfs.length ? +(frameConfs.reduce((a, b) => a + b, 0) / frameConfs.length).toFixed(4) : null,
        overall_log_prob: +overallLogProb.toFixed(6)
      } : { overall_log_prob: null, frame: null, frame_avg: null },
      metrics: perfEnabled ? {
        preprocess_ms: +tPreproc.toFixed(1),
        encode_ms: +tEncode.toFixed(1),
        decode_ms: +tDecode.toFixed(1),
        tokenize_ms: +tToken.toFixed(1),
        total_ms: +((performance.now() - t0).toFixed(1)),
        rtf: +(audioDur / ((performance.now() - t0) / 1000)).toFixed(2),
        preprocessor_backend: preprocessorPath,
        mel_cache: melCacheInfo?.cached ? {
          cached_frames: melCacheInfo.cachedFrames,
          new_frames: melCacheInfo.newFrames,
        } : null,
      } : null,
      is_final: !inc && !previousDecoderState, // mark non-final when incremental or streaming mode
    };

    // NEW: Include decoder state for streaming continuation
    if (returnDecoderState) {
      result.decoderState = this._snapshotDecoderState(decoderState);
    }
    // NEW: Include raw token IDs for advanced merging
    if (returnTokenIds) {
      result.tokenIds = ids.slice();
    }
    // NEW: Include frame-aligned streaming data for advanced merging
    if (returnFrameIndices) {
      result.frameIndices = tokenFrameIndices.slice();
    }
    if (returnLogProbs) {
      result.logProbs = tokenLogProbs.map(lp => +lp.toFixed(6));
    }
    if (returnTdtSteps) {
      result.tdtSteps = tokenTdtSteps.slice();
    }

    // Dispose final decoder state tensors (snapshots already copied the data)
    this._disposeDecoderState(decoderState);

    return result;
  }

  /**
   * Create a stateful streaming transcriber for this model.
   * This provides a convenient API for processing sequential audio chunks
   * without needing complex merging logic.
   * 
   * @param {Object} opts - Streaming options
   * @param {number} opts.chunkDuration - Expected chunk duration in seconds (for timestamp calculation)
   * @param {boolean} opts.returnTimestamps - Include timestamps in output
   * @param {boolean} opts.returnConfidences - Include confidence scores
   * @returns {StatefulStreamingTranscriber}
   */
  createStreamingTranscriber(opts = {}) {
    return new StatefulStreamingTranscriber(this, opts);
  }

  /**
   * Stop ORT profiling (if enabled) for all sessions and print a quick summary
   * of time spent on GPU (WebGPU) vs CPU (WASM) kernels. Returns the parsed
   * summary object for further inspection.
   */
  endProfiling() {
    try { this.encoderSession?.endProfiling(); } catch (e) { /* ignore */ }
    try { this.joinerSession?.endProfiling(); } catch (e) { /* ignore */ }

    const FS = this.ort?.env?.wasm?.FS;
    if (!FS) {
      console.warn('[Parakeet] Profiling FS not accessible');
      return null;
    }

    const files = FS.readdir('/tmp').filter(f => f.startsWith('profile_') && f.endsWith('.json'));
    if (!files.length) {
      console.warn('[Parakeet] No profiling files found. Was profiling enabled?');
      return null;
    }

    const summary = {};
    for (const file of files) {
      try {
        const txt = FS.readFile('/tmp/' + file, { encoding: 'utf8' });
        const events = JSON.parse(txt);
        let gpu = 0, cpu = 0;
        for (const ev of events) {
          if (ev.cat === 'Node') {
            const prov = ev.args?.provider;
            if (prov === 'webgpu') gpu += ev.dur;
            else if (prov) cpu += ev.dur;
          }
        }
        summary[file] = { gpu_us: gpu, cpu_us: cpu, total_us: gpu + cpu };
      } catch (err) {
        console.warn('[Parakeet] Failed to parse profile file', file, err);
      }
    }
    console.table(summary);
    return summary;
  }
}

/**
 * StatefulStreamingTranscriber - High-level API for streaming transcription.
 * 
 * This class wraps a ParakeetModel and provides a simple interface for processing
 * sequential audio chunks without complex merging logic. It maintains decoder state
 * between chunks, allowing for seamless continuation of transcription.
 * 
 * Usage:
 * ```javascript
 * const model = await fromHub('parakeet-tdt-0.6b-v3');
 * const streamer = model.createStreamingTranscriber({ returnTimestamps: true });
 * 
 * // Process audio chunks sequentially
 * const result1 = await streamer.processChunk(audioChunk1);  // "Hello"
 * const result2 = await streamer.processChunk(audioChunk2);  // "Hello world"
 * const result3 = await streamer.processChunk(audioChunk3);  // "Hello world how are you"
 * 
 * // Get final result
 * const final = streamer.finalize();
 * ```
 */
export class StatefulStreamingTranscriber {
  /**
   * Create a streaming transcriber.
   * @param {ParakeetModel} model - The Parakeet model to use
   * @param {Object} opts - Options
   * @param {boolean} opts.returnTimestamps - Include timestamps (default: true)
   * @param {boolean} opts.returnConfidences - Include confidence scores (default: false)
   * @param {boolean} opts.returnTokenIds - Include raw token IDs (default: false)
   * @param {number} opts.sampleRate - Audio sample rate (default: 16000)
   * @param {boolean} opts.debug - Enable debug logging (default: false)
   */
  constructor(model, opts = {}) {
    this.model = model;
    this.opts = {
      returnTimestamps: opts.returnTimestamps ?? true,
      returnConfidences: opts.returnConfidences ?? false,
      returnTokenIds: opts.returnTokenIds ?? false,
      sampleRate: opts.sampleRate ?? 16000,
      debug: opts.debug ?? false,
    };

    // Internal state
    this._decoderState = null;
    this._currentOffset = 0;
    this._totalWords = [];
    this._totalTokenIds = [];
    this._chunkCount = 0;
    this._isFinalized = false;
  }

  /**
   * Process an audio chunk and return the cumulative transcription.
   * 
   * @param {Float32Array} audio - Audio samples (16kHz mono PCM)
   * @returns {Promise<Object>} Transcription result with cumulative text and words
   */
  async processChunk(audio) {
    if (this._isFinalized) {
      throw new Error('Streamer is finalized. Create a new instance to process more audio.');
    }

    const chunkDuration = audio.length / this.opts.sampleRate;

    // Transcribe with state continuation
    const result = await this.model.transcribe(audio, this.opts.sampleRate, {
      returnTimestamps: this.opts.returnTimestamps,
      returnConfidences: this.opts.returnConfidences,
      returnTokenIds: this.opts.returnTokenIds,
      previousDecoderState: this._decoderState,
      returnDecoderState: true,
      timeOffset: this._currentOffset,
    });

    // Update internal state
    this._decoderState = result.decoderState;
    this._currentOffset += chunkDuration;
    this._chunkCount++;

    // Append new words to cumulative list
    if (result.words && result.words.length > 0) {
      this._totalWords.push(...result.words);
    }

    // Append token IDs if tracking
    if (this.opts.returnTokenIds && result.tokenIds) {
      this._totalTokenIds.push(...result.tokenIds);
    }

    if (this.opts.debug) {
      console.log(`[Streamer] Chunk ${this._chunkCount}: "${result.utterance_text}" (${result.words?.length || 0} words, offset: ${this._currentOffset.toFixed(2)}s)`);
    }

    // Return cumulative result
    return {
      // Current chunk text
      chunkText: result.utterance_text,
      chunkWords: result.words || [],

      // Cumulative transcript (NO MERGING - just concatenation!)
      text: this._totalWords.map(w => w.text).join(' '),
      words: this._totalWords.slice(),

      // Metadata
      totalDuration: this._currentOffset,
      chunkCount: this._chunkCount,
      is_final: false,

      // Optional data
      ...(this.opts.returnTokenIds ? { tokenIds: this._totalTokenIds.slice() } : {}),
      ...(this.opts.returnConfidences && result.confidence_scores ? { confidence_scores: result.confidence_scores } : {}),
      metrics: result.metrics,
    };
  }

  /**
   * Finalize the streaming session and return the complete transcript.
   * After calling finalize(), no more chunks can be processed.
   * 
   * @returns {Object} Final transcription result
   */
  finalize() {
    this._isFinalized = true;

    return {
      text: this._totalWords.map(w => w.text).join(' '),
      words: this._totalWords.slice(),
      totalDuration: this._currentOffset,
      chunkCount: this._chunkCount,
      is_final: true,
      ...(this.opts.returnTokenIds ? { tokenIds: this._totalTokenIds.slice() } : {}),
    };
  }

  /**
   * Reset the streamer to process a new audio stream.
   */
  reset() {
    this._decoderState = null;
    this._currentOffset = 0;
    this._totalWords = [];
    this._totalTokenIds = [];
    this._chunkCount = 0;
    this._isFinalized = false;
  }

  /**
   * Get current state for inspection/debugging.
   */
  getState() {
    return {
      hasDecoderState: this._decoderState !== null,
      currentOffset: this._currentOffset,
      wordCount: this._totalWords.length,
      chunkCount: this._chunkCount,
      isFinalized: this._isFinalized,
    };
  }
}


/**
 * Utility class for caching mel spectrogram features.
 * Since mel computation is stateless, identical audio always produces identical features.
 * This can save 10-15% computation when retranscribing overlapping audio regions.
 */
export class MelFeatureCache {
  /**
   * @param {Object} opts - Cache options
   * @param {number} opts.maxCacheSizeMB - Maximum cache size in MB (default 50)
   */
  constructor(opts = {}) {
    this.maxCacheSizeMB = opts.maxCacheSizeMB || 50;
    this.cache = new Map();  // key → { features, T, melBins, timestamp }
    this.currentSizeMB = 0;
  }

  /**
   * Generate a cache key from audio samples.
   * Uses a fast hash based on length + sampled values.
   * @param {Float32Array} audio - Audio samples
   * @returns {string} Cache key
   */
  _generateKey(audio) {
    let hash = audio.length;
    // Sample every 1000th sample for fast hashing
    for (let i = 0; i < audio.length; i += 1000) {
      hash = ((hash << 5) - hash + Math.floor(audio[i] * 32768)) | 0;
    }
    return `${audio.length}_${hash}`;
  }

  /**
   * Get mel features, using cache if available.
   * @param {ParakeetModel} model - The model to use for computation
   * @param {Float32Array} audio - Audio samples
   * @returns {Promise<{features: Float32Array, T: number, melBins: number, cached: boolean}>}
   */
  async getFeatures(model, audio) {
    const key = this._generateKey(audio);

    if (this.cache.has(key)) {
      const cached = this.cache.get(key);
      // Update timestamp for LRU
      cached.timestamp = Date.now();
      return { ...cached, cached: true };
    }

    // Compute features
    const { features, T, melBins } = await model.computeFeatures(audio);

    // Calculate size (Float32 = 4 bytes)
    const sizeMB = (features.length * 4) / (1024 * 1024);

    // Evict old entries if needed
    while (this.currentSizeMB + sizeMB > this.maxCacheSizeMB && this.cache.size > 0) {
      this._evictOldest();
    }

    // Store in cache
    this.cache.set(key, { features, T, melBins, timestamp: Date.now(), sizeMB });
    this.currentSizeMB += sizeMB;

    return { features, T, melBins, cached: false };
  }

  /**
   * Evict the oldest cache entry (LRU).
   */
  _evictOldest() {
    let oldestKey = null;
    let oldestTime = Infinity;

    for (const [key, value] of this.cache) {
      if (value.timestamp < oldestTime) {
        oldestTime = value.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      const entry = this.cache.get(oldestKey);
      this.currentSizeMB -= entry.sizeMB;
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Clear the entire cache.
   */
  clear() {
    this.cache.clear();
    this.currentSizeMB = 0;
  }

  /**
   * Get cache statistics.
   */
  getStats() {
    return {
      entries: this.cache.size,
      sizeMB: this.currentSizeMB.toFixed(2),
      maxSizeMB: this.maxCacheSizeMB,
    };
  }
}


/**
 * Utility class for merging overlapping transcriptions using frame-aligned tokens.
 * This provides more accurate merging than text-based alignment by using
 * token IDs and frame indices for precise matching.
 */
export class FrameAlignedMerger {
  /**
   * @param {Object} opts - Merger options
   * @param {number} opts.frameTimeStride - Time per encoder frame (default 0.08s)
   * @param {number} opts.timeTolerance - Max time difference for token matching (default 0.2s)
   * @param {number} opts.stabilityThreshold - Appearances needed to confirm token (default 2)
   */
  constructor(opts = {}) {
    this.frameTimeStride = opts.frameTimeStride || 0.08;
    this.timeTolerance = opts.timeTolerance || 0.2;
    this.stabilityThreshold = opts.stabilityThreshold || 2;

    // State
    this.confirmedTokens = [];  // Tokens that passed stability check
    this.pendingTokens = [];    // Tokens awaiting confirmation
    this.stabilityMap = new Map();  // tokenKey → appearance count
  }

  /**
   * Create a unique key for a token based on ID and approximate time.
   * @param {number} tokenId - Token ID
   * @param {number} absTime - Absolute timestamp
   * @returns {string} Token key
   */
  _tokenKey(tokenId, absTime) {
    // Round time to 100ms buckets for stability matching
    const bucket = Math.round(absTime * 10);
    return `${tokenId}@${bucket}`;
  }

  /**
   * Process a new transcription result and merge with existing state.
   * 
   * @param {Object} result - Transcription result from parakeet.js
   * @param {number[]} result.tokenIds - Token IDs
   * @param {number[]} result.frameIndices - Encoder frame index per token
   * @param {number[][]} result.timestamps - [start, end] per token (from words or tokens)
   * @param {number[]} result.logProbs - Log probability per token (optional)
   * @param {number} chunkStartTime - Absolute start time of this chunk
   * @param {number} overlapDuration - Duration of overlap with previous chunk
   * @returns {Object} Merge result
   */
  processChunk(result, chunkStartTime, overlapDuration = 0) {
    if (!result.tokenIds || !result.frameIndices) {
      throw new Error('FrameAlignedMerger requires tokenIds and frameIndices');
    }

    const tokens = result.tokenIds.map((id, i) => ({
      id,
      frameIndex: result.frameIndices[i],
      absTime: chunkStartTime + (result.frameIndices[i] * this.frameTimeStride),
      logProb: result.logProbs?.[i] ?? 0,
      text: result.tokens?.[i]?.token || '',
    }));

    const overlapEndTime = chunkStartTime + overlapDuration;

    // Separate tokens into overlap region and new region
    const overlapTokens = tokens.filter(t => t.absTime < overlapEndTime);
    const newTokens = tokens.filter(t => t.absTime >= overlapEndTime);

    // Find anchors in overlap region
    const anchors = this._findAnchors(overlapTokens);

    // If we found anchors, we can confidently merge
    if (anchors.length > 0) {
      const anchorTime = anchors[0].absTime;

      // Confirm pending tokens up to anchor
      const toConfirm = this.pendingTokens.filter(t => t.absTime < anchorTime);
      this.confirmedTokens.push(...toConfirm);

      // Update stability for overlap tokens
      for (const token of overlapTokens) {
        const key = this._tokenKey(token.id, token.absTime);
        const count = (this.stabilityMap.get(key) || 0) + 1;
        this.stabilityMap.set(key, count);

        if (count >= this.stabilityThreshold) {
          // Token is stable - add to confirmed if not already there
          const alreadyConfirmed = this.confirmedTokens.some(
            t => Math.abs(t.absTime - token.absTime) < this.timeTolerance && t.id === token.id
          );
          if (!alreadyConfirmed) {
            this.confirmedTokens.push(token);
          }
        }
      }
    }

    // New tokens become pending
    this.pendingTokens = newTokens;

    return {
      confirmed: this.confirmedTokens.slice(),
      pending: this.pendingTokens.slice(),
      anchorsFound: anchors.length,
      totalTokens: this.confirmedTokens.length + this.pendingTokens.length,
    };
  }

  /**
   * Find anchor tokens (tokens that match pending tokens).
   * @param {Array} overlapTokens - Tokens from overlap region
   * @returns {Array} Matching anchor tokens
   */
  _findAnchors(overlapTokens) {
    const anchors = [];

    for (const newTok of overlapTokens) {
      for (const pendTok of this.pendingTokens) {
        if (
          newTok.id === pendTok.id &&
          Math.abs(newTok.absTime - pendTok.absTime) < this.timeTolerance
        ) {
          anchors.push(newTok);
          break;
        }
      }
    }

    return anchors.sort((a, b) => a.absTime - b.absTime);
  }

  /**
   * Get the current merged text.
   * @param {ParakeetTokenizer} tokenizer - Tokenizer for decoding
   * @returns {string} Merged transcript text
   */
  getText(tokenizer) {
    const allTokens = [...this.confirmedTokens, ...this.pendingTokens];
    allTokens.sort((a, b) => a.absTime - b.absTime);
    const ids = allTokens.map(t => t.id);
    return tokenizer.decode(ids);
  }

  /**
   * Get all tokens (confirmed + pending) sorted by time.
   * @returns {Array} All tokens
   */
  getAllTokens() {
    const all = [...this.confirmedTokens, ...this.pendingTokens];
    return all.sort((a, b) => a.absTime - b.absTime);
  }

  /**
   * Reset the merger state.
   */
  reset() {
    this.confirmedTokens = [];
    this.pendingTokens = [];
    this.stabilityMap.clear();
  }

  /**
   * Get merger state for debugging.
   */
  getState() {
    return {
      confirmedCount: this.confirmedTokens.length,
      pendingCount: this.pendingTokens.length,
      stabilityMapSize: this.stabilityMap.size,
    };
  }
}


/**
 * LCS + PTFA Merger: Hybrid algorithm combining NeMo's Longest Common Subsequence
 * merge with Probabilistic Token-Frame Alignment enhancements.
 * 
 * Key features:
 * - LCS substring matching on token IDs (NeMo-style)
 * - Frame index verification for alignment validation
 * - Vignetting (temporal weighting) for boundary de-prioritization
 * - LogProb-based arbitration for conflict resolution
 * - Sequence anchoring (K consecutive matches required)
 */
export class LCSPTFAMerger {
  /**
   * @param {Object} opts - Merger options
   * @param {number} opts.frameTimeStride - Time per encoder frame (default 0.08s)
   * @param {number} opts.timeTolerance - Max time diff for frame alignment (default 0.15s)
   * @param {number} opts.sequenceAnchorLength - Min consecutive matches for anchor (default 3)
   * @param {number} opts.vignetteSigmaFactor - Gaussian sigma as fraction of total (default 0.25)
   */
  constructor(opts = {}) {
    this.frameTimeStride = opts.frameTimeStride || 0.08;
    this.timeTolerance = opts.timeTolerance || 0.15;
    this.K = opts.sequenceAnchorLength || 3;
    this.vignetteSigmaFactor = opts.vignetteSigmaFactor || 0.25;

    // State
    this.confirmedTokens = [];
    this.pendingTokens = [];
    this._lcsBuffer = new Int32Array(1024);
  }

  /**
   * Process a new transcription result and merge with existing state.
   * 
   * @param {Object} result - Transcription result from parakeet.js
   * @param {number[]} result.tokenIds - Token IDs
   * @param {number[]} result.frameIndices - Encoder frame index per token
   * @param {number[]} [result.logProbs] - Log probability per token
   * @param {Object[]} [result.tokens] - Token details with text
   * @param {number} chunkStartTime - Absolute start time of this chunk
   * @param {number} overlapDuration - Duration of overlap with previous chunk
   * @returns {Object} Merge result with confirmed/pending tokens
   */
  processChunk(result, chunkStartTime, overlapDuration = 0) {
    if (!result.tokenIds || !result.frameIndices) {
      throw new Error('LCSPTFAMerger requires tokenIds and frameIndices');
    }

    const totalTokens = result.tokenIds.length;

    // Build token objects with all metadata
    const tokens = result.tokenIds.map((id, i) => ({
      id,
      frameIndex: result.frameIndices[i],
      absTime: chunkStartTime + (result.frameIndices[i] * this.frameTimeStride),
      logProb: result.logProbs?.[i] ?? 0,
      text: result.tokens?.[i]?.token || '',
      vignetteWeight: this._computeVignette(i, totalTokens)
    }));

    const overlapEnd = chunkStartTime + overlapDuration;

    // Partition into overlap and new regions
    const overlapTokens = tokens.filter(t => t.absTime < overlapEnd);
    const newTokens = tokens.filter(t => t.absTime >= overlapEnd);

    // Edge case: first chunk (no pending tokens)
    if (this.pendingTokens.length === 0) {
      this.pendingTokens = tokens;
      return {
        confirmed: this.confirmedTokens.slice(),
        pending: this.pendingTokens.slice(),
        lcsLength: 0,
        anchorValid: false,
        isFirstChunk: true
      };
    }

    // === STEP 1: NeMo-style LCS on token IDs ===
    const X = this.pendingTokens.map(t => t.id);
    const Y = overlapTokens.map(t => t.id);
    const [startX, startY, lcsLength] = this._lcsSubstring(X, Y);

    // === STEP 2: PTFA Enhancement - Verify frame alignment ===
    let anchorValid = false;
    if (lcsLength >= this.K) {
      anchorValid = this._verifyFrameAlignment(
        this.pendingTokens.slice(startX, startX + lcsLength),
        overlapTokens.slice(startY, startY + lcsLength)
      );
    }

    if (anchorValid) {
      // Strong anchor found - confirm tokens up to and including anchor
      const confirmEnd = startX + lcsLength;
      this.confirmedTokens.push(...this.pendingTokens.slice(0, confirmEnd));
    } else if (lcsLength > 0) {
      // Weak anchor - use logProb arbitration for overlap region
      const pathA = this.pendingTokens.slice(startX, startX + lcsLength);
      const pathB = overlapTokens.slice(startY, startY + lcsLength);
      const bestPath = this._arbitrateByLogProb(pathA, pathB);

      // Confirm tokens before overlap, then add best path
      this.confirmedTokens.push(...this.pendingTokens.slice(0, startX));
      this.confirmedTokens.push(...bestPath);
    } else {
      // No overlap found - possible discontinuity, confirm all pending
      this.confirmedTokens.push(...this.pendingTokens);
    }

    // New tokens become pending
    this.pendingTokens = newTokens;

    return {
      confirmed: this.confirmedTokens.slice(),
      pending: this.pendingTokens.slice(),
      lcsLength,
      anchorValid,
      overlapTokenCount: overlapTokens.length
    };
  }

  /**
   * Longest Common Substring algorithm on token ID arrays.
   * Returns [startX, startY, length] for the longest common substring.
   * 
   * @param {number[]} X - Token IDs from previous chunk
   * @param {number[]} Y - Token IDs from overlap region
   * @returns {[number, number, number]} [startX, startY, length]
   */
  _lcsSubstring(X, Y) {
    const m = X.length;
    const n = Y.length;

    if (m === 0 || n === 0) return [0, 0, 0];

    // Dynamic programming matrix
    // Using 1D array for space efficiency: LCS[j] = LCS value at column j
    if (this._lcsBuffer.length < n + 1) {
      this._lcsBuffer = new Int32Array(n + 1 + 1024);
    }
    const LCS = this._lcsBuffer;
    LCS.fill(0, 0, n + 1);

    let maxLen = 0;
    let endX = 0;
    let endY = 0;

    for (let i = 1; i <= m; i++) {
      // Traverse right to left to avoid overwriting needed values
      let prev = 0;
      for (let j = 1; j <= n; j++) {
        const temp = LCS[j];
        if (X[i - 1] === Y[j - 1]) {
          LCS[j] = prev + 1;
          if (LCS[j] > maxLen) {
            maxLen = LCS[j];
            endX = i;
            endY = j;
          }
        } else {
          LCS[j] = 0;
        }
        prev = temp;
      }
    }

    // Convert end positions to start positions
    const startX = endX - maxLen;
    const startY = endY - maxLen;

    return [startX, startY, maxLen];
  }

  /**
   * Verify that matched tokens have aligned frame indices within tolerance.
   * 
   * @param {Object[]} tokA - Tokens from previous chunk
   * @param {Object[]} tokB - Tokens from current overlap
   * @returns {boolean} True if all tokens align within tolerance
   */
  _verifyFrameAlignment(tokA, tokB) {
    if (tokA.length !== tokB.length) return false;

    for (let k = 0; k < tokA.length; k++) {
      const timeDiff = Math.abs(tokA[k].absTime - tokB[k].absTime);
      if (timeDiff > this.timeTolerance) {
        return false;
      }
    }
    return true;
  }

  /**
   * Arbitrate between conflicting paths using weighted log probabilities.
   * When logProbs are unavailable (all zero), defaults to pathA (previous chunk,
   * which typically has more stable context).
   * 
   * @param {Object[]} pathA - Tokens from path A (previous chunk)
   * @param {Object[]} pathB - Tokens from path B (current overlap)
   * @returns {Object[]} The path with higher weighted score, or pathA if no logProbs
   */
  _arbitrateByLogProb(pathA, pathB) {
    // Check if logProbs are actually available (non-zero)
    const hasLogProbs = pathA.some(t => t.logProb !== 0) || pathB.some(t => t.logProb !== 0);
    if (!hasLogProbs) {
      // No logProbs available - prefer previous chunk (more stable context)
      return pathA;
    }
    const scoreA = pathA.reduce((sum, t) => sum + (t.logProb * t.vignetteWeight), 0);
    const scoreB = pathB.reduce((sum, t) => sum + (t.logProb * t.vignetteWeight), 0);
    return scoreA >= scoreB ? pathA : pathB;
  }

  /**
   * Compute Gaussian vignette weight for a token based on position.
   * Tokens at center have weight ≈ 1.0, boundary tokens ≈ 0.6.
   * 
   * @param {number} idx - Token index
   * @param {number} total - Total number of tokens
   * @returns {number} Weight between 0 and 1
   */
  _computeVignette(idx, total) {
    if (total <= 1) return 1.0;

    const midpoint = (total - 1) / 2;
    const sigma = total * this.vignetteSigmaFactor;

    return Math.exp(-Math.pow(idx - midpoint, 2) / (2 * sigma * sigma));
  }

  /**
   * Get current merged text using a tokenizer.
   * 
   * @param {Object} tokenizer - Parakeet tokenizer with decode() method
   * @returns {Object} Texts for confirmed and pending
   */
  getText(tokenizer) {
    const confirmedIds = this.confirmedTokens.map(t => t.id);
    const pendingIds = this.pendingTokens.map(t => t.id);

    return {
      confirmed: tokenizer.decode(confirmedIds),
      pending: tokenizer.decode(pendingIds),
      full: tokenizer.decode([...confirmedIds, ...pendingIds])
    };
  }

  /**
   * Get all tokens sorted by time.
   * 
   * @returns {Object[]} All tokens (confirmed + pending)
   */
  getAllTokens() {
    return [...this.confirmedTokens, ...this.pendingTokens]
      .sort((a, b) => a.absTime - b.absTime);
  }

  /**
   * Reset merger state.
   */
  reset() {
    this.confirmedTokens = [];
    this.pendingTokens = [];
  }

  /**
   * Get merger state for debugging.
   * 
   * @returns {Object} State summary
   */
  getState() {
    return {
      confirmedCount: this.confirmedTokens.length,
      pendingCount: this.pendingTokens.length,
      lastConfirmedTime: this.confirmedTokens.length > 0
        ? this.confirmedTokens[this.confirmedTokens.length - 1].absTime
        : 0,
      lastPendingTime: this.pendingTokens.length > 0
        ? this.pendingTokens[this.pendingTokens.length - 1].absTime
        : 0
    };
  }
}
