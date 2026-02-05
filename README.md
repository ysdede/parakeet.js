---
title: Parakeet.js Demo
emoji: 🦜
colorFrom: indigo
colorTo: blue
sdk: static
pinned: false
app_build_command: npm run build
app_file: dist/index.html
license: mit
short_description: NVIDIA Parakeet speech recognition for the browser
models:
- istupakov/parakeet-tdt-0.6b-v2-onnx
tags:
- parakeet-js
- parakeet
- onnx
- webgpu
- asr
- istupakov/parakeet-tdt-0.6b-v2-onnx
custom_headers:
  cross-origin-embedder-policy: require-corp
  cross-origin-opener-policy: same-origin
  cross-origin-resource-policy: cross-origin
---

# 🦜 Parakeet.js Demo

This is the unified demo application for parakeet.js. It can be used for:
- **Development**: Testing local source code changes
- **NPM Testing**: Testing the published npm package
- **Deployment**: Deploying to HuggingFace Spaces and GitHub Pages

## Quick Start

```bash
npm install
npm run dev
```

## Deployment to HuggingFace Spaces

This project is configured to **build directly on Hugging Face**. Just push the source code to your Space repository.

**Key Configuration:**
- **SDK**: `static`
- **Build Command**: `npm run build`
- **Output Path**: `dist/index.html`

## 🔗 Links

- **📚 [GitHub Repository](https://github.com/ysdede/parakeet.js)**
- **📦 [npm Package](https://www.npmjs.com/package/parakeet.js)**

---
*Built with ❤️ using React and parakeet.js*