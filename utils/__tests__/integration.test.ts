import { PrecisionMath } from '../precision-math';
import { CycleUtils } from '../cycle-utils';
import { getDefaultDashboardConfig, getAllDefaultConfigurations } from '../dashboard-defaults';
import { TeamType, CycleAwareReportRecord } from '../../types';

describe('Integration Tests', () => {
  describe('PrecisionMath + CycleUtils Integration', () => {
    it('should work together for cycle progress calculations', () => {
      const startDate = '2024-01-01T00:00:00Z';
      const endDate = '2024-01-21T00:00:00Z';
      const currentDate = '2024-01-11T00:00:00Z';
      
      const progress = CycleUtils.calculateCycleProgress(startDate, endDate, currentDate);
      const precisionProgress = PrecisionMath.fixExistingPercentage(progress);
      
      expect(precisionProgress.value).toBeGreaterThan(0);
      expect(precisionProgress.displayValue).toMatch(/%$/);
    });
  });

  describe('Dashboard Configuration Integration', () => {
    it('should provide configurations for all team types', () => {
      const allConfigs = getAllDefaultConfigurations();
      const teamTypes = Object.values(TeamType);
      
      teamTypes.forEach(teamType => {
        const config = getDefaultDashboardConfig(teamType);
        expect(config).toBeDefined();
        expect(config.teamType).toBe(teamType);
        expect(allConfigs[teamType]).toEqual(config);
      });
    });

    it('should have consistent metric calculations', () => {
      const config = getDefaultDashboardConfig(TeamType.CARTEIRA_I);
      
      // Simulate metric calculation
      const target = 100;
      const current = 85.234567;
      const precision = PrecisionMath.calculatePercentage(current, target);
      
      expect(precision.displayValue).toBe('85.2%');
      expect(precision.value).toBe(85.2);
    });
  });

  describe('Cycle Data Processing Integration', () => {
    it('should process cycle-aware records correctly', () => {
      const records: CycleAwareReportRecord[] = [
        {
          _id: '1',
          playerId: 'player1',
          playerName: 'Player 1',
          team: TeamType.CARTEIRA_I,
          cycleNumber: 1,
          uploadSequence: 1,
          cycleStartDate: '2024-01-01T00:00:00Z',
          cycleEndDate: '2024-01-21T00:00:00Z',
          reportDate: '2024-01-10T00:00:00Z',
          createdAt: '2024-01-10T00:00:00Z',
          updatedAt: '2024-01-10T00:00:00Z',
          atividade: 85.234567,
          reaisPorAtivo: 92.876543,
          faturamento: 78.123456,
          currentCycleDay: 10,
          totalCycleDays: 21
        }
      ];

      const grouped = CycleUtils.groupRecordsByCycle(records);
      const latest = CycleUtils.getLatestRecordPerCycle(records);
      const cycles = CycleUtils.extractCyclesFromRecords(records);
      
      expect(grouped.size).toBe(1);
      expect(latest.size).toBe(1);
      expect(cycles).toHaveLength(1);
      
      const record = latest.get(1)!;
      const atividadePrecision = PrecisionMath.fixExistingPercentage(record.atividade!);
      
      expect(atividadePrecision.displayValue).toBe('85.2%');
    });
  });

  describe('Configuration + Precision Integration', () => {
    it('should format metric values according to configuration', () => {
      const config = getDefaultDashboardConfig(TeamType.CARTEIRA_I);
      
      // Test currency formatting for faturamento
      const faturamentoValue = 12345.67;
      const formattedCurrency = PrecisionMath.formatCurrency(faturamentoValue);
      expect(formattedCurrency).toMatch(/R\$/);
      
      // Test number formatting for atividade
      const atividadeValue = 85.234567;
      const formattedNumber = PrecisionMath.formatNumber(atividadeValue, 1);
      expect(formattedNumber).toBe('85,2');
      
      // Test percentage calculation
      const percentage = PrecisionMath.calculatePercentage(85.234567, 100);
      expect(percentage.displayValue).toBe('85.2%');
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle invalid data gracefully', () => {
      // Test invalid numbers
      const invalidPercentage = PrecisionMath.calculatePercentage(NaN, 100);
      expect(invalidPercentage.value).toBe(0);
      
      // Test invalid dates
      const invalidCycleDates = CycleUtils.validateCycleDates('invalid', 'also-invalid');
      expect(invalidCycleDates).toBe(false);
      
      // Test safe number validation
      const safeNumber = PrecisionMath.validateNumber('not-a-number', 42);
      expect(safeNumber).toBe(42);
    });
  });
});