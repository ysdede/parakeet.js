## Summary

The trace shows a **554.60 ms** main-thread block in a single **RunMicrotasks** event. That means a chain of Promise callbacks (microtasks) ran for over half a second without yielding, causing visible freezes. The exact promise chain is not identified in the trace; it needs to be found and broken up or deferred.

## Trace evidence

- **Source:** Performance trace `boncukjs-Trace-20260207T191008.json`.
- **Top long tasks:** #1 is **RunTask 554.60 ms**, #2 is **RunMicrotasks 554.53 ms** (same logical task).
- **Other related events:**  
  - `V8.InvokeApiInterruptCallbacks` – 1543.36 ms total, max **140.03 ms** (36 occurrences).  
  - `CpuProfiler::StartProfiling` – 1540.77 ms total, 18 occurrences, max **139.75 ms**.  
  So part of the cost may be profiler/DevTools overhead, but 554 ms in RunMicrotasks is still a real user-facing stall.

## What are microtasks?

In the browser event loop:

1. **Macrotasks:** e.g. `setTimeout`, I/O, user events. One macrotask runs, then the loop can render.
2. **Microtasks:** e.g. Promise `.then`/`.catch`/`.finally`, `queueMicrotask`. After a macrotask, **all** pending microtasks run until the queue is empty.  
If one Promise resolution triggers many more, they all run in one go. That’s why a long chain can block the main thread for hundreds of milliseconds.

## Likely causes in this app

- **Worker message handling:** When a worker posts a message, the main thread runs the `onmessage` handler. If that handler does synchronous work or resolves Promises that in turn do more work, you get a microtask chain.
- **Mel / TEN-VAD / Buffer workers:** The trace shows heavy `HandlePostMessage` (858 ms total) and long individual handlers (e.g. mel.worker 42 ms, tenvad 38 ms). A burst of worker responses could queue many microtasks.
- **WASM/initialization:** `v8.wasm.compileDigestForCreate` appears in long tasks (214 ms). First-time WASM compile can trigger large synchronous or microtask-driven work.
- **Profiler:** `CpuProfiler::StartProfiling` suggests the DevTools CPU profiler was used; it can add overhead and long callbacks. The 554 ms spike might be partly from that, but it’s still worth ensuring app code doesn’t queue huge microtask chains.

## How to fix it (junior-dev guide)

### 1. Find the chain

- **Chrome DevTools – Performance:** Record a trace that captures a RunMicrotasks block. Click the long "RunMicrotasks" (or parent "RunTask") bar and inspect the **call tree** or **Bottom-up** tab. Look for which function(s) account for most of the 554 ms (e.g. a specific `onmessage`, or a function that does a lot of synchronous work after `await`/`.then`).
- **Chrome DevTools – Sources:** Set breakpoints in worker `onmessage` handlers and in any `async`/Promise-heavy code (e.g. `MelWorkerClient`, `TenVADWorkerClient`, `BufferWorkerClient`). When the freeze happens, pause and check the call stack; that shows the chain.

### 2. Break up the work

Once you know which callbacks run during that 554 ms:

- **Chunk the work:** Instead of processing 100 items in one microtask, process N items (e.g. 10), then schedule the rest with `setTimeout(0)` or `requestAnimationFrame`. That yields back to the browser so it can render and handle input.
- **Avoid long synchronous work after await:** After `await worker.getFeatures(...)`, if you do a lot of CPU work (e.g. big loops, complex logic), move that into a `requestIdleCallback` or split it across multiple frames with `requestAnimationFrame`.
- **Batch worker responses:** If many worker messages arrive at once, consider batching: collect results in a small buffer and process the batch once per frame (e.g. in an rAF loop) instead of processing each message immediately in `onmessage`.

### 3. Defer non-critical work

- Anything that doesn’t need to run before the next paint (e.g. logging, non-UI updates) can be deferred with `queueMicrotask` + chunking or `setTimeout(0)` so it doesn’t extend the same microtask burst.

### 4. Re-check without profiler

- Record the same user scenario **without** starting the CPU profiler. If the 554 ms RunMicrotasks disappears or shrinks a lot, part of the cost is profiler overhead; the rest is still worth optimizing with the steps above.

## Success criteria

- No single RunMicrotasks (or RunTask) block on the main thread longer than ~50–100 ms during normal use.
- Long operations (WASM init, bulk worker results) are split across multiple frames or idle time so the UI stays responsive.

## Labels

`performance`, `audit`, `investigation`
