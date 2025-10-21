interface CachedData {
  data: any[];
  timestamp: number;
  page: number;
}

export class CacheService {
  private cache = new Map<string, CachedData>();
  private readonly CACHE_DURATION = 120 * 60 * 1000;

  setPage(key: string, data: any[], page: number) {
    this.cache.set(`${key}_page_${page}`, {
      data,
      timestamp: Date.now(),
      page: page
    });
  }

  getPage(key: string, page: number): CachedData | null {
    return this.get(`${key}_page_${page}`);
  }
  getPageCacheInfo(key: string, page: number) {
    return this.getCacheInfo(`${key}_page_${page}`);
  }

  set(key: string, data: any[]) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      page: 1
    });
  }

  get(key: string): CachedData | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.CACHE_DURATION) {
      this.cache.delete(key);
      return null;
    }

    return cached;
  }

  getCacheInfo(key: string): { age: string; generatedAt: string } | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const ageInMs = Date.now() - cached.timestamp;
    const minutes = Math.floor(ageInMs / (1000 * 60));

    let age = '';
    if (minutes < 1) age = 'just now';
    else if (minutes === 1) age = '1 minute ago';
    else if (minutes < 60) age = `${minutes} minutes ago`;
    else age = `${Math.floor(minutes / 60)} hours ago`;

    return {
      age,
      generatedAt: new Date(cached.timestamp).toISOString()
    };

  }
}

export const globalCache = new CacheService();