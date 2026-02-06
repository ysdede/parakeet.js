/**
 * BoncukJS v3.0 - Transcription Worker Client
 * 
 * Main thread bridge to the Transcription Web Worker.
 * Offloads heavy AI transcription to a background thread to prevent UI stutters.
 */

import { ModelState, ModelProgress, TranscriptionResult } from './types';
import { TokenStreamResult, TokenStreamConfig } from './TokenStreamTranscriber';

export class TranscriptionWorkerClient {
    private worker: Worker;
    private messageId = 0;
    private pendingPromises: Map<number, { resolve: Function; reject: Function }> = new Map();

    // Callbacks for reactive updates
    public onModelProgress?: (p: ModelProgress) => void;
    public onModelStateChange?: (s: ModelState) => void;
    public onV3Confirmed?: (text: string, words: any[]) => void;
    public onV3Pending?: (text: string, words: any[]) => void;
    public onError?: (msg: string) => void;

    constructor() {
        // Create the worker
        this.worker = new Worker(new URL('./transcription.worker.ts', import.meta.url), {
            type: 'module'
        });

        this.worker.onmessage = (e) => this.handleMessage(e.data);
        this.worker.onerror = (e) => {
            console.error('[TranscriptionWorkerClient] Fatal Worker Error:', e);
            this.onError?.('Fatal background worker error');
        };
    }

    private handleMessage(data: any) {
        const { type, payload, id } = data;

        // Handle promise resolutions
        if (id !== undefined && this.pendingPromises.has(id)) {
            const { resolve, reject } = this.pendingPromises.get(id)!;
            this.pendingPromises.delete(id);

            if (type === 'ERROR') {
                reject(new Error(payload));
            } else {
                resolve(payload);
            }
            return;
        }

        // Handle reactive notifications
        switch (type) {
            case 'MODEL_PROGRESS':
                this.onModelProgress?.(payload);
                break;
            case 'MODEL_STATE':
                this.onModelStateChange?.(payload);
                break;
            case 'V3_CONFIRMED':
                this.onV3Confirmed?.(payload.text, payload.words);
                break;
            case 'V3_PENDING':
                this.onV3Pending?.(payload.text, payload.words);
                break;
            case 'ERROR':
                this.onError?.(payload);
                break;
        }
    }

    private sendRequest(type: string, payload?: any): Promise<any> {
        const id = this.messageId++;
        return new Promise((resolve, reject) => {
            this.pendingPromises.set(id, { resolve, reject });
            this.worker.postMessage({ type, payload, id });
        });
    }

    // API Methods
    async initModel(modelId?: string): Promise<void> {
        return this.sendRequest('INIT_MODEL', { modelId });
    }

    async initLocalModel(files: FileList | File[]): Promise<void> {
        return this.sendRequest('LOAD_LOCAL_MODEL', Array.from(files));
    }

    async initService(config: any): Promise<void> {
        return this.sendRequest('INIT_SERVICE', { config });
    }

    async initV3Service(config: TokenStreamConfig): Promise<void> {
        return this.sendRequest('INIT_V3_SERVICE', { config });
    }

    async processChunk(audio: Float32Array): Promise<TranscriptionResult> {
        return this.sendRequest('PROCESS_CHUNK', audio);
    }

    async processV3Chunk(audio: Float32Array, startTime?: number): Promise<TokenStreamResult> {
        return this.sendRequest('PROCESS_V3_CHUNK', { audio, startTime });
    }

    /**
     * Process a chunk using pre-computed mel features (from mel worker).
     * Bypasses the preprocessor in the inference worker entirely.
     */
    async processV3ChunkWithFeatures(
        features: Float32Array,
        T: number,
        melBins: number,
        startTime?: number,
        overlapSeconds?: number,
    ): Promise<TokenStreamResult> {
        return this.sendRequest('PROCESS_V3_CHUNK_WITH_FEATURES', {
            features, T, melBins, startTime, overlapSeconds,
        });
    }

    async transcribeSegment(audio: Float32Array): Promise<TranscriptionResult> {
        return this.sendRequest('TRANSCRIBE_SEGMENT', audio);
    }

    async reset(): Promise<void> {
        return this.sendRequest('RESET');
    }

    async finalize(): Promise<TranscriptionResult | TokenStreamResult> {
        return this.sendRequest('FINALIZE');
    }

    dispose() {
        this.worker.terminate();
        this.pendingPromises.clear();
    }
}
