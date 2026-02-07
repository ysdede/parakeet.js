import { IRingBuffer } from './types';

/**
 * Fixed-size circular buffer for PCM audio samples.
 * Uses global frame offsets for absolute addressing.
 */
export class RingBuffer implements IRingBuffer {
    readonly sampleRate: number;
    readonly maxFrames: number;
    private buffer: Float32Array;
    private currentFrame: number = 0; // The next frame to be written (global)

    constructor(sampleRate: number, durationSeconds: number) {
        this.sampleRate = sampleRate;
        this.maxFrames = Math.floor(sampleRate * durationSeconds);
        this.buffer = new Float32Array(this.maxFrames);
    }

    /**
     * Append PCM frames to the buffer.
     */
    write(chunk: Float32Array): void {
        let chunkLength = chunk.length;
        let dataToWrite = chunk;

        // If chunk is larger than buffer (unlikely but handle it), only take the end
        if (chunkLength > this.maxFrames) {
            const start = chunkLength - this.maxFrames;
            dataToWrite = chunk.subarray(start);
            // Advance frame counter for the skipped part
            this.currentFrame += start;
            // Now we only write maxFrames
            chunkLength = this.maxFrames;
        }

        const writePos = this.currentFrame % this.maxFrames;
        const remainingSpace = this.maxFrames - writePos;

        if (chunkLength <= remainingSpace) {
            // Single operation
            this.buffer.set(dataToWrite, writePos);
        } else {
            // Wrap around
            this.buffer.set(dataToWrite.subarray(0, remainingSpace), writePos);
            this.buffer.set(dataToWrite.subarray(remainingSpace), 0);
        }

        this.currentFrame += chunkLength;
    }

    /**
     * Read samples from [startFrame, endFrame).
     * @throws RangeError if data has been overwritten by circular buffer.
     */
    read(startFrame: number, endFrame: number): Float32Array {
        if (startFrame < 0) throw new RangeError('startFrame must be non-negative');
        if (endFrame <= startFrame) return new Float32Array(0);

        const baseFrame = this.getBaseFrameOffset();
        if (startFrame < baseFrame) {
            throw new RangeError(
                `Requested frame ${startFrame} has been overwritten. Oldest available: ${baseFrame}`
            );
        }

        if (endFrame > this.currentFrame) {
            throw new RangeError(
                `Requested frame ${endFrame} is in the future. Latest available: ${this.currentFrame}`
            );
        }

        const length = endFrame - startFrame;
        const result = new Float32Array(length);

        const readPos = startFrame % this.maxFrames;
        const remainingAtEnd = this.maxFrames - readPos;

        if (length <= remainingAtEnd) {
            result.set(this.buffer.subarray(readPos, readPos + length));
        } else {
            result.set(this.buffer.subarray(readPos, this.maxFrames));
            result.set(this.buffer.subarray(0, length - remainingAtEnd), remainingAtEnd);
        }

        return result;
    }

    /**
     * Read samples from [startFrame, endFrame) into a caller-supplied buffer.
     * Zero-allocation: writes into `dest` starting at offset 0.
     * Returns the number of samples actually written (may be less than
     * dest.length if the requested range is shorter).
     * @throws RangeError if data has been overwritten or is in the future.
     */
    readInto(startFrame: number, endFrame: number, dest: Float32Array): number {
        if (startFrame < 0) throw new RangeError('startFrame must be non-negative');
        if (endFrame <= startFrame) return 0;

        const baseFrame = this.getBaseFrameOffset();
        if (startFrame < baseFrame) {
            throw new RangeError(
                `Requested frame ${startFrame} has been overwritten. Oldest available: ${baseFrame}`
            );
        }

        if (endFrame > this.currentFrame) {
            throw new RangeError(
                `Requested frame ${endFrame} is in the future. Latest available: ${this.currentFrame}`
            );
        }

        const length = endFrame - startFrame;
        const readPos = startFrame % this.maxFrames;
        const remainingAtEnd = this.maxFrames - readPos;

        if (length <= remainingAtEnd) {
            dest.set(this.buffer.subarray(readPos, readPos + length));
        } else {
            dest.set(this.buffer.subarray(readPos, this.maxFrames));
            dest.set(this.buffer.subarray(0, length - remainingAtEnd), remainingAtEnd);
        }

        return length;
    }

    getCurrentFrame(): number {
        return this.currentFrame;
    }

    getFillCount(): number {
        return Math.min(this.currentFrame, this.maxFrames);
    }

    getSize(): number {
        return this.maxFrames;
    }

    getCurrentTime(): number {
        return this.currentFrame / this.sampleRate;
    }

    getBaseFrameOffset(): number {
        return Math.max(0, this.currentFrame - this.maxFrames);
    }

    reset(): void {
        this.currentFrame = 0;
        this.buffer.fill(0);
    }
}
