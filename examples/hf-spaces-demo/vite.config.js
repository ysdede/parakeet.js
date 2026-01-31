import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Check if we should use local source files instead of npm package
const useLocalSource = process.env.PARAKEET_LOCAL === 'true';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
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
  },
});
