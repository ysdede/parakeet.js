import { getParakeetModel, ParakeetModel } from 'parakeet.js';

// Tiny utility for event subscription
function createEmitter() {
  const listeners = new Set();
  return {
    emit(payload) {
      listeners.forEach((cb) => {
        try { cb(payload); } catch (_) {}
      });
    },
    subscribe(cb) {
      listeners.add(cb);
      return () => listeners.delete(cb);
    }
  };
}

// Lightweight singleton wrapper around Parakeet.js so we only load the model once
class ParakeetService {
  constructor() {
    this._modelPromise = null; // Promise<ParakeetModel>
    this._loaded = false;
    this._warmed = false;
    this._emitter = createEmitter();
    this.config = {}; // Will be initialized by store
  }

  /**
   * Lazily initialise the Parakeet model. Subsequent calls return the same instance.
   * @returns {Promise<ParakeetModel>} resolved when the model is ready
   */
  async _initModel() {
    if (this._modelPromise) return this._modelPromise;

    this._modelPromise = (async () => {
      // NOTE: you can change repoId or backend settings here if desired
      const {
        backend = 'webgpu-hybrid',
        quantization = 'fp32',
        decoderInt8 = true,
        preprocessor = 'nemo128',
        modelRepoId = 'ysdede/parakeet-tdt-0.6b-v2-onnx',
        cpuThreads = 6,
        verbose = false
      } = this.config;

      // Download (or retrieve from IndexedDB cache) all asset URLs
      const { urls, filenames } = await getParakeetModel(modelRepoId, {
        backend: backend,
        quantization: quantization,
        decoderInt8: decoderInt8,
        preprocessor: preprocessor,
        progress: ({ file, loaded, total }) => {
          if (total) {
            const pct = loaded / total;
            this._emitter.emit({ phase: 'downloading', file, progress: pct });
          }
        }
      });

      // Create runtime sessions (encoder on WebGPU, decoder on WASM)
      const model = await ParakeetModel.fromUrls({
        ...urls,
        filenames,
        backend: backend,
        decoderOnWasm: decoderInt8,
        decoderInt8: decoderInt8,
        cpuThreads: cpuThreads,
        verbose: verbose
      });

      this._emitter.emit({ phase: 'loaded' });
      console.log('[ParakeetService] Model loaded ✓');
      this._loaded = true;
      return model;
    })();

    return this._modelPromise;
  }

  async reloadWithConfig(newConfig) {
    console.log("ParakeetService: Reloading model with new config", newConfig);
    this.config = { ...newConfig };
    this._modelPromise = null;
    this._loaded = false;
    this._warmed = false;
    this._emitter.emit({ phase: 'reloading' });

    // The ModelLoader component will drive the next steps
    // by calling ensureLoaded and warmUp based on the new state.
    // We just need to signal the state change.
    await this.ensureLoaded();
    
    // Add a small delay before warming up to prevent blocking
    await new Promise(resolve => setTimeout(resolve, 10));
    
    await this.warmUp();
    console.log("ParakeetService: Model reloaded and warmed up.");
  }

  /** Public method for UI to trigger loading if not already loaded */
  async ensureLoaded() {
    await this._initModel();
    return this._loaded;
  }

  get isLoaded() {
    return this._loaded;
  }

  /**
   * Transcribe raw PCM audio.
   * @param {Float32Array} pcm - 1-channel PCM samples.
   * @param {number} sampleRate - sample rate of pcm.
   * @returns {Promise<object>} Full Parakeet.js result object.
   */
  async transcribe(pcm, sampleRate) {
    if (!(pcm instanceof Float32Array)) {
      throw new TypeError('ParakeetService.transcribe expects Float32Array');
    }
    const model = await this._initModel();
    return model.transcribe(pcm, sampleRate, {
      returnTimestamps: true,
      returnConfidences: true,
      frameStride: this.config.stride || 1
    });
  }

  /**
   * Returns unsubscribe function.
   */
  onProgress(cb) {
    return this._emitter.subscribe(cb);
  }

  /** Perform a lightweight warm-up decoding to compile kernels */
  async warmUp(sampleRate = 16000) {
    if (this._warmed) return;
    await this.ensureLoaded();
    this._emitter.emit({ phase: 'warmup', progress: 0 });
    // 1 second of silence
    const pcm = new Float32Array(sampleRate);
    const model = await this._modelPromise;
    const start = performance.now();
    
    // Break the warmup into smaller chunks to prevent freezing
    await new Promise(resolve => setTimeout(resolve, 5));
    await model.transcribe(pcm, sampleRate, { frameStride: 4 });
    
    const dur = (performance.now() - start).toFixed(0);
    this._warmed = true;
    this._emitter.emit({ phase: 'ready', warmupMs: dur });
  }

  get isWarmed() {
    return this._warmed;
  }
}

export const parakeetService = new ParakeetService(); 