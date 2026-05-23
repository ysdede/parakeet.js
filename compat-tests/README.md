# Compat Tests

Compatibility demos are frozen app snapshots from earlier releases.

They answer one question: does the new library version still work with older demo app code?

## Layout

- `demo-vX.Y.Z/`: demo snapshot from that release era.
- `shared/`: common assets/helpers shared by compat demos.

## Rules

- Compat demos should use the npm package dependency for package compatibility checks.
- Keep `dev:local` / `build:local` when a snapshot supports local-source validation.
- Do not commit `node_modules` or generated `dist` output.
- Keep each snapshot small: source, public assets, config, package files, and README.

## Creating a Snapshot

```bash
# Example only. Pick the version that matches the demo snapshot.
Copy-Item -Recurse examples/demo compat-tests/demo-v1.4.4
```

Then remove generated folders and verify:

```bash
cd compat-tests/demo-v1.4.4
npm install
npm run build
npm run build:local
```

Manual checks should cover:

- local model folder load
- Hugging Face model load
- warm-up transcription
- sample/audio upload transcription

These checks are intentionally boring. If an old demo still works after a library change, that is the signal we want.
