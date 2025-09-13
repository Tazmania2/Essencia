import {
  BaseTeamProcessor,
  TeamProcessorUtils,
  CHALLENGE_MAPPING
} from '../team-processor.service';
import {
  TeamType,
  FunifierPlayerStatus,
  EssenciaReportRecord,
  PlayerMetrics,
  FUNIFIER_CONFIG
} from '../../types';

// Mock implementation for testing BaseTeamProcessor
class MockTeamProcessor extends BaseTeamProcessor {
  constructor(teamType: TeamType) {
    super(teamType);
  }

  processPlayerData(
    rawData: FunifierPlayerStatus,
    reportData?: EssenciaReportRecord
  ): PlayerMetrics {
    return {
      playerName: rawData.name,
      totalPoints: rawData.total_points,
      pointsLocked: this.calculatePointsLocked(rawData.catalog_items),
      currentCycleDay: this.getCurrentCycleDay(reportData),
      daysUntilCycleEnd: this.getDaysUntilCycleEnd(reportData),
      primaryGoal: this.createGoalMetric('Test Primary', 75),
      secondaryGoal1: this.createGoalMetric('Test Secondary 1', 50, true),
      secondaryGoal2: this.createGoalMetric('Test Secondary 2', 125)
    };
  }
}

describe('BaseTeamProcessor', () => {
  let processor: MockTeamProcessor;
  let mockPlayerData: FunifierPlayerStatus;
  let mockReportData: EssenciaReportRecord;

  beforeEach(() => {
    processor = new MockTeamProcessor(TeamType.CARTEIRA_I);
    
    mockPlayerData = {
      _id: 'player123',
      name: 'Test Player',
      total_points: 1000,
      total_challenges: 3,
      challenges: {},
      point_categories: {},
      total_catalog_items: 5,
      catalog_items: {
        [FUNIFIER_CONFIG.CATALOG_ITEMS.UNLOCK_POINTS]: 1,
        [FUNIFIER_CONFIG.CATALOG_ITEMS.BOOST_SECONDARY_1]: 1,
        [FUNIFIER_CONFIG.CATALOG_ITEMS.BOOST_SECONDARY_2]: 0
      },
      level_progress: {
        percent_completed: 50,
        next_points: 500,
        total_levels: 10,
        percent: 50
      },
      challenge_progress: [],
      teams: ['carteira_i'],
      positions: [],
      time: Date.now(),
      extra: {},
      pointCategories: {}
    };

    mockReportData = {
      _id: 'player123_2024-01-15',
      playerId: 'player123',
      playerName: 'Test Player',
      team: TeamType.CARTEIRA_I,
      atividade: 75,
      reaisPorAtivo: 120,
      faturamento: 90,
      currentCycleDay: 10,
      totalCycleDays: 21,
      reportDate: '2024-01-15T00:00:00.000Z',
      createdAt: '2024-01-15T00:00:00.000Z',
      updatedAt: '2024-01-15T00:00:00.000Z'
    };
  });

  describe('calculateProgressBar', () => {
    it('should return red color and correct fill for 0-50% range', () => {
      const result = processor['calculateProgressBar'](25);
      expect(result.color).toBe('red');
      expect(result.percentage).toBe(25);
      expect(result.fillPercentage).toBeCloseTo(16.665, 2); // 25/50 * 33.33
    });

    it('should return yellow color and correct fill for 50-100% range', () => {
      const result = processor['calculateProgressBar'](75);
      expect(result.color).toBe('yellow');
      expect(result.percentage).toBe(75);
      expect(result.fillPercentage).toBeCloseTo(49.995, 2); // 33.33 + (75-50)/50 * 33.33
    });

    it('should return green color and correct fill for 100-150% range', () => {
      const result = processor['calculateProgressBar'](125);
      expect(result.color).toBe('green');
      expect(result.percentage).toBe(125);
      expect(result.fillPercentage).toBeCloseTo(83.33, 2); // 66.66 + (125-100)/50 * 33.34
    });

    it('should cap at 150% for green range', () => {
      const result = processor['calculateProgressBar'](200);
      expect(result.color).toBe('green');
      expect(result.percentage).toBe(200);
      expect(result.fillPercentage).toBeCloseTo(100, 2); // Capped at 100% fill
    });

    it('should handle edge cases', () => {
      expect(processor['calculateProgressBar'](0).fillPercentage).toBe(0);
      expect(processor['calculateProgressBar'](50).color).toBe('red');
      expect(processor['calculateProgressBar'](100).color).toBe('yellow');
    });
  });

  describe('calculatePointsLocked', () => {
    it('should return true when unlock item count is 0', () => {
      const catalogItems = {
        [FUNIFIER_CONFIG.CATALOG_ITEMS.UNLOCK_POINTS]: 0
      };
      expect(processor['calculatePointsLocked'](catalogItems)).toBe(true);
    });

    it('should return false when unlock item count is greater than 0', () => {
      const catalogItems = {
        [FUNIFIER_CONFIG.CATALOG_ITEMS.UNLOCK_POINTS]: 1
      };
      expect(processor['calculatePointsLocked'](catalogItems)).toBe(false);
    });

    it('should handle missing unlock item', () => {
      const catalogItems = {};
      expect(processor['calculatePointsLocked'](catalogItems)).toBe(true);
    });
  });

  describe('isBoostActive', () => {
    it('should return true when secondary boost 1 is active', () => {
      const catalogItems = {
        [FUNIFIER_CONFIG.CATALOG_ITEMS.BOOST_SECONDARY_1]: 1
      };
      expect(processor['isBoostActive'](catalogItems, 'secondary1')).toBe(true);
    });

    it('should return true when secondary boost 2 is active', () => {
      const catalogItems = {
        [FUNIFIER_CONFIG.CATALOG_ITEMS.BOOST_SECONDARY_2]: 2
      };
      expect(processor['isBoostActive'](catalogItems, 'secondary2')).toBe(true);
    });

    it('should return false when boost is not active', () => {
      const catalogItems = {
        [FUNIFIER_CONFIG.CATALOG_ITEMS.BOOST_SECONDARY_1]: 0
      };
      expect(processor['isBoostActive'](catalogItems, 'secondary1')).toBe(false);
    });

    it('should handle missing boost items', () => {
      const catalogItems = {};
      expect(processor['isBoostActive'](catalogItems, 'secondary1')).toBe(false);
      expect(processor['isBoostActive'](catalogItems, 'secondary2')).toBe(false);
    });
  });

  describe('getCurrentCycleDay', () => {
    it('should return cycle day from report data when available', () => {
      expect(processor['getCurrentCycleDay'](mockReportData)).toBe(10);
    });

    it('should return calculated day when report data is not available', () => {
      const result = processor['getCurrentCycleDay']();
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThanOrEqual(21);
    });
  });

  describe('getDaysUntilCycleEnd', () => {
    it('should calculate days until cycle end correctly', () => {
      expect(processor['getDaysUntilCycleEnd'](mockReportData)).toBe(11); // 21 - 10
    });

    it('should return 0 when cycle is complete', () => {
      const completedCycleData = { ...mockReportData, currentCycleDay: 21 };
      expect(processor['getDaysUntilCycleEnd'](completedCycleData)).toBe(0);
    });

    it('should use default cycle length when not provided', () => {
      const dataWithoutCycleDays = { ...mockReportData };
      delete dataWithoutCycleDays.totalCycleDays;
      const result = processor['getDaysUntilCycleEnd'](dataWithoutCycleDays);
      expect(result).toBe(11); // 21 - 10
    });
  });

  describe('extractChallengePercentage', () => {
    it('should extract percentage from matching challenge progress', () => {
      const challengeProgress = [
        { challengeId: 'challenge1', percentage: 75 },
        { challengeId: 'challenge2', percentage: 50 }
      ];
      const result = processor['extractChallengePercentage'](challengeProgress, ['challenge1']);
      expect(result).toBe(75);
    });

    it('should return fallback value when no matching challenge found', () => {
      const challengeProgress = [
        { challengeId: 'challenge1', percentage: 75 }
      ];
      const result = processor['extractChallengePercentage'](challengeProgress, ['challenge2'], 25);
      expect(result).toBe(25);
    });

    it('should handle empty challenge progress array', () => {
      const result = processor['extractChallengePercentage']([], ['challenge1'], 10);
      expect(result).toBe(10);
    });
  });

  describe('extractReportPercentage', () => {
    it('should extract percentage from report data', () => {
      expect(processor['extractReportPercentage'](mockReportData, 'atividade')).toBe(75);
      expect(processor['extractReportPercentage'](mockReportData, 'reaisPorAtivo')).toBe(120);
      expect(processor['extractReportPercentage'](mockReportData, 'faturamento')).toBe(90);
    });

    it('should return 0 when report data is undefined', () => {
      expect(processor['extractReportPercentage'](undefined, 'atividade')).toBe(0);
    });

    it('should return 0 when metric is not present', () => {
      const dataWithoutMetric = { ...mockReportData };
      delete dataWithoutMetric.atividade;
      expect(processor['extractReportPercentage'](dataWithoutMetric, 'atividade')).toBe(0);
    });
  });

  describe('createGoalMetric', () => {
    it('should create goal metric with progress bar', () => {
      const result = processor['createGoalMetric']('Test Goal', 75, true, { extra: 'data' });
      
      expect(result.name).toBe('Test Goal');
      expect(result.percentage).toBe(75);
      expect(result.boostActive).toBe(true);
      expect(result.details.progressBar).toBeDefined();
      expect(result.details.progressBar.color).toBe('yellow');
      expect(result.details.extra).toBe('data');
    });

    it('should create goal metric with default values', () => {
      const result = processor['createGoalMetric']('Simple Goal', 25);
      
      expect(result.name).toBe('Simple Goal');
      expect(result.percentage).toBe(25);
      expect(result.boostActive).toBe(false);
      expect(result.details.progressBar.color).toBe('red');
    });
  });
});

describe('TeamProcessorUtils', () => {
  describe('calculatePercentage', () => {
    it('should calculate percentage correctly', () => {
      expect(TeamProcessorUtils.calculatePercentage(50, 100)).toBe(50);
      expect(TeamProcessorUtils.calculatePercentage(75, 50)).toBe(150);
      expect(TeamProcessorUtils.calculatePercentage(0, 100)).toBe(0);
    });

    it('should handle zero target', () => {
      expect(TeamProcessorUtils.calculatePercentage(50, 0)).toBe(0);
    });

    it('should handle negative values', () => {
      expect(TeamProcessorUtils.calculatePercentage(-10, 100)).toBe(0);
    });
  });

  describe('formatPercentage', () => {
    it('should format percentage with default decimals', () => {
      expect(TeamProcessorUtils.formatPercentage(75.456)).toBe('75.5%');
    });

    it('should format percentage with custom decimals', () => {
      expect(TeamProcessorUtils.formatPercentage(75.456, 2)).toBe('75.46%');
      expect(TeamProcessorUtils.formatPercentage(75.456, 0)).toBe('75%');
    });
  });

  describe('daysBetween', () => {
    it('should calculate days between dates correctly', () => {
      const date1 = new Date('2024-01-01');
      const date2 = new Date('2024-01-05');
      expect(TeamProcessorUtils.daysBetween(date1, date2)).toBe(4);
    });

    it('should handle reverse date order', () => {
      const date1 = new Date('2024-01-05');
      const date2 = new Date('2024-01-01');
      expect(TeamProcessorUtils.daysBetween(date1, date2)).toBe(4);
    });
  });

  describe('getCycleStartDate', () => {
    it('should return first day of month', () => {
      const testDate = new Date('2024-01-15');
      const result = TeamProcessorUtils.getCycleStartDate(testDate);
      expect(result.getDate()).toBe(1);
      expect(result.getMonth()).toBe(0); // January
      expect(result.getFullYear()).toBe(2024);
    });
  });

  describe('getCycleEndDate', () => {
    it('should calculate cycle end date correctly', () => {
      const startDate = new Date('2024-01-01');
      const result = TeamProcessorUtils.getCycleEndDate(startDate, 21);
      expect(result.getDate()).toBe(21);
      expect(result.getMonth()).toBe(0); // January
    });

    it('should use default cycle days', () => {
      const startDate = new Date('2024-01-01');
      const result = TeamProcessorUtils.getCycleEndDate(startDate);
      expect(result.getDate()).toBe(21);
    });
  });

  describe('determineTeamType', () => {
    it('should determine team type from team ID', () => {
      // Test actual Funifier team IDs
      expect(TeamProcessorUtils.determineTeamType('E6F4sCh')).toBe(TeamType.CARTEIRA_I);
      expect(TeamProcessorUtils.determineTeamType('E6F4O1b')).toBe(TeamType.CARTEIRA_II);
      expect(TeamProcessorUtils.determineTeamType('E6F4Xf2')).toBe(TeamType.CARTEIRA_III);
      expect(TeamProcessorUtils.determineTeamType('E6F41Bb')).toBe(TeamType.CARTEIRA_IV);
      
      // Test fallback name-based detection
      expect(TeamProcessorUtils.determineTeamType('carteira_i')).toBe(TeamType.CARTEIRA_I);
      expect(TeamProcessorUtils.determineTeamType('CARTEIRA_II')).toBe(TeamType.CARTEIRA_II);
      expect(TeamProcessorUtils.determineTeamType('carteira1')).toBe(TeamType.CARTEIRA_I);
      expect(TeamProcessorUtils.determineTeamType('carteira2')).toBe(TeamType.CARTEIRA_II);
    });

    it('should return null for unknown team ID', () => {
      expect(TeamProcessorUtils.determineTeamType('unknown_team')).toBeNull();
      expect(TeamProcessorUtils.determineTeamType('')).toBeNull();
    });
  });

  describe('validatePercentage', () => {
    it('should return valid percentages unchanged', () => {
      expect(TeamProcessorUtils.validatePercentage(75)).toBe(75);
      expect(TeamProcessorUtils.validatePercentage(0)).toBe(0);
      expect(TeamProcessorUtils.validatePercentage(150)).toBe(150);
    });

    it('should return 0 for invalid values', () => {
      expect(TeamProcessorUtils.validatePercentage(NaN)).toBe(0);
      expect(TeamProcessorUtils.validatePercentage(Infinity)).toBe(0);
      expect(TeamProcessorUtils.validatePercentage(-Infinity)).toBe(0);
    });

    it('should return 0 for negative values', () => {
      expect(TeamProcessorUtils.validatePercentage(-10)).toBe(0);
    });
  });

  describe('calculateCarteiraIIBoostMultiplier', () => {
    it('should calculate multiplier correctly', () => {
      expect(TeamProcessorUtils.calculateCarteiraIIBoostMultiplier(false, false)).toBe(1);
      expect(TeamProcessorUtils.calculateCarteiraIIBoostMultiplier(true, false)).toBe(2);
      expect(TeamProcessorUtils.calculateCarteiraIIBoostMultiplier(false, true)).toBe(2);
      expect(TeamProcessorUtils.calculateCarteiraIIBoostMultiplier(true, true)).toBe(3);
    });
  });

  describe('shouldUnlockCarteiraIIPoints', () => {
    it('should unlock points when percentage >= 100', () => {
      expect(TeamProcessorUtils.shouldUnlockCarteiraIIPoints(100)).toBe(true);
      expect(TeamProcessorUtils.shouldUnlockCarteiraIIPoints(150)).toBe(true);
    });

    it('should not unlock points when percentage < 100', () => {
      expect(TeamProcessorUtils.shouldUnlockCarteiraIIPoints(99)).toBe(false);
      expect(TeamProcessorUtils.shouldUnlockCarteiraIIPoints(0)).toBe(false);
    });
  });
});

describe('CHALLENGE_MAPPING', () => {
  it('should have mappings for all team types', () => {
    expect(CHALLENGE_MAPPING[TeamType.CARTEIRA_I]).toBeDefined();
    expect(CHALLENGE_MAPPING[TeamType.CARTEIRA_II]).toBeDefined();
    expect(CHALLENGE_MAPPING[TeamType.CARTEIRA_III]).toBeDefined();
    expect(CHALLENGE_MAPPING[TeamType.CARTEIRA_IV]).toBeDefined();
  });

  it('should have required challenge types for each team', () => {
    // Carteira I
    expect(CHALLENGE_MAPPING[TeamType.CARTEIRA_I].atividade).toBeDefined();
    expect(CHALLENGE_MAPPING[TeamType.CARTEIRA_I].reaisPorAtivo).toBeDefined();
    expect(CHALLENGE_MAPPING[TeamType.CARTEIRA_I].faturamento).toBeDefined();

    // Carteira II
    expect(CHALLENGE_MAPPING[TeamType.CARTEIRA_II].reaisPorAtivo).toBeDefined();
    expect(CHALLENGE_MAPPING[TeamType.CARTEIRA_II].atividade).toBeDefined();
    expect(CHALLENGE_MAPPING[TeamType.CARTEIRA_II].multimarcasPorAtivo).toBeDefined();

    // Carteira III
    expect(CHALLENGE_MAPPING[TeamType.CARTEIRA_III].faturamento).toBeDefined();
    expect(CHALLENGE_MAPPING[TeamType.CARTEIRA_III].reaisPorAtivo).toBeDefined();
    expect(CHALLENGE_MAPPING[TeamType.CARTEIRA_III].multimarcasPorAtivo).toBeDefined();

    // Carteira IV
    expect(CHALLENGE_MAPPING[TeamType.CARTEIRA_IV].faturamento).toBeDefined();
    expect(CHALLENGE_MAPPING[TeamType.CARTEIRA_IV].reaisPorAtivo).toBeDefined();
    expect(CHALLENGE_MAPPING[TeamType.CARTEIRA_IV].multimarcasPorAtivo).toBeDefined();
  });

  it('should have arrays of challenge IDs', () => {
    Object.values(CHALLENGE_MAPPING).forEach(teamMapping => {
      Object.values(teamMapping).forEach(challengeIds => {
        expect(Array.isArray(challengeIds)).toBe(true);
        expect((challengeIds as string[]).length).toBeGreaterThan(0);
      });
    });
  });
});