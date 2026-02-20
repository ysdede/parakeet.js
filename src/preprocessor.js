import { initOrt } from './backend.js';

/**
 * ONNX-based NeMo preprocessor (80- or 128-bin log-mel spectrogram).
 * Produces mel features compatible with Parakeet encoder inputs.
 */
export class OnnxPreprocessor {
  /**
   * @param {string} modelUrl URL to the preprocessor onnx file (e.g. nemo128.onnx)
   * @param {Object} [opts]
   * @param {('webgpu'|'wasm')} [opts.backend]
   */
  constructor(modelUrl, opts = {}) {
    this.modelUrl = modelUrl;
    this.opts = opts;
    if (this.opts.enableGraphCapture === undefined) {
      this.opts.enableGraphCapture = this.opts.backend === 'wasm';
    }
    this.session = null;
    this.ort = null;
    this._sessionPromise = null; // in-flight init promise — deduplicates concurrent calls
  }

  /**
   * Lazily create and cache the ONNX Runtime session.
   * @returns {Promise<void>}
   */
  async _ensureSession() {
    // Already initialised — fast path
    if (this.session) return;

    // Deduplicate concurrent initialisations: share the in-flight promise
    if (this._sessionPromise) {
      await this._sessionPromise;
      return;
    }

    this._sessionPromise = (async () => {
      this.ort = await initOrt(this.opts);
      // Build session options. Workaround for ORT-web bug where
      // passing `enableGraphCapture:false` still triggers the
      // graph-capture execution path (which then requires external
      // buffers). We therefore only include the flag when it is
      // explicitly **true**.
      const sessOpts = this.opts.enableGraphCapture ? {
        enableProfiling: this.opts.enableProfiling || false,
        enableGraphCapture: true
      } : {
        enableProfiling: this.opts.enableProfiling || false
      };
      const create = async () => {
        try {
          return await this.ort.InferenceSession.create(this.modelUrl, sessOpts);
        } catch (e) {
          const msg = (e.message || '') + '';
          if (sessOpts.enableGraphCapture && msg.includes('graph capture')) {
            console.warn('[Preprocessor] Graph capture unsupported, retrying without it');
            return await this.ort.InferenceSession.create(this.modelUrl, { ...sessOpts, enableGraphCapture: false });
          }
          throw e;
        }
      };
      this.session = await create();
    })();

    try {
      await this._sessionPromise;
    } catch (e) {
      // Clear promise on failure so the next caller can retry
      this._sessionPromise = null;
      throw e;
    } finally {
      // Clear the promise once resolved — session is set and the promise is no longer needed
      if (this.session) this._sessionPromise = null;
    }
  }

  /**
   * Convert PCM audio Float32Array into log-mel features recognised by Parakeet.
   * @param {Float32Array} audio Normalised mono PCM [-1,1] at 16 kHz.
   * @returns {Promise<{features: Float32Array, length: number}>}
   */
  async process(audio) {
    await this._ensureSession();

    // Avoid copying if input is already Float32Array and contiguous
    let buffer;
    if (audio instanceof Float32Array) {
      // Only reuse the array directly if it is a full, unsliced buffer view to avoid
      // passing a subarray whose underlying buffer contains extra data outside the view.
      const isFullBufferView = audio.byteOffset === 0 && audio.buffer.byteLength === audio.byteLength;
      buffer = isFullBufferView ? audio : new Float32Array(audio);
    } else {
      // Convert other array types to Float32Array
      buffer = new Float32Array(audio);
    }

    const waveforms = new this.ort.Tensor('float32', buffer, [1, buffer.length]);

    const lenArr = new BigInt64Array([BigInt(buffer.length)]);
    const waveforms_lens = new this.ort.Tensor('int64', lenArr, [1]);

    const feeds = { waveforms, waveforms_lens };
    const outs = await this.session.run(feeds);

    const featuresTensor = outs['features'];
    const features_lens = outs['features_lens'];

    const featuresData = new Float32Array(featuresTensor.data);
    const validLength = Number(features_lens.data[0]);

    // Dispose of the tensors to prevent WASM memory leaks
    waveforms.dispose?.();
    waveforms_lens.dispose?.();
    featuresTensor.dispose?.();
    features_lens.dispose?.();

    return {
      features: featuresData,
      length: validLength
    };
  }
} 
