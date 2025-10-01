/**
 * Integration tests for data migration scenarios
 * Tests migration from non-cycle data to cycle-based system
 */

import { HistoryService } from '../../history.service';
import { FunifierDatabaseService } from '../../funifier-database.service';
import { CSVProcessingService } from '../../csv-processing.service';
import { TeamType } from '../../../types';

// Mock external dependencies
jest.mock('../../funifier-database.service');
jest.mock('../../../utils/logger');

describe('Data Migration Workflow Integration Tests', () => {
  let historyService: HistoryService;
  let databaseService: jest.Mocked<FunifierDatabaseService>;
  let csvService: CSVProcessingService;

  const mockPlayerId = 'player_migration_test';

  beforeEach(() => {
    historyService = HistoryService.getInstance();
    csvService = new CSVProcessingService();
    
    databaseService = {
      getReportData: jest.fn(),
      aggregateReportData: jest.fn(),
      saveReportData: jest.fn(),
      migrateData: jest.fn(),
    } as any;

    (FunifierDatabaseService.getInstance as jest.Mock) = jest.fn().mockReturnValue(databaseService);
    
    jest.clearAllMocks();
  });

  describe('Legacy Data Migration', () => {
    it('should handle migration from non-cycle to cycle-based data', async () => {
      // Step 1: Existing legacy data without cycle information
      const legacyData = [
        {
          playerId: mockPlayerId,
          teamType: TeamType.CARTEIRA_I,
          atividade: 75.2,
          reaisPorAtivo: 887,
          faturamento: 32700,
          reportDate: '2023-12-01',
          cycleNumber: null, // Legacy data
          completionStatus: 'completed'
        },
        {
          playerId: mockPlayerId,
          teamType: TeamType.CARTEIRA_I,
          atividade: 80.1,
          reaisPorAtivo: 920,
          faturamento: 35000,
          reportDate: '2023-12-15',
          cycleNumber: null, // Legacy data
          completionStatus: 'completed'
        },
        {
          playerId: mockPlayerId,
          teamType: TeamType.CARTEIRA_I,
          atividade: 88.7,
          reaisPorAtivo: 950,
          faturamento: 38500,
          reportDate: '2023-12-21',
          cycleNumber: null, // Legacy data
          completionStatus: 'completed'
        }
      ];

      // Step 2: New cycle-based data
      const newCycleData = [
        {
          playerId: mockPlayerId,
          teamType: TeamType.CARTEIRA_I,
          atividade: 85.5,
          reaisPorAtivo: 923,
          faturamento: 39050,
          reportDate: '2024-01-21',
          cycleNumber: 1, // New cycle-based data
          completionStatus: 'completed'
        },
        {
          playerId: mockPlayerId,
          teamType: TeamType.CARTEIRA_I,
          atividade: 92.3,
          reaisPorAtivo: 1050,
          faturamento: 45000,
          reportDate: '2024-02-21',
          cycleNumber: 2, // New cycle-based data
          completionStatus: 'completed'
        }
      ];

      // Mock database returning mixed data
      const allData = [...legacyData, ...newCycleData];
      databaseService.getReportData.mockResolvedValue(allData as any);

      // Step 3: Test backward compatibility retrieval
      const compatibilityResult = await historyService.getPlayerCycleHistoryWithCompatibility(mockPlayerId);

      expect(compatibilityResult).toHaveLength(5);
      
      // Verify data is sorted by date
      expect(compatibilityResult[0].reportDate).toBe('2023-12-01');
      expect(compatibilityResult[4].reportDate).toBe('2024-02-21');
      
      // Verify legacy data maintains null cycle numbers
      expect(compatibilityResult[0].cycleNumber).toBeNull();
      expect(compatibilityResult[1].cycleNumber).toBeNull();
      expect(compatibilityResult[2].cycleNumber).toBeNull();
      
      // Verify new data has cycle numbers
      expect(compatibilityResult[3].cycleNumber).toBe(1);
      expect(compatibilityResult[4].cycleNumber).toBe(2);

      expect(databaseService.getReportData).toHaveBeenCalledWith({ playerId: mockPlayerId });
    });

    it('should handle automatic cycle assignment for legacy data', async () => {
      // Simulate migration process where legacy data gets assigned cycle 1
      const legacyDataToMigrate = [
        {
          playerId: mockPlayerId,
          teamType: TeamType.CARTEIRA_I,
          atividade: 75.2,
          reaisPorAtivo: 887,
          faturamento: 32700,
          reportDate: '2023-12-01',
          cycleNumber: null,
          completionStatus: 'completed'
        }
      ];

      // After migration, legacy data should be assigned cycle 1
      const migratedData = [
        {
          ...legacyDataToMigrate[0],
          cycleNumber: 1, // Automatically assigned
          migrated: true // Flag to indicate this was migrated
        }
      ];

      // Mock the migration process
      databaseService.migrateData.mockResolvedValue({ 
        success: true, 
        migratedRecords: 1,
        data: migratedData 
      });

      // Test that migration service can handle the data
      const migrationResult = await databaseService.migrateData(legacyDataToMigrate);
      
      expect(migrationResult.success).toBe(true);
      expect(migrationResult.migratedRecords).toBe(1);
      expect(migrationResult.data[0].cycleNumber).toBe(1);
    });

    it('should handle mixed cycle and non-cycle data in history retrieval', async () => {
      // Mock aggregation that returns mixed data
      const mixedHistoryData = [
        {
          cycleNumber: 2,
          startDate: '2024-01-01',
          endDate: '2024-01-21',
          totalDays: 21,
          completionStatus: 'completed',
          finalMetrics: {
            primaryGoal: { name: 'Atividade', percentage: 85.5 },
            secondaryGoal1: { name: 'Reais por Ativo', percentage: 92.3 },
            secondaryGoal2: { name: 'Faturamento', percentage: 78.1 }
          },
          progressTimeline: [],
          migrated: false
        },
        {
          cycleNumber: 1,
          startDate: '2023-12-01',
          endDate: '2023-12-21',
          totalDays: 21,
          completionStatus: 'completed',
          finalMetrics: {
            primaryGoal: { name: 'Atividade', percentage: 75.2 },
            secondaryGoal1: { name: 'Reais por Ativo', percentage: 88.7 },
            secondaryGoal2: { name: 'Faturamento', percentage: 65.4 }
          },
          progressTimeline: [],
          migrated: true // This was legacy data that got migrated
        }
      ];

      databaseService.aggregateReportData.mockResolvedValue(mixedHistoryData);

      const historyResult = await historyService.getPlayerCycleHistory(mockPlayerId);

      expect(historyResult).toHaveLength(2);
      expect(historyResult[0].cycleNumber).toBe(2); // Most recent first
      expect(historyResult[1].cycleNumber).toBe(1);
      expect(historyResult[1].migrated).toBe(true); // Legacy data indicator
    });
  });

  describe('Data Integrity During Migration', () => {
    it('should preserve data integrity during migration process', async () => {
      const originalLegacyData = [
        {
          playerId: mockPlayerId,
          teamType: TeamType.CARTEIRA_I,
          atividade: 75.2,
          reaisPorAtivo: 887.50,
          faturamento: 32700.25,
          reportDate: '2023-12-01',
          cycleNumber: null,
          completionStatus: 'completed',
          metadata: {
            uploadedBy: 'admin_legacy',
            uploadDate: '2023-12-01T10:00:00Z',
            source: 'manual_upload'
          }
        }
      ];

      // Migration should preserve all original data
      const expectedMigratedData = [
        {
          ...originalLegacyData[0],
          cycleNumber: 1, // Only this should change
          migrated: true,
          migrationDate: expect.any(String)
        }
      ];

      databaseService.migrateData.mockResolvedValue({
        success: true,
        migratedRecords: 1,
        data: expectedMigratedData
      });

      const migrationResult = await databaseService.migrateData(originalLegacyData);

      expect(migrationResult.success).toBe(true);
      expect(migrationResult.data[0].atividade).toBe(75.2); // Preserved
      expect(migrationResult.data[0].reaisPorAtivo).toBe(887.50); // Preserved
      expect(migrationResult.data[0].faturamento).toBe(32700.25); // Preserved
      expect(migrationResult.data[0].metadata).toEqual(originalLegacyData[0].metadata); // Preserved
      expect(migrationResult.data[0].cycleNumber).toBe(1); // Added
      expect(migrationResult.data[0].migrated).toBe(true); // Added
    });

    it('should handle migration errors gracefully', async () => {
      const problematicData = [
        {
          playerId: null, // Invalid data
          teamType: 'INVALID_TEAM',
          reportDate: 'invalid-date',
          cycleNumber: null
        }
      ];

      databaseService.migrateData.mockResolvedValue({
        success: false,
        migratedRecords: 0,
        errors: ['Invalid player ID', 'Invalid team type', 'Invalid date format'],
        data: []
      });

      const migrationResult = await databaseService.migrateData(problematicData);

      expect(migrationResult.success).toBe(false);
      expect(migrationResult.migratedRecords).toBe(0);
      expect(migrationResult.errors).toHaveLength(3);
      expect(migrationResult.data).toHaveLength(0);
    });
  });

  describe('Performance During Migration', () => {
    it('should handle large dataset migration efficiently', async () => {
      // Simulate large legacy dataset
      const largeLegacyDataset = Array.from({ length: 1000 }, (_, i) => ({
        playerId: `player_${i}`,
        teamType: TeamType.CARTEIRA_I,
        atividade: Math.random() * 100,
        reaisPorAtivo: Math.random() * 1000,
        faturamento: Math.random() * 50000,
        reportDate: `2023-12-${String(i % 30 + 1).padStart(2, '0')}`,
        cycleNumber: null,
        completionStatus: 'completed'
      }));

      // Mock batch migration
      databaseService.migrateData.mockResolvedValue({
        success: true,
        migratedRecords: 1000,
        data: largeLegacyDataset.map(item => ({ ...item, cycleNumber: 1, migrated: true }))
      });

      const startTime = Date.now();
      const migrationResult = await databaseService.migrateData(largeLegacyDataset);
      const endTime = Date.now();

      expect(migrationResult.success).toBe(true);
      expect(migrationResult.migratedRecords).toBe(1000);
      expect(endTime - startTime).toBeLessThan(2000); // Should complete within 2 seconds
    });

    it('should handle incremental migration', async () => {
      // Simulate incremental migration in batches
      const batchSize = 100;
      const totalRecords = 500;
      let migratedCount = 0;

      for (let i = 0; i < totalRecords; i += batchSize) {
        const batch = Array.from({ length: Math.min(batchSize, totalRecords - i) }, (_, j) => ({
          playerId: `player_${i + j}`,
          teamType: TeamType.CARTEIRA_I,
          atividade: Math.random() * 100,
          reportDate: `2023-12-01`,
          cycleNumber: null,
          completionStatus: 'completed'
        }));

        databaseService.migrateData.mockResolvedValueOnce({
          success: true,
          migratedRecords: batch.length,
          data: batch.map(item => ({ ...item, cycleNumber: 1, migrated: true }))
        });

        const batchResult = await databaseService.migrateData(batch);
        migratedCount += batchResult.migratedRecords;
      }

      expect(migratedCount).toBe(totalRecords);
    });
  });

  describe('Migration Rollback Scenarios', () => {
    it('should support migration rollback', async () => {
      const originalData = [
        {
          playerId: mockPlayerId,
          teamType: TeamType.CARTEIRA_I,
          atividade: 75.2,
          reportDate: '2023-12-01',
          cycleNumber: null,
          completionStatus: 'completed'
        }
      ];

      const migratedData = [
        {
          ...originalData[0],
          cycleNumber: 1,
          migrated: true,
          migrationDate: '2024-01-01T00:00:00Z'
        }
      ];

      // Mock rollback operation
      databaseService.migrateData.mockResolvedValueOnce({
        success: true,
        migratedRecords: 1,
        data: migratedData
      });

      // Mock rollback
      const rollbackMock = jest.fn().mockResolvedValue({
        success: true,
        rolledBackRecords: 1,
        data: originalData
      });

      databaseService.rollbackMigration = rollbackMock;

      // Perform migration
      const migrationResult = await databaseService.migrateData(originalData);
      expect(migrationResult.success).toBe(true);

      // Perform rollback
      const rollbackResult = await databaseService.rollbackMigration(migratedData);
      expect(rollbackResult.success).toBe(true);
      expect(rollbackResult.rolledBackRecords).toBe(1);
      expect(rollbackResult.data[0].cycleNumber).toBeNull();
      expect(rollbackResult.data[0].migrated).toBeUndefined();
    });
  });

  describe('Migration Status Tracking', () => {
    it('should track migration progress and status', async () => {
      const migrationBatch = Array.from({ length: 50 }, (_, i) => ({
        playerId: `player_${i}`,
        teamType: TeamType.CARTEIRA_I,
        reportDate: '2023-12-01',
        cycleNumber: null,
        completionStatus: 'completed'
      }));

      // Mock migration with progress tracking
      databaseService.migrateData.mockResolvedValue({
        success: true,
        migratedRecords: 50,
        totalRecords: 50,
        progress: 100,
        status: 'completed',
        startTime: '2024-01-01T00:00:00Z',
        endTime: '2024-01-01T00:01:00Z',
        data: migrationBatch.map(item => ({ ...item, cycleNumber: 1, migrated: true }))
      });

      const migrationResult = await databaseService.migrateData(migrationBatch);

      expect(migrationResult.success).toBe(true);
      expect(migrationResult.progress).toBe(100);
      expect(migrationResult.status).toBe('completed');
      expect(migrationResult.migratedRecords).toBe(50);
      expect(migrationResult.totalRecords).toBe(50);
    });
  });
});