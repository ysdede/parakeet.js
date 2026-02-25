## 2024-05-23 - Real-valued FFT Optimization
Learning: Pure JS STFT is dominated by FFT computation. Replacing N-point complex FFT with N/2-point complex FFT for real inputs yields ~40% total speedup. The reconstruction step requires twiddle factors for size N, which `precomputeTwiddles(N)` naturally provides.
Action: Prefer Real-valued FFT for audio processing in JS when input is real-valued.
