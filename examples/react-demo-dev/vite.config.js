import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

// Optional HTTPS setup - only if certificates exist
let httpsConfig = false;
try {
  const keyPath = path.resolve('./localhost-key.pem');
  const certPath = path.resolve('./localhost.pem');
  
  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    httpsConfig = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    };
    console.log('✅ HTTPS enabled with local certificates');
  } else {
    console.log('ℹ️ No local certificates found, running on HTTP');
  }
} catch (err) {
  console.log('ℹ️ HTTPS setup failed, running on HTTP:', err.message);
}

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    ...(httpsConfig && { https: httpsConfig }),
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
  },
}); 