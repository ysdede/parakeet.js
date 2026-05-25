/**
 * Local-folder model artifact detection and URL assembly helpers.
 * Extracted from App.jsx — pure functions with no React dependency.
 */

const QUANT_TO_FILENAME = {
  fp32: '.onnx',
  fp16: '.fp16.onnx',
  int8: '.int8.onnx',
};

/** Normalize backslashes and leading ./ in relative paths. */
export function normalizeRelPath(path) {
  return String(path || '').replace(/\\/g, '/').replace(/^\.\//, '');
}

export function getBasename(path) {
  return String(path || '').split('/').pop() || '';
}

/** Detect which quantization modes are available in a set of local entries. */
export function detectLocalQuantModes(entries, baseName) {
  const names = new Set(entries.map((entry) => entry.basename.toLowerCase()));
  const out = [];
  if (names.has(`${baseName}.onnx`)) out.push('fp32');
  if (names.has(`${baseName}.fp16.onnx`)) out.push('fp16');
  if (names.has(`${baseName}.int8.onnx`)) out.push('int8');
  return out;
}

/** Find a local entry by expected filename (case-insensitive). */
export function findLocalEntry(entries, expectedName) {
  const lower = expectedName.toLowerCase();
  return (
    entries.find((entry) => entry.path.toLowerCase() === lower) ||
    entries.find((entry) => entry.basename.toLowerCase() === lower) ||
    entries.find((entry) => entry.path.toLowerCase().endsWith(`/${lower}`)) ||
    null
  );
}

export function quantizedModelName(baseName, quant) {
  return `${baseName}${QUANT_TO_FILENAME[quant] || '.onnx'}`;
}

/** Collect all files from a directory handle recursively. */
export async function collectDirectoryFilesRecursive(dirHandle) {
  /** @type {Array<{path: string, basename: string, handle: FileSystemHandle}>} */
  const entries = [];
  async function walk(handle, prefix = '') {
    if (handle.kind === 'file') {
      entries.push({
        path: prefix ? `${prefix}/${handle.name}` : handle.name,
        basename: handle.name,
        handle,
      });
      return;
    }
    for await (const entry of handle.values()) {
      await walk(entry, prefix ? `${prefix}/${handle.name}` : handle.name);
    }
  }
  await walk(dirHandle);
  return entries;
}

/** Get a File object from a local file-handle entry. */
export async function getLocalFile(entry) {
  if (entry.file) return entry.file;
  if (entry.handle?.kind === 'file') return entry.handle.getFile();
  throw new Error(`Could not access local file entry: ${entry?.path || entry?.basename || 'unknown'}`);
}

/** Build blob URLs for local model artifacts and return the cleanup list. */
export async function buildLocalModelUrls(entries, {
  encoderEntry,
  decoderEntry,
  tokenizerEntry,
  preprocessorEntry,
}) {
  const createdBlobUrls = [];
  try {
    const encoderFile = encoderEntry ? await getLocalFile(encoderEntry) : null;
    const decoderFile = decoderEntry ? await getLocalFile(decoderEntry) : null;
    const tokenizerFile = tokenizerEntry ? await getLocalFile(tokenizerEntry) : null;
    const preprocessorFile = preprocessorEntry ? await getLocalFile(preprocessorEntry) : null;

    const encoderUrl = encoderFile ? URL.createObjectURL(encoderFile) : null;
    if (encoderUrl) createdBlobUrls.push(encoderUrl);
    const decoderUrl = decoderFile ? URL.createObjectURL(decoderFile) : null;
    if (decoderUrl) createdBlobUrls.push(decoderUrl);
    const tokenizerUrl = tokenizerFile ? URL.createObjectURL(tokenizerFile) : null;
    if (tokenizerUrl) createdBlobUrls.push(tokenizerUrl);
    const preprocessorUrl = preprocessorFile ? URL.createObjectURL(preprocessorFile) : null;
    if (preprocessorUrl) createdBlobUrls.push(preprocessorUrl);

    return {
      urls: { encoderUrl, decoderUrl, tokenizerUrl, preprocessorUrl, preprocessorBackend: 'onnx' },
      createdBlobUrls,
    };
  } catch (e) {
    // Clean up any URLs we already created
    for (const url of createdBlobUrls) URL.revokeObjectURL(url);
    throw e;
  }
}
