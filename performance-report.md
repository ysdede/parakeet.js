# Boncukjs Performance Profile Report

Profile captured with Chrome DevTools MCP (trace with reload).  
Trace file: `performance-trace.json.gz`

## Core Web Vitals (lab)

| Metric | Value | Status |
|--------|--------|--------|
| **LCP** | 443 ms | Good (< 2.5s) |
| **INP** | 46 ms | Good (< 200 ms) |
| **CLS** | 0.02 | Good (< 0.1) |

## LCP Breakdown

- **TTFB:** 38 ms (8.5%)
- **Render delay:** 406 ms (91.5%)
- LCP element: `SPAN.material-symbols-outlined` (text, not from network)

Most of LCP is render delay; TTFB is fine.

## Findings and Recommendations

### 1. Forced reflow (high impact)

**Insight:** Forced synchronous layout in `Waveform.tsx` caused **106 ms** reflow time.

- **Main culprit:** `updateCanvasSize` in `Waveform.tsx` (105 ms), using `getBoundingClientRect()` after layout invalidation.
- **Other:** Small contributions from `Waveform.tsx` (0.2 ms) and `DebugPanel.tsx` (0.3 ms).

**Fix:** Use `ResizeObserver` entry `contentRect` in the resize callback instead of `getBoundingClientRect()`, and defer the initial size read to the next frame (e.g. `requestAnimationFrame`) so it runs after first layout. This removes the forced reflow from the hot path.

### 2. Document latency

- No redirects, server response fast.
- **Compression:** Document response is not compressed (estimated 1.5 kB could be saved). Enable gzip/brotli for the HTML document in your dev server if useful for local testing; production should already use compression.

### 3. Render-blocking resources

Two render-blocking CSS requests (Google Fonts):

- `Material+Symbols+Outlined` (VeryHigh, ~89 ms total)
- `Manrope` and `JetBrains+Mono` (VeryHigh, ~89 ms total)

Consider `font-display: swap`, preconnect to `fonts.googleapis.com` / `fonts.gstatic.com`, or loading fonts asynchronously to reduce blocking.

### 4. DOM and layout

- **DOM:** 199 nodes, depth 11, max 6 children per node. Reasonable.
- **Layout:** One layout update touched 308 nodes, 70 ms. Correlates with the forced reflow; fixing Waveform should help.

### 5. INP (interaction)

Longest interaction: `pointerdown`, 46 ms total (input delay 1 ms, processing 0 ms, presentation delay 45 ms). Well within “good” range; no change required for INP.

## Summary

- CWV are in the “good” range; main improvement opportunity is **reducing forced reflow** in `Waveform.tsx` by avoiding `getBoundingClientRect()` on the resize path and deferring the initial canvas size read.
