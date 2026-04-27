// Persists detected-clip videos in the device's local storage so they can be
// played offline. Uses expo-file-system's documentDirectory which is private to
// the app and survives app restarts (unlike cacheDirectory which the OS may purge).

import * as FileSystem from 'expo-file-system/legacy';

const CACHE_SUBDIR = 'detectedClips';
const CACHE_DIR = `${FileSystem.documentDirectory}${CACHE_SUBDIR}/`;

async function ensureDir() {
  try {
    const info = await FileSystem.getInfoAsync(CACHE_DIR);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
    }
  } catch (err) {
    console.warn('[clipCache] ensureDir failed:', err);
  }
}

function pathFor(filename) {
  return CACHE_DIR + filename;
}

export async function getLocalClipUri(filename) {
  await ensureDir();
  const path = pathFor(filename);
  const info = await FileSystem.getInfoAsync(path);
  return info.exists && info.size > 0 ? path : null;
}

export async function isCached(filename) {
  return !!(await getLocalClipUri(filename));
}

export async function listCachedFilenames() {
  await ensureDir();
  try {
    return await FileSystem.readDirectoryAsync(CACHE_DIR);
  } catch {
    return [];
  }
}

// Downloads a clip into the device's document directory if it isn't already
// stored, and returns its local file:// URI. Re-uses an existing local copy
// when available so we never re-fetch the same file.
export async function downloadClip(filename, sourceUrl, onProgress) {
  await ensureDir();
  const dest = pathFor(filename);
  const info = await FileSystem.getInfoAsync(dest);
  if (info.exists && info.size > 0) return dest;

  if (onProgress) {
    const task = FileSystem.createDownloadResumable(
      sourceUrl,
      dest,
      {},
      (p) => {
        const total = p.totalBytesExpectedToWrite || 1;
        onProgress(Math.min(1, p.totalBytesWritten / total));
      }
    );
    const res = await task.downloadAsync();
    if (!res?.uri) throw new Error(`Download failed for ${filename}`);
    return res.uri;
  }

  const res = await FileSystem.downloadAsync(sourceUrl, dest);
  if (!res?.uri) throw new Error(`Download failed for ${filename}`);
  return res.uri;
}

export async function deleteCachedClip(filename) {
  const dest = pathFor(filename);
  try {
    await FileSystem.deleteAsync(dest, { idempotent: true });
  } catch (err) {
    console.warn('[clipCache] deleteCachedClip failed:', err);
  }
}
