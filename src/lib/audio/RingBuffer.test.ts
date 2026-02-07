import { describe, it, expect, beforeEach } from 'vitest';
import { RingBuffer } from './RingBuffer';

describe('RingBuffer', () => {
    let ringBuffer: RingBuffer;
    const SAMPLE_RATE = 16000;
    const DURATION_SECONDS = 1; // 1 second buffer for easy calculations
    const MAX_FRAMES = SAMPLE_RATE * DURATION_SECONDS;

    beforeEach(() => {
        ringBuffer = new RingBuffer(SAMPLE_RATE, DURATION_SECONDS);
    });

    describe('Initialization', () => {
        it('should initialize with correct parameters', () => {
            expect(ringBuffer.sampleRate).toBe(SAMPLE_RATE);
            expect(ringBuffer.maxFrames).toBe(MAX_FRAMES);
            expect(ringBuffer.getSize()).toBe(MAX_FRAMES);
            expect(ringBuffer.getCurrentFrame()).toBe(0);
            expect(ringBuffer.getFillCount()).toBe(0);
        });

        it('should calculate maxFrames based on duration', () => {
            const rb = new RingBuffer(8000, 0.5);
            expect(rb.maxFrames).toBe(4000);
        });
    });

    describe('Writing Data', () => {
        it('should write data correctly when buffer is empty', () => {
            const chunk = new Float32Array([1, 2, 3]);
            ringBuffer.write(chunk);

            expect(ringBuffer.getCurrentFrame()).toBe(3);
            expect(ringBuffer.getFillCount()).toBe(3);

            const readData = ringBuffer.read(0, 3);
            expect(readData).toEqual(chunk);
        });

        it('should append data correctly', () => {
            const chunk1 = new Float32Array([1, 2]);
            const chunk2 = new Float32Array([3, 4]);

            ringBuffer.write(chunk1);
            ringBuffer.write(chunk2);

            expect(ringBuffer.getCurrentFrame()).toBe(4);
            const readData = ringBuffer.read(0, 4);
            expect(readData).toEqual(new Float32Array([1, 2, 3, 4]));
        });

        it('should handle wrap-around correctly', () => {
            // Fill buffer almost to the end
            const initialFill = new Float32Array(MAX_FRAMES - 2);
            initialFill.fill(0.5);
            ringBuffer.write(initialFill);

            // Write a chunk that wraps around
            const chunk = new Float32Array([1, 2, 3, 4]);
            ringBuffer.write(chunk);

            expect(ringBuffer.getCurrentFrame()).toBe(MAX_FRAMES - 2 + 4);

            // Read the wrapped chunk
            // Start reading from where we wrote the chunk
            const startFrame = MAX_FRAMES - 2;
            const endFrame = startFrame + 4;
            const readData = ringBuffer.read(startFrame, endFrame);

            expect(readData).toEqual(chunk);
        });

        it('should handle chunk larger than buffer size', () => {
            const largeChunk = new Float32Array(MAX_FRAMES + 10);
            for(let i = 0; i < largeChunk.length; i++) {
                largeChunk[i] = i;
            }

            ringBuffer.write(largeChunk);

            expect(ringBuffer.getCurrentFrame()).toBe(MAX_FRAMES + 10);
            expect(ringBuffer.getFillCount()).toBe(MAX_FRAMES);

            // Should contain the last MAX_FRAMES of the large chunk
            const expectedData = largeChunk.subarray(10);
            // The buffer now holds frames from 10 to MAX_FRAMES + 10
            const readData = ringBuffer.read(10, MAX_FRAMES + 10);

            expect(readData).toEqual(expectedData);
        });
    });

    describe('Reading Data', () => {
        it('should read valid range correctly', () => {
            const chunk = new Float32Array([1, 2, 3, 4, 5]);
            ringBuffer.write(chunk);

            const readData = ringBuffer.read(1, 4); // indices 1, 2, 3
            expect(readData).toEqual(new Float32Array([2, 3, 4]));
        });

        it('should return empty array when startFrame >= endFrame', () => {
            const chunk = new Float32Array([1, 2, 3]);
            ringBuffer.write(chunk);

            expect(ringBuffer.read(1, 1).length).toBe(0);
            expect(ringBuffer.read(2, 1).length).toBe(0);
        });

        it('should throw RangeError when startFrame is negative', () => {
            expect(() => ringBuffer.read(-1, 5)).toThrow(RangeError);
        });

        it('should throw RangeError when reading overwritten data', () => {
            // Write more than capacity
            const chunk = new Float32Array(MAX_FRAMES + 10);
            ringBuffer.write(chunk);

            // Oldest available frame is 10
            // Trying to read frame 5 should fail
            expect(() => ringBuffer.read(5, 15)).toThrow(RangeError);
        });

        it('should throw RangeError when reading future data', () => {
            const chunk = new Float32Array([1, 2, 3]);
            ringBuffer.write(chunk);

            // Current frame is 3. Requesting up to 5 should fail.
            expect(() => ringBuffer.read(0, 5)).toThrow(RangeError);
        });

        it('should handle reading across wrap-around point', () => {
             // Fill buffer almost to the end
            const initialFill = new Float32Array(MAX_FRAMES - 2);
            for (let i = 0; i < MAX_FRAMES - 2; i++) initialFill[i] = i;
            ringBuffer.write(initialFill);

            // Write more to wrap around
            const chunk = new Float32Array([100, 101, 102, 103]);
            ringBuffer.write(chunk);

            // Buffer now has:
            // [ ... (MAX_FRAMES-2 items), 100, 101, 102, 103 ] logically
            // Physically:
            // Indices [MAX_FRAMES-2, MAX_FRAMES-1] have [100, 101]
            // Indices [0, 1] have [102, 103]

            // Read across the boundary
            const startFrame = MAX_FRAMES - 3; // One before the new chunk
            const endFrame = MAX_FRAMES + 1;   // Into the wrapped part

            const readData = ringBuffer.read(startFrame, endFrame);
            // Expected: [last of initial, 100, 101, 102]
            const expected = new Float32Array([
                initialFill[initialFill.length - 1],
                100, 101, 102
            ]);

            expect(readData).toEqual(expected);
        });
    });

    describe('Helper Methods', () => {
        it('getCurrentTime should return correct time in seconds', () => {
            // 1 second buffer
            const chunk = new Float32Array(SAMPLE_RATE / 2); // 0.5 seconds
            ringBuffer.write(chunk);

            expect(ringBuffer.getCurrentTime()).toBe(0.5);
        });

        it('getBaseFrameOffset should return 0 when not full', () => {
            const chunk = new Float32Array(100);
            ringBuffer.write(chunk);
            expect(ringBuffer.getBaseFrameOffset()).toBe(0);
        });

        it('getBaseFrameOffset should update when overwritten', () => {
             const chunk = new Float32Array(MAX_FRAMES + 50);
             ringBuffer.write(chunk);
             expect(ringBuffer.getBaseFrameOffset()).toBe(50);
        });

        it('reset should clear buffer and reset counters', () => {
            const chunk = new Float32Array([1, 2, 3]);
            ringBuffer.write(chunk);

            ringBuffer.reset();

            expect(ringBuffer.getCurrentFrame()).toBe(0);
            expect(ringBuffer.getFillCount()).toBe(0);
            expect(ringBuffer.read(0, 0).length).toBe(0); // Check consistency

            // Verify buffer content is cleared (or at least pointer is reset)
            // Writing new data should start from 0
            const newChunk = new Float32Array([9, 9]);
            ringBuffer.write(newChunk);
            expect(ringBuffer.read(0, 2)).toEqual(newChunk);
        });
    });
});
