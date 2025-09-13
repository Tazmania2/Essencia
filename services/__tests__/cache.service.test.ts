import { CacheService, dashboardCache, CacheKeys, CacheUtils } from '../cache.service';

describe('CacheService', () => {
  let cache: CacheService;

  beforeEach(() => {
    cache = new CacheService({ ttl: 1000, maxSize: 3 });
  });

  afterEach(() => {
    cache.clear();
  });

  describe('basic operations', () => {
    it('should set and get values', () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
    });

    it('should return null for non-existent keys', () => {
      expect(cache.get('nonexistent')).toBeNull();
    });

    it('should check if key exists', () => {
      cache.set('key1', 'value1');
      expect(cache.has('key1')).toBe(true);
      expect(cache.has('nonexistent')).toBe(false);
    });

    it('should delete keys', () => {
      cache.set('key1', 'value1');
      expect(cache.delete('key1')).toBe(true);
      expect(cache.get('key1')).toBeNull();
      expect(cache.delete('nonexistent')).toBe(false);
    });

    it('should clear all entries', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.clear();
      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBeNull();
    });
  });

  describe('TTL (Time To Live)', () => {
    it('should expire entries after TTL', async () => {
      cache.set('key1', 'value1', 100); // 100ms TTL
      expect(cache.get('key1')).toBe('value1');

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));
      expect(cache.get('key1')).toBeNull();
    });

    it('should use custom TTL when provided', async () => {
      cache.set('key1', 'value1', 50); // 50ms TTL
      cache.set('key2', 'value2', 200); // 200ms TTL

      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(cache.get('key1')).toBeNull(); // Should be expired
      expect(cache.get('key2')).toBe('value2'); // Should still exist
    });

    it('should use default TTL when not specified', async () => {
      const shortCache = new CacheService({ ttl: 50 });
      shortCache.set('key1', 'value1');
      
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(shortCache.get('key1')).toBeNull();
    });
  });

  describe('size limits', () => {
    it('should respect max size limit', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      cache.set('key4', 'value4'); // Should evict key1

      expect(cache.get('key1')).toBeNull(); // Evicted
      expect(cache.get('key2')).toBe('value2');
      expect(cache.get('key3')).toBe('value3');
      expect(cache.get('key4')).toBe('value4');
    });
  });

  describe('getOrSet pattern', () => {
    it('should return cached value if exists', async () => {
      cache.set('key1', 'cached-value');
      
      const factory = jest.fn().mockResolvedValue('new-value');
      const result = await cache.getOrSet('key1', factory);
      
      expect(result).toBe('cached-value');
      expect(factory).not.toHaveBeenCalled();
    });

    it('should call factory and cache result if not exists', async () => {
      const factory = jest.fn().mockResolvedValue('new-value');
      const result = await cache.getOrSet('key1', factory);
      
      expect(result).toBe('new-value');
      expect(factory).toHaveBeenCalledTimes(1);
      expect(cache.get('key1')).toBe('new-value');
    });
  });

  describe('pattern invalidation', () => {
    it('should invalidate entries matching string pattern', () => {
      cache.set('user:1', 'user1');
      cache.set('user:2', 'user2');
      cache.set('post:1', 'post1');
      
      const removed = cache.invalidatePattern('user:');
      
      expect(removed).toBe(2);
      expect(cache.get('user:1')).toBeNull();
      expect(cache.get('user:2')).toBeNull();
      expect(cache.get('post:1')).toBe('post1');
    });

    it('should invalidate entries matching regex pattern', () => {
      cache.set('user:1', 'user1');
      cache.set('user:2', 'user2');
      cache.set('post:1', 'post1');
      
      const removed = cache.invalidatePattern(/^user:/);
      
      expect(removed).toBe(2);
      expect(cache.get('user:1')).toBeNull();
      expect(cache.get('user:2')).toBeNull();
      expect(cache.get('post:1')).toBe('post1');
    });
  });

  describe('cleanup', () => {
    it('should remove expired entries during cleanup', async () => {
      cache.set('key1', 'value1', 50); // 50ms TTL
      cache.set('key2', 'value2', 200); // 200ms TTL
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const removed = cache.cleanup();
      
      expect(removed).toBe(1);
      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBe('value2');
    });
  });

  describe('refresh', () => {
    it('should refresh cache entry with new data', async () => {
      cache.set('key1', 'old-value');
      
      const factory = jest.fn().mockResolvedValue('new-value');
      const result = await cache.refresh('key1', factory);
      
      expect(result).toBe('new-value');
      expect(cache.get('key1')).toBe('new-value');
      expect(factory).toHaveBeenCalledTimes(1);
    });
  });

  describe('statistics', () => {
    it('should return cache statistics', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      
      const stats = cache.getStats();
      
      expect(stats.size).toBe(2);
      expect(stats.maxSize).toBe(3);
      expect(stats.entries).toHaveLength(2);
      expect(stats.entries[0]).toHaveProperty('key');
      expect(stats.entries[0]).toHaveProperty('age');
      expect(stats.entries[0]).toHaveProperty('ttl');
    });
  });
});

describe('Cache instances', () => {
  afterEach(() => {
    dashboardCache.clear();
  });

  it('should have pre-configured cache instances', () => {
    expect(dashboardCache).toBeInstanceOf(CacheService);
  });

  it('should work with cache instances', () => {
    dashboardCache.set('test', 'value');
    expect(dashboardCache.get('test')).toBe('value');
  });
});

describe('CacheKeys', () => {
  it('should generate correct cache keys', () => {
    expect(CacheKeys.playerStatus('player123')).toBe('player:status:player123');
    expect(CacheKeys.dashboardData('player123', 'CARTEIRA_I')).toBe('dashboard:player123:CARTEIRA_I');
    expect(CacheKeys.reportData('player123')).toBe('report:player123');
  });
});

describe('CacheUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should get all cache statistics', () => {
    const stats = CacheUtils.getAllStats();
    
    expect(stats).toHaveProperty('dashboard');
    expect(stats).toHaveProperty('player');
    expect(stats).toHaveProperty('report');
  });

  it('should clear all caches', () => {
    dashboardCache.set('test', 'value');
    
    CacheUtils.clearAll();
    
    expect(dashboardCache.get('test')).toBeNull();
  });

  it('should start cleanup schedule', () => {
    jest.useFakeTimers();
    
    const interval = CacheUtils.startCleanupSchedule(1000);
    
    expect(interval).toBeDefined();
    
    clearInterval(interval);
    jest.useRealTimers();
  });
});