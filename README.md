---
title: Parakeet.js Demo
emoji: 🦜
colorFrom: indigo
colorTo: red
sdk: static
pinned: false
app_build_command: npm run build
app_file: build/index.html
license: mit
short_description: NVIDIA Parakeet speech recognition for the browser
models:
- ysdede/parakeet-tdt-0.6b-v2-onnx
tags:
- parakeet
- speech
- onnx
- webgpu
- wasm
- transcription
- nvidia
- speech-recognition
- browser
custom_headers:
  cross-origin-embedder-policy: require-corp
  cross-origin-opener-policy: same-origin
  cross-origin-resource-policy: cross-origin
---

# 🦜 Parakeet.js - HF Spaces Demo

> **NVIDIA Parakeet speech recognition for the browser using WebGPU/WASM**

This demo showcases the **[parakeet.js](https://www.npmjs.com/package/parakeet.js)** library, which brings NVIDIA's Parakeet speech recognition models to the browser using ONNX Runtime Web with WebGPU and WASM backends.

## 🚀 Features

- **🖥️ Browser-based**: Runs entirely in your browser - no server required
- **⚡ WebGPU acceleration**: Fast inference using WebGPU when available
- **🔧 WASM fallback**: CPU-based inference using WebAssembly
- **📱 Multiple formats**: Supports various audio formats (WAV, MP3, etc.)
- **🎯 Real-time performance**: Optimized for fast transcription
- **📊 Performance metrics**: Shows detailed timing information
- **🎛️ Configurable**: Adjustable quantization, preprocessing, and backend settings

## 🔧 How to Use

1. **Click "Load Model"** to download and initialize the speech recognition model
2. **Select your preferences**:
   - **Backend**: Choose WebGPU (faster) or WASM (more compatible)
   - **Quantization**: fp32 (higher quality) or int8 (faster)
   - **Preprocessor**: Different audio processing options
3. **Upload an audio file** using the file input
4. **View the transcription** in real-time with performance metrics

## 📦 Integration

You can use parakeet.js in your own projects:

```bash
npm install parakeet.js onnxruntime-web
```

```javascript
import { ParakeetModel, getParakeetModel } from 'parakeet.js';

// Load model from HuggingFace Hub
const modelUrls = await getParakeetModel('ysdede/parakeet-tdt-0.6b-v2-onnx');
const model = await ParakeetModel.fromUrls(modelUrls);

// Transcribe audio
const result = await model.transcribe(audioData, sampleRate);
console.log(result.utterance_text);
```

## 🔗 Links

- **📚 [GitHub Repository](https://github.com/ysdede/parakeet.js)** - Source code and documentation
- **📦 [npm Package](https://www.npmjs.com/package/parakeet.js)** - Install via npm

## 🧠 Model Information

This demo uses the **ysdede/parakeet-tdt-0.6b-v2-onnx** model, which is an ONNX-converted version of NVIDIA's Parakeet speech recognition model optimized for browser deployment.

## 💡 Technical Details

- **Model Format**: ONNX for cross-platform compatibility
- **Backends**: WebGPU (GPU acceleration) and WASM (CPU fallback)
- **Quantization**: Support for both fp32 and int8 precision
- **Audio Processing**: Built-in preprocessing for various audio formats
- **Performance**: Real-time factor (RTF) typically < 1.0x for fast transcription

---

*Built with ❤️ using React and deployed on Hugging Face Spaces*
