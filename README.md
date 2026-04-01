# Parakeet.js

[Live Demo](https://ysdede.github.io/parakeet.js/) | [Keet](https://ysdede.github.io/keet/) | [NPM Package](https://www.npmjs.com/package/parakeet.js)

High-performance WebGPU speech recognition for NVIDIA Parakeet in the browser.

`parakeet.js` is browser speech-to-text for NVIDIA Parakeet ONNX models. It runs fully client-side using `onnxruntime-web` with WebGPU or WASM execution.

If you are looking for a JavaScript or browser runtime for NVIDIA Parakeet, `parakeet.js` is the package for that use case.

## Features

- browser-based transcription with no server round-trip
- single-shot file transcription with timestamps and confidence scores
- long-form transcription with built-in chunking via `transcribeLongAudio(...)`
- real-time and stateful streaming flows such as [Keet](https://ysdede.github.io/keet/)

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
  backend: 'webgpu',
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

## Which API to use

- `transcribe(audio, sampleRate, opts)`:
  best for short clips, direct uploads, chunk-by-chunk processing, or when your app already owns the chunking strategy
- `transcribeLongAudio(audio, sampleRate, opts)`:
  best for longer recordings where you want built-in windowing, chunk assembly, and timestamped merged output
- `createStreamingTranscriber(opts)`:
  best for contiguous real-time or near-real-time streaming flows

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
  backend: 'webgpu',
  preprocessorBackend: 'js',
});
```

## Backends and quantization

- Backends are selected with `backend`:
  - `webgpu`
  - `webgpu-hybrid` (same execution behavior as `webgpu`; accepted for compatibility)
  - `wasm`
- In this library, `webgpu` means encoder on WebGPU and decoder on WASM.
- `webgpu-hybrid` is equivalent to `webgpu` in this library.
- `wasm` runs both encoder and decoder on WASM.
- In `getParakeetModel`/`fromHub`, if backend starts with `webgpu` and `encoderQuant` is `int8`, encoder quantization is forced to `fp32`.
- Encoder/decoder quantization supports `int8`, `fp32`, and `fp16`.
- FP16 requires FP16 ONNX artifacts (for example `encoder-model.fp16.onnx`).
- ONNX Runtime Web does **not** convert FP32 model files into FP16 at load time.
- `getParakeetModel`/`fromHub` are strict about requested quantization: they do not auto-switch `fp16` to `fp32`.
- If requested FP16 artifacts are missing or fail to load, API calls throw actionable errors so callers can choose a different quantization explicitly.
- Decoder quantization controls which decoder artifact is loaded, but in this library the decoder session itself runs on WASM in every WebGPU mode.
- `preprocessorBackend` is `js` (default) or `onnx`.

## Long-form transcription

`transcribeLongAudio()` is the long-form helper API for built-in sentence-aware chunking.
Its exported TypeScript types are `LongAudioTranscribeOptions` and `LongAudioTranscribeResult`.

Use it when you want built-in sentence-aware windowing and merged chunks for long recordings instead of manually splitting audio in application code.

## FP16 Examples

Before using FP16 examples: ensure FP16 artifacts exist in the target repo and your browser/runtime supports FP16 execution (WebGPU FP16 path).

Load known FP16 model key:

```js
import { fromHub } from 'parakeet.js';

const model = await fromHub('parakeet-tdt-0.6b-v3', {
  backend: 'webgpu',
  encoderQuant: 'fp16',
  decoderQuant: 'int8',
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
  backend: 'webgpu',
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
- Non-finite `timeOffset` values passed to `transcribe(...)` are coerced to `0` with a warning for compatibility.
- Non-finite audio samples passed to `transcribe(...)` or `computeFeatures(...)` are sanitized to `0` with a warning for compatibility.

## `transcribeLongAudio()` behavior

Use it when you want built-in sentence-aware windowing and chunk assembly for long recordings such as meetings, podcasts, call recordings, interviews, or lectures.

Internally, long-form transcription does not just emit fixed overlapping windows.
It transcribes windows, detects sentence boundaries from timestamped words, finalizes completed segments, and advances from the last stable boundary when possible.

```js
const result = await model.transcribeLongAudio(pcm, 16000, {
  returnTimestamps: true,
  chunkLengthS: 95,
});

console.log(result.text);
console.log(result.chunks);
```

Use `timeOffset` only when this audio starts later inside a larger source:

```js
const result = await model.transcribeLongAudio(pcmSlice, 16000, {
  returnTimestamps: true,
  timeOffset: 12.5,
});
```

Word-level chunk output:

```js
const result = await model.transcribeLongAudio(pcm, 16000, {
  returnTimestamps: 'word',
});

console.log(result.words);
console.log(result.chunks);
```

### `transcribeLongAudio(audio, sampleRate, opts)` options

| Option | Default | Effect |
| --- | --- | --- |
| `returnTimestamps` | `false` | `true` returns sentence-like chunks; `'word'` returns per-word chunks. |
| `chunkLengthS` | `0` | Fixed window length in seconds. `0` enables automatic window sizing for long inputs. |
| `timeOffset` | `0` | Optional base offset (seconds) added to returned chunk/word timestamps. |
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
- Exported TypeScript names are `LongAudioTranscribeOptions` and `LongAudioTranscribeResult`.
- `returnTimestamps: true` returns merged sentence-like chunks.
- `returnTimestamps: 'word'` returns per-word chunks while still including merged `words`.
- For shorter clips, `transcribeLongAudio(...)` falls back to a single internal `transcribe(...)` call.
- Window stitching is sentence-aware: completed segments are finalized from word timestamps instead of being exposed as raw fixed windows.
- Standard transcription options such as `returnConfidences`, `debug`, `enableProfiling`, `temperature`, and `skipCMVN` are forwarded to the internal transcription windows.

## Real-time streaming (Keet)

[Keet](https://ysdede.github.io/keet/) is a reference real-time app built on `parakeet.js` ([repo](https://github.com/ysdede/keet)).

- For contiguous chunk streams, Keet uses `createStreamingTranscriber(...)`.
- Keet currently defaults to v4 utterance-based merging (`UtteranceBasedMerger`) with cursor/windowed chunk processing.

<a href="https://ysdede.github.io/keet/" target="_blank" rel="noopener noreferrer">
  <img src="https://raw.githubusercontent.com/ysdede/keet/refs/heads/master/public/img/streaming-preview.jpg" alt="Real-time transcription with Keet and parakeet.js" />
</a>

## API Reference

- Published API docs: https://ysdede.github.io/parakeet.js/api/
- Release history: [CHANGELOG.md](CHANGELOG.md)
- Generate locally:

```bash
npm run docs:api
```

## License

MIT

## Credits

- [istupakov/onnx-asr](https://github.com/istupakov/onnx-asr) for the reference implementation and model tooling foundations.
