import type { SileroVADConfig, SileroVADResult } from './types';

// Use the globally-exposed ort from parakeet.js / onnxruntime-web
declare const ort: any;

/**
 * Silero VAD ONNX model runner for browser-side voice activity detection.
 *
 * Loads the Silero VAD v5 ONNX model via onnxruntime-web and runs inference
 * on 512-sample (32ms at 16kHz) audio chunks, returning a speech probability.
 *
 * The model maintains internal LSTM hidden state (h/c tensors) across calls,
 * so chunks must be fed sequentially.
 *
 * Reference: onnx-community/silero-vad on HuggingFace
 * Python reference: onnx-asr/src/onnx_asr/models/silero.py
 */
export class SileroVAD {
    private config: SileroVADConfig;
    private session: any | null = null;
    private initialized: boolean = false;

    // Internal LSTM state tensors (persisted across calls)
    private stateH: any | null = null;
    private stateC: any | null = null;
    private srTensor: any | null = null;

    // Silero model constants
    // For 16kHz: hop_size=512 (32ms), context_size=64
    // For 8kHz:  hop_size=256 (32ms), context_size=32
    private readonly hopSize: number;
    private readonly contextSize: number;

    // Context buffer for prepending to each chunk
    private contextBuffer: Float32Array;

    constructor(config: Partial<SileroVADConfig> = {}) {
        this.config = {
            modelUrl: 'https://huggingface.co/onnx-community/silero-vad/resolve/main/onnx/model.onnx',
            threshold: 0.5,
            negThreshold: config.threshold !== undefined ? config.threshold - 0.15 : 0.35,
            sampleRate: 16000,
            ...config,
        };

        this.hopSize = this.config.sampleRate === 16000 ? 512 : 256;
        this.contextSize = this.config.sampleRate === 16000 ? 64 : 32;
        this.contextBuffer = new Float32Array(this.contextSize);
    }

    /**
     * Initialize the ONNX session and create initial state tensors.
     * Must be called before process().
     */
    async init(modelUrl?: string): Promise<void> {
        if (this.initialized) return;

        const url = modelUrl || this.config.modelUrl;

        // Ensure ort is available (exposed by parakeet.js backend.js)
        const ortLib = typeof ort !== 'undefined' ? ort : (globalThis as any).ort;
        if (!ortLib) {
            throw new Error(
                'onnxruntime-web (ort) not found. Ensure parakeet.js backend is initialized first.'
            );
        }

        // Create ONNX inference session with WASM backend (VAD is lightweight, no need for WebGPU)
        this.session = await ortLib.InferenceSession.create(url, {
            executionProviders: ['wasm'],
            graphOptimizationLevel: 'all',
        });

        // Initialize LSTM state tensors: shape [2, 1, 128] for batch=1
        // Silero v5 uses a combined state tensor of shape [2, 1, 128]
        this.stateH = new ortLib.Tensor('float32', new Float32Array(2 * 1 * 128), [2, 1, 128]);
        // Sample rate tensor
        this.srTensor = new ortLib.Tensor('int64', BigInt64Array.from([BigInt(this.config.sampleRate)]), [1]);

        this.initialized = true;
    }

    /**
     * Process a single audio chunk and return speech probability.
     *
     * The chunk should be exactly hopSize (512) samples at 16kHz.
     * If the chunk is a different size, it will be padded or truncated.
     *
     * @param chunk - Float32Array of mono PCM samples at the configured sample rate
     * @returns SileroVADResult with speech probability
     */
    async process(chunk: Float32Array): Promise<SileroVADResult> {
        if (!this.initialized || !this.session) {
            throw new Error('SileroVAD not initialized. Call init() first.');
        }

        const ortLib = typeof ort !== 'undefined' ? ort : (globalThis as any).ort;

        // Build the input: [context_size + hop_size] samples
        // Prepend the context buffer (last contextSize samples from previous chunk)
        const inputLength = this.contextSize + this.hopSize;
        const inputData = new Float32Array(inputLength);
        inputData.set(this.contextBuffer, 0);

        // Copy or pad/truncate the chunk to fit hopSize
        if (chunk.length >= this.hopSize) {
            inputData.set(chunk.subarray(0, this.hopSize), this.contextSize);
        } else {
            inputData.set(chunk, this.contextSize);
            // Remaining is already zero-filled
        }

        // Update context buffer: take the last contextSize samples from the current chunk
        if (chunk.length >= this.contextSize) {
            this.contextBuffer.set(chunk.subarray(chunk.length - this.contextSize));
        } else {
            // Shift existing context and append what we have
            const shift = this.contextSize - chunk.length;
            this.contextBuffer.copyWithin(0, chunk.length);
            this.contextBuffer.set(chunk, shift);
        }

        // Create input tensor: shape [1, context_size + hop_size]
        const inputTensor = new ortLib.Tensor('float32', inputData, [1, inputLength]);

        // Run inference
        const feeds: Record<string, any> = {
            input: inputTensor,
            state: this.stateH,
            sr: this.srTensor,
        };

        const results = await this.session.run(feeds);

        // Extract output probability and new state
        const outputData = results.output.data as Float32Array;
        const probability = outputData[0];

        // Update persistent state
        this.stateH = results.stateN;

        const isSpeech = probability >= this.config.threshold;

        return {
            probability,
            isSpeech,
            timestamp: Date.now(),
        };
    }

    /**
     * Process an audio buffer that may be larger than hopSize.
     * Splits into hopSize chunks and returns probabilities for each.
     */
    async processBuffer(audio: Float32Array): Promise<SileroVADResult[]> {
        const results: SileroVADResult[] = [];
        for (let offset = 0; offset < audio.length; offset += this.hopSize) {
            const end = Math.min(offset + this.hopSize, audio.length);
            const chunk = audio.subarray(offset, end);
            const result = await this.process(chunk);
            results.push(result);
        }
        return results;
    }

    /**
     * Reset the internal LSTM state. Call when starting a new audio stream.
     */
    reset(): void {
        if (!this.initialized) return;

        const ortLib = typeof ort !== 'undefined' ? ort : (globalThis as any).ort;
        this.stateH = new ortLib.Tensor('float32', new Float32Array(2 * 1 * 128), [2, 1, 128]);
        this.contextBuffer.fill(0);
    }

    /**
     * Release the ONNX session and free resources.
     */
    async dispose(): Promise<void> {
        if (this.session) {
            await this.session.release();
            this.session = null;
        }
        this.stateH = null;
        this.srTensor = null;
        this.initialized = false;
    }

    /**
     * Whether the model is ready for inference.
     */
    isReady(): boolean {
        return this.initialized;
    }

    /**
     * Get the expected chunk size in samples.
     */
    getHopSize(): number {
        return this.hopSize;
    }

    /**
     * Get the current configuration.
     */
    getConfig(): SileroVADConfig {
        return { ...this.config };
    }
}
