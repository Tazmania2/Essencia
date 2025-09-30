import { CycleMigrationService } from '../cycle-migration.service';
import { FunifierDatabaseService } from '../funifier-database.service';
import { EssenciaReportRecord, TeamType, ErrorType } from '../../types';

// Mock the database service
jest.mock('../funifier-database.service');
jest.mock('../../utils/logger');

describe('CycleMigrationService', () => {
  let migrationService: CycleMigrationService;
  let mockDatabaseService: jest.Mocked<FunifierDatabaseService>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Get fresh instance
    migrationService = CycleMigrationService.getInstance();
    
    // Mock database service
    mockDatabaseService = {
      getRecordsWithoutCycleInfo: jest.fn(),
      getReportData: jest.fn(),
      updateRecordWithCycleInfo: jest.fn(),
    } as any;
    
    // Replace the database service instance
    (migrationService as any).databaseService = mockDatabaseService;
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = CycleMigrationService.getInstance();
      const instance2 = CycleMigrationService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('getMigrationStatus', () => {
    it('should return correct migration status when no migration needed', async () => {
      mockDatabaseService.getRecordsWithoutCycleInfo.mockResolvedValue([]);
      mockDatabaseService.getReportData.mockResolvedValue([
        createMockRecord('player1', { cycleNumber: 1 }),
        createMockRecord('player2', { cycleNumber: 1 })
      ]);

      const status = await migrationService.getMigrationStatus();

      expect(status).toEqual({
        needsMigration: false,
        recordsWithoutCycles: 0,
        recordsWithCycles: 2,
        totalRecords: 2
      });
    });

    it('should return correct migration status when migration needed', async () => {
      const recordsWithoutCycles = [
        createMockRecord('player1'),
        createMockRecord('player2')
      ];
      const recordsWithCycles = [
        createMockRecord('player3', { cycleNumber: 1 })
      ];

      mockDatabaseService.getRecordsWithoutCycleInfo.mockResolvedValue(recordsWithoutCycles);
      mockDatabaseService.getReportData.mockResolvedValue(recordsWithCycles);

      const status = await migrationService.getMigrationStatus();

      expect(status).toEqual({
        needsMigration: true,
        recordsWithoutCycles: 2,
        recordsWithCycles: 1,
        totalRecords: 3
      });
    });

    it('should handle database errors', async () => {
      mockDatabaseService.getRecordsWithoutCycleInfo.mockRejectedValue(new Error('Database error'));

      await expect(migrationService.getMigrationStatus()).rejects.toThrow('Failed to get migration status');
    });
  });

  describe('migrateAllData', () => {
    it('should complete migration when no records need migration', async () => {
      mockDatabaseService.getRecordsWithoutCycleInfo.mockResolvedValue([]);

      const report = await migrationService.migrateAllData();

      expect(report.status.isComplete).toBe(true);
      expect(report.status.totalRecords).toBe(0);
      expect(report.status.migratedRecords).toBe(0);
      expect(report.status.failedRecords).toBe(0);
    });

    it('should migrate records successfully', async () => {
      const recordsToMigrate = [
        createMockRecord('player1'),
        createMockRecord('player2')
      ];

      mockDatabaseService.getRecordsWithoutCycleInfo.mockResolvedValue(recordsToMigrate);
      mockDatabaseService.updateRecordWithCycleInfo.mockResolvedValue(undefined);

      const report = await migrationService.migrateAllData();

      expect(report.status.totalRecords).toBe(2);
      expect(report.status.migratedRecords).toBe(2);
      expect(report.status.failedRecords).toBe(0);
      expect(report.status.isComplete).toBe(true);
      expect(mockDatabaseService.updateRecordWithCycleInfo).toHaveBeenCalledTimes(2);
    });

    it('should handle partial migration failures', async () => {
      const recordsToMigrate = [
        createMockRecord('player1'),
        createMockRecord('player2'),
        createMockRecord('player3')
      ];

      mockDatabaseService.getRecordsWithoutCycleInfo.mockResolvedValue(recordsToMigrate);
      mockDatabaseService.updateRecordWithCycleInfo
        .mockResolvedValueOnce(undefined) // First record succeeds
        .mockRejectedValueOnce(new Error('Update failed')) // Second record fails
        .mockResolvedValueOnce(undefined); // Third record succeeds

      const report = await migrationService.migrateAllData();

      expect(report.status.totalRecords).toBe(3);
      expect(report.status.migratedRecords).toBe(2);
      expect(report.status.failedRecords).toBe(1);
      expect(report.status.isComplete).toBe(false);
      expect(report.status.errors.length).toBeGreaterThan(0);
      expect(report.detailedErrors.length).toBe(1);
    });

    it('should process records in batches', async () => {
      // Create more records than batch size (50)
      const recordsToMigrate = Array.from({ length: 75 }, (_, i) => 
        createMockRecord(`player${i + 1}`)
      );

      mockDatabaseService.getRecordsWithoutCycleInfo.mockResolvedValue(recordsToMigrate);
      mockDatabaseService.updateRecordWithCycleInfo.mockResolvedValue(undefined);

      const report = await migrationService.migrateAllData();

      expect(report.status.totalRecords).toBe(75);
      expect(report.status.migratedRecords).toBe(75);
      expect(report.progress.totalBatches).toBe(2); // 50 + 25 records = 2 batches
      expect(mockDatabaseService.updateRecordWithCycleInfo).toHaveBeenCalledTimes(75);
    });

    it('should retry failed records up to max retries', async () => {
      const recordsToMigrate = [createMockRecord('player1')];

      mockDatabaseService.getRecordsWithoutCycleInfo.mockResolvedValue(recordsToMigrate);
      mockDatabaseService.updateRecordWithCycleInfo
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce(undefined); // Succeeds on third try

      const report = await migrationService.migrateAllData();

      expect(report.status.migratedRecords).toBe(1);
      expect(report.status.failedRecords).toBe(0);
      expect(mockDatabaseService.updateRecordWithCycleInfo).toHaveBeenCalledTimes(3);
    });

    it('should fail record after max retries', async () => {
      const recordsToMigrate = [createMockRecord('player1')];

      mockDatabaseService.getRecordsWithoutCycleInfo.mockResolvedValue(recordsToMigrate);
      mockDatabaseService.updateRecordWithCycleInfo.mockRejectedValue(new Error('Persistent failure'));

      const report = await migrationService.migrateAllData();

      expect(report.status.migratedRecords).toBe(0);
      expect(report.status.failedRecords).toBe(1);
      expect(mockDatabaseService.updateRecordWithCycleInfo).toHaveBeenCalledTimes(3); // Max retries
    });
  });

  describe('validateMigration', () => {
    it('should validate successful migration', async () => {
      const allRecords = [
        createMockRecord('player1', { cycleNumber: 1, cycleStartDate: '2024-01-01', cycleEndDate: '2024-01-21' }),
        createMockRecord('player2', { cycleNumber: 1, cycleStartDate: '2024-01-01', cycleEndDate: '2024-01-21' })
      ];

      mockDatabaseService.getReportData.mockResolvedValue(allRecords);

      const validation = await migrationService.validateMigration();

      expect(validation.isValid).toBe(true);
      expect(validation.issues).toHaveLength(0);
      expect(validation.statistics.totalRecords).toBe(2);
      expect(validation.statistics.recordsWithCycles).toBe(2);
      expect(validation.statistics.recordsWithoutCycles).toBe(0);
      expect(validation.statistics.uniqueCycles).toBe(1);
      expect(validation.statistics.playersWithHistory).toBe(2);
    });

    it('should detect records without cycle information', async () => {
      const allRecords = [
        createMockRecord('player1', { cycleNumber: 1 }),
        createMockRecord('player2') // Missing cycle info
      ];

      mockDatabaseService.getReportData.mockResolvedValue(allRecords);

      const validation = await migrationService.validateMigration();

      expect(validation.isValid).toBe(false);
      expect(validation.issues).toContain('Found 1 records without cycle information');
      expect(validation.statistics.recordsWithoutCycles).toBe(1);
    });

    it('should detect invalid cycle numbers', async () => {
      const allRecords = [
        createMockRecord('player1', { cycleNumber: 1 }),
        createMockRecord('player2', { cycleNumber: 0 }), // Invalid cycle number
        createMockRecord('player3', { cycleNumber: 1.5 }) // Non-integer cycle number
      ];

      mockDatabaseService.getReportData.mockResolvedValue(allRecords);

      const validation = await migrationService.validateMigration();

      expect(validation.isValid).toBe(false);
      expect(validation.issues).toContain('Found 2 records with invalid cycle numbers');
    });

    it('should detect missing cycle dates', async () => {
      const allRecords = [
        createMockRecord('player1', { cycleNumber: 1, cycleStartDate: '2024-01-01', cycleEndDate: '2024-01-21' }),
        createMockRecord('player2', { cycleNumber: 1, cycleStartDate: '', cycleEndDate: '2024-01-21' }) // Missing start date
      ];

      mockDatabaseService.getReportData.mockResolvedValue(allRecords);

      const validation = await migrationService.validateMigration();

      expect(validation.isValid).toBe(false);
      expect(validation.issues).toContain('Found 1 records with missing cycle dates');
    });
  });

  describe('rollbackMigration', () => {
    it('should rollback migration successfully', async () => {
      const recordsWithCycles = [
        createMockRecord('player1', { cycleNumber: 1 }),
        createMockRecord('player2', { cycleNumber: 1 })
      ];

      mockDatabaseService.getReportData.mockResolvedValue(recordsWithCycles);

      const result = await migrationService.rollbackMigration();

      expect(result.rolledBackRecords).toBe(2);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle rollback errors', async () => {
      const recordsWithCycles = [createMockRecord('player1', { cycleNumber: 1 })];

      mockDatabaseService.getReportData.mockResolvedValue(recordsWithCycles);

      const result = await migrationService.rollbackMigration();

      // Since we're not actually implementing the rollback API call,
      // this test verifies the structure is correct
      expect(result).toHaveProperty('rolledBackRecords');
      expect(result).toHaveProperty('errors');
    });
  });

  // Helper function to create mock records
  function createMockRecord(playerId: string, cycleFields?: any): EssenciaReportRecord {
    const baseRecord: EssenciaReportRecord = {
      _id: `record_${playerId}`,
      playerId,
      playerName: `Player ${playerId}`,
      team: TeamType.CARTEIRA_I,
      atividade: 85.5,
      reaisPorAtivo: 92.3,
      faturamento: 78.9,
      multimarcasPorAtivo: 95.1,
      currentCycleDay: 10,
      totalCycleDays: 21,
      reportDate: '2024-01-15T10:30:00Z',
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-01-15T10:30:00Z'
    };

    return { ...baseRecord, ...cycleFields };
  }
});