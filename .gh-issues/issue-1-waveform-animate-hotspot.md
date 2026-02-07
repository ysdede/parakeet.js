## Summary

The `Waveform` component's `animate()` function (at line 19 in the original DOM-based implementation) was the **#1 CPU hot spot** in a Chrome DevTools trace captured with the debug panel closed: **718.87 ms total** across **785 calls**, with individual frames taking up to **26.64 ms** (enough to drop a 60fps frame).

## Trace evidence

- **Source:** Performance trace `boncukjs-Trace-20260207T191008.json` (debug panel closed).
- **Hot call site:** `Waveform.tsx:19` – function `animate`.
- **Metrics:** Total 718.87 ms, 785 invocations, max 26.64 ms per call, avg ~0.92 ms.
- **Impact:** Top 20 "Function Calls by Duration" included multiple `Waveform.tsx:19 (animate)` entries (26.64 ms, 24.01 ms, 21.74 ms, etc.), each exceeding the 16.67 ms budget for 60fps.

## Root cause

The previous implementation used **32 DOM `<div>` elements** as waveform bars, each with **inline styles** (height, opacity, box-shadow). Every `requestAnimationFrame` (60fps):

1. Called `setBarHeights(prev => prev.map(...))`, creating a **new array** every frame.
2. SolidJS reactivity then **re-evaluated all 32 bar elements** (referential equality on the array).
3. The browser **recalculated styles** and applied **CSS transitions** for 32 elements.
4. This caused **layout and paint work** on every frame.

So the main thread was doing 32 DOM updates + style recalc + transition work at 60fps, which showed up as the dominant cost in the trace.

## Status of fix

A fix is already implemented in commit **`a89de10`** ("perf: convert Waveform from DOM bars to canvas renderer"):

- The component now uses a **single `<canvas>`** and draws all bars in one paint.
- Bar heights are stored in a **reused `Float32Array`** (no array allocation per frame).
- The animation loop is **throttled to ~30fps** (33 ms), which is enough for this UI and reduces load.

## What you should do (junior-dev guide)

1. **Confirm the fix is active**  
   After pulling the latest code (including `a89de10`), do a **full reload** of the app (e.g. restart `npm run dev:local` or hard refresh the browser). Hot Module Replacement sometimes does not fully replace the Waveform component.

2. **Re-profile**  
   Capture a new trace with the **debug panel closed** (same conditions as before). In the "Bottom-up" or "Call tree" view:
   - You should **no longer** see `Waveform.tsx:19 (animate)` as a top consumer.
   - If you still see it, the old bundle may be cached; try a clean build and/or incognito.

3. **If you ever reintroduce a DOM-based waveform**  
   Avoid updating many DOM elements every frame. Prefer:
   - A single canvas and draw calls, or
   - CSS transforms/opacity only (no layout-triggering properties), or
   - Throttling updates (e.g. 15–30fps) and batching DOM writes.

## Labels

`performance`, `good first issue` (verification only), `audit`
