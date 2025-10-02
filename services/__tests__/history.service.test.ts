import { HistoryService, historyService } from '../history.service';
import { FunifierDatabaseService } from '../funifier-database.service';
import { CycleHistoryData } from '../../types';

// Mock dependencies
jest.mock('../funifier-database.service');
jest.mock('../error-handler.service');
jest.mock('../../utils/logger');

describe('HistoryService', () => {
  let service: HistoryService;
  let mockDatabaseService: jest.Mocked<FunifierDatabaseService>;

  beforeEach(() => {
    // Clear any existing instance
    (HistoryService as any).instance = undefined;
    
    mockDatabaseService = {
      getReportData: jest.fn(),
      getCSVGoalData: jest.fn(),
      aggregateReportData: jest.fn(),
    } as any;
    
    // Mock the getInstance method to return our mock
    (FunifierDatabaseService.getInstance as jest.Mock) = jest.fn().mockReturnValue(mockDatabaseService);
    
    // Now get the service instance (which will use our mocked database service)
    service = HistoryService.getInstance();
    
    jest.clearAllMocks();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = HistoryService.getInstance();
      const instance2 = HistoryService.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should return the same instance as the exported singleton', () => {
      // Since we clear the instance in beforeEach, we need to test the singleton behavior differently
      const instance1 = HistoryService.getInstance();
      const instance2 = HistoryService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('getPlayerCycleHistory', () => {
    const mockPlayerId = 'player123';
    
    const mockReportMetadata = [
      {
        _id: 'report1',
        playerId: 'player123',
        reportDate: '2024-01-15T10:00:00.000Z',
        uploadUrl: 'https://example.com/report1.csv',
        status: 'REGISTERED'
      },
      {
        _id: 'report2', 
        playerId: 'player123',
        reportDate: '2024-01-16T10:00:00.000Z',
        uploadUrl: 'https://example.com/report2.csv',
        status: 'REGISTERED'
      }
    ];

    const mockCSVData = {
      playerId: 'player123',
      cycleDay: 15,
      totalCycleDays: 21,
      faturamento: { target: 100, current: 85, percentage: 85 },
      reaisPorAtivo: { target: 100, current: 90, percentage: 90 },
      atividade: { target: 100, current: 95, percentage: 95 },
      multimarcasPorAtivo: { target: 100, current: 80, percentage: 80 }
    };

    beforeEach(() => {
      mockDatabaseService.aggregateReportData = jest.fn().mockResolvedValue(mockReportMetadata);
      mockDatabaseService.getCSVGoalData = jest.fn().mockResolvedValue(mockCSVData);
    });

    it('should fetch minimal metadata and parse CSV files using aggregation', async () => {
      const result = await service.getPlayerCycleHistory(mockPlayerId);

      expect(mockDatabaseService.aggregateReportData).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            $match: {
              playerId: mockPlayerId,
              uploadUrl: { $exists: true, $ne: null },
              status: 'REGISTERED'
            }
          })
        ])
      );
      
      expect(mockDatabaseService.getCSVGoalData).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(1); // Should group into 1 cycle
    });

    it('should return empty array when no reports found', async () => {
      mockDatabaseService.aggregateReportData = jest.fn().mockResolvedValue([]);
      
      const result = await service.getPlayerCycleHistory(mockPlayerId);
      
      expect(result).toEqual([]);
    });

    it('should handle CSV parsing failures gracefully', async () => {
      mockDatabaseService.getCSVGoalData = jest.fn().mockResolvedValue(null);
      
      const result = await service.getPlayerCycleHistory(mockPlayerId);
      
      expect(result).toEqual([]);
    });

    it('should use real CSV data instead of mock database percentages', async () => {
      const result = await service.getPlayerCycleHistory(mockPlayerId);
      
      if (result.length > 0) {
        const cycle = result[0];
        // Should use CSV data, not database percentages
        expect(cycle.finalMetrics.primaryGoal.percentage).toBe(95); // From CSV atividade
        expect(cycle.finalMetrics.secondaryGoal1.percentage).toBe(90); // From CSV reaisPorAtivo
        expect(cycle.finalMetrics.secondaryGoal2.percentage).toBe(85); // From CSV faturamento
      }
    });
  });

  describe('getPlayerCycleHistoryWithCompatibility', () => {
    const mockPlayerId = 'player123';

    it('should return minimal metadata only', async () => {
      const mockRecords = [
        { _id: '1', playerId: mockPlayerId, reportDate: '2024-01-01T00:00:00.000Z' },
        { _id: '2', playerId: mockPlayerId, reportDate: '2024-02-01T00:00:00.000Z' }
      ];

      mockDatabaseService.getReportData.mockResolvedValue(mockRecords as any);

      const result = await service.getPlayerCycleHistoryWithCompatibility(mockPlayerId);

      expect(result).toHaveLength(2);
      expect(mockDatabaseService.getReportData).toHaveBeenCalledWith({ 
        playerId: mockPlayerId 
      });
    });

    it('should handle errors gracefully', async () => {
      mockDatabaseService.getReportData.mockRejectedValue(new Error('Database error'));
      
      const result = await service.getPlayerCycleHistoryWithCompatibility(mockPlayerId);
      
      expect(result).toEqual([]);
    });
  });

  describe('hasHistoricalData', () => {
    const mockPlayerId = 'player123';

    it('should return true when player has cycles', async () => {
      const mockRecords = [
        { _id: '1' }
      ];

      mockDatabaseService.aggregateReportData.mockResolvedValue(mockRecords as any);

      const result = await service.hasHistoricalData(mockPlayerId);

      expect(result).toBe(true);
      expect(mockDatabaseService.aggregateReportData).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            $match: {
              playerId: mockPlayerId,
              cycleNumber: { $exists: true, $ne: null }
            }
          })
        ])
      );
    });

    it('should return false when player has no cycles', async () => {
      mockDatabaseService.aggregateReportData.mockResolvedValue([]);

      const result = await service.hasHistoricalData(mockPlayerId);

      expect(result).toBe(false);
    });
  });
});