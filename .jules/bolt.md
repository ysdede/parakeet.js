## 2026-02-20 - incremental-mel-allocations
Learning: IncrementalMelProcessor was allocating new Float32Arrays for every chunk (rawMel and features), causing GC pressure in streaming. Double-buffering rawMel handles variable frame counts safely while enabling reuse.
Action: Consider extending buffer reuse to ParakeetModel's encoder outputs and other intermediate tensors if memory profiling shows further GC hotspots.

## 2026-02-22 - JsPreprocessor Buffer Pooling
Learning: Avoiding per-call allocation of `preemph` (Float32Array) and `padded` (Float64Array) in `JsPreprocessor.computeRawMel` improves performance by ~11% (17.5ms -> 15.6ms per 5s audio). Reusing a single `_paddedBuffer` and computing pre-emphasis in-place eliminates significant allocation overhead in the hot path.
Action: Check if `normalizeFeatures` can also benefit from better buffer reuse or in-place modification, though it already supports an optional `outBuffer`.
