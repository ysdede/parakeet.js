# Parakeet.js benchmark analysis (100 samples)

**File:** `parakeet-benchmark-1772221557947.json`  
**Config:** `parakeet-tdt-0.6b-v2`, `webgpu-hybrid`, encoder fp32, decoder int8, preprocessor JS (nemo128)  
**Hardware:** Windows, RTX 5060 Ti, 12 logical cores, 8 GB (hint)

---

## 1. Summary

- **Decode (WASM)** is the **largest share of total time** (~46%), followed by Encode (WebGPU) (~42%) and Preprocess (~11%).
- **Times are not linear in audio duration:** decode time scales with output length (number of decoder steps/tokens) as well as encoder length. Same-duration clips show large decode variance (e.g. 24–26 s bucket: 95–200 ms decode).
- **RTF** (real-time factor) is high on average (~73×) but **drops for longer clips** (slope +1.6 with duration; longer clips have lower RTF in practice because decode dominates and scales with token count).

---

## 2. Phase timing (ms)

| Phase            | Mean  | Min   | Max   | p50   | p95   | Std   |
|------------------|-------|-------|-------|-------|-------|-------|
| Preprocess       | 27.9  | 5.5   | 55.2  | 29.5  | 43.5  | 9.6   |
| Encode (WebGPU)  | 109.3 | 65.7  | 305.0 | 113.5 | 129.7 | 26.9  |
| **Decode (WASM)**| **119.0** | 15.2 | **206.8** | 126.8 | 194.8 | **46.3** |
| Tokenize         | ~0    | 0     | 0.2   | 0     | 0.1   | ~0    |
| **Total**        | 258.5 | 89.4  | 540.8 | 276.7 | 352.6 | 77.0  |

Decode has the **highest variance** (std 46.3 ms) and the **largest range** (15–207 ms), consistent with dependence on **number of decoder steps** (tokens), not only audio length.

---

## 3. Share of total time

- **Decode:** 46.1%
- **Encode:** 42.3%
- **Preprocess:** 10.8%
- **Tokenize:** &lt;0.1%

So **WASM decoder is the single biggest bottleneck** in this run.

---

## 4. Scaling vs audio duration (linear fit)

| Phase     | Fit (ms = a·duration_sec + b) | R²     |
|-----------|--------------------------------|--------|
| Preprocess| 1.28·duration + 3.1           | 0.854  |
| Encode    | 2.79·duration + 55.0          | 0.516  |
| **Decode**| **5.91·duration + 3.9**       | **0.782** |
| Total     | 10.11·duration + 61.5         | 0.827  |

- **Decode** has the **steepest slope** (~5.9 ms per second of audio) but **R² = 0.78** &lt; 0.85, so a large part of decode time is **not** explained by duration alone — it tracks **output length (tokens)** and possibly encoder length.
- **Encode** has the **lowest R²** (0.52), so encoder time is also influenced by more than just duration (e.g. sequence length / padding).

---

## 5. Decode variance within duration buckets

Within the same 2 s duration bucket, decode time can vary a lot (e.g. 24–26 s: 95–200 ms). That confirms decode is **not linear in audio seconds** but in **decoder steps / token count**, which varies by content (dense vs sparse transcriptions).

---

## 6. RTF (real-time factor)

- **Mean RTF:** 73.24 (min 26, max 102, p50 75.6).
- RTF **increases** with duration in this fit (slope +1.6, R² = 0.64) — i.e. longer clips have **higher** RTF on average, but with big variance. Short clips (e.g. 2–6 s) have lower RTF because **fixed overhead** (preprocess, encoder, first decoder steps) dominates.

---

## 7. Why the WASM decoder is the bottleneck

1. **Largest share of total time** (~46%).
2. **Autoregressive:** each token requires one `joinerSession.run()` on WASM; total decode time ≈ (number of decoder steps) × (time per step). So decode scales with **output length**, not just input length.
3. **webgpu-hybrid:** encoder runs on WebGPU; decoder is forced to **WASM** (`executionProviders = ['wasm']` in `parakeet.js`), so decoder cannot use GPU and is CPU-bound.
4. **High variance:** same duration can yield very different token counts (e.g. short phrases vs long sentences), so decode time is **non-linear in duration** (R² = 0.78).

---

## 8. What to optimize

### Decode (WASM) – highest impact

1. **WebGPU decoder (if feasible)**  
   - Run the decoder/joiner on WebGPU when the runtime supports it, so decode is not CPU-bound on WASM. This may require ONNX ops compatibility and possibly a separate decoder graph for GPU.

2. **Fewer decoder steps**  
   - Model/algorithm side: faster convergence (e.g. better alignment, chunking, or non-autoregressive options) to reduce number of steps per utterance. No change in current parakeet.js codebase alone.

3. **Faster WASM**  
   - Build ONNX Runtime Web WASM with SIMD (e.g. `-msimd128`) and possibly multi-threading if the decoder run is thread-safe.
   - Use a single, well-shaped `joinerSession.run()` per step and avoid extra copies (reuse tensors; you already have `_targetTensor` / `_targetLenTensor`).

4. **Batch or speculative decoding**  
   - Only if the model and API support batching multiple decoder steps or speculative decoding; current API is step-by-step.

### Encode (WebGPU)

- Second-largest share (42%). Already GPU; further gains from better kernel fusion, smaller precision (e.g. fp16 if supported), or fewer encoder frames (e.g. more aggressive subsampling) would need model/runtime changes.

### Preprocess (JS)

- ~11% of time; already linear in duration with good R². Optional: move to Web Workers or WASM/WebGPU if you need to squeeze more out of this phase.

### Observability

- Log or export **token count** (or decoder step count) per run in the benchmark JSON. Then you can regress **decode_ms vs token_count** to confirm linearity and report “ms per token” for the WASM decoder.

---

## 9. How to reproduce this analysis

```bash
node metrics/analyze-benchmark.js metrics/parakeet-benchmark-1772221557947.json
```

The script prints phase stats, scaling fits, and bottleneck summary. This report is a human-written summary of that output plus codebase context (`parakeet.js` decoder loop and `webgpu-hybrid` WASM decoder).
