export const DEFAULT_MODEL_REVISIONS = ['main'];
export const QUANTIZATION_ORDER = ['fp16', 'int8', 'fp32'];

const MODEL_REVISIONS_CACHE = new Map();
const MODEL_FILES_CACHE = new Map();

export function formatRepoPath(repoId) {
  return String(repoId || '')
    .split('/')
    .map((part) => encodeURIComponent(part))
    .join('/');
}

function normalizePath(path) {
  return String(path || '').replace(/^\.\/+/, '').replace(/\\/g, '/');
}

function parseModelFiles(payload) {
  if (Array.isArray(payload)) {
    return payload
      .filter((entry) => entry?.type === 'file' && typeof entry?.path === 'string')
      .map((entry) => normalizePath(entry.path));
  }

  if (payload && typeof payload === 'object' && Array.isArray(payload.siblings)) {
    return payload.siblings
      .map((entry) => normalizePath(entry?.rfilename))
      .filter(Boolean);
  }

  return [];
}

function hasFile(files, filename) {
  const target = normalizePath(filename);
  return files.some((path) => path === target || path.endsWith(`/${target}`));
}

export async function fetchModelRevisions(repoId) {
  if (!repoId) return DEFAULT_MODEL_REVISIONS;
  if (MODEL_REVISIONS_CACHE.has(repoId)) {
    return MODEL_REVISIONS_CACHE.get(repoId);
  }

  try {
    const repoPath = formatRepoPath(repoId);
    const response = await fetch(`https://huggingface.co/api/models/${repoPath}/refs`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    const branches = Array.isArray(payload?.branches)
      ? payload.branches.map((branch) => branch?.name).filter(Boolean)
      : [];
    const revisions = branches.length > 0 ? branches : DEFAULT_MODEL_REVISIONS;
    MODEL_REVISIONS_CACHE.set(repoId, revisions);
    return revisions;
  } catch (error) {
    console.warn(`[modelSelection] Failed to fetch revisions for ${repoId}; using defaults`, error);
    return DEFAULT_MODEL_REVISIONS;
  }
}

export async function fetchModelFiles(repoId, revision = 'main') {
  if (!repoId) return [];
  const cacheKey = `${repoId}@${revision}`;
  if (MODEL_FILES_CACHE.has(cacheKey)) {
    return MODEL_FILES_CACHE.get(cacheKey);
  }

  const repoPath = formatRepoPath(repoId);
  const encodedRevision = encodeURIComponent(revision);
  const treeUrl = `https://huggingface.co/api/models/${repoPath}/tree/${encodedRevision}?recursive=1`;
  const metadataUrl = `https://huggingface.co/api/models/${repoPath}?revision=${encodedRevision}`;

  try {
    const response = await fetch(treeUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const files = parseModelFiles(await response.json());
    MODEL_FILES_CACHE.set(cacheKey, files);
    return files;
  } catch (treeError) {
    console.warn(`[modelSelection] Tree listing failed for ${repoId}@${revision}; trying metadata`, treeError);
  }

  try {
    const response = await fetch(metadataUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const files = parseModelFiles(await response.json());
    MODEL_FILES_CACHE.set(cacheKey, files);
    return files;
  } catch (metadataError) {
    console.warn(`[modelSelection] Metadata listing failed for ${repoId}@${revision}`, metadataError);
    return [];
  }
}

export function getAvailableQuantModes(files, baseName) {
  const options = QUANTIZATION_ORDER.filter((quant) => {
    if (quant === 'fp32') return hasFile(files, `${baseName}.onnx`);
    if (quant === 'fp16') return hasFile(files, `${baseName}.fp16.onnx`);
    return hasFile(files, `${baseName}.int8.onnx`);
  });
  return options.length > 0 ? options : ['fp32'];
}

export function pickPreferredQuant(available, currentBackend, component = 'encoder') {
  let preferred;

  if (component === 'decoder') {
    preferred = ['int8', 'fp32', 'fp16'];
  } else {
    preferred = String(currentBackend || '').startsWith('webgpu')
      ? ['fp16', 'fp32', 'int8']
      : ['int8', 'fp32', 'fp16'];
  }

  return preferred.find((quant) => available.includes(quant)) || available[0] || 'fp32';
}
