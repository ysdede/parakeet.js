/**
 * Integration tests for mel.worker.ts
 * 
 * Tests that the mel worker:
 *   1. Loads successfully (catches import/syntax errors before runtime)
 *   2. Responds to INIT, PUSH_AUDIO, GET_FEATURES, GET_STATUS, RESET messages
 *   3. Computes mel features correctly for known inputs
 * 
 * Uses @vitest/web-worker to polyfill Web Workers in the test environment.
 * 
 * Run: npm test
 */

import '@vitest/web-worker';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MEL_CONSTANTS, sampleToFrame } from './mel-math';

/**
 * Helper: send a message to the worker and wait for a response.
 */
function sendWorkerMessage(
    worker: Worker,
    type: string,
    payload: any,
    id: number,
    transferable?: Transferable[],
): Promise<any> {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error(`Worker ${type} timed out`)), 5000);

        const handler = (e: MessageEvent) => {
            if (e.data.id === id) {
                clearTimeout(timeout);
                worker.removeEventListener('message', handler);
                if (e.data.type === 'ERROR') {
                    reject(new Error(e.data.payload));
                } else {
                    resolve(e.data);
                }
            }
        };
        worker.addEventListener('message', handler);
        if (transferable) {
            worker.postMessage({ type, payload, id }, transferable);
        } else {
            worker.postMessage({ type, payload, id });
        }
    });
}

describe('mel.worker', () => {
    let worker: Worker;
    let nextId: number;

    beforeEach(() => {
        worker = new Worker(new URL('./mel.worker.ts', import.meta.url), {
            type: 'module'
        });
        nextId = 1;
    });

    afterEach(() => {
        worker.terminate();
    });

    // ─── Loading ──────────────────────────────────────────────────────────

    it('should load without errors', async () => {
        // If the worker has syntax errors or broken imports, this will fail.
        const errorPromise = new Promise<ErrorEvent>((resolve) => {
            worker.onerror = (e) => resolve(e as ErrorEvent);
        });
        const initPromise = sendWorkerMessage(worker, 'INIT', {}, nextId++);

        // Race: either init succeeds or error fires
        const result = await Promise.race([
            initPromise.then(() => 'success'),
            errorPromise.then((e) => {
                throw new Error(`Worker failed to load: ${e.message || 'unknown error'}`);
            }),
        ]);
        expect(result).toBe('success');
    });

    // ─── INIT ─────────────────────────────────────────────────────────────

    it('should respond to INIT with INIT_DONE', async () => {
        const response = await sendWorkerMessage(worker, 'INIT', { nMels: 128 }, nextId++);
        expect(response.type).toBe('INIT_DONE');
    });

    it('should accept custom nMels', async () => {
        const response = await sendWorkerMessage(worker, 'INIT', { nMels: 64 }, nextId++);
        expect(response.type).toBe('INIT_DONE');

        // Verify through status
        const status = await sendWorkerMessage(worker, 'GET_STATUS', {}, nextId++);
        expect(status.payload.melBins).toBe(64);
    });

    // ─── PUSH_AUDIO ───────────────────────────────────────────────────────

    it('should accept audio chunks after init', async () => {
        await sendWorkerMessage(worker, 'INIT', { nMels: 128 }, nextId++);

        // PUSH_AUDIO is fire-and-forget (no response), so we verify via GET_STATUS
        const chunk = new Float32Array(1600); // 0.1s
        for (let i = 0; i < chunk.length; i++) {
            chunk[i] = Math.sin(2 * Math.PI * 440 * i / 16000);
        }
        const copy = new Float32Array(chunk);
        worker.postMessage({ type: 'PUSH_AUDIO', payload: copy }, [copy.buffer]);

        // Give worker time to process
        await new Promise(r => setTimeout(r, 100));

        const status = await sendWorkerMessage(worker, 'GET_STATUS', {}, nextId++);
        expect(status.payload.totalSamples).toBe(1600);
        expect(status.payload.computedFrames).toBe(sampleToFrame(1600));
    });

    // ─── GET_FEATURES ─────────────────────────────────────────────────────

    it('should return null for empty buffer', async () => {
        await sendWorkerMessage(worker, 'INIT', { nMels: 128 }, nextId++);

        const response = await sendWorkerMessage(
            worker,
            'GET_FEATURES',
            { startSample: 0, endSample: 16000 },
            nextId++,
        );
        expect(response.type).toBe('GET_FEATURES_DONE');
        expect(response.payload).toBeNull();
    });

    it('should return normalized features for pushed audio', async () => {
        const nMels = 128;
        await sendWorkerMessage(worker, 'INIT', { nMels }, nextId++);

        // Push 1 second of 440 Hz sine wave
        const audio = new Float32Array(16000);
        for (let i = 0; i < audio.length; i++) {
            audio[i] = Math.sin(2 * Math.PI * 440 * i / 16000) * 0.3;
        }
        const copy = new Float32Array(audio);
        worker.postMessage({ type: 'PUSH_AUDIO', payload: copy }, [copy.buffer]);

        // Wait for processing
        await new Promise(r => setTimeout(r, 200));

        // Request features for the full second
        const response = await sendWorkerMessage(
            worker,
            'GET_FEATURES',
            { startSample: 0, endSample: 16000 },
            nextId++,
        );

        expect(response.type).toBe('GET_FEATURES_DONE');
        expect(response.payload).not.toBeNull();

        const { features, T, melBins } = response.payload;
        expect(melBins).toBe(nMels);
        expect(T).toBe(sampleToFrame(16000)); // 100 frames
        expect(features).toBeInstanceOf(Float32Array);
        expect(features.length).toBe(nMels * T);

        // Features should be normalized (mean ~0)
        let sum = 0;
        for (let i = 0; i < features.length; i++) {
            sum += features[i];
            expect(isFinite(features[i])).toBe(true);
        }
        // Average across all values should be near 0
        const avgMean = sum / features.length;
        expect(Math.abs(avgMean)).toBeLessThan(0.5);
    });

    // ─── GET_STATUS ───────────────────────────────────────────────────────

    it('should return correct status after init', async () => {
        await sendWorkerMessage(worker, 'INIT', { nMels: 128 }, nextId++);

        const response = await sendWorkerMessage(worker, 'GET_STATUS', {}, nextId++);
        expect(response.type).toBe('GET_STATUS_DONE');
        expect(response.payload.totalSamples).toBe(0);
        expect(response.payload.computedFrames).toBe(0);
        expect(response.payload.melBins).toBe(128);
        expect(response.payload.bufferCapacityFrames).toBeGreaterThan(0);
    });

    // ─── RESET ────────────────────────────────────────────────────────────

    it('should clear state on RESET', async () => {
        await sendWorkerMessage(worker, 'INIT', { nMels: 128 }, nextId++);

        // Push some audio
        const chunk = new Float32Array(3200);
        for (let i = 0; i < chunk.length; i++) chunk[i] = Math.sin(i * 0.1);
        worker.postMessage({ type: 'PUSH_AUDIO', payload: new Float32Array(chunk) }, [new Float32Array(chunk).buffer]);
        await new Promise(r => setTimeout(r, 100));

        // Verify we have data
        let status = await sendWorkerMessage(worker, 'GET_STATUS', {}, nextId++);
        expect(status.payload.totalSamples).toBeGreaterThan(0);

        // Reset
        await sendWorkerMessage(worker, 'RESET', {}, nextId++);

        // Should be cleared
        status = await sendWorkerMessage(worker, 'GET_STATUS', {}, nextId++);
        expect(status.payload.totalSamples).toBe(0);
        expect(status.payload.computedFrames).toBe(0);
    });

    // ─── Incremental Processing ───────────────────────────────────────────

    it('should accumulate frames from multiple audio pushes', async () => {
        await sendWorkerMessage(worker, 'INIT', { nMels: 128 }, nextId++);

        // Push 5 chunks of 0.1 seconds each
        for (let chunk = 0; chunk < 5; chunk++) {
            const audio = new Float32Array(1600);
            for (let i = 0; i < 1600; i++) {
                audio[i] = Math.sin(2 * Math.PI * 440 * (chunk * 1600 + i) / 16000);
            }
            const copy = new Float32Array(audio);
            worker.postMessage({ type: 'PUSH_AUDIO', payload: copy }, [copy.buffer]);
        }

        await new Promise(r => setTimeout(r, 200));

        const status = await sendWorkerMessage(worker, 'GET_STATUS', {}, nextId++);
        expect(status.payload.totalSamples).toBe(8000); // 5 * 1600
        expect(status.payload.computedFrames).toBe(sampleToFrame(8000)); // 50 frames
    });
});
