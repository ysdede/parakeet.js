# Backward Compatibility Demo (v1.4.0)

This folder is a compatibility snapshot of the March 6, 2026 `v1.4.0`-era demo app with a minimal runnable stack.

Included:
- React + Vite app source (`src`, `public`)
- Build/runtime config (`index.html`, `vite.config.js`, PostCSS/Tailwind configs)
- Minimal package scripts (`dev`, `build`, `preview`)
- NPM dependency via `"parakeet.js": "latest"` in `package.json` for rolling compatibility checks

Excluded from the copy:
- `node_modules`
- `dist`
- deployment helpers/templates not required for compat checks

Quick check:

```bash
npm install
npm run build
```
