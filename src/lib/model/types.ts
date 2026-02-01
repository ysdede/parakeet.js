/**
 * Model loading status
 */
export type ModelLoadingStatus =
    | 'idle'
    | 'downloading'
    | 'loading'
    | 'ready'
    | 'error';

/**
 * Backend type
 */
export type BackendType = 'webgpu' | 'wasm';

/**
 * Progress event for model download/loading
 */
export interface ModelProgressEvent {
    status: ModelLoadingStatus;
    progress: number; // 0-100
    bytesLoaded?: number;
    bytesTotal?: number;
    message?: string;
}

/**
 * Configuration for the ModelService
 */
export interface ModelServiceConfig {
    /** Preferred backend (auto-detection if not specified) */
    preferredBackend?: BackendType;
    /** Model ID or path */
    modelId?: string;
    /** Progress callback */
    onProgress?: (event: ModelProgressEvent) => void;
}

/**
 * Result from transcription
 */
export interface TranscriptionResult {
    text: string;
    words?: {
        text: string;
        start_time: number;
        end_time: number;
        confidence?: number;
    }[];
}
