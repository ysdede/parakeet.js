/**
 * Integration tests for buffer.worker.ts (v4 centralized multi-layer data store).
 *
 * Ensures the BufferWorker:
 *   - Loads and responds to INIT with the v4 layer config
 *   - Accepts WRITE to VAD layers and responds to HAS_SPEECH / GET_SILENCE_TAIL
 *   - Resets state on RESET
 *
 * Run: npm test
 */

import '@vitest/web-worker';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { BufferWorkerConfig } from './types';

function defaultConfig(): BufferWorkerConfig {
    return {
        sampleRate: 16000,
        layers: {
            audio: { hopSamples: 1, entryDimension: 1, maxDurationSec: 30 },
            mel: { hopSamples: 160, entryDimension: 128, maxDurationSec: 30 },
            energyVad: { hopSamples: 1280, entryDimension: 1, maxDurationSec: 30 },
            inferenceVad: { hopSamples: 256, entryDimension: 1, maxDurationSec: 30 },
        },
    };
}

function sendRequest(
    worker: Worker,
    type: string,
    payload: any,
    id: number
): Promise<{ type: string; id?: number; payload?: any }> {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error(`Worker ${type} timed out`)), 5000);
        const handler = (e: MessageEvent) => {
            const data = e.data as { type: string; id?: number; payload?: any };
            if (data.type === 'ERROR' && data.id === id) {
                clearTimeout(timeout);
                worker.removeEventListener('message', handler);
                reject(new Error(data.payload));
                return;
            }
            if (data.id === id || (type === 'INIT' && data.type === 'INIT')) {
                clearTimeout(timeout);
                worker.removeEventListener('message', handler);
                resolve(data);
                return;
            }
        };
        worker.addEventListener('message', handler);
        worker.postMessage({ type, payload, id });
    });
}

describe('buffer.worker', () => {
    let worker: Worker;
    let nextId: number;

    beforeEach(() => {
        worker = new Worker(new URL('./buffer.worker.ts', import.meta.url), {
            type: 'module',
        });
        nextId = 1;
    });

    afterEach(() => {
        worker.terminate();
    });

    it('should load without errors', async () => {
        const errPromise = new Promise<ErrorEvent>((resolve) => {
            worker.onerror = (e) => resolve(e as ErrorEvent);
        });
        const initPromise = sendRequest(worker, 'INIT', defaultConfig(), nextId++);
        const result = await Promise.race([
            initPromise.then(() => 'ok'),
            errPromise.then((e) => {
                throw new Error(`Worker load failed: ${e.message}`);
            }),
        ]);
        expect(result).toBe('ok');
    });

    it('should respond to INIT with success', async () => {
        const response = await sendRequest(worker, 'INIT', defaultConfig(), nextId++);
        expect(response.type).toBe('INIT');
        expect(response.payload?.success).toBe(true);
    });

    it('should return no speech and zero silence tail before any write', async () => {
        await sendRequest(worker, 'INIT', defaultConfig(), nextId++);

        const hasSpeech = await sendRequest(
            worker,
            'HAS_SPEECH',
            { layer: 'energyVad', startSample: 0, endSample: 1280, threshold: 0.3 },
            nextId++
        );
        expect(hasSpeech.type).toBe('HAS_SPEECH');
        expect(hasSpeech.payload?.hasSpeech).toBe(false);

        const silence = await sendRequest(
            worker,
            'GET_SILENCE_TAIL',
            { layer: 'energyVad', threshold: 0.3 },
            nextId++
        );
        expect(silence.type).toBe('GET_SILENCE_TAIL');
        expect(silence.payload?.durationSec).toBe(0);
    });

    it('should report speech after writing above-threshold values to energyVad', async () => {
        await sendRequest(worker, 'INIT', defaultConfig(), nextId++);

        worker.postMessage({
            type: 'WRITE',
            payload: { layer: 'energyVad', data: [0.9] },
        });
        await new Promise((r) => setTimeout(r, 50));

        const hasSpeech = await sendRequest(
            worker,
            'HAS_SPEECH',
            { layer: 'energyVad', startSample: 0, endSample: 1280, threshold: 0.3 },
            nextId++
        );
        expect(hasSpeech.payload?.hasSpeech).toBe(true);
        expect(hasSpeech.payload?.maxProb).toBeGreaterThanOrEqual(0.3);
    });

    it('should return silence tail duration after writing silence', async () => {
        await sendRequest(worker, 'INIT', defaultConfig(), nextId++);

        worker.postMessage({ type: 'WRITE', payload: { layer: 'energyVad', data: [0.1] } });
        worker.postMessage({ type: 'WRITE', payload: { layer: 'energyVad', data: [0.1] } });
        await new Promise((r) => setTimeout(r, 50));

        const silence = await sendRequest(
            worker,
            'GET_SILENCE_TAIL',
            { layer: 'energyVad', threshold: 0.3 },
            nextId++
        );
        expect(silence.payload?.durationSec).toBeGreaterThan(0);
    });

    it('should respond to RESET with success', async () => {
        await sendRequest(worker, 'INIT', defaultConfig(), nextId++);
        const response = await sendRequest(worker, 'RESET', undefined, nextId++);
        expect(response.type).toBe('RESET');
        expect(response.payload?.success).toBe(true);
    });
});
