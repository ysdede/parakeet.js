## Summary

Handling worker messages on the main thread is the **second-largest** source of CPU time in the trace: **858.72 ms total** across **1938 HandlePostMessage** events. Individual handler executions for the mel and TEN-VAD workers sometimes take **38–42 ms**, which is enough to miss 2–3 frames at 60fps. This issue tracks reducing that cost so the UI stays smooth during active transcription.

## Trace evidence

- **Source:** Performance trace `boncukjs-Trace-20260207T191008.json`.
- **HandlePostMessage:** 858.72 ms total, 1938 calls, **max 42.26 ms**.
- **Hot call sites (main-thread side):**
  - `tenvad.worker.ts` (worker file) – 311.32 ms total, 181 calls, **max 38.55 ms** (this is the handler *invocation* on the main thread that processes the worker’s response).
  - `mel.worker.ts` – 292.80 ms total, 197 calls, **max 42.22 ms**.
  - `AudioEngine.ts:224` (workletNode.port.onmessage) – 98.01 ms total, 89 calls, max 20.40 ms.
  - `buffer.worker.ts` – 37.48 ms total, 2 calls, max 36.80 ms.
  - `TenVADWorkerClient.ts:11` (worker.onmessage) – 11.79 ms total, 2 calls, max 11.24 ms.

So the cost is both **total time** (858 ms) and **per-message spikes** (38–42 ms) that can cause visible frame drops.

## Root cause

When a Web Worker (or Audio Worklet) calls `postMessage(data)`:

1. The browser queues a task on the **main thread**.
2. The main thread runs the **onmessage** handler.
3. If the handler does a lot of work (parsing, copying, state updates, more async), that all runs in one go and blocks rendering.

In this app:

- **Mel worker** sends feature buffers (e.g. Float32Array). The main-thread handler may copy data, resolve Promises, or trigger SolidJS updates. Doing that for every response can add up and sometimes take 40+ ms.
- **TEN-VAD worker** sends VAD results. Again, each result is handled on the main thread; if handling does heavy work or triggers many reactive updates, you get spikes.
- **Audio worklet** (AudioEngine) posts audio chunks at a fixed rate (e.g. every 80 ms). The handler does resampling, ring-buffer writes, and notifies listeners; 20 ms max suggests it’s already heavier than ideal for a single chunk.

So the issue is not workers being slow in the background, but **how much work the main thread does when it receives each message**.

## How to fix it (junior-dev guide)

### 1. Do less in the handler (fast path)

- **Only copy what you need:** If the handler only needs a small part of a large buffer (e.g. one number, or a summary), don’t copy or iterate over the whole buffer on the main thread. Prefer transferring or sharing so the main thread just gets a reference or a small payload.
- **Resolve Promises with minimal work:** e.g. `melClient.getFeatures()` – when the worker sends the result, the handler should ideally just resolve the Promise and store the transferred buffer. Any processing (e.g. for UI) should be deferred (see below) or done in the worker.
- **Avoid triggering heavy reactivity on every message:** If each message updates a SolidJS signal that causes a big re-render or derived computation, batch those updates (e.g. once per frame or every N messages).

### 2. Defer non-critical work to the next frame

- After receiving a worker message, do the **minimum** required to keep the pipeline correct (e.g. store the result, resolve the Promise).
- Anything that’s for **UI or logging** (e.g. updating a debug panel, computing stats) can be run in `requestAnimationFrame` or `requestIdleCallback` so it doesn’t extend the same task and doesn’t block the next frame.

Example pattern:

```ts
worker.onmessage = (e) => {
  const data = e.data;
  // 1. Minimal work: store and resolve
  resolvePromise(data);
  // 2. Defer UI/extra work
  requestAnimationFrame(() => {
    updateUI(data);
  });
};
```

### 3. Throttle or batch updates

- If the mel worker sends many small responses per second, consider batching on the worker side (send one message per N frames or per time window) so the main thread handles fewer, larger messages.
- For VAD: if you don’t need every single result immediately, you could throttle (e.g. at most one UI update per 50–100 ms) so that rapid results don’t queue 38 ms handlers back-to-back.

### 4. Prefer transfer over copy

- When using `postMessage`, use the **transfer list** for large buffers so the buffer is moved, not copied:  
  `worker.postMessage({ data }, [data.buffer])`.  
  That reduces main-thread memory and copy cost. Make sure the worker doesn’t need the buffer after sending (it’s transferred, not copied).

### 5. Measure after each change

- Record a short trace while transcribing and check:
  - **HandlePostMessage** total time and **max** duration per call.
  - **Animation frame** lengths (no single frame should be > ~16 ms if you’re targeting 60fps).

Target: no single message handler over ~5–10 ms; total HandlePostMessage significantly below 858 ms for a similar recording length.

## Code references

- Mel: `MelWorkerClient.ts` (onmessage / getFeatures response handling), `mel.worker.ts` (what is sent).
- TEN-VAD: `TenVADWorkerClient.ts`, `tenvad.worker.ts`.
- Audio: `AudioEngine.ts` around line 224 (`workletNode.port.onmessage`).
- Buffer: `BufferWorkerClient.ts`, `buffer.worker.ts`.

## Labels

`performance`, `audit`, `workers`
