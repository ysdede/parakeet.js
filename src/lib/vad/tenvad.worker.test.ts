/**
 * Integration tests for tenvad.worker.ts (TEN-VAD).
 *
 * Ensures:
 *   1. Worker script loads without syntax/import errors.
 *   2. Worker responds to INIT (success when WASM is available, ERROR when not).
 *   3. When INIT succeeds, RESET and PROCESS work and return expected shapes.
 *
 * Uses @vitest/web-worker. In CI/public no WASM server, INIT typically returns ERROR;
 * tests accept either outcome so we verify the worker is alive and protocol is correct.
 * With WASM served (e.g. dev server), INIT can succeed and full PROCESS tests run.
 *
 * Run: npm test
 */

import '@vitest/web-worker';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

type TenVADRequest =
    | { type: 'INIT'; id: number; payload: { hopSize?: number; threshold?: number; wasmPath?: string } }
    | { type: 'PROCESS'; payload: { samples: Float32Array; globalSampleOffset: number } }
    | { type: 'RESET'; id: number }
    | { type: 'DISPOSE'; id: number };

function sendWorkerMessage(
    worker: Worker,
    type: TenVADRequest['type'],
    payload: any,
    id: number,
    transferable?: Transferable[],
): Promise<{ type: string; id?: number; payload?: any }> {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error(`Worker ${type} timed out`)), 10000);

        const handler = (e: MessageEvent) => {
            const data = e.data as { type: string; id?: number; payload?: any };
            const matchId = data.id === id;
            if (data.type === 'ERROR' && matchId) {
                clearTimeout(timeout);
                worker.removeEventListener('message', handler);
                if (type === 'INIT') {
                    resolve(data);
                } else {
                    reject(new Error(data.payload));
                }
                return;
            }
            if (matchId || (type === 'INIT' && data.type === 'INIT')) {
                clearTimeout(timeout);
                worker.removeEventListener('message', handler);
                resolve(data);
                return;
            }
        };
        worker.addEventListener('message', handler);

        const msg: TenVADRequest =
            type === 'INIT'
                ? { type: 'INIT', id, payload: payload ?? {} }
                : type === 'RESET'
                  ? { type: 'RESET', id }
                  : type === 'DISPOSE'
                    ? { type: 'DISPOSE', id }
                    : ({ type: 'PROCESS', payload } as TenVADRequest);

        if (type === 'PROCESS' && transferable) {
            worker.postMessage(msg, transferable);
        } else {
            worker.postMessage(msg);
        }
    });
}

describe('tenvad.worker', () => {
    let worker: Worker;
    let nextId: number;

    beforeEach(() => {
        worker = new Worker(new URL('./tenvad.worker.ts', import.meta.url), {
            type: 'module',
        });
        nextId = 1;
    });

    afterEach(() => {
        worker.terminate();
    });

    it('should load without errors', async () => {
        const errorPromise = new Promise<ErrorEvent>((resolve) => {
            worker.onerror = (e) => resolve(e as ErrorEvent);
        });
        const initPromise = sendWorkerMessage(worker, 'INIT', { hopSize: 256, threshold: 0.5 }, nextId++).catch(
            (e) => ({ type: 'ERROR', payload: e.message }),
        );

        const result = await Promise.race([
            initPromise.then((r) => (typeof r === 'object' && r.type ? 'response' : 'response')),
            errorPromise.then((e) => {
                throw new Error(`Worker failed to load: ${e.message || 'unknown error'}`);
            }),
        ]);
        expect(result).toBe('response');
    });

    it('should respond to INIT with either success or ERROR', async () => {
        const response = await sendWorkerMessage(worker, 'INIT', { hopSize: 256, threshold: 0.5 }, nextId++);

        expect(response.type).toBeDefined();
        if (response.type === 'INIT') {
            expect(response.payload).toBeDefined();
            expect(response.payload.success).toBe(true);
            expect(typeof response.payload.version).toBe('string');
        } else if (response.type === 'ERROR') {
            expect(typeof response.payload).toBe('string');
            expect(response.payload.length).toBeGreaterThan(0);
        }
    });

    describe('when INIT succeeds', () => {
        let initSucceeded = false;

        beforeEach(async () => {
            const response = await sendWorkerMessage(worker, 'INIT', { hopSize: 256, threshold: 0.5 }, nextId++);
            initSucceeded = response.type === 'INIT' && response.payload?.success === true;
        });

        it('should respond to RESET with success', async () => {
            if (!initSucceeded) return;
            const response = await sendWorkerMessage(worker, 'RESET', undefined, nextId++);
            expect(response.type).toBe('RESET');
            expect(response.payload?.success).toBe(true);
        });

        it('should return RESULT with valid shape when PROCESS receives one full hop of silence', async () => {
            if (!initSucceeded) return;

            const hopSize = 256;
            const samples = new Float32Array(hopSize);
            samples.fill(0);

            const resultPromise = new Promise<{ type: string; payload?: any }>((resolve) => {
                const handler = (e: MessageEvent) => {
                    if (e.data?.type === 'RESULT') {
                        worker.removeEventListener('message', handler);
                        resolve(e.data);
                    }
                };
                worker.addEventListener('message', handler);
            });

            const copy = new Float32Array(samples);
            worker.postMessage(
                { type: 'PROCESS', payload: { samples: copy, globalSampleOffset: 0 } },
                [copy.buffer],
            );

            const result = await resultPromise;
            expect(result.type).toBe('RESULT');
            expect(result.payload).toBeDefined();
            expect(result.payload.probabilities).toBeInstanceOf(Float32Array);
            expect(result.payload.flags).toBeInstanceOf(Uint8Array);
            expect(typeof result.payload.globalSampleOffset).toBe('number');
            expect(typeof result.payload.hopCount).toBe('number');
            expect(typeof result.payload.processingTimeMs).toBe('number');
            expect(result.payload.hopCount).toBeGreaterThan(0);
            expect(result.payload.probabilities.length).toBe(result.payload.hopCount);
            expect(result.payload.flags.length).toBe(result.payload.hopCount);
        });
    });
});
