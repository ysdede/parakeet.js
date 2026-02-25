# Backward Compatibility Demo (v1.3.1)

This folder is a compatibility snapshot of the `v1.3.1`-era demo app with a minimal required stack.

Included:
- React + Vite app source (`src`, `public`)
- Build/runtime config (`index.html`, `vite.config.js`, PostCSS/Tailwind configs)
- Minimal package scripts (`dev`, `build`, `preview`)
- NPM dependency via `"parakeet.js": "latest"` in `package.json` to validate this older app snapshot against the newest published package

Excluded from the copy:
- `node_modules`
- `dist`
- deployment helpers/templates not required for compat checks

Quick check:

```bash
npm install
npm run build
```
