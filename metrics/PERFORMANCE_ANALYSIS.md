# Boncukjs Performance Trace Analysis

**Date:** Feb 7, 2026
**Trace:** `metrics/trace_boncuk-tracing.json` (Chrome detailed tracing)
**Duration:** 93.4s | **Events analyzed:** 1,161,562

## Process/Thread Map

| Component | PID | TID | Role |
|-----------|-----|-----|------|
| Renderer (main) | 76416 | 71168 | UI main thread (SolidJS) |
| Compositor | 76416 | 70772 | Frame compositing |
| AudioWorklet | 76416 | 76740 | Real-time audio capture |
| Worker-47784 | 76416 | 47784 | Mel spectrogram computation |
| Worker-69636 | 76416 | 69636 | Message relay |
| Worker-75196 | 76416 | 75196 | GPU/inference (WebGPU ONNX Runtime) |
| Worker-75496 | 76416 | 75496 | Buffer/transcription worker |
| GPU Process | 73564 | 55528 | WebGPU command execution (Dawn) |
| Audio Service | 76712 | -- | System audio I/O |

## Thread CPU Time (93.4s trace)

| Thread | CPU Time | % of trace |
|--------|----------|------------|
| Main Thread | 10.00s | 10.7% |
| Compositor | 6.91s | 7.4% |
| Mel Worker (47784) | 0.80s | 0.9% |
| Buffer Worker (75496) | 0.71s | 0.8% |
| GPU/Inference Worker (75196) | 0.57s | 0.6% |
| AudioWorklet | 0.35s | 0.4% |

---

## Finding 1: GPU Worker GC Pressure (HIGH IMPACT)

**28.7% of GPU worker (tid=75196) CPU time is spent on garbage collection.**

| GC Type | Events | Total | Max |
|---------|--------|-------|-----|
| MajorGC | 7 | 34.2ms | 7.2ms |
| MinorGC (Scavenger) | 70 | 38.5ms | 3.0ms |
| Incremental Marking | 236 | 19.8ms | 1.9ms |
| V8.GCFinalizeMC | 7 | 33.9ms | 7.2ms |
| **Total** | **397** | **163.6ms** | -- |

The inference worker makes only 34 inference calls over the trace (~1/s), each taking ~1.3ms on the JS side. But it also handles 3,322 CommandBuffer flush operations. Constant allocation/deallocation of WebGPU command buffers and intermediate tensors triggers frequent GC.

### Recommendations

- Pre-allocate reusable `Float32Array`/`ArrayBuffer` pools for inference I/O rather than creating new ones each cycle
- If using onnxruntime-web, explore reusing `OrtValue` objects via pre-allocated backing buffers
- Consider using `WeakRef` + `FinalizationRegistry` for GPU buffer lifecycle management
- Profile whether manual `gc()` calls between inference cycles reduces pause variance

---

## Finding 2: Main Thread Rendering Overhead (MEDIUM IMPACT)

The main thread spends its 10s of CPU time primarily on the rendering pipeline:

| Phase | Time | Events | Max |
|-------|------|--------|-----|
| BeginMainFrame | 1,560ms | 1,646x | 11.9ms |
| Style Recalc (UpdateLayoutTree) | 306ms | 1,647x | 3.2ms |
| Forced Style+Layout | 83.6ms | 8,248x | 1.8ms |
| Layout (UpdateStyleAndLayout) | 112ms | 8,248x | 1.8ms |
| Paint | 106ms | 1,646x | 8.9ms |
| Canvas ProduceResource | 50.3ms | 1,040x | 0.2ms |
| MessagePort::Accept | 178.9ms | 390x | 4.9ms |

The 8,248 forced synchronous layout calls (`Blink.ForcedStyleAndLayout.UpdateTime`) indicate JavaScript reads layout properties after DOM mutations, triggering synchronous layout recalculation. While no single call exceeds 2ms, the cumulative 83.6ms is significant.

### Recommendations

- Batch DOM reads before DOM writes in SolidJS reactive updates
- The `requestAnimationFrame` callback pipeline (`PageAnimator::serviceScriptedAnimations` = 193ms) is where forced layouts likely trigger
- For the waveform `<canvas>`, do not read canvas dimensions in a hot loop
- Debounce or throttle worker-to-main-thread messages for UI updates (MessagePort::Accept spikes to 4.9ms)

---

## Finding 3: WebGPU Command Pipeline (MEDIUM IMPACT)

**3,315 WebGPU commands over 30.9s (107/s), 117 commands > 5ms**

| Metric | Value |
|--------|-------|
| Total GPU time | 4,233ms |
| P50 duration | 479us |
| P90 duration | 3,517us |
| P95 duration | 4,628us |
| P99 duration | 6,371us |
| Max duration | 8,963us |
| Burst count | 61 (avg 15 cmds/burst) |

High-duration commands follow `GpuChannel::ExecuteDeferredRequest`, indicating GPU pipeline drain stalls.

### Recommendations

- Ensure ONNX session uses `graphOptimizationLevel: 'all'` in `SessionOptions` to minimize GPU dispatches per inference
- Use `freeDimensionOverrides` to fix input tensor dimensions, enabling the runtime to fuse more operations
- If the model supports it, batch-fuse encoder steps

---

## Finding 4: AudioWorklet Scheduling (LOW-MEDIUM IMPACT)

| Metric | Value |
|--------|-------|
| Callback count | 3,070 |
| Estimated buffer | ~480 samples @ 48kHz |
| Task duration (avg) | 86us |
| Task duration (max) | 194us |
| Task duration (P99) | 174us |
| Interval (avg) | 10,228us |
| Interval (max) | **42,429us** |
| Interval (stddev) | 2,753us |
| Late (>1.5x expected) | 34 |
| Very late (>3x expected) | 29 |

The AudioWorklet processor code is fast (86us avg, well within budget). But the max interval of 42.4ms (4x expected) indicates occasional OS-level scheduling jitter that could cause audio dropouts.

### Recommendations

- Increase the ring buffer size in the AudioWorklet to handle up to ~100ms of scheduling jitter
- Consider `latencyHint: 'playback'` on the AudioContext if not already set

---

## Finding 5: WASM Is Not a Bottleneck

Only 4 WASM events in the entire trace:
- 2x `CompilationStateImpl::InitCompileJob` (1.4ms, 0.9ms) -- one-time
- 2x `WasmEngine::LogCode` (<0.01ms)

Confirms the pure-JS mel preprocessor is the active path. No WASM overhead.

---

## Finding 6: Worker Communication Is Efficient

| Thread | Serialize | Deserialize |
|--------|-----------|-------------|
| Main Thread | 22.2ms (1,689x) | 14.2ms (928x) |
| AudioWorklet | 9.7ms (390x) | 0ms |
| Mel Worker | 8.8ms (384x) | 4.5ms (384x) |
| Buffer Worker | 0.8ms (33x) | 5.4ms (417x) |
| GPU Worker | 1.2ms (34x) | 6.2ms (33x) |

Total message passing overhead: ~67ms over 93s -- negligible (<0.1%).

---

## Finding 7: Inference Cadence and Worker Balance

| Worker | Calls | Interval | Duration/call | Total |
|--------|-------|----------|---------------|-------|
| Mel (47784) | 385 | 81.6ms avg | 1.01ms avg | 389ms |
| Buffer (75496) | 417 | 75.3ms avg | 0.81ms avg (3.3ms max) | 336ms |
| GPU/Inference (75196) | 34 | 909.6ms avg | 1.3ms avg | 45ms |
| AudioWorklet msgs | 390 | -- | 25us avg | 10ms |

Buffer Worker (75496) has a max spike of 3.3ms (4x the average).

---

## Finding 8: Frame Rate

| Metric | Value |
|--------|-------|
| Compositor draws | 1,646 |
| Effective FPS | 52.5 |
| Frame interval (avg) | 19.0ms |
| Frame interval (max) | **485.7ms** |
| Janky frames (>2x avg) | 39 |

The max frame interval of 485.7ms indicates at least one significant stall. Average 52.5 FPS suggests some frames are occasionally skipped or delayed, though it is close to the 60fps target.

---

## Priority Summary

| # | Finding | Impact | Effort |
|---|---------|--------|--------|
| 1 | GPU Worker GC: 28.7% time in GC | High | Medium |
| 2 | Main thread forced layouts: 8,248 sync layout calls (84ms) | Medium | Low |
| 3 | WebGPU P99 latency: 6.4ms stalls | Medium | Low-Med |
| 4 | AudioWorklet max jitter: 42ms | Low-Med | Low |
| 5 | Worker-to-main message spikes: 4.9ms | Low | Low |
| 6 | Frame rate stalls: max 486ms gap, 39 janky frames | Low | TBD |

---

## How to Re-run Analysis

```bash
# Re-capture trace from Chrome DevTools (Performance tab -> Record -> interact -> Stop -> Export as JSON)
# Place the trace file in metrics/ directory

# Run the analyzer:
python metrics/analyze_chrome_trace.py metrics/trace_boncuk-tracing.json

# For a custom trace file:
python metrics/analyze_chrome_trace.py path/to/your/trace.json
```

The script outputs:
- Human-readable report to stdout
- Machine-readable JSON summary to `trace_analysis_summary.json` in the same directory as the trace
