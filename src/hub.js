/**
 * Simplified HuggingFace Hub utilities for parakeet.js
 * Downloads models from HF and caches them in browser storage.
 */

import { MODELS, getModelConfig } from './models.js';
/** @typedef {import('./models.js').ModelConfig} ModelConfig */

const DB_NAME = 'parakeet-cache-db';
const STORE_NAME = 'file-store';
let dbPromise = null;

// Cache for repo file listings so we only hit the HF API once per page load
const repoFileCache = new Map();
const QUANT_SUFFIX = {
  int8: '.int8.onnx',
  fp16: '.fp16.onnx',
  fp32: '.onnx',
};

/**
 * @param {string} baseName - Base filename (e.g. 'encoder-model').
 * @param {('int8'|'fp32'|'fp16')} quant - Quantization key.
 * @returns {string} Filename with quant suffix (e.g. 'encoder-model.fp16.onnx').
 */
function getQuantizedModelName(baseName, quant) {
  return `${baseName}${QUANT_SUFFIX[quant] || QUANT_SUFFIX.fp32}`;
}

/**
 * List model repository files from the Hugging Face model API.
 * @param {string} repoId - Hugging Face repository ID.
 * @param {string} [revision='main'] - Git revision/branch/tag.
 * @returns {Promise<string[]>} Repository file paths.
 */
async function listRepoFiles(repoId, revision = 'main') {
  const cacheKey = `${repoId}@${revision}`;
  if (repoFileCache.has(cacheKey)) return repoFileCache.get(cacheKey);

  const encodedRevision = encodeURIComponent(revision);
  const treeUrl = `https://huggingface.co/api/models/${repoId}/tree/${encodedRevision}?recursive=1`;
  const modelUrl = `https://huggingface.co/api/models/${repoId}?revision=${encodedRevision}`;
  try {
    const resp = await fetch(treeUrl);
    if (!resp.ok) throw new Error(`Failed to list repo files: ${resp.status}`);
    const json = await resp.json();
    let files = [];
    if (Array.isArray(json)) {
      files = json
        .filter((entry) => entry?.type === 'file' && typeof entry?.path === 'string')
        .map((entry) => entry.path);
    } else {
      // Backward-compatible fallback for mocked/legacy response shape.
      files = json.siblings?.map((s) => s.rfilename) || [];
    }
    repoFileCache.set(cacheKey, files);
    return files;
  } catch (err) {
    console.warn('[Hub] Could not fetch repo tree listing; trying model metadata listing', err);
    try {
      const resp = await fetch(modelUrl);
      if (!resp.ok) throw new Error(`Failed to list repo files: ${resp.status}`);
      const json = await resp.json();
      const files = json.siblings?.map((s) => s.rfilename) || [];
      repoFileCache.set(cacheKey, files);
      return files;
    } catch (fallbackErr) {
      console.warn('[Hub] Could not fetch repo file list – falling back to optimistic fetch', fallbackErr);
      // Return empty list so caller behaves like old code (may attempt fetch and catch 404)
      repoFileCache.set(cacheKey, []);
      return [];
    }
  }
}

/**
 * Get (or initialize) the IndexedDB database handle used for caching.
 * @returns {Promise<IDBDatabase>} Open IndexedDB database instance.
 */
function getDb() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onerror = () => reject("Error opening IndexedDB");
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
    });
  }
  return dbPromise;
}

/**
 * Read a cached file blob from IndexedDB.
 * @param {string} key - Cache key.
 * @returns {Promise<Blob|undefined>} Cached blob if found.
 */
async function getFileFromDb(key) {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(key);
    request.onerror = () => reject("Error reading from DB");
    request.onsuccess = () => resolve(request.result);
  });
}

/**
 * Save a file blob into IndexedDB.
 * @param {string} key - Cache key.
 * @param {Blob} blob - Blob to store.
 * @returns {Promise<IDBValidKey | undefined>} IndexedDB request result.
 */
async function saveFileToDb(key, blob) {
    const db = await getDb();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(blob, key);
        request.onerror = () => reject("Error writing to DB");
        request.onsuccess = () => resolve(request.result);
    });
}

/**
 * Download a file from HuggingFace Hub with caching support.
 * @param {string} repoId Model repo ID (e.g., 'nvidia/parakeet-tdt-1.1b')
 * @param {string} filename File to download (e.g., 'encoder-model.onnx')
 * @param {Object} [options]
 * @param {string} [options.revision='main'] Git revision
 * @param {string} [options.subfolder=''] Subfolder within repo
 * @param {(progress: {loaded: number, total: number, file: string}) => void} [options.progress] Progress callback
 * @returns {Promise<string>} URL to cached file (blob URL)
 */
export async function getModelFile(repoId, filename, options = {}) {
  const { revision = 'main', subfolder = '', progress } = options;
  const encodedRevision = encodeURIComponent(revision);
  const encodedSubfolder = subfolder
    ? subfolder.split('/').map((part) => encodeURIComponent(part)).join('/')
    : '';
  const encodedFilename = filename
    .split('/')
    .map((part) => encodeURIComponent(part))
    .join('/');
  
  // Construct HF URL
  const baseUrl = 'https://huggingface.co';
  const pathParts = [repoId, 'resolve', encodedRevision];
  if (encodedSubfolder) pathParts.push(encodedSubfolder);
  pathParts.push(encodedFilename);
  const url = `${baseUrl}/${pathParts.join('/')}`;
  
  // Check IndexedDB first
  const cacheKey = `hf-${repoId}-${revision}-${subfolder}-${filename}`;
  
  if (typeof indexedDB !== 'undefined') {
    try {
      const cachedBlob = await getFileFromDb(cacheKey);
      if (cachedBlob) {
        console.log(`[Hub] Using cached ${filename} from IndexedDB`);
        return URL.createObjectURL(cachedBlob);
      }
    } catch (e) {
      console.warn('[Hub] IndexedDB cache check failed:', e);
    }
  }
  
  // Download from HF
  console.log(`[Hub] Downloading ${filename} from ${repoId}...`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${filename}: ${response.status} ${response.statusText}`);
  }
  
  // Stream with progress
  const contentLength = response.headers.get('content-length');
  const total = contentLength ? parseInt(contentLength) : 0;
  let loaded = 0;
  
  const reader = response.body.getReader();
  const chunks = [];
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    chunks.push(value);
    loaded += value.length;
    
    if (progress && total > 0) {
      progress({ loaded, total, file: filename });
    }
  }
  
  // Reconstruct blob
  const blob = new Blob(chunks, { type: response.headers.get('content-type') || 'application/octet-stream' });
  
  // Cache the blob in IndexedDB
  if (typeof indexedDB !== 'undefined') {
    try {
      await saveFileToDb(cacheKey, blob);
       console.log(`[Hub] Cached ${filename} in IndexedDB`);
    } catch (e) {
      console.warn('[Hub] Failed to cache in IndexedDB:', e);
    }
  }
  
  return URL.createObjectURL(blob);
}

/**
 * Download text file from HF Hub.
 * @param {string} repoId Model repo ID
 * @param {string} filename Text file to download
 * @param {Object} [options] Same as getModelFile
 * @returns {Promise<string>} File content as text
 */
export async function getModelText(repoId, filename, options = {}) {
  const blobUrl = await getModelFile(repoId, filename, options);
  const response = await fetch(blobUrl);
  const text = await response.text();
  URL.revokeObjectURL(blobUrl); // Clean up blob URL
  return text;
}

/**
 * Convenience function to get all Parakeet model files for a given architecture.
 * @param {string} repoIdOrModelKey HF repo (e.g., 'nvidia/parakeet-tdt-1.1b') or model key (e.g., 'parakeet-tdt-0.6b-v3')
 * @param {Object} [options]
 * @param {('int8'|'fp32'|'fp16')} [options.encoderQuant='int8'] Encoder quantization
 * @param {('int8'|'fp32'|'fp16')} [options.decoderQuant='int8'] Decoder quantization
 * @param {('nemo80'|'nemo128')} [options.preprocessor] Preprocessor variant (auto-detected from model config if not specified)
 * @param {('js'|'onnx')} [options.preprocessorBackend='js'] Preprocessor backend selection.
 * @param {('webgpu'|'webgpu-hybrid'|'webgpu-strict'|'wasm')} [options.backend='webgpu'] Backend mode (`webgpu` alias is accepted for compatibility)
 * @param {(progress: {loaded: number, total: number, file: string}) => void} [options.progress] Progress callback
 * @returns {Promise<{urls: {encoderUrl: string, decoderUrl: string, tokenizerUrl: string, preprocessorUrl?: string, encoderDataUrl?: string|null, decoderDataUrl?: string|null}, filenames: {encoder: string, decoder: string}, quantisation: {encoder: ('int8'|'fp32'|'fp16'), decoder: ('int8'|'fp32'|'fp16')}, modelConfig: ModelConfig|null, preprocessorBackend: ('js'|'onnx')}>}
 */
export async function getParakeetModel(repoIdOrModelKey, options = {}) {
  // Resolve model key to repo ID and get config
  const modelConfig = getModelConfig(repoIdOrModelKey);
  const repoId = modelConfig?.repoId || repoIdOrModelKey;
  
  // Use model config defaults if available
  const defaultPreprocessor = modelConfig?.preprocessor || 'nemo128';
  
  const { encoderQuant = 'int8', decoderQuant = 'int8', preprocessor = defaultPreprocessor, preprocessorBackend = 'js', backend = 'webgpu', progress } = options;
  
  // Decide quantisation per component
  let encoderQ = encoderQuant;
  let decoderQ = decoderQuant;

  if (backend.startsWith('webgpu') && encoderQ === 'int8') {
    console.warn('[Hub] Forcing encoder to fp32 on WebGPU (int8 unsupported)');
    encoderQ = 'fp32';
  }

  const repoFiles = await listRepoFiles(repoId, options.revision || 'main');
  const hasRepoListing = repoFiles.length > 0;

  const components = {
    encoder: {
      key: 'encoderUrl',
      baseName: 'encoder-model',
      filename: getQuantizedModelName('encoder-model', encoderQ),
      quant: encoderQ,
    },
    decoder: {
      key: 'decoderUrl',
      baseName: 'decoder_joint-model',
      filename: getQuantizedModelName('decoder_joint-model', decoderQ),
      quant: decoderQ,
    },
  };

  for (const [name, component] of Object.entries(components)) {
    if (component.quant !== 'fp16') continue;
    if (!hasRepoListing) continue;

    const fp16Name = getQuantizedModelName(component.baseName, 'fp16');
    const fp32Name = getQuantizedModelName(component.baseName, 'fp32');

    if (repoFiles.includes(fp16Name)) continue;
    if (repoFiles.includes(fp32Name)) {
      console.warn(`[Hub] ${name} FP16 file missing in ${repoId}; falling back to FP32 (${fp32Name})`);
      component.filename = fp32Name;
      component.quant = 'fp32';
      continue;
    }

    throw new Error(
      `[Hub] Missing ${name} model in ${repoId}: requested ${fp16Name}, fallback ${fp32Name} is also unavailable`
    );
  }

  const filesToGet = [
    { key: components.encoder.key, name: components.encoder.filename },
    { key: components.decoder.key, name: components.decoder.filename },
    { key: 'tokenizerUrl', name: 'vocab.txt' },
  ];

  // Only download preprocessor ONNX when not using JS backend
  if (preprocessorBackend !== 'js') {
    filesToGet.push({ key: 'preprocessorUrl', name: `${preprocessor}.onnx` });
    console.log(`[Hub] Preprocessor: ONNX — will download ${preprocessor}.onnx`);
  } else {
    console.log(`[Hub] Preprocessor: JS (mel.js) — skipping ${preprocessor}.onnx download`);
  }

  const results = {
      urls: {},
      filenames: {
          encoder: components.encoder.filename,
          decoder: components.decoder.filename
      },
      quantisation: { encoder: components.encoder.quant, decoder: components.decoder.quant },
      modelConfig: modelConfig || null,  // Include model config for downstream use
      preprocessorBackend,  // Pass through so callers know which backend to use
  };

  for (const file of filesToGet) {
    const { key, name } = file;
    try {
      results.urls[key] = await getModelFile(repoId, name, { ...options, progress });
    } catch (e) {
      if (key !== 'encoderUrl' && key !== 'decoderUrl') {
        throw e;
      }

      const componentName = key === 'encoderUrl' ? 'encoder' : 'decoder';
      const component = components[componentName];
      const fallbackName = getQuantizedModelName(component.baseName, 'fp32');

      // If FP16 was optimistically selected (repo listing unavailable), fallback at download time.
      if (component.quant === 'fp16' && fallbackName !== name) {
        console.warn(
          `[Hub] ${componentName} FP16 download failed (${name}); retrying with FP32 (${fallbackName})`,
          e
        );
        try {
          results.urls[key] = await getModelFile(repoId, fallbackName, { ...options, progress });
          component.filename = fallbackName;
          component.quant = 'fp32';
          results.filenames[componentName] = fallbackName;
          results.quantisation[componentName] = 'fp32';
          continue;
        } catch (fallbackError) {
          throw new Error(
            `[Hub] Missing ${componentName} model in ${repoId}: requested ${name}, fallback ${fallbackName} failed (${fallbackError.message || fallbackError})`
          );
        }
      } else {
        throw e;
      }
    }
  }

  // Conditionally include external data files.
  // If repo listing is unavailable, try optimistic fetch for compatibility.
  const externalDataCandidates = [
    { key: 'encoderDataUrl', name: `${components.encoder.filename}.data` },
    { key: 'decoderDataUrl', name: `${components.decoder.filename}.data` },
  ];

  for (const { key, name } of externalDataCandidates) {
    if (hasRepoListing && !repoFiles.includes(name)) continue;
    try {
      results.urls[key] = await getModelFile(repoId, name, { ...options, progress });
    } catch (e) {
      console.warn(`[Hub] Optional external data file not found: ${name}. This is expected if the model is small.`);
      results.urls[key] = null;
    }
  }
  
  return results;
}
