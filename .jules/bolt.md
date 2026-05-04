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

## 2024-11-20 - LCS DP array optimization with invariant hoisting
Learning: In the Longest Common Substring dynamic programming loop, hoisting the outer loop's array lookup (`X[i - 1]`) into a local variable (`const xi = X[i - 1]`) avoids repeatedly performing the array lookup and property access inside the inner loop, yielding a ~15% speedup in V8.
Action: Apply loop invariant code motion to hoist array element lookups out of inner loops when the value is constant for the duration of the inner loop.
