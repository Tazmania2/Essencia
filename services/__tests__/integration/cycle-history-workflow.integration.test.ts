/**
 * Integration tests for complete cycle history workflow
 * Tests the end-to-end flow from admin upload to player history view
 */

import { HistoryService } from '../../history.service';
import { DashboardConfigurationService } from '../../dashboard-configuration.service';
import { FunifierDatabaseService } from '../../funifier-database.service';
import { CSVProcessingService } from '../../csv-processing.service';
import { TeamType } from '../../../types';

// Mock external dependencies but allow internal service interactions
jest.mock('../../funifier-database.service');
jest.mock('../../../utils/logger');

describe('Cycle History Workflow Integration Tests', () => {
  let historyService: HistoryService;
  let configService: DashboardConfigurationService;
  let databaseService: jest.Mocked<FunifierDatabaseService>;
  let csvService: CSVProcessingService;

  const mockPlayerId = 'player_123';
  const mockCycleNumber = 2;

  beforeEach(() => {
    historyService = HistoryService.getInstance();
    configService = DashboardConfigurationService.getInstance();
    csvService = new CSVProcessingService();
    
    databaseService = {
      aggregateReportData: jest.fn(),
      getReportData: jest.fn(),
      saveReportData: jest.fn(),
      getConfiguration: jest.fn(),
      saveConfiguration: jest.fn(),
    } as any;

    (FunifierDatabaseService.getInstance as jest.Mock) = jest.fn().mockReturnValue(databaseService);
    
    jest.clearAllMocks();
  });

  describe('Complete Cycle Workflow', () => {
    it('should handle complete cycle from admin upload to player history view', async () => {
      // Step 1: Admin uploads CSV data with cycle information
      const mockCsvData = [
        {
          playerId: mockPlayerId,
          teamType: TeamType.CARTEIRA_I,
          atividade: 85.5,
          reaisPorAtivo: 923,
          faturamento: 39050,
          reportDate: '2024-01-21',
          cycleNumber: mockCycleNumber,
          completionStatus: 'completed'
        }
      ];

      // Mock CSV processing
      jest.spyOn(csvService, 'processCSVData').mockResolvedValue({
        success: true,
        processedRecords: mockCsvData.length,
        errors: [],
        data: mockCsvData
      });

      // Step 2: Data is stored with cycle information
      databaseService.saveReportData.mockResolvedValue({ success: true });

      // Step 3: Player requests history data
      const mockHistoryData = [
        {
          cycleNumber: mockCycleNumber,
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
        }
      ];

      databaseService.aggregateReportData.mockResolvedValue(mockHistoryData);

      // Execute the workflow
      const csvResult = await csvService.processCSVData('mock-csv-content', mockCycleNumber);
      expect(csvResult.success).toBe(true);

      const historyResult = await historyService.getPlayerCycleHistory(mockPlayerId);
      expect(historyResult).toHaveLength(1);
      expect(historyResult[0].cycleNumber).toBe(mockCycleNumber);
      expect(historyResult[0].finalMetrics.primaryGoal.percentage).toBe(85.5);

      // Verify database interactions
      expect(databaseService.saveReportData).toHaveBeenCalled();
      expect(databaseService.aggregateReportData).toHaveBeenCalledWith(
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

    it('should handle cycle details retrieval workflow', async () => {
      const mockCycleDetails = {
        cycleNumber: mockCycleNumber,
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
      };

      databaseService.aggregateReportData.mockResolvedValue([mockCycleDetails]);

      const result = await historyService.getCycleDetails(mockPlayerId, mockCycleNumber);

      expect(result).not.toBeNull();
      expect(result!.cycleNumber).toBe(mockCycleNumber);
      expect(result!.finalMetrics.primaryGoal.percentage).toBe(85.5);
      expect(databaseService.aggregateReportData).toHaveBeenCalledWith(
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

    it('should handle progress timeline retrieval workflow', async () => {
      const mockTimelineData = [
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

      databaseService.aggregateReportData.mockResolvedValue(mockTimelineData);

      const result = await historyService.getCycleProgressTimeline(mockPlayerId, mockCycleNumber);

      expect(result).toHaveLength(3);
      expect(result[0].date).toBe('2024-01-01');
      expect(result[2].metrics.primaryGoal).toBe(85.5);
      expect(databaseService.aggregateReportData).toHaveBeenCalledWith(
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
  });

  describe('Cycle Comparison Workflow', () => {
    it('should handle cycle comparison workflow', async () => {
      const cycle1Data = {
        cycleNumber: 1,
        finalMetrics: {
          primaryGoal: { percentage: 70 },
          secondaryGoal1: { percentage: 65 },
          secondaryGoal2: { percentage: 60 }
        }
      };

      const cycle2Data = {
        cycleNumber: 2,
        finalMetrics: {
          primaryGoal: { percentage: 85 },
          secondaryGoal1: { percentage: 80 },
          secondaryGoal2: { percentage: 75 }
        }
      };

      databaseService.aggregateReportData
        .mockResolvedValueOnce([cycle1Data])
        .mockResolvedValueOnce([cycle2Data]);

      const result = await historyService.compareCycles(mockPlayerId, 1, 2);

      expect(result.cycle1Data).toEqual(cycle1Data);
      expect(result.cycle2Data).toEqual(cycle2Data);
      expect(result.improvements.primaryGoal).toBe(15);
      expect(result.improvements.secondaryGoal1).toBe(15);
      expect(result.improvements.secondaryGoal2).toBe(15);
      expect(result.summary).toContain('Excelente melhoria');
    });
  });

  describe('Data Migration Workflow', () => {
    it('should handle backward compatibility with legacy data', async () => {
      const mockLegacyData = [
        { playerId: mockPlayerId, reportDate: '2023-12-01', cycleNumber: null },
        { playerId: mockPlayerId, reportDate: '2024-01-01', cycleNumber: 1 },
        { playerId: mockPlayerId, reportDate: '2024-02-01', cycleNumber: 2 }
      ];

      databaseService.getReportData.mockResolvedValue(mockLegacyData as any);

      const result = await historyService.getPlayerCycleHistoryWithCompatibility(mockPlayerId);

      expect(result).toHaveLength(3);
      expect(result[0].reportDate).toBe('2023-12-01'); // Sorted by date
      expect(result[0].cycleNumber).toBeNull(); // Legacy data preserved
      expect(result[1].cycleNumber).toBe(1);
      expect(result[2].cycleNumber).toBe(2);
    });
  });

  describe('Error Handling in Workflows', () => {
    it('should handle database errors gracefully in complete workflow', async () => {
      databaseService.aggregateReportData.mockRejectedValue(new Error('Database connection failed'));

      await expect(historyService.getPlayerCycleHistory(mockPlayerId)).rejects.toThrow();
    });

    it('should handle missing cycle data gracefully', async () => {
      databaseService.aggregateReportData.mockResolvedValue([]);

      const result = await historyService.getPlayerCycleHistory(mockPlayerId);
      expect(result).toEqual([]);

      const cycleDetails = await historyService.getCycleDetails(mockPlayerId, mockCycleNumber);
      expect(cycleDetails).toBeNull();
    });

    it('should handle partial data gracefully', async () => {
      const incompleteData = [
        {
          cycleNumber: 1,
          // Missing other required fields
        }
      ];

      databaseService.aggregateReportData.mockResolvedValue(incompleteData);

      const result = await historyService.getPlayerCycleHistory(mockPlayerId);
      expect(result).toHaveLength(1);
      expect(result[0].totalDays).toBe(21); // Default value applied
      expect(result[0].completionStatus).toBe('completed'); // Default value applied
    });
  });

  describe('Performance Considerations', () => {
    it('should handle large datasets efficiently', async () => {
      // Simulate large dataset
      const largeDataset = Array.from({ length: 100 }, (_, i) => ({
        cycleNumber: i + 1,
        startDate: `2024-${String(i + 1).padStart(2, '0')}-01`,
        endDate: `2024-${String(i + 1).padStart(2, '0')}-21`,
        totalDays: 21,
        completionStatus: 'completed',
        finalMetrics: {
          primaryGoal: { percentage: Math.random() * 100 },
          secondaryGoal1: { percentage: Math.random() * 100 },
          secondaryGoal2: { percentage: Math.random() * 100 }
        },
        progressTimeline: []
      }));

      databaseService.aggregateReportData.mockResolvedValue(largeDataset);

      const startTime = Date.now();
      const result = await historyService.getPlayerCycleHistory(mockPlayerId);
      const endTime = Date.now();

      expect(result).toHaveLength(100);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});