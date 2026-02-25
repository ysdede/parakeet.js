## 2024-05-22 - Argmax Optimization in Decoding Loop
Learning: Pure JS implementation of `argmax` on `Float32Array` can be significantly optimized by avoiding division inside the loop (~4x speedup in micro-benchmark).
Action: Prefer loop-invariant code motion for mathematical operations in hot loops, especially when iterating over large arrays (vocab size).
