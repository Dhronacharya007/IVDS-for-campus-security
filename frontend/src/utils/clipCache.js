// Persists detected-clip blobs in the browser's IndexedDB so they survive page
// reloads and can be played offline. localStorage is unsuitable because it
// caps at ~5 MB and only stores strings; IndexedDB stores Blobs and is large.

const DB_NAME = 'SentinelClipCache';
const DB_VERSION = 1;
const STORE = 'clips';

let dbPromise = null;

function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not available in this browser.'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function txPromise(mode, fn) {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const store = tx.objectStore(STORE);
        let result;
        try {
          result = fn(store);
        } catch (err) {
          reject(err);
          return;
        }
        tx.oncomplete = () => {
          if (result && typeof result === 'object' && 'result' in result) {
            resolve(result.result);
          } else {
            resolve(result);
          }
        };
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      })
  );
}

export async function getCachedBlob(filename) {
  return txPromise('readonly', (store) => store.get(filename));
}

export async function putCachedBlob(filename, blob) {
  return txPromise('readwrite', (store) => store.put(blob, filename));
}

export async function deleteCachedBlob(filename) {
  return txPromise('readwrite', (store) => store.delete(filename));
}

export async function listCachedFilenames() {
  const keys = await txPromise('readonly', (store) => store.getAllKeys());
  return Array.isArray(keys) ? keys.map(String) : [];
}

export async function isCached(filename) {
  const blob = await getCachedBlob(filename);
  return !!blob;
}

// Downloads `sourceUrl` once and stores it as `filename` in IndexedDB.
// Returns the cached Blob. Subsequent calls are no-ops that return the cached blob.
export async function downloadAndCache(filename, sourceUrl) {
  const existing = await getCachedBlob(filename);
  if (existing) return existing;

  const res = await fetch(sourceUrl);
  if (!res.ok) {
    throw new Error(`Failed to download ${filename}: ${res.status}`);
  }
  const blob = await res.blob();
  await putCachedBlob(filename, blob);
  return blob;
}

// Returns an object URL pointing to the locally cached clip, or null if not cached.
// IMPORTANT: the caller must URL.revokeObjectURL() the returned URL when done.
export async function getCachedObjectUrl(filename) {
  const blob = await getCachedBlob(filename);
  return blob ? URL.createObjectURL(blob) : null;
}
