import { HistoryService, historyService } from '../history.service';
import { FunifierDatabaseService } from '../funifier-database.service';
import { errorHandlerService } from '../error-handler.service';
import { CycleHistoryData, ProgressDataPoint, TeamType } from '../../types';

// Mock dependencies
jest.mock('../funifier-database.service');
jest.mock('../error-handler.service');
jest.mock('../../utils/logger');

describe('HistoryService', () => {
  let service: HistoryService;
  let mockDatabaseService: jest.Mocked<FunifierDatabaseService>;

  beforeEach(() => {
    service = HistoryService.getInstance();
    mockDatabaseService = {
      aggregateReportData: jest.fn(),
      getReportData: jest.fn(),
    } as any;
    
    // Mock the getInstance method to return our mock
    (FunifierDatabaseService.getInstance as jest.Mock) = jest.fn().mockReturnValue(mockDatabaseService);
    
    jest.clearAllMocks();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = HistoryService.getInstance();
      const instance2 = HistoryService.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should return the same instance as the exported singleton', () => {
      expect(HistoryService.getInstance()).toBe(historyService);
    });
  });

  describe('getPlayerCycleHistory', () => {
    const mockPlayerId = 'player123';
    const mockAggregationResults = [
      {
        cycleNumber: 2,
        startDate: '2024-01-01',
        endDate: '2024-01-21',
        totalDays: 21,
        completionStatus: 'completed',
        finalMetrics: {
          primaryGoal: {
            name: 'Atividade',
            percentage: 85.5,
            target: 100,
            current: 85.5,
            unit: 'points',
            boostActive: false
          },
          secondaryGoal1: {
            name: 'Reais por Ativo',
            percentage: 92.3,
            target: 1000,
            current: 923,
            unit: 'R$',
            boostActive: true
          },
          secondaryGoal2: {
            name: 'Faturamento',
            percentage: 78.1,
            target: 50000,
            current: 39050,
            unit: 'R$',
            boostActive: false
          }
        },
        progressTimeline: [
          {
            date: '2024-01-01',
            dayInCycle: 1,
            uploadSequence: 1,
            metrics: { primaryGoal: 10, secondaryGoal1: 15, secondaryGoal2: 8 }
          },
          {
            date: '2024-01-21',
            dayInCycle: 21,
            uploadSequence: 21,
            metrics: { primaryGoal: 85.5, secondaryGoal1: 92.3, secondaryGoal2: 78.1 }
          }
        ]
      },
      {
        cycleNumber: 1,
        startDate: '2023-12-01',
        endDate: '2023-12-21',
        totalDays: 21,
        completionStatus: 'completed',
        finalMetrics: {
          primaryGoal: {
            name: 'Atividade',
            percentage: 75.2,
            target: 100,
            current: 75.2,
            unit: 'points',
            boostActive: false
          },
          secondaryGoal1: {
            name: 'Reais por Ativo',
            percentage: 88.7,
            target: 1000,
            current: 887,
            unit: 'R$',
            boostActive: false
          },
          secondaryGoal2: {
            name: 'Faturamento',
            percentage: 65.4,
            target: 50000,
            current: 32700,
            unit: 'R$',
            boostActive: true
          }
        },
        progressTimeline: []
      }
    ];

    beforeEach(() => {
      mockDatabaseService.aggregateReportData.mockResolvedValue(mockAggregationResults);
    });

    it('should return cycle history for a player', async () => {
      const result = await service.getPlayerCycleHistory(mockPlayerId);

      expect(result).toHaveLength(2);
      expect(result[0].cycleNumber).toBe(2);
      expect(result[1].cycleNumber).toBe(1);
      expect(result[0].finalMetrics.primaryGoal.percentage).toBe(85.5);
      expect(mockDatabaseService.aggregateReportData).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            $match: {
              playerId: mockPlayerId,
              cycleNumber: { $exists: true, $ne: null },
              completionStatus: 'completed'
            }
          })
        ])
      );
    });

    it('should return empty array when no cycles found', async () => {
      mockDatabaseService.aggregateReportData.mockResolvedValue([]);

      const result = await service.getPlayerCycleHistory(mockPlayerId);

      expect(result).toEqual([]);
    });

    it('should handle database errors gracefully', async () => {
      const mockError = new Error('Database connection failed');
      mockDatabaseService.aggregateReportData.mockRejectedValue(mockError);
      
      const mockHandledError = new Error('Handled database error');
      (errorHandlerService.handleDataProcessingError as jest.Mock).mockReturnValue(mockHandledError);

      await expect(service.getPlayerCycleHistory(mockPlayerId)).rejects.toThrow('Handled database error');
      expect(errorHandlerService.handleDataProcessingError).toHaveBeenCalledWith(mockError, 'getPlayerCycleHistory');
      expect(errorHandlerService.logError).toHaveBeenCalled();
    });

    it('should handle missing data gracefully with defaults', async () => {
      const incompleteResults = [
        {
          cycleNumber: 1,
          // Missing other fields
        }
      ];
      mockDatabaseService.aggregateReportData.mockResolvedValue(incompleteResults);

      const result = await service.getPlayerCycleHistory(mockPlayerId);

      expect(result).toHaveLength(1);
      expect(result[0].totalDays).toBe(21); // Default value
      expect(result[0].completionStatus).toBe('completed'); // Default value
      expect(result[0].finalMetrics.primaryGoal.name).toBe('Unknown'); // Default value
    });
  });

  describe('getCycleDetails', () => {
    const mockPlayerId = 'player123';
    const mockCycleNumber = 2;

    it('should return cycle details for specific cycle', async () => {
      const mockResult = [{
        cycleNumber: 2,
        startDate: '2024-01-01',
        endDate: '2024-01-21',
        totalDays: 21,
        completionStatus: 'completed',
        finalMetrics: {
          primaryGoal: {
            name: 'Atividade',
            percentage: 85.5,
            target: 100,
            current: 85.5,
            unit: 'points',
            boostActive: false
          },
          secondaryGoal1: {
            name: 'Reais por Ativo',
            percentage: 92.3,
            target: 1000,
            current: 923,
            unit: 'R$',
            boostActive: true
          },
          secondaryGoal2: {
            name: 'Faturamento',
            percentage: 78.1,
            target: 50000,
            current: 39050,
            unit: 'R$',
            boostActive: false
          }
        },
        progressTimeline: []
      }];

      mockDatabaseService.aggregateReportData.mockResolvedValue(mockResult);

      const result = await service.getCycleDetails(mockPlayerId, mockCycleNumber);

      expect(result).not.toBeNull();
      expect(result!.cycleNumber).toBe(2);
      expect(result!.finalMetrics.primaryGoal.percentage).toBe(85.5);
      expect(mockDatabaseService.aggregateReportData).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            $match: {
              playerId: mockPlayerId,
              cycleNumber: mockCycleNumber
            }
          })
        ])
      );
    });

    it('should return null when cycle not found', async () => {
      mockDatabaseService.aggregateReportData.mockResolvedValue([]);

      const result = await service.getCycleDetails(mockPlayerId, mockCycleNumber);

      expect(result).toBeNull();
    });

    it('should handle database errors gracefully', async () => {
      const mockError = new Error('Database error');
      mockDatabaseService.aggregateReportData.mockRejectedValue(mockError);
      
      const mockHandledError = new Error('Handled error');
      (errorHandlerService.handleDataProcessingError as jest.Mock).mockReturnValue(mockHandledError);

      await expect(service.getCycleDetails(mockPlayerId, mockCycleNumber)).rejects.toThrow('Handled error');
    });
  });

  describe('getCycleProgressTimeline', () => {
    const mockPlayerId = 'player123';
    const mockCycleNumber = 2;

    it('should return progress timeline for cycle', async () => {
      const mockResults = [
        {
          date: '2024-01-01',
          dayInCycle: 1,
          uploadSequence: 1,
          metrics: { primaryGoal: 10, secondaryGoal1: 15, secondaryGoal2: 8 }
        },
        {
          date: '2024-01-07',
          dayInCycle: 7,
          uploadSequence: 2,
          metrics: { primaryGoal: 35, secondaryGoal1: 42, secondaryGoal2: 28 }
        },
        {
          date: '2024-01-21',
          dayInCycle: 21,
          uploadSequence: 3,
          metrics: { primaryGoal: 85.5, secondaryGoal1: 92.3, secondaryGoal2: 78.1 }
        }
      ];

      mockDatabaseService.aggregateReportData.mockResolvedValue(mockResults);

      const result = await service.getCycleProgressTimeline(mockPlayerId, mockCycleNumber);

      expect(result).toHaveLength(3);
      expect(result[0].date).toBe('2024-01-01');
      expect(result[0].metrics.primaryGoal).toBe(10);
      expect(result[2].metrics.primaryGoal).toBe(85.5);
    });

    it('should return empty array when no timeline data found', async () => {
      mockDatabaseService.aggregateReportData.mockResolvedValue([]);

      const result = await service.getCycleProgressTimeline(mockPlayerId, mockCycleNumber);

      expect(result).toEqual([]);
    });

    it('should handle missing data with defaults', async () => {
      const incompleteResults = [
        {
          date: '2024-01-01',
          // Missing other fields
        }
      ];
      mockDatabaseService.aggregateReportData.mockResolvedValue(incompleteResults);

      const result = await service.getCycleProgressTimeline(mockPlayerId, mockCycleNumber);

      expect(result).toHaveLength(1);
      expect(result[0].dayInCycle).toBe(1); // Default value
      expect(result[0].uploadSequence).toBe(1); // Default value
      expect(result[0].metrics).toEqual({}); // Default value
    });
  });

  describe('hasHistoricalData', () => {
    const mockPlayerId = 'player123';

    it('should return true when player has completed cycles', async () => {
      const mockCycles = [
        { cycleNumber: 1, completionStatus: 'completed' },
        { cycleNumber: 2, completionStatus: 'in_progress' }
      ] as CycleHistoryData[];

      jest.spyOn(service, 'getPlayerCycles').mockResolvedValue(mockCycles);

      const result = await service.hasHistoricalData(mockPlayerId);

      expect(result).toBe(true);
    });

    it('should return false when player has no completed cycles', async () => {
      const mockCycles = [
        { cycleNumber: 1, completionStatus: 'in_progress' }
      ] as CycleHistoryData[];

      jest.spyOn(service, 'getPlayerCycles').mockResolvedValue(mockCycles);

      const result = await service.hasHistoricalData(mockPlayerId);

      expect(result).toBe(false);
    });

    it('should return false when player has no cycles', async () => {
      jest.spyOn(service, 'getPlayerCycles').mockResolvedValue([]);

      const result = await service.hasHistoricalData(mockPlayerId);

      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      jest.spyOn(service, 'getPlayerCycles').mockRejectedValue(new Error('Database error'));

      const result = await service.hasHistoricalData(mockPlayerId);

      expect(result).toBe(false);
    });
  });

  describe('getCycleSummaryStats', () => {
    const mockPlayerId = 'player123';

    it('should calculate summary stats correctly', async () => {
      const mockCycles = [
        {
          cycleNumber: 3,
          finalMetrics: {
            primaryGoal: { percentage: 90 },
            secondaryGoal1: { percentage: 85 },
            secondaryGoal2: { percentage: 80 }
          }
        },
        {
          cycleNumber: 2,
          finalMetrics: {
            primaryGoal: { percentage: 75 },
            secondaryGoal1: { percentage: 70 },
            secondaryGoal2: { percentage: 65 }
          }
        },
        {
          cycleNumber: 1,
          finalMetrics: {
            primaryGoal: { percentage: 60 },
            secondaryGoal1: { percentage: 55 },
            secondaryGoal2: { percentage: 50 }
          }
        }
      ] as CycleHistoryData[];

      jest.spyOn(service, 'getPlayerCycleHistory').mockResolvedValue(mockCycles);

      const result = await service.getCycleSummaryStats(mockPlayerId);

      expect(result.totalCycles).toBe(3);
      expect(result.averagePerformance).toBe(70); // Average of all percentages
      expect(result.bestCycle?.cycleNumber).toBe(3);
      expect(result.bestCycle?.performance).toBe(85); // (90+85+80)/3
      expect(result.worstCycle?.cycleNumber).toBe(1);
      expect(result.worstCycle?.performance).toBe(55); // (60+55+50)/3
    });

    it('should return empty stats when no cycles', async () => {
      jest.spyOn(service, 'getPlayerCycleHistory').mockResolvedValue([]);

      const result = await service.getCycleSummaryStats(mockPlayerId);

      expect(result.totalCycles).toBe(0);
      expect(result.averagePerformance).toBe(0);
      expect(result.bestCycle).toBeNull();
      expect(result.worstCycle).toBeNull();
      expect(result.improvementTrend).toBe('stable');
    });

    it('should determine improvement trend correctly', async () => {
      // Create cycles showing improvement (older cycles have lower performance)
      const improvingCycles = [
        { cycleNumber: 4, finalMetrics: { primaryGoal: { percentage: 90 }, secondaryGoal1: { percentage: 85 }, secondaryGoal2: { percentage: 80 } } },
        { cycleNumber: 3, finalMetrics: { primaryGoal: { percentage: 85 }, secondaryGoal1: { percentage: 80 }, secondaryGoal2: { percentage: 75 } } },
        { cycleNumber: 2, finalMetrics: { primaryGoal: { percentage: 70 }, secondaryGoal1: { percentage: 65 }, secondaryGoal2: { percentage: 60 } } },
        { cycleNumber: 1, finalMetrics: { primaryGoal: { percentage: 60 }, secondaryGoal1: { percentage: 55 }, secondaryGoal2: { percentage: 50 } } }
      ] as CycleHistoryData[];

      jest.spyOn(service, 'getPlayerCycleHistory').mockResolvedValue(improvingCycles);

      const result = await service.getCycleSummaryStats(mockPlayerId);

      // The trend calculation compares recent cycles (first half) vs older cycles (second half)
      // Recent: cycles 4,3 avg = (85+80)/2 = 82.5
      // Older: cycles 2,1 avg = (65+55)/2 = 60
      // Since 82.5 > 60, trend should be improving
      expect(result.improvementTrend).toBe('improving');
    });

    it('should handle errors gracefully', async () => {
      const mockError = new Error('Database error');
      jest.spyOn(service, 'getPlayerCycleHistory').mockRejectedValue(mockError);
      
      const mockHandledError = new Error('Handled error');
      (errorHandlerService.handleDataProcessingError as jest.Mock).mockReturnValue(mockHandledError);

      await expect(service.getCycleSummaryStats(mockPlayerId)).rejects.toThrow('Handled error');
    });
  });

  describe('compareCycles', () => {
    const mockPlayerId = 'player123';

    it('should compare two cycles correctly', async () => {
      const cycle1Data = {
        cycleNumber: 1,
        finalMetrics: {
          primaryGoal: { percentage: 70 },
          secondaryGoal1: { percentage: 65 },
          secondaryGoal2: { percentage: 60 }
        }
      } as CycleHistoryData;

      const cycle2Data = {
        cycleNumber: 2,
        finalMetrics: {
          primaryGoal: { percentage: 85 },
          secondaryGoal1: { percentage: 80 },
          secondaryGoal2: { percentage: 75 }
        }
      } as CycleHistoryData;

      jest.spyOn(service, 'getCycleDetails')
        .mockResolvedValueOnce(cycle1Data)
        .mockResolvedValueOnce(cycle2Data);

      const result = await service.compareCycles(mockPlayerId, 1, 2);

      expect(result.cycle1Data).toBe(cycle1Data);
      expect(result.cycle2Data).toBe(cycle2Data);
      expect(result.improvements.primaryGoal).toBe(15); // 85 - 70
      expect(result.improvements.secondaryGoal1).toBe(15); // 80 - 65
      expect(result.improvements.secondaryGoal2).toBe(15); // 75 - 60
      expect(result.summary).toContain('Excelente melhoria'); // Total improvement = 45
    });

    it('should handle missing cycle data', async () => {
      jest.spyOn(service, 'getCycleDetails')
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      const result = await service.compareCycles(mockPlayerId, 1, 2);

      expect(result.cycle1Data).toBeNull();
      expect(result.cycle2Data).toBeNull();
      expect(result.summary).toBe('Não foi possível comparar os ciclos.');
    });

    it('should generate appropriate summary messages', async () => {
      const cycle1Data = {
        finalMetrics: {
          primaryGoal: { percentage: 70 },
          secondaryGoal1: { percentage: 70 },
          secondaryGoal2: { percentage: 70 }
        }
      } as CycleHistoryData;

      const cycle2Data = {
        finalMetrics: {
          primaryGoal: { percentage: 50 },
          secondaryGoal1: { percentage: 50 },
          secondaryGoal2: { percentage: 50 }
        }
      } as CycleHistoryData;

      jest.spyOn(service, 'getCycleDetails')
        .mockResolvedValueOnce(cycle1Data)
        .mockResolvedValueOnce(cycle2Data);

      const result = await service.compareCycles(mockPlayerId, 1, 2);

      expect(result.summary).toContain('Performance declinou'); // Total decline = -60
    });
  });

  describe('getPlayerCycleHistoryWithCompatibility', () => {
    const mockPlayerId = 'player123';

    it('should return all records including legacy data', async () => {
      const mockRecords = [
        { playerId: mockPlayerId, reportDate: '2024-01-01', cycleNumber: 1 },
        { playerId: mockPlayerId, reportDate: '2024-02-01', cycleNumber: null }, // Legacy data
        { playerId: mockPlayerId, reportDate: '2024-03-01', cycleNumber: 2 }
      ];

      mockDatabaseService.getReportData.mockResolvedValue(mockRecords as any);

      const result = await service.getPlayerCycleHistoryWithCompatibility(mockPlayerId);

      expect(result).toHaveLength(3);
      expect(mockDatabaseService.getReportData).toHaveBeenCalledWith({ playerId: mockPlayerId });
    });

    it('should sort records by report date', async () => {
      const mockRecords = [
        { playerId: mockPlayerId, reportDate: '2024-03-01', cycleNumber: 2 },
        { playerId: mockPlayerId, reportDate: '2024-01-01', cycleNumber: 1 },
        { playerId: mockPlayerId, reportDate: '2024-02-01', cycleNumber: null }
      ];

      mockDatabaseService.getReportData.mockResolvedValue(mockRecords as any);

      const result = await service.getPlayerCycleHistoryWithCompatibility(mockPlayerId);

      expect(result[0].reportDate).toBe('2024-01-01');
      expect(result[1].reportDate).toBe('2024-02-01');
      expect(result[2].reportDate).toBe('2024-03-01');
    });

    it('should handle database errors gracefully', async () => {
      const mockError = new Error('Database error');
      mockDatabaseService.getReportData.mockRejectedValue(mockError);
      
      const mockHandledError = new Error('Handled error');
      (errorHandlerService.handleDataProcessingError as jest.Mock).mockReturnValue(mockHandledError);

      await expect(service.getPlayerCycleHistoryWithCompatibility(mockPlayerId)).rejects.toThrow('Handled error');
    });
  });
});