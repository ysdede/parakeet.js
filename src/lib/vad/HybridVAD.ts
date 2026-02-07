import { EnergyVAD } from './EnergyVAD';
import { SileroVAD } from './SileroVAD';
import type {
    HybridVADConfig,
    HybridVADResult,
    HybridVADState,
    VADResult,
    SileroVADResult,
} from './types';

/**
 * HybridVAD combines EnergyVAD (fast, heuristic) with Silero VAD (accurate, neural)
 * for efficient and reliable voice activity detection.
 *
 * Strategy:
 * - EnergyVAD runs on every audio chunk as a fast pre-filter
 * - When EnergyVAD detects potential speech (onset/offset transition), Silero confirms
 * - During confirmed speech, Silero continues to run to track probability
 * - During clear silence (energy well below noise floor), Silero is skipped entirely
 *
 * State machine:
 *   silence -> speech_candidate -> speech_confirmed -> speech_ending -> silence
 */
export class HybridVAD {
    private config: HybridVADConfig;
    private energyVAD: EnergyVAD;
    private sileroVAD: SileroVAD;

    private state: HybridVADState = 'silence';
    private onsetCounter: number = 0;
    private offsetCounter: number = 0;

    // Accumulator for Silero: collect samples until we have hopSize (512)
    private sileroAccumulator: Float32Array;
    private sileroAccumulatorPos: number = 0;
    private lastSileroProbability: number = 0;

    // Track whether Silero is initialized
    private sileroReady: boolean = false;

    constructor(config: Partial<HybridVADConfig> = {}) {
        this.config = {
            sileroThreshold: 0.5,
            onsetConfirmations: 2,
            offsetConfirmations: 3,
            sampleRate: 16000,
            ...config,
        };

        this.energyVAD = new EnergyVAD(this.config.energyConfig);
        this.sileroVAD = new SileroVAD({
            threshold: this.config.sileroThreshold,
            sampleRate: this.config.sampleRate as 8000 | 16000,
            ...this.config.sileroConfig,
        });

        // Silero expects 512-sample chunks at 16kHz
        const hopSize = this.sileroVAD.getHopSize();
        this.sileroAccumulator = new Float32Array(hopSize);
    }

    /**
     * Initialize the Silero VAD model. Must be called before process().
     * EnergyVAD does not need initialization.
     */
    async init(modelUrl?: string): Promise<void> {
        await this.sileroVAD.init(modelUrl);
        this.sileroReady = true;
    }

    /**
     * Process an audio chunk through the hybrid pipeline.
     *
     * EnergyVAD always runs. Silero runs conditionally based on the hybrid state:
     * - silence: Silero runs only when energy suggests potential speech
     * - speech_candidate: Silero runs to confirm speech onset
     * - speech_confirmed: Silero runs to track ongoing speech
     * - speech_ending: Silero runs to confirm speech offset
     *
     * @param chunk - Float32Array of mono PCM samples at the configured sample rate
     * @returns HybridVADResult with combined decision
     */
    async process(chunk: Float32Array): Promise<HybridVADResult> {
        // 1. Always run EnergyVAD (fast, synchronous)
        const energyResult: VADResult = this.energyVAD.process(chunk);

        // 2. Decide whether to run Silero
        let sileroResult: SileroVADResult | null = null;
        const shouldRunSilero = this.shouldRunSilero(energyResult);

        if (shouldRunSilero && this.sileroReady) {
            sileroResult = await this.runSileroOnChunk(chunk);
        }

        // 3. Update hybrid state machine
        const result = this.updateStateMachine(energyResult, sileroResult);
        return result;
    }

    /**
     * Determine whether Silero should run on this chunk.
     */
    private shouldRunSilero(energyResult: VADResult): boolean {
        if (!this.sileroReady) return false;

        switch (this.state) {
            case 'silence':
                // Run Silero only when energy suggests potential speech
                return energyResult.isSpeech || (energyResult.snr !== undefined && energyResult.snr > 1.5);

            case 'speech_candidate':
                // Always run Silero during confirmation
                return true;

            case 'speech_confirmed':
                // Run Silero to track speech probability during active speech
                return true;

            case 'speech_ending':
                // Always run Silero to confirm offset
                return true;

            default:
                return false;
        }
    }

    /**
     * Feed audio samples into the Silero accumulator and run inference
     * when we have enough samples (hopSize = 512).
     */
    private async runSileroOnChunk(chunk: Float32Array): Promise<SileroVADResult | null> {
        let lastResult: SileroVADResult | null = null;

        for (let i = 0; i < chunk.length; i++) {
            this.sileroAccumulator[this.sileroAccumulatorPos++] = chunk[i];

            if (this.sileroAccumulatorPos >= this.sileroAccumulator.length) {
                // We have a full hop -- run Silero
                lastResult = await this.sileroVAD.process(this.sileroAccumulator);
                this.lastSileroProbability = lastResult.probability;
                this.sileroAccumulatorPos = 0;
            }
        }

        return lastResult;
    }

    /**
     * Update the hybrid state machine based on combined VAD results.
     */
    private updateStateMachine(
        energyResult: VADResult,
        sileroResult: SileroVADResult | null,
    ): HybridVADResult {
        const prevState = this.state;
        let speechStart = false;
        let speechEnd = false;

        const sileroSpeech = sileroResult ? sileroResult.probability >= this.config.sileroThreshold : false;
        const sileroProbability = sileroResult?.probability ?? this.lastSileroProbability;

        // When Silero is not available, use energy-only mode with the same state machine
        // but treat energy decisions as authoritative (no Silero confirmation needed).
        const energyOnly = !this.sileroReady;

        switch (this.state) {
            case 'silence': {
                if (energyOnly) {
                    // Energy-only fallback: treat energy detection as a candidate
                    if (energyResult.isSpeech) {
                        this.onsetCounter = 1;
                        this.state = 'speech_candidate';
                    }
                } else if (energyResult.isSpeech && sileroSpeech) {
                    this.onsetCounter = 1;
                    this.state = 'speech_candidate';
                } else if (energyResult.isSpeech && sileroResult && !sileroSpeech) {
                    // Energy says speech but Silero disagrees -- stay silent
                    this.onsetCounter = 0;
                }
                break;
            }

            case 'speech_candidate': {
                if (energyOnly) {
                    // Energy-only: confirm based on consecutive energy detections
                    if (energyResult.isSpeech) {
                        this.onsetCounter++;
                        if (this.onsetCounter >= this.config.onsetConfirmations) {
                            this.state = 'speech_confirmed';
                            this.offsetCounter = 0;
                            speechStart = true;
                        }
                    } else {
                        this.onsetCounter = 0;
                        this.state = 'silence';
                    }
                } else if (sileroSpeech) {
                    this.onsetCounter++;
                    if (this.onsetCounter >= this.config.onsetConfirmations) {
                        this.state = 'speech_confirmed';
                        this.offsetCounter = 0;
                        speechStart = true;
                    }
                } else if (sileroResult && !sileroSpeech) {
                    // Silero disagrees, reset
                    this.onsetCounter = 0;
                    this.state = 'silence';
                } else if (!energyResult.isSpeech) {
                    // Energy dropped, cancel candidate
                    this.onsetCounter = 0;
                    this.state = 'silence';
                }
                break;
            }

            case 'speech_confirmed': {
                if (energyOnly) {
                    // Energy-only: start ending when energy drops
                    if (!energyResult.isSpeech) {
                        this.offsetCounter = 1;
                        this.state = 'speech_ending';
                    } else {
                        this.offsetCounter = 0;
                    }
                } else if (sileroResult && !sileroSpeech) {
                    this.offsetCounter = 1;
                    this.state = 'speech_ending';
                } else if (!energyResult.isSpeech && !sileroResult) {
                    // Energy dropped and no Silero data -- start ending check
                    this.offsetCounter = 1;
                    this.state = 'speech_ending';
                } else {
                    this.offsetCounter = 0;
                }
                break;
            }

            case 'speech_ending': {
                if (energyOnly) {
                    // Energy-only: confirm offset after consecutive non-speech
                    if (!energyResult.isSpeech) {
                        this.offsetCounter++;
                        if (this.offsetCounter >= this.config.offsetConfirmations) {
                            this.state = 'silence';
                            this.onsetCounter = 0;
                            speechEnd = true;
                        }
                    } else {
                        // Energy resumed, go back to confirmed
                        this.state = 'speech_confirmed';
                        this.offsetCounter = 0;
                    }
                } else if (sileroResult && !sileroSpeech) {
                    this.offsetCounter++;
                    if (this.offsetCounter >= this.config.offsetConfirmations) {
                        this.state = 'silence';
                        this.onsetCounter = 0;
                        speechEnd = true;
                    }
                } else if (sileroSpeech) {
                    // Speech resumed, go back to confirmed
                    this.state = 'speech_confirmed';
                    this.offsetCounter = 0;
                } else if (!energyResult.isSpeech && !sileroResult) {
                    this.offsetCounter++;
                    if (this.offsetCounter >= this.config.offsetConfirmations) {
                        this.state = 'silence';
                        this.onsetCounter = 0;
                        speechEnd = true;
                    }
                }
                break;
            }
        }

        const isSpeech = this.state === 'speech_confirmed' || this.state === 'speech_ending';

        return {
            isSpeech,
            state: this.state,
            energy: energyResult.energy,
            sileroProbability: sileroProbability || undefined,
            timestamp: Date.now(),
            speechStart,
            speechEnd,
            snr: energyResult.snr,
            noiseFloor: energyResult.noiseFloor,
        };
    }

    /**
     * Reset all internal state.
     */
    reset(): void {
        this.state = 'silence';
        this.onsetCounter = 0;
        this.offsetCounter = 0;
        this.sileroAccumulatorPos = 0;
        this.sileroAccumulator.fill(0);
        this.lastSileroProbability = 0;
        this.energyVAD.reset();
        if (this.sileroReady) {
            this.sileroVAD.reset();
        }
    }

    /**
     * Release the Silero ONNX session.
     */
    async dispose(): Promise<void> {
        await this.sileroVAD.dispose();
        this.sileroReady = false;
    }

    /**
     * Whether the hybrid VAD is fully initialized (Silero loaded).
     */
    isReady(): boolean {
        return this.sileroReady;
    }

    /**
     * Get the current state.
     */
    getState(): HybridVADState {
        return this.state;
    }

    /**
     * Get the current configuration.
     */
    getConfig(): HybridVADConfig {
        return { ...this.config };
    }

    /**
     * Get the last known Silero probability.
     */
    getLastSileroProbability(): number {
        return this.lastSileroProbability;
    }
}
