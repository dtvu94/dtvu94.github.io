import { Injectable, signal } from '@angular/core';

const DB_NAME = 'wedding-editor';
const STORE = 'photos';
/** Longest side of a stored photo: enough for a 5 × 7 in card at print size. */
const MAX_SIDE = 1600;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function run<T>(mode: IDBTransactionMode, work: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const request = work(tx.objectStore(STORE));
        tx.oncomplete = () => {
          db.close();
          resolve(request.result);
        };
        tx.onerror = () => {
          db.close();
          reject(tx.error);
        };
      }),
  );
}

/** A photo scaled down to MAX_SIDE as JPEG (the browser's own decoder; files it can't read pass through). */
export async function shrinkPhoto(file: Blob): Promise<Blob> {
  if (typeof createImageBitmap !== 'function' || typeof document === 'undefined') {
    return file;
  }
  try {
    const bitmap = await createImageBitmap(file);
    const k = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * k);
    canvas.height = Math.round(bitmap.height * k);
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.86));
    return blob ?? file;
  } catch {
    return file;
  }
}

/**
 * The editor's wedding photos, kept in this browser (IndexedDB, as they are
 * too big for localStorage). Stickers refer to a photo by id; `urls` maps
 * each id to an object URL for <img>. Without IndexedDB (some private
 * windows) photos still work, for this visit only.
 */
@Injectable({ providedIn: 'root' })
export class EditorPhotoStore {
  readonly urls = signal<Record<string, string>>({});
  private loading?: Promise<void>;

  /** Reads every stored photo once. */
  load(): Promise<void> {
    if (!this.loading) {
      this.loading = this.readAll().catch(() => undefined);
    }
    return this.loading;
  }

  /** Stores a photo (scaled down) and returns its id. */
  async add(file: Blob): Promise<string> {
    const blob = await shrinkPhoto(file);
    const id = `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    try {
      await run('readwrite', (store) => store.put(blob, id));
    } catch {
      // No IndexedDB: the photo lives for this visit only.
    }
    this.urls.update((urls) => ({ ...urls, [id]: URL.createObjectURL(blob) }));
    return id;
  }

  /** Forgets photos no sticker uses any more. */
  async prune(used: ReadonlySet<string>): Promise<void> {
    const stale = Object.keys(this.urls()).filter((id) => !used.has(id));
    if (!stale.length) {
      return;
    }
    for (const id of stale) {
      URL.revokeObjectURL(this.urls()[id]);
      try {
        await run('readwrite', (store) => store.delete(id));
      } catch {
        // Already gone.
      }
    }
    this.urls.update((urls) => Object.fromEntries(Object.entries(urls).filter(([id]) => used.has(id))));
  }

  private async readAll(): Promise<void> {
    if (typeof indexedDB === 'undefined') {
      return;
    }
    const keys = (await run('readonly', (store) => store.getAllKeys())) as string[];
    const blobs = (await run('readonly', (store) => store.getAll())) as Blob[];
    const urls: Record<string, string> = {};
    keys.forEach((key, i) => (urls[key] = URL.createObjectURL(blobs[i])));
    this.urls.update((current) => ({ ...urls, ...current }));
  }
}
