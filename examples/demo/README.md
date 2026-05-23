# Parakeet.js Demo

React demo for local development, npm-package checks, and deployment testing.

Use this app when you want to manually verify model loading, browser transcription, local model folders, and Hugging Face downloads.

## Install

```bash
cd examples/demo
npm install
```

## Run

Use local source while developing the library:

```bash
npm run dev:local
```

Use the package dependency from this demo's `package.json`:

```bash
npm run dev
```

Build both modes:

```bash
npm run build
npm run build:local
```

## Model Sources

The UI has two model sources:

- `HuggingFace`: downloads model artifacts from the configured repo/revision and caches them in IndexedDB.
- `Local folder`: loads user-selected local ONNX/tokenizer files through browser file handles.

For local folders, include at least:

- encoder ONNX file
- decoder ONNX file
- tokenizer text file such as `vocab.txt` or `tokens.txt`

Optional files:

- `nemo128.onnx` or `nemo80.onnx` for ONNX preprocessing
- matching `*.onnx.data` files for models with external data

If no local preprocessor is found, the demo uses the JS mel preprocessor.

## Manual Test Flow

1. Start with `npm run dev:local`.
2. Load a local model folder.
3. Run the warm-up/sample transcription.
4. Switch to Hugging Face model source.
5. Load the same model from Hugging Face.
6. Confirm warm-up and sample transcription still work.

This catches the main pre-publish risks: local source imports, cached Hugging Face artifacts, browser file handles, and model warm-up audio.

## Deployment Notes

- Local dev sets cross-origin isolation headers in Vite.
- GitHub Pages uses `public/coi-serviceworker.js`.
- Hugging Face Spaces config lives in `space_template/`.

Deploy to Hugging Face Spaces:

```bash
node scripts/deploy-to-hf.js
```
