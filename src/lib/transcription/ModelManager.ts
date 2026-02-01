/**
 * BoncukJS v2.0 - Model Manager
 * 
 * Handles loading, caching, and managing parakeet.js model lifecycle.
 * Supports WebGPU with WASM fallback.
 */

import type { 
  ModelState, 
  BackendType, 
  ModelConfig, 
  ModelProgress, 
  ModelManagerCallbacks 
} from './types';

// Default model configuration (Parakeet TDT 0.6B)
const DEFAULT_MODEL: ModelConfig = {
  modelId: 'parakeet-tdt-0.6b-v3',
  encoderUrl: 'https://huggingface.co/nicoboss/parakeet-tdt-0.6b-v2-onnx/resolve/main/encoder-model.onnx',
  decoderUrl: 'https://huggingface.co/nicoboss/parakeet-tdt-0.6b-v2-onnx/resolve/main/decoder_joint-model.onnx',
  tokenizerUrl: 'https://huggingface.co/nicoboss/parakeet-tdt-0.6b-v2-onnx/resolve/main/vocab.txt',
  preprocessorUrl: 'https://huggingface.co/nicoboss/parakeet-tdt-0.6b-v2-onnx/resolve/main/nemo80.onnx',
};

export class ModelManager {
  private _state: ModelState = 'unloaded';
  private _progress: number = 0;
  private _backend: BackendType = 'webgpu';
  private _model: any = null; // ParakeetModel instance
  private _callbacks: ModelManagerCallbacks = {};
  private _isOfflineReady: boolean = false;

  constructor(callbacks: ModelManagerCallbacks = {}) {
    this._callbacks = callbacks;
  }

  // Getters
  getState(): ModelState { return this._state; }
  getProgress(): number { return this._progress; }
  getBackend(): BackendType { return this._backend; }
  getModel(): any { return this._model; }
  isOfflineReady(): boolean { return this._isOfflineReady; }

  /**
   * Load the model with WebGPU/WASM fallback
   */
  async loadModel(config: Partial<ModelConfig> = {}): Promise<void> {
    const modelConfig = { ...DEFAULT_MODEL, ...config };
    
    this._setState('loading');
    this._setProgress({ stage: 'init', progress: 0, message: 'Initializing...' });

    try {
      // 1. Detect WebGPU support
      const hasWebGPU = await this._detectWebGPU();
      this._backend = hasWebGPU ? 'webgpu' : 'wasm';
      
      this._setProgress({ 
        stage: 'backend', 
        progress: 10, 
        message: `Using ${this._backend.toUpperCase()} backend` 
      });

      // 2. Import parakeet.js dynamically
      this._setProgress({ stage: 'import', progress: 15, message: 'Loading parakeet.js...' });
      
      // @ts-ignore - parakeet.js is a JS module
      const { ParakeetModel } = await import('parakeet.js');

      // 3. Load the model
      this._setProgress({ stage: 'download', progress: 20, message: 'Downloading model...' });
      
      this._model = await ParakeetModel.fromUrls({
        encoderUrl: modelConfig.encoderUrl,
        decoderUrl: modelConfig.decoderUrl,
        tokenizerUrl: modelConfig.tokenizerUrl,
        preprocessorUrl: modelConfig.preprocessorUrl,
        backend: this._backend === 'webgpu' ? 'webgpu-hybrid' : 'wasm',
        verbose: false,
      });

      this._setProgress({ stage: 'complete', progress: 100, message: 'Model ready' });
      this._setState('ready');
      
      // Check offline readiness (model is cached in browser)
      this._isOfflineReady = true;

    } catch (error) {
      console.error('Model loading failed:', error);
      this._setState('error');
      this._callbacks.onError?.(error as Error);
      throw error;
    }
  }

  /**
   * Detect WebGPU availability
   */
  private async _detectWebGPU(): Promise<boolean> {
    if (!navigator.gpu) {
      console.log('WebGPU not supported in this browser');
      return false;
    }

    try {
      const adapter = await navigator.gpu.requestAdapter();
      if (!adapter) {
        console.log('No WebGPU adapter found');
        return false;
      }
      
      const device = await adapter.requestDevice();
      device.destroy();
      
      console.log('WebGPU is available');
      return true;
    } catch (e) {
      console.log('WebGPU check failed:', e);
      return false;
    }
  }

  /**
   * Update state and notify callbacks
   */
  private _setState(state: ModelState): void {
    this._state = state;
    this._callbacks.onStateChange?.(state);
  }

  /**
   * Update progress and notify callbacks
   */
  private _setProgress(progress: ModelProgress): void {
    this._progress = progress.progress;
    this._callbacks.onProgress?.(progress);
  }

  /**
   * Dispose model and free resources
   */
  dispose(): void {
    this._model = null;
    this._state = 'unloaded';
    this._progress = 0;
  }
}
