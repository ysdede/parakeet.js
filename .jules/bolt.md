## 2024-05-22 - JS Loops vs TypedArray.set
Learning: Manual loops over TypedArrays in V8 are significantly slower (~10x) than `set` + `subarray` for bulk copies, even for moderate sizes (D=640).
Action: Prefer `set` + `subarray` for contiguous memory copies in hot loops.

## 2024-06-25 - Softmax math.exp unrolling
Learning: Unrolling the `Math.exp` accumulation loop (4x split variables) over the token logits (size 4097) in V8 provides a ~15% speedup by reducing loop maintenance overheads and increasing instruction level parallelism.
Action: Consider unrolling hot accumulation loops over TypedArrays where iteration count is high and bounds checking overhead is significant.

## 2024-11-20 - Unrolling Float32Array argmax
Learning: When finding the maximum value (argmax) in a large typed array like `Float32Array`, unrolling the loop 8x is significantly faster than using a simple `for` loop, yielding a ~2x performance speedup in the hot path.
Action: Apply loop unrolling for max reductions in high-frequency typed array operations.

## 2024-11-20 - Further Unrolling Float32Array argmax
Learning: When finding the maximum value (argmax) in a large typed array like `Float32Array`, reading array values into local variables (`v0` to `v7`) inside an unrolled loop before performing sequential comparisons gives an additional ~15-20% speedup compared to accessing the typed array directly in the unrolled loop's `if` statements. This reduces array access overhead and allows better V8 compiler optimizations.
Action: Apply local variable caching when unrolling hot loops over TypedArrays for value reads.
