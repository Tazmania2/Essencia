import { renderHook, waitFor } from '@testing-library/react';
import { useDashboard } from '../useDashboard';
import { DashboardService } from '../../services/dashboard.service';
import { ApiError, ErrorType, DashboardData } from '../../types';

// Mock the DashboardService
jest.mock('../../services/dashboard.service');
jest.mock('../../services/funifier-player.service');
jest.mock('../../services/funifier-database.service');
jest.mock('../../services/team-processor-factory.service');
jest.mock('../../services/user-identification.service');

describe('useDashboard', () => {
  let mockDashboardService: jest.Mocked<DashboardService>;

  const mockDashboardData: DashboardData = {
    playerName: 'Test Player',
    totalPoints: 2500,
    pointsLocked: false,
    currentCycleDay: 15,
    totalCycleDays: 30,
    isDataFromCollection: true,
    primaryGoal: {
      name: 'Atividade',
      percentage: 75,
      description: 'Test description',
      emoji: '🎯'
    },
    secondaryGoal1: {
      name: 'Reais por Ativo',
      percentage: 60,
      description: 'Test description',
      emoji: '💰',
      hasBoost: true,
      isBoostActive: true
    },
    secondaryGoal2: {
      name: 'Faturamento',
      percentage: 80,
      description: 'Test description',
      emoji: '📈',
      hasBoost: true,
      isBoostActive: false
    }
  };

  beforeEach(() => {
    // Mock the DashboardService constructor and methods
    mockDashboardService = {
      getDashboardData: jest.fn()
    } as any;

    (DashboardService as jest.MockedClass<typeof DashboardService>).mockImplementation(() => mockDashboardService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return loading state initially', () => {
    mockDashboardService.getDashboardData.mockImplementation(() => new Promise(() => {})); // Never resolves

    const { result } = renderHook(() => useDashboard('player123', 'token123'));

    expect(result.current.loading).toBe(true);
    expect(result.current.dashboardData).toBe(null);
    expect(result.current.error).toBe(null);
  });

  it('should return dashboard data on successful fetch', async () => {
    mockDashboardService.getDashboardData.mockResolvedValue(mockDashboardData);

    const { result } = renderHook(() => useDashboard('player123', 'token123'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.dashboardData).toEqual(mockDashboardData);
    expect(result.current.error).toBe(null);
    expect(mockDashboardService.getDashboardData).toHaveBeenCalledWith('player123', 'token123');
  });

  it('should handle authentication errors', async () => {
    const authError = new ApiError({
      type: ErrorType.AUTHENTICATION_ERROR,
      message: 'Authentication failed',
      timestamp: new Date()
    });

    mockDashboardService.getDashboardData.mockRejectedValue(authError);

    const { result } = renderHook(() => useDashboard('player123', 'token123'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Erro de autenticação. Faça login novamente.');
    expect(result.current.dashboardData).toBe(null);
  });

  it('should handle Funifier API errors', async () => {
    const apiError = new ApiError({
      type: ErrorType.FUNIFIER_API_ERROR,
      message: 'API error',
      timestamp: new Date()
    });

    mockDashboardService.getDashboardData.mockRejectedValue(apiError);

    const { result } = renderHook(() => useDashboard('player123', 'token123'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Erro ao conectar com o servidor. Tente novamente.');
    expect(result.current.dashboardData).toBe(null);
  });

  it('should handle data processing errors', async () => {
    const processingError = new ApiError({
      type: ErrorType.DATA_PROCESSING_ERROR,
      message: 'Processing error',
      timestamp: new Date()
    });

    mockDashboardService.getDashboardData.mockRejectedValue(processingError);

    const { result } = renderHook(() => useDashboard('player123', 'token123'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Erro ao processar dados. Contate o suporte.');
    expect(result.current.dashboardData).toBe(null);
  });

  it('should handle generic errors', async () => {
    const genericError = new Error('Generic error');

    mockDashboardService.getDashboardData.mockRejectedValue(genericError);

    const { result } = renderHook(() => useDashboard('player123', 'token123'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Erro ao carregar dashboard. Tente novamente.');
    expect(result.current.dashboardData).toBe(null);
  });

  it('should not fetch data when playerId or token is missing', () => {
    const { result: result1 } = renderHook(() => useDashboard('', 'token123'));
    const { result: result2 } = renderHook(() => useDashboard('player123', ''));

    expect(mockDashboardService.getDashboardData).not.toHaveBeenCalled();
    expect(result1.current.loading).toBe(true);
    expect(result2.current.loading).toBe(true);
  });

  it('should provide refetch functionality', async () => {
    mockDashboardService.getDashboardData.mockResolvedValue(mockDashboardData);

    const { result } = renderHook(() => useDashboard('player123', 'token123'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Clear the mock to test refetch
    mockDashboardService.getDashboardData.mockClear();
    mockDashboardService.getDashboardData.mockResolvedValue(mockDashboardData);

    // Call refetch
    await result.current.refetch();

    expect(mockDashboardService.getDashboardData).toHaveBeenCalledTimes(1);
    expect(mockDashboardService.getDashboardData).toHaveBeenCalledWith('player123', 'token123');
  });

  it('should refetch data when playerId or token changes', async () => {
    mockDashboardService.getDashboardData.mockResolvedValue(mockDashboardData);

    const { result, rerender } = renderHook(
      ({ playerId, token }) => useDashboard(playerId, token),
      { initialProps: { playerId: 'player123', token: 'token123' } }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockDashboardService.getDashboardData).toHaveBeenCalledTimes(1);

    // Change playerId
    rerender({ playerId: 'player456', token: 'token123' });

    await waitFor(() => {
      expect(mockDashboardService.getDashboardData).toHaveBeenCalledTimes(2);
    });

    expect(mockDashboardService.getDashboardData).toHaveBeenLastCalledWith('player456', 'token123');
  });
});