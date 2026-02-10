/**
 * Unit tests for WindowBuilder (v4 cursor-based dynamic window construction).
 *
 * WindowBuilder creates transcription windows from mature cursor to current buffer head,
 * with min/max duration, optional VAD boundary refinement, and sentence bookkeeping.
 *
 * Run: npm test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { WindowBuilder } from './WindowBuilder';
import type { IRingBuffer } from '../audio/types';
import { VADRingBuffer } from '../vad/VADRingBuffer';

function createMockRingBuffer(
    baseFrame: number,
    currentFrame: number,
    sampleRate: number = 16000
): IRingBuffer {
    return {
        sampleRate,
        maxFrames: 16000 * 120,
        write: () => {},
        read: () => new Float32Array(0),
        getCurrentFrame: () => currentFrame,
        getFillCount: () => Math.max(0, currentFrame - baseFrame),
        getSize: () => 16000 * 120,
        getCurrentTime: () => currentFrame / sampleRate,
        getBaseFrameOffset: () => baseFrame,
        reset: () => {},
    };
}

describe('WindowBuilder', () => {
    const sampleRate = 16000;

    describe('initial mode (before first sentence)', () => {
        it('should return null when not enough audio for minInitialDurationSec', () => {
            const ring = createMockRingBuffer(0, sampleRate * 0.5);
            const builder = new WindowBuilder(ring, null, {
                sampleRate,
                minDurationSec: 3,
                maxDurationSec: 30,
                minInitialDurationSec: 1.5,
            });
            expect(builder.buildWindow()).toBeNull();
        });

        it('should return initial window when enough audio', () => {
            const ring = createMockRingBuffer(0, sampleRate * 2);
            const builder = new WindowBuilder(ring, null, {
                sampleRate,
                minDurationSec: 3,
                maxDurationSec: 30,
                minInitialDurationSec: 1.5,
            });
            const win = builder.buildWindow();
            expect(win).not.toBeNull();
            expect(win!.isInitial).toBe(true);
            expect(win!.startFrame).toBe(0);
            expect(win!.durationSeconds).toBeGreaterThanOrEqual(1.5);
        });
    });

    describe('mature cursor and sentence bookkeeping', () => {
        it('should advance mature cursor and report position', () => {
            const ring = createMockRingBuffer(0, sampleRate * 5);
            const builder = new WindowBuilder(ring, null, { sampleRate });
            expect(builder.getMatureCursorFrame()).toBe(0);
            builder.advanceMatureCursor(sampleRate * 2);
            expect(builder.getMatureCursorFrame()).toBe(sampleRate * 2);
            expect(builder.getMatureCursorTime()).toBe(2);
        });

        it('should record sentence ends and cap at maxSentences', () => {
            const ring = createMockRingBuffer(0, sampleRate * 10);
            const builder = new WindowBuilder(ring, null, {
                sampleRate,
                maxSentences: 2,
            });
            builder.markSentenceEnd(1000);
            builder.markSentenceEnd(2000);
            builder.markSentenceEnd(3000);
            builder.advanceMatureCursor(2000);
            const win = builder.buildWindow();
            expect(win).not.toBeNull();
            expect(win!.startFrame).toBe(2000);
        });
    });

    describe('normal mode (after first sentence)', () => {
        it('should return null when start >= end', () => {
            const ring = createMockRingBuffer(0, sampleRate);
            const builder = new WindowBuilder(ring, null, { sampleRate });
            builder.markSentenceEnd(sampleRate);
            builder.advanceMatureCursor(sampleRate);
            expect(builder.buildWindow()).toBeNull();
        });

        it('should enforce min duration and return null when insufficient', () => {
            const ring = createMockRingBuffer(0, sampleRate * 4);
            const builder = new WindowBuilder(ring, null, {
                sampleRate,
                minDurationSec: 3,
                maxDurationSec: 30,
            });
            builder.markSentenceEnd(sampleRate);
            builder.advanceMatureCursor(sampleRate);
            const win = builder.buildWindow();
            expect(win).not.toBeNull();
            expect(win!.durationSeconds).toBeGreaterThanOrEqual(3);
        });
    });

    describe('hasSpeechInPendingWindow', () => {
        it('should return true when vadBuffer is null (no blocking)', () => {
            const ring = createMockRingBuffer(0, sampleRate * 2);
            const builder = new WindowBuilder(ring, null, { sampleRate });
            expect(builder.hasSpeechInPendingWindow()).toBe(true);
        });

        it('should use VAD when vadBuffer is provided', () => {
            const ring = createMockRingBuffer(0, sampleRate * 2);
            const vad = new VADRingBuffer(sampleRate, 60, 512);
            vad.writeBatch([0.9, 0.8]);
            const builder = new WindowBuilder(ring, vad, { sampleRate });
            expect(builder.hasSpeechInPendingWindow()).toBe(true);
        });
    });

    describe('getSilenceTailDuration', () => {
        it('should return 0 when vadBuffer is null', () => {
            const ring = createMockRingBuffer(0, sampleRate * 2);
            const builder = new WindowBuilder(ring, null, { sampleRate });
            expect(builder.getSilenceTailDuration()).toBe(0);
        });

        it('should delegate to vadBuffer when provided', () => {
            const ring = createMockRingBuffer(0, sampleRate * 2);
            const vad = new VADRingBuffer(sampleRate, 60, 512);
            vad.write(0.1);
            vad.write(0.1);
            const builder = new WindowBuilder(ring, vad, { sampleRate, vadSilenceThreshold: 0.5 });
            const duration = builder.getSilenceTailDuration();
            expect(duration).toBeGreaterThan(0);
        });
    });

    describe('reset', () => {
        it('should clear sentence ends and mature cursor', () => {
            const ring = createMockRingBuffer(0, sampleRate * 5);
            const builder = new WindowBuilder(ring, null, { sampleRate });
            builder.markSentenceEnd(1000);
            builder.advanceMatureCursor(1000);
            builder.reset();
            expect(builder.getMatureCursorFrame()).toBe(0);
        });
    });
});
