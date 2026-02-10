/**
 * BufferWorker Types
 *
 * Shared type definitions for the centralized multi-layer data store.
 * All layers are time-aligned via global sample indexes at a fixed sample rate.
 */

// ---- Layer Identifiers ----

export type LayerId = 'audio' | 'mel' | 'energyVad' | 'inferenceVad';

// ---- Layer Configuration ----

/** Describes a single data layer within the BufferWorker. */
export interface LayerConfig {
    /** Number of audio samples per entry (hop size in samples) */
    hopSamples: number;
    /** Number of values per entry (1 for scalar VAD probs, N for mel bins) */
    entryDimension: number;
    /** Maximum duration to retain in seconds */
    maxDurationSec: number;
}

/** Full configuration sent to the BufferWorker on init. */
export interface BufferWorkerConfig {
    /** Audio sample rate in Hz (typically 16000) */
    sampleRate: number;
    /** Per-layer configuration */
    layers: Record<LayerId, LayerConfig>;
}

// ---- Messages: Main Thread -> Worker ----

export type BufferWorkerRequest =
    | { type: 'INIT'; id: number; payload: BufferWorkerConfig }
    | { type: 'WRITE'; id?: number; payload: WritePayload }
    | { type: 'WRITE_BATCH'; id?: number; payload: WriteBatchPayload }
    | { type: 'HAS_SPEECH'; id: number; payload: HasSpeechQuery }
    | { type: 'GET_SILENCE_TAIL'; id: number; payload: SilenceTailQuery }
    | { type: 'QUERY_RANGE'; id: number; payload: RangeQuery }
    | { type: 'GET_STATE'; id: number; payload?: undefined }
    | { type: 'RESET'; id: number; payload?: undefined };

/** Query the duration of trailing silence from the write head. */
export interface SilenceTailQuery {
    layer: 'energyVad' | 'inferenceVad';
    threshold: number;
}

/** Write a single entry to a layer. */
export interface WritePayload {
    layer: LayerId;
    /** Data values. Length must equal the layer's entryDimension. */
    data: Float32Array | number[];
    /** Global sample offset of this entry's start. If omitted, auto-increments. */
    globalSampleOffset?: number;
}

/** Write multiple entries to a layer at once. */
export interface WriteBatchPayload {
    layer: LayerId;
    /**
     * Flat array of values. Length must be N * entryDimension
     * where N is the number of entries.
     */
    data: Float32Array;
    /** Global sample offset of the first entry. If omitted, auto-increments. */
    globalSampleOffset?: number;
}

/** Query whether any VAD entry exceeds a threshold in a sample range. */
export interface HasSpeechQuery {
    /** Layer to check (energyVad or inferenceVad) */
    layer: 'energyVad' | 'inferenceVad';
    /** Start sample (global, inclusive) */
    startSample: number;
    /** End sample (global, exclusive) */
    endSample: number;
    /** VAD probability threshold */
    threshold: number;
}

/** Query data for an arbitrary sample range. */
export interface RangeQuery {
    /** Start sample (global, inclusive) */
    startSample: number;
    /** End sample (global, exclusive) */
    endSample: number;
    /** Which layers to include in the response */
    layers: LayerId[];
}

// ---- Messages: Worker -> Main Thread ----

export type BufferWorkerResponse =
    | { type: 'INIT'; id: number; payload: { success: boolean } }
    | { type: 'HAS_SPEECH'; id: number; payload: HasSpeechResult }
    | { type: 'GET_SILENCE_TAIL'; id: number; payload: { durationSec: number } }
    | { type: 'QUERY_RANGE'; id: number; payload: RangeResult }
    | { type: 'GET_STATE'; id: number; payload: BufferState }
    | { type: 'RESET'; id: number; payload: { success: boolean } }
    | { type: 'ERROR'; id: number; payload: string };

export interface HasSpeechResult {
    hasSpeech: boolean;
    maxProb: number;
    entriesChecked: number;
}

export interface RangeResult {
    startSample: number;
    endSample: number;
    /** Per-layer data slices, keyed by LayerId */
    layers: Partial<Record<LayerId, LayerSlice>>;
}

export interface LayerSlice {
    /** Flat Float32Array of values for the range */
    data: Float32Array;
    /** Number of entries returned */
    entryCount: number;
    /** The entry dimension (values per entry) */
    entryDimension: number;
    /** Global sample offset of the first returned entry */
    firstEntrySample: number;
    /** Hop size of this layer in samples */
    hopSamples: number;
}

/** Snapshot of the buffer state for debugging / UI. */
export interface BufferState {
    sampleRate: number;
    layers: Record<LayerId, {
        globalWriteIndex: number;
        currentSample: number;
        oldestSample: number;
        fillCount: number;
        maxEntries: number;
        hopSamples: number;
        entryDimension: number;
    }>;
}

// ---- TEN-VAD Worker Messages ----

export type TenVADRequest =
    | { type: 'INIT'; id: number; payload: TenVADConfig }
    | { type: 'PROCESS'; id?: number; payload: { samples: Float32Array; globalSampleOffset: number } }
    | { type: 'RESET'; id: number; payload?: undefined }
    | { type: 'DISPOSE'; id: number; payload?: undefined };

export interface TenVADConfig {
    /** TEN-VAD hop size in samples (default: 256 at 16kHz = 16ms) */
    hopSize: number;
    /** VAD detection threshold [0, 1] (default: 0.5) */
    threshold: number;
    /** Path to WASM files (default: '/wasm/') */
    wasmPath?: string;
}

export type TenVADResponse =
    | { type: 'INIT'; id: number; payload: { success: boolean; version?: string } }
    | { type: 'RESULT'; id?: number; payload: TenVADResult }
    | { type: 'RESET'; id: number; payload: { success: boolean } }
    | { type: 'DISPOSE'; id: number; payload: { success: boolean } }
    | { type: 'ERROR'; id: number; payload: string };

export interface TenVADResult {
    /** Per-hop probabilities for this chunk */
    probabilities: Float32Array;
    /** Per-hop voice flags (0 or 1) */
    flags: Uint8Array;
    /** Global sample offset of the first hop in this result */
    globalSampleOffset: number;
    /** Number of hops processed */
    hopCount: number;
    /** Processing time in ms */
    processingTimeMs: number;
}
