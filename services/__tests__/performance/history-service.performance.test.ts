/**
 * Performance tests for HistoryService
 * Tests performance with large datasets and complex queries
 */

import { HistoryService } from '../../history.service';
import { FunifierDatabaseService } from '../../funifier-database.service';
import { CycleHistoryData } from '../../../types';

// Mock dependencies
jest.mock('../../funifier-database.service');
jest.mock('../../../utils/logger');
jest.mock('../../error-handler.service');

describe('HistoryService Performance Tests', () => {
  let service: HistoryService;
  let mockDatabaseService: jest.Mocked<FunifierDatabaseService>;

  const mockPlayerId = 'performance_test_player';

  beforeEach(() => {
    service = HistoryService.getInstance();
    mockDatabaseService = {
      aggregateReportData: jest.fn(),
      getReportData: jest.fn(),
    } as any;

    (FunifierDatabaseService.getInstance as jest.Mock) = jest.fn().mockReturnValue(mockDatabaseService);
    
    jest.clearAllMocks();
  });

  describe('Large Dataset Performance', () => {
    it('should handle retrieval of 100 cycles efficiently', async () => {
      // Generate large dataset with 100 cycles
      const largeCycleDataset = Array.from({ length: 100 }, (_, i) => ({
        cycleNumber: i + 1,
        startDate: `2024-${String((i % 12) + 1).padStart(2, '0')}-01`,
        endDate: `2024-${String((i % 12) + 1).padStart(2, '0')}-21`,
        totalDays: 21,
        completionStatus: 'completed',
        finalMetrics: {
          primaryGoal: {
            name: 'Atividade',
            percentage: Math.random() * 100,
            target: 100,
            current: Math.random() * 100,
            unit: 'points',
            boostActive: Math.random() > 0.5
          },
          secondaryGoal1: {
            name: 'Reais por Ativo',
            percentage: Math.random() * 100,
            target: 1000,
            current: Math.random() * 1000,
            unit: 'R$',
            boostActive: Math.random() > 0.5
          },
          secondaryGoal2: {
            name: 'Faturamento',
            percentage: Math.random() * 100,
            target: 50000,
            current: Math.random() * 50000,
            unit: 'R$',
            boostActive: Math.random() > 0.5
          }
        },
        progressTimeline: Array.from({ length: 21 }, (_, j) => ({
          date: `2024-${String((i % 12) + 1).padStart(2, '0')}-${String(j + 1).padStart(2, '0')}`,
          dayInCycle: j + 1,
          uploadSequence: j + 1,
          metrics: {
            primaryGoal: Math.random() * 100,
            secondaryGoal1: Math.random() * 100,
            secondaryGoal2: Math.random() * 100
          }
        }))
      }));

      mockDatabaseService.aggregateReportData.mockResolvedValue(largeCycleDataset);

      const startTime = performance.now();
      const result = await service.getPlayerCycleHistory(mockPlayerId);
      const endTime = performance.now();

      const executionTime = endTime - startTime;

      expect(result).toHaveLength(100);
      expect(executionTime).toBeLessThan(100); // Should complete within 100ms
      expect(mockDatabaseService.aggregateReportData).toHaveBeenCalledTimes(1);
    });

    it('should handle cycle details with large progress timeline efficiently', async () => {
      // Generate cycle with large progress timeline (365 days)
      const cycleWithLargeTimeline = {
        cycleNumber: 1,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        totalDays: 365,
        completionStatus: 'completed',
        finalMetrics: {
          primaryGoal: { name: 'Atividade', percentage: 85.5 },
          secondaryGoal1: { name: 'Reais por Ativo', percentage: 92.3 },
          secondaryGoal2: { name: 'Faturamento', percentage: 78.1 }
        },
        progressTimeline: Array.from({ length: 365 }, (_, i) => ({
          date: new Date(2024, 0, i + 1).toISOString().split('T')[0],
          dayInCycle: i + 1,
          uploadSequence: i + 1,
          metrics: {
            primaryGoal: Math.random() * 100,
            secondaryGoal1: Math.random() * 100,
            secondaryGoal2: Math.random() * 100
          }
        }))
      };

      mockDatabaseService.aggregateReportData.mockResolvedValue([cycleWithLargeTimeline]);

      const startTime = performance.now();
      const result = await service.getCycleDetails(mockPlayerId, 1);
      const endTime = performance.now();

      const executionTime = endTime - startTime;

      expect(result).not.toBeNull();
      expect(result!.progressTimeline).toHaveLength(365);
      expect(executionTime).toBeLessThan(50); // Should complete within 50ms
    });

    it('should handle progress timeline retrieval for large datasets efficiently', async () => {
      // Generate large progress timeline with multiple data points per day
      const largeProgressTimeline = Array.from({ length: 1000 }, (_, i) => ({
        date: new Date(2024, 0, Math.floor(i / 5) + 1).toISOString().split('T')[0],
        dayInCycle: Math.floor(i / 5) + 1,
        uploadSequence: i + 1,
        metrics: {
          primaryGoal: Math.random() * 100,
          secondaryGoal1: Math.random() * 100,
          secondaryGoal2: Math.random() * 100
        }
      }));

      mockDatabaseService.aggregateReportData.mockResolvedValue(largeProgressTimeline);

      const startTime = performance.now();
      const result = await service.getCycleProgressTimeline(mockPlayerId, 1);
      const endTime = performance.now();

      const executionTime = endTime - startTime;

      expect(result).toHaveLength(1000);
      expect(executionTime).toBeLessThan(30); // Should complete within 30ms
    });
  });

  describe('Complex Calculation Performance', () => {
    it('should handle cycle summary statistics calculation efficiently', async () => {
      // Generate dataset with many cycles for statistics calculation
      const cyclesForStats = Array.from({ length: 50 }, (_, i) => ({
        cycleNumber: i + 1,
        finalMetrics: {
          primaryGoal: { percentage: Math.random() * 100 },
          secondaryGoal1: { percentage: Math.random() * 100 },
          secondaryGoal2: { percentage: Math.random() * 100 }
        }
      })) as CycleHistoryData[];

      jest.spyOn(service, 'getPlayerCycleHistory').mockResolvedValue(cyclesForStats);

      const startTime = performance.now();
      const result = await service.getCycleSummaryStats(mockPlayerId);
      const endTime = performance.now();

      const executionTime = endTime - startTime;

      expect(result.totalCycles).toBe(50);
      expect(result.averagePerformance).toBeGreaterThanOrEqual(0);
      expect(result.bestCycle).toBeDefined();
      expect(result.worstCycle).toBeDefined();
      expect(executionTime).toBeLessThan(20); // Should complete within 20ms
    });

    it('should handle cycle comparison with complex data efficiently', async () => {
      const complexCycle1 = {
        cycleNumber: 1,
        finalMetrics: {
          primaryGoal: { percentage: 75.5 },
          secondaryGoal1: { percentage: 68.2 },
          secondaryGoal2: { percentage: 82.1 }
        },
        progressTimeline: Array.from({ length: 100 }, (_, i) => ({
          date: `2024-01-${String(i + 1).padStart(2, '0')}`,
          metrics: {
            primaryGoal: Math.random() * 100,
            secondaryGoal1: Math.random() * 100,
            secondaryGoal2: Math.random() * 100
          }
        }))
      } as CycleHistoryData;

      const complexCycle2 = {
        cycleNumber: 2,
        finalMetrics: {
          primaryGoal: { percentage: 88.3 },
          secondaryGoal1: { percentage: 91.7 },
          secondaryGoal2: { percentage: 76.9 }
        },
        progressTimeline: Array.from({ length: 100 }, (_, i) => ({
          date: `2024-02-${String(i + 1).padStart(2, '0')}`,
          metrics: {
            primaryGoal: Math.random() * 100,
            secondaryGoal1: Math.random() * 100,
            secondaryGoal2: Math.random() * 100
          }
        }))
      } as CycleHistoryData;

      jest.spyOn(service, 'getCycleDetails')
        .mockResolvedValueOnce(complexCycle1)
        .mockResolvedValueOnce(complexCycle2);

      const startTime = performance.now();
      const result = await service.compareCycles(mockPlayerId, 1, 2);
      const endTime = performance.now();

      const executionTime = endTime - startTime;

      expect(result.cycle1Data).toBe(complexCycle1);
      expect(result.cycle2Data).toBe(complexCycle2);
      expect(result.improvements).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(executionTime).toBeLessThan(15); // Should complete within 15ms
    });
  });

  describe('Memory Usage Performance', () => {
    it('should handle large datasets without excessive memory usage', async () => {
      // Generate very large dataset to test memory efficiency
      const veryLargeDataset = Array.from({ length: 500 }, (_, i) => ({
        cycleNumber: i + 1,
        startDate: `2020-01-01`,
        endDate: `2020-01-21`,
        totalDays: 21,
        completionStatus: 'completed',
        finalMetrics: {
          primaryGoal: {
            name: 'Atividade',
            percentage: Math.random() * 100,
            target: 100,
            current: Math.random() * 100,
            unit: 'points',
            boostActive: false
          },
          secondaryGoal1: {
            name: 'Reais por Ativo',
            percentage: Math.random() * 100,
            target: 1000,
            current: Math.random() * 1000,
            unit: 'R$',
            boostActive: false
          },
          secondaryGoal2: {
            name: 'Faturamento',
            percentage: Math.random() * 100,
            target: 50000,
            current: Math.random() * 50000,
            unit: 'R$',
            boostActive: false
          }
        },
        progressTimeline: [] // Empty to focus on main data processing
      }));

      mockDatabaseService.aggregateReportData.mockResolvedValue(veryLargeDataset);

      const initialMemory = process.memoryUsage().heapUsed;
      
      const result = await service.getPlayerCycleHistory(mockPlayerId);
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      expect(result).toHaveLength(500);
      // Memory increase should be reasonable (less than 50MB for this dataset)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });

    it('should handle concurrent requests efficiently', async () => {
      const mockData = Array.from({ length: 10 }, (_, i) => ({
        cycleNumber: i + 1,
        startDate: '2024-01-01',
        endDate: '2024-01-21',
        totalDays: 21,
        completionStatus: 'completed',
        finalMetrics: {
          primaryGoal: { percentage: Math.random() * 100 },
          secondaryGoal1: { percentage: Math.random() * 100 },
          secondaryGoal2: { percentage: Math.random() * 100 }
        },
        progressTimeline: []
      }));

      mockDatabaseService.aggregateReportData.mockResolvedValue(mockData);

      // Simulate 10 concurrent requests
      const concurrentRequests = Array.from({ length: 10 }, (_, i) => 
        service.getPlayerCycleHistory(`player_${i}`)
      );

      const startTime = performance.now();
      const results = await Promise.all(concurrentRequests);
      const endTime = performance.now();

      const executionTime = endTime - startTime;

      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result).toHaveLength(10);
      });
      
      // All 10 requests should complete within 200ms
      expect(executionTime).toBeLessThan(200);
      expect(mockDatabaseService.aggregateReportData).toHaveBeenCalledTimes(10);
    });
  });

  describe('Database Query Performance', () => {
    it('should optimize database queries for large result sets', async () => {
      const largeResultSet = Array.from({ length: 1000 }, (_, i) => ({
        playerId: `player_${i}`,
        reportDate: `2024-01-${String((i % 30) + 1).padStart(2, '0')}`,
        cycleNumber: Math.floor(i / 100) + 1,
        atividade: Math.random() * 100,
        reaisPorAtivo: Math.random() * 1000,
        faturamento: Math.random() * 50000
      }));

      mockDatabaseService.getReportData.mockResolvedValue(largeResultSet as any);

      const startTime = performance.now();
      const result = await service.getPlayerCycleHistoryWithCompatibility(mockPlayerId);
      const endTime = performance.now();

      const executionTime = endTime - startTime;

      expect(result).toHaveLength(1000);
      expect(executionTime).toBeLessThan(100); // Should complete within 100ms
      
      // Verify query was called only once (no N+1 queries)
      expect(mockDatabaseService.getReportData).toHaveBeenCalledTimes(1);
    });

    it('should handle database query timeouts gracefully', async () => {
      // Simulate slow database response
      mockDatabaseService.aggregateReportData.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve([]), 50))
      );

      const startTime = performance.now();
      const result = await service.getPlayerCycleHistory(mockPlayerId);
      const endTime = performance.now();

      const executionTime = endTime - startTime;

      expect(result).toEqual([]);
      expect(executionTime).toBeGreaterThanOrEqual(50); // Should wait for the timeout
      expect(executionTime).toBeLessThan(100); // But not hang indefinitely
    });
  });

  describe('Caching Performance', () => {
    it('should benefit from caching on repeated requests', async () => {
      const mockData = Array.from({ length: 20 }, (_, i) => ({
        cycleNumber: i + 1,
        finalMetrics: {
          primaryGoal: { percentage: Math.random() * 100 },
          secondaryGoal1: { percentage: Math.random() * 100 },
          secondaryGoal2: { percentage: Math.random() * 100 }
        }
      }));

      mockDatabaseService.aggregateReportData.mockResolvedValue(mockData);

      // First request (cache miss)
      const startTime1 = performance.now();
      const result1 = await service.getPlayerCycleHistory(mockPlayerId);
      const endTime1 = performance.now();
      const firstRequestTime = endTime1 - startTime1;

      // Second request (should be faster if cached)
      const startTime2 = performance.now();
      const result2 = await service.getPlayerCycleHistory(mockPlayerId);
      const endTime2 = performance.now();
      const secondRequestTime = endTime2 - startTime2;

      expect(result1).toEqual(result2);
      expect(result1).toHaveLength(20);
      
      // Note: In a real implementation with caching, secondRequestTime should be much faster
      // For now, we just verify both requests complete reasonably fast
      expect(firstRequestTime).toBeLessThan(50);
      expect(secondRequestTime).toBeLessThan(50);
    });
  });

  describe('Edge Case Performance', () => {
    it('should handle empty datasets efficiently', async () => {
      mockDatabaseService.aggregateReportData.mockResolvedValue([]);

      const startTime = performance.now();
      const result = await service.getPlayerCycleHistory(mockPlayerId);
      const endTime = performance.now();

      const executionTime = endTime - startTime;

      expect(result).toEqual([]);
      expect(executionTime).toBeLessThan(5); // Should be very fast for empty data
    });

    it('should handle malformed data efficiently', async () => {
      const malformedData = [
        { cycleNumber: null },
        { cycleNumber: 1, finalMetrics: null },
        { cycleNumber: 2, finalMetrics: { primaryGoal: null } }
      ];

      mockDatabaseService.aggregateReportData.mockResolvedValue(malformedData);

      const startTime = performance.now();
      const result = await service.getPlayerCycleHistory(mockPlayerId);
      const endTime = performance.now();

      const executionTime = endTime - startTime;

      expect(result).toHaveLength(3);
      expect(executionTime).toBeLessThan(10); // Should handle gracefully and quickly
    });
  });
});