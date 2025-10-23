
// import { openDB, IDBPDatabase } from 'idb';

// export type SubCategory = {
//   id: string;
//   name: string;
//   description: string;
//   trending?: boolean;
//   isNew?: boolean;
//   usersTaken?: number;
// };

// interface SubCategoryCacheEntry {
//   categoryId: string;
//   subcategories: SubCategory[];
//   timestamp: number;
// }

// const DB_NAME = 'SubCategoryCacheDB';
// const STORE_NAME = 'subcategoryCache';
// const VERSION = 1;
// const TTL_MS = 24 * 60 * 60 * 1000; 
// const MAX_ITEMS = 30; 

// let dbPromise: Promise<IDBPDatabase> | null = null;

// async function getDB() {
//   if (!dbPromise) {
//     dbPromise = openDB(DB_NAME, VERSION, {
//       upgrade(db, oldVersion, newVersion, transaction) {
//         console.log(`Upgrading database from version ${oldVersion} to ${newVersion}`);
        
//         if (db.objectStoreNames.contains(STORE_NAME)) {
//           db.deleteObjectStore(STORE_NAME);
//         }
        
//         const store = db.createObjectStore(STORE_NAME, { keyPath: 'categoryId' });
//         store.createIndex('timestamp', 'timestamp');
        
//         console.log(`Created object store: ${STORE_NAME}`);
//       },
//     }).then(db => {
//       console.log(`Database initialized successfully`);
//       return db;
//     }).catch(error => {
//       console.error('Database initialization failed:', error);
//       throw error;
//     });
//   }
//   return dbPromise;
// }

// function formatAge(timestamp: number): string {
//   const ageInMs = Date.now() - timestamp;
//   const minutes = Math.floor(ageInMs / (1000 * 60));
//   if (minutes < 1) return 'just now';
//   if (minutes === 1) return '1 minute ago';
//   if (minutes < 60) return `${minutes} minutes ago`;
//   return `${Math.floor(minutes / 60)} hours ago`;
// }

// export async function getCachedSubcategories(categoryId: string) {
//   if (!categoryId) return null;

//   try {
//     const db = await getDB();
    
//     if (!db.objectStoreNames.contains(STORE_NAME)) {
//       console.warn(`Object store ${STORE_NAME} not found`);
//       return null;
//     }
    
//     const entry: SubCategoryCacheEntry | undefined = await db.get(STORE_NAME, categoryId);

//     if (entry && Date.now() - entry.timestamp < TTL_MS) {
//       console.log(`Cache hit for category: ${categoryId}`);
//       return {
//         subcategories: entry.subcategories.slice(0, MAX_ITEMS),
//         age: formatAge(entry.timestamp),
//         cached: true,
//       };
//     }

//     if (entry) {
//       console.log(`Cache expired for category: ${categoryId}`);
//       await db.delete(STORE_NAME, categoryId);
//     }
//   } catch (e) {
//     console.warn('Subcategory cache read failed:', e);
//   }

//   return null;
// }

// export async function setCachedSubcategories(categoryId: string, subcategories: SubCategory[]) {
//   if (!categoryId) return;

//   try {
//     const db = await getDB();
    
//     if (!db.objectStoreNames.contains(STORE_NAME)) {
//       console.warn(`Object store ${STORE_NAME} not found, cannot cache`);
//       return;
//     }
    
//     await db.put(STORE_NAME, {
//       categoryId,
//       subcategories: subcategories.slice(0, MAX_ITEMS),
//       timestamp: Date.now(),
//     });
    
//     console.log(` Cached ${subcategories.length} subcategories for: ${categoryId}`);
//   } catch (e) {
//     console.warn('Subcategory cache write failed:', e);
//   }
// }

// export async function cleanupExpiredSubcategoryCache() {
//   try {
//     const db = await getDB();
    
//     if (!db.objectStoreNames.contains(STORE_NAME)) {
//       return;
//     }
    
//     const tx = db.transaction(STORE_NAME, 'readwrite');
//     const store = tx.objectStore(STORE_NAME);
//     const now = Date.now();

//     const keys = await store.getAllKeys();
//     const entries = await store.getAll();

//     const expiredKeys: string[] = [];
//     for (let i = 0; i < entries.length; i++) {
//       const entry = entries[i];
//       if (entry && now - entry.timestamp >= TTL_MS) {
//         expiredKeys.push(keys[i] as string);
//       }
//     }

//     for (const key of expiredKeys) {
//       await store.delete(key);
//     }

//     if (expiredKeys.length > 0) {
//       console.log(`Cleaned ${expiredKeys.length} expired subcategory cache entries`);
//     }
//   } catch (e) {
//     console.warn('Subcategory cache cleanup failed:', e);
//   }
// }

// getDB().catch(console.error);


// lib/subCategoryCache.ts
import { openDB, IDBPDatabase } from 'idb';

export type SubCategory = {
  id: string;
  name: string;
  description: string;
  trending?: boolean;
  isNew?: boolean;
  usersTaken?: number;
};

interface SubCategoryCacheEntry {
  categoryId: string;
  subcategories: SubCategory[];
  timestamp: number;
}

const DB_NAME = 'SubCategoryCacheDB';
const STORE_NAME = 'subcategoryCache';
const VERSION = 1;
const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_ITEMS = 50; // Store up to 50 categories

let dbPromise: Promise<IDBPDatabase> | null = null;

async function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, VERSION, {
      upgrade(db) {
        // Only create if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'categoryId' });
          store.createIndex('timestamp', 'timestamp');
          console.log(`✅ Created ${STORE_NAME} store in ${DB_NAME}`);
        }
      },
    });
  }
  return dbPromise;
}

function formatAge(timestamp: number): string {
  const ageInMs = Date.now() - timestamp;
  const minutes = Math.floor(ageInMs / (1000 * 60));
  if (minutes < 1) return 'just now';
  if (minutes === 1) return '1 minute ago';
  if (minutes < 60) return `${minutes} minutes ago`;
  return `${Math.floor(minutes / 60)} hours ago`;
}

export async function getCachedSubcategories(categoryId: string) {
  if (!categoryId) return null;

  try {
    const db = await getDB();
    const entry: SubCategoryCacheEntry | undefined = await db.get(STORE_NAME, categoryId);

    if (entry && Date.now() - entry.timestamp < TTL_MS) {
      console.log(`🎯 SubCategory Cache hit: ${categoryId}`);
      return {
        subcategories: entry.subcategories,
        age: formatAge(entry.timestamp),
        cached: true,
      };
    }

    // Delete expired entry
    if (entry) {
      await db.delete(STORE_NAME, categoryId);
    }
  } catch (e) {
    console.warn('Subcategory cache read failed:', e);
  }

  return null;
}

export async function setCachedSubcategories(categoryId: string, subcategories: SubCategory[]) {
  if (!categoryId) return;

  try {
    const db = await getDB();
    
    await db.put(STORE_NAME, {
      categoryId,
      subcategories: subcategories.slice(0, MAX_ITEMS),
      timestamp: Date.now(),
    });
    
    console.log(`✅ Cached ${subcategories.length} subcategories for: ${categoryId}`);
    
    // Auto-cleanup if we exceed max items
    await enforceMaxLimit(db);
  } catch (e) {
    console.warn('Subcategory cache write failed:', e);
  }
}

async function enforceMaxLimit(db: IDBPDatabase) {
  try {
    const allEntries = await db.getAll(STORE_NAME);
    if (allEntries.length <= MAX_ITEMS) return;

    // Remove oldest entries
    allEntries.sort((a, b) => a.timestamp - b.timestamp);
    const toRemove = allEntries.slice(0, allEntries.length - MAX_ITEMS);
    
    for (const entry of toRemove) {
      await db.delete(STORE_NAME, entry.categoryId);
    }
    
    console.log(`🧹 Removed ${toRemove.length} old subcategory entries`);
  } catch (e) {
    console.warn('Subcategory limit enforcement failed:', e);
  }
}

export async function cleanupExpiredSubcategoryCache() {
  try {
    const db = await getDB();
    const allEntries = await db.getAll(STORE_NAME);
    const now = Date.now();
    let expiredCount = 0;

    for (const entry of allEntries) {
      if (now - entry.timestamp >= TTL_MS) {
        await db.delete(STORE_NAME, entry.categoryId);
        expiredCount++;
      }
    }

    if (expiredCount > 0) {
      console.log(`🧹 Cleaned ${expiredCount} expired subcategory cache entries`);
    }
  } catch (e) {
    console.warn('Subcategory cache cleanup failed:', e);
  }
}

export async function clearSubcategoryCache() {
  try {
    const db = await getDB();
    await db.clear(STORE_NAME);
    console.log('🧹 Cleared all subcategory cache');
  } catch (e) {
    console.warn('Subcategory cache clear failed:', e);
  }
}