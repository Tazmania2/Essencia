import { ERProcessor, erProcessor } from '../er-processor.service';
import {
  TeamType,
  FunifierPlayerStatus,
  EssenciaReportRecord,
  FUNIFIER_CONFIG
} from '../../types';

describe('ERProcessor', () => {
  let processor: ERProcessor;
  let mockPlayerData: FunifierPlayerStatus;
  let mockReportData: EssenciaReportRecord;

  beforeEach(() => {
    processor = new ERProcessor();

    mockPlayerData = {
      _id: 'player456',
      name: 'João Silva',
      total_points: 1500,
      total_challenges: 3,
      challenges: {
        'challenge_faturamento_er': 95,
        'challenge_reais_ativo_er': 120,
        'challenge_upa_er': 80
      },
      point_categories: {},
      total_catalog_items: 5,
      catalog_items: {
        [FUNIFIER_CONFIG.CATALOG_ITEMS.UNLOCK_POINTS]: 1, // Points unlocked
        [FUNIFIER_CONFIG.CATALOG_ITEMS.BOOST_SECONDARY_1]: 1, // Boost 1 active
        [FUNIFIER_CONFIG.CATALOG_ITEMS.BOOST_SECONDARY_2]: 0  // Boost 2 inactive
      },
      level_progress: {
        percent_completed: 65,
        next_points: 200,
        total_levels: 10,
        percent: 65
      },
      challenge_progress: [
        {
          challengeId: 'E6F8HMK', // Carteira III & IV - Bater Meta Faturamento (reused for ER)
          percentage: 95,
          progress: 95,
          current: 95,
          target: 100
        },
        {
          challengeId: 'E6Gm8RI', // Carteira I, III & IV - Subir Reais por Ativo (reused for ER)
          percentage: 120,
          progress: 120,
          current: 120,
          target: 100
        },
        {
          challengeId: 'E62x2PW', // ER - UPA metric
          percentage: 80,
          progress: 80,
          current: 80,
          target: 100
        }
      ],
      teams: ['er'],
      positions: [],
      time: Date.now(),
      extra: {},
      pointCategories: {}
    };

    mockReportData = {
      _id: 'player456_2024-01-15',
      playerId: 'player456',
      playerName: 'João Silva',
      team: TeamType.ER,
      faturamento: 88,
      reaisPorAtivo: 115,
      upa: 75,
      currentCycleDay: 12,
      totalCycleDays: 21,
      reportDate: '2024-01-15T00:00:00.000Z',
      createdAt: '2024-01-15T00:00:00.000Z',
      updatedAt: '2024-01-15T00:00:00.000Z'
    };
  });

  describe('processPlayerData', () => {
    it('should process ER player data correctly with report data', () => {
      const result = processor.processPlayerData(mockPlayerData, mockReportData);

      expect(result.playerName).toBe('João Silva');
      expect(result.totalPoints).toBe(1500);
      expect(result.pointsLocked).toBe(false); // Unlock item count > 0
      expect(result.currentCycleDay).toBe(12);
      expect(result.daysUntilCycleEnd).toBe(9); // 21 - 12

      // Primary goal: Faturamento
      expect(result.primaryGoal.name).toBe('Faturamento');
      expect(result.primaryGoal.percentage).toBe(95); // From challenge data (priority over report)
      expect(result.primaryGoal.boostActive).toBe(false); // Primary goal doesn't show boost

      // Secondary goal 1: Reais por Ativo
      expect(result.secondaryGoal1.name).toBe('Reais por Ativo');
      expect(result.secondaryGoal1.percentage).toBe(120); // From challenge data (priority over report)
      expect(result.secondaryGoal1.boostActive).toBe(true); // Boost 1 active

      // Secondary goal 2: UPA
      expect(result.secondaryGoal2.name).toBe('UPA');
      expect(result.secondaryGoal2.percentage).toBe(80); // From challenge data (priority over report)
      expect(result.secondaryGoal2.boostActive).toBe(false); // Boost 2 inactive
    });

    it('should process ER player data correctly without report data', () => {
      const result = processor.processPlayerData(mockPlayerData);

      expect(result.playerName).toBe('João Silva');
      expect(result.totalPoints).toBe(1500);
      expect(result.pointsLocked).toBe(false);

      // Should use challenge progress data
      expect(result.primaryGoal.percentage).toBe(95); // From challenge progress
      expect(result.secondaryGoal1.percentage).toBe(120); // From challenge progress
      expect(result.secondaryGoal2.percentage).toBe(80); // From challenge progress
    });

    it('should handle locked points correctly', () => {
      const lockedPlayerData = {
        ...mockPlayerData,
        catalog_items: {
          [FUNIFIER_CONFIG.CATALOG_ITEMS.UNLOCK_POINTS]: 0, // Points locked
          [FUNIFIER_CONFIG.CATALOG_ITEMS.BOOST_SECONDARY_1]: 0,
          [FUNIFIER_CONFIG.CATALOG_ITEMS.BOOST_SECONDARY_2]: 0
        }
      };

      const result = processor.processPlayerData(lockedPlayerData, mockReportData);

      expect(result.pointsLocked).toBe(true);
      expect(result.secondaryGoal1.boostActive).toBe(false);
      expect(result.secondaryGoal2.boostActive).toBe(false);
    });

    it('should handle missing catalog_items', () => {
      const playerDataWithoutCatalog = {
        ...mockPlayerData,
        catalog_items: {}
      };

      const result = processor.processPlayerData(playerDataWithoutCatalog, mockReportData);

      expect(result.pointsLocked).toBe(true); // Default to locked when no catalog items
      expect(result.secondaryGoal1.boostActive).toBe(false);
      expect(result.secondaryGoal2.boostActive).toBe(false);
    });

    it('should handle missing challenge progress', () => {
      const playerDataWithoutProgress = {
        ...mockPlayerData,
        challenge_progress: []
      };

      const result = processor.processPlayerData(playerDataWithoutProgress);

      // Should default to 0 when no challenge progress and no report data
      expect(result.primaryGoal.percentage).toBe(0);
      expect(result.secondaryGoal1.percentage).toBe(0);
      expect(result.secondaryGoal2.percentage).toBe(0);
    });

    it('should prioritize challenge data over report data', () => {
      // Report data has different values than challenge progress
      const result = processor.processPlayerData(mockPlayerData, mockReportData);

      // Should use challenge data values, not report data values (challenge has priority)
      expect(result.primaryGoal.percentage).toBe(95); // Challenge: 95, Report: 88
      expect(result.secondaryGoal1.percentage).toBe(120); // Challenge: 120, Report: 115
      expect(result.secondaryGoal2.percentage).toBe(80); // Challenge: 80, Report: 75
    });

    it('should validate and sanitize percentage values', () => {
      const invalidReportData = {
        ...mockReportData,
        faturamento: -20, // Negative value
        reaisPorAtivo: NaN, // Invalid value
        upa: Infinity // Invalid value
      };

      const result = processor.processPlayerData(mockPlayerData, invalidReportData);

      // Should use challenge data since it has priority over invalid report data
      expect(result.primaryGoal.percentage).toBe(95); // From challenge data
      expect(result.secondaryGoal1.percentage).toBe(120); // From challenge data
      expect(result.secondaryGoal2.percentage).toBe(80); // From challenge data
    });

    it('should create correct progress bar configurations', () => {
      const result = processor.processPlayerData(mockPlayerData, mockReportData);

      // Faturamento: 95% -> yellow color (from challenge data)
      expect(result.primaryGoal.details.progressBar.color).toBe('yellow');
      expect(result.primaryGoal.details.progressBar.percentage).toBe(95);

      // Reais por Ativo: 120% -> green color (from challenge data)
      expect(result.secondaryGoal1.details.progressBar.color).toBe('green');
      expect(result.secondaryGoal1.details.progressBar.percentage).toBe(120);

      // UPA: 80% -> yellow color (from challenge data)
      expect(result.secondaryGoal2.details.progressBar.color).toBe('yellow');
      expect(result.secondaryGoal2.details.progressBar.percentage).toBe(80);
    });

    it('should include correct challenge IDs in goal details', () => {
      const result = processor.processPlayerData(mockPlayerData, mockReportData);

      expect(result.primaryGoal.details.challengeIds).toEqual(['E6F8HMK', 'E6Gahd4', 'E6MLv3L']);
      expect(result.secondaryGoal1.details.challengeIds).toEqual(['E6Gm8RI', 'E6Gke5g']);
      expect(result.secondaryGoal2.details.challengeIds).toEqual(['E62x2PW']);
    });

    it('should include boost item IDs in secondary goal details', () => {
      const result = processor.processPlayerData(mockPlayerData, mockReportData);

      expect(result.secondaryGoal1.details.boostItemId).toBe(FUNIFIER_CONFIG.CATALOG_ITEMS.BOOST_SECONDARY_1);
      expect(result.secondaryGoal2.details.boostItemId).toBe(FUNIFIER_CONFIG.CATALOG_ITEMS.BOOST_SECONDARY_2);
    });

    it('should handle UPA metric specifically', () => {
      const upaOnlyReportData = {
        ...mockReportData,
        faturamento: undefined,
        reaisPorAtivo: undefined,
        upa: 135
      };

      const result = processor.processPlayerData(mockPlayerData, upaOnlyReportData);

      expect(result.secondaryGoal2.name).toBe('UPA');
      expect(result.secondaryGoal2.percentage).toBe(80); // Challenge data has priority
      expect(result.secondaryGoal2.details.progressBar.color).toBe('yellow'); // 80% -> yellow
    });

    it('should handle missing UPA data gracefully', () => {
      const noUpaReportData = {
        ...mockReportData,
        upa: undefined
      };

      const noUpaPlayerData = {
        ...mockPlayerData,
        challenge_progress: [] // No challenge progress
      };

      const result = processor.processPlayerData(noUpaPlayerData, noUpaReportData);

      expect(result.secondaryGoal2.name).toBe('UPA');
      expect(result.secondaryGoal2.percentage).toBe(0); // Default when no data
    });

    it('should use correct team type for ER', () => {
      expect(processor['teamType']).toBe(TeamType.ER);
    });
  });

  describe('analyzeERData', () => {
    it('should provide comprehensive analysis of ER player data', () => {
      const analysis = processor.analyzeERData(mockPlayerData, mockReportData);

      expect(analysis.playerMetrics).toBeDefined();
      expect(analysis.rawAnalysis).toBeDefined();

      // Catalog items analysis
      expect(analysis.rawAnalysis.catalogItemsAnalysis.unlockStatus).toBe(true);
      expect(analysis.rawAnalysis.catalogItemsAnalysis.boost1Status).toBe(true);
      expect(analysis.rawAnalysis.catalogItemsAnalysis.boost2Status).toBe(false);
      expect(analysis.rawAnalysis.catalogItemsAnalysis.unlockItemCount).toBe(1);
      expect(analysis.rawAnalysis.catalogItemsAnalysis.boost1ItemCount).toBe(1);
      expect(analysis.rawAnalysis.catalogItemsAnalysis.boost2ItemCount).toBe(0);

      // Challenge analysis
      expect(analysis.rawAnalysis.challengeAnalysis.totalChallenges).toBe(3);
      expect(analysis.rawAnalysis.challengeAnalysis.challengeProgress).toHaveLength(3);
      expect(analysis.rawAnalysis.challengeAnalysis.extractedPercentages.faturamento).toBe(95);
      expect(analysis.rawAnalysis.challengeAnalysis.extractedPercentages.reaisPorAtivo).toBe(120);
      expect(analysis.rawAnalysis.challengeAnalysis.extractedPercentages.upa).toBe(80);

      // Data source analysis
      expect(analysis.rawAnalysis.challengeAnalysis.dataSource.faturamento).toBe('challenge');
      expect(analysis.rawAnalysis.challengeAnalysis.dataSource.reaisPorAtivo).toBe('challenge');
      expect(analysis.rawAnalysis.challengeAnalysis.dataSource.upa).toBe('challenge');

      // Report data analysis
      expect(analysis.rawAnalysis.reportDataAnalysis.hasReportData).toBe(true);
      expect(analysis.rawAnalysis.reportDataAnalysis.reportPercentages.faturamento).toBe(88);
      expect(analysis.rawAnalysis.reportDataAnalysis.reportPercentages.reaisPorAtivo).toBe(115);
      expect(analysis.rawAnalysis.reportDataAnalysis.reportPercentages.upa).toBe(75);
      expect(analysis.rawAnalysis.reportDataAnalysis.cycleInfo.currentDay).toBe(12);
      expect(analysis.rawAnalysis.reportDataAnalysis.cycleInfo.totalDays).toBe(21);
    });

    it('should handle analysis without report data', () => {
      const analysis = processor.analyzeERData(mockPlayerData);

      expect(analysis.rawAnalysis.reportDataAnalysis.hasReportData).toBe(false);
      expect(analysis.rawAnalysis.reportDataAnalysis.reportPercentages.faturamento).toBeUndefined();
      expect(analysis.rawAnalysis.reportDataAnalysis.reportPercentages.upa).toBeUndefined();
      expect(analysis.rawAnalysis.reportDataAnalysis.cycleInfo.currentDay).toBeUndefined();
    });

    it('should correctly identify data sources when challenge data is missing', () => {
      const noChallengPlayerData = {
        ...mockPlayerData,
        challenge_progress: []
      };

      const analysis = processor.analyzeERData(noChallengPlayerData, mockReportData);

      expect(analysis.rawAnalysis.challengeAnalysis.dataSource.faturamento).toBe('report');
      expect(analysis.rawAnalysis.challengeAnalysis.dataSource.reaisPorAtivo).toBe('report');
      expect(analysis.rawAnalysis.challengeAnalysis.dataSource.upa).toBe('report');
    });

    it('should identify default data source when no data is available', () => {
      const noDataPlayerData = {
        ...mockPlayerData,
        challenge_progress: []
      };

      const noDataReportData = {
        ...mockReportData,
        faturamento: undefined,
        reaisPorAtivo: undefined,
        upa: undefined
      };

      const analysis = processor.analyzeERData(noDataPlayerData, noDataReportData);

      expect(analysis.rawAnalysis.challengeAnalysis.dataSource.faturamento).toBe('default');
      expect(analysis.rawAnalysis.challengeAnalysis.dataSource.reaisPorAtivo).toBe('default');
      expect(analysis.rawAnalysis.challengeAnalysis.dataSource.upa).toBe('default');
    });
  });

  describe('singleton instance', () => {
    it('should export a singleton instance', () => {
      expect(erProcessor).toBeInstanceOf(ERProcessor);
      expect(erProcessor).toBe(erProcessor); // Same instance
    });

    it('should have correct team type', () => {
      expect(erProcessor['teamType']).toBe(TeamType.ER);
    });
  });

  describe('edge cases', () => {
    it('should handle empty player data gracefully', () => {
      const emptyPlayerData: FunifierPlayerStatus = {
        _id: 'empty',
        name: 'Empty ER Player',
        total_points: 0,
        total_challenges: 0,
        challenges: {},
        point_categories: {},
        total_catalog_items: 0,
        catalog_items: {},
        level_progress: {
          percent_completed: 0,
          next_points: 0,
          total_levels: 0,
          percent: 0
        },
        challenge_progress: [],
        teams: [],
        positions: [],
        time: 0,
        extra: {},
        pointCategories: {}
      };

      const result = processor.processPlayerData(emptyPlayerData);

      expect(result.playerName).toBe('Empty ER Player');
      expect(result.totalPoints).toBe(0);
      expect(result.pointsLocked).toBe(true);
      expect(result.primaryGoal.percentage).toBe(0);
      expect(result.secondaryGoal1.percentage).toBe(0);
      expect(result.secondaryGoal2.percentage).toBe(0);
    });

    it('should handle team type mismatch warning', () => {
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation();
      
      const mismatchedReportData = {
        ...mockReportData,
        team: TeamType.CARTEIRA_I // Different team type
      };

      processor.processPlayerData(mockPlayerData, mismatchedReportData);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Team context: viewing ER dashboard with CARTEIRA_I report data')
      );

      consoleSpy.mockRestore();
    });

    it('should handle very high percentage values', () => {
      const highPercentageReportData = {
        ...mockReportData,
        faturamento: 200,
        reaisPorAtivo: 180,
        upa: 160
      };

      const result = processor.processPlayerData(mockPlayerData, highPercentageReportData);

      // Challenge data has priority over report data
      expect(result.primaryGoal.percentage).toBe(95);
      expect(result.secondaryGoal1.percentage).toBe(120);
      expect(result.secondaryGoal2.percentage).toBe(80);

      // Progress bars should handle challenge data values correctly (challenge has priority)
      expect(result.primaryGoal.details.progressBar.color).toBe('yellow'); // 95% -> yellow
      expect(result.secondaryGoal1.details.progressBar.color).toBe('green'); // 120% -> green
      expect(result.secondaryGoal2.details.progressBar.color).toBe('yellow'); // 80% -> yellow
    });

    it('should handle challenge progress with different field names', () => {
      const alternativePlayerData = {
        ...mockPlayerData,
        challenge_progress: [
          {
            challenge: 'E6F8HMK', // Using 'challenge' instead of 'challengeId'
            percent_completed: 88 // Using 'percent_completed' instead of 'percentage'
          },
          {
            id: 'E6Gm8RI', // Using 'id' instead of 'challengeId'
            progress: 125 // Using 'progress' instead of 'percentage'
          },
          {
            challengeId: 'E62x2PW',
            percentage: 85
          }
        ]
      };

      const result = processor.processPlayerData(alternativePlayerData);

      expect(result.primaryGoal.percentage).toBe(88);
      expect(result.secondaryGoal1.percentage).toBe(125);
      expect(result.secondaryGoal2.percentage).toBe(85);
    });

    it('should handle zero and boundary percentage values', () => {
      const boundaryReportData = {
        ...mockReportData,
        faturamento: 0,
        reaisPorAtivo: 50, // Boundary between red and yellow
        upa: 100 // Boundary between yellow and green
      };

      const result = processor.processPlayerData(mockPlayerData, boundaryReportData);

      // Challenge data has priority over report data
      expect(result.primaryGoal.percentage).toBe(95);
      expect(result.secondaryGoal1.percentage).toBe(120);
      expect(result.secondaryGoal2.percentage).toBe(80);

      // Check progress bar colors for challenge data values (challenge has priority)
      expect(result.primaryGoal.details.progressBar.color).toBe('yellow'); // 95% -> yellow
      expect(result.secondaryGoal1.details.progressBar.color).toBe('green'); // 120% -> green
      expect(result.secondaryGoal2.details.progressBar.color).toBe('yellow'); // 80% -> yellow
    });

    it('should handle missing or undefined challenge progress fields', () => {
      const incompletePlayerData = {
        ...mockPlayerData,
        challenge_progress: [
          {
            challengeId: 'E6F8HMK'
            // Missing percentage/progress fields
          },
          {
            challengeId: 'E6Gm8RI',
            percentage: null // Null value
          },
          {
            challengeId: 'E62x2PW',
            percentage: undefined // Undefined value
          }
        ]
      };

      const result = processor.processPlayerData(incompletePlayerData);

      expect(result.primaryGoal.percentage).toBe(0); // Should default to 0
      expect(result.secondaryGoal1.percentage).toBe(0); // Should default to 0
      expect(result.secondaryGoal2.percentage).toBe(0); // Should default to 0
    });
  });

  describe('ER specific metric tests', () => {
    it('should correctly identify Faturamento as primary goal', () => {
      const result = processor.processPlayerData(mockPlayerData, mockReportData);
      
      expect(result.primaryGoal.name).toBe('Faturamento');
      expect(result.primaryGoal.details.isMainGoal).toBe(true);
    });

    it('should correctly identify UPA as secondary goal', () => {
      const result = processor.processPlayerData(mockPlayerData, mockReportData);
      
      expect(result.secondaryGoal2.name).toBe('UPA');
      expect(result.secondaryGoal2.details.challengeIds).toContain('E62x2PW');
    });

    it('should use correct challenge IDs for ER team', () => {
      const result = processor.processPlayerData(mockPlayerData, mockReportData);
      
      // Faturamento should use Carteira III/IV challenge IDs
      expect(result.primaryGoal.details.challengeIds).toEqual(['E6F8HMK', 'E6Gahd4', 'E6MLv3L']);
      
      // Reais por Ativo should use Carteira III/IV challenge IDs
      expect(result.secondaryGoal1.details.challengeIds).toEqual(['E6Gm8RI', 'E6Gke5g']);
      
      // UPA should use ER-specific challenge ID
      expect(result.secondaryGoal2.details.challengeIds).toEqual(['E62x2PW']);
    });

    it('should handle UPA data from both sources correctly', () => {
      // Test with only challenge data
      const challengeOnlyData = {
        ...mockPlayerData,
        challenge_progress: [
          {
            challengeId: 'E62x2PW',
            percentage: 90
          }
        ]
      };

      const resultChallenge = processor.processPlayerData(challengeOnlyData);
      expect(resultChallenge.secondaryGoal2.percentage).toBe(90);

      // Test with only report data (no challenge data available)
      const reportOnlyData = {
        ...mockPlayerData,
        challenge_progress: [] // No challenge data
      };

      const reportDataWithUpa = {
        ...mockReportData,
        upa: 85
      };

      const resultReport = processor.processPlayerData(reportOnlyData, reportDataWithUpa);
      expect(resultReport.secondaryGoal2.percentage).toBe(85); // Should use report data when no challenge data
    });

    it('should reuse Carteira III/IV challenge IDs for Faturamento and Reais por Ativo', () => {
      const result = processor.processPlayerData(mockPlayerData, mockReportData);
      
      // Should reuse the same challenge IDs as Carteira III/IV
      expect(result.primaryGoal.details.challengeIds).toContain('E6F8HMK'); // Carteira III & IV - Bater Meta Faturamento
      expect(result.primaryGoal.details.challengeIds).toContain('E6Gahd4'); // Carteira III & IV - Subir Faturamento (Pre-Meta)
      expect(result.primaryGoal.details.challengeIds).toContain('E6MLv3L'); // Carteira III & IV - Subir Faturamento (Pós-Meta)
      
      expect(result.secondaryGoal1.details.challengeIds).toContain('E6Gm8RI'); // Carteira I, III & IV - Subir Reais por Ativo
      expect(result.secondaryGoal1.details.challengeIds).toContain('E6Gke5g'); // Carteira I, III & IV - Descer Reais Ativo
    });
  });

  describe('factory function', () => {
    it('should create ER processor instance', () => {
      const { createERProcessor } = require('../er-processor.service');
      const newProcessor = createERProcessor();
      
      expect(newProcessor).toBeInstanceOf(ERProcessor);
      expect(newProcessor['teamType']).toBe(TeamType.ER);
    });
  });
});