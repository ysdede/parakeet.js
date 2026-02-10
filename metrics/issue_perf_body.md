# Performance Trace Findings (90s session)

## Summary
The trace shows GPU/WebGPU work dominating timed events, with renderer main and AudioWorklet threads staying under jank thresholds. The biggest optimization wins are in reducing WebGPU command submission/flush overhead, improving buffer reuse, and cutting per‑chunk allocations in workers.

## Key Findings
- WebGPU/GPU-related work is the dominant consumer of timed events in the trace (`GpuChannel::ExecuteDeferredRequest`, `CommandBuffer::Flush`, `CommandBufferStub::OnAsyncFlush`, `CommandBufferService:PutChanged`, `WebGPU`).
- Renderer main thread has no >16ms tasks; layout/paint is present but below jank thresholds.
- AudioWorklet thread shows many events but no long tasks (no ≥2ms events), suggesting realtime audio capture is stable.
- The only >50ms tasks were browser background tasks (sync scheduler / geolocation polling), not app code.

## Optimization Suggestions
### WebGPU
- Reduce `queue.submit` frequency by batching multiple passes into a single command buffer.
- Reuse `GPUBuffer`s and staging buffers; avoid frequent reallocation.
- Prefer `queue.writeBuffer` for small updates instead of `mapAsync`/readback in hot paths.
- Keep pipeline and bind group layouts stable; avoid per‑frame layout churn.

### Worker/JS
- Reduce per‑chunk object churn to lower GC activity (reuse `Float32Array` buffers, avoid allocating new objects per chunk).
- Ensure any heavy computations stay off the main thread.

### UI
- Keep waveform/UI refresh throttled (e.g., 30fps) and skip updates when backgrounded.

## Next Steps
- Prioritize WebGPU batching + buffer reuse in the inference/render pipeline.
- Audit worker hot paths for allocations per chunk.

Sign: G52CEH
