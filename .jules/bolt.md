## 2024-05-14 - Transpose Optimization in V8
Learning: Replacing a cache-blocked matrix transpose implementation (which optimizes memory access patterns) with an 8x unrolled sequential write loop (which reduces JIT loop overhead) yielded roughly a 50% performance improvement in `src/parakeet.js`.
Action: When transposing small to medium matrices in performance-critical JavaScript loops (e.g., audio feature arrays), prefer unrolling inner loops over complex block-tiling strategies, as V8's loop overhead often outweighs the cache locality benefits of blocking for these specific workloads.
