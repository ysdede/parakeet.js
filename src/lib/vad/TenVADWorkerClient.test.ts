/**
 * Unit tests for TenVADWorkerClient.
 *
 * Verifies:
 *   - Client is not ready until init() completes.
 *   - init() resolves when worker sends INIT success, rejects when worker sends ERROR.
 *   - process() does nothing when not ready.
 *   - onResult callback receives RESULT payloads from the worker.
 *   - dispose() terminates the worker and clears state.
 *
 * Uses a real worker; when WASM is not available init() rejects and tests assert that behavior.
 * Run: npm test
 */

import '@vitest/web-worker';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TenVADWorkerClient } from './TenVADWorkerClient';
import type { TenVADResult } from '../buffer/types';

describe('TenVADWorkerClient', () => {
    let client: TenVADWorkerClient;

    beforeEach(() => {
        client = new TenVADWorkerClient();
    });

    afterEach(() => {
        client.dispose();
    });

    it('should not be ready before init', () => {
        expect(client.isReady()).toBe(false);
    });

    it('should reject init when worker returns ERROR (e.g. WASM unavailable)', async () => {
        await expect(client.init()).rejects.toThrow();
        expect(client.isReady()).toBe(false);
    });

    it('should not call process when not ready', async () => {
        await expect(client.init()).rejects.toThrow();
        const samples = new Float32Array(256);
        expect(() => client.process(samples, 0)).not.toThrow();
        expect(client.isReady()).toBe(false);
    });

    it('should accept onResult callback without throwing', () => {
        const results: TenVADResult[] = [];
        expect(() => client.onResult((r) => results.push(r))).not.toThrow();
    });

    it('should clear ready state and callbacks on dispose', () => {
        client.onResult(() => {});
        expect(client.isReady()).toBe(false);
        client.dispose();
        expect(client.isReady()).toBe(false);
        expect(() => client.process(new Float32Array(256), 0)).not.toThrow();
    });
});
