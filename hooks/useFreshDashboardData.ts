'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardService } from '../services/dashboard.service';
import { FunifierPlayerService } from '../services/funifier-player.service';
import { FunifierPlayerStatus, DashboardData } from '../types';

interface UseFreshDashboardDataResult {
  dashboardData: DashboardData | null;
  rawPlayerData: FunifierPlayerStatus | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refreshData: () => Promise<void>;
}

interface CachedDashboardData {
  dashboardData: DashboardData;
  rawPlayerData: FunifierPlayerStatus;
  timestamp: number;
}

const CACHE_KEY = 'funifier_dashboard_data';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Check if this is a page refresh (F5, Ctrl+R, etc.)
const isPageRefresh = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Check if navigation type indicates a reload
  if (performance.navigation && performance.navigation.type === 1) {
    return true;
  }
  
  // Check for page refresh using performance API
  if (performance.getEntriesByType) {
    const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    if (navigationEntries.length > 0) {
      return navigationEntries[0].type === 'reload';
    }
  }
  
  return false;
};

export const useFreshDashboardData = (playerId: string): UseFreshDashboardDataResult => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [rawPlayerData, setRawPlayerData] = useState<FunifierPlayerStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Load cached data from localStorage
  const loadCachedData = useCallback((): CachedDashboardData | null => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;

      const parsedCache: CachedDashboardData = JSON.parse(cached);
      const age = Date.now() - parsedCache.timestamp;

      // If cache is older than 24 hours, consider it invalid
      if (age > CACHE_DURATION) {
        localStorage.removeItem(CACHE_KEY);
        return null;
      }

      return parsedCache;
    } catch (error) {
      console.warn('Failed to load cached dashboard data:', error);
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
  }, []);

  // Save data to localStorage
  const saveCachedData = useCallback((dashboardData: DashboardData, rawPlayerData: FunifierPlayerStatus) => {
    try {
      const cacheData: CachedDashboardData = {
        dashboardData,
        rawPlayerData,
        timestamp: Date.now()
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to save dashboard data to cache:', error);
    }
  }, []);

  // Fetch fresh data from Funifier API
  const fetchFreshData = useCallback(async (): Promise<{ dashboardData: DashboardData; rawPlayerData: FunifierPlayerStatus }> => {
    const playerService = FunifierPlayerService.getInstance();
    const rawPlayerData = await playerService.getPlayerStatus(playerId);
    
    console.log('🔄 Fresh Funifier Data Fetched:', rawPlayerData);
    
    const dashboardData = DashboardService.extractDirectDashboardData(rawPlayerData);
    
    return { dashboardData, rawPlayerData };
  }, [playerId]);

  // Refresh data (manual or automatic)
  const refreshData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Refreshing dashboard data...');
      const { dashboardData: freshDashboardData, rawPlayerData: freshRawData } = await fetchFreshData();
      
      setDashboardData(freshDashboardData);
      setRawPlayerData(freshRawData);
      setLastUpdated(new Date());
      
      // Save to cache
      saveCachedData(freshDashboardData, freshRawData);
      
      console.log('✅ Dashboard data refreshed successfully');
    } catch (err) {
      console.error('❌ Failed to refresh dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh data');
    } finally {
      setLoading(false);
    }
  }, [fetchFreshData, saveCachedData]);

  // Initial data load
  useEffect(() => {
    const initializeData = async () => {
      if (!playerId) {
        setLoading(false);
        return;
      }

      const pageRefresh = isPageRefresh();
      
      if (pageRefresh) {
        // Page refresh detected - always fetch fresh data
        console.log('🔄 Page refresh detected, fetching fresh data...');
        await refreshData();
      } else {
        // Check for cached data first
        const cachedData = loadCachedData();
        
        if (cachedData) {
          console.log('📦 Loading cached dashboard data');
          setDashboardData(cachedData.dashboardData);
          setRawPlayerData(cachedData.rawPlayerData);
          setLastUpdated(new Date(cachedData.timestamp));
          setLoading(false);
          
          // Check if cached data is older than 24 hours
          const age = Date.now() - cachedData.timestamp;
          if (age > CACHE_DURATION) {
            console.log('⚠️ Cached data is expired, fetching fresh data...');
            refreshData();
          }
        } else {
          // No cached data, fetch fresh
          console.log('🆕 No cached data found, fetching fresh data...');
          await refreshData();
        }
      }
    };

    initializeData();
  }, [playerId, loadCachedData, refreshData]);

  // Set up daily refresh timer
  useEffect(() => {
    if (!lastUpdated) return;

    const timeUntilNextRefresh = CACHE_DURATION - (Date.now() - lastUpdated.getTime());
    
    if (timeUntilNextRefresh > 0) {
      console.log(`⏰ Next automatic refresh in ${Math.round(timeUntilNextRefresh / (60 * 60 * 1000))} hours`);
      
      const timer = setTimeout(() => {
        console.log('🕐 Daily refresh triggered');
        refreshData();
      }, timeUntilNextRefresh);

      return () => clearTimeout(timer);
    }
  }, [lastUpdated, refreshData]);

  // Listen for page visibility changes to refresh when user returns
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && lastUpdated) {
        const age = Date.now() - lastUpdated.getTime();
        // If data is older than 1 hour and page becomes visible, refresh
        if (age > (60 * 60 * 1000)) {
          console.log('👁️ Page became visible and data is old, refreshing...');
          refreshData();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [lastUpdated, refreshData]);

  return {
    dashboardData,
    rawPlayerData,
    loading,
    error,
    lastUpdated,
    refreshData
  };
};