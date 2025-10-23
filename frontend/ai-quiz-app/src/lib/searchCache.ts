import { openDB, IDBPDatabase } from 'idb';

export type SearchCacheCategory = {
    categoryId?:string;
  type: 'category';
  title: string;
  description?: string;
  isTrending?: boolean;
};

export type SearchCacheSubcategory = {
  type: 'subcategory';
  categoryId: string; 
  title: string;
  description: string;
  isTrending?: boolean;
  isNew?: boolean;
  usersTaken?: number;
};

export type SearchResult = SearchCacheCategory | SearchCacheSubcategory;

export const isCategory = (item: SearchResult): item is SearchCacheCategory =>
  item.type === 'category';

export const isSubCategory = (item: SearchResult): item is SearchCacheSubcategory =>
  item.type === 'subcategory';

const DB_NAME = 'SearchCacheDB';
const STORE_NAME = 'searchResults';
const VERSION = 1;

interface CacheEntry {
  query: string;
  results: SearchResult[];
  timestamp: number;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB(): Promise<IDBPDatabase>  {
    if (!dbPromise) {
        dbPromise = openDB(DB_NAME, VERSION, {
            upgrade(db, oldVersion, newVersion) {
                console.log(`🔄 Database upgrade: ${oldVersion} → ${newVersion}`);
                
                // Always delete and recreate to avoid version conflicts
                if (db.objectStoreNames.contains(STORE_NAME)) {
                    db.deleteObjectStore(STORE_NAME);
                }
                
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'query' });
                store.createIndex('timestamp', 'timestamp');
                console.log(`Created store: ${STORE_NAME}`);
            },
        }).catch(async (error:any) => {
            console.error('Database initialization failed:', error);
            
            if (error.name === 'VersionError') {
                console.log('Version conflict detected, deleting database...');
                await new Promise((resolve) => {
                    const deleteRequest = indexedDB.deleteDatabase(DB_NAME);
                    deleteRequest.onsuccess = () => {
                        console.log('Database deleted successfully');
                        resolve(true);
                    };
                    deleteRequest.onerror = () => {
                        console.error('Failed to delete database');
                        resolve(false);
                    };
                });
                
                dbPromise = null;
                return getDB();
            }
            
            throw error;
        });
    }
    return dbPromise;
}

function normalizeQuery(query: string): string {
  return query.trim().toLowerCase();
}

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export async function getCachedResults(query: string): Promise<SearchResult[] | null> {
  const normalized = normalizeQuery(query);
  if (!normalized) return null;

  try {
    const db = await getDB();
    const entry: CacheEntry | undefined = await db.get(STORE_NAME, normalized);

    if (entry && Date.now() - entry.timestamp < CACHE_TTL_MS) {
      return entry.results;
    }

    if (entry) {
      await db.delete(STORE_NAME, normalized);
    }
    return null;
  } catch (err) {
    console.warn('IndexedDB read failed (private mode?):', err);
    return null; 
  }
}

export async function setCachedResults(query: string, results: SearchResult[]): Promise<void> {
  const normalized = normalizeQuery(query);
  if (!normalized) return;

  try {
    const db = await getDB();
    await db.put(STORE_NAME, {
      query: normalized,
      results,
      timestamp: Date.now(),
    });
  } catch (err) {
    console.warn('IndexedDB write failed:', err);
  }
}

export async function cleanupExpiredCache() {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const now = Date.now();

    const keys = await store.getAllKeys();
    const entries = await store.getAll();

    const expiredKeys: string[] = [];
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      if (entry && now - entry.timestamp >= CACHE_TTL_MS) {
        expiredKeys.push(keys[i] as string);
      }
    }

    for (const key of expiredKeys) {
      await store.delete(key);
    }

    if (expiredKeys.length > 0) {
      console.log(`Cleaned ${expiredKeys.length} expired cache entries`);
    }
  } catch (e) {
    console.warn('Cache cleanup failed:', e);
  }
}

export async function getCachedSearchCategories(query: string): Promise<SearchCacheCategory[] | null> {
  const all = await getCachedResults(query);
  if (!all) return null;
  return all.filter(isCategory);
}

export async function getCachedSearchSubcategories(query: string): Promise<SearchCacheSubcategory[] | null> {
  const all = await getCachedResults(query);
  if (!all) return null;
  return all.filter(isSubCategory);
}









