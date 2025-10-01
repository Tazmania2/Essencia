// Simple in-memory cache implementation
class SimpleCache {
  private cache = new Map<string, { data: any; expiry: number }>();

  set<T>(key: string, data: T, ttl: number): void {
    const expiry = Date.now() + ttl;
    this.cache.set(key, { data, expiry });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data as T;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  async getOrSet<T>(key: string, factory: () => Promise<T>, ttl: number): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const data = await factory();
    this.set(key, data, ttl);
    return data;
  }
}

export const dashboardCache = new SimpleCache();
export const playerDataCache = new SimpleCache();
export const enhancedReportCache = new SimpleCache();
export const csvDataCache = new SimpleCache();

export const CacheKeys = {
  dashboardData: (playerId: string, teamType: string) => `dashboard_${playerId}_${teamType}`,
  playerStatus: (playerId: string) => `player_status_${playerId}`,
  enhancedReport: (playerId: string) => `enhanced_report_${playerId}`,
  csvData: (url: string) => `csv_data_${url}`,
  completePlayerData: (playerId: string) => `complete_data_${playerId}`
};