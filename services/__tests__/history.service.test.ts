import { HistoryService } from '../history.service';
import { FunifierDatabaseService } from '../funifier-database.service';
import {
  CycleHistoryData,
  ProgressDataPoint,
  CycleInfo,
  MetricSnapshot,
  ApiError,
  ErrorType
} from '../../types';

// Mock the database service
jest.mock('../funifier-database.service');
jest.mock('../../utils/logger', () => ({
  secureLogger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

describe('HistoryService', () => {
  let historyService: HistoryService;
  let mockDatabaseService: jest.Mocked<FunifierDatabaseService>;

  const mockMetricSnapshot: MetricSnapshot = {
    name: 'atividade',
    percentage: 85.5,
    target: 100,
    current: 85.5,
    unit: 'pontos',
    boostActive: false
  };

  const mockProgressDataPoint: ProgressDataPoint = {
    date: '2024-01-15T10:30:00Z',
    dayInCycle: 15,
    uploadSequence: 1,
    metrics: {
      atividade: 85.5,
      reaisPorAtivo: 92.3,
      faturamento: 78.1
    }
  };

  const mockCycleHistoryData: CycleHistoryData = {
    cycleNumber: 1,
    startDate: '2024-01-01T00:00:00Z',
    endDate: '2024-01-21T23:59:59Z',
    totalDays: 21,
    completionStatus: 'completed',
    finalMetrics: {
      primaryGoal: mockMetricSnapshot,
      secondaryGoal1: { ...mockMetricSnapshot, name: 'reaisPorAtivo', percentage: 92.3 },
      secondaryGoal2: { ...mockMetricSnapshot, name: 'faturamento', percentage: 78.1 }
    },
    progressTimeline: [mockProgressDataPoint]
  };

  const mockCycleInfo: CycleInfo = {
    cycleNumber: 1,
    startDate: '2024-01-01T00:00:00Z',
    endDate: '2024-01-21T23:59:59Z',
    totalDays: 21,
    isActive: false,
    isCompleted: true
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock the singleton getInstance method
    mockDatabaseService = {
      getPlayerCycleHistory: jest.fn(),
      getCycleDetails: jest.fn(),
      getCycleProgressTimeline: jest.fn(),
      getPlayerCycles: jest.fn(),
    } as any;

    (FunifierDatabaseService.getInstance as jest.Mock).mockReturnValue(mockDatabaseService);
    
    historyService = HistoryService.getInstance();
  });

  describe('getPlayerCycleHistory', () => {
    it('should return completed cycles sorted by cycle number descending', async () => {
      const mockCycles = [
        { ...mockCycleHistoryData, cycleNumber: 1 },
        { ...mockCycleHistoryData, cycleNumber: 2 },
        { ...mockCycleHistoryData, cycleNumber: 3, completionStatus: 'in_progress' as const }
      ];

      mockDatabaseService.getPlayerCycleHistory.mockResolvedValue(mockCycles);

      const result = await historyService.getPlayerCycleHistory('player123');

      expect(result).toHaveLength(2); // Only completed cycles
      expect(result[0].cycleNumber).toBe(2); // Most recent first
      expect(result[1].cycleNumber).toBe(1);
      expect(mockDatabaseService.getPlayerCycleHistory).toHaveBeenCalledWith('player123');
    });

    it('should return empty array when no completed cycles exist', async () => {
      const mockCycles = [
        { ...mockCycleHistoryData, completionStatus: 'in_progress' as const }
      ];

      mockDatabaseService.getPlayerCycleHistory.mockResolvedValue(mockCycles);

      const result = await historyService.getPlayerCycleHistory('player123');

      expect(result).toHaveLength(0);
    });

    it('should throw ApiError when database service fails', async () => {
      const dbError = new Error('Database connection failed');
      mockDatabaseService.getPlayerCycleHistory.mockRejectedValue(dbError);

      await expect(historyService.getPlayerCycleHistory('player123'))
        .rejects.toThrow(ApiError);

      try {
        await historyService.getPlayerCycleHistory('player123');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).type).toBe(ErrorType.DATA_PROCESSING_ERROR);
        expect((error as ApiError).message).toContain('Failed to retrieve cycle history for player player123');
      }
    });
  });

  describe('getCycleDetails', () => {
    it('should return cycle details for valid player and cycle', async () => {
      mockDatabaseService.getCycleDetails.mockResolvedValue(mockCycleHistoryData);

      const result = await historyService.getCycleDetails('player123', 1);

      expect(result).toEqual(mockCycleHistoryData);
      expect(mockDatabaseService.getCycleDetails).toHaveBeenCalledWith('player123', 1);
    });

    it('should return null when cycle details not found', async () => {
      mockDatabaseService.getCycleDetails.mockResolvedValue(null);

      const result = await historyService.getCycleDetails('player123', 999);

      expect(result).toBeNull();
      expect(mockDatabaseService.getCycleDetails).toHaveBeenCalledWith('player123', 999);
    });

    it('should throw ApiError when database service fails', async () => {
      const dbError = new Error('Database query failed');
      mockDatabaseService.getCycleDetails.mockRejectedValue(dbError);

      await expect(historyService.getCycleDetails('player123', 1))
        .rejects.toThrow(ApiError);

      try {
        await historyService.getCycleDetails('player123', 1);
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).type).toBe(ErrorType.DATA_PROCESSING_ERROR);
        expect((error as ApiError).message).toContain('Failed to retrieve cycle details for player player123, cycle 1');
      }
    });
  });

  describe('getCycleProgressTimeline', () => {
    it('should return progress timeline sorted by upload sequence', async () => {
      const mockTimeline = [
        { ...mockProgressDataPoint, uploadSequence: 3, dayInCycle: 20 },
        { ...mockProgressDataPoint, uploadSequence: 1, dayInCycle: 5 },
        { ...mockProgressDataPoint, uploadSequence: 2, dayInCycle: 10 }
      ];

      mockDatabaseService.getCycleProgressTimeline.mockResolvedValue(mockTimeline);

      const result = await historyService.getCycleProgressTimeline('player123', 1);

      expect(result).toHaveLength(3);
      expect(result[0].uploadSequence).toBe(1); // First upload
      expect(result[1].uploadSequence).toBe(2);
      expect(result[2].uploadSequence).toBe(3); // Last upload
      expect(mockDatabaseService.getCycleProgressTimeline).toHaveBeenCalledWith('player123', 1);
    });

    it('should return empty array when no timeline data exists', async () => {
      mockDatabaseService.getCycleProgressTimeline.mockResolvedValue([]);

      const result = await historyService.getCycleProgressTimeline('player123', 1);

      expect(result).toHaveLength(0);
    });

    it('should throw ApiError when database service fails', async () => {
      const dbError = new Error('Timeline query failed');
      mockDatabaseService.getCycleProgressTimeline.mockRejectedValue(dbError);

      await expect(historyService.getCycleProgressTimeline('player123', 1))
        .rejects.toThrow(ApiError);

      try {
        await historyService.getCycleProgressTimeline('player123', 1);
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).type).toBe(ErrorType.DATA_PROCESSING_ERROR);
        expect((error as ApiError).message).toContain('Failed to retrieve progress timeline for player player123, cycle 1');
      }
    });
  });

  describe('getPlayerCycles', () => {
    it('should return all cycles for a player', async () => {
      const mockCycles = [mockCycleInfo, { ...mockCycleInfo, cycleNumber: 2 }];
      mockDatabaseService.getPlayerCycles.mockResolvedValue(mockCycles);

      const result = await historyService.getPlayerCycles('player123');

      expect(result).toEqual(mockCycles);
      expect(mockDatabaseService.getPlayerCycles).toHaveBeenCalledWith('player123');
    });

    it('should throw ApiError when database service fails', async () => {
      const dbError = new Error('Cycles query failed');
      mockDatabaseService.getPlayerCycles.mockRejectedValue(dbError);

      await expect(historyService.getPlayerCycles('player123'))
        .rejects.toThrow(ApiError);
    });
  });

  describe('hasHistoricalData', () => {
    it('should return true when player has completed cycles', async () => {
      const mockCycles = [
        { ...mockCycleInfo, isCompleted: true },
        { ...mockCycleInfo, cycleNumber: 2, isCompleted: false }
      ];
      mockDatabaseService.getPlayerCycles.mockResolvedValue(mockCycles);

      const result = await historyService.hasHistoricalData('player123');

      expect(result).toBe(true);
    });

    it('should return false when player has no completed cycles', async () => {
      const mockCycles = [
        { ...mockCycleInfo, isCompleted: false }
      ];
      mockDatabaseService.getPlayerCycles.mockResolvedValue(mockCycles);

      const result = await historyService.hasHistoricalData('player123');

      expect(result).toBe(false);
    });

    it('should return false when no cycles exist', async () => {
      mockDatabaseService.getPlayerCycles.mockResolvedValue([]);

      const result = await historyService.hasHistoricalData('player123');

      expect(result).toBe(false);
    });

    it('should return false when database service fails', async () => {
      const dbError = new Error('Database error');
      mockDatabaseService.getPlayerCycles.mockRejectedValue(dbError);

      const result = await historyService.hasHistoricalData('player123');

      expect(result).toBe(false);
    });
  });

  describe('getCycleSummaryStats', () => {
    it('should calculate summary statistics correctly', async () => {
      const mockCycles = [
        {
          ...mockCycleHistoryData,
          cycleNumber: 1,
          finalMetrics: {
            primaryGoal: { ...mockMetricSnapshot, name: 'atividade', percentage: 80 },
            secondaryGoal1: { ...mockMetricSnapshot, name: 'reaisPorAtivo', percentage: 90 },
            secondaryGoal2: { ...mockMetricSnapshot, name: 'faturamento', percentage: 70 }
          }
        },
        {
          ...mockCycleHistoryData,
          cycleNumber: 2,
          finalMetrics: {
            primaryGoal: { ...mockMetricSnapshot, name: 'atividade', percentage: 90 },
            secondaryGoal1: { ...mockMetricSnapshot, name: 'reaisPorAtivo', percentage: 85 },
            secondaryGoal2: { ...mockMetricSnapshot, name: 'faturamento', percentage: 95 }
          }
        }
      ];

      mockDatabaseService.getPlayerCycleHistory.mockResolvedValue(mockCycles);

      const result = await historyService.getCycleSummaryStats('player123');

      expect(result.totalCycles).toBe(2);
      expect(result.completedCycles).toBe(2);
      expect(result.averagePerformance.atividade).toBe(85); // (80 + 90) / 2
      expect(result.averagePerformance.reaisPorAtivo).toBe(87.5); // (90 + 85) / 2
      expect(result.averagePerformance.faturamento).toBe(82.5); // (70 + 95) / 2
      expect(result.bestCycle).toBe(2); // Cycle 2 has better overall average
      expect(result.latestCycle).toBe(1); // Most recent cycle (first in sorted array)
    });

    it('should return empty stats when no cycles exist', async () => {
      mockDatabaseService.getPlayerCycleHistory.mockResolvedValue([]);

      const result = await historyService.getCycleSummaryStats('player123');

      expect(result.totalCycles).toBe(0);
      expect(result.completedCycles).toBe(0);
      expect(result.averagePerformance).toEqual({});
      expect(result.bestCycle).toBeNull();
      expect(result.latestCycle).toBeNull();
    });

    it('should throw ApiError when database service fails', async () => {
      const dbError = new Error('Stats query failed');
      mockDatabaseService.getPlayerCycleHistory.mockRejectedValue(dbError);

      await expect(historyService.getCycleSummaryStats('player123'))
        .rejects.toThrow(ApiError);
    });
  });

  describe('compareCycles', () => {
    it('should compare two cycles correctly', async () => {
      const cycle1Data = {
        ...mockCycleHistoryData,
        cycleNumber: 1,
        finalMetrics: {
          primaryGoal: { ...mockMetricSnapshot, percentage: 80 },
          secondaryGoal1: { ...mockMetricSnapshot, percentage: 70 },
          secondaryGoal2: { ...mockMetricSnapshot, percentage: 60 }
        }
      };

      const cycle2Data = {
        ...mockCycleHistoryData,
        cycleNumber: 2,
        finalMetrics: {
          primaryGoal: { ...mockMetricSnapshot, percentage: 90 },
          secondaryGoal1: { ...mockMetricSnapshot, percentage: 85 },
          secondaryGoal2: { ...mockMetricSnapshot, percentage: 75 }
        }
      };

      mockDatabaseService.getCycleDetails
        .mockResolvedValueOnce(cycle1Data)
        .mockResolvedValueOnce(cycle2Data);

      const result = await historyService.compareCycles('player123', 1, 2);

      expect(result.cycle1Data).toEqual(cycle1Data);
      expect(result.cycle2Data).toEqual(cycle2Data);
      expect(result.comparison.primaryGoal.difference).toBe(10); // 90 - 80
      expect(result.comparison.secondaryGoal1.difference).toBe(15); // 85 - 70
      expect(result.comparison.secondaryGoal2.difference).toBe(15); // 75 - 60
      expect(result.comparison.overall.difference).toBe(15); // (90+85+75)/3 - (80+70+60)/3
    });

    it('should handle missing cycle data gracefully', async () => {
      mockDatabaseService.getCycleDetails
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockCycleHistoryData);

      const result = await historyService.compareCycles('player123', 999, 1);

      expect(result.cycle1Data).toBeNull();
      expect(result.cycle2Data).toEqual(mockCycleHistoryData);
      expect(result.comparison.primaryGoal.difference).toBe(0);
      expect(result.comparison.overall.difference).toBe(0);
    });

    it('should throw ApiError when database service fails', async () => {
      const dbError = new Error('Comparison query failed');
      mockDatabaseService.getCycleDetails.mockRejectedValue(dbError);

      await expect(historyService.compareCycles('player123', 1, 2))
        .rejects.toThrow(ApiError);
    });
  });

  describe('singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = HistoryService.getInstance();
      const instance2 = HistoryService.getInstance();

      expect(instance1).toBe(instance2);
    });
  });
});