# Parakeet.js

[Live Demo](https://ysdede.github.io/parakeet.js/) | [Keet](https://ysdede.github.io/keet/) | [NPM](https://www.npmjs.com/package/parakeet.js) | [API Docs](https://ysdede.github.io/parakeet.js/api/)

Browser speech-to-text for NVIDIA Parakeet ONNX models.

`parakeet.js` runs fully in the browser with `onnxruntime-web`. It can use WebGPU for the encoder and WASM for the decoder, so apps can transcribe audio without sending it to a server.

## Install

```bash
npm i parakeet.js
```

## Quick Start

```js
import { fromHub } from 'parakeet.js';

const model = await fromHub('parakeet-tdt-0.6b-v3', {
  backend: 'webgpu',
  encoderQuant: 'fp32',
  decoderQuant: 'int8',
});

const result = await model.transcribe(pcm, 16000, {
  returnTimestamps: true,
  returnConfidences: true,
});

console.log(result.utterance_text);
```

`pcm` is mono `Float32Array` audio. The sample rate should be `16000`. In a browser app, decode files with the Web Audio API or your existing audio pipeline before calling `transcribe`.

For a complete React example, see `examples/demo`.

## What It Supports

- Client-side transcription in the browser.
- WebGPU and WASM execution through ONNX Runtime Web.
- Hugging Face model loading with IndexedDB caching.
- Local or self-hosted model files via explicit URLs.
- Timestamp and confidence output when requested.
- Long-audio chunking with sentence-aware merge behavior.
- Stateful streaming helpers for live transcription apps.

## Loading Models

The easiest path is `fromHub`:

```js
import { fromHub } from 'parakeet.js';

const model = await fromHub('parakeet-tdt-0.6b-v3', {
  backend: 'webgpu',
  encoderQuant: 'fp32',
  decoderQuant: 'int8',
  preprocessorBackend: 'js',
});
```

Use `fromUrls` when you host the files yourself:

```js
import { fromUrls } from 'parakeet.js';

const model = await fromUrls({
  encoderUrl: '/models/encoder-model.onnx',
  decoderUrl: '/models/decoder_joint-model.int8.onnx',
  tokenizerUrl: '/models/vocab.txt',
  backend: 'webgpu',
  preprocessorBackend: 'js',
});
```

If your ONNX model uses external data, pass the matching `.data` URL too:

```js
const model = await fromUrls({
  encoderUrl: '/models/encoder-model.onnx',
  encoderDataUrl: '/models/encoder-model.onnx.data',
  decoderUrl: '/models/decoder_joint-model.int8.onnx',
  tokenizerUrl: '/models/vocab.txt',
  backend: 'webgpu',
});
```

## Backends

`backend: 'webgpu'` is the recommended browser mode. It runs the encoder on WebGPU and the decoder on WASM.

Available backend values:

- `webgpu`
- `webgpu-hybrid` (kept for compatibility; same behavior as `webgpu`)
- `webgpu-strict`
- `wasm`

Quantization options are `fp32`, `fp16`, and `int8`, depending on which files exist in the model repo. In WebGPU modes, `int8` encoder requests are upgraded to `fp32` because the encoder path does not support int8 there.

`preprocessorBackend: 'js'` is the default and usually the best choice. Use `preprocessorBackend: 'onnx'` only when you specifically want the ONNX preprocessor file.

## Transcribing

Short audio:

```js
const result = await model.transcribe(pcm, 16000);
console.log(result.utterance_text);
```

Timestamps and confidences:

```js
const result = await model.transcribe(pcm, 16000, {
  returnTimestamps: true,
  returnConfidences: true,
});

console.log(result.words);
```

Long audio:

```js
const result = await model.transcribeLongAudio(pcm, 16000, {
  returnTimestamps: true,
});

console.log(result.text);
console.log(result.chunks);
```

Streaming:

```js
const transcriber = model.createStreamingTranscriber();
const partial = await transcriber.pushAudioChunk(chunkPcm, 16000);
```

For the full option and result types, use the published API docs or the TypeScript declarations in `types/`.

## Demo Apps

- `examples/demo`: current development demo. Use it to test local source and npm-package behavior.
- `compat-tests/demo-v*`: older demo snapshots. These help catch breaking changes against previous app code.
- [Keet](https://ysdede.github.io/keet/): real-time reference app built on `parakeet.js`.

Common demo commands:

```bash
cd examples/demo
npm install
npm run dev:local  # use local repo source
npm run dev        # use package dependency
```

## Development

```bash
npm install
npm test
npm run verify:frame-copy
npm run docs:api
```

The project keeps behavior checks in `tests/` and browser/manual checks in `examples/demo` and `compat-tests/`.

## Notes

- WebGPU requires a browser/runtime with WebGPU enabled.
- Multithreaded WASM needs cross-origin isolation (`COOP`/`COEP`) in deployed apps.
- Hugging Face model files are cached in IndexedDB for faster reloads.
- If browser model cache becomes stale, the hub loader validates cached blobs and redownloads when needed.

## License

MIT

## Credits

Thanks to [istupakov/onnx-asr](https://github.com/istupakov/onnx-asr) for the reference implementation and model tooling foundations.
