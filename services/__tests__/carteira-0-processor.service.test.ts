import { Carteira0Processor, carteira0Processor } from '../carteira-0-processor.service';
import {
  TeamType,
  FunifierPlayerStatus,
  EssenciaReportRecord,
  FUNIFIER_CONFIG
} from '../../types';

describe('Carteira0Processor', () => {
  let processor: Carteira0Processor;
  let mockPlayerData: FunifierPlayerStatus;
  let mockReportData: EssenciaReportRecord;

  beforeEach(() => {
    processor = new Carteira0Processor();

    mockPlayerData = {
      _id: 'player123',
      name: 'Maria Santos',
      total_points: 1200,
      total_challenges: 3,
      challenges: {
        'challenge_conversoes_c0': 85,
        'challenge_reais_ativo_c0': 110,
        'challenge_faturamento_c0': 95
      },
      point_categories: {},
      total_catalog_items: 5,
      catalog_items: {
        [FUNIFIER_CONFIG.CATALOG_ITEMS.UNLOCK_POINTS]: 1, // Points unlocked
        [FUNIFIER_CONFIG.CATALOG_ITEMS.BOOST_SECONDARY_1]: 1, // Boost 1 active
        [FUNIFIER_CONFIG.CATALOG_ITEMS.BOOST_SECONDARY_2]: 0  // Boost 2 inactive
      },
      level_progress: {
        percent_completed: 55,
        next_points: 300,
        total_levels: 10,
        percent: 55
      },
      challenge_progress: [
        {
          challengeId: 'E6GglPq', // Carteira 0 - Conversões
          percentage: 85,
          progress: 85,
          current: 85,
          target: 100
        },
        {
          challengeId: 'E6Gm8RI', // Carteira I, III & IV - Subir Reais por Ativo (reused)
          percentage: 110,
          progress: 110,
          current: 110,
          target: 100
        },
        {
          challengeId: 'E6GglPq', // Carteira I - Bater Faturamento (Meta) (reused)
          percentage: 95,
          progress: 95,
          current: 95,
          target: 100
        }
      ],
      teams: ['carteira_0'],
      positions: [],
      time: Date.now(),
      extra: {},
      pointCategories: {}
    };

    mockReportData = {
      _id: 'player123_2024-01-15',
      playerId: 'player123',
      playerName: 'Maria Santos',
      team: TeamType.CARTEIRA_0,
      conversoes: 90,
      reaisPorAtivo: 105,
      faturamento: 88,
      currentCycleDay: 15,
      totalCycleDays: 21,
      reportDate: '2024-01-15T00:00:00.000Z',
      createdAt: '2024-01-15T00:00:00.000Z',
      updatedAt: '2024-01-15T00:00:00.000Z'
    };
  });

  describe('processPlayerData', () => {
    it('should process player data correctly with report data', () => {
      const result = processor.processPlayerData(mockPlayerData, mockReportData);

      expect(result.playerName).toBe('Maria Santos');
      expect(result.totalPoints).toBe(1200);
      expect(result.pointsLocked).toBe(false); // Unlock item count > 0
      expect(result.currentCycleDay).toBe(15);
      expect(result.daysUntilCycleEnd).toBe(6); // 21 - 15

      // Primary goal: Conversões
      expect(result.primaryGoal.name).toBe('Conversões');
      expect(result.primaryGoal.percentage).toBe(85); // From challenge data (priority over report)
      expect(result.primaryGoal.boostActive).toBe(false); // Primary goal doesn't show boost

      // Secondary goal 1: Reais por Ativo
      expect(result.secondaryGoal1.name).toBe('Reais por Ativo');
      expect(result.secondaryGoal1.percentage).toBe(110); // From challenge data (priority over report)
      expect(result.secondaryGoal1.boostActive).toBe(true); // Boost 1 active

      // Secondary goal 2: Faturamento
      expect(result.secondaryGoal2.name).toBe('Faturamento');
      expect(result.secondaryGoal2.percentage).toBe(85); // From challenge data (priority over report)
      expect(result.secondaryGoal2.boostActive).toBe(false); // Boost 2 inactive
    });

    it('should process player data correctly without report data', () => {
      const result = processor.processPlayerData(mockPlayerData);

      expect(result.playerName).toBe('Maria Santos');
      expect(result.totalPoints).toBe(1200);
      expect(result.pointsLocked).toBe(false);

      // Should use challenge progress data
      expect(result.primaryGoal.percentage).toBe(85); // From challenge progress
      expect(result.secondaryGoal1.percentage).toBe(110); // From challenge progress
      expect(result.secondaryGoal2.percentage).toBe(85); // From challenge progress
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

    it('should prioritize report data over challenge progress', () => {
      // Report data has different values than challenge progress
      const result = processor.processPlayerData(mockPlayerData, mockReportData);

      // Should use challenge data values, not report data values (challenge has priority)
      expect(result.primaryGoal.percentage).toBe(85); // Challenge: 85, Report: 90
      expect(result.secondaryGoal1.percentage).toBe(110); // Challenge: 110, Report: 105
      expect(result.secondaryGoal2.percentage).toBe(85); // Challenge: 85, Report: 88
    });

    it('should validate and sanitize percentage values', () => {
      const invalidReportData = {
        ...mockReportData,
        conversoes: -15, // Negative value
        reaisPorAtivo: NaN, // Invalid value
        faturamento: Infinity // Invalid value
      };

      const result = processor.processPlayerData(mockPlayerData, invalidReportData);

      // Should use challenge data since it has priority over invalid report data
      expect(result.primaryGoal.percentage).toBe(85); // From challenge data
      expect(result.secondaryGoal1.percentage).toBe(110); // From challenge data
      expect(result.secondaryGoal2.percentage).toBe(85); // From challenge data
    });

    it('should create correct progress bar configurations', () => {
      const result = processor.processPlayerData(mockPlayerData, mockReportData);

      // Conversões: 85% -> yellow color (from challenge data)
      expect(result.primaryGoal.details.progressBar.color).toBe('yellow');
      expect(result.primaryGoal.details.progressBar.percentage).toBe(85);

      // Reais por Ativo: 110% -> green color (from challenge data)
      expect(result.secondaryGoal1.details.progressBar.color).toBe('green');
      expect(result.secondaryGoal1.details.progressBar.percentage).toBe(110);

      // Faturamento: 85% -> yellow color (from challenge data)
      expect(result.secondaryGoal2.details.progressBar.color).toBe('yellow');
      expect(result.secondaryGoal2.details.progressBar.percentage).toBe(85);
    });

    it('should include correct challenge IDs in goal details', () => {
      const result = processor.processPlayerData(mockPlayerData, mockReportData);

      expect(result.primaryGoal.details.challengeIds).toEqual(['E6GglPq']);
      expect(result.secondaryGoal1.details.challengeIds).toEqual(['E6Gm8RI', 'E6Gke5g']);
      expect(result.secondaryGoal2.details.challengeIds).toEqual(['E6GglPq', 'E6LIVVX']);
    });

    it('should include boost item IDs in secondary goal details', () => {
      const result = processor.processPlayerData(mockPlayerData, mockReportData);

      expect(result.secondaryGoal1.details.boostItemId).toBe(FUNIFIER_CONFIG.CATALOG_ITEMS.BOOST_SECONDARY_1);
      expect(result.secondaryGoal2.details.boostItemId).toBe(FUNIFIER_CONFIG.CATALOG_ITEMS.BOOST_SECONDARY_2);
    });

    it('should handle conversoes metric specifically', () => {
      const conversoesOnlyReportData = {
        ...mockReportData,
        conversoes: 125,
        reaisPorAtivo: undefined,
        faturamento: undefined
      };

      const result = processor.processPlayerData(mockPlayerData, conversoesOnlyReportData);

      expect(result.primaryGoal.name).toBe('Conversões');
      expect(result.primaryGoal.percentage).toBe(85); // Challenge data has priority
      expect(result.primaryGoal.details.progressBar.color).toBe('yellow'); // 85% -> yellow
    });

    it('should handle missing conversoes data gracefully', () => {
      const noConversoesReportData = {
        ...mockReportData,
        conversoes: undefined
      };

      const noConversoesPlayerData = {
        ...mockPlayerData,
        challenge_progress: [] // No challenge progress
      };

      const result = processor.processPlayerData(noConversoesPlayerData, noConversoesReportData);

      expect(result.primaryGoal.name).toBe('Conversões');
      expect(result.primaryGoal.percentage).toBe(0); // Default when no data
    });
  });

  describe('analyzeCarteira0Data', () => {
    it('should provide comprehensive analysis of player data', () => {
      const analysis = processor.analyzeCarteira0Data(mockPlayerData, mockReportData);

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
      expect(analysis.rawAnalysis.challengeAnalysis.extractedPercentages.conversoes).toBe(85);
      expect(analysis.rawAnalysis.challengeAnalysis.extractedPercentages.reaisPorAtivo).toBe(110);
      expect(analysis.rawAnalysis.challengeAnalysis.extractedPercentages.faturamento).toBe(85);

      // Report data analysis
      expect(analysis.rawAnalysis.reportDataAnalysis.hasReportData).toBe(true);
      expect(analysis.rawAnalysis.reportDataAnalysis.reportPercentages.conversoes).toBe(90);
      expect(analysis.rawAnalysis.reportDataAnalysis.reportPercentages.reaisPorAtivo).toBe(105);
      expect(analysis.rawAnalysis.reportDataAnalysis.reportPercentages.faturamento).toBe(88);
      expect(analysis.rawAnalysis.reportDataAnalysis.cycleInfo.currentDay).toBe(15);
      expect(analysis.rawAnalysis.reportDataAnalysis.cycleInfo.totalDays).toBe(21);
    });

    it('should handle analysis without report data', () => {
      const analysis = processor.analyzeCarteira0Data(mockPlayerData);

      expect(analysis.rawAnalysis.reportDataAnalysis.hasReportData).toBe(false);
      expect(analysis.rawAnalysis.reportDataAnalysis.reportPercentages.conversoes).toBeUndefined();
      expect(analysis.rawAnalysis.reportDataAnalysis.cycleInfo.currentDay).toBeUndefined();
    });

    it('should extract conversoes percentage correctly from challenge data', () => {
      const analysis = processor.analyzeCarteira0Data(mockPlayerData);

      expect(analysis.rawAnalysis.challengeAnalysis.extractedPercentages.conversoes).toBe(85);
    });
  });

  describe('singleton instance', () => {
    it('should export a singleton instance', () => {
      expect(carteira0Processor).toBeInstanceOf(Carteira0Processor);
      expect(carteira0Processor).toBe(carteira0Processor); // Same instance
    });

    it('should have correct team type', () => {
      expect(carteira0Processor['teamType']).toBe(TeamType.CARTEIRA_0);
    });
  });

  describe('edge cases', () => {
    it('should handle empty player data gracefully', () => {
      const emptyPlayerData: FunifierPlayerStatus = {
        _id: 'empty',
        name: 'Empty Player',
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

      expect(result.playerName).toBe('Empty Player');
      expect(result.totalPoints).toBe(0);
      expect(result.pointsLocked).toBe(true);
      expect(result.primaryGoal.percentage).toBe(0);
      expect(result.secondaryGoal1.percentage).toBe(0);
      expect(result.secondaryGoal2.percentage).toBe(0);
    });

    it('should handle team type mismatch warning', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const mismatchedReportData = {
        ...mockReportData,
        team: TeamType.CARTEIRA_II // Different team type
      };

      processor.processPlayerData(mockPlayerData, mismatchedReportData);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Team type mismatch')
      );

      consoleSpy.mockRestore();
    });

    it('should handle very high percentage values', () => {
      const highPercentageReportData = {
        ...mockReportData,
        conversoes: 180,
        reaisPorAtivo: 220,
        faturamento: 150
      };

      const result = processor.processPlayerData(mockPlayerData, highPercentageReportData);

      // Challenge data has priority over report data
      expect(result.primaryGoal.percentage).toBe(85);
      expect(result.secondaryGoal1.percentage).toBe(110);
      expect(result.secondaryGoal2.percentage).toBe(85);

      // Progress bars should handle challenge data values correctly (challenge has priority)
      expect(result.primaryGoal.details.progressBar.color).toBe('yellow'); // 85% -> yellow
      expect(result.secondaryGoal1.details.progressBar.color).toBe('green'); // 110% -> green
      expect(result.secondaryGoal2.details.progressBar.color).toBe('yellow'); // 85% -> yellow
    });

    it('should handle challenge progress with different field names', () => {
      const alternativePlayerData = {
        ...mockPlayerData,
        challenge_progress: [
          {
            challenge: 'E6GglPq', // Using 'challenge' instead of 'challengeId'
            percent_completed: 92 // Using 'percent_completed' instead of 'percentage'
          },
          {
            id: 'E6Gm8RI', // Using 'id' instead of 'challengeId'
            progress: 115 // Using 'progress' instead of 'percentage'
          }
        ]
      };

      const result = processor.processPlayerData(alternativePlayerData);

      expect(result.primaryGoal.percentage).toBe(92);
      expect(result.secondaryGoal1.percentage).toBe(115);
    });

    it('should handle zero and boundary percentage values', () => {
      const boundaryReportData = {
        ...mockReportData,
        conversoes: 0,
        reaisPorAtivo: 50, // Boundary between red and yellow
        faturamento: 100 // Boundary between yellow and green
      };

      const result = processor.processPlayerData(mockPlayerData, boundaryReportData);

      // Challenge data has priority over report data
      expect(result.primaryGoal.percentage).toBe(85);
      expect(result.secondaryGoal1.percentage).toBe(110);
      expect(result.secondaryGoal2.percentage).toBe(85);

      // Check progress bar colors for challenge data values (challenge has priority)
      expect(result.primaryGoal.details.progressBar.color).toBe('yellow'); // 85% -> yellow
      expect(result.secondaryGoal1.details.progressBar.color).toBe('green'); // 110% -> green
      expect(result.secondaryGoal2.details.progressBar.color).toBe('yellow'); // 85% -> yellow
    });

    it('should handle missing or undefined challenge progress fields', () => {
      const incompletePlayerData = {
        ...mockPlayerData,
        challenge_progress: [
          {
            challengeId: 'E6GglPq'
            // Missing percentage/progress fields
          },
          {
            challengeId: 'E6Gm8RI',
            percentage: null // Null value
          }
        ]
      };

      const result = processor.processPlayerData(incompletePlayerData);

      expect(result.primaryGoal.percentage).toBe(0); // Should default to 0
      expect(result.secondaryGoal1.percentage).toBe(0); // Should default to 0
    });
  });

  describe('conversoes metric specific tests', () => {
    it('should correctly identify conversoes as primary goal', () => {
      const result = processor.processPlayerData(mockPlayerData, mockReportData);
      
      expect(result.primaryGoal.name).toBe('Conversões');
      expect(result.primaryGoal.details.isMainGoal).toBe(true);
    });

    it('should use E6GglPq challenge ID for conversoes', () => {
      const result = processor.processPlayerData(mockPlayerData, mockReportData);
      
      expect(result.primaryGoal.details.challengeIds).toContain('E6GglPq');
    });

    it('should handle conversoes data from both sources correctly', () => {
      // Test with only challenge data
      const challengeOnlyData = {
        ...mockPlayerData,
        challenge_progress: [
          {
            challengeId: 'E6GglPq',
            percentage: 75
          }
        ]
      };

      const resultChallenge = processor.processPlayerData(challengeOnlyData);
      expect(resultChallenge.primaryGoal.percentage).toBe(75);

      // Test with only report data (no challenge data available)
      const reportOnlyData = {
        ...mockPlayerData,
        challenge_progress: [] // No challenge data
      };

      const reportDataWithConversoes = {
        ...mockReportData,
        conversoes: 85
      };

      const resultReport = processor.processPlayerData(reportOnlyData, reportDataWithConversoes);
      expect(resultReport.primaryGoal.percentage).toBe(85); // Should use report data when no challenge data
    });
  });
});