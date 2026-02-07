/**
 * BufferWorkerClient
 *
 * Main-thread API for the centralized BufferWorker.
 * Provides promise-based reads and fire-and-forget writes.
 */

import type {
    LayerId,
    BufferWorkerConfig,
    BufferWorkerResponse,
    HasSpeechResult,
    RangeResult,
    BufferState,
} from './types';

export class BufferWorkerClient {
    private worker: Worker;
    private messageId = 0;
    private pendingPromises = new Map<number, { resolve: (v: any) => void; reject: (e: any) => void }>();
    private ready = false;

    constructor() {
        this.worker = new Worker(new URL('./buffer.worker.ts', import.meta.url), {
            type: 'module',
        });
        this.worker.onmessage = (e: MessageEvent<BufferWorkerResponse>) => {
            this.handleMessage(e.data);
        };
        this.worker.onerror = (e: Event) => {
            const err = e as ErrorEvent;
            console.error('[BufferWorkerClient] Worker error:', err.message);
            for (const [, p] of this.pendingPromises) {
                p.reject(new Error(err.message || 'BufferWorker error'));
            }
            this.pendingPromises.clear();
        };
    }

    // ---- Lifecycle ----

    async init(config: BufferWorkerConfig): Promise<void> {
        await this.sendRequest('INIT', config);
        this.ready = true;
    }

    async reset(): Promise<void> {
        await this.sendRequest('RESET', undefined);
    }

    dispose(): void {
        this.worker.terminate();
        for (const [, p] of this.pendingPromises) {
            p.reject(new Error('BufferWorkerClient disposed'));
        }
        this.pendingPromises.clear();
        this.ready = false;
    }

    // ---- Producers (fire-and-forget for low latency) ----

    /**
     * Write a single scalar value to a VAD layer (energyVad or inferenceVad).
     * Fire-and-forget for minimal latency.
     */
    writeScalar(layer: LayerId, value: number): void {
        if (!this.ready) return;
        this.worker.postMessage({
            type: 'WRITE',
            payload: { layer, data: [value] },
        });
    }

    /**
     * Write a multi-dimensional entry (e.g., mel spectrogram frame).
     * Transfers the buffer for zero-copy.
     */
    writeEntry(layer: LayerId, data: Float32Array): void {
        if (!this.ready) return;
        const copy = new Float32Array(data);
        this.worker.postMessage(
            { type: 'WRITE', payload: { layer, data: copy } },
            [copy.buffer]
        );
    }

    /**
     * Write a batch of entries to a layer. Transfers the buffer.
     */
    writeBatch(layer: LayerId, data: Float32Array, globalSampleOffset?: number): void {
        if (!this.ready) return;
        const copy = new Float32Array(data);
        this.worker.postMessage(
            { type: 'WRITE_BATCH', payload: { layer, data: copy, globalSampleOffset } },
            [copy.buffer]
        );
    }

    /**
     * Write raw audio samples. Fire-and-forget with buffer transfer.
     */
    writeAudio(samples: Float32Array): void {
        if (!this.ready) return;
        const copy = new Float32Array(samples);
        this.worker.postMessage(
            { type: 'WRITE_BATCH', payload: { layer: 'audio' as LayerId, data: copy } },
            [copy.buffer]
        );
    }

    // ---- Consumers (async queries) ----

    /**
     * Check if any VAD entry exceeds a threshold in a sample range.
     * Used by v4Tick to decide whether to trigger transcription.
     */
    async hasSpeech(
        layer: 'energyVad' | 'inferenceVad',
        startSample: number,
        endSample: number,
        threshold: number,
    ): Promise<HasSpeechResult> {
        return this.sendRequest('HAS_SPEECH', { layer, startSample, endSample, threshold });
    }

    /**
     * Get the duration of trailing silence from the write head.
     * Scans backward in the specified VAD layer until a probability >= threshold is found.
     */
    async getSilenceTailDuration(
        layer: 'energyVad' | 'inferenceVad',
        threshold: number,
    ): Promise<number> {
        const result = await this.sendRequest('GET_SILENCE_TAIL', { layer, threshold });
        return result.durationSec;
    }

    /**
     * Query data for an arbitrary sample range across multiple layers.
     * Returns correlated slices from each requested layer.
     */
    async queryRange(
        startSample: number,
        endSample: number,
        layerIds: LayerId[],
    ): Promise<RangeResult> {
        return this.sendRequest('QUERY_RANGE', { startSample, endSample, layers: layerIds });
    }

    /**
     * Get a snapshot of the buffer state for debugging / UI.
     */
    async getState(): Promise<BufferState> {
        return this.sendRequest('GET_STATE', undefined);
    }

    // ---- Internal ----

    private handleMessage(msg: BufferWorkerResponse): void {
        if (msg.type === 'ERROR') {
            const p = this.pendingPromises.get(msg.id);
            if (p) {
                this.pendingPromises.delete(msg.id);
                p.reject(new Error(msg.payload));
            }
            return;
        }

        if (msg.id !== undefined) {
            const p = this.pendingPromises.get(msg.id);
            if (p) {
                this.pendingPromises.delete(msg.id);
                p.resolve(msg.payload);
            }
        }
    }

    private sendRequest(type: string, payload: any): Promise<any> {
        return new Promise((resolve, reject) => {
            const id = ++this.messageId;
            this.pendingPromises.set(id, { resolve, reject });
            this.worker.postMessage({ type, payload, id });
        });
    }
}
