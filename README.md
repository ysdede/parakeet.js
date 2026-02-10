# Parakeet.js

[Live Demo](https://ysdede.github.io/parakeet.js/) | [NPM Package](https://www.npmjs.com/package/parakeet.js)

![Real-time transcription with Parakeet.js](https://raw.githubusercontent.com/ysdede/boncukjs/refs/heads/master/public/img/streaming-preview.jpg)

Browser-based speech-to-text using NVIDIA Parakeet models. Runs entirely client-side on **WebGPU** or **WASM** via [ONNX Runtime Web](https://onnxruntime.ai/).

**Key features:**
- Pure JavaScript mel spectrogram preprocessor with incremental caching for real-time streaming
- Parallel preprocessing support via worker threads and `precomputedFeatures` direct-feed path
- Stateful chunked inference with cached decoder state for low-latency applications

### Features in detail

- **Decoder state caching and reuse**: Incremental decoder cache stores LSTM state at the prefix boundary (keyed by `cacheKey`); the next call with the same key restores state and skips decoding the overlapping prefix (~80% decoder time savings for typical overlap). Chunk-to-chunk streaming uses `previousDecoderState` / `returnDecoderState` with snapshot/restore so decoding continues without redoing the past. `StatefulStreamingTranscriber` uses this flow internally.
- **Mel and feature caching**: `IncrementalMelProcessor` caches raw mel frames. With `prefixSamples` only new frames are computed; the rest are reused (~60-70% preprocessing savings for overlapping streaming). Metrics can report `mel_cache: { cached_frames, new_frames }`.
- **Decoding speedups**: Zero-copy `subarray()` instead of `slice()` for token and duration logits in the hot path; systematic tensor disposal to avoid WASM/GPU growth; pre-allocated tensors for target, length, and encoder frame.
- **Preprocessor in a separate worker**: The library accepts precomputed mel features via `precomputedFeatures`. When your app runs mel in its own worker and passes that in, `transcribe()` skips built-in preprocessing (0 ms preprocessing in the main thread) and you get pipeline parallelism: mel in one worker, inference in another.

> **v1.2.0** | Parakeet-TDT v2 (English) and v3 (Multilingual, 13 languages)

---

## What's New in v1.2.0 (Stateful Streaming & Runtime Improvements)

### Stateful Streaming API
- **New `StatefulStreamingTranscriber` class**: Provides a high-level API for processing sequential audio chunks without custom stitching logic.
- Maintains decoder state between chunks for seamless, high-quality continuation.
- Zero redundant audio processing (no overlapping windows needed).

### Improved Developer Experience
- **Static Import Refactoring**: Switched to static top-level imports in `src/index.js` for better bundler compatibility and IDE support.
- **Subpath Exports**: Import only what you need (e.g., `parakeet.js/parakeet`, `parakeet.js/hub`) for smaller bundle footprints.
- **Enhanced Demo**: Version display for both the library and ORT-web, plus real-time profiling toggles.

### Performance & Stability
- **Tensor Disposal**: Systematic `dispose()` calls for all per-call ORT tensors (input, encoder output, joiner logits, decoder state) to prevent WASM/GPU memory leaks on repeated calls.
- **Array Slicing Optimization**: Replaced `slice()` with `subarray()` in the decoding loop (~22x faster for logit extraction).
- **LRU Cache Eviction**: Added `maxIncrementalCacheSize` to prevent unbounded memory growth during long sessions.
- **Dynamic ORT Versioning**: Automatically derives the CDN URL for WASM binaries from the active runtime version.

### Backward Compatibility
- **`enableProfiling` defaults to `true`**: `result.metrics` is populated by default, matching v1.1.x behavior. Set `enableProfiling: false` to disable metric collection and get `metrics: null`.

### Implementation Update: Streaming Inference and Parallel Preprocessing
- **Parakeet TDT v3 support**: The current pipeline supports Parakeet-TDT v3 for multilingual speech-to-text with improved throughput and decoding quality.
- **Cached decoder state for chunked inference**: Streaming calls can reuse decoder state between chunks (`previousDecoderState`, `returnDecoderState`, and incremental cache), reducing redundant compute and latency.
- **Parallel JavaScript preprocessing path**: Mel feature extraction can run in parallel workers, and `precomputedFeatures` enables a direct feature-feed path where `transcribe()` skips built-in preprocessing.
- **Near-zero preprocessing overhead path**: In real-time deployments that provide normalized mel features directly, preprocessing overhead can approach zero because inference reads precomputed feature buffers.
- **Stateful streaming is preferred**: `StatefulStreamingTranscriber` is the recommended high-level API for chunked, low-latency streaming.

---

## What's New in v1.1.0 (Preprocessing Optimization)

### Pure JS Mel Spectrogram -- Now Default
- **Pure JavaScript mel spectrogram is now the default** (`preprocessorBackend: 'js'`). Eliminates ONNX Runtime overhead and skips the ~5MB ONNX preprocessor model download.
- Matches NeMo's pipeline exactly (pre-emphasis, STFT, Slaney mel filterbank, log, normalization). Cross-validated against ONNX reference with max error < 4e-4.
- Switch back to ONNX with `preprocessorBackend: 'onnx'` in config.

### Incremental Mel Caching for Streaming
- `IncrementalMelProcessor` caches raw mel frames across overlapping streaming windows.
- Integrated into `transcribe()` via `prefixSamples` option. For typical 70% overlap: ~60-70% preprocessing savings.
- Exact numerical match with full computation.
- Call `model.resetMelCache()` when starting a new recording session.

### Other Changes
- **Runtime preprocessor switching**: `model.setPreprocessorBackend('js' | 'onnx')` and `model.getPreprocessorBackend()`.
- **Preprocessor warm-up**: Runs automatically during `fromUrls()` model loading.
- **Known issue**: Some ONNX preprocessor model artifacts in external repos may use older preprocessing logic. The default JS preprocessor implements the corrected version.

---

## What's New in v1.0.0

**First stable release with NeMo-aligned accuracy and multilingual support.**

### NeMo-Aligned TDT Decoding (Critical Accuracy Fix)
- **100% Parity with NVIDIA NeMo**: Aligned the JavaScript TDT decoding loop with the original Python reference implementation.
- **Fixed "Missing Words" Bug**: Resolved an issue where multi-token emissions from a single frame were being skipped due to incorrect frame advancement.
- **Conditional State Updates**: Decoder state now correctly updates only upon non-blank token emission, matching the official transducer algorithm.
- **Dynamic Vocabulary Mapping**: Replaced hardcoded blank IDs with dynamic lookup from the model's vocabulary.

### Parakeet TDT v3 Multilingual Support
- Added support for **Parakeet TDT 0.6B v3** with 13 languages: English, French, German, Spanish, Italian, Portuguese, Dutch, Polish, Russian, Ukrainian, Japanese, Korean, Chinese.
- Both v2 (English-only) and v3 (Multilingual) models now work out of the box.
- New Model Configuration API for programmatic access to model metadata and language support.

### Enhanced Developer Experience
- **Model Configuration API**: Query supported languages and model metadata programmatically.
- **Improved Demo UI**: Modern design with automatic dark mode support.
- **Speech Dataset Testing**: Integration with HuggingFace datasets for quick validation.
- **Audio Playback**: Listen to loaded test samples directly in the demo.

### Performance and Stability
- Incremental transcription capabilities for real-time applications.
- Optimized state snapshots for low-latency prefix caching.
- Stable core API.

---

## Installation

```bash
# npm
npm i parakeet.js

# yarn
yarn add parakeet.js
```

`onnxruntime-web` is bundled as a dependency and supplies the runtime back-ends (WebGPU, WASM).

---

## Model assets

We host ready-to-use ONNX exports on the HuggingFace Hub:

| Model | Languages | Repo ID |
|-------|-----------|---------|
| Parakeet TDT 0.6B v2 | English | `istupakov/parakeet-tdt-0.6b-v2-onnx` |
| Parakeet TDT 0.6B v3 | 13 languages | `istupakov/parakeet-tdt-0.6b-v3-onnx` |

The helper `getParakeetModel()` downloads all required files and caches them in **IndexedDB**:

```js
import { getParakeetModel, MODELS } from 'parakeet.js';

// Option 1: Use model key (recommended)
const { urls, filenames, modelConfig } = await getParakeetModel('parakeet-tdt-0.6b-v3', {
  backend: 'webgpu',
  progress: ({file,loaded,total}) => console.log(file, loaded/total)
});

// Option 2: Use repo ID directly
const { urls, filenames } = await getParakeetModel('istupakov/parakeet-tdt-0.6b-v2-onnx', {
  backend: 'webgpu',
  encoderQuant: 'fp32',
  decoderQuant: 'int8',
  preprocessor: 'onnx-preprocessor',
});
```

Returned structure:

```ts
{
  urls: {
    encoderUrl: string,
    decoderUrl: string,
    encoderDataUrl?: string | null,
    decoderDataUrl?: string | null,
    tokenizerUrl: string,
    preprocessorUrl: string
  },
  filenames: { encoder: string; decoder: string }
}
```

---

## Creating a model instance

```js
import { ParakeetModel } from 'parakeet.js';

const model = await ParakeetModel.fromUrls({
  ...urls,                 // spread the URLs returned above
  filenames,               // needed for external .data mapping
  backend: 'webgpu',       // 'webgpu' or 'wasm'
  cpuThreads: 6,           // For WASM backend
  verbose: false,          // ORT verbose logging
});
```

If you want smaller startup in non-bundled ESM environments, import only what you need via subpath exports:

```js
import { ParakeetModel } from 'parakeet.js/parakeet';
// or: import { fromHub } from 'parakeet.js/hub';
```

### Quick Start: English Model (v2)

```js
import { fromHub } from 'parakeet.js';

// Load English-only model
const model = await fromHub('parakeet-tdt-0.6b-v2', {
  backend: 'webgpu',
  progress: ({ file, loaded, total }) => {
    console.log(`${file}: ${Math.round(loaded/total*100)}%`);
  }
});

// Transcribe audio
const result = await model.transcribe(pcmFloat32, 16000);
console.log(result.utterance_text);
```

### Quick Start: Multilingual Model (v3)

```js
import { fromHub } from 'parakeet.js';

// Load multilingual model (supports 13 languages)
const model = await fromHub('parakeet-tdt-0.6b-v3', {
  backend: 'webgpu'
});

// Works with any supported language automatically
const frenchResult = await model.transcribe(frenchAudio, 16000);
const germanResult = await model.transcribe(germanAudio, 16000);
```

### Back-end presets

The library supports two primary backends: `webgpu` and `wasm`.

- **`webgpu` (Default):** This is the fastest option for modern desktop browsers. It runs in a hybrid configuration:
  - The heavy **encoder** model runs on the **GPU** (WebGPU) for maximum throughput.
  - The **decoder** model runs on the **CPU** (WASM). The decoder's architecture contains operations not fully supported by the ONNX Runtime WebGPU backend, causing it to fall back to WASM anyway. This configuration makes the behavior explicit and stable, avoiding performance issues and warnings.
  - In this mode, the encoder must be `fp32`, but you can choose `fp32` or `int8` for the decoder.

- **`wasm`:** Both encoder and decoder run on the CPU. This is best for compatibility with older devices or environments without WebGPU support. Both models can be `fp32` or `int8`.


---

## Transcribing audio

```js
// 16-kHz mono PCM Float32Array
await model.transcribe(pcmFloat32, 16_000, {
  returnTimestamps: true,
  returnConfidences: true,
  frameStride: 2,      // 1 (default) = highest accuracy / 2-4 faster
});
```

Extra options:

| Option | Default | Description |
|--------|---------|-------------|
| `temperature` | 1.0 | Softmax temperature for decoding (1.0 = greedy, >1.0 = sampling) |
| `frameStride` | 1 | Advance decoder by *n* encoder frames per step |
| `enableProfiling` | true | Collect timing metrics and populate `result.metrics`. Set to `false` to disable. |
| `returnLogProbs` | false | Return per-token log probabilities |
| `timeOffset` | 0 | Time offset (seconds) to add to all timestamps |
| `prefixSamples` | 0 | Number of overlapping prefix samples for incremental mel caching |
| `precomputedFeatures` | null | Pre-computed mel features (see [Streaming with Pre-computed Features](#streaming-with-pre-computed-features)) |
| `incremental` | null | Incremental decoder cache config (see [Incremental Decoder Cache](#incremental-decoder-cache)) |

### Streaming with Pre-computed Features

For streaming applications that compute mel spectrograms in a separate worker, you can bypass the built-in preprocessor entirely:

```js
const result = await model.transcribe(null, 16000, {
  precomputedFeatures: {
    features: melFloat32Array,  // [T * melBins] row-major Float32Array
    T: 500,                     // number of time frames
    melBins: 128                // number of mel bands
  }
});
```

When `precomputedFeatures` is provided:
- The audio parameter can be `null` (audio is not needed)
- The built-in preprocessor (JS or ONNX) is completely skipped
- Features must be normalized (zero mean, unit variance per feature)
- This enables **pipeline parallelism**: compute mel in one worker, run inference in another

### Incremental Decoder Cache

For overlapping streaming windows, the decoder can cache its state to avoid re-decoding the overlapping prefix:

```js
const result = await model.transcribe(audio, 16000, {
  incremental: {
    cacheKey: 'stream-1',     // unique key for this stream
    prefixSeconds: 3.5        // seconds of overlap to cache
  },
  timeOffset: windowStartTime  // adjust timestamps for the window position
});
```

The cache stores decoder state at the prefix boundary. On the next call with the same `cacheKey`, frames up to `prefixSeconds` are skipped, reducing decoder time by **~80%** for typical overlap ratios.

You can tune the cache size with `maxIncrementalCacheSize` (default `50`) when constructing the model. Increase it for many concurrent streams to avoid LRU evictions; in `debug` mode, evictions are logged to help with tuning.

Call `model.clearIncrementalCache()` when starting a new recording session.

### Result schema

```ts
{
  utterance_text: string,
  words: Array<{text,start_time,end_time,confidence}>,
  tokens: Array<{token,start_time,end_time,confidence}>,
  confidence_scores: { overall_log_prob, word_avg, token_avg },
  metrics: {               // null when enableProfiling: false
    rtf: number,
    total_ms: number,
    preprocess_ms: number,
    encode_ms: number,
    decode_ms: number,
    tokenize_ms: number
  } | null,
  is_final: boolean
}
```

---

## Warm-up & Verification (Recommended)

The first time you run inference after loading a model, the underlying runtime needs to compile the execution graph. This makes the first run significantly slower. To ensure a smooth user experience, it's best practice to perform a "warm-up" run with a dummy or known audio sample immediately after model creation.

Our React demo does this and also verifies the output to ensure the model loaded correctly.

```js
// In your app, after `ParakeetModel.fromUrls()` succeeds:
setStatus('Warming up & verifying…');

const audioRes = await fetch('/assets/known_audio.wav');
const pcm = await decodeAudio(audioRes); // Your audio decoding logic
const { utterance_text } = await model.transcribe(pcm, 16000);

const expected = 'the known transcript for your audio';
if (utterance_text.toLowerCase().includes(expected)) {
  setStatus('Model ready ✔');
} else {
  setStatus('Model verification failed!');
}
```

---

## Runtime tuning knobs

| Property | Where | Effect |
|----------|-------|--------|
| `cpuThreads` | `fromUrls()` | Sets `ort.env.wasm.numThreads`; pick *cores-2* for best balance |
| `encoderQuant` | `getParakeetModel()` | Selects `fp32` or `int8` model for the encoder |
| `decoderQuant` | `getParakeetModel()` | Selects `fp32` or `int8` model for the decoder |
| `preprocessorBackend` | `getParakeetModel()` / `fromUrls()` | `'js'` (default) uses pure JS mel; `'onnx'` uses the ONNX preprocessor path |
| `frameStride` | `transcribe()` | Trade-off latency vs accuracy |
| `precomputedFeatures` | `transcribe()` | Bypass preprocessor with external mel features |
| `enableProfiling` | `transcribe()` | Populates `result.metrics` with timing data (default `true`). Set `false` to skip metric collection. |
| `enableProfiling` | `fromUrls()` | Enables ORT session profiler (JSON written to `/tmp/profile_*.json`; default `false`) |

---

## Model Configuration API

Query model metadata programmatically:

```js
import { MODELS, LANGUAGE_NAMES, getModelConfig, supportsLanguage } from 'parakeet.js';

// List all available models
console.log(Object.keys(MODELS)); 
// ['parakeet-tdt-0.6b-v2', 'parakeet-tdt-0.6b-v3']

// Get model config
const config = getModelConfig('parakeet-tdt-0.6b-v3');
console.log(config.languages); // ['en', 'fr', 'de', 'es', ...]
console.log(config.displayName); // 'Parakeet TDT 0.6B v3 (Multilingual)'

// Check language support
supportsLanguage('parakeet-tdt-0.6b-v3', 'fr'); // true
supportsLanguage('parakeet-tdt-0.6b-v2', 'fr'); // false

// Get language display names
console.log(LANGUAGE_NAMES['fr']); // 'French'
```

---

## Using the React Demo

The library includes a unified demo application:

```
examples/demo/          # React demo with switchable source
```

### Quick Start

```bash
cd examples/demo
npm install

# Test with local source files (for library development)
npm run dev:local

# Test with npm package (simulates end-user experience)
npm run dev
```

The demo runs at `http://localhost:3000/` with CORS headers enabled for SharedArrayBuffer support.

### Deployment

```bash
# Deploy to HuggingFace Spaces
npm run deploy-to-hf

# Deploy to GitHub Pages (via GitHub Actions)
gh workflow run deploy-gh-pages.yml
```

### Demo Features

All demos share the same modern UI with:

- **Model Selector**: Switch between v2 (English) and v3 (Multilingual)
- **Language Selector**: Context-aware dropdown showing only supported languages
- **Quick Test**: Load random samples from HuggingFace speech datasets
- **Reference Text**: Compare transcription against ground truth
- **Dark Mode**: Automatic theme toggle
- **Version Display**: Shows the active `parakeet.js` version/source and the loaded `onnxruntime-web` runtime version

### Speech Dataset Utilities (Demo Only)

The demo includes reusable utilities for testing with HuggingFace datasets:

```js
// Located in: examples/react-demo-dev/src/utils/speechDatasets.js
import { fetchRandomSample, hasTestSamples, SPEECH_DATASETS } from './utils/speechDatasets';

// Check if test samples are available for a language
if (hasTestSamples('fr')) {
  // Fetch a random French audio sample with transcription
  const sample = await fetchRandomSample('fr', {
    targetSampleRate: 16000,
    onProgress: ({ message }) => console.log(message),
  });
  
  console.log(sample.transcription); // Ground truth text
  console.log(sample.pcm);           // Float32Array audio
  console.log(sample.duration);      // Duration in seconds
}
```

**Supported languages for testing:** English (People's Speech), French, German, Spanish, Italian, Portuguese, Dutch, Polish (Multilingual LibriSpeech)

### Key Files

| File | Purpose |
|------|---------|
| `App.jsx` | Complete end-to-end reference UI with model/language selection, performance metrics, and transcription history |
| `utils/speechDatasets.js` | Reusable utilities for fetching test samples from HuggingFace datasets |

Copy-paste the `loadModel()` and `transcribeFile()` functions into your app, adjust UI bindings, and you are ready to go.

---

## Testing

The library includes a Vitest test suite (79 tests across 6 suites):

```bash
npm test          # Run all tests once
npm run test:watch  # Watch mode
```

### Test Suites

| Suite | Tests | Description |
|---|---|---|
| `mel.test.mjs` | 39 | Mel constants, filterbank, FFT, JsPreprocessor, IncrementalMelProcessor, ONNX cross-validation |
| `preprocessor-selection.test.mjs` | 16 | Hub file selection logic, fromUrls preprocessor creation, default config |
| `precomputed-features.test.mjs` | 15 | Feature format, audioDur computation, edge cases, integration |
| `transcribe_perf.test.mjs` | 5 | Profiling/metrics behavior, tensor disposal verification |
| `incremental_cache_fix.test.mjs` | 2 | LRU incremental decoder cache, cache clearing |
| `index.test.mjs` | 2 | Top-level `fromUrls` and `fromHub` exports |

---

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `Some nodes were not assigned...` warning | When using the `webgpu` backend, ORT assigns minor operations (`Shape`, `Gather`, etc.) in the encoder to the CPU for efficiency. | This is expected and harmless. The heavy-lifting is still on the GPU. |
| GPU memory still ~2.4 GB with INT8 selected | In WebGPU mode, the encoder must be `fp32`. The `int8` option only applies to the WASM backend or the decoder in hybrid mode. | This is the expected behavior for the `webgpu` backend. |
| `Graph capture feature not available` error | Mixed EPs (CPU/GPU) or unsupported ops prevent GPU graph capture. | The library automatically retries without capture; safe to ignore. |

---

## Changelog

### v1.2.0 (February 2026) -- Stateful Streaming and Runtime Improvements

- **`StatefulStreamingTranscriber`**: High-level API for processing sequential audio chunks with automatic decoder state management.
- **Tensor Disposal**: Systematic `dispose()` calls for all per-call ORT tensors to prevent WASM/GPU memory leaks.
- **`enableProfiling` backward compat**: Defaults to `true` so `result.metrics` is populated by default (matching v1.1.x). Set `false` to disable.
- **Static Import Refactor**: `src/index.js` uses static top-level imports for better bundler compatibility.
- **Subpath Exports**: Import specific modules (e.g., `parakeet.js/parakeet`) for smaller bundles.
- **Array Slicing Optimization**: `subarray()` replaces `slice()` in the decode loop.
- **Incremental Cache LRU**: `maxIncrementalCacheSize` (default 50) prevents unbounded memory growth.
- **Dynamic ORT Versioning**: WASM CDN paths derived automatically from the active runtime.

### v1.1.1 (February 2026) -- Streaming Enhancements & Test Suite

- **`precomputedFeatures` option**: `transcribe()` accepts pre-computed mel spectrograms, bypassing the built-in preprocessor.
- **Conditional ONNX loading**: `fromUrls()` and `getParakeetModel()` skip the ONNX preprocessor model when `preprocessorBackend: 'js'` (~5MB saved).
- **`timeOffset` bugfix**: Fixed `effectiveTimeOffset` in incremental decoder cache path.
- **Vitest test suite**: Automated tests for mel accuracy, preprocessor selection, and feature format.
- **New exports**: `hzToMel`, `melToHz` from `mel.js`.

### v1.0.0 (January 2026)
**First stable release**

- **Accuracy Alignment**: Critical fix for TDT decoding loop to match NVIDIA NeMo parity.
- **Multi-token Fix**: Resolved bug skipping tokens emitted from the same encoder frame.
- **Space Normalization**: Improved SentencePiece decoding regex for better punctuation spacing.
- **Dynamic Blank ID**: Automatic detection of blank token index from model vocabulary.
- **Multilingual Support**: Added Parakeet TDT 0.6B v3 with 13 languages.
- **Model Config API**: New `MODELS`, `LANGUAGE_NAMES`, `getModelConfig()`, `supportsLanguage()` exports.
- **Demo Enhancements**: Modern UI with dark mode, model/language selectors, HuggingFace dataset testing.
- **Streaming Support**: Incremental transcription capabilities for real-time applications.

### v0.4.x
- Accuracy improvements and multilingual foundation

### v0.3.x
- Initial multilingual experiments

### v0.2.x
- Initial WebGPU/WASM hybrid backend
- IndexedDB model caching
- Performance instrumentation (RTF, timing metrics)

---

## Credits

This project builds upon the excellent work of:

- **[istupakov](https://github.com/istupakov)** - For providing the [ONNX-ASR](https://github.com/istupakov/onnx-asr) repository, which served as the foundation and starting point for this JavaScript implementation

The Python-based ONNX-ASR project provided crucial insights into model handling, preprocessing pipelines, and served as a reference implementation during the development of this browser-compatible version.

Happy hacking!
