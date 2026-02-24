import { defineConfig, searchForWorkspaceRoot } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';

// Check if we should use local source files instead of npm package
const useLocalSource = process.env.PARAKEET_LOCAL === 'true';

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function getShortCommitHash(repoRoot) {
  try {
    return execSync('git rev-parse --short HEAD', {
      encoding: 'utf8',
      cwd: repoRoot,
    }).trim();
  } catch {
    return null;
  }
}

const repoRoot = path.resolve(__dirname, '../..');
const localPkg = readJson(path.resolve(repoRoot, 'package.json'));
const npmPkg = readJson(path.resolve(__dirname, 'node_modules/parakeet.js/package.json'));
const localVersion = localPkg?.version;
const npmVersion = npmPkg?.version;

const shortHash = getShortCommitHash(repoRoot);
let parakeetVersion = useLocalSource ? localVersion : npmVersion;
let parakeetSource = useLocalSource ? (shortHash ? `dev-${shortHash}` : 'dev') : 'npm';
if (!parakeetVersion) {
  parakeetVersion = localVersion || 'unknown';
  parakeetSource = localVersion ? (shortHash ? `dev-${shortHash}` : 'dev') : 'unknown';
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
      // Allow serving this app root and shared helpers.
      allow: [
        path.resolve(__dirname),
        path.resolve(__dirname, '../shared'),
        searchForWorkspaceRoot(process.cwd()),
      ],
    },
  },
  resolve: {
    alias: useLocalSource ? {
      // When PARAKEET_LOCAL=true, use local source files instead of npm package
      'parakeet.js': path.resolve(__dirname, '../../src/index.js'),
    } : {},
  },
  define: {
    global: 'globalThis',
    __PARAKEET_VERSION__: JSON.stringify(parakeetVersion),
    __PARAKEET_SOURCE__: JSON.stringify(parakeetSource),
  },
});
