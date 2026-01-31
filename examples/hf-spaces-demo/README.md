# 🦜 Parakeet.js - HuggingFace Spaces Demo

> **NVIDIA Parakeet speech recognition for the browser using WebGPU/WASM**

This is the source code for the [Parakeet.js Demo on HuggingFace Spaces](https://huggingface.co/spaces/ysdede/parakeet.js-demo).

## 📁 Project Structure

```
hf-spaces-demo/
├── src/                    # React source code
│   ├── App.jsx             # Main application component
│   ├── App.css             # Tailwind CSS styles
│   └── utils/
│       └── speechDatasets.js   # HF dataset utilities
├── scripts/
│   └── deploy-to-hf.js     # Deployment script
├── space_template/
│   └── README.md           # HF Space metadata
└── dist/                   # Built files (gitignored)
```

## 🚀 Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

## 📦 Deployment to HuggingFace Spaces

This project uses a **static build deployment** strategy. The source code stays on GitHub, and only the built `dist/` files are pushed to HuggingFace Spaces.

### Deploy Command

```bash
npm run deploy-to-hf
```

This script:
1. Builds the project (`npm run build`)
2. Creates a temporary directory
3. Clones the HF Space repo
4. Copies `dist/` contents + `space_template/README.md`
5. Force pushes to HuggingFace

### Manual Deployment

If you prefer manual deployment:

```bash
# Build
npm run build

# The dist/ folder contains the static files
# Push these to your HF Space along with space_template/README.md
```

## 🔧 Configuration

### HF Space Settings

The `space_template/README.md` contains HuggingFace Space metadata:

```yaml
---
title: Parakeet.js Demo
emoji: 🦜
colorFrom: green
colorTo: blue
sdk: static
pinned: false
---
```

### Changing the HF Space URL

Edit `scripts/deploy-to-hf.js`:

```javascript
const HF_SPACE_REPO = 'https://huggingface.co/spaces/YOUR_USERNAME/YOUR_SPACE';
```

## 🔗 Related

- **[parakeet.js](https://www.npmjs.com/package/parakeet.js)** - npm package
- **[GitHub Repository](https://github.com/ysdede/parakeet.js)** - Full source code
- **[react-demo](../react-demo)** - Production demo (same codebase)
- **[react-demo-dev](../react-demo-dev)** - Development demo (links to local library)

## 📝 Notes

- This demo uses the same UI codebase as `react-demo`
- The only difference is the `deploy-to-hf` script and HF-specific metadata
- Uses `parakeet.js` npm package (not local link like `react-demo-dev`)
