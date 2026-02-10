/**
 * VADRingBuffer stores per-frame speech probabilities in a circular buffer,
 * synchronized with the audio RingBuffer via global frame offsets.
 *
 * Each VAD probability covers `hopSize` audio frames (e.g., 512 frames = 32ms at 16kHz).
 * VAD probability at index i corresponds to audio frames [i * hopSize, (i+1) * hopSize).
 *
 * Ported from zdasr-main/src/zdasr/ring_buffer.py (VAD support).
 */
export class VADRingBuffer {
    /** Number of audio frames per VAD probability entry */
    readonly hopSize: number;
    /** Sample rate for time conversions */
    readonly sampleRate: number;

    private readonly maxEntries: number;
    private buffer: Float32Array;
    private globalIndex: number = 0; // Next VAD entry to be written (global)

    /**
     * @param sampleRate - Audio sample rate in Hz
     * @param durationSeconds - Maximum buffer duration in seconds
     * @param hopSize - Number of audio frames per VAD probability (default: 512 for Silero at 16kHz)
     */
    constructor(sampleRate: number, durationSeconds: number, hopSize: number = 512) {
        this.sampleRate = sampleRate;
        this.hopSize = hopSize;
        this.maxEntries = Math.ceil((sampleRate * durationSeconds) / hopSize);
        this.buffer = new Float32Array(this.maxEntries);
    }

    /**
     * Write one or more VAD probabilities.
     * Each probability corresponds to hopSize audio frames.
     */
    write(probability: number): void {
        const writePos = this.globalIndex % this.maxEntries;
        this.buffer[writePos] = probability;
        this.globalIndex++;
    }

    /**
     * Write multiple VAD probabilities at once.
     */
    writeBatch(probabilities: Float32Array | number[]): void {
        for (let i = 0; i < probabilities.length; i++) {
            this.write(probabilities[i]);
        }
    }

    /**
     * Read VAD probabilities for a range of audio frames.
     *
     * @param startFrame - Start audio frame (global offset, inclusive)
     * @param endFrame - End audio frame (global offset, exclusive)
     * @returns Float32Array of VAD probabilities covering the range
     */
    readForFrameRange(startFrame: number, endFrame: number): Float32Array {
        if (endFrame <= startFrame) return new Float32Array(0);

        const startEntry = Math.floor(startFrame / this.hopSize);
        const endEntry = Math.ceil(endFrame / this.hopSize);

        const baseEntry = this.getBaseEntry();
        const clampedStart = Math.max(startEntry, baseEntry);
        const clampedEnd = Math.min(endEntry, this.globalIndex);

        if (clampedEnd <= clampedStart) return new Float32Array(0);

        const length = clampedEnd - clampedStart;
        const result = new Float32Array(length);

        for (let i = 0; i < length; i++) {
            const readPos = (clampedStart + i) % this.maxEntries;
            result[i] = this.buffer[readPos];
        }

        return result;
    }

    /**
     * Get the duration of trailing silence (in seconds) from the current position.
     * Scans backward from the latest entry until a probability >= threshold is found.
     *
     * @param threshold - Probability threshold for speech (default: 0.5)
     * @returns Duration of trailing silence in seconds
     */
    getSilenceTailDuration(threshold: number = 0.5): number {
        if (this.globalIndex === 0) return 0;

        let silentEntries = 0;
        const baseEntry = this.getBaseEntry();

        for (let i = this.globalIndex - 1; i >= baseEntry; i--) {
            const readPos = i % this.maxEntries;
            if (this.buffer[readPos] >= threshold) {
                break;
            }
            silentEntries++;
        }

        return (silentEntries * this.hopSize) / this.sampleRate;
    }

    /**
     * Check if there is any speech in a frame range.
     *
     * @param startFrame - Start audio frame (global offset, inclusive)
     * @param endFrame - End audio frame (global offset, exclusive)
     * @param threshold - Probability threshold for speech (default: 0.5)
     * @returns true if any VAD entry in the range exceeds the threshold
     */
    hasSpeechInRange(startFrame: number, endFrame: number, threshold: number = 0.5): boolean {
        const probs = this.readForFrameRange(startFrame, endFrame);
        for (let i = 0; i < probs.length; i++) {
            if (probs[i] >= threshold) return true;
        }
        return false;
    }

    /**
     * Find a silence boundary (VAD probability below threshold) by scanning backward
     * from a given frame. Used by WindowBuilder to align window start to silence.
     *
     * @param fromFrame - Frame to start scanning backward from
     * @param minFrame - Don't scan past this frame
     * @param threshold - VAD threshold below which is considered silence (default: 0.3)
     * @returns Frame offset of the silence boundary, or minFrame if no silence found
     */
    findSilenceBoundary(fromFrame: number, minFrame: number, threshold: number = 0.3): number {
        const fromEntry = Math.floor(fromFrame / this.hopSize);
        const minEntry = Math.floor(minFrame / this.hopSize);
        const baseEntry = this.getBaseEntry();
        const clampedMin = Math.max(minEntry, baseEntry);

        for (let i = fromEntry; i >= clampedMin; i--) {
            const readPos = i % this.maxEntries;
            if (this.buffer[readPos] < threshold) {
                return i * this.hopSize;
            }
        }

        return minFrame;
    }

    /**
     * Get the current global index (next entry to write).
     */
    getCurrentIndex(): number {
        return this.globalIndex;
    }

    /**
     * Get the oldest available entry index.
     */
    getBaseEntry(): number {
        return Math.max(0, this.globalIndex - this.maxEntries);
    }

    /**
     * Get the global audio frame corresponding to the latest VAD entry.
     */
    getCurrentFrame(): number {
        return this.globalIndex * this.hopSize;
    }

    /**
     * Reset the buffer.
     */
    reset(): void {
        this.globalIndex = 0;
        this.buffer.fill(0);
    }
}
