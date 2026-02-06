import { defineConfig } from 'vite'
import { configDefaults } from 'vitest/config'
import solidPlugin from 'vite-plugin-solid'
import path from 'path'
import fs from 'fs'
import tailwindcss from '@tailwindcss/postcss'
import autoprefixer from 'autoprefixer'

// Check if we should use local parakeet.js
const useLocalParakeet = process.env.USE_LOCAL_PARAKEET === 'true';

// Path to local parakeet.js (relative to boncukjs)
const localParakeetPath = path.resolve(__dirname, '../parakeet.js');

// Check if local parakeet.js exists
const localParakeetExists = fs.existsSync(localParakeetPath);

if (useLocalParakeet) {
  if (localParakeetExists) {
    console.log('🔗 Using LOCAL parakeet.js from:', localParakeetPath);
  } else {
    console.error('❌ LOCAL mode requested but parakeet.js not found at:', localParakeetPath);
    console.error('   Expected folder structure:');
    console.error('   └── github/ysdede/');
    console.error('       ├── boncukjs/');
    console.error('       └── parakeet.js/');
    process.exit(1);
  }
} else {
  console.log('📦 Using NPM parakeet.js (v1.0.1)');
}

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
    httpsConfig = false;
  }
} catch (err) {
  console.log('ℹ️ HTTPS setup failed, running on HTTP:', err.message);
  httpsConfig = false;
}

export default defineConfig({
  plugins: [solidPlugin()],
  server: {
    port: 3100,
    host: '0.0.0.0',
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
    ...(httpsConfig && { https: httpsConfig }),
  },
  css: {
    postcss: {
      plugins: [tailwindcss, autoprefixer],
    },
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'audio-processor.js') {
            return 'assets/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
  },
  optimizeDeps: {
    exclude: ['audio-processor.js'],
    // Include parakeet.js in optimization when using local version
    ...(useLocalParakeet && localParakeetExists && {
      include: ['parakeet.js'],
    }),
  },
  worker: {
    format: 'es',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Conditionally alias parakeet.js to local source
      ...(useLocalParakeet && localParakeetExists && {
        'parakeet.js': path.resolve(localParakeetPath, 'src/index.js'),
      }),
    },
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: [...configDefaults.exclude],
    // @vitest/web-worker polyfills Web Workers for Vitest
    deps: {
      optimizer: {
        web: {
          include: ['@vitest/web-worker'],
        },
      },
    },
  },
})
