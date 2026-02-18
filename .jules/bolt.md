## 2024-05-23 - Sparse Mel Filterbank Optimization
Learning: The Slaney Mel filterbank matrix is ~98% sparse, making dense matrix multiplication inefficient for audio feature extraction.
Action: Pre-calculate start/end indices for non-zero values in filterbanks to replace dense matrix multiplication with sparse iteration in hot loops.
