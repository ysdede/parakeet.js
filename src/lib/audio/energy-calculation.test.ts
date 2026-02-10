/**
 * Unit tests for the VAD energy calculation: Peak Amplitude + 6-sample SMA.
 *
 * Matches the logic in AudioEngine (vad-correction-peak-energy fix).
 * parakeet-ui uses peak + 6-sample SMA; RMS was causing all-audio-marked-as-silence.
 *
 * Run: npm test
 */

import { describe, it, expect } from 'vitest';

/**
 * Compute chunk energy using Peak Amplitude + 6-sample SMA (mirrors AudioEngine).
 * Each chunk contributes one peak (max absolute sample); history is smoothed over 6 values.
 */
function computeEnergyWithPeakSMA(
    chunk: Float32Array,
    energyHistory: number[]
): { energy: number; newHistory: number[] } {
    let maxAbs = 0;
    for (let i = 0; i < chunk.length; i++) {
        const abs = Math.abs(chunk[i]);
        if (abs > maxAbs) maxAbs = abs;
    }
    const newHistory = [...energyHistory, maxAbs];
    if (newHistory.length > 6) newHistory.shift();
    const energy = newHistory.reduce((a, b) => a + b, 0) / newHistory.length;
    return { energy, newHistory };
}

describe('Energy calculation (Peak + 6-sample SMA)', () => {
    it('should use peak amplitude per chunk (not RMS)', () => {
        const chunk = new Float32Array(100);
        chunk[50] = 0.5;
        const { energy } = computeEnergyWithPeakSMA(chunk, []);
        expect(energy).toBe(0.5);
    });

    it('should smooth over up to 6 samples', () => {
        const history: number[] = [];
        let h = history;
        for (let i = 0; i < 6; i++) {
            const chunk = new Float32Array(10);
            chunk[0] = 0.1 * (i + 1);
            const out = computeEnergyWithPeakSMA(chunk, h);
            h = out.newHistory;
        }
        const avg = h.reduce((a, b) => a + b, 0) / h.length;
        expect(avg).toBeCloseTo((0.1 + 0.2 + 0.3 + 0.4 + 0.5 + 0.6) / 6, 5);
    });

    it('should keep only the last 6 peaks in history', () => {
        let h: number[] = [];
        for (let i = 0; i < 10; i++) {
            const chunk = new Float32Array(1);
            chunk[0] = i + 1;
            const out = computeEnergyWithPeakSMA(chunk, h);
            h = out.newHistory;
        }
        expect(h.length).toBe(6);
        expect(h).toEqual([5, 6, 7, 8, 9, 10]);
    });

    it('should produce higher value for loud chunk than quiet chunk', () => {
        const quiet = new Float32Array(100);
        quiet.fill(0.01);
        const loud = new Float32Array(100);
        loud.fill(0.8);
        const { energy: eQuiet } = computeEnergyWithPeakSMA(quiet, []);
        const { energy: eLoud } = computeEnergyWithPeakSMA(loud, []);
        expect(eLoud).toBeGreaterThan(eQuiet);
        expect(eQuiet).toBeCloseTo(0.01, 5);
        expect(eLoud).toBeCloseTo(0.8, 5);
    });
});
