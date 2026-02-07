/**
 * WindowBuilder.ts
 *
 * Cursor-based dynamic window construction for transcription.
 * Ported from zdasr-main/src/zdasr/window_cursor.py.
 *
 * Instead of a fixed 5-second window that fires every 1.5 seconds,
 * this builder creates windows that:
 * - Start at the mature cursor (end of last finalized sentence)
 * - Extend to the current audio position
 * - Respect min/max duration constraints
 * - Optionally use VAD data to align boundaries to silence
 * - Never re-transcribe audio before the mature cursor
 */

import type { IRingBuffer } from '../audio/types';
import type { VADRingBuffer } from '../vad/VADRingBuffer';

/** The result of building a transcription window */
export interface TranscriptionWindow {
    /** Start frame in global offset */
    startFrame: number;
    /** End frame in global offset */
    endFrame: number;
    /** Duration of the window in seconds */
    durationSeconds: number;
    /** Whether this is an initial (pre-first-sentence) window */
    isInitial: boolean;
}

/** Configuration for WindowBuilder */
export interface WindowBuilderConfig {
    /** Audio sample rate in Hz (default: 16000) */
    sampleRate: number;
    /** Minimum window duration in seconds (default: 3.0) */
    minDurationSec: number;
    /** Maximum window duration in seconds (default: 30.0) */
    maxDurationSec: number;
    /** Min duration before first sentence (default: 1.5) */
    minInitialDurationSec: number;
    /** Max sentence end markers to keep (default: 4) */
    maxSentences: number;
    /** Whether to use VAD for boundary refinement (default: true) */
    useVadBoundaries: boolean;
    /** VAD silence threshold (default: 0.3) */
    vadSilenceThreshold: number;
    /** Enable debug logging (default: false) */
    debug: boolean;
}

export class WindowBuilder {
    private config: WindowBuilderConfig;
    private ringBuffer: IRingBuffer;
    private vadBuffer: VADRingBuffer | null;

    // State
    private sentenceEnds: number[] = [];
    private matureCursorFrame: number = 0;
    private firstSentenceReceived: boolean = false;

    constructor(
        ringBuffer: IRingBuffer,
        vadBuffer: VADRingBuffer | null = null,
        config: Partial<WindowBuilderConfig> = {}
    ) {
        this.ringBuffer = ringBuffer;
        this.vadBuffer = vadBuffer;

        this.config = {
            sampleRate: 16000,
            minDurationSec: 3.0,
            maxDurationSec: 30.0,
            minInitialDurationSec: 1.5,
            maxSentences: 4,
            useVadBoundaries: true,
            vadSilenceThreshold: 0.3,
            debug: false,
            ...config,
        };
    }

    // ---- Sentence boundary bookkeeping ----

    /**
     * Record the end frame of a fully finalized sentence.
     */
    markSentenceEnd(frameIdx: number): void {
        this.sentenceEnds.push(frameIdx);
        // Keep only the most recent N
        if (this.sentenceEnds.length > this.config.maxSentences) {
            this.sentenceEnds = this.sentenceEnds.slice(-this.config.maxSentences);
        }

        if (!this.firstSentenceReceived) {
            this.firstSentenceReceived = true;
            if (this.config.debug) {
                console.log(`[WindowBuilder] First sentence received at frame ${frameIdx}`);
            }
        }
    }

    // ---- Mature cursor management ----

    /**
     * Advance the mature cursor to a finalized sentence boundary.
     * The mature cursor marks where transcription is considered stable.
     */
    advanceMatureCursor(frameIdx: number): void {
        if (frameIdx > this.matureCursorFrame) {
            const oldCursor = this.matureCursorFrame;
            this.matureCursorFrame = frameIdx;

            if (this.config.debug) {
                const cursorTime = frameIdx / this.config.sampleRate;
                console.log(
                    `[WindowBuilder] Cursor advanced from frame ${oldCursor} to ${frameIdx} (${cursorTime.toFixed(2)}s)`
                );
            }

            if (!this.firstSentenceReceived) {
                this.firstSentenceReceived = true;
            }
        }
    }

    /**
     * Advance the mature cursor using a time value (seconds).
     * Converts to frame offset based on sample rate.
     */
    advanceMatureCursorByTime(timeSec: number): void {
        const frameIdx = Math.round(timeSec * this.config.sampleRate);
        this.advanceMatureCursor(frameIdx);
    }

    /**
     * Get current mature cursor position in frames.
     */
    getMatureCursorFrame(): number {
        return this.matureCursorFrame;
    }

    /**
     * Get current mature cursor position in seconds.
     */
    getMatureCursorTime(): number {
        return this.matureCursorFrame / this.config.sampleRate;
    }

    // ---- Window building ----

    /**
     * Build a transcription window from the mature cursor to the current buffer head.
     *
     * Returns null if:
     * - No data in the buffer
     * - Not enough audio for minimum duration
     * - Start frame >= end frame
     *
     * The caller should use the returned startFrame/endFrame to extract audio
     * from the ring buffer and request mel features from the mel worker.
     */
    buildWindow(): TranscriptionWindow | null {
        const endFrame = this.ringBuffer.getCurrentFrame();
        const baseFrame = this.ringBuffer.getBaseFrameOffset();

        if (endFrame === baseFrame) {
            return null; // no data
        }

        const availableFrames = endFrame - baseFrame;

        // ---- Initial mode (before first sentence) ----
        if (!this.firstSentenceReceived) {
            const minInitialFrames = Math.round(
                this.config.minInitialDurationSec * this.config.sampleRate
            );

            if (availableFrames < minInitialFrames) {
                if (this.config.debug) {
                    const availDur = availableFrames / this.config.sampleRate;
                    console.log(
                        `[WindowBuilder] Initial mode: waiting (${availDur.toFixed(2)}s / ${this.config.minInitialDurationSec}s)`
                    );
                }
                return null;
            }

            // Start from base, up to max duration
            const maxFrames = Math.round(this.config.maxDurationSec * this.config.sampleRate);
            const clippedEnd = Math.min(endFrame, baseFrame + maxFrames);
            const duration = (clippedEnd - baseFrame) / this.config.sampleRate;

            if (this.config.debug) {
                console.log(
                    `[WindowBuilder] Initial window [${baseFrame}:${clippedEnd}] (${duration.toFixed(2)}s)`
                );
            }

            return {
                startFrame: baseFrame,
                endFrame: clippedEnd,
                durationSeconds: duration,
                isInitial: true,
            };
        }

        // ---- Normal mode (after first sentence) ----

        // Determine start frame from mature cursor or sentence ends
        let startFrame: number;
        if (this.matureCursorFrame > 0) {
            startFrame = this.matureCursorFrame;
        } else if (this.sentenceEnds.length >= 2) {
            startFrame = this.sentenceEnds[this.sentenceEnds.length - 2];
        } else if (this.sentenceEnds.length >= 1) {
            startFrame = this.sentenceEnds[0];
        } else {
            startFrame = baseFrame;
        }

        // Ensure start frame is within valid buffer range
        if (startFrame < baseFrame) {
            if (this.config.debug) {
                console.log(
                    `[WindowBuilder] Start frame ${startFrame} < base ${baseFrame}; clipping to base.`
                );
            }
            startFrame = baseFrame;
        }

        if (startFrame >= endFrame) {
            if (this.config.debug) {
                console.log('[WindowBuilder] Start frame >= end frame, nothing new to transcribe');
            }
            return null;
        }

        let windowFrames = endFrame - startFrame;

        // Enforce minimum duration (never extend backward past cursor)
        const minFrames = Math.round(this.config.minDurationSec * this.config.sampleRate);
        if (windowFrames < minFrames) {
            if (this.config.debug) {
                const dur = windowFrames / this.config.sampleRate;
                console.log(
                    `[WindowBuilder] Insufficient audio (${dur.toFixed(2)}s < ${this.config.minDurationSec}s). Waiting...`
                );
            }
            return null;
        }

        // Enforce maximum duration (keep newest audio)
        const maxFrames = Math.round(this.config.maxDurationSec * this.config.sampleRate);
        if (windowFrames > maxFrames) {
            const proposedStart = endFrame - maxFrames;
            if (proposedStart < this.matureCursorFrame) {
                startFrame = this.matureCursorFrame;
            } else {
                startFrame = proposedStart;
            }
            windowFrames = endFrame - startFrame;
        }

        // VAD boundary refinement: nudge start to a silence boundary
        if (this.config.useVadBoundaries && this.vadBuffer) {
            const searchEnd = Math.min(
                startFrame + Math.round(this.config.sampleRate * 0.5),
                endFrame
            );
            const vadStart = this.vadBuffer.findSilenceBoundary(
                searchEnd,
                startFrame,
                this.config.vadSilenceThreshold
            );

            if (vadStart > startFrame) {
                const newWindowFrames = endFrame - vadStart;
                const newDuration = newWindowFrames / this.config.sampleRate;

                if (newDuration >= this.config.minDurationSec) {
                    if (this.config.debug) {
                        console.log(
                            `[WindowBuilder] VAD adjusted start: ${startFrame} -> ${vadStart}`
                        );
                    }
                    startFrame = vadStart;
                    windowFrames = newWindowFrames;
                }
            }
        }

        // Final validation
        if (startFrame >= endFrame) {
            return null;
        }

        const durationSeconds = (endFrame - startFrame) / this.config.sampleRate;

        if (this.config.debug) {
            console.log(
                `[WindowBuilder] Window [${startFrame}:${endFrame}] duration=${durationSeconds.toFixed(2)}s cursor=${this.matureCursorFrame}`
            );
        }

        return {
            startFrame,
            endFrame,
            durationSeconds,
            isInitial: false,
        };
    }

    /**
     * Check if there is extended silence at the buffer tail (for flush decisions).
     */
    getSilenceTailDuration(): number {
        if (!this.vadBuffer) return 0;
        return this.vadBuffer.getSilenceTailDuration(this.config.vadSilenceThreshold);
    }

    /**
     * Check if there is speech in the current pending window.
     */
    hasSpeechInPendingWindow(): boolean {
        if (!this.vadBuffer) return true; // Assume speech if no VAD buffer

        const endFrame = this.ringBuffer.getCurrentFrame();
        const startFrame = this.matureCursorFrame > 0
            ? this.matureCursorFrame
            : this.ringBuffer.getBaseFrameOffset();

        if (startFrame >= endFrame) return false;

        return this.vadBuffer.hasSpeechInRange(startFrame, endFrame, this.config.vadSilenceThreshold);
    }

    /**
     * Reset all internal state.
     */
    reset(): void {
        this.sentenceEnds = [];
        this.matureCursorFrame = 0;
        this.firstSentenceReceived = false;

        if (this.config.debug) {
            console.log('[WindowBuilder] Reset');
        }
    }

    /**
     * Get the current configuration.
     */
    getConfig(): WindowBuilderConfig {
        return { ...this.config };
    }
}
