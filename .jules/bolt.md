## 2026-02-14 - Mel Filterbank Sparsity Optimization
**Learning:** The Slaney mel filterbank matrix is extremely sparse (~98.5% zeros) because each mel filter only covers a small frequency range (typically 2-12 bins out of 257). The naive implementation iterates over all 257 bins for every filter, wasting significant CPU cycles multiplying by zero.
**Action:** Always check filterbank matrices for sparsity when implementing audio processing. Pre-computing start/end indices allows skipping zero-multiplications, offering massive speedups (potential 60x for this specific loop).
