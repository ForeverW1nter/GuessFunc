import * as idb from 'idb-keyval';

/**
 * Foundation Storage Module
 * Provides a unified async storage interface. Falls back to in-memory storage
 * if IndexedDB is blocked (e.g., in Incognito Mode).
 */

class MemoryStorage {
  private store = new Map<string, any>();
  async get<T>(key: string): Promise<T | undefined> { return this.store.get(key); }
  async set(key: string, val: any): Promise<void> { this.store.set(key, val); }
  async del(key: string): Promise<void> { this.store.delete(key); }
  async clear(): Promise<void> { this.store.clear(); }
}

let useMemoryFallback = false;

// Simple test to see if IDB is available
try {
  const req = window.indexedDB.open('test_idb', 1);
  req.onerror = () => { useMemoryFallback = true; };
  req.onsuccess = (e) => { 
    const db = (e.target as IDBOpenDBRequest).result;
    db.close(); 
  };
} catch (e) {
  useMemoryFallback = true;
}

const memoryStore = new MemoryStorage();

export const Storage = {
  get: async <T>(key: string): Promise<T | undefined> => {
    if (useMemoryFallback) return memoryStore.get(key);
    try {
      return await idb.get(key);
    } catch {
      return memoryStore.get(key);
    }
  },
  set: async (key: string, val: any): Promise<void> => {
    if (useMemoryFallback) return memoryStore.set(key, val);
    try {
      await idb.set(key, val);
    } catch {
      await memoryStore.set(key, val);
    }
  },
  del: async (key: string): Promise<void> => {
    if (useMemoryFallback) return memoryStore.del(key);
    try {
      await idb.del(key);
    } catch {
      await memoryStore.del(key);
    }
  },
  clear: async (): Promise<void> => {
    if (useMemoryFallback) return memoryStore.clear();
    try {
      await idb.clear();
    } catch {
      await memoryStore.clear();
    }
  },
  isFallback: () => useMemoryFallback,
};
