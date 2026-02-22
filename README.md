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

async function decodeToMono16k(file) {
  const arrayBuffer = await file.arrayBuffer();
  const ctx = new AudioContext({ sampleRate: 16000 });
  const audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));

  let pcm;
  if (audioBuffer.numberOfChannels === 1) {
    pcm = audioBuffer.getChannelData(0);
  } else {
    const mono = new Float32Array(audioBuffer.length);
    for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
      const channel = audioBuffer.getChannelData(ch);
      for (let i = 0; i < mono.length; i++) mono[i] += channel[i] / audioBuffer.numberOfChannels;
    }
    pcm = mono;
  }

  await ctx.close();
  return pcm;
}

const model = await fromHub('parakeet-tdt-0.6b-v3', {
  backend: 'webgpu',
  encoderQuant: 'fp32',
  decoderQuant: 'int8',
});

// `file` should be a File (for example from <input type="file">)
const pcm = await decodeToMono16k(file);
const result = await model.transcribe(pcm, 16000, {
  returnTimestamps: true,
  returnConfidences: true,
});

console.log(result.utterance_text);
```

## Loading models

- `fromHub(repoIdOrModelKey, options)`: easiest path. Accepts model keys like `parakeet-tdt-0.6b-v3` or full repo IDs.
- `fromUrls(cfg)`: explicit URL wiring when you host assets yourself.

```js
import { fromUrls } from 'parakeet.js';

const model = await fromUrls({
  encoderUrl: 'https://huggingface.co/istupakov/parakeet-tdt-0.6b-v3-onnx/resolve/main/encoder-model.onnx',
  decoderUrl: 'https://huggingface.co/istupakov/parakeet-tdt-0.6b-v3-onnx/resolve/main/decoder_joint-model.int8.onnx',
  tokenizerUrl: 'https://huggingface.co/istupakov/parakeet-tdt-0.6b-v3-onnx/resolve/main/vocab.txt',
  // Only needed if you choose preprocessorBackend: 'onnx'
  preprocessorUrl: 'https://huggingface.co/istupakov/parakeet-tdt-0.6b-v3-onnx/resolve/main/nemo128.onnx',
  backend: 'webgpu-hybrid',
  preprocessorBackend: 'js',
});
```

## Backends and quantization

- Backends are selected with `backend`:
  - `webgpu` (alias accepted)
  - `wasm`
  - advanced: `webgpu-hybrid`, `webgpu-strict`
- In WebGPU modes, the decoder session runs on WASM (hybrid execution).
- In `getParakeetModel`/`fromHub`, if backend starts with `webgpu` and `encoderQuant` is `int8`, encoder quantization is forced to `fp32`.
- Decoder quantization can be `int8` or `fp32`.
- `preprocessorBackend` is `js` (default) or `onnx`.

## Transcribing a file (single-shot)

The demo flow in `examples/demo/src/App.jsx` is:
1. Load a model with public APIs (`fromHub(...)` for hub loading, or `fromUrls(...)` for explicit URLs).
2. Decode uploaded audio with `AudioContext({ sampleRate: 16000 })` + `decodeAudioData(...)`.
3. Convert decoded audio to mono 16 kHz PCM (`Float32Array`) by averaging channels when needed.
4. Call `model.transcribe(pcm, 16000, options)` and render `utterance_text`.

Reference code:
- `App` component in `examples/demo/src/App.jsx` (`loadModel` / `transcribeFile` flow)

## Results

`model.transcribe(...)` returns a `TranscribeResult` with this shape:

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
    mel_cache?: { cached_frames: number; new_frames: number };
  } | null;
  is_final: boolean;
  tokenIds?: number[];
  frameIndices?: number[];
  logProbs?: number[];
  tdtSteps?: number[];
};
```

- Enable `returnTimestamps` for meaningful `start_time`/`end_time`.
- Enable `returnConfidences` for per-token/per-word confidence fields.
- Advanced alignment/debug outputs are opt-in: `returnTokenIds`, `returnFrameIndices`, `returnLogProbs`, `returnTdtSteps`.

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
