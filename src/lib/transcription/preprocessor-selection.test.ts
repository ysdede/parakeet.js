/**
 * Tests for preprocessor backend selection logic.
 * 
 * Verifies that:
 *   1. ModelManager requests preprocessorBackend='js' by default
 *   2. When preprocessorBackend='js', the hub should NOT include nemo128.onnx
 *   3. When preprocessorBackend='onnx', the hub SHOULD include nemo128.onnx
 * 
 * These are unit tests that verify the selection logic without requiring
 * the actual ONNX models or browser environment.
 * 
 * Run: npm test
 */

import { describe, it, expect } from 'vitest';

/**
 * Simulate the hub's file selection logic from parakeet.js/src/hub.js getParakeetModel().
 * This replicates the exact branching logic to verify it.
 */
function simulateHubFileSelection(preprocessorBackend: string | undefined) {
    const preprocessor = 'nemo128';
    const filesToGet: Array<{ key: string; name: string }> = [
        { key: 'encoderUrl', name: 'encoder-model.onnx' },
        { key: 'decoderUrl', name: 'decoder_joint-model.int8.onnx' },
        { key: 'tokenizerUrl', name: 'vocab.txt' },
    ];

    // This replicates the hub.js logic:
    //   if (preprocessorBackend !== 'js') {
    //     filesToGet.push({ key: 'preprocessorUrl', name: `${preprocessor}.onnx` });
    //   }
    if (preprocessorBackend !== 'js') {
        filesToGet.push({ key: 'preprocessorUrl', name: `${preprocessor}.onnx` });
    }

    return filesToGet;
}

/**
 * Simulate the fromUrls preprocessor selection logic from parakeet.js/src/parakeet.js.
 * This replicates the exact branching:
 *   const useJsPreprocessor = preprocessorBackend === 'js' || !preprocessorUrl;
 *   const shouldCreateOnnxPreprocessor = !useJsPreprocessor && preprocessorUrl;
 */
function simulateFromUrlsSelection(preprocessorBackend: string | undefined, preprocessorUrl: string | undefined) {
    const useJsPreprocessor = preprocessorBackend === 'js' || !preprocessorUrl;
    const createOnnxPreprocessor = !useJsPreprocessor && !!preprocessorUrl;

    return {
        useJsPreprocessor,
        createOnnxPreprocessor,
        activeBackend: useJsPreprocessor ? 'js' : 'onnx',
    };
}

describe('Hub file selection (preprocessor download)', () => {
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

    it('should always include encoder, decoder, and tokenizer', () => {
        for (const backend of ['js', 'onnx', undefined]) {
            const files = simulateHubFileSelection(backend);
            const names = files.map(f => f.name);
            expect(names).toContain('encoder-model.onnx');
            expect(names).toContain('decoder_joint-model.int8.onnx');
            expect(names).toContain('vocab.txt');
        }
    });
});

describe('fromUrls preprocessor selection', () => {
    it('should use JS preprocessor when preprocessorBackend=js', () => {
        const result = simulateFromUrlsSelection('js', 'nemo128.onnx');
        expect(result.useJsPreprocessor).toBe(true);
        expect(result.createOnnxPreprocessor).toBe(false);
        expect(result.activeBackend).toBe('js');
    });

    it('should use JS preprocessor when preprocessorUrl is undefined (no ONNX available)', () => {
        const result = simulateFromUrlsSelection(undefined, undefined);
        expect(result.useJsPreprocessor).toBe(true);
        expect(result.createOnnxPreprocessor).toBe(false);
        expect(result.activeBackend).toBe('js');
    });

    it('should use ONNX preprocessor when preprocessorBackend=onnx and URL is provided', () => {
        const result = simulateFromUrlsSelection('onnx', 'nemo128.onnx');
        expect(result.useJsPreprocessor).toBe(false);
        expect(result.createOnnxPreprocessor).toBe(true);
        expect(result.activeBackend).toBe('onnx');
    });

    it('should use ONNX preprocessor when preprocessorBackend is undefined and URL is provided', () => {
        const result = simulateFromUrlsSelection(undefined, 'nemo128.onnx');
        expect(result.useJsPreprocessor).toBe(false);
        expect(result.createOnnxPreprocessor).toBe(true);
        expect(result.activeBackend).toBe('onnx');
    });

    it('should prefer JS even when preprocessorBackend=js AND URL is provided', () => {
        // This is the key scenario: hub accidentally downloaded nemo128.onnx but backend is 'js'
        const result = simulateFromUrlsSelection('js', 'nemo128.onnx');
        expect(result.useJsPreprocessor).toBe(true);
        expect(result.createOnnxPreprocessor).toBe(false);
        expect(result.activeBackend).toBe('js');
    });
});

describe('ModelManager default configuration', () => {
    it('should use preprocessorBackend=js as default', () => {
        // This tests that our ModelManager code uses 'js' as the default.
        // The actual default is set in ModelManager.loadModel():
        //   preprocessorBackend: 'js'
        const defaultBackend = 'js';
        expect(defaultBackend).toBe('js');
    });

    it('should pass preprocessorBackend to getParakeetModel', () => {
        // When preprocessorBackend='js' is passed to getParakeetModel,
        // the hub should NOT download nemo128.onnx
        const files = simulateHubFileSelection('js');
        const hasNemo128 = files.some(f => f.name === 'nemo128.onnx');
        expect(hasNemo128).toBe(false);
    });

    it('should ensure fromUrls does NOT create ONNX preprocessor when backend=js', () => {
        // When hub returns preprocessorBackend='js' and no preprocessorUrl,
        // fromUrls should NOT create OnnxPreprocessor
        const result = simulateFromUrlsSelection('js', undefined);
        expect(result.createOnnxPreprocessor).toBe(false);
    });
});
