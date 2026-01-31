# Parakeet.js  

Client-side ONNX inference of NVIDIA *Parakeet* speech-to-text models.
Runs entirely in the browser on **WebGPU** or **WASM** via
[ONNX Runtime Web](https://onnxruntime.ai/).

> **Parakeet.js** offers a high-performance, browser-first implementation for NVIDIA's Parakeet-TDT speech-to-text models, running entirely client-side via WebGPU and WASM. Powered by ONNX Runtime Web, this library makes it simple to integrate state-of-the-art transcription into any web application.

> **Status:** Early preview – API is subject to change while things stabilise.
> **Note:** Currently supports Parakeet-TDT v2 (English) and v3 (Multilingual) model architectures.

---

## What's New (v0.3.x)

### 🌐 Parakeet TDT v3 Multilingual Support
- Added support for **Parakeet TDT 0.6B v3** with 13 languages: English, French, German, Spanish, Italian, Portuguese, Dutch, Polish, Russian, Ukrainian, Japanese, Korean, Chinese
- Both v2 (English-only) and v3 (Multilingual) models now work out of the box
- Use model keys for easier loading: `'parakeet-tdt-0.6b-v2'` or `'parakeet-tdt-0.6b-v3'`

### 🎛️ Model Configuration API
- New `MODELS` export with model metadata (supported languages, vocab size, etc.)
- `getModelConfig()` for programmatic model introspection
- `supportsLanguage()` helper to check language compatibility

### 🧪 Demo App Improvements
- **Model selector** dropdown to switch between v2 and v3
- **Language selector** (context-aware, shows only supported languages)
- **Quick Test** feature with HuggingFace speech datasets (People's Speech, MLS)
- **Reference text** display for comparing transcription accuracy

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

## Using the React demo as a template

Located at `examples/react-demo` (production) and `examples/react-demo-dev` (development).

Quick start:

```bash
cd examples/react-demo-dev
npm i
npm run dev  # Vite => http://localhost:5173
```

### Demo Features

The development demo (`react-demo-dev`) includes advanced features:

- **Model Selector**: Switch between v2 (English) and v3 (Multilingual)
- **Language Selector**: Context-aware dropdown showing only supported languages
- **Quick Test**: Load random samples from HuggingFace speech datasets
- **Reference Text**: Compare transcription against ground truth

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

## 🚀 Live Demo on Hugging Face Spaces

Try the library instantly in your browser without any setup:

**🦜 [Parakeet.js Demo on HF Spaces](https://huggingface.co/spaces/ysdede/parakeet.js-demo)**

This demo showcases:
- **WebGPU/WASM backend selection** - Choose the best performance for your device
- **Real-time transcription** - Upload audio files and see instant results
- **Performance metrics** - View detailed timing information and RTF scores
- **Multi-threaded WASM** - Optimized for maximum performance
- **Complete feature set** - All library capabilities in one place

The demo is also available locally at `examples/hf-spaces-demo` and can be deployed to your own HF Space.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `Some nodes were not assigned...` warning | When using the `webgpu` backend, ORT assigns minor operations (`Shape`, `Gather`, etc.) in the encoder to the CPU for efficiency. | This is expected and harmless. The heavy-lifting is still on the GPU. |
| GPU memory still ~2.4 GB with INT8 selected | In WebGPU mode, the encoder must be `fp32`. The `int8` option only applies to the WASM backend or the decoder in hybrid mode. | This is the expected behavior for the `webgpu` backend. |
| `Graph capture feature not available` error | Mixed EPs (CPU/GPU) or unsupported ops prevent GPU graph capture. | The library automatically retries without capture; safe to ignore. |

---

## Changelog

### v0.3.x (January 2026)
- ✨ **Multilingual Support**: Added Parakeet TDT 0.6B v3 with 13 languages
- 🎛️ **Model Config API**: New `MODELS`, `LANGUAGE_NAMES`, `getModelConfig()`, `supportsLanguage()` exports
- 🧪 **Demo Enhancements**: Model/language selectors, HuggingFace dataset testing
- 🔧 **TDT Decoding Fix**: Aligned decoding logic with NeMo framework for improved accuracy
- 🌊 **Streaming Support**: Added incremental transcription capabilities

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