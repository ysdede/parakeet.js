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
## 2024-12-05 - Avoid Set instantiation in hot inference loops
Learning: In V8 hot loops, tracking a very small collection of items (e.g., 3-5 tensors during disposal) with an `Array` and `.includes()` is significantly faster (~1.7x) than using a `Set`, as it avoids instantiation overhead and hashing costs. Additionally, `Object.values()` adds unnecessary array allocation overhead compared to `for...in`.
Action: Prefer tracking small collections with arrays and `includes()` over `Set`, and `for...in` over `Object.keys/values` in extremely hot model inference paths where properties are few.
