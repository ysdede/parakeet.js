/**
 * Simplified HuggingFace Hub utilities for parakeet.js
 * Downloads models from HF and caches them in browser storage.
 */

import { getModelConfig } from './models.js';
/** @typedef {import('./models.js').ModelConfig} ModelConfig */

const DB_NAME = 'parakeet-cache-db';
const STORE_NAME = 'file-store';
let dbPromise = null;

// Cache for repo file listings so we only hit the HF API once per page load.
// Cache successful lookups only. Failed lookups intentionally do not cache.
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
 * Encode an HF repo path (org/name) by segments.
 * @param {string} repoId
 * @returns {string}
 */
function encodeRepoPath(repoId) {
  return String(repoId || '')
    .split('/')
    .map((part) => encodeURIComponent(part))
    .join('/');
}

/**
 * Normalize HF tree/metadata path entry.
 * @param {string} path
 * @returns {string}
 */
function normalizeRepoPath(path) {
  if (typeof path !== 'string') return '';
  const normalized = path.replace(/^\.\//, '').replace(/\\/g, '/');
  return normalized;
}

/**
 * Parse file listing payload from HF tree or metadata endpoints.
 * @param {unknown} payload
 * @returns {string[]}
 */
function parseRepoListingPayload(payload) {
  if (Array.isArray(payload)) {
    return payload
      .filter((entry) => entry?.type === 'file' && typeof entry?.path === 'string')
      .map((entry) => normalizeRepoPath(entry.path));
  }

  if (payload && typeof payload === 'object' && Array.isArray(payload.siblings)) {
    return payload.siblings
      .map((entry) => normalizeRepoPath(entry?.rfilename))
      .filter(Boolean);
  }

  return [];
}

/**
 * Whether a listing contains a given filename at repo root or in nested path.
 * @param {string[]|null} repoFiles
 * @param {string} filename
 * @returns {boolean}
 */
function repoHasFile(repoFiles, filename) {
  if (!repoFiles) return false;
  const target = normalizeRepoPath(filename);
  return repoFiles.some((path) => path === target || path.endsWith(`/${target}`));
}

/**
 * List model repository files from the Hugging Face model API.
 *
 * Returns `null` when listing is unavailable (network/API failure), which is
 * distinct from an empty successful listing (`[]`).
 *
 * @param {string} repoId - Hugging Face repository ID.
 * @param {string} [revision='main'] - Git revision/branch/tag.
 * @returns {Promise<string[]|null>} Repository file paths, or `null` if listing could not be obtained.
 */
async function listRepoFiles(repoId, revision = 'main') {
  const cacheKey = `${repoId}@${revision}`;
  if (repoFileCache.has(cacheKey)) return repoFileCache.get(cacheKey);

  const encodedRepoId = encodeRepoPath(repoId);
  const encodedRevision = encodeURIComponent(revision);
  const treeUrl = `https://huggingface.co/api/models/${encodedRepoId}/tree/${encodedRevision}?recursive=1`;
  const modelUrl = `https://huggingface.co/api/models/${encodedRepoId}?revision=${encodedRevision}`;

  try {
    const resp = await fetch(treeUrl);
    if (!resp.ok) throw new Error(`Failed to list repo files from tree API: ${resp.status}`);
    const files = parseRepoListingPayload(await resp.json());
    repoFileCache.set(cacheKey, files);
    return files;
  } catch (treeErr) {
    console.warn('[Hub] Could not fetch repo tree listing; trying model metadata listing', treeErr);
  }

  try {
    const resp = await fetch(modelUrl);
    if (!resp.ok) throw new Error(`Failed to list repo files from metadata API: ${resp.status}`);
    const files = parseRepoListingPayload(await resp.json());
    repoFileCache.set(cacheKey, files);
    return files;
  } catch (metadataErr) {
    console.warn('[Hub] Could not fetch repo file list – falling back to optimistic fetch', metadataErr);
    return null;
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
      request.onerror = () => reject('Error opening IndexedDB');
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
    request.onerror = () => reject('Error reading from DB');
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
    request.onerror = () => reject('Error writing to DB');
    request.onsuccess = () => resolve(request.result);
  });
}

/**
 * Download a file from HuggingFace Hub with caching support.
 *
 * NOTE:
 * - `filename` and `subfolder` must be raw (not URL-encoded) path segments.
 * - This function performs per-segment encoding internally.
 * - Passing pre-encoded values may cause double-encoding.
 *
 * @param {string} repoId Model repo ID (e.g., 'nvidia/parakeet-tdt-1.1b').
 * @param {string} filename File to download (e.g., 'encoder-model.onnx').
 * @param {Object} [options]
 * @param {string} [options.revision='main'] Git revision.
 * @param {string} [options.subfolder=''] Subfolder within repo.
 * @param {(progress: {loaded: number, total: number, file: string}) => void} [options.progress] Progress callback.
 * @returns {Promise<string>} URL to cached file (blob URL).
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

  const baseUrl = 'https://huggingface.co';
  const pathParts = [encodeRepoPath(repoId), 'resolve', encodedRevision];
  if (encodedSubfolder) pathParts.push(encodedSubfolder);
  pathParts.push(encodedFilename);
  const url = `${baseUrl}/${pathParts.join('/')}`;

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

  console.log(`[Hub] Downloading ${filename} from ${repoId}...`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${filename}: ${response.status} ${response.statusText}`);
  }

  const contentLength = response.headers.get('content-length');
  const total = contentLength ? parseInt(contentLength, 10) : 0;
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

  const blob = new Blob(chunks, { type: response.headers.get('content-type') || 'application/octet-stream' });

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
 * @param {string} repoId Model repo ID.
 * @param {string} filename Text file to download.
 * @param {Object} [options] Same as getModelFile.
 * @returns {Promise<string>} File content as text.
 */
export async function getModelText(repoId, filename, options = {}) {
  const blobUrl = await getModelFile(repoId, filename, options);
  const response = await fetch(blobUrl);
  const text = await response.text();
  URL.revokeObjectURL(blobUrl);
  return text;
}

/**
 * @typedef {Object} ResolvedComponent
 * @property {'encoder'|'decoder'} name
 * @property {'encoderUrl'|'decoderUrl'} key
 * @property {string} baseName
 * @property {'int8'|'fp32'|'fp16'} quant
 * @property {string} filename
 */

/**
 * @param {'encoder'|'decoder'} name
 * @param {'int8'|'fp32'|'fp16'} quant
 * @returns {ResolvedComponent}
 */
function createComponent(name, quant) {
  const baseName = name === 'encoder' ? 'encoder-model' : 'decoder_joint-model';
  const key = name === 'encoder' ? 'encoderUrl' : 'decoderUrl';
  return {
    name,
    key,
    baseName,
    quant,
    filename: getQuantizedModelName(baseName, quant),
  };
}

/**
 * Validate requested FP16 component exists when listing is available.
 * Does not mutate quantization choice; throws actionable errors instead.
 *
 * @param {ResolvedComponent} component
 * @param {string} repoId
 * @param {string[]|null} repoFiles
 */
function validateRequestedFp16Component(component, repoId, repoFiles) {
  if (component.quant !== 'fp16' || repoFiles === null) return;

  const fp16Name = getQuantizedModelName(component.baseName, 'fp16');
  const fp32Name = getQuantizedModelName(component.baseName, 'fp32');

  if (repoHasFile(repoFiles, fp16Name)) return;

  if (repoHasFile(repoFiles, fp32Name)) {
    throw new Error(
      `[Hub] ${component.name} FP16 file is missing in ${repoId} (found ${fp32Name} instead). ` +
      `Requested quantization is strict; choose encoderQuant/decoderQuant='fp32' explicitly.`
    );
  }

  throw new Error(
    `[Hub] Missing ${component.name} model in ${repoId}: requested ${fp16Name}.`
  );
}

/**
 * @param {{encoder: ResolvedComponent, decoder: ResolvedComponent}} components
 * @param {'js'|'onnx'} preprocessorBackend
 * @param {'nemo80'|'nemo128'} preprocessor
 * @returns {Array<{key: string, name: string, componentName?: 'encoder'|'decoder', optional?: boolean}>}
 */
function buildRequiredDownloads(components, preprocessorBackend, preprocessor, verbose = false) {
  const files = [
    {
      key: components.encoder.key,
      name: components.encoder.filename,
      componentName: 'encoder',
      optional: false,
    },
    {
      key: components.decoder.key,
      name: components.decoder.filename,
      componentName: 'decoder',
      optional: false,
    },
    { key: 'tokenizerUrl', name: 'vocab.txt', optional: false },
  ];

  if (preprocessorBackend !== 'js') {
    files.push({ key: 'preprocessorUrl', name: `${preprocessor}.onnx`, optional: false });
    if (verbose) console.log(`[Hub] Preprocessor: ONNX — will download ${preprocessor}.onnx`);
  } else {
    if (verbose) console.log(`[Hub] Preprocessor: JS (mel.js) — skipping ${preprocessor}.onnx download`);
  }

  return files;
}

/**
 * @param {{encoder: ResolvedComponent, decoder: ResolvedComponent}} components
 * @param {string[]|null} repoFiles
 * @returns {Array<{key: 'encoderDataUrl'|'decoderDataUrl', name: string, optional: true}>}
 */
function buildOptionalExternalDataDownloads(components, repoFiles) {
  const candidates = [
    { key: 'encoderDataUrl', name: `${components.encoder.filename}.data`, optional: true },
    { key: 'decoderDataUrl', name: `${components.decoder.filename}.data`, optional: true },
  ];

  // When listing is unavailable, skip optimistic .data fetches to avoid extra 404 round-trips.
  if (repoFiles === null) return [];
  return candidates.filter((entry) => repoHasFile(repoFiles, entry.name));
}

/**
 * Convenience function to get all Parakeet model files for a given architecture.
 *
 * Quantization behavior:
 * - Requested quantization is strict (no automatic FP16 -> FP32 fallback in core API).
 * - If requested files are missing, throws actionable errors.
 *
 * @param {string} repoIdOrModelKey HF repo (e.g., 'nvidia/parakeet-tdt-1.1b') or model key (e.g., 'parakeet-tdt-0.6b-v3').
 * @param {Object} [options]
 * @param {('int8'|'fp32'|'fp16')} [options.encoderQuant='int8'] Encoder quantization.
 * @param {('int8'|'fp32'|'fp16')} [options.decoderQuant='int8'] Decoder quantization.
 * @param {('nemo80'|'nemo128')} [options.preprocessor] Preprocessor variant (auto-detected from model config if not specified).
 * @param {('js'|'onnx')} [options.preprocessorBackend='js'] Preprocessor backend selection.
 * @param {('webgpu'|'webgpu-hybrid'|'webgpu-strict'|'wasm')} [options.backend='webgpu'] Backend mode (`webgpu` alias is accepted for compatibility).
 * @param {(progress: {loaded: number, total: number, file: string}) => void} [options.progress] Progress callback.
 * @returns {Promise<{urls: {encoderUrl: string, decoderUrl: string, tokenizerUrl: string, preprocessorUrl?: string, encoderDataUrl?: string|null, decoderDataUrl?: string|null}, filenames: {encoder: string, decoder: string}, quantisation: {encoder: ('int8'|'fp32'|'fp16'), decoder: ('int8'|'fp32'|'fp16')}, modelConfig: ModelConfig|null, preprocessorBackend: ('js'|'onnx')}>}
 */
export async function getParakeetModel(repoIdOrModelKey, options = {}) {
  const modelConfig = getModelConfig(repoIdOrModelKey);
  const repoId = modelConfig?.repoId || repoIdOrModelKey;
  const defaultPreprocessor = modelConfig?.preprocessor || 'nemo128';

  const {
    encoderQuant = 'int8',
    decoderQuant = 'int8',
    preprocessor = defaultPreprocessor,
    preprocessorBackend = 'js',
    backend = 'webgpu',
    progress,
    verbose = false,
  } = options;

  let encoderQ = encoderQuant;
  if (backend.startsWith('webgpu') && encoderQ === 'int8') {
    console.warn('[Hub] Forcing encoder to fp32 on WebGPU (int8 unsupported)');
    encoderQ = 'fp32';
  }

  const components = {
    encoder: createComponent('encoder', encoderQ),
    decoder: createComponent('decoder', decoderQuant),
  };

  const repoFiles = await listRepoFiles(repoId, options.revision || 'main');

  validateRequestedFp16Component(components.encoder, repoId, repoFiles);
  validateRequestedFp16Component(components.decoder, repoId, repoFiles);

  const requiredFiles = buildRequiredDownloads(components, preprocessorBackend, preprocessor, verbose);

  const results = {
    urls: {},
    filenames: {
      encoder: components.encoder.filename,
      decoder: components.decoder.filename,
    },
    quantisation: {
      encoder: components.encoder.quant,
      decoder: components.decoder.quant,
    },
    modelConfig: modelConfig || null,
    preprocessorBackend,
  };

  for (const file of requiredFiles) {
    try {
      results.urls[file.key] = await getModelFile(repoId, file.name, { ...options, progress });
    } catch (err) {
      if (!file.componentName) {
        throw err;
      }

      const component = components[file.componentName];
      if (component.quant === 'fp16') {
        throw new Error(
          `[Hub] ${component.name} FP16 download failed (${file.name}). ` +
          `Requested quantization is strict; choose encoderQuant/decoderQuant='fp32' explicitly. ` +
          `Original error: ${err.message || err}`
        );
      }

      throw err;
    }
  }

  const optionalFiles = buildOptionalExternalDataDownloads(components, repoFiles);
  for (const file of optionalFiles) {
    try {
      results.urls[file.key] = await getModelFile(repoId, file.name, { ...options, progress });
    } catch {
      console.warn(`[Hub] Optional external data file not found: ${file.name}. This is expected if the model is small.`);
      results.urls[file.key] = null;
    }
  }

  return results;
}
