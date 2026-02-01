import { EnergyVADConfig, VADResult } from './types';

/**
 * EnergyVAD implements a simple RMS-based Voice Activity Detection system.
 * It uses a state machine with duration-based hysteresis to filter out
 * transient noises and bridge small gaps in speech.
 */
export class EnergyVAD {
    private config: EnergyVADConfig;
    private isSpeechActive: boolean = false;

    // Timers/Counters in frames
    private speechConfirmationCounter: number = 0;
    private silenceConfirmationCounter: number = 0;

    // Transition thresholds in frames
    private minSpeechFrames: number;
    private minSilenceFrames: number;

    constructor(config: Partial<EnergyVADConfig> = {}) {
        this.config = {
            energyThreshold: 0.01,
            minSpeechDuration: 100,
            minSilenceDuration: 300,
            sampleRate: 16000,
            ...config,
        };

        this.minSpeechFrames = Math.ceil((this.config.minSpeechDuration / 1000) * this.config.sampleRate);
        this.minSilenceFrames = Math.ceil((this.config.minSilenceDuration / 1000) * this.config.sampleRate);
    }

    /**
     * Process an audio chunk and return the VAD state.
     * @param chunk - Float32Array of mono PCM samples
     */
    process(chunk: Float32Array): VADResult {
        // 1. Calculate RMS Energy
        let sumSquares = 0;
        for (let i = 0; i < chunk.length; i++) {
            sumSquares += chunk[i] * chunk[i];
        }
        const energy = Math.sqrt(sumSquares / chunk.length);
        const timestamp = Date.now();

        const isAboveThreshold = energy > this.config.energyThreshold;
        const chunkLength = chunk.length;

        let speechStart = false;
        let speechEnd = false;

        if (isAboveThreshold) {
            // Energy is HIGH
            this.silenceConfirmationCounter = 0;

            if (!this.isSpeechActive) {
                this.speechConfirmationCounter += chunkLength;
                if (this.speechConfirmationCounter >= this.minSpeechFrames) {
                    this.isSpeechActive = true;
                    speechStart = true;
                }
            }
        } else {
            // Energy is LOW
            this.speechConfirmationCounter = 0;

            if (this.isSpeechActive) {
                this.silenceConfirmationCounter += chunkLength;
                if (this.silenceConfirmationCounter >= this.minSilenceFrames) {
                    this.isSpeechActive = false;
                    speechEnd = true;
                    this.silenceConfirmationCounter = 0;
                }
            }
        }

        return {
            isSpeech: this.isSpeechActive,
            energy,
            timestamp,
            speechStart,
            speechEnd,
        };
    }

    /**
     * Reset the internal state machine.
     */
    reset(): void {
        this.isSpeechActive = false;
        this.speechConfirmationCounter = 0;
        this.silenceConfirmationCounter = 0;
    }

    /**
     * Update configuration at runtime.
     */
    updateConfig(config: Partial<EnergyVADConfig>): void {
        this.config = { ...this.config, ...config };
        this.minSpeechFrames = Math.ceil((this.config.minSpeechDuration / 1000) * this.config.sampleRate);
        this.minSilenceFrames = Math.ceil((this.config.minSilenceDuration / 1000) * this.config.sampleRate);
    }

    /**
     * Get the current configuration.
     */
    getConfig(): EnergyVADConfig {
        return { ...this.config };
    }
}
