# Parakeet.js Demo

Unified React demo for parakeet.js development, npm-package validation, and deployment targets.

## What's New

- Added **Model Source** switch: `HuggingFace` or `Local folder`.
- Added local-folder model loading from browser-selected files.
- Added local folder artifact detection (encoder/decoder quant modes, tokenizer files, optional preprocessors).
- Added persisted local folder handle restore (where browser permissions allow it).
- Added automatic fallback of preprocessor backend from ONNX to JS when local `nemo*.onnx` is not present.
- Added stronger local blob URL cleanup on failure paths.

## Quick Start

```bash
cd examples/demo
npm install
```

## Development Modes

### Local Source Mode

```bash
npm run dev:local
```

Runs with `PARAKEET_LOCAL=true`, so `parakeet.js` resolves to the local repo source (`/src/index.js`).

Use this for library development and pre-publish validation.

### NPM Package Mode

```bash
npm run dev
```

Uses the npm-installed `parakeet.js` dependency from `examples/demo/package.json`.

Use this for package-consumer behavior checks.

## Model Sources in UI

### HuggingFace

- Select model in the UI.
- Demo uses pinned canonical revisions per model.

Canonical branches are pinned in code:
- `parakeet-tdt-0.6b-v2` -> `feat/fp16-canonical-v2`
- `parakeet-tdt-0.6b-v3` -> `feat/fp16-canonical-v3`

### Local Folder

- Pick a folder containing local model artifacts.
- Expected minimum artifacts:
  - encoder ONNX (e.g. `encoder-model.onnx` or quantized variants)
  - decoder ONNX (e.g. `decoder_joint-model.onnx` or quantized variants)
  - tokenizer text file (`vocab.txt`, `tokens.txt`, or other `.txt`)
- Optional:
  - preprocessor ONNX (`nemo128.onnx` / `nemo80.onnx`)
  - external ONNX data files (`*.data`)

If no local `nemo*.onnx` is found, the demo automatically switches preprocessor backend to JS.

### Folder Access Persistence

- On supported browsers, selected folder access can be persisted and restored.
- If permission is not granted on revisit, the UI offers **Restore Saved Folder**.
- On unsupported browsers, users must re-select the folder next visit.

## Version Display

Header shows active parakeet source/version:

- Local mode: repo version (with short commit hash when available).
- NPM mode: `node_modules/parakeet.js` version.

## Build

```bash
npm run build
npm run build:local
```

## Deployment

### HuggingFace Spaces

Run:

```bash
node scripts/deploy-to-hf.js
```

This script builds and pushes demo artifacts using the space template config.

### GitHub Pages

Automated with GitHub Actions (local-source build path).

Manual trigger:

```bash
gh workflow run deploy-gh-pages.yml
```

## Cross-Origin Isolation

Required for `SharedArrayBuffer` / multithreaded WASM.

- Local dev server sets COOP/COEP headers.
- HF Spaces headers are configured in `space_template/README.md`.
- GitHub Pages uses `public/coi-serviceworker.js`.

## Troubleshooting

### SharedArrayBuffer unavailable

- Local: verify dev server is used and headers are present.
- HF Spaces: verify custom headers in space template.
- GitHub Pages: ensure `coi-serviceworker.js` is deployed.

### Local folder model fails to load

- Check required encoder/decoder/tokenizer files exist.
- Confirm selected quantization exists in your folder.
- If using ONNX preprocessor, confirm `nemo*.onnx` exists; otherwise switch to JS preprocessor.

### Model load memory pressure

- Close extra tabs/processes.
- Prefer smaller quant modes (`fp16`/`int8`) where possible.
