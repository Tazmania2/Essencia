interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

interface CacheOptions {
  ttl?: number; // Default TTL in milliseconds
  maxSize?: number; // Maximum number of entries
}

export class CacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL: number;
  private maxSize: number;

  constructor(options: CacheOptions = {}) {
    this.defaultTTL = options.ttl || 5 * 60 * 1000; // 5 minutes default
    this.maxSize = options.maxSize || 100;
  }

  /**
   * Set a value in the cache
   */
  set<T>(key: string, data: T, ttl?: number): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    };

    this.cache.set(key, entry);
  }

  /**
   * Get a value from the cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Check if a key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Delete a specific key
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    entries: Array<{ key: string; age: number; ttl: number }>;
  } {
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      age: Date.now() - entry.timestamp,
      ttl: entry.ttl,
    }));

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: 0, // Would need to track hits/misses for accurate calculation
      entries,
    };
  }

  /**
   * Clean up expired entries
   */
  cleanup(): number {
    let removedCount = 0;
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        removedCount++;
      }
    }

    return removedCount;
  }

  /**
   * Get or set pattern - useful for async operations
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = this.get<T>(key);
    
    if (cached !== null) {
      return cached;
    }

    const data = await factory();
    this.set(key, data, ttl);
    return data;
  }

  /**
   * Invalidate cache entries by pattern
   */
  invalidatePattern(pattern: string | RegExp): number {
    let removedCount = 0;
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        removedCount++;
      }
    }

    return removedCount;
  }

  /**
   * Refresh a cache entry by re-running the factory function
   */
  async refresh<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const data = await factory();
    this.set(key, data, ttl);
    return data;
  }
}

// Create cache instances for different data types
export const dashboardCache = new CacheService({
  ttl: 2 * 60 * 1000, // 2 minutes for dashboard data
  maxSize: 50,
});

export const playerDataCache = new CacheService({
  ttl: 5 * 60 * 1000, // 5 minutes for player data
  maxSize: 100,
});

export const reportDataCache = new CacheService({
  ttl: 10 * 60 * 1000, // 10 minutes for report data
  maxSize: 20,
});

export const enhancedReportCache = new CacheService({
  ttl: 5 * 60 * 1000, // 5 minutes for enhanced database reports
  maxSize: 30,
});

export const csvDataCache = new CacheService({
  ttl: 15 * 60 * 1000, // 15 minutes for CSV data
  maxSize: 20,
});

// Cache key generators
export const CacheKeys = {
  playerStatus: (playerId: string) => `player:status:${playerId}`,
  dashboardData: (playerId: string, teamType: string) => `dashboard:${playerId}:${teamType}`,
  reportData: (playerId: string) => `report:${playerId}`,
  teamProcessorData: (teamType: string, playerId: string) => `processor:${teamType}:${playerId}`,
  funifierCollection: (collectionName: string) => `collection:${collectionName}`,
  enhancedReport: (playerId: string) => `enhanced:report:${playerId}`,
  csvData: (csvUrl: string) => `csv:${Buffer.from(csvUrl).toString('base64').slice(0, 20)}`,
  completePlayerData: (playerId: string) => `complete:player:${playerId}`,
} as const;

// Utility functions for cache management
export const CacheUtils = {
  /**
   * Warm up cache with commonly accessed data
   */
  async warmUp(playerIds: string[]): Promise<void> {
    // Implementation would depend on available services
    console.log('Cache warm-up initiated for players:', playerIds);
  },

  /**
   * Schedule periodic cache cleanup
   */
  startCleanupSchedule(intervalMs: number = 5 * 60 * 1000): NodeJS.Timeout {
    return setInterval(() => {
      const dashboardRemoved = dashboardCache.cleanup();
      const playerRemoved = playerDataCache.cleanup();
      const reportRemoved = reportDataCache.cleanup();
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Cache cleanup completed:', {
          dashboard: dashboardRemoved,
          player: playerRemoved,
          report: reportRemoved,
        });
      }
    }, intervalMs);
  },

  /**
   * Get cache statistics for monitoring
   */
  getAllStats(): Record<string, any> {
    return {
      dashboard: dashboardCache.getStats(),
      player: playerDataCache.getStats(),
      report: reportDataCache.getStats(),
      enhancedReport: enhancedReportCache.getStats(),
      csvData: csvDataCache.getStats(),
    };
  },

  /**
   * Clear all caches
   */
  clearAll(): void {
    dashboardCache.clear();
    playerDataCache.clear();
    reportDataCache.clear();
    enhancedReportCache.clear();
    csvDataCache.clear();
  },
};