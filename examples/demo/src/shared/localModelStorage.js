/**
 * IndexedDB persistence for local-folder model directory handles.
 * Extracted from App.jsx to keep component focused on UI.
 */

const DB_NAME = 'parakeet-demo-local-model';
const STORE_NAME = 'handles';
const DIR_KEY = 'directory-handle';

/** Check whether the File System Access API + IndexedDB are available. */
export function supportsDirectoryHandlePersistence() {
  if (typeof window === 'undefined') return false;
  if (typeof window.showDirectoryPicker !== 'function') return false;
  if (typeof indexedDB === 'undefined') return false;
  try { if (window.self !== window.top) return false; } catch { return false; }
  return true;
}

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onerror = () => reject(new Error('Failed to open local model IndexedDB'));
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

/** Read a previously persisted FileSystemDirectoryHandle, or null. */
export async function readPersistedDirectoryHandle() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    let settled = false;
    const closeDb = () => { try { db.close(); } catch { /* ignore */ } };
    const resolveOnce = (v) => { if (!settled) { settled = true; resolve(v); } };
    const rejectOnce = (e) => { if (!settled) { settled = true; reject(e); } };
    const tx = db.transaction([STORE_NAME], 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(DIR_KEY);
    req.onerror = () => { closeDb(); rejectOnce(new Error('Failed to read persisted folder handle')); };
    req.onsuccess = () => { closeDb(); resolveOnce(req.result || null); };
    tx.onabort = () => { closeDb(); rejectOnce(new Error('Failed to read persisted folder handle')); };
    tx.onerror = () => { closeDb(); rejectOnce(new Error('Failed to read persisted folder handle')); };
  });
}

/** Persist a FileSystemDirectoryHandle for future page loads. */
export async function persistDirectoryHandle(dirHandle) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    let settled = false;
    const closeDb = () => { try { db.close(); } catch { /* ignore */ } };
    const resolveOnce = () => { if (!settled) { settled = true; resolve(); } };
    const rejectOnce = (e) => { if (!settled) { settled = true; reject(e); } };
    const tx = db.transaction([STORE_NAME], 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(dirHandle, DIR_KEY);
    req.onerror = () => { closeDb(); rejectOnce(new Error('Failed to persist folder handle')); };
    req.onsuccess = () => { closeDb(); resolveOnce(); };
    tx.onabort = () => { closeDb(); rejectOnce(new Error('Failed to persist folder handle')); };
    tx.onerror = () => { closeDb(); rejectOnce(new Error('Failed to persist folder handle')); };
  });
}

/** Remove the persisted directory handle. */
export async function clearPersistedDirectoryHandle() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    let settled = false;
    const closeDb = () => { try { db.close(); } catch { /* ignore */ } };
    const resolveOnce = () => { if (!settled) { settled = true; resolve(); } };
    const rejectOnce = (e) => { if (!settled) { settled = true; reject(e); } };
    const tx = db.transaction([STORE_NAME], 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(DIR_KEY);
    req.onerror = () => { closeDb(); rejectOnce(new Error('Failed to clear persisted folder handle')); };
    req.onsuccess = () => { closeDb(); resolveOnce(); };
    tx.onabort = () => { closeDb(); rejectOnce(new Error('Failed to clear persisted folder handle')); };
    tx.onerror = () => { closeDb(); rejectOnce(new Error('Failed to clear persisted folder handle')); };
  });
}
