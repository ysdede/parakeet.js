## 2025-02-12 - Mel Filterbank Sparsity
**Learning:** The Slaney mel filterbank used in speech processing is ~98.5% sparse (mostly zeros).
**Action:** When implementing matrix multiplications involving filterbanks, always check for sparsity and precompute non-zero bounds to skip redundant zero-multiplications.
