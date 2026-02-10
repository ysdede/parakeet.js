/**
 * TenVADWorkerClient
 *
 * Main-thread client for the TEN-VAD Web Worker.
 * Provides init/dispose lifecycle and fire-and-forget audio processing.
 * Results are delivered via a callback rather than promises, since
 * processing is streaming (one result per audio chunk, not request/response).
 */

import type { TenVADConfig, TenVADResponse, TenVADResult } from '../buffer/types';

export type TenVADResultCallback = (result: TenVADResult) => void;

export class TenVADWorkerClient {
    private worker: Worker;
    private messageId = 0;
    private pendingPromises = new Map<number, { resolve: (v: any) => void; reject: (e: any) => void }>();
    private resultCallback: TenVADResultCallback | null = null;
    private ready = false;

    constructor() {
        this.worker = new Worker(new URL('./tenvad.worker.ts', import.meta.url), {
            type: 'module',
        });
        this.worker.onmessage = (e: MessageEvent<TenVADResponse>) => {
            this.handleMessage(e.data);
        };
        this.worker.onerror = (e: Event) => {
            const err = e as ErrorEvent;
            console.error('[TenVADWorkerClient] Worker error:', err.message);
            for (const [, p] of this.pendingPromises) {
                p.reject(new Error(err.message || 'TenVAD worker error'));
            }
            this.pendingPromises.clear();
        };
    }

    /**
     * Initialize the TEN-VAD WASM module.
     * @param config - hop size, threshold, WASM path
     */
    async init(config: Partial<TenVADConfig> = {}): Promise<{ version?: string }> {
        const cfg: TenVADConfig = {
            hopSize: config.hopSize ?? 256,
            threshold: config.threshold ?? 0.5,
            wasmPath: config.wasmPath ?? '/wasm/',
        };
        const result = await this.sendRequest('INIT', cfg);
        this.ready = true;
        return result;
    }

    /**
     * Register a callback for streaming VAD results.
     * Called once per audio chunk processed.
     */
    onResult(callback: TenVADResultCallback): void {
        this.resultCallback = callback;
    }

    /**
     * Send an audio chunk for processing (fire-and-forget).
     * Results are delivered via the onResult callback.
     *
     * @param samples - Float32 PCM audio at 16kHz
     * @param globalSampleOffset - Global sample index of the chunk start
     */
    process(samples: Float32Array, globalSampleOffset: number): void {
        if (!this.ready) return;
        const copy = new Float32Array(samples);
        this.worker.postMessage(
            { type: 'PROCESS', payload: { samples: copy, globalSampleOffset } },
            [copy.buffer]
        );
    }

    /**
     * Send an audio chunk by transferring ownership of the buffer.
     * The caller must not reuse `samples` after calling this.
     */
    processTransfer(samples: Float32Array, globalSampleOffset: number): void {
        if (!this.ready) return;
        this.worker.postMessage(
            { type: 'PROCESS', payload: { samples, globalSampleOffset } },
            [samples.buffer]
        );
    }

    /**
     * Reset internal state (accumulator, VAD model state).
     */
    async reset(): Promise<void> {
        await this.sendRequest('RESET', undefined);
    }

    /**
     * Dispose the worker and free WASM memory.
     */
    dispose(): void {
        this.worker.terminate();
        for (const [, p] of this.pendingPromises) {
            p.reject(new Error('TenVADWorkerClient disposed'));
        }
        this.pendingPromises.clear();
        this.ready = false;
        this.resultCallback = null;
    }

    isReady(): boolean {
        return this.ready;
    }

    // ---- Internal ----

    private handleMessage(msg: TenVADResponse): void {
        // Streaming results don't have an id
        if (msg.type === 'RESULT') {
            this.resultCallback?.(msg.payload);
            return;
        }

        if (msg.type === 'ERROR') {
            const p = this.pendingPromises.get(msg.id);
            if (p) {
                this.pendingPromises.delete(msg.id);
                p.reject(new Error(msg.payload));
            } else {
                console.error('[TenVADWorkerClient] Unhandled error:', msg.payload);
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
