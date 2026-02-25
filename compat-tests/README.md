# Compat Tests Guide

## Purpose

`compat-tests/` exists to verify that older demo apps still work with newer published `parakeet.js` npm releases.

## Folder Convention

- `demo-vX.Y.Z/`: app snapshot from that era (UI/app code baseline)
- `shared/`: shared helper modules and shared static assets used by multiple compat demos

## Dependency Rule (Important)

- Compat demos must use **npm dependency**, not local source linking.
- Do **not** use `"parakeet.js": "file:../.."` unless explicitly requested.
- Use one of:
  - `"parakeet.js": "latest"` for rolling compatibility checks
  - `"parakeet.js": "<target-version>"` for fixed-version checks

## New Compat Snapshot Workflow

1. Copy current demo source/config into a new `demo-vX.Y.Z` folder.
2. Exclude non-required artifacts (`node_modules`, `dist`, deployment-only files).
3. Keep only minimal runnable stack (`src`, `public`, `index.html`, Vite/PostCSS/Tailwind config, package files).
4. Point `parakeet.js` dependency to npm (`latest` or fixed version).
5. Reuse `compat-tests/shared/` for common JS modules/assets.
6. Build check:
   - `npm install`
   - `npm run build`

## Shared Assets Rule

- Put common assets under `compat-tests/shared/assets/`.
- Import shared assets from demo code instead of duplicating files in each demo's `public/assets`.
