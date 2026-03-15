## 2024-05-22 - JS Loops vs TypedArray.set
Learning: Manual loops over TypedArrays in V8 are significantly slower (~10x) than `set` + `subarray` for bulk copies, even for moderate sizes (D=640).
Action: Prefer `set` + `subarray` for contiguous memory copies in hot loops.

## 2024-06-25 - Softmax math.exp unrolling
Learning: Unrolling the `Math.exp` accumulation loop (4x split variables) over the token logits (size 4097) in V8 provides a ~15% speedup by reducing loop maintenance overheads and increasing instruction level parallelism.
Action: Consider unrolling hot accumulation loops over TypedArrays where iteration count is high and bounds checking overhead is significant.

## 2024-11-20 - Unrolling Float32Array argmax
Learning: When finding the maximum value (argmax) in a large typed array like `Float32Array`, unrolling the loop 8x is significantly faster than using a simple `for` loop, yielding a ~2x performance speedup in the hot path.
Action: Apply loop unrolling for max reductions in high-frequency typed array operations.

## 2024-11-20 - TypedArray Matrix Transpose Optimization
Learning: A simple nested loop prioritizing sequential writes (inner loop over `d` when writing to `t*D + d`) significantly outperforms complex cache-blocking techniques (like loop tiling) for TypedArrays in V8, yielding a ~30-40% speedup.
Action: Use simple sequential memory access patterns for TypedArray operations instead of theoretical cache optimizations.
