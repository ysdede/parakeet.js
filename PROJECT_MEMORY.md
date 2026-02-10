# Project Memory (Serena / agent context)

This file records high-level decisions and recent work for multi-agent context. **Serena MCP is configured and boncukjs is registered to it.** When an agent has access to Serena MCP, use `mcp_serena_write_memory` to store or sync the points below. Otherwise, agents read this file for context.

---

## Branch and recent commits (refactor/streaming-merger)

- **Mel spectrogram**: Heatmap colormap (black -> blue -> purple -> green -> yellow -> orange -> red). High energy speech in yellow/orange/red. Data: same mel features from MelWorkerClient; intensity from `(val + 2) / 4`.
- **Waveform**: Fixed vertical scale with constant gain (`WAVEFORM_GAIN = 4`) and clamp to strip bounds to avoid amplitude "jumps" that occurred when scaling to per-buffer min/max.
- **TenVAD**: New TEN-VAD Web Worker (`tenvad.worker.ts`) and main-thread client (`TenVADWorkerClient`). WASM in `public/wasm/` (ten_vad.js, ten_vad.wasm). Init/dispose, fire-and-forget process(), onResult callback. Tests use invalid WASM URL for init-failure and 15s timeout.
- **BufferWorker**: Centralized multi-layer buffer in a Web Worker (`buffer.worker.ts`, `BufferWorkerClient`). Layers: audio, mel, energyVad, inferenceVad; time-aligned by global sample index. Fire-and-forget writes; promise-based reads (hasSpeech, getSilenceTail, queryRange, getState). Types in `src/lib/buffer/types.ts`.
- **Transcription**: `WindowBuilder.hasSpeechInPendingWindow()` comment clarified: "no VAD" -> "no VAD buffer".
- **Tests**: Vitest `pool: 'forks'` in vite.config.js to avoid worker/thread issues in worker-based tests.
- **Debug panel**: LayeredBufferVisualizer integrated (melClient prop, 8s window). Finalized sentences auto-scroll to bottom; container has fixed height and resize. VAD/Silero/SNR UI always rendered with opacity transitions to prevent layout jump. LayeredBufferVisualizer exported from `components/index.ts`.

---

## Architecture notes

- **Transcription modes**: Per-utterance (legacy) and v4 streaming (utterance-based merger, sentence finalization, mature cursor). WindowBuilder drives inference windows; VAD ring buffer and mature cursor frame govern when to emit.
- **Workers**: Mel worker (continuous mel), transcription worker (model inference), buffer worker (multi-layer store), tenvad worker (TEN-VAD WASM). Main thread coordinates; fire-and-forget for hot paths.
- **Local dev**: `npm run dev:local` uses local parakeet.js source (see LOCAL_DEV_SETUP.md). Production uses NPM parakeet.js.

---

## How to update Serena

1. With Serena MCP connected: call `mcp_serena_write_memory` with the "Serena summary" below (or new decisions).
2. Otherwise: keep this file updated and commit it so other agents have the context.

**Serena summary (paste into mcp_serena_write_memory):**

```
boncukjs (refactor/streaming-merger): Real-time STT in browser (SolidJS, Parakeet.js). Mel spectrogram uses black-to-red heatmap. Waveform uses fixed gain 4 and clamp to avoid jumps. TenVAD: worker + TenVADWorkerClient + public/wasm. BufferWorker: multi-layer (audio, mel, energyVad, inferenceVad), BufferWorkerClient, fire-and-forget writes, promise reads. Debug panel: LayeredBufferVisualizer (melClient, 8s), auto-scroll finalized sentences, stable VAD/Silero/SNR UI. Vitest pool: forks. Workers: mel, transcription, buffer, tenvad; main thread coordinates.
```

Last updated: 2026-02-07 (after refactor/streaming-merger commits: TenVAD, BufferWorker, Debug panel, mel heatmap, waveform scaling, test config, WindowBuilder comment).
