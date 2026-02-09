---
title: Parakeet.js Demo
emoji: 🦜
colorFrom: indigo
colorTo: red
sdk: static
pinned: false
app_build_command: npm run build
app_file: dist/index.html
models:
- ysdede/parakeet-tdt-0.6b-v2-onnx
tags:
- speech
- transcription
- webgpu
- wasm
- parakeet
---

# Parakeet.js Demo

This is the unified demo application for parakeet.js, optimized for **Hugging Face Spaces** and **GitHub Pages**.

## 🚀 Features

- **Multiple Models**: Support for parakeet-tdt-0.6b-v2, v3, etc.
- **WebGPU & WASM**: High-performance GPU acceleration with CPU fallback.
- **Real-time Metrics**: Track RTF, encoding, and decoding times live.
- **Local & Remote Testing**: Test with built-in samples or upload your own.
- **Version Display**: Shows the active `parakeet.js` version/source and the loaded `onnxruntime-web` runtime version.

## 🛠 Development

### Local Setup
```bash
npm install
npm run dev
```

### Testing with Local Library Source
If you are developing the `parakeet.js` library itself:
```bash
npm run dev:local
```

## 📦 Deployment to Hugging Face Spaces

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
