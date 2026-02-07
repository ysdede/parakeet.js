# Boncuk.js

Real-time speech-to-text transcription in the browser, powered by [Parakeet.js](https://github.com/ysdede/parakeet.js).

## Overview

BoncukJS is a real-time speech-to-text transcription application built with SolidJS, Vite, and Tailwind CSS. It runs NVIDIA NeMo Parakeet TDT models directly in the browser using WebGPU/WASM via Parakeet.js — no backend required.

**Architecture:** Transcription supports **per-utterance** mode (legacy VAD-defined segments) and **v4 streaming** (utterance-based merger, sentence finalization, mature cursor). The v4 pipeline uses a centralized BufferWorker (multi-layer time-aligned buffer), TEN-VAD (WASM) for inference VAD, and HybridVAD (energy-based) for UI. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for decisions and NeMo streaming limitations; [.serena/memories/v4-utterance-pipeline-refactor.md](.serena/memories/v4-utterance-pipeline-refactor.md) for v4 pipeline details.

**Recent work (Feb 2026):** Performance audit and visualization overhauls: Waveform converted from 32 DOM bars to a **canvas renderer** (eliminates 60fps layout/paint cost); **RingBuffer** gained zero-allocation `readInto()` and pre-allocated waveform buffer; **LayeredBufferVisualizer** (mel heatmap + waveform in debug panel) uses pre-allocated ImageData and ResizeObserver cache instead of per-frame `getBoundingClientRect`. Debug panel shows RTFx (1/RTF) and latency with last-N averages; finalized sentences auto-scroll; VAD labels generalized. See [PROJECT_MEMORY.md](PROJECT_MEMORY.md) and [Documentation and Context](#documentation-and-context) for Serena memories and tracked issues.

### Key Features

- **Zero-backend transcription** — WebGPU/WASM inference runs entirely client-side
- **Real-time audio processing** — VAD-based speech detection (energy + optional TEN-VAD WASM)
- **Pipeline-parallel mel preprocessing** — dedicated Web Worker for continuous mel spectrogram production
- **Pure JS mel spectrogram** — no ONNX preprocessor needed, validated against NeMo reference
- **Incremental decoder cache** — skip re-decoding overlapping prefix frames
- **v4 utterance pipeline** — BufferWorker (audio, mel, energyVad, inferenceVad), WindowBuilder, UtteranceBasedMerger, sentence finalization
- **Live transcription UI** — canvas-based waveform (fixed gain, no DOM bars), LayeredBufferVisualizer (mel heatmap + waveform in debug panel), GoldWave-style mel colormap, SNR meter, debug panel with RTFx/latency (last-N averages), auto-scroll for finalized sentences
- **Model management** — WebGPU/WASM backend selection, model sideloading from HuggingFace
- **Gemini integration** — post-processing and analysis of transcribed text

---

## Performance

Measured on a desktop with 12-thread CPU and WebGPU-capable GPU (Feb 2026):

| Metric | Before Optimization | After Optimization |
|---|---|---|
| **Preprocess** | 181 ms | **0.0 ms** (precomputed by mel worker) |
| **Encode** | 468 ms | **160-178 ms** |
| **Decode** | 133 ms | **19-99 ms** |
| **Total per chunk** | 787 ms | **187-265 ms** |
| **Real-Time Factor** | 6.3x | **19-27x** |

The preprocessing bottleneck has been completely eliminated through the mel worker architecture. See [docs/mel-worker-architecture.md](docs/mel-worker-architecture.md) for details.

---

## Architecture

### Multi-Worker Pipeline

```
Main Thread (UI)
  ├── AudioEngine → captures mic → 80ms PCM chunks (resample to 16kHz)
  │     ├── AudioWorklet → raw audio processing
  │     └── onAudioChunk → MelWorker, HybridVAD (energy), TenVADWorkerClient, BufferWorker (audio)
  │
  ├── BufferWorkerClient → multi-layer store (audio, mel, energyVad, inferenceVad); fire-and-forget writes, promise reads
  ├── MelWorkerClient → sends audio to mel worker; features queried for inference windows
  ├── TenVADWorkerClient → forwards audio to TEN-VAD worker; inference VAD written to BufferWorker
  └── TranscriptionWorkerClient → v4Tick queries BufferWorker (hasSpeech), WindowBuilder, inference

Mel Worker (Web Worker)
  └── Continuous mel spectrogram production
      ├── Pre-emphasis → STFT → Power → Mel filterbank → Log
      └── Raw mel frames; on request: normalize window → return features

Buffer Worker (Web Worker)
  └── Centralized time-aligned layers (sample offsets at 16kHz)
      └── hasSpeech(energyVad | inferenceVad), getSilenceTail, queryRange

TEN-VAD Worker (Web Worker)
  └── ten-vad WASM (~278KB); 256-sample hops; posts probabilities → BufferWorker inferenceVad layer

Inference Worker (Web Worker)
  ├── ModelManager → loads parakeet.js model (WebGPU/WASM)
  ├── WindowBuilder → cursor-based dynamic window (min/max duration, hasSpeech from BufferWorker)
  ├── UtteranceBasedMerger → sentence finalization, mature/immature text
  └── parakeet.js transcribe() with precomputedFeatures
      ├── Encoder (WebGPU) → ~160ms for 5s audio
      └── Decoder (WASM) → 20-100ms depending on text length
```

### Key Optimizations

1. **Mel Worker (pipeline parallelism)** — Mel spectrogram computation runs in a separate Web Worker, continuously processing audio as it arrives. When inference is triggered, normalized features are ready instantly.

2. **Pure JS preprocessor** — Replaces the ONNX `nemo128.onnx` model. Eliminates ONNX session overhead and one model download. Validated against NeMo reference (max error < 4e-4).

3. **Incremental decoder cache** — Parakeet.js caches decoder state at prefix boundaries, skipping re-decoding of overlapping frames (~80% decoder savings).

4. **Reduced streaming window** — 5.0s window / 3.5s overlap / 1.5s trigger (down from 7.0s/5.5s/1.0s), ~30% less work per chunk.

5. **Queue-based chunk processing** — Latest-only queue prevents dropped chunks when inference is busy.

6. **Optional log probabilities** — `returnLogProbs` disabled by default, saving per-frame softmax computation.

7. **v4 pipeline** — BufferWorker holds time-aligned audio, mel, energyVad, inferenceVad. TEN-VAD (WASM) provides inference VAD; HybridVAD (peak + 6-sample SMA energy) for fast UI. WindowBuilder and UtteranceBasedMerger drive utterance-based streaming with sentence finalization (wink-nlp). See [.serena/memories/v4-utterance-pipeline-refactor.md](.serena/memories/v4-utterance-pipeline-refactor.md).

8. **Visualization** — Waveform uses fixed gain and clamp (no amplitude jumps); mel heatmap uses GoldWave-style colormap (black to red). LayeredBufferVisualizer in debug panel; segment markers synced via `bufferEndTime`.

9. **Canvas waveform** — Waveform component reimplemented from 32 DOM bars to a single canvas renderer; removes 60fps layout/paint cost that was the top CPU hotspot in traces.

10. **Zero-allocation buffer reads** — RingBuffer exposes `readInto(target)` to fill a pre-allocated buffer; waveform and visualizers reuse buffers and pre-allocated ImageData for spectrogram to reduce GC and main-thread cost.

11. **ResizeObserver cache** — Replaced per-frame `getBoundingClientRect()` with a ResizeObserver-backed size cache to avoid forced reflows during animation.

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev          # HTTPS dev server (for microphone access)
npm run dev:local    # HTTP on localhost:3100 (faster, local-only)
```

### Testing

```bash
npm test             # Run all tests (~116; Vitest pool: forks)
npm run test:watch   # Watch mode
```

### Production Build

```bash
npm run build
npm run serve        # Preview production build
```

---

## Test Suite

The project includes comprehensive tests for mel processing, v4 pipeline, and workers (116 tests, 10 files). Run: `npm test -- --run`. See [.serena/memories/v4-test-suite.md](.serena/memories/v4-test-suite.md) for v4 test details. UI performance fixes (e.g. canvas waveform, issue #1) are documented in [.gh-issues/](.gh-issues/).

| Test File | Scope | Description |
|---|---|---|
| `mel-math.test.ts` | Unit | Mel computation (FFT, filterbank, normalization); 37 tests |
| `mel.worker.test.ts` | Integration | Mel worker load and message handling; 9 tests |
| `mel-e2e.test.ts` | E2E | Real WAV + ONNX reference cross-validation; 13 tests |
| `preprocessor-selection.test.ts` | Unit | Preprocessor selection (nemo128.onnx skipped when backend=js); 12 tests |
| `VADRingBuffer.test.ts` | Unit | VAD ring buffer write/read, hasSpeech, silence tail, reset; 15 tests |
| `buffer.worker.test.ts` | Integration | BufferWorker INIT, HAS_SPEECH, GET_SILENCE_TAIL, RESET (v4 layers); 6 tests |
| `energy-calculation.test.ts` | Unit | Peak + 6-sample SMA energy (VAD fix); 4 tests |
| `WindowBuilder.test.ts` | Unit | WindowBuilder with mock ring buffer; 11 tests |
| `tenvad.worker.test.ts` | Integration | TEN-VAD worker INIT, RESET, PROCESS; 4 tests |
| `TenVADWorkerClient.test.ts` | Unit | TenVADWorkerClient ready state, init reject, dispose; 5 tests |

### Key Validations

- **Mel filterbank** matches ONNX reference within `2.6e-7` max error
- **Full mel pipeline** matches ONNX within `3.6e-4` max error, `1.1e-5` mean error
- **Real audio** (life_Jim.wav): 254 frames from 2.54s speech processed at **120x realtime**
- **Preprocessor selection**: `nemo128.onnx` correctly skipped when `preprocessorBackend='js'`
- **Determinism**: identical input always produces identical features
- **v4**: VADRingBuffer, BufferWorker, WindowBuilder, TEN-VAD worker/client, energy (peak+SMA) covered

---

## Project Structure

```
src/
├── App.tsx                              # Main app: v4 pipeline orchestration (v4Tick, toggleRecording)
├── lib/
│   ├── audio/
│   │   ├── AudioEngine.ts               # Mic capture, resample 16kHz, onAudioChunk to mel/VAD/buffer
│   │   ├── AudioSegmentProcessor.ts     # Speech onset/offset (energy VAD)
│   │   ├── mel.worker.ts                # Continuous mel producer (Web Worker)
│   │   ├── MelWorkerClient.ts           # Client for mel worker
│   │   ├── mel-math.ts, RingBuffer.ts   # Mel math + ring buffer
│   │   ├── *.test.ts                    # mel-math, mel.worker, mel-e2e, energy-calculation
│   │   └── index.ts
│   ├── buffer/
│   │   ├── buffer.worker.ts             # Multi-layer store (audio, mel, energyVad, inferenceVad)
│   │   ├── BufferWorkerClient.ts        # Client; fire-and-forget writes, promise reads
│   │   ├── buffer.worker.test.ts
│   │   └── types.ts
│   ├── vad/
│   │   ├── tenvad.worker.ts             # TEN-VAD WASM worker
│   │   ├── TenVADWorkerClient.ts        # Client for TEN-VAD
│   │   ├── HybridVAD.ts, EnergyVAD.ts  # Energy-based VAD
│   │   ├── VADRingBuffer.ts            # VAD ring buffer (v4 support)
│   │   ├── *.test.ts                   # VADRingBuffer, tenvad.worker, TenVADWorkerClient
│   │   └── types.ts
│   ├── transcription/
│   │   ├── ModelManager.ts              # Parakeet.js model lifecycle
│   │   ├── TokenStreamTranscriber.ts    # Streaming merge (legacy)
│   │   ├── WindowBuilder.ts             # Cursor-based window (v4)
│   │   ├── UtteranceBasedMerger.ts      # Sentence finalization (v4)
│   │   ├── SentenceBoundaryDetector.ts  # wink-nlp sentence detection
│   │   ├── TranscriptionWorkerClient.ts # Client for inference worker (v4 API)
│   │   ├── transcription.worker.ts      # Inference Web Worker (v4 handlers)
│   │   ├── WindowBuilder.test.ts, preprocessor-selection.test.ts
│   │   └── types.ts
│   └── model/
│       └── ModelService.ts              # Model loading/sideloading
├── components/
│   ├── LayeredBufferVisualizer.tsx      # Mel heatmap + waveform (debug panel)
│   ├── BufferVisualizer.tsx, Waveform.tsx, DebugPanel.tsx, ...
│   └── index.ts
└── stores/
    └── appStore.ts                     # SolidJS state (v4: matureText, immatureText, vadState, ...)
```

---

## Technology Stack

| Component | Technology |
|---|---|
| **UI Framework** | SolidJS |
| **Build Tool** | Vite |
| **Styling** | Tailwind CSS |
| **ASR Engine** | [Parakeet.js](https://github.com/ysdede/parakeet.js) (ONNX Runtime Web) |
| **GPU Inference** | WebGPU (encoder) + WASM (decoder) |
| **Mel Spectrogram** | Pure JavaScript (validated against NeMo ONNX) |
| **VAD** | HybridVAD (energy: peak + 6-sample SMA); optional TEN-VAD WASM ([ten-vad](https://github.com/TEN-framework/ten-vad)) |
| **Sentence detection** | wink-nlp + wink-eng-lite-web-model |
| **Testing** | Vitest + @vitest/web-worker + happy-dom (pool: forks) |
| **Audio** | Web Audio API + AudioWorklet |

---

## Deployment

Build the `dist` folder and deploy to any static host (Netlify, Vercel, GitHub Pages, etc.):

```bash
npm run build
```

The app is fully client-side — no server required for transcription.

---

## Documentation and Context

| Doc | Description |
|-----|-------------|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Per-utterance vs NeMo streaming; VAD and audio flow |
| [docs/mel-worker-architecture.md](docs/mel-worker-architecture.md) | Mel worker pipeline, performance optimizations, test infra |
| [PROJECT_MEMORY.md](PROJECT_MEMORY.md) | High-level decisions and Serena/agent context (Serena MCP configured) |
| [LOCAL_DEV_SETUP.md](LOCAL_DEV_SETUP.md) | Local parakeet.js source for development |
| [GEMINI.md](GEMINI.md) | Project context for Gemini (stack, commands, architecture phase) |
| [MULTI_AGENT_SETUP.md](MULTI_AGENT_SETUP.md) | Multi-agent and Cursor/Serena setup |
| [AGENTS.md](AGENTS.md) | Available skills and agent usage |

**Serena memories** (`.serena/memories/`): [v4-utterance-pipeline-refactor.md](.serena/memories/v4-utterance-pipeline-refactor.md) (v4 BufferWorker, TEN-VAD, WindowBuilder, data flow), [v4-test-suite.md](.serena/memories/v4-test-suite.md) (v4 and recent-feature test files), [boncukjs-implementation-status.md](.serena/memories/boncukjs-implementation-status.md) (implementation status, performance results, known issues), [waveform-optimization.md](.serena/memories/waveform-optimization.md) (canvas/single-pass waveform), [visualization-fixes.md](.serena/memories/visualization-fixes.md) (segment marking, single-pass drawing), [mel-producer-architecture.md](.serena/memories/mel-producer-architecture.md), [preprocessing-optimization.md](.serena/memories/preprocessing-optimization.md), [synchronization-fix.md](.serena/memories/synchronization-fix.md), [vad-correction-peak-energy.md](.serena/memories/vad-correction-peak-energy.md).

**Tracked issues** (`.gh-issues/`): [#1 Waveform animate hotspot](.gh-issues/issue-1-waveform-animate-hotspot.md) (fixed: canvas renderer), [#2 scrollToBottom forced reflows](.gh-issues/issue-2-scrollToBottom-forced-reflows.md), [#3 RunMicrotasks spike](.gh-issues/issue-3-runmicrotasks-spike.md), [#4 Worker message overhead](.gh-issues/issue-4-worker-message-overhead.md).
