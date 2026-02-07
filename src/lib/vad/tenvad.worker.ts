/**
 * TEN-VAD Worker
 *
 * Independent Web Worker that runs TEN-VAD WASM inference.
 * Receives Float32 PCM audio chunks, runs inference in hops of `hopSize`
 * samples (default 256 = 16ms at 16kHz), and posts back per-hop
 * probabilities and voice flags.
 *
 * The worker accumulates leftover samples between chunks so that
 * producers can send arbitrarily sized buffers (e.g., 1280 samples from
 * the AudioWorklet) and the worker handles the hop alignment internally.
 */

import type { TenVADRequest, TenVADResult } from '../buffer/types';

// ---- TEN-VAD Module Interface ----

interface TenVADModule {
    _ten_vad_create(handlePtr: number, hopSize: number, threshold: number): number;
    _ten_vad_process(
        handle: number,
        audioDataPtr: number,
        audioDataLength: number,
        outProbabilityPtr: number,
        outFlagPtr: number,
    ): number;
    _ten_vad_destroy(handlePtr: number): number;
    _ten_vad_get_version(): number;
    _malloc(size: number): number;
    _free(ptr: number): void;
    HEAP16: Int16Array;
    HEAPF32: Float32Array;
    HEAP32: Int32Array;
    HEAPU8: Uint8Array;
    UTF8ToString?(ptr: number): string;
}

// ---- Worker State ----

let module: TenVADModule | null = null;
let vadHandle: number = 0;
let hopSize: number = 256;
let threshold: number = 0.5;

// Pre-allocated WASM memory pointers
let audioPtr: number = 0;
let probPtr: number = 0;
let flagPtr: number = 0;
let handlePtr: number = 0;

// Accumulator for partial hops between chunks
let accumulator: Float32Array | null = null;
let accumulatorPos: number = 0;

// Global sample counter for tracking position
let globalSamplePosition: number = 0;

// ---- Message Handler ----

self.onmessage = async (e: MessageEvent<TenVADRequest>) => {
    const msg = e.data;

    try {
        switch (msg.type) {
            case 'INIT':
                await handleInit(msg.id, msg.payload);
                break;
            case 'PROCESS':
                handleProcess(msg.payload.samples, msg.payload.globalSampleOffset);
                break;
            case 'RESET':
                handleReset(msg.id);
                break;
            case 'DISPOSE':
                handleDispose(msg.id);
                break;
        }
    } catch (err) {
        respond({ type: 'ERROR', id: (msg as any).id ?? 0, payload: String(err) });
    }
};

// ---- Handlers ----

async function handleInit(id: number, cfg: { hopSize: number; threshold: number; wasmPath?: string }): Promise<void> {
    hopSize = cfg.hopSize || 256;
    threshold = cfg.threshold || 0.5;
    const wasmPath = cfg.wasmPath || '/wasm/';

    try {
        // Dynamic import of the WASM glue code from the public directory
        // The ten_vad.js file uses import.meta.url to locate ten_vad.wasm,
        // so we need to help it find the WASM file via locateFile.
        const wasmUrl = new URL(wasmPath + 'ten_vad.js', self.location.origin).href;

        // Fetch and eval the module factory (it's an ES6 module)
        const response = await fetch(wasmUrl);
        const jsText = await response.text();

        // The factory function is the default export. We need to evaluate it.
        // Since we're in a worker, we can use a Blob + dynamic import approach.
        const blobUrl = URL.createObjectURL(
            new Blob([jsText], { type: 'application/javascript' })
        );

        const { default: createVADModule } = await import(/* @vite-ignore */ blobUrl);
        URL.revokeObjectURL(blobUrl);

        // Initialize the WASM module with locateFile for the .wasm binary
        module = await createVADModule({
            locateFile: (file: string) => {
                if (file.endsWith('.wasm')) {
                    return new URL(wasmPath + file, self.location.origin).href;
                }
                return file;
            },
        }) as TenVADModule;

        // Allocate persistent memory
        handlePtr = module._malloc(4);  // int32 for the handle
        audioPtr = module._malloc(hopSize * 2);  // int16 per sample
        probPtr = module._malloc(4);  // float32
        flagPtr = module._malloc(4);  // int32

        // Create VAD instance
        const ret = module._ten_vad_create(handlePtr, hopSize, threshold);
        if (ret !== 0) {
            throw new Error(`ten_vad_create failed with code ${ret}`);
        }
        vadHandle = module.HEAP32[handlePtr >> 2];

        // Get version
        const versionPtr = module._ten_vad_get_version();
        const version = module.UTF8ToString
            ? module.UTF8ToString(versionPtr)
            : `ptr@${versionPtr}`;

        // Initialize accumulator
        accumulator = new Float32Array(hopSize);
        accumulatorPos = 0;
        globalSamplePosition = 0;

        console.log(`[TenVAD Worker] Initialized: hopSize=${hopSize}, threshold=${threshold}, version=${version}`);

        respond({ type: 'INIT', id, payload: { success: true, version } });
    } catch (err) {
        console.error('[TenVAD Worker] Init failed:', err);
        respond({ type: 'ERROR', id, payload: `TEN-VAD init failed: ${err}` });
    }
}

function handleProcess(samples: Float32Array, globalSampleOffset: number): void {
    if (!module || !vadHandle || !accumulator) return;

    const startTime = performance.now();

    // Track the global offset for this chunk's results
    // The first result corresponds to the hop that completes first
    let firstResultOffset = globalSampleOffset;
    let resultStartSet = false;

    const maxHops = Math.ceil((samples.length + accumulatorPos) / hopSize);
    const probabilities = new Float32Array(maxHops);
    const flags = new Uint8Array(maxHops);
    let hopCount = 0;

    let sampleIdx = 0;

    while (sampleIdx < samples.length) {
        // Fill accumulator
        while (accumulatorPos < hopSize && sampleIdx < samples.length) {
            accumulator[accumulatorPos++] = samples[sampleIdx++];
        }

        // If accumulator is full, run inference
        if (accumulatorPos >= hopSize) {
            if (!resultStartSet) {
                // The first complete hop started at:
                // globalSampleOffset + sampleIdx - hopSize
                firstResultOffset = globalSampleOffset + sampleIdx - hopSize;
                resultStartSet = true;
            }

            // Convert Float32 [-1, 1] to Int16 [-32768, 32767]
            for (let i = 0; i < hopSize; i++) {
                const val = Math.max(-1, Math.min(1, accumulator[i]));
                module!.HEAP16[(audioPtr >> 1) + i] = Math.round(val * 32767);
            }

            // Run inference
            const ret = module!._ten_vad_process(
                vadHandle, audioPtr, hopSize, probPtr, flagPtr
            );

            if (ret === 0) {
                probabilities[hopCount] = module!.HEAPF32[probPtr >> 2];
                flags[hopCount] = module!.HEAP32[flagPtr >> 2] as 0 | 1;
                hopCount++;
            }

            accumulatorPos = 0;
        }
    }

    globalSamplePosition = globalSampleOffset + samples.length;

    if (hopCount > 0) {
        // Trim to actual size and transfer
        const trimmedProbs = probabilities.slice(0, hopCount);
        const trimmedFlags = flags.slice(0, hopCount);

        const result: TenVADResult = {
            probabilities: trimmedProbs,
            flags: trimmedFlags,
            globalSampleOffset: firstResultOffset,
            hopCount,
            processingTimeMs: performance.now() - startTime,
        };

        (self as any).postMessage(
            { type: 'RESULT', payload: result },
            [trimmedProbs.buffer, trimmedFlags.buffer]
        );
    }
}

function handleReset(id: number): void {
    if (accumulator) {
        accumulator.fill(0);
        accumulatorPos = 0;
    }
    globalSamplePosition = 0;

    // Re-create the VAD instance to reset internal state
    if (module && vadHandle) {
        module._ten_vad_destroy(handlePtr);
        const ret = module._ten_vad_create(handlePtr, hopSize, threshold);
        if (ret === 0) {
            vadHandle = module.HEAP32[handlePtr >> 2];
        }
    }

    respond({ type: 'RESET', id, payload: { success: true } });
}

function handleDispose(id: number): void {
    if (module && vadHandle) {
        module._ten_vad_destroy(handlePtr);
        module._free(audioPtr);
        module._free(probPtr);
        module._free(flagPtr);
        module._free(handlePtr);
    }
    module = null;
    vadHandle = 0;
    accumulator = null;

    respond({ type: 'DISPOSE', id, payload: { success: true } });
}

function respond(msg: any, transfers?: Transferable[]): void {
    if (transfers) {
        (self as any).postMessage(msg, transfers);
    } else {
        (self as any).postMessage(msg);
    }
}
