## 2024-05-22 - [Sparse Matrix Optimization]
**Learning:** The Slaney Mel filterbank is extremely sparse (~98.5% zeros). A naive implementation iterates `nMels * N_FREQ_BINS` (128 * 257 = 32,896) times per frame. By precomputing the start/end indices of non-zero values, we reduced the inner loop iterations to ~12 per mel bin, yielding a ~4.5x overall speedup for `JsPreprocessor` (77ms -> 17ms for 5s audio).
**Action:** Always check for sparsity in matrix operations, especially with filterbanks or kernels that have localized support.
