# Boncuk.js

Real-time speech-to-text transcription in the browser, powered by [Parakeet.js](https://github.com/ysdede/parakeet.js).

## Overview

BoncukJS is a real-time speech-to-text transcription application built with SolidJS, Vite, and Tailwind CSS. It runs NVIDIA NeMo Parakeet TDT models directly in the browser using WebGPU/WASM via Parakeet.js — no backend required.

**Architecture:** Transcription uses **per-utterance** mode (VAD-defined segments, no cross-segment model state). See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for architecture decisions and NeMo streaming limitations.

### Key Features

- **Zero-backend transcription** — WebGPU/WASM inference runs entirely client-side
- **Real-time audio processing** — VAD-based speech detection with SNR-aware triggering
- **Pipeline-parallel mel preprocessing** — dedicated Web Worker for continuous mel spectrogram production
- **Pure JS mel spectrogram** — no ONNX preprocessor needed, validated against NeMo reference
- **Incremental decoder cache** — skip re-decoding overlapping prefix frames
- **Live transcription UI** — waveform visualization, SNR meter, debug panel with RTF/latency
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
  ├── AudioEngine → captures mic → 80ms PCM chunks
  │     ├── AudioWorklet → raw audio processing
  │     └── AudioSegmentProcessor → VAD / speech detection
  │
  ├── MelWorkerClient → sends audio to mel worker
  │
  └── TranscriptionWorkerClient → triggers inference

Mel Worker (Web Worker)
  └── Continuous mel spectrogram production
      ├── Pre-emphasis → STFT → Power → Mel filterbank → Log
      └── Raw mel frames stored in ring buffer
      └── On request: normalize window → return features

Inference Worker (Web Worker)
  ├── ModelManager → loads parakeet.js model (WebGPU/WASM)
  ├── TokenStreamTranscriber → streaming merge logic
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
npm test             # Run all 71 tests
npm run test:watch   # Watch mode
```

### Production Build

```bash
npm run build
npm run serve        # Preview production build
```

---

## Test Suite

The project includes comprehensive tests covering the mel processing pipeline:

| Test File | Tests | Description |
|---|---|---|
| `mel-math.test.ts` | 31 | Unit tests for mel computation functions (FFT, filterbank, normalization) |
| `mel.worker.test.ts` | 10 | Integration tests for mel worker loading and message handling |
| `mel-e2e.test.ts` | 10 | End-to-end tests with real WAV audio and ONNX reference cross-validation |
| `preprocessor-selection.test.ts` | 12 | Preprocessor selection logic (ensures nemo128.onnx is skipped when using JS) |

### Key Validations

- **Mel filterbank** matches ONNX reference within `2.6e-7` max error
- **Full mel pipeline** matches ONNX within `3.6e-4` max error, `1.1e-5` mean error
- **Real audio** (life_Jim.wav): 254 frames from 2.54s speech processed at **120x realtime**
- **Preprocessor selection**: `nemo128.onnx` correctly skipped when `preprocessorBackend='js'`
- **Determinism**: identical input always produces identical features

---

## Project Structure

```
src/
├── App.tsx                              # Main app: audio + mel worker + inference orchestration
├── lib/
│   ├── audio/
│   │   ├── AudioEngine.ts               # Mic capture, AudioWorklet, VAD
│   │   ├── AudioSegmentProcessor.ts     # Speech onset/offset detection
│   │   ├── mel.worker.ts               # Continuous mel spectrogram producer (Web Worker)
│   │   ├── MelWorkerClient.ts          # Client for mel worker
│   │   ├── mel-math.ts                 # Pure mel computation functions (testable)
│   │   ├── mel-math.test.ts            # Unit tests
│   │   ├── mel.worker.test.ts          # Worker integration tests
│   │   ├── mel-e2e.test.ts             # End-to-end tests with real audio
│   │   └── index.ts                    # Public exports
│   └── transcription/
│       ├── ModelManager.ts             # Parakeet.js model lifecycle
│       ├── TokenStreamTranscriber.ts   # Streaming transcription with LCS merging
│       ├── TranscriptionWorkerClient.ts # Client for inference worker
│       ├── transcription.worker.ts     # Inference Web Worker
│       └── preprocessor-selection.test.ts # Preprocessor logic tests
└── stores/
    └── appStore.ts                     # SolidJS reactive state
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
| **Testing** | Vitest + @vitest/web-worker + happy-dom |
| **Audio** | Web Audio API + AudioWorklet |

---

## Deployment

Build the `dist` folder and deploy to any static host (Netlify, Vercel, GitHub Pages, etc.):

```bash
npm run build
```

The app is fully client-side — no server required for transcription.
