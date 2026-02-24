import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

// Check if we should use local source files instead of npm package
const useLocalSource = process.env.PARAKEET_LOCAL === 'true';

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

const localPkg = readJson(path.resolve(__dirname, '../../package.json'));
const npmPkg = readJson(path.resolve(__dirname, 'node_modules/parakeet.js/package.json'));
const localVersion = localPkg?.version;
const npmVersion = npmPkg?.version;

let parakeetVersion = useLocalSource ? localVersion : npmVersion;
let parakeetSource = useLocalSource ? 'local' : 'npm';
if (!parakeetVersion) {
  parakeetVersion = localVersion || 'unknown';
  parakeetSource = localVersion ? 'local (fallback)' : 'unknown';
}

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
    fs: {
      // Allow importing shared helpers from examples/shared.
      allow: [path.resolve(__dirname, '..')],
    },
  },
  resolve: {
    alias: useLocalSource ? {
      // When PARAKEET_LOCAL=true, use local source files instead of npm package
      'parakeet.js': path.resolve(__dirname, '../../src/index.js'),
    } : {},
  },
  optimizeDeps: {
    include: ['onnxruntime-web'],
  },
  define: {
    global: 'globalThis',
    __PARAKEET_VERSION__: JSON.stringify(parakeetVersion),
    __PARAKEET_SOURCE__: JSON.stringify(parakeetSource),
  },
});
