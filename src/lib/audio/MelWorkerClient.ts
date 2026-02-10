/**
 * BoncukJS - Mel Worker Client
 * 
 * Manages the mel producer Web Worker lifecycle and provides a promise-based API.
 * 
 * Usage:
 *   const melClient = new MelWorkerClient();
 *   await melClient.init({ nMels: 128 });
 *   
 *   // Continuously push audio chunks (fire-and-forget)
 *   melClient.pushAudio(chunk);
 *   
 *   // When inference needs features:
 *   const features = await melClient.getFeatures(startSample, endSample);
 *   // features = { features: Float32Array, T: number, melBins: number }
 */

export interface MelFeatures {
    features: Float32Array;
    T: number;
    melBins: number;
}

export class MelWorkerClient {
    private worker: Worker;
    private messageId = 0;
    private pendingPromises = new Map<number, { resolve: (v: any) => void; reject: (e: any) => void }>();
    private initFailed = false;

    constructor() {
        // Create worker eagerly in constructor (matching TranscriptionWorkerClient pattern).
        // Vite's worker detection reliably picks up new Worker(new URL(...)) in constructors.
        this.worker = new Worker(new URL('./mel.worker.ts', import.meta.url), {
            type: 'module'
        });

        this.worker.onmessage = (e: MessageEvent) => {
            this.handleMessage(e);
        };

        this.worker.onerror = (e: Event) => {
            // Worker load errors fire as plain Event, not ErrorEvent
            const errEvent = e as ErrorEvent;
            const msg = errEvent.message || 'Worker failed to load';
            const loc = errEvent.filename ? ` at ${errEvent.filename}:${errEvent.lineno}:${errEvent.colno}` : '';
            console.error(`[MelWorkerClient] Worker error: ${msg}${loc}`, e);
            this.initFailed = true;
            // Reject all pending promises so callers don't hang
            for (const [, promise] of this.pendingPromises) {
                promise.reject(new Error(`[MelWorkerClient] ${msg}${loc}`));
            }
            this.pendingPromises.clear();
        };
    }

    /**
     * Initialize the mel worker with configuration.
     */
    async init(config: { nMels?: number } = {}): Promise<void> {
        if (this.initFailed) {
            throw new Error('[MelWorkerClient] Worker failed to load');
        }
        await this.sendRequest('INIT', config);
    }

    /**
     * Push a resampled audio chunk to the mel worker (fire-and-forget).
     * Call this for every audio chunk from AudioEngine.
     */
    pushAudio(chunk: Float32Array): void {
        if (this.initFailed) return;
        // Transfer the buffer for zero-copy (caller must not reuse the chunk)
        // If caller needs to keep it, they should slice() first
        this.worker.postMessage(
            { type: 'PUSH_AUDIO', payload: chunk },
            [chunk.buffer]
        );
    }

    /**
     * Push audio without transferring ownership (caller keeps the buffer).
     * Slightly less efficient but safe when caller needs the data.
     */
    pushAudioCopy(chunk: Float32Array): void {
        if (this.initFailed) return;
        const copy = new Float32Array(chunk);
        this.worker.postMessage(
            { type: 'PUSH_AUDIO', payload: copy },
            [copy.buffer]
        );
    }

    /**
     * Request mel features for a sample range.
     * Returns null if no frames are available in the range.
     * 
     * @param startSample - Start sample index
     * @param endSample - End sample index
     * @param normalize - If true (default), return normalized features for ASR.
     *   If false, return raw log-mel values for visualization with fixed dB scaling.
     *   See mel.worker.ts for performance notes when using normalize=false.
     */
    async getFeatures(startSample: number, endSample: number, normalize: boolean = true): Promise<MelFeatures | null> {
        return this.sendRequest('GET_FEATURES', { startSample, endSample, normalize });
    }

    /**
     * Get worker status (total samples, computed frames, etc.)
     */
    async getStatus(): Promise<{
        totalSamples: number;
        computedFrames: number;
        bufferCapacityFrames: number;
        melBins: number;
    }> {
        return this.sendRequest('GET_STATUS', {});
    }

    /**
     * Reset the mel worker (clear all buffers).
     */
    async reset(): Promise<void> {
        return this.sendRequest('RESET', {});
    }

    /**
     * Dispose the worker.
     */
    dispose(): void {
        this.worker.terminate();
        // Reject all pending promises
        for (const [, promise] of this.pendingPromises) {
            promise.reject(new Error('MelWorkerClient disposed'));
        }
        this.pendingPromises.clear();
    }

    // ─── Internal ────────────────────────────────────────────────────────

    private handleMessage(e: MessageEvent): void {
        const { type, payload, id } = e.data;

        if (type === 'ERROR') {
            const pending = this.pendingPromises.get(id);
            if (pending) {
                this.pendingPromises.delete(id);
                pending.reject(new Error(payload));
            }
            return;
        }

        // Match response to request by id
        if (id !== undefined) {
            const pending = this.pendingPromises.get(id);
            if (pending) {
                this.pendingPromises.delete(id);
                pending.resolve(payload);
            }
        }
    }

    private sendRequest(type: string, payload: any): Promise<any> {
        return new Promise((resolve, reject) => {
            if (this.initFailed) {
                reject(new Error('MelWorkerClient: worker failed to load'));
                return;
            }
            const id = ++this.messageId;
            this.pendingPromises.set(id, { resolve, reject });
            this.worker.postMessage({ type, payload, id });
        });
    }
}
