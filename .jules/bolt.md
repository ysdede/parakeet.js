## 2024-05-22 - JS Loops vs TypedArray.set
Learning: Manual loops over TypedArrays in V8 are significantly slower (~10x) than `set` + `subarray` for bulk copies, even for moderate sizes (D=640).
Action: Prefer `set` + `subarray` for contiguous memory copies in hot loops.

## 2024-06-25 - Softmax math.exp unrolling
Learning: Unrolling the `Math.exp` accumulation loop (4x split variables) over the token logits (size 4097) in V8 provides a ~15% speedup by reducing loop maintenance overheads and increasing instruction level parallelism.
Action: Consider unrolling hot accumulation loops over TypedArrays where iteration count is high and bounds checking overhead is significant.

## 2024-11-20 - Unrolling Float32Array argmax
Learning: When finding the maximum value (argmax) in a large typed array like `Float32Array`, unrolling the loop 8x is significantly faster than using a simple `for` loop, yielding a ~2x performance speedup in the hot path.
Action: Apply loop unrolling for max reductions in high-frequency typed array operations.

## 2024-11-20 - Softmax math.exp 8x unrolling with local var cache
Learning: Unrolling the `Math.exp` accumulation loop to 8x and caching the multiplication `(tokenLogits[i] - maxLogit) * invTemp` into local variables before passing to `Math.exp` yields a measurable performance improvement (~4%) over the previous 4x unrolled implementation in the V8 engine, by reducing property access and allowing better instruction-level parallelism.
Action: Utilize 8x loop unrolling paired with local variable caching for tight floating-point accumulation loops over TypedArrays.

## 2024-11-20 - Unrolled Float32Array argmax uses direct access
Learning: Unlike heavy accumulation loops where caching variables helps, pure branch loops (like argmax) over TypedArrays in V8 are >10% faster using direct array access (e.g., `if (arr[i] > max)`) rather than reading values into local variables first, as direct access avoids forced assignment overhead on every iteration.
Action: For pure branch loops (no math/accumulation) over TypedArrays, unroll and use direct array access rather than caching elements to local variables.
