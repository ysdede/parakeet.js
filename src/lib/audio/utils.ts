/**
 * Simple linear interpolation resampler for downsampling audio.
 * Good enough for speech recognition where we're going 48kHz -> 16kHz.
 */
export function resampleLinear(input: Float32Array, fromRate: number, toRate: number): Float32Array {
    if (fromRate === toRate) return input;

    const ratio = fromRate / toRate;
    const outputLength = Math.floor(input.length / ratio);
    const output = new Float32Array(outputLength);

    for (let i = 0; i < outputLength; i++) {
        const srcIndex = i * ratio;
        const srcIndexFloor = Math.floor(srcIndex);
        const srcIndexCeil = Math.min(srcIndexFloor + 1, input.length - 1);
        const t = srcIndex - srcIndexFloor;

        // Linear interpolation
        output[i] = input[srcIndexFloor] * (1 - t) + input[srcIndexCeil] * t;
    }

    return output;
}
