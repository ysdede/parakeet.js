# Parakeet.js Compat Demo v1.4.4

Versioned demo snapshot used for compatibility checks.

This app helps verify that newer `parakeet.js` releases still work with the demo code shape used around `v1.4.4`.

## Install

```bash
cd compat-tests/demo-v1.4.4
npm install
```

## Run

Use the npm package dependency:

```bash
npm run dev
```

Use local repo source for pre-publish checks:

```bash
npm run dev:local
```

## Manual Checks

1. Load a local model folder.
2. Confirm warm-up transcription works.
3. Switch to Hugging Face model source.
4. Confirm Hugging Face model load and warm-up work.
5. Transcribe a sample or uploaded audio file.

## Build

```bash
npm run build
npm run build:local
```
