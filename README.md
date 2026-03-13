# Parakeet.js

[Live Demo](https://ysdede.github.io/parakeet.js/) | [Keet](https://ysdede.github.io/keet/) | [NPM Package](https://www.npmjs.com/package/parakeet.js)

## What is parakeet.js

`parakeet.js` is browser speech-to-text for NVIDIA Parakeet ONNX models. It runs fully client-side using `onnxruntime-web` with WebGPU or WASM execution.

## Installation

```bash
npm i parakeet.js
# or
yarn add parakeet.js
```

- Use WebGPU when available for best throughput.
- Use WASM when WebGPU is not available or for compatibility-first setups.

## Quickstart

```js
import { fromHub } from 'parakeet.js';

const model = await fromHub('parakeet-tdt-0.6b-v3', {
  backend: 'webgpu-hybrid',
  encoderQuant: 'fp32',
  decoderQuant: 'int8',
});

// `file` should be a File (for example from <input type="file">)
const pcm = await getMono16kPcm(file); // returns mono Float32Array at 16 kHz
const result = await model.transcribe(pcm, 16000, {
  returnTimestamps: true,
  returnConfidences: true,
});

console.log(result.utterance_text);
```

Use your existing app audio pipeline for `getMono16kPcm(file)` (Web Audio API, ffmpeg, server-side decode, etc.). A complete browser example is available in `examples/demo/src/App.jsx` (`transcribeFile` flow).

## Loading models

- `fromHub(repoIdOrModelKey, options)`: easiest path. Accepts model keys like `parakeet-tdt-0.6b-v3` or full repo IDs.
- `fromUrls(cfg)`: explicit URL wiring when you host assets yourself.

```js
import { fromUrls } from 'parakeet.js';

const model = await fromUrls({
  encoderUrl: 'https://huggingface.co/ysdede/parakeet-tdt-0.6b-v3-onnx/resolve/main/encoder-model.onnx',
  decoderUrl: 'https://huggingface.co/ysdede/parakeet-tdt-0.6b-v3-onnx/resolve/main/decoder_joint-model.int8.onnx',
  tokenizerUrl: 'https://huggingface.co/ysdede/parakeet-tdt-0.6b-v3-onnx/resolve/main/vocab.txt',
  // Only needed if you choose preprocessorBackend: 'onnx'
  preprocessorUrl: 'https://huggingface.co/ysdede/parakeet-tdt-0.6b-v3-onnx/resolve/main/nemo128.onnx',
  backend: 'webgpu-hybrid',
  preprocessorBackend: 'js',
});
```

## Backends and quantization

- Backends are selected with `backend`:
  - `webgpu` (alias accepted)
  - `wasm`
  - advanced: `webgpu-hybrid`, `webgpu-strict`
- In WebGPU modes, the encoder prefers WebGPU but decoder session runs on WASM (hybrid execution).
- In `getParakeetModel`/`fromHub`, if backend starts with `webgpu` and `encoderQuant` is `int8`, encoder quantization is forced to `fp32`.
- Encoder/decoder quantization supports `int8`, `fp32`, and `fp16`.
- FP16 requires FP16 ONNX artifacts (for example `encoder-model.fp16.onnx`).
- ONNX Runtime Web does **not** convert FP32 model files into FP16 at load time.
- `getParakeetModel`/`fromHub` are strict about requested quantization: they do not auto-switch `fp16` to `fp32`.
- If requested FP16 artifacts are missing or fail to load, API calls throw actionable errors so callers can choose a different quantization explicitly.
- Decoder runs on WASM in WebGPU modes; if decoder FP16 is unsupported in your runtime, choose `decoderQuant: 'int8'` or `decoderQuant: 'fp32'` explicitly.
- `preprocessorBackend` is `js` (default) or `onnx`.

## JS Mel FFT Update (v1.4.0)

`parakeet.js` now uses the `pr74` real-FFT path in the default JS preprocessor (`preprocessorBackend: 'js'`).
This keeps feature compatibility with the previous implementation while reducing mel extraction cost.

| Item | Previous JS path | New JS path (default) |
| --- | --- | --- |
| FFT strategy | Full `N=512` complex FFT per frame | Real-FFT via one `N/2=256` complex FFT + spectrum reconstruction (`pr74`) |
| Expected speed | Baseline | Faster mel stage (commonly around `~1.5x` in local mel benchmarks) |
| Output behavior | NeMo-compatible normalized log-mel | Same behavior and ONNX-reference accuracy thresholds preserved |
| API changes | N/A | None (`JsPreprocessor` / `IncrementalMelProcessor` unchanged) |

If you need exact ONNX preprocessor execution instead of JS mel, set `preprocessorBackend: 'onnx'`.

## FP16 Examples

Before using FP16 examples: ensure FP16 artifacts exist in the target repo and your browser/runtime supports FP16 execution (WebGPU FP16 path).

Load known FP16 model key:

```js
import { fromHub } from 'parakeet.js';

const model = await fromHub('parakeet-tdt-0.6b-v3', {
  backend: 'webgpu-hybrid',
  encoderQuant: 'fp16',
  decoderQuant: 'fp16',
});
```

Use explicit FP16 URLs:

```js
import { fromUrls } from 'parakeet.js';

const model = await fromUrls({
  encoderUrl: 'https://huggingface.co/ysdede/parakeet-tdt-0.6b-v3-onnx/resolve/main/encoder-model.fp16.onnx',
  decoderUrl: 'https://huggingface.co/ysdede/parakeet-tdt-0.6b-v3-onnx/resolve/main/decoder_joint-model.fp16.onnx',
  tokenizerUrl: 'https://huggingface.co/ysdede/parakeet-tdt-0.6b-v3-onnx/resolve/main/vocab.txt',
  preprocessorBackend: 'js',
  backend: 'webgpu-hybrid',
});
```

## Transcribing a file (single-shot)

The demo flow in `examples/demo/src/App.jsx` is:
1. Load a model with public APIs (`fromHub(...)` for hub loading, or `fromUrls(...)` for explicit URLs).
2. Decode uploaded audio with `AudioContext({ sampleRate: 16000 })` + `decodeAudioData(...)`.
3. Convert decoded audio to mono 16 kHz PCM (`Float32Array`) by averaging channels when needed.
4. Call `model.transcribe(pcm, 16000, options)` and render `utterance_text`.

Reference code:
- `App` component in `examples/demo/src/App.jsx` (`loadModel` / `transcribeFile` flow)

## `transcribe()` options and result behavior

`returnTimestamps` is **off by default**.  
So: by default, `transcribe(...)` does **not** return meaningful timestamps.

### `transcribe(audio, sampleRate, opts)` options

| Option | Default | Effect |
| --- | --- | --- |
| `returnTimestamps` | `false` | Adds `start_time` / `end_time` to `tokens[]` and `words[]`. |
| `returnConfidences` | `false` | Adds per-token/per-word confidence fields and detailed `confidence_scores`. |
| `temperature` | `1.0` | Decoder temperature (`1.0` = greedy baseline behavior). |
| `debug` | `false` | Enables debug logs; also causes `metrics` to be populated. |
| `enableProfiling` | `true` | When `true`, returns timing/RTF in `metrics`. |
| `skipCMVN` | `false` | Skips CMVN in preprocessing. |
| `frameStride` | `1` | Decoder frame advance stride. |
| `previousDecoderState` | `null` | Continue decoding from an earlier chunk (streaming/stateful usage). |
| `returnDecoderState` | `false` | Includes `decoderState` in the result for next-call handoff. |
| `timeOffset` | `0` | Offset (seconds) added to emitted timestamps. |
| `returnTokenIds` | `false` | Includes `tokenIds` in result. |
| `returnFrameIndices` | `false` | Includes `frameIndices` (token-to-encoder-frame alignment). |
| `returnLogProbs` | `false` | Includes per-token `logProbs`. |
| `returnTdtSteps` | `false` | Includes per-token `tdtSteps` (duration predictor outputs). |
| `prefixSamples` | `0` | Enables incremental mel-cache reuse when prefix audio matches previous call. |
| `precomputedFeatures` | `null` | Bypasses preprocessor by supplying already-computed mel features. |
| `incremental` | `null` | Incremental decode cache config: `{ cacheKey, prefixSeconds }`. |

### Result shape

```ts
type TranscribeResult = {
  utterance_text: string;
  words: Array<{
    text: string;
    start_time: number;
    end_time: number;
    confidence?: number;
  }>;
  tokens?: Array<{
    token: string;
    raw_token?: string;
    is_word_start?: boolean;
    start_time?: number;
    end_time?: number;
    confidence?: number;
  }>;
  confidence_scores?: {
    token?: number[] | null;
    token_avg?: number | null;
    word?: number[] | null;
    word_avg?: number | null;
    frame: number[] | null;
    frame_avg: number | null;
    overall_log_prob: number | null;
  };
  metrics?: {
    preprocess_ms: number;
    encode_ms: number;
    decode_ms: number;
    tokenize_ms: number;
    total_ms: number;
    rtf: number;
    mel_cache?: { cached_frames: number; new_frames: number } | null;
    preprocessor_backend?: 'js' | 'onnx' | string; // runtime field
  } | null;
  is_final: boolean;
  decoderState?: {
    s1: Float32Array;
    s2: Float32Array;
    dims1: number[];
    dims2: number[];
  };
  tokenIds?: number[];
  frameIndices?: number[];
  logProbs?: number[];
  tdtSteps?: number[];
};
```

### What you get by default vs opt-in

| Call options | `words` | `tokens` | `confidence_scores` | `metrics` |
| --- | --- | --- | --- | --- |
| default (`{}`) | `[]` (empty) | omitted | omitted | present (`enableProfiling` default is `true`) |
| `{ returnTimestamps: true }` | timestamped words | timestamped tokens | minimal (`frame/frame_avg/overall_log_prob` are `null`) | present by default |
| `{ returnConfidences: true }` | words with `confidence` | tokens with `confidence` | detailed token/word/frame confidence stats | present by default |
| `{ returnTimestamps: true, returnConfidences: true }` | timestamped + confidence | timestamped + confidence | detailed token/word/frame confidence stats | present by default |

Notes:
- `start_time` / `end_time` are only meaningful when `returnTimestamps: true`.
- Advanced alignment/debug arrays are opt-in: `returnTokenIds`, `returnFrameIndices`, `returnLogProbs`, `returnTdtSteps`.
- If `enableProfiling: false` and `debug: false`, then `metrics` is `null`.
- `timeOffset` must be finite.
- Audio buffers passed to `transcribe(...)`, `computeFeatures(...)`, and `transcribeLongAudio(...)` must contain finite samples.

## Long-audio retranscription

Use `transcribeLongAudio(...)` when you want built-in sentence-aware windowing and chunk assembly for long recordings.

```js
const result = await model.transcribeLongAudio(pcm, 16000, {
  returnTimestamps: true,
  chunkLengthS: 30,
  timeOffset: 12.5,
});

console.log(result.text);
console.log(result.chunks);
```

### `transcribeLongAudio(audio, sampleRate, opts)` options

| Option | Default | Effect |
| --- | --- | --- |
| `returnTimestamps` | `false` | `true` returns sentence-like chunks; `'word'` returns per-word chunks. |
| `chunkLengthS` | `0` | Fixed window length in seconds. `0` enables auto window sizing for long inputs. |
| `timeOffset` | `0` | Offset (seconds) added to returned chunk/word timestamps. |
| other `transcribe()` options | varies | Forwarded to each internal transcription window. |

### Result shape

```ts
type LongAudioTranscribeResult = {
  text: string;
  words?: Array<{
    text: string;
    start_time: number;
    end_time: number;
    confidence?: number;
  }>;
  chunks?: Array<{
    text: string;
    timestamp: [number, number];
  }>;
};
```

Notes:
- `returnTimestamps: true` returns merged sentence-like chunks.
- `returnTimestamps: 'word'` returns per-word chunks while still including merged `words`.
- For shorter clips, `transcribeLongAudio(...)` falls back to a single internal `transcribe(...)` call.

## Real-time streaming (Keet)

[Keet](https://ysdede.github.io/keet/) is a reference real-time app built on `parakeet.js` ([repo](https://github.com/ysdede/keet)).

- For contiguous chunk streams, Keet uses `createStreamingTranscriber(...)`.
- Keet currently defaults to v4 utterance-based merging (`UtteranceBasedMerger`) with cursor/windowed chunk processing.

<a href="https://ysdede.github.io/keet/" target="_blank" rel="noopener noreferrer">
  <img src="https://raw.githubusercontent.com/ysdede/keet/refs/heads/master/public/img/streaming-preview.jpg" alt="Real-time transcription with Keet and parakeet.js" />
</a>

## API Reference

- Published API docs: https://ysdede.github.io/parakeet.js/api/
- Generate locally:

```bash
npm run docs:api
```

## License

MIT

## Credits

- [istupakov/onnx-asr](https://github.com/istupakov/onnx-asr) for the reference implementation and model tooling foundations.
