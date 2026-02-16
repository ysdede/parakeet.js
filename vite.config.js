import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

const npmPkg = readJson(path.resolve(__dirname, 'node_modules/parakeet.js/package.json'));
const parakeetVersion = npmPkg?.version || 'unknown';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  optimizeDeps: {
    include: ['onnxruntime-web'],
  },
  define: {
    global: 'globalThis',
    __PARAKEET_VERSION__: JSON.stringify(parakeetVersion),
    __PARAKEET_SOURCE__: JSON.stringify('npm'),
  },
});