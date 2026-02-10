/**
 * Unit tests for VADRingBuffer (v4 pipeline).
 *
 * VADRingBuffer stores per-frame speech probabilities in a circular buffer,
 * synchronized with the audio RingBuffer via global frame offsets.
 * Used by WindowBuilder when VAD is available for boundary refinement.
 *
 * Run: npm test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { VADRingBuffer } from './VADRingBuffer';

const SAMPLE_RATE = 16000;
const HOP_SIZE = 512;
const DURATION_SEC = 10;

describe('VADRingBuffer', () => {
    let buffer: VADRingBuffer;

    beforeEach(() => {
        buffer = new VADRingBuffer(SAMPLE_RATE, DURATION_SEC, HOP_SIZE);
    });

    describe('write and readForFrameRange', () => {
        it('should return empty array for invalid range', () => {
            expect(buffer.readForFrameRange(100, 50)).toEqual(new Float32Array(0));
            expect(buffer.readForFrameRange(0, 0)).toEqual(new Float32Array(0));
        });

        it('should return empty array when no data written', () => {
            expect(buffer.readForFrameRange(0, HOP_SIZE * 2)).toEqual(new Float32Array(0));
        });

        it('should store and read probabilities for a frame range', () => {
            buffer.write(0.1);
            buffer.write(0.9);
            buffer.write(0.2);

            const probs = buffer.readForFrameRange(0, HOP_SIZE * 3);
            expect(probs.length).toBe(3);
            expect(probs[0]).toBeCloseTo(0.1, 5);
            expect(probs[1]).toBeCloseTo(0.9, 5);
            expect(probs[2]).toBeCloseTo(0.2, 5);
        });

        it('should clamp read range to available data', () => {
            buffer.write(0.5);
            const probs = buffer.readForFrameRange(0, HOP_SIZE * 10);
            expect(probs.length).toBe(1);
            expect(probs[0]).toBe(0.5);
        });

        it('should support writeBatch', () => {
            buffer.writeBatch([0.2, 0.8, 0.3]);
            const probs = buffer.readForFrameRange(0, HOP_SIZE * 3);
            expect(probs.length).toBe(3);
            expect(probs[0]).toBeCloseTo(0.2, 5);
            expect(probs[1]).toBeCloseTo(0.8, 5);
            expect(probs[2]).toBeCloseTo(0.3, 5);
        });
    });

    describe('getSilenceTailDuration', () => {
        it('should return 0 when no entries', () => {
            expect(buffer.getSilenceTailDuration(0.5)).toBe(0);
        });

        it('should return 0 when last entry is speech', () => {
            buffer.write(0.1);
            buffer.write(0.2);
            buffer.write(0.8);
            expect(buffer.getSilenceTailDuration(0.5)).toBe(0);
        });

        it('should return duration of trailing silence', () => {
            buffer.write(0.8);
            buffer.write(0.1);
            buffer.write(0.2);
            const duration = buffer.getSilenceTailDuration(0.5);
            expect(duration).toBe((2 * HOP_SIZE) / SAMPLE_RATE);
        });
    });

    describe('hasSpeechInRange', () => {
        it('should return false when no speech above threshold', () => {
            buffer.writeBatch([0.1, 0.2, 0.3]);
            expect(buffer.hasSpeechInRange(0, HOP_SIZE * 3, 0.5)).toBe(false);
        });

        it('should return true when any entry exceeds threshold', () => {
            buffer.write(0.2);
            buffer.write(0.6);
            buffer.write(0.1);
            expect(buffer.hasSpeechInRange(0, HOP_SIZE * 3, 0.5)).toBe(true);
        });
    });

    describe('findSilenceBoundary', () => {
        it('should return minFrame when no silence found in range', () => {
            buffer.writeBatch([0.9, 0.8, 0.9]);
            const boundary = buffer.findSilenceBoundary(HOP_SIZE * 2, 0, 0.3);
            expect(boundary).toBe(0);
        });

        it('should return frame of first silence entry when scanning backward', () => {
            buffer.write(0.9);
            buffer.write(0.9);
            buffer.write(0.2);
            buffer.write(0.1);
            const boundary = buffer.findSilenceBoundary(2 * HOP_SIZE + 1, 0, 0.3);
            expect(boundary).toBe(2 * HOP_SIZE);
        });
    });

    describe('getCurrentIndex and getBaseEntry', () => {
        it('should report current index and base entry', () => {
            expect(buffer.getCurrentIndex()).toBe(0);
            expect(buffer.getBaseEntry()).toBe(0);
            buffer.write(0.5);
            expect(buffer.getCurrentIndex()).toBe(1);
            expect(buffer.getBaseEntry()).toBe(0);
        });
    });

    describe('getCurrentFrame', () => {
        it('should return global frame of latest entry', () => {
            buffer.write(0.5);
            buffer.write(0.5);
            expect(buffer.getCurrentFrame()).toBe(2 * HOP_SIZE);
        });
    });

    describe('reset', () => {
        it('should clear buffer and reset index', () => {
            buffer.writeBatch([0.5, 0.6]);
            buffer.reset();
            expect(buffer.getCurrentIndex()).toBe(0);
            expect(buffer.readForFrameRange(0, HOP_SIZE * 2)).toEqual(new Float32Array(0));
        });
    });
});
