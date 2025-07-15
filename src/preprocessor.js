import { initOrt } from './backend.js';

// Runs the Nemo-style preprocessor ONNX model (80- or 128-bin log-mel spectrogram).
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
  }

  async _ensureSession() {
    if (!this.session) {
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
    }
  }

  /**
   * Convert PCM audio Float32Array into log-mel features recognised by Parakeet.
   * @param {Float32Array} audio Normalised mono PCM [-1,1] at 16 kHz.
   * @returns {Promise<{features:Float32Array,length:number}>}
   */
  async process(audio) {
    await this._ensureSession();

    // The model expects [B, N] float32 waveforms and lengths.
    const buffer = new Float32Array(audio); // copy to ensure contiguous
    const waveforms = new this.ort.Tensor('float32', buffer, [1, buffer.length]);

    const lenArr = new BigInt64Array([BigInt(buffer.length)]);
    const waveforms_lens = new this.ort.Tensor('int64', lenArr, [1]);

    const feeds = { waveforms, waveforms_lens };
    const outs = await this.session.run(feeds);

    const featuresTensor = outs['features'];
    const features_lens = outs['features_lens'];

    return {
      features: featuresTensor.data,
      length: Number(features_lens.data[0])
    };
  }
} 