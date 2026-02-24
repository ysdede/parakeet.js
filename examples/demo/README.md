# Parakeet.js Demo

This is the unified demo application for parakeet.js. It can be used for:
- **Development**: Testing local source code changes
- **NPM Testing**: Testing the published npm package
- **Deployment**: Deploying to HuggingFace Spaces and GitHub Pages

## Quick Start

```bash
cd examples/demo
npm install
```

## Development Modes

### Local Development (Test Local Changes)

Use this when modifying the parakeet.js library source code:

```bash
npm run dev:local
```

This runs Vite with the `PARAKEET_LOCAL=true` environment variable, which aliases `parakeet.js` imports to `/src/index.js` instead of the npm package.

**When to use:**
- Developing new features in `/src/`
- Debugging issues in the library
- Testing before publishing to npm

### NPM Package Testing

Use this to test the published npm package (simulates end-user experience):

```bash
npm run dev
```

This uses the `parakeet.js` package from npm (version specified in `package.json`).

**When to use:**
- Verifying the published package works correctly
- Testing after `npm publish`
- Before deploying to production

## Version Display

The demo header shows the active `parakeet.js` version/source and the loaded `onnxruntime-web` runtime version.

- **Local mode** (`PARAKEET_LOCAL=true`): shows the root repo version.
- **NPM mode**: shows the version from `node_modules/parakeet.js`.

## Building

### Local Source Build
```bash
npm run build:local
```

### NPM Package Build
```bash
npm run build
```

## Deployment

### HuggingFace Spaces

Deploy to HuggingFace Spaces (uses npm package build):

```bash
npm run deploy-to-hf
```

This will:
1. Build the app with `npm run build`
2. Clone the HF Space repository
3. Copy build files and space template
4. Push to HuggingFace

**Requirements:**
- HuggingFace CLI logged in (`huggingface-cli login`)
- Write access to the Space repository

### GitHub Pages

GitHub Pages deployment is automated via GitHub Actions and uses a **local source build** (`build:local`) so the live page always reflects the latest repository code, even before an npm publish.

**Automatic Deployment:**
Pushing changes to `examples/demo/**` or `src/**` on the `master` branch triggers the workflow.

**Manual Trigger:**
```bash
gh workflow run deploy-gh-pages.yml
```

**Check Status:**
```bash
gh run list --workflow="deploy-gh-pages.yml"
```

## Cross-Origin Isolation

Both deployment targets require Cross-Origin Isolation headers for `SharedArrayBuffer` support (multi-threaded WASM):

### HuggingFace Spaces
Headers are configured in `space_template/README.md`:
```yaml
custom_headers:
  cross-origin-embedder-policy: credentialless
  cross-origin-opener-policy: same-origin
```

### GitHub Pages
Since GitHub Pages doesn't support custom headers, we use `coi-serviceworker.js` which is included in the build.

## Directory Structure

```
demo/
├── src/
│   ├── App.jsx          # Main React component
│   ├── App.css          # Styles
│   └── utils/           # Utility functions
├── public/
│   ├── assets/          # Static assets (test audio)
│   └── coi-serviceworker.js  # Cross-origin isolation workaround
├── scripts/
│   └── deploy-to-hf.js  # HF deployment script
├── space_template/
│   └── README.md        # HF Space configuration
├── vite.config.js       # Vite config with local/npm switching
└── package.json         # Scripts and dependencies
```

## Troubleshooting

### "SharedArrayBuffer unavailable" warning
- **Local dev**: Should work automatically (Vite sets COOP/COEP headers)
- **HF Spaces**: Check `space_template/README.md` has `custom_headers`
- **GitHub Pages**: Ensure `coi-serviceworker.js` is in the build

### Model loading fails with memory error
- Check browser DevTools isn't pausing on potential OOM
- Try closing other browser tabs to free memory
- Prefer `fp16` on WebGPU; this demo retries with `fp32` if `fp16` fails, while the core API does not auto-switch. Use `int8` for smallest files.

### Changes not reflected after deployment
- GitHub Pages: Wait 1-2 minutes for CDN cache
- HF Spaces: Wait for Space rebuild (~1 minute)
- Clear browser cache or use incognito window
