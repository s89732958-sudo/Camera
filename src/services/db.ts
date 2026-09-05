import { PhotoRecord } from '../types';

const DB_NAME = 'gcam_ai_pro_db';
const DB_VERSION = 1;
const STORE_NAME = 'photos';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('cloudSyncStatus', 'cloudSyncStatus', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function savePhotoLocally(photo: PhotoRecord): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(photo);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getAllLocalPhotos(): Promise<PhotoRecord[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const results = (request.result as PhotoRecord[]) || [];
      // Sort newest first
      results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      resolve(results);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getPhotoById(id: string): Promise<PhotoRecord | null> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => resolve((request.result as PhotoRecord) || null);
    request.onerror = () => reject(request.error);
  });
}

export async function updatePhoto(photo: PhotoRecord): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(photo);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function deleteLocalPhoto(id: string): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// "Free Up Device Space": Releases heavy local base64 data for photos already synced to the cloud,
// keeping the thumbnail and cloudUrl so the user can still view and retrieve them!
export async function freeUpLocalSpace(): Promise<number> {
  const photos = await getAllLocalPhotos();
  let freedCount = 0;

  for (const p of photos) {
    if (p.cloudSyncStatus === 'synced' && p.cloudUrl && p.dataUrl.length > 5000) {
      p.dataUrl = p.cloudUrl; // replace local high-res base64 with cloud URL
      await updatePhoto(p);
      freedCount++;
    }
  }

  return freedCount;
}

export async function estimateLocalStorageUsage(): Promise<{ usedMB: string; quotaMB: string }> {
  if (navigator.storage && navigator.storage.estimate) {
    const estimate = await navigator.storage.estimate();
    const usage = estimate.usage || 0;
    const quota = estimate.quota || 0;
    return {
      usedMB: (usage / (1024 * 1024)).toFixed(1),
      quotaMB: (quota / (1024 * 1024)).toFixed(0),
    };
  }
  return { usedMB: '0.0', quotaMB: '1000' };
}
