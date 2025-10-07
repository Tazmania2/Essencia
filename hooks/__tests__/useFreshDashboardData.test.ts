import { renderHook, waitFor, act } from '@testing-library/react';
import { useFreshDashboardData } from '../useFreshDashboardData';
import { FunifierPlayerService } from '../../services/funifier-player.service';
import { DashboardService } from '../../services/dashboard.service';

// Mock the services
jest.mock('../../services/funifier-player.service');
jest.mock('../../services/dashboard.service');

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock performance API
Object.defineProperty(window, 'performance', {
  value: {
    navigation: { type: 0 },
    getEntriesByType: jest.fn(() => [{ type: 'navigate' }])
  }
});

describe('useFreshDashboardData', () => {
  const mockPlayerData = {
    name: 'Test Player',
    total_points: 1500,
    catalog_items: { 'E6F0O5f': 1 },
    challenge_progress: [],
    teams: ['E6F4sCh'],
    _id: 'player123'
  };

  const mockDashboardData = {
    playerName: 'Test Player',
    totalPoints: 1500,
    pointsLocked: false,
    currentCycleDay: 15,
    totalCycleDays: 21,
    isDataFromCollection: false,
    primaryGoal: {
      name: 'Atividade',
      percentage: 50,
      description: 'Test description',
      emoji: '🎯'
    },
    secondaryGoal1: {
      name: 'Reais por Ativo',
      percentage: 30,
      description: 'Test description',
      emoji: '💰',
      hasBoost: true,
      isBoostActive: false
    },
    secondaryGoal2: {
      name: 'Faturamento',
      percentage: 70,
      description: 'Test description',
      emoji: '📈',
      hasBoost: true,
      isBoostActive: true
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    
    // Mock FunifierPlayerService
    (FunifierPlayerService.getInstance as jest.Mock).mockReturnValue({
      getPlayerStatus: jest.fn().mockResolvedValue(mockPlayerData)
    });
    
    // Mock DashboardService
    (DashboardService.extractDirectDashboardData as jest.Mock).mockResolvedValue(mockDashboardData);
  });

  it('fetches fresh data when no cache exists', async () => {
    const { result } = renderHook(() => useFreshDashboardData('player123'));
    
    expect(result.current.loading).toBe(true);
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.dashboardData).toEqual(mockDashboardData);
    expect(result.current.rawPlayerData).toEqual(mockPlayerData);
    expect(result.current.error).toBe(null);
    expect(result.current.lastUpdated).toBeInstanceOf(Date);
  });

  it('loads cached data when available and fresh', async () => {
    const cachedData = {
      dashboardData: mockDashboardData,
      rawPlayerData: mockPlayerData,
      timestamp: Date.now() - (1000 * 60 * 60) // 1 hour ago
    };
    
    localStorageMock.getItem.mockReturnValue(JSON.stringify(cachedData));
    
    const { result } = renderHook(() => useFreshDashboardData('player123'));
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.dashboardData).toEqual(mockDashboardData);
  });

  it('removes expired cache (older than 24 hours)', async () => {
    const expiredCachedData = {
      dashboardData: mockDashboardData,
      rawPlayerData: mockPlayerData,
      timestamp: Date.now() - (1000 * 60 * 60 * 25) // 25 hours ago
    };
    
    localStorageMock.getItem.mockReturnValue(JSON.stringify(expiredCachedData));
    
    const { result } = renderHook(() => useFreshDashboardData('player123'));
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('funifier_dashboard_data');
    expect(result.current.dashboardData).toEqual(mockDashboardData); // Should fetch fresh data
  });

  it('handles refresh data manually', async () => {
    const { result } = renderHook(() => useFreshDashboardData('player123'));
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    // Clear the mock to test refresh
    jest.clearAllMocks();
    (FunifierPlayerService.getInstance as jest.Mock).mockReturnValue({
      getPlayerStatus: jest.fn().mockResolvedValue({
        ...mockPlayerData,
        total_points: 2000 // Updated points
      })
    });
    
    const updatedDashboardData = {
      ...mockDashboardData,
      totalPoints: 2000
    };
    
    (DashboardService.extractDirectDashboardData as jest.Mock).mockResolvedValue(updatedDashboardData);
    
    await act(async () => {
      await result.current.refreshData();
    });
    
    expect(result.current.dashboardData?.totalPoints).toBe(2000);
    expect(localStorageMock.setItem).toHaveBeenCalled();
  });

  it('handles API errors gracefully', async () => {
    (FunifierPlayerService.getInstance as jest.Mock).mockReturnValue({
      getPlayerStatus: jest.fn().mockRejectedValue(new Error('API Error'))
    });
    
    const { result } = renderHook(() => useFreshDashboardData('player123'));
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.error).toBe('API Error');
    expect(result.current.dashboardData).toBe(null);
  });

  it('handles corrupted localStorage data', async () => {
    localStorageMock.getItem.mockReturnValue('invalid json');
    
    const { result } = renderHook(() => useFreshDashboardData('player123'));
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('funifier_dashboard_data');
    expect(result.current.dashboardData).toEqual(mockDashboardData); // Should fetch fresh data
  });
});