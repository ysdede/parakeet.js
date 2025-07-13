# Parakeet.js  

Client-side ONNX inference of NVIDIA *Parakeet* speech-to-text models.
Runs entirely in the browser on **WebGPU** or **WASM** via
[ONNX Runtime Web](https://onnxruntime.ai/).

> **Parakeet.js** offers a high-performance, browser-first implementation for NVIDIA's Parakeet-TDT speech-to-text models, running entirely client-side via WebGPU and WASM. Powered by ONNX Runtime Web, this library makes it simple to integrate state-of-the-art transcription into any web application.

> **Status:** Early preview – API is subject to change while things stabilise.
> **Note:** Currently only supports the Parakeet-TDT model architecture.

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

```
istupakov/parakeet-tdt-0.6b-v2-onnx
```

The helper `getParakeetModel()` downloads all required files and caches them in **IndexedDB**:

```js
import { getParakeetModel } from 'parakeet.js';

const repoId = 'istupakov/parakeet-tdt-0.6b-v2-onnx';
const { urls, filenames } = await getParakeetModel(repoId, {
  backend: 'webgpu-hybrid', // webgpu-hybrid | wasm
  quantization: 'fp32',     // fp32 | int8
  decoderInt8: true,        // load INT8 decoder even when encoder fp32
  preprocessor: 'nemo128',  // nemo128
  progress: ({file,loaded,total}) => console.log(file, loaded/total)
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
  filenames: { encoder: string; decoder: string },
  quantisation: { encoder: 'fp32' | 'int8'; decoder: 'fp32' | 'int8' }
}
```

---

## Creating a model instance

```js
import { ParakeetModel } from 'parakeet.js';

const model = await ParakeetModel.fromUrls({
  ...urls,                 // spread the URLs returned above
  filenames,               // needed for external .data mapping
  backend: 'webgpu-hybrid',
  decoderOnWasm: true,     // force decoder to CPU/WASM for micro-kernels
  decoderInt8: true,       // decoder uses INT8 weights
  cpuThreads: 6,           // WASM threads (defaults to cores-2)
  verbose: false           // ORT verbose log
});
```

### Back-end presets

| Backend string      | Encoder EP | Decoder EP | Typical use-case |
|---------------------|------------|------------|------------------|
| `webgpu-hybrid` (default) | WebGPU (fp32) | WASM (fp32/int8) | Modern desktop browsers |
| `webgpu-strict`    | WebGPU (fp32) | **fail** if op unsupported | Benchmarking kernels |
| `wasm`             | WASM (int8/fp32) | WASM | Low-end devices, Node.js |

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
| `temperature` | 1.2 | Softmax temperature for decoding |
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
| `decoderOnWasm` | `fromUrls()` | Forces decoder session to WASM even in hybrid mode |
| `decoderInt8` | `getParakeetModel()` + `fromUrls()` | Load INT8 weights for decoder only |
| `frameStride` | `transcribe()` | Trade-off latency vs accuracy |
| `enableProfiling` | `fromUrls()` | Enables ORT profiler (JSON written to `/tmp/profile_*.json`) |

---

## Using the React demo as a template

Located at `examples/react-demo`.

Quick start:

```bash
cd examples/react-demo
npm i
npm run dev  # Vite => http://localhost:5173
```

Key components:

| File | Purpose |
|------|---------|
| `App.jsx` | Complete end-to-end reference UI. Shows how to load a model with progress bars, perform a warm-up/verification step, display performance metrics (RTF, timings), and manage transcription history. |
| `parakeet.js` | Library entry; houses the model wrapper and performance instrumentation. |
| `hub.js` | Lightweight HuggingFace Hub helper – downloads and caches model binaries. |

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
| `multiple calls to initWasm()` | Two WASM sessions initialised in parallel | In hybrid mode we create encoder session first, then decoder. Keep this order. |
| GPU memory still ~2.4 GB with INT8 selected | WebGPU kernels don't support INT8 yet – weights are automatically converted to FP32 | Use `decoderInt8:true` (CPU) or wait for upcoming WebGPU INT8 kernels. |
| `Graph capture feature not available` error | Mixed EPs prevent GPU graph capture | We auto-retry without capture; nothing to do. |

---

## Changelog

See `OPTIMIZATION_PLAN.md` for a timeline of performance tweaks and planned features.

---

## Credits

This project builds upon the excellent work of:

- **[istupakov](https://github.com/istupakov)** - For providing the [ONNX-ASR](https://github.com/istupakov/onnx-asr) repository, which served as the foundation and starting point for this JavaScript implementation
- **[istupakov/parakeet-tdt-0.6b-v2-onnx](https://huggingface.co/istupakov/parakeet-tdt-0.6b-v2-onnx)** - For the ONNX model exports and preprocessor implementations that made this library possible.
- **ONNX Runtime Web** - For powering the browser-based inference engine
- **ONNX Runtime Node** - For enabling high-performance server-side inference

The Python-based ONNX-ASR project provided crucial insights into model handling, preprocessing pipelines, and served as a reference implementation during the development of this browser-compatible version.

Happy hacking! 🎉