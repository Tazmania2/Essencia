import { 
  CycleAwareReportRecord, 
  CycleCSVData, 
  PrecisionMetric,
  DashboardConfig,
  DashboardConfigurationRecord,
  CycleHistoryData,
  MetricSnapshot,
  ProgressDataPoint,
  ValidationResult,
  TeamType 
} from '../../types';
import { getDefaultDashboardConfig, validateConfigurationStructure } from '../dashboard-defaults';

describe('Type Validation', () => {
  describe('CycleAwareReportRecord', () => {
    it('should extend EssenciaReportRecord with cycle fields', () => {
      const record: CycleAwareReportRecord = {
        _id: 'test-id',
        playerId: 'player-1',
        playerName: 'Test Player',
        team: TeamType.CARTEIRA_I,
        cycleNumber: 1,
        uploadSequence: 1,
        cycleStartDate: '2024-01-01T00:00:00Z',
        cycleEndDate: '2024-01-21T00:00:00Z',
        reportDate: '2024-01-01T00:00:00Z',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        atividade: 85.5,
        reaisPorAtivo: 92.3,
        faturamento: 78.1,
        currentCycleDay: 1,
        totalCycleDays: 21
      };

      expect(record.cycleNumber).toBe(1);
      expect(record.uploadSequence).toBe(1);
      expect(record.cycleStartDate).toBeDefined();
      expect(record.cycleEndDate).toBeDefined();
    });
  });

  describe('CycleCSVData', () => {
    it('should extend CSVGoalData with cycle fields', () => {
      const csvData: CycleCSVData = {
        playerId: 'player-1',
        cycleDay: 5,
        totalCycleDays: 21,
        cycleNumber: 1,
        uploadSequence: 1,
        uploadTimestamp: '2024-01-05T10:00:00Z',
        faturamento: {
          target: 10000,
          current: 7500,
          percentage: 75
        },
        reaisPorAtivo: {
          target: 500,
          current: 450,
          percentage: 90
        },
        multimarcasPorAtivo: {
          target: 3,
          current: 2.5,
          percentage: 83.3
        },
        atividade: {
          target: 100,
          current: 85,
          percentage: 85
        }
      };

      expect(csvData.cycleNumber).toBe(1);
      expect(csvData.uploadSequence).toBe(1);
      expect(csvData.uploadTimestamp).toBeDefined();
    });
  });

  describe('PrecisionMetric', () => {
    it('should have correct structure', () => {
      const metric: PrecisionMetric = {
        value: 85.5,
        displayValue: '85.5%',
        rawCalculation: 85.52341234
      };

      expect(typeof metric.value).toBe('number');
      expect(typeof metric.displayValue).toBe('string');
      expect(typeof metric.rawCalculation).toBe('number');
    });
  });

  describe('DashboardConfig', () => {
    it('should have correct structure for regular team', () => {
      const config = getDefaultDashboardConfig(TeamType.CARTEIRA_I);

      expect(config.teamType).toBe(TeamType.CARTEIRA_I);
      expect(config.displayName).toBeDefined();
      expect(config.primaryGoal).toBeDefined();
      expect(config.secondaryGoal1).toBeDefined();
      expect(config.secondaryGoal2).toBeDefined();
      expect(config.unlockConditions).toBeDefined();
      expect(config.primaryGoal.calculationType).toBe('funifier_direct');
    });

    it('should have special processing for Carteira II', () => {
      const config = getDefaultDashboardConfig(TeamType.CARTEIRA_II);

      expect(config.specialProcessing).toBeDefined();
      expect(config.specialProcessing?.type).toBe('carteira_ii_local');
      expect(config.specialProcessing?.warnings).toHaveLength(3);
      expect(config.primaryGoal.calculationType).toBe('local_processing');
    });
  });

  describe('CycleHistoryData', () => {
    it('should have correct structure', () => {
      const historyData: CycleHistoryData = {
        cycleNumber: 1,
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-01-21T00:00:00Z',
        totalDays: 21,
        completionStatus: 'completed',
        finalMetrics: {
          primaryGoal: {
            name: 'atividade',
            percentage: 85.5,
            target: 100,
            current: 85.5,
            unit: 'pontos',
            boostActive: false
          },
          secondaryGoal1: {
            name: 'reaisPorAtivo',
            percentage: 92.3,
            target: 500,
            current: 461.5,
            unit: 'R$',
            boostActive: true
          },
          secondaryGoal2: {
            name: 'faturamento',
            percentage: 78.1,
            target: 10000,
            current: 7810,
            unit: 'R$',
            boostActive: false
          }
        },
        progressTimeline: []
      };

      expect(historyData.cycleNumber).toBe(1);
      expect(historyData.completionStatus).toBe('completed');
      expect(historyData.finalMetrics.primaryGoal).toBeDefined();
      expect(historyData.finalMetrics.secondaryGoal1).toBeDefined();
      expect(historyData.finalMetrics.secondaryGoal2).toBeDefined();
    });
  });

  describe('ValidationResult', () => {
    it('should have correct structure', () => {
      const result: ValidationResult = {
        isValid: true,
        errors: [],
        warnings: [
          {
            field: 'primaryGoal',
            message: 'This is a warning',
            type: 'compatibility'
          }
        ]
      };

      expect(typeof result.isValid).toBe('boolean');
      expect(Array.isArray(result.errors)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
    });
  });

  describe('Configuration Validation', () => {
    it('should validate correct configuration structure', () => {
      const config = getDefaultDashboardConfig(TeamType.CARTEIRA_I);
      const isValid = validateConfigurationStructure(config);
      
      expect(isValid).toBe(true);
    });

    it('should reject invalid configuration structure', () => {
      const invalidConfig = {
        teamType: TeamType.CARTEIRA_I,
        // Missing required fields
      } as DashboardConfig;
      
      const isValid = validateConfigurationStructure(invalidConfig);
      
      expect(isValid).toBe(false);
    });
  });
});