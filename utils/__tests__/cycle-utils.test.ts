import { CycleUtils } from '../cycle-utils';
import { CycleAwareReportRecord, TeamType } from '../../types';

describe('CycleUtils', () => {
  describe('generateCycleInfo', () => {
    it('should generate cycle info correctly', () => {
      const startDate = '2024-01-01T00:00:00Z';
      const cycleInfo = CycleUtils.generateCycleInfo(1, startDate, 21);
      
      expect(cycleInfo.cycleNumber).toBe(1);
      expect(cycleInfo.startDate).toBe(startDate);
      expect(cycleInfo.totalDays).toBe(21);
      expect(cycleInfo.endDate).toBe('2024-01-21T00:00:00.000Z');
    });
  });

  describe('calculateCycleEndDate', () => {
    it('should calculate end date correctly', () => {
      const startDate = '2024-01-01T00:00:00Z';
      const endDate = CycleUtils.calculateCycleEndDate(startDate, 21);
      
      expect(endDate).toBe('2024-01-21T00:00:00.000Z');
    });
  });

  describe('getCurrentCycleDay', () => {
    it('should calculate current cycle day correctly', () => {
      const startDate = '2024-01-01T00:00:00Z';
      const currentDate = '2024-01-05T12:00:00Z';
      const cycleDay = CycleUtils.getCurrentCycleDay(startDate, currentDate);
      
      expect(cycleDay).toBe(5);
    });

    it('should return minimum day 1', () => {
      const startDate = '2024-01-05T00:00:00Z';
      const currentDate = '2024-01-01T00:00:00Z';
      const cycleDay = CycleUtils.getCurrentCycleDay(startDate, currentDate);
      
      expect(cycleDay).toBe(1);
    });
  });

  describe('validateCycleDates', () => {
    it('should validate correct dates', () => {
      const isValid = CycleUtils.validateCycleDates(
        '2024-01-01T00:00:00Z',
        '2024-01-21T00:00:00Z'
      );
      
      expect(isValid).toBe(true);
    });

    it('should reject invalid dates', () => {
      const isValid = CycleUtils.validateCycleDates(
        '2024-01-21T00:00:00Z',
        '2024-01-01T00:00:00Z'
      );
      
      expect(isValid).toBe(false);
    });

    it('should reject malformed dates', () => {
      const isValid = CycleUtils.validateCycleDates('invalid', 'also-invalid');
      
      expect(isValid).toBe(false);
    });
  });

  describe('groupRecordsByCycle', () => {
    it('should group records by cycle number', () => {
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
          reportDate: '2024-01-01T00:00:00Z',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        },
        {
          _id: '2',
          playerId: 'player1',
          playerName: 'Player 1',
          team: TeamType.CARTEIRA_I,
          cycleNumber: 2,
          uploadSequence: 1,
          cycleStartDate: '2024-01-22T00:00:00Z',
          cycleEndDate: '2024-02-11T00:00:00Z',
          reportDate: '2024-01-22T00:00:00Z',
          createdAt: '2024-01-22T00:00:00Z',
          updatedAt: '2024-01-22T00:00:00Z'
        }
      ];

      const grouped = CycleUtils.groupRecordsByCycle(records);
      
      expect(grouped.size).toBe(2);
      expect(grouped.get(1)).toHaveLength(1);
      expect(grouped.get(2)).toHaveLength(1);
    });
  });

  describe('formatCycleName', () => {
    it('should format cycle name correctly', () => {
      expect(CycleUtils.formatCycleName(1)).toBe('Ciclo 1');
      expect(CycleUtils.formatCycleName(10)).toBe('Ciclo 10');
    });
  });

  describe('assignDefaultCycle', () => {
    it('should assign default cycle values', () => {
      const createdAt = '2024-01-01T00:00:00Z';
      const defaultCycle = CycleUtils.assignDefaultCycle(createdAt, 21);
      
      expect(defaultCycle.cycleNumber).toBe(1);
      expect(defaultCycle.cycleStartDate).toBe(createdAt);
      expect(defaultCycle.uploadSequence).toBe(1);
      expect(defaultCycle.cycleEndDate).toBe('2024-01-21T00:00:00.000Z');
    });
  });
});