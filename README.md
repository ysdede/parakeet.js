# Parakeet.js  

**[▶️ Try the Live Demo](https://ysdede.github.io/parakeet.js/)** | [NPM Package](https://www.npmjs.com/package/parakeet.js)

Client-side ONNX inference of NVIDIA *Parakeet* speech-to-text models.
Runs entirely in the browser on **WebGPU** or **WASM** via
[ONNX Runtime Web](https://onnxruntime.ai/).

> **Parakeet.js** offers a high-performance, browser-first implementation for NVIDIA's Parakeet-TDT speech-to-text models, running entirely client-side via WebGPU and WASM. Powered by ONNX Runtime Web, this library makes it simple to integrate state-of-the-art transcription into any web application.

> **Status:** Stable v1.1.0 release - Production ready
> **Supported Models:** Parakeet-TDT v2 (English) and v3 (Multilingual - 13 languages)

---

## What's New in v1.1.0 (Preprocessing Optimization)

### Pure JS Mel Spectrogram — Now Default
- **Pure JavaScript mel spectrogram computation is now the default** (`preprocessorBackend: 'js'`).
- Eliminates ONNX Runtime overhead for preprocessing (no session creation, tensor allocation, WASM bridge).
- **Skips preprocessor ONNX download** — one fewer file to download from HuggingFace Hub.
- Validated against ONNX reference: max absolute error < 4e-4, mean error < 1e-5 across all test signals.
- Switch back to ONNX with `preprocessorBackend: 'onnx'` in config.

### Incremental Mel Caching for Streaming
- `IncrementalMelProcessor` caches raw mel frames across overlapping streaming windows.
- **Integrated into `transcribe()` via `prefixSamples` option** — streaming callers pass the overlap sample count and mel frames are reused automatically.
- For typical 70% overlap scenarios: **reuses ~350 cached frames, computes only ~150 new frames** (~60-70% preprocessing savings).
- Exact numerical match with full computation (zero error vs non-incremental path).
- Call `model.resetMelCache()` when starting a new recording session.

### Runtime Preprocessor Switching
- New `model.setPreprocessorBackend('js' | 'onnx')` to switch preprocessors at runtime.
- New `model.getPreprocessorBackend()` to query the active backend.
- Both backends are available when model is loaded with `preprocessorUrl`.

### Preprocessor Warm-up
- JS/ONNX preprocessor warms up automatically during `fromUrls()` model loading.
- Eliminates first-call latency (~100-200ms for ONNX session creation).

### Model Repository Update
- Default v2 model now points to `ysdede/parakeet-tdt-0.6b-v2-onnx` with corrected ONNX preprocessing.

### Known Issue: nemo128.onnx Version
- The `nemo128.onnx` in some HuggingFace model repos may use an older version from onnx-asr.
- Latest onnx-asr (Dec 2025+) includes a **correctness fix** (`features_lens` calculation), pre-emphasis time masking, and ONNX graph optimizations.
- **Recommendation**: Use the default JS preprocessor which implements the corrected algorithm.

---

## What's New in v1.0.0

**First stable release with production-ready accuracy and multilingual support.**

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
- Stable API suitable for production use.

---

## Installation

```bash
# npm
npm i parakeet.js onnxruntime-web

# yarn
yarn add parakeet.js onnxruntime-web
```

`onnxruntime-web` is a peer-dependency that supplies the runtime back-ends (WebGPU, WASM).

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
  preprocessor: 'nemo128',
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

### Result schema

```ts
{
  utterance_text: string,
  words: Array<{text,start_time,end_time,confidence}>,
  tokens: Array<{token,start_time,end_time,confidence}>,
  confidence_scores: { overall_log_prob, word_avg, token_avg },
  metrics: {
    rtf: number,
    total_ms: number,
    preprocess_ms: number,
    encode_ms: number,
    decode_ms: number,
    tokenize_ms: number
  },
  is_final: true
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
| `encoderQuant` | `getParakeetModel()` | Selects `fp32` or `int8` model for the encoder. |
| `decoderQuant` | `getParakeetModel()` | Selects `fp32` or `int8` model for the decoder. |
| `frameStride` | `transcribe()` | Trade-off latency vs accuracy |
| `enableProfiling` | `fromUrls()` | Enables ORT profiler (JSON written to `/tmp/profile_*.json`) |

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

## 🚀 Live Demo

Try the library instantly in your browser without any setup:

**[🦜 Parakeet.js Demo](https://ysdede.github.io/parakeet.js/)** | [🤗 HuggingFace Mirror](https://huggingface.co/spaces/ysdede/parakeet.js-demo)

Both links point to identical demos with the same features:

- **WebGPU/WASM backend selection** - Choose the best performance for your device
- **Multi-threaded WASM** - SharedArrayBuffer enabled for maximum CPU utilization
- **Real-time transcription** - Upload audio files and see instant results
- **Performance metrics** - View detailed timing information and RTF scores
- **Test samples** - Load random samples from HuggingFace speech datasets

### Deploy Your Own

```bash
cd examples/demo
npm install

# HuggingFace Spaces
npm run deploy-to-hf

# GitHub Pages (via GitHub Actions)
gh workflow run deploy-gh-pages.yml
```

See `examples/demo/README.md` for detailed deployment instructions.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `Some nodes were not assigned...` warning | When using the `webgpu` backend, ORT assigns minor operations (`Shape`, `Gather`, etc.) in the encoder to the CPU for efficiency. | This is expected and harmless. The heavy-lifting is still on the GPU. |
| GPU memory still ~2.4 GB with INT8 selected | In WebGPU mode, the encoder must be `fp32`. The `int8` option only applies to the WASM backend or the decoder in hybrid mode. | This is the expected behavior for the `webgpu` backend. |
| `Graph capture feature not available` error | Mixed EPs (CPU/GPU) or unsupported ops prevent GPU graph capture. | The library automatically retries without capture; safe to ignore. |

---

## Changelog

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

See `OPTIMIZATION_PLAN.md` for detailed performance notes.

---

## Credits

This project builds upon the excellent work of:

- **[istupakov](https://github.com/istupakov)** - For providing the [ONNX-ASR](https://github.com/istupakov/onnx-asr) repository, which served as the foundation and starting point for this JavaScript implementation
- **[istupakov/parakeet-tdt-0.6b-v2-onnx](https://huggingface.co/istupakov/parakeet-tdt-0.6b-v2-onnx)** - English model exports
- **[istupakov/parakeet-tdt-0.6b-v3-onnx](https://huggingface.co/istupakov/parakeet-tdt-0.6b-v3-onnx)** - Multilingual model exports
- **ONNX Runtime Web** - For powering the browser-based inference engine
- **HuggingFace Datasets** - People's Speech, Multilingual LibriSpeech for testing

The Python-based ONNX-ASR project provided crucial insights into model handling, preprocessing pipelines, and served as a reference implementation during the development of this browser-compatible version.

Happy hacking! 🎉