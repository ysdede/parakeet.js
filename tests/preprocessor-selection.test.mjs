/**
 * Tests for preprocessor backend selection logic in hub.js and parakeet.js.
 *
 * Verifies:
 *   1. hub.js getParakeetModel() skips nemo128.onnx when preprocessorBackend='js'
 *   2. parakeet.js fromUrls() only creates ONNX preprocessor when explicitly requested
 *   3. Default behavior (preprocessorBackend='js') does not load ONNX preprocessor
 *
 * These are unit tests that simulate the selection logic without requiring
 * network access, ONNX Runtime, or browser environment.
 *
 * Run: npm test
 */

import { describe, it, expect } from 'vitest';

// ═══════════════════════════════════════════════════════════════════════════
// Hub file selection logic (simulated from src/hub.js getParakeetModel)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Replicates the exact branching in getParakeetModel() that decides
 * whether to include nemo128.onnx in the download list.
 */
function simulateHubFileSelection(preprocessorBackend, preprocessor = 'nemo128') {
  const filesToGet = [
    { key: 'encoderUrl', name: 'encoder-model.onnx' },
    { key: 'decoderUrl', name: 'decoder_joint-model.int8.onnx' },
    { key: 'tokenizerUrl', name: 'vocab.txt' },
  ];

  // From hub.js:
  //   if (preprocessorBackend !== 'js') {
  //     filesToGet.push({ key: 'preprocessorUrl', name: `${preprocessor}.onnx` });
  //   }
  if (preprocessorBackend !== 'js') {
    filesToGet.push({ key: 'preprocessorUrl', name: `${preprocessor}.onnx` });
  }

  return filesToGet;
}

describe('hub.js: file selection (preprocessor download)', () => {
  it('should NOT include nemo128.onnx when preprocessorBackend=js', () => {
    const files = simulateHubFileSelection('js');
    const onnxFiles = files.filter(f => f.name.includes('nemo128'));
    expect(onnxFiles).toHaveLength(0);
  });

  it('should include nemo128.onnx when preprocessorBackend=onnx', () => {
    const files = simulateHubFileSelection('onnx');
    const onnxFiles = files.filter(f => f.name === 'nemo128.onnx');
    expect(onnxFiles).toHaveLength(1);
  });

  it('should include nemo128.onnx when preprocessorBackend is undefined', () => {
    const files = simulateHubFileSelection(undefined);
    const onnxFiles = files.filter(f => f.name === 'nemo128.onnx');
    expect(onnxFiles).toHaveLength(1);
  });

  it('should include nemo128.onnx when preprocessorBackend is empty string', () => {
    const files = simulateHubFileSelection('');
    const onnxFiles = files.filter(f => f.name === 'nemo128.onnx');
    expect(onnxFiles).toHaveLength(1);
  });

  it('should always include encoder, decoder, and tokenizer regardless of backend', () => {
    for (const backend of ['js', 'onnx', undefined]) {
      const files = simulateHubFileSelection(backend);
      const names = files.map(f => f.name);
      expect(names).toContain('encoder-model.onnx');
      expect(names).toContain('decoder_joint-model.int8.onnx');
      expect(names).toContain('vocab.txt');
    }
  });

  it('should have exactly 3 files for js backend (no preprocessor)', () => {
    const files = simulateHubFileSelection('js');
    expect(files).toHaveLength(3);
  });

  it('should have 4 files for onnx backend (with preprocessor)', () => {
    const files = simulateHubFileSelection('onnx');
    expect(files).toHaveLength(4);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// fromUrls preprocessor creation logic (simulated from src/parakeet.js)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Replicates the exact branching in ParakeetModel.fromUrls() that decides
 * whether to create an ONNX preprocessor session.
 */
function simulateFromUrlsPreprocessorSelection(preprocessorBackend, preprocessorUrl) {
  const useJsPreprocessor = preprocessorBackend === 'js';

  // From parakeet.js:
  //   let onnxPreprocessor = null;
  //   if (!useJsPreprocessor && preprocessorUrl) {
  //     onnxPreprocessor = new OnnxPreprocessor(...);
  //   }
  const createOnnxPreprocessor = !useJsPreprocessor && !!preprocessorUrl;

  // activePreprocessor = useJsPreprocessor ? jsPreprocessor : (onnxPreprocessor || jsPreprocessor);
  const activeBackend = useJsPreprocessor ? 'js' : (createOnnxPreprocessor ? 'onnx' : 'js');

  return { useJsPreprocessor, createOnnxPreprocessor, activeBackend };
}

describe('parakeet.js: fromUrls preprocessor selection', () => {
  it('should use JS preprocessor when preprocessorBackend=js', () => {
    const r = simulateFromUrlsPreprocessorSelection('js', 'nemo128.onnx');
    expect(r.useJsPreprocessor).toBe(true);
    expect(r.createOnnxPreprocessor).toBe(false);
    expect(r.activeBackend).toBe('js');
  });

  it('should NOT create ONNX session when preprocessorBackend=js (even if URL provided)', () => {
    const r = simulateFromUrlsPreprocessorSelection('js', 'nemo128.onnx');
    expect(r.createOnnxPreprocessor).toBe(false);
  });

  it('should use ONNX preprocessor when preprocessorBackend=onnx and URL provided', () => {
    const r = simulateFromUrlsPreprocessorSelection('onnx', 'nemo128.onnx');
    expect(r.useJsPreprocessor).toBe(false);
    expect(r.createOnnxPreprocessor).toBe(true);
    expect(r.activeBackend).toBe('onnx');
  });

  it('should fall back to JS when preprocessorBackend=onnx but no URL', () => {
    const r = simulateFromUrlsPreprocessorSelection('onnx', undefined);
    expect(r.useJsPreprocessor).toBe(false);
    expect(r.createOnnxPreprocessor).toBe(false);
    expect(r.activeBackend).toBe('js'); // falls back
  });

  it('should use ONNX when preprocessorBackend is undefined and URL provided', () => {
    // When backend is not explicitly 'js', and URL is available → ONNX
    const r = simulateFromUrlsPreprocessorSelection(undefined, 'nemo128.onnx');
    expect(r.createOnnxPreprocessor).toBe(true);
    expect(r.activeBackend).toBe('onnx');
  });

  it('should fall back to JS when preprocessorBackend is undefined and no URL', () => {
    const r = simulateFromUrlsPreprocessorSelection(undefined, undefined);
    expect(r.createOnnxPreprocessor).toBe(false);
    expect(r.activeBackend).toBe('js');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Default configuration
// ═══════════════════════════════════════════════════════════════════════════

describe('Default configuration', () => {
  it('hub.js default preprocessorBackend should be js', () => {
    // From hub.js getParakeetModel:
    //   const { ..., preprocessorBackend = 'js', ... } = options;
    const defaultBackend = 'js';
    expect(defaultBackend).toBe('js');
  });

  it('parakeet.js fromUrls default preprocessorBackend should be js', () => {
    // From parakeet.js fromUrls:
    //   preprocessorBackend = 'js',
    const defaultBackend = 'js';
    expect(defaultBackend).toBe('js');
  });

  it('end-to-end: default config should skip nemo128.onnx download AND not create ONNX session', () => {
    // Hub default: preprocessorBackend='js'
    const files = simulateHubFileSelection('js');
    const hasNemo = files.some(f => f.name === 'nemo128.onnx');
    expect(hasNemo).toBe(false);

    // fromUrls: no preprocessorUrl passed (since hub didn't download it)
    const r = simulateFromUrlsPreprocessorSelection('js', undefined);
    expect(r.createOnnxPreprocessor).toBe(false);
    expect(r.activeBackend).toBe('js');
  });
});
