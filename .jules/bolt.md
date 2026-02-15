## 2026-02-17 - Sparse Mel Filterbank Optimization
**Learning:** `JsPreprocessor` was using dense matrix multiplication for mel filters, which are ~98% sparse. This bottlenecked the audio pipeline significantly (dominant cost in preprocessing).
**Action:** Always check if linear algebra operations involve sparse matrices (like filterbanks) and optimize loops to skip zero values.
