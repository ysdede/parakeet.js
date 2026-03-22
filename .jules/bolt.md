## 2024-05-22 - JS Loops vs TypedArray.set
Learning: Manual loops over TypedArrays in V8 are significantly slower (~10x) than `set` + `subarray` for bulk copies, even for moderate sizes (D=640).
Action: Prefer `set` + `subarray` for contiguous memory copies in hot loops.

## 2024-06-25 - Softmax math.exp unrolling
Learning: Unrolling the `Math.exp` accumulation loop (4x split variables) over the token logits (size 4097) in V8 provides a ~15% speedup by reducing loop maintenance overheads and increasing instruction level parallelism.
Action: Consider unrolling hot accumulation loops over TypedArrays where iteration count is high and bounds checking overhead is significant.

## 2024-11-20 - Unrolling Float32Array argmax
Learning: When finding the maximum value (argmax) in a large typed array like `Float32Array`, unrolling the loop 8x is significantly faster than using a simple `for` loop, yielding a ~2x performance speedup in the hot path.
Action: Apply loop unrolling for max reductions in high-frequency typed array operations.

## 2025-01-28 - Transpose optimization
Learning: In JavaScript/V8 engines running on flat TypedArrays, loop overhead often dominates cache locality benefits. A simple, unblocked `for` loop over `t` and `d` is faster than a tiled (blocked) approach for transposing encoder outputs.
Action: Prefer simple loops over blocked/tiled approaches for matrix operations on TypedArrays in JavaScript unless dealing with extremely large sizes where cache misses become the primary bottleneck.
