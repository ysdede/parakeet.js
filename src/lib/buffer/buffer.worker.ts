/**
 * BufferWorker - Centralized Multi-Layer Data Store
 *
 * Manages four time-aligned circular buffers:
 *   1. Raw Audio (PCM Float32)
 *   2. Mel Spectrogram (Float32, multi-dimensional)
 *   3. Energy VAD (Float32 probabilities)
 *   4. Inference VAD (Float32 probabilities from TEN-VAD / Silero)
 *
 * All layers share a common timeline based on global sample offsets at a
 * fixed sample rate. Consumers can query arbitrary sample ranges and
 * receive correlated data across all requested layers.
 *
 * Frame Alignment:
 *   Each layer has its own hop size (samples per entry). The worker
 *   resolves sample-accurate queries by computing which entries overlap
 *   the requested range, regardless of the layer's native hop size.
 */

import type {
    LayerId,
    LayerConfig,
    BufferWorkerConfig,
    BufferWorkerRequest,
    WritePayload,
    WriteBatchPayload,
    HasSpeechQuery,
    SilenceTailQuery,
    RangeQuery,
    HasSpeechResult,
    RangeResult,
    LayerSlice,
    BufferState,
} from './types';

// ---- Per-Layer Circular Buffer ----

class CircularLayer {
    readonly hopSamples: number;
    readonly entryDimension: number;
    readonly maxEntries: number;

    /** Flat buffer: maxEntries * entryDimension */
    private buffer: Float32Array;
    /** Next global entry index to write (monotonic) */
    private globalWriteIndex: number = 0;

    constructor(config: LayerConfig, sampleRate: number) {
        this.hopSamples = config.hopSamples;
        this.entryDimension = config.entryDimension;
        this.maxEntries = Math.ceil(
            (sampleRate * config.maxDurationSec) / config.hopSamples
        );
        this.buffer = new Float32Array(this.maxEntries * this.entryDimension);
    }

    // ---- Write ----

    /** Write a single entry (dimension values). */
    write(data: Float32Array | number[]): void {
        const writePos = (this.globalWriteIndex % this.maxEntries) * this.entryDimension;
        for (let i = 0; i < this.entryDimension; i++) {
            this.buffer[writePos + i] = (data as any)[i] ?? 0;
        }
        this.globalWriteIndex++;
    }

    /** Write N entries from a flat array. */
    writeBatch(data: Float32Array, count?: number): void {
        const n = count ?? Math.floor(data.length / this.entryDimension);
        for (let e = 0; e < n; e++) {
            const writePos = (this.globalWriteIndex % this.maxEntries) * this.entryDimension;
            const srcOffset = e * this.entryDimension;
            for (let d = 0; d < this.entryDimension; d++) {
                this.buffer[writePos + d] = data[srcOffset + d] ?? 0;
            }
            this.globalWriteIndex++;
        }
    }

    /** Set the global write index (for explicit offset writes). */
    setGlobalWriteIndex(index: number): void {
        this.globalWriteIndex = index;
    }

    // ---- Read ----

    /**
     * Convert a global sample offset to the entry index that contains it.
     * Entry i covers samples [i * hopSamples, (i + 1) * hopSamples).
     */
    sampleToEntry(sample: number): number {
        return Math.floor(sample / this.hopSamples);
    }

    /** Convert an entry index to the global sample offset of its start. */
    entryToSample(entry: number): number {
        return entry * this.hopSamples;
    }

    /** Oldest entry still in the circular buffer. */
    getBaseEntry(): number {
        return Math.max(0, this.globalWriteIndex - this.maxEntries);
    }

    /** Current global sample corresponding to the write head. */
    getCurrentSample(): number {
        return this.globalWriteIndex * this.hopSamples;
    }

    /** Oldest global sample still available. */
    getOldestSample(): number {
        return this.getBaseEntry() * this.hopSamples;
    }

    /** Read entries covering [startSample, endSample). */
    readRange(startSample: number, endSample: number): LayerSlice | null {
        if (endSample <= startSample) return null;

        const startEntry = this.sampleToEntry(startSample);
        const endEntry = Math.ceil(endSample / this.hopSamples);

        const base = this.getBaseEntry();
        const clampStart = Math.max(startEntry, base);
        const clampEnd = Math.min(endEntry, this.globalWriteIndex);

        if (clampEnd <= clampStart) return null;

        const count = clampEnd - clampStart;
        const result = new Float32Array(count * this.entryDimension);

        for (let i = 0; i < count; i++) {
            const readPos = ((clampStart + i) % this.maxEntries) * this.entryDimension;
            const dstPos = i * this.entryDimension;
            for (let d = 0; d < this.entryDimension; d++) {
                result[dstPos + d] = this.buffer[readPos + d];
            }
        }

        return {
            data: result,
            entryCount: count,
            entryDimension: this.entryDimension,
            firstEntrySample: clampStart * this.hopSamples,
            hopSamples: this.hopSamples,
        };
    }

    /** Check if any scalar entry in [startSample, endSample) exceeds threshold. */
    hasSpeechInRange(startSample: number, endSample: number, threshold: number): HasSpeechResult {
        if (this.entryDimension !== 1) {
            return { hasSpeech: false, maxProb: 0, entriesChecked: 0 };
        }

        const startEntry = this.sampleToEntry(startSample);
        const endEntry = Math.ceil(endSample / this.hopSamples);

        const base = this.getBaseEntry();
        const clampStart = Math.max(startEntry, base);
        const clampEnd = Math.min(endEntry, this.globalWriteIndex);

        if (clampEnd <= clampStart) {
            return { hasSpeech: false, maxProb: 0, entriesChecked: 0 };
        }

        let maxProb = 0;
        const count = clampEnd - clampStart;

        for (let i = 0; i < count; i++) {
            const readPos = (clampStart + i) % this.maxEntries;
            const prob = this.buffer[readPos];
            if (prob > maxProb) maxProb = prob;
            if (prob >= threshold) {
                return { hasSpeech: true, maxProb: prob, entriesChecked: i + 1 };
            }
        }

        return { hasSpeech: false, maxProb, entriesChecked: count };
    }

    /** Scan backward from the write head to find how long silence has lasted. */
    getSilenceTailDuration(threshold: number, sampleRate: number): number {
        if (this.entryDimension !== 1 || this.globalWriteIndex === 0) return 0;

        const base = this.getBaseEntry();
        let silentEntries = 0;

        for (let i = this.globalWriteIndex - 1; i >= base; i--) {
            const readPos = i % this.maxEntries;
            if (this.buffer[readPos] >= threshold) break;
            silentEntries++;
        }

        return (silentEntries * this.hopSamples) / sampleRate;
    }

    // ---- State ----

    getState() {
        return {
            globalWriteIndex: this.globalWriteIndex,
            currentSample: this.getCurrentSample(),
            oldestSample: this.getOldestSample(),
            fillCount: Math.min(this.globalWriteIndex, this.maxEntries),
            maxEntries: this.maxEntries,
            hopSamples: this.hopSamples,
            entryDimension: this.entryDimension,
        };
    }

    reset(): void {
        this.globalWriteIndex = 0;
        this.buffer.fill(0);
    }
}

// ---- Worker State ----

let config: BufferWorkerConfig | null = null;
let layers: Record<LayerId, CircularLayer> | null = null;

// ---- Message Handler ----

self.onmessage = (e: MessageEvent<BufferWorkerRequest>) => {
    const msg = e.data;

    try {
        switch (msg.type) {
            case 'INIT':
                handleInit(msg.id, msg.payload);
                break;
            case 'WRITE':
                handleWrite(msg.payload);
                break;
            case 'WRITE_BATCH':
                handleWriteBatch(msg.payload);
                break;
            case 'HAS_SPEECH':
                handleHasSpeech(msg.id, msg.payload);
                break;
            case 'GET_SILENCE_TAIL':
                handleGetSilenceTail(msg.id, msg.payload);
                break;
            case 'QUERY_RANGE':
                handleQueryRange(msg.id, msg.payload);
                break;
            case 'GET_STATE':
                handleGetState(msg.id);
                break;
            case 'RESET':
                handleReset(msg.id);
                break;
            default:
                respond({ type: 'ERROR', id: (msg as any).id ?? 0, payload: `Unknown message type: ${(msg as any).type}` });
        }
    } catch (err) {
        respond({ type: 'ERROR', id: (msg as any).id ?? 0, payload: String(err) });
    }
};

// ---- Handlers ----

function handleInit(id: number, cfg: BufferWorkerConfig): void {
    config = cfg;
    const layerIds: LayerId[] = ['audio', 'mel', 'energyVad', 'inferenceVad'];
    layers = {} as Record<LayerId, CircularLayer>;

    for (const lid of layerIds) {
        const lcfg = cfg.layers[lid];
        layers[lid] = new CircularLayer(lcfg, cfg.sampleRate);
    }

    const audioMB = (layers.audio.getState().maxEntries * 4 / (1024 * 1024)).toFixed(1);
    const melMB = (layers.mel.getState().maxEntries * layers.mel.getState().entryDimension * 4 / (1024 * 1024)).toFixed(1);
    console.log(
        `[BufferWorker] Initialized: sr=${cfg.sampleRate}, ` +
        `audio=${audioMB}MB, mel=${melMB}MB, ` +
        `energyVad hop=${cfg.layers.energyVad.hopSamples}, ` +
        `inferenceVad hop=${cfg.layers.inferenceVad.hopSamples}`
    );

    respond({ type: 'INIT', id, payload: { success: true } });
}

function handleWrite(payload: WritePayload): void {
    if (!layers) return;
    const layer = layers[payload.layer];
    if (!layer) return;

    if (payload.globalSampleOffset !== undefined) {
        const targetEntry = layer.sampleToEntry(payload.globalSampleOffset);
        layer.setGlobalWriteIndex(targetEntry);
    }

    const data = payload.data instanceof Float32Array ? payload.data : new Float32Array(payload.data);
    layer.write(data);
}

function handleWriteBatch(payload: WriteBatchPayload): void {
    if (!layers) return;
    const layer = layers[payload.layer];
    if (!layer) return;

    if (payload.globalSampleOffset !== undefined) {
        const targetEntry = layer.sampleToEntry(payload.globalSampleOffset);
        layer.setGlobalWriteIndex(targetEntry);
    }

    layer.writeBatch(payload.data);
}

function handleHasSpeech(id: number, query: HasSpeechQuery): void {
    if (!layers) {
        respond({ type: 'HAS_SPEECH', id, payload: { hasSpeech: false, maxProb: 0, entriesChecked: 0 } });
        return;
    }

    const layer = layers[query.layer];
    if (!layer) {
        respond({ type: 'HAS_SPEECH', id, payload: { hasSpeech: false, maxProb: 0, entriesChecked: 0 } });
        return;
    }

    const result = layer.hasSpeechInRange(query.startSample, query.endSample, query.threshold);
    respond({ type: 'HAS_SPEECH', id, payload: result });
}

function handleGetSilenceTail(id: number, query: SilenceTailQuery): void {
    if (!layers || !config) {
        respond({ type: 'GET_SILENCE_TAIL', id, payload: { durationSec: 0 } });
        return;
    }
    const layer = layers[query.layer];
    if (!layer) {
        respond({ type: 'GET_SILENCE_TAIL', id, payload: { durationSec: 0 } });
        return;
    }
    const durationSec = layer.getSilenceTailDuration(query.threshold, config.sampleRate);
    respond({ type: 'GET_SILENCE_TAIL', id, payload: { durationSec } });
}

function handleQueryRange(id: number, query: RangeQuery): void {
    if (!layers) {
        respond({
            type: 'QUERY_RANGE', id,
            payload: { startSample: query.startSample, endSample: query.endSample, layers: {} },
        });
        return;
    }

    const result: RangeResult = {
        startSample: query.startSample,
        endSample: query.endSample,
        layers: {},
    };

    const transfers: ArrayBuffer[] = [];

    for (const lid of query.layers) {
        const layer = layers[lid];
        if (!layer) continue;

        const slice = layer.readRange(query.startSample, query.endSample);
        if (slice) {
            result.layers[lid] = slice;
            transfers.push(slice.data.buffer);
        }
    }

    // Transfer buffers for zero-copy
    (self as any).postMessage({ type: 'QUERY_RANGE', id, payload: result }, transfers);
}

function handleGetState(id: number): void {
    if (!layers || !config) {
        respond({ type: 'ERROR', id, payload: 'BufferWorker not initialized' });
        return;
    }

    const state: BufferState = {
        sampleRate: config.sampleRate,
        layers: {
            audio: layers.audio.getState(),
            mel: layers.mel.getState(),
            energyVad: layers.energyVad.getState(),
            inferenceVad: layers.inferenceVad.getState(),
        },
    };

    respond({ type: 'GET_STATE', id, payload: state });
}

function handleReset(id: number): void {
    if (layers) {
        for (const layer of Object.values(layers)) {
            layer.reset();
        }
    }
    respond({ type: 'RESET', id, payload: { success: true } });
}

function respond(msg: any, transfers?: Transferable[]): void {
    if (transfers) {
        (self as any).postMessage(msg, transfers);
    } else {
        (self as any).postMessage(msg);
    }
}
