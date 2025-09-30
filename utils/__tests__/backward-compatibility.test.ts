import { BackwardCompatibilityService } from '../backward-compatibility';
import { EssenciaReportRecord, CycleAwareReportRecord, TeamType } from '../../types';

describe('BackwardCompatibilityService', () => {
  let service: BackwardCompatibilityService;

  beforeEach(() => {
    service = BackwardCompatibilityService.getInstance();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = BackwardCompatibilityService.getInstance();
      const instance2 = BackwardCompatibilityService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('hasCycleInfo', () => {
    it('should return true for cycle-aware records', () => {
      const record = createCycleAwareRecord('player1', 1);
      expect(service.hasCycleInfo(record)).toBe(true);
    });

    it('should return false for legacy records', () => {
      const record = createLegacyRecord('player1');
      expect(service.hasCycleInfo(record)).toBe(false);
    });

    it('should return false for records with invalid cycle numbers', () => {
      const record = createLegacyRecord('player1');
      (record as any).cycleNumber = 0; // Invalid cycle number
      expect(service.hasCycleInfo(record)).toBe(false);
    });

    it('should return false for records with null cycle numbers', () => {
      const record = createLegacyRecord('player1');
      (record as any).cycleNumber = null;
      expect(service.hasCycleInfo(record)).toBe(false);
    });
  });

  describe('createCompatibilityIndicator', () => {
    it('should create complete indicator for full cycle-aware record', () => {
      const record = createCycleAwareRecord('player1', 1);
      const indicator = service.createCompatibilityIndicator(record);

      expect(indicator).toEqual({
        hasCycleInfo: true,
        cycleNumber: 1,
        isLegacyData: false,
        migrationStatus: 'migrated',
        dataQuality: 'complete'
      });
    });

    it('should create partial indicator for incomplete cycle-aware record', () => {
      const record = createCycleAwareRecord('player1', 1);
      delete (record as any).cycleStartDate; // Remove required field
      
      const indicator = service.createCompatibilityIndicator(record);

      expect(indicator).toEqual({
        hasCycleInfo: true,
        cycleNumber: 1,
        isLegacyData: false,
        migrationStatus: 'migrated',
        dataQuality: 'partial'
      });
    });

    it('should create legacy indicator for non-cycle record', () => {
      const record = createLegacyRecord('player1');
      const indicator = service.createCompatibilityIndicator(record);

      expect(indicator).toEqual({
        hasCycleInfo: false,
        cycleNumber: undefined,
        isLegacyData: true,
        migrationStatus: 'pending',
        dataQuality: 'partial'
      });
    });

    it('should create minimal indicator for record with no basic data', () => {
      const record = createLegacyRecord('player1');
      delete record.reportDate;
      delete record.createdAt;
      delete record.atividade;
      delete record.reaisPorAtivo;
      delete record.faturamento;
      
      const indicator = service.createCompatibilityIndicator(record);

      expect(indicator.dataQuality).toBe('minimal');
    });
  });

  describe('extractCycleHistoryFromMixedData', () => {
    it('should handle empty records array', () => {
      const result = service.extractCycleHistoryFromMixedData([]);
      
      expect(result.data).toEqual([]);
      expect(result.warnings).toEqual([]);
    });

    it('should process only cycle-aware records', () => {
      const records = [
        createCycleAwareRecord('player1', 1),
        createCycleAwareRecord('player1', 2)
      ];
      
      const result = service.extractCycleHistoryFromMixedData(records);
      
      expect(result.data).toHaveLength(2);
      expect(result.data[0].cycleNumber).toBe(2); // Most recent first
      expect(result.data[1].cycleNumber).toBe(1);
      expect(result.warnings).toEqual([]);
      expect(result.compatibility.hasCycleInfo).toBe(true);
      expect(result.compatibility.isLegacyData).toBe(false);
    });

    it('should process only legacy records', () => {
      const records = [
        createLegacyRecord('player1'),
        createLegacyRecord('player1')
      ];
      
      const result = service.extractCycleHistoryFromMixedData(records);
      
      expect(result.data).toHaveLength(1); // Grouped as cycle 1
      expect(result.data[0].cycleNumber).toBe(1);
      expect(result.warnings).toContain('Found 2 records without cycle information');
      expect(result.warnings).toContain('Legacy records have been grouped as Cycle 1');
      expect(result.compatibility.isLegacyData).toBe(true);
    });

    it('should process mixed cycle-aware and legacy records', () => {
      const records = [
        createCycleAwareRecord('player1', 2),
        createLegacyRecord('player1'),
        createCycleAwareRecord('player1', 3)
      ];
      
      const result = service.extractCycleHistoryFromMixedData(records);
      
      expect(result.data).toHaveLength(3); // Cycles 1, 2, 3
      expect(result.data[0].cycleNumber).toBe(3); // Most recent first
      expect(result.data[1].cycleNumber).toBe(2);
      expect(result.data[2].cycleNumber).toBe(1); // Legacy grouped as cycle 1
      expect(result.warnings).toContain('Found 1 records without cycle information');
      expect(result.compatibility.isLegacyData).toBe(true);
    });

    it('should handle multiple records in same cycle', () => {
      const records = [
        createCycleAwareRecord('player1', 1, 1),
        createCycleAwareRecord('player1', 1, 2),
        createCycleAwareRecord('player1', 1, 3)
      ];
      
      const result = service.extractCycleHistoryFromMixedData(records);
      
      expect(result.data).toHaveLength(1);
      expect(result.data[0].cycleNumber).toBe(1);
      expect(result.data[0].progressTimeline).toHaveLength(3);
    });

    it('should handle processing errors gracefully', () => {
      const records = [
        createCycleAwareRecord('player1', 1)
      ];
      
      // Remove required fields to cause processing error
      delete records[0].createdAt;
      delete records[0].reportDate;
      
      const result = service.extractCycleHistoryFromMixedData(records);
      
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.includes('Failed to process cycle 1'))).toBe(true);
    });
  });

  describe('shouldRecommendMigration', () => {
    it('should not recommend migration for all cycle-aware records', () => {
      const records = [
        createCycleAwareRecord('player1', 1),
        createCycleAwareRecord('player2', 1)
      ];
      
      const recommendation = service.shouldRecommendMigration(records);
      
      expect(recommendation.recommend).toBe(false);
      expect(recommendation.reason).toBe('All data already has cycle information');
      expect(recommendation.urgency).toBe('low');
      expect(recommendation.affectedFeatures).toEqual([]);
    });

    it('should recommend high urgency migration for mostly legacy data', () => {
      const records = [
        createLegacyRecord('player1'),
        createLegacyRecord('player2'),
        createLegacyRecord('player3'),
        createCycleAwareRecord('player4', 1) // Only 25% cycle-aware
      ];
      
      const recommendation = service.shouldRecommendMigration(records);
      
      expect(recommendation.recommend).toBe(true);
      expect(recommendation.urgency).toBe('high');
      expect(recommendation.reason).toContain('75% of data lacks cycle information');
      expect(recommendation.affectedFeatures.length).toBeGreaterThan(0);
    });

    it('should recommend medium urgency migration for mixed data', () => {
      const records = [
        createLegacyRecord('player1'),
        createLegacyRecord('player2'),
        createCycleAwareRecord('player3', 1),
        createCycleAwareRecord('player4', 1) // 50% legacy
      ];
      
      const recommendation = service.shouldRecommendMigration(records);
      
      expect(recommendation.recommend).toBe(true);
      expect(recommendation.urgency).toBe('medium');
      expect(recommendation.reason).toContain('50% of data lacks cycle information');
    });

    it('should recommend low urgency migration for few legacy records', () => {
      const records = [
        createLegacyRecord('player1'), // Only 20% legacy
        createCycleAwareRecord('player2', 1),
        createCycleAwareRecord('player3', 1),
        createCycleAwareRecord('player4', 1),
        createCycleAwareRecord('player5', 1)
      ];
      
      const recommendation = service.shouldRecommendMigration(records);
      
      expect(recommendation.recommend).toBe(true);
      expect(recommendation.urgency).toBe('low');
      expect(recommendation.reason).toContain('1 records lack cycle information');
    });

    it('should handle empty records array', () => {
      const recommendation = service.shouldRecommendMigration([]);
      
      expect(recommendation.recommend).toBe(false);
      expect(recommendation.urgency).toBe('low');
    });
  });

  describe('generateCompatibilityMessages', () => {
    it('should generate appropriate messages for history context with legacy data', () => {
      const compatibility = {
        hasCycleInfo: false,
        isLegacyData: true,
        migrationStatus: 'pending' as const,
        dataQuality: 'partial' as const
      };
      
      const messages = service.generateCompatibilityMessages(compatibility, 'history');
      
      expect(messages.infoMessages).toContain('Some of your data is from before cycle tracking was implemented.');
      expect(messages.actionMessages).toContain('Contact your administrator to migrate historical data for full cycle history.');
    });

    it('should generate appropriate messages for dashboard context', () => {
      const compatibility = {
        hasCycleInfo: false,
        isLegacyData: true,
        migrationStatus: 'pending' as const,
        dataQuality: 'minimal' as const
      };
      
      const messages = service.generateCompatibilityMessages(compatibility, 'dashboard');
      
      expect(messages.warningMessages).toContain('Your data is from before cycle tracking. Some features may be limited.');
    });

    it('should generate appropriate messages for admin context', () => {
      const compatibility = {
        hasCycleInfo: false,
        isLegacyData: true,
        migrationStatus: 'pending' as const,
        dataQuality: 'minimal' as const
      };
      
      const messages = service.generateCompatibilityMessages(compatibility, 'admin');
      
      expect(messages.warningMessages).toContain('Found data requiring migration (pending).');
      expect(messages.actionMessages).toContain('Run the data migration tool to enable full cycle functionality.');
      expect(messages.warningMessages).toContain('Data quality is minimal - some features may not work correctly.');
    });

    it('should generate positive messages for complete data', () => {
      const compatibility = {
        hasCycleInfo: true,
        isLegacyData: false,
        migrationStatus: 'migrated' as const,
        dataQuality: 'complete' as const
      };
      
      const messages = service.generateCompatibilityMessages(compatibility, 'history');
      
      expect(messages.infoMessages).toContain('All data includes cycle information - full functionality available.');
      expect(messages.warningMessages).toHaveLength(0);
    });
  });

  describe('createLegacyDataFallback', () => {
    it('should create fallback for empty records', () => {
      const fallback = service.createLegacyDataFallback([], 'history');
      
      expect(fallback.useFallback).toBe(true);
      expect(fallback.reason).toBe('No data available');
      expect(fallback.fallbackData).toBeNull();
    });

    it('should not create fallback when all data has cycle info', () => {
      const records = [createCycleAwareRecord('player1', 1)];
      const fallback = service.createLegacyDataFallback(records, 'history');
      
      expect(fallback.useFallback).toBe(false);
      expect(fallback.reason).toBe('All data has cycle information');
    });

    it('should create history-specific fallback for legacy data', () => {
      const records = [createLegacyRecord('player1'), createLegacyRecord('player2')];
      const fallback = service.createLegacyDataFallback(records, 'history');
      
      expect(fallback.useFallback).toBe(true);
      expect(fallback.reason).toBe('2 records lack cycle information');
      expect(fallback.fallbackData.message).toContain('before cycle tracking was implemented');
      expect(fallback.fallbackData.legacyRecordCount).toBe(2);
      expect(fallback.fallbackData.totalRecordCount).toBe(2);
    });

    it('should create dashboard-specific fallback for legacy data', () => {
      const records = [createLegacyRecord('player1')];
      const fallback = service.createLegacyDataFallback(records, 'dashboard');
      
      expect(fallback.useFallback).toBe(true);
      expect(fallback.fallbackData.showLegacyIndicator).toBe(true);
      expect(fallback.fallbackData.limitedFeatures).toContain('history_navigation');
    });

    it('should create admin-specific fallback for legacy data', () => {
      const records = [createLegacyRecord('player1')];
      const fallback = service.createLegacyDataFallback(records, 'analytics');
      
      expect(fallback.useFallback).toBe(true);
      expect(fallback.fallbackData.dataQualityWarning).toBe(true);
      expect(fallback.fallbackData.recommendMigration).toBe(true);
    });
  });

  // Helper functions
  function createLegacyRecord(playerId: string): EssenciaReportRecord {
    return {
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
  }

  function createCycleAwareRecord(playerId: string, cycleNumber: number, uploadSequence: number = 1): CycleAwareReportRecord {
    const baseRecord = createLegacyRecord(playerId);
    return {
      ...baseRecord,
      cycleNumber,
      uploadSequence,
      cycleStartDate: '2024-01-01T00:00:00Z',
      cycleEndDate: '2024-01-21T23:59:59Z'
    };
  }
});