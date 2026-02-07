## Summary

The transcript auto-scroll in `TranscriptionDisplay` causes **forced layout reflows** by reading `scrollHeight` and then writing `scrollTop` synchronously. A **MutationObserver** calls this on **every DOM change** (including character data), so rapid transcription updates trigger repeated reflows and hurt frame time.

## Trace evidence

- **Source:** Performance trace `boncukjs-Trace-20260207T191008.json`.
- **Layout & style section:** "Forced reflows: **8**" with stack trace:  
  `scrollToBottom @ http://localhost:3100/src/components/TranscriptionDisplay.tsx:15`
- **Location:** `TranscriptionDisplay.tsx` – `scrollToBottom()` and the `MutationObserver` that invokes it.

## Root cause

1. **Forced reflow pattern**  
   In `scrollToBottom()`:
   - `containerRef.scrollHeight` is **read** (browser must compute layout to return the value).
   - `containerRef.scrollTop = ...` is **written** (triggers another layout pass).  
   Doing read-then-write in the same synchronous block forces the browser to lay out immediately and can block the main thread.

2. **MutationObserver is too frequent**  
   The observer is set with `childList: true`, `subtree: true`, and `characterData: true`. So **every text change** (e.g. each token or character update in the transcript) fires the callback. That means:
   - Many DOM mutations per second during active transcription.
   - Each mutation runs `scrollToBottom()` and thus triggers the read/write layout pattern.
   - Result: unnecessary layout work and risk of jank during streaming.

## How to fix it (junior-dev guide)

### 1. Defer the scroll to the next frame

Do **not** do the scroll inside the MutationObserver callback directly. Schedule it for the next paint so multiple mutations in the same frame are coalesced into one scroll:

```ts
const scrollToBottom = () => {
  if (containerRef) {
    requestAnimationFrame(() => {
      if (containerRef) {
        containerRef.scrollTop = containerRef.scrollHeight;
      }
    });
  }
};
```

**Why this helps:**  
- The observer can fire many times in one frame; `requestAnimationFrame` runs once per frame. So you get at most one layout read/write per frame instead of one per mutation.
- The read (`scrollHeight`) and write (`scrollTop`) still happen together, but only once per frame, which is acceptable.

### 2. (Optional) Throttle or debounce

If you still see many rAF callbacks (e.g. multiple frames of rapid updates), you can throttle:

- Keep a flag `scrollScheduled` and only schedule one rAF at a time, or
- Use a short debounce (e.g. 50–100 ms) so you scroll after a burst of updates settles.

### 3. (Optional) Reduce MutationObserver scope

If you only need to scroll when **blocks** of text are added (not on every character), consider:
- Observing only `childList: true` and `subtree: true`, and **removing** `characterData: true`, or
- Replacing the observer with a SolidJS effect that depends on `confirmedText` / `pendingText` and runs scroll once when they change.

### 4. Verify

After the change:

- In DevTools Performance, record a session while transcribing. In "Layout" or "Recalculate style" events, you should see fewer (or no) forced reflow stacks pointing at `scrollToBottom`.
- Manually check that the transcript still auto-scrolls correctly when new text appears.

## Code references

- `scrollToBottom`: `src/components/TranscriptionDisplay.tsx` (around lines 17–21).
- MutationObserver setup: same file, `onMount` (around lines 29–34).

## Labels

`performance`, `good first issue`, `audit`
