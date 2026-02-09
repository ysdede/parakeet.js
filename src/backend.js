// Back-end initialisation helper for ONNX Runtime Web.
// At runtime the caller can specify preferred backend ("webgpu", "wasm").
// The function resolves once ONNX Runtime is ready and returns the `ort` module.

/**
 * Initialise ONNX Runtime Web and pick the execution provider.
 * If WebGPU is requested but not supported, we transparently fall back to WASM.
 * @param {Object} opts
 * @param {('webgpu'|'wasm')} [opts.backend='webgpu'] Desired backend.
 * @param {string} [opts.wasmPaths] Optional path prefix for WASM binaries.
 * @returns {Promise<typeof import('onnxruntime-web').default>}
 */
export async function initOrt({ backend = 'webgpu', wasmPaths, numThreads } = {}) {
  // Dynamic import to handle Vite bundling issues
  let ort;

  try {
    const ortModule = await import('onnxruntime-web');
    ort = ortModule.default || ortModule;

    // Debug: Check the structure of ort
    console.log('[Parakeet.js] ORT structure:', {
      hasDefault: !!ortModule.default,
      hasEnv: !!ort.env,
      hasWasm: !!ort.env?.wasm,
      hasWebgpu: !!ort.env?.webgpu,
      keys: Object.keys(ort).slice(0, 10) // Show first 10 keys
    });

    // If still no env, try accessing it differently
    if (!ort.env) {
      console.log('[Parakeet.js] Trying alternative access patterns...');
      console.log('[Parakeet.js] ortModule keys:', Object.keys(ortModule));

      // Sometimes the module structure is nested
      if (ortModule.ort) {
        ort = ortModule.ort;
        console.log('[Parakeet.js] Found ort in ortModule.ort');
      }
    }
  } catch (e) {
    console.error('[Parakeet.js] Failed to import onnxruntime-web:', e);
    throw new Error('Failed to load ONNX Runtime Web. Please check your network connection.');
  }

  if (!ort || !ort.env) {
    throw new Error('ONNX Runtime Web loaded but env is not available. This might be a bundling issue.');
  }

  // Set up WASM paths first (needed for all backends)
  if (!ort.env.wasm.wasmPaths) {
    // Derive version from the ONNX Runtime environment
    const ver = ort.env.versions?.common;
    if (!ver) {
      throw new Error('Parakeet.js: Unable to automatically detect onnxruntime-web version for WASM configuration. Please manually set `ort.env.wasm.wasmPaths`.');
    }
    ort.env.wasm.wasmPaths = `https://cdn.jsdelivr.net/npm/onnxruntime-web@${ver}/dist/`;
  }

  // Configure WASM for better performance
  if (backend === 'wasm' || backend === 'webgpu') {
    // Enable multi-threading if supported
    if (typeof SharedArrayBuffer !== 'undefined') {
      ort.env.wasm.numThreads = numThreads || navigator.hardwareConcurrency || 4;
      ort.env.wasm.simd = true;
      console.log(`[Parakeet.js] WASM configured with ${ort.env.wasm.numThreads} threads, SIMD enabled`);
    } else {
      console.warn('[Parakeet.js] SharedArrayBuffer not available - using single-threaded WASM');
      ort.env.wasm.numThreads = 1;
    }

    // Enable other WASM optimizations
    ort.env.wasm.proxy = false; // Direct execution for better performance
  }

  if (backend === 'webgpu') {
    // Check WebGPU support properly
    const webgpuSupported = 'gpu' in navigator;
    console.log(`[Parakeet.js] WebGPU supported: ${webgpuSupported}`);

    if (webgpuSupported) {
      try {
        // In newer versions of ONNX Runtime Web, WebGPU initialization is automatic
        // No need to call ort.env.webgpu.init() manually
        console.log('[Parakeet.js] WebGPU will be initialized automatically when creating session');
      } catch (error) {
        console.warn('[Parakeet.js] WebGPU initialization failed:', error);
        console.warn('[Parakeet.js] Falling back to WASM');
        backend = 'wasm';
      }
    } else {
      console.warn('[Parakeet.js] WebGPU not supported – falling back to WASM');
      backend = 'wasm';
    }
  }

  // Store the final backend choice for use in model selection
  // Store the final backend choice for use in model selection
  // ort._selectedBackend = backend; // Removed: ort object is not extensible in newer versions

  // Expose ort globally so other modules (like SileroVAD) can use the same configured instance
  if (typeof globalThis !== 'undefined') {
    globalThis.ort = ort;
  }
  if (typeof self !== 'undefined') {
    self.ort = ort;
  }

  // Return the ort module for use in creating sessions and tensors
  return ort;
}