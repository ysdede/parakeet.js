import { ModelServiceConfig, ModelLoadingStatus, ModelProgressEvent, BackendType, TranscriptionResult } from './types';

// Use dynamic import for parakeet.js since it's an ESM module
let ParakeetModel: any = null;

/**
 * ModelService handles model loading, backend detection, and transcription.
 */
export class ModelService {
    private config: ModelServiceConfig;
    private model: any = null;
    private status: ModelLoadingStatus = 'idle';
    private backend: BackendType | null = null;

    constructor(config: ModelServiceConfig = {}) {
        this.config = config;
    }

    /**
     * Detect available backend (WebGPU preferred, WASM fallback)
     */
    async detectBackend(): Promise<BackendType> {
        if (this.config.preferredBackend) {
            return this.config.preferredBackend;
        }

        // Check for WebGPU support
        if (typeof navigator !== 'undefined' && 'gpu' in navigator) {
            try {
                const adapter = await (navigator as any).gpu.requestAdapter();
                if (adapter) {
                    return 'webgpu';
                }
            } catch {
                // WebGPU not available
            }
        }

        return 'wasm';
    }

    /**
     * Load the parakeet.js model
     */
    async loadModel(): Promise<void> {
        if (this.model) return;

        this.status = 'loading';
        this.notifyProgress({ status: 'loading', progress: 0, message: 'Detecting backend...' });

        try {
            // Detect backend
            this.backend = await this.detectBackend();
            this.notifyProgress({ status: 'loading', progress: 10, message: `Using ${this.backend.toUpperCase()} backend` });

            // Dynamic import of parakeet.js
            const parakeetModule = await import('parakeet.js');
            ParakeetModel = parakeetModule.ParakeetModel;

            this.notifyProgress({ status: 'downloading', progress: 20, message: 'Downloading model...' });

            // Create model instance with progress callback
            this.model = await ParakeetModel.fromPretrained(
                this.config.modelId || 'nvidia/parakeet-tdt-0.6b-v2',
                {
                    device: this.backend,
                    progress_callback: (info: any) => {
                        if (info.status === 'progress') {
                            const progress = 20 + (info.progress || 0) * 0.7; // 20-90%
                            this.notifyProgress({
                                status: 'downloading',
                                progress,
                                bytesLoaded: info.loaded,
                                bytesTotal: info.total,
                                message: `Downloading: ${Math.round(progress)}%`,
                            });
                        }
                    },
                }
            );

            this.status = 'ready';
            this.notifyProgress({ status: 'ready', progress: 100, message: 'Model ready' });
        } catch (error) {
            this.status = 'error';
            this.notifyProgress({
                status: 'error',
                progress: 0,
                message: error instanceof Error ? error.message : 'Failed to load model',
            });
            throw error;
        }
    }

    /**
     * Transcribe audio
     */
    async transcribe(audio: Float32Array, sampleRate: number = 16000): Promise<TranscriptionResult> {
        if (!this.model) {
            throw new Error('Model not loaded. Call loadModel() first.');
        }

        const result = await this.model.transcribe(audio, sampleRate, {
            returnTimestamps: true,
            returnConfidences: true,
        });

        return {
            text: result.utterance_text || result.text || '',
            words: result.words,
        };
    }

    /**
     * Get current status
     */
    getStatus(): ModelLoadingStatus {
        return this.status;
    }

    /**
     * Get detected backend
     */
    getBackend(): BackendType | null {
        return this.backend;
    }

    /**
     * Check if model is ready
     */
    isReady(): boolean {
        return this.status === 'ready' && this.model !== null;
    }

    /**
     * Get raw model reference for advanced usage
     */
    getModel(): any {
        return this.model;
    }

    private notifyProgress(event: ModelProgressEvent): void {
        if (this.config.onProgress) {
            this.config.onProgress(event);
        }
    }
}
