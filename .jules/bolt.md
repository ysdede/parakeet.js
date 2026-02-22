## 2025-05-23 - JsPreprocessor STFT Dominance
Learning: STFT computation consumes ~70% of Mel preprocessing time in JS (even with sparse filterbank optimization).
Action: Prefer algorithmic optimizations like RealFFT (O(N/2) complex ops) over micro-optimizations in the filterbank application loop.
