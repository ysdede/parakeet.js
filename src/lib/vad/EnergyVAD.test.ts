
import { describe, it, expect, beforeEach } from 'vitest';
import { EnergyVAD } from './EnergyVAD';

describe('EnergyVAD', () => {
    let vad: EnergyVAD;
    const SAMPLE_RATE = 16000;
    const CHUNK_SIZE = 160; // 10ms at 16kHz

    // Helper to create audio chunks
    const createChunk = (length: number, amplitude: number): Float32Array => {
        const chunk = new Float32Array(length);
        chunk.fill(amplitude);
        return chunk;
    };

    beforeEach(() => {
        vad = new EnergyVAD({
            sampleRate: SAMPLE_RATE,
            minSpeechDuration: 100,  // 100ms to trigger speech
            minSilenceDuration: 300, // 300ms to end speech
            energyThreshold: 0.02    // 0.02 RMS threshold
        });
    });

    it('should initialize with correct default state', () => {
        const config = vad.getConfig();
        expect(config.sampleRate).toBe(SAMPLE_RATE);
        expect(config.minSpeechDuration).toBe(100);
        expect(config.minSilenceDuration).toBe(300);

        // Initial process call should be silence
        const result = vad.process(createChunk(CHUNK_SIZE, 0));
        expect(result.isSpeech).toBe(false);
        expect(result.speechStart).toBe(false);
        expect(result.speechEnd).toBe(false);
    });

    it('should detect speech after minSpeechDuration', () => {
        // Need > 100ms of speech to trigger.
        // 10ms chunks -> 10 chunks = 100ms.
        // It triggers ON the 10th chunk if >= minSpeechFrames is met.
        // Let's feed 11 chunks to be safe and observe transitions.

        const loudChunk = createChunk(CHUNK_SIZE, 0.1); // Energy 0.1 > 0.02

        // Feed 9 chunks (90ms) - should still be silent
        for (let i = 0; i < 9; i++) {
            const result = vad.process(loudChunk);
            expect(result.isSpeech).toBe(false);
            expect(result.speechStart).toBe(false);
        }

        // 10th chunk (100ms total) - should trigger speech
        const triggerResult = vad.process(loudChunk);
        expect(triggerResult.isSpeech).toBe(true);
        expect(triggerResult.speechStart).toBe(true);

        // 11th chunk - should stay speech
        const nextResult = vad.process(loudChunk);
        expect(nextResult.isSpeech).toBe(true);
        expect(nextResult.speechStart).toBe(false);
    });

    it('should handle hysteresis (ignore short silence)', () => {
        // 1. Trigger speech first
        const loudChunk = createChunk(CHUNK_SIZE, 0.1);
        for (let i = 0; i < 11; i++) {
            vad.process(loudChunk);
        }

        // Verify we are in speech mode
        expect(vad.process(loudChunk).isSpeech).toBe(true);

        // 2. Feed silence for < 300ms (e.g. 200ms = 20 chunks)
        const quietChunk = createChunk(CHUNK_SIZE, 0.0);
        for (let i = 0; i < 20; i++) {
            const result = vad.process(quietChunk);
            expect(result.isSpeech).toBe(true);
            expect(result.speechEnd).toBe(false);
        }

        // 3. Resume speech - should stay active without re-triggering speechStart
        const resumeResult = vad.process(loudChunk);
        expect(resumeResult.isSpeech).toBe(true);
        expect(resumeResult.speechStart).toBe(false);
    });

    it('should end speech after minSilenceDuration', () => {
        // 1. Trigger speech
        const loudChunk = createChunk(CHUNK_SIZE, 0.1);
        for (let i = 0; i < 11; i++) {
            vad.process(loudChunk);
        }

        // 2. Feed silence for 29 chunks (290ms) - should still be speech
        const quietChunk = createChunk(CHUNK_SIZE, 0.0);
        for (let i = 0; i < 29; i++) {
            const result = vad.process(quietChunk);
            expect(result.isSpeech).toBe(true);
        }

        // 3. 30th chunk (300ms) - should trigger silence
        const endResult = vad.process(quietChunk);
        expect(endResult.isSpeech).toBe(false);
        expect(endResult.speechEnd).toBe(true);

        // 4. Next chunk - stay silent
        const nextResult = vad.process(quietChunk);
        expect(nextResult.isSpeech).toBe(false);
        expect(nextResult.speechEnd).toBe(false);
    });

    it('should adapt noise floor during silence', () => {
        const quietChunk = createChunk(CHUNK_SIZE, 0.001); // Very quiet

        // Process initial chunk to get baseline
        const initialResult = vad.process(quietChunk);
        const initialNoiseFloor = initialResult.noiseFloor!;

        // Process many quiet chunks
        for (let i = 0; i < 50; i++) {
            vad.process(quietChunk);
        }

        const finalResult = vad.process(quietChunk);
        const finalNoiseFloor = finalResult.noiseFloor!;

        // Noise floor should have adapted towards the signal energy (0.001)
        // Since initial noise floor is 0.005, it should decrease.
        expect(finalNoiseFloor).toBeLessThan(initialNoiseFloor);
    });

    it('should reset state correctly', () => {
        // 1. Trigger speech
        const loudChunk = createChunk(CHUNK_SIZE, 0.1);
        for (let i = 0; i < 11; i++) {
            vad.process(loudChunk);
        }
        expect(vad.process(loudChunk).isSpeech).toBe(true);

        // 2. Reset
        vad.reset();

        // 3. Verify state is reset (process quiet chunk should be silence, no speechEnd triggered immediately)
        const result = vad.process(createChunk(CHUNK_SIZE, 0));
        expect(result.isSpeech).toBe(false);
        expect(result.speechEnd).toBe(false); // Should not trigger speechEnd because we were reset, not transitioned
    });

    it('should update configuration', () => {
        vad.updateConfig({
            minSpeechDuration: 200 // Increase requirement to 200ms
        });

        const loudChunk = createChunk(CHUNK_SIZE, 0.1);

        // Feed 15 chunks (150ms) - used to be enough, now should NOT be enough
        for (let i = 0; i < 15; i++) {
            const result = vad.process(loudChunk);
            expect(result.isSpeech).toBe(false);
        }

        // Feed 6 more chunks (total 210ms)
        for (let i = 0; i < 6; i++) {
            vad.process(loudChunk);
        }

        // Should be active now
        const result = vad.process(loudChunk);
        expect(result.isSpeech).toBe(true);
    });
});
