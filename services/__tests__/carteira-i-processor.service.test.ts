import { CarteiraIProcessor, carteiraIProcessor } from '../carteira-i-processor.service';
import {
  TeamType,
  FunifierPlayerStatus,
  EssenciaReportRecord,
  FUNIFIER_CONFIG
} from '../../types';

describe('CarteiraIProcessor', () => {
  let processor: CarteiraIProcessor;
  let mockPlayerData: FunifierPlayerStatus;
  let mockReportData: EssenciaReportRecord;

  beforeEach(() => {
    processor = new CarteiraIProcessor();

    mockPlayerData = {
      _id: 'player123',
      name: 'João Silva',
      total_points: 1500,
      total_challenges: 3,
      challenges: {
        'challenge_atividade_c1': 75,
        'challenge_reais_ativo_c1': 120,
        'challenge_faturamento_c1': 90
      },
      point_categories: {},
      total_catalog_items: 5,
      catalog_items: {
        [FUNIFIER_CONFIG.CATALOG_ITEMS.UNLOCK_POINTS]: 1, // Points unlocked
        [FUNIFIER_CONFIG.CATALOG_ITEMS.BOOST_SECONDARY_1]: 1, // Boost 1 active
        [FUNIFIER_CONFIG.CATALOG_ITEMS.BOOST_SECONDARY_2]: 0  // Boost 2 inactive
      },
      level_progress: {
        percent_completed: 60,
        next_points: 400,
        total_levels: 10,
        percent: 60
      },
      challenge_progress: [
        {
          challengeId: 'E6FO12f', // Carteira I - Subir Atividade (Pré Meta)
          percentage: 75,
          progress: 75,
          current: 75,
          target: 100
        },
        {
          challengeId: 'E6Gm8RI', // Carteira I, III & IV - Subir Reais por Ativo
          percentage: 120,
          progress: 120,
          current: 120,
          target: 100
        },
        {
          challengeId: 'E6GglPq', // Carteira I - Bater Faturamento (Meta)
          percentage: 90,
          progress: 90,
          current: 90,
          target: 100
        }
      ],
      teams: ['carteira_i'],
      positions: [],
      time: Date.now(),
      extra: {},
      pointCategories: {}
    };

    mockReportData = {
      _id: 'player123_2024-01-15',
      playerId: 'player123',
      playerName: 'João Silva',
      team: TeamType.CARTEIRA_I,
      atividade: 80,
      reaisPorAtivo: 110,
      faturamento: 95,
      currentCycleDay: 12,
      totalCycleDays: 21,
      reportDate: '2024-01-15T00:00:00.000Z',
      createdAt: '2024-01-15T00:00:00.000Z',
      updatedAt: '2024-01-15T00:00:00.000Z'
    };
  });

  describe('processPlayerData', () => {
    it('should process player data correctly with report data', () => {
      const result = processor.processPlayerData(mockPlayerData, mockReportData);

      expect(result.playerName).toBe('João Silva');
      expect(result.totalPoints).toBe(1500);
      expect(result.pointsLocked).toBe(false); // Unlock item count > 0
      expect(result.currentCycleDay).toBe(12);
      expect(result.daysUntilCycleEnd).toBe(9); // 21 - 12

      // Primary goal: Atividade
      expect(result.primaryGoal.name).toBe('Atividade');
      expect(result.primaryGoal.percentage).toBe(80); // From report data
      expect(result.primaryGoal.boostActive).toBe(false); // Primary goal doesn't show boost

      // Secondary goal 1: Reais por Ativo
      expect(result.secondaryGoal1.name).toBe('Reais por Ativo');
      expect(result.secondaryGoal1.percentage).toBe(110); // From report data
      expect(result.secondaryGoal1.boostActive).toBe(true); // Boost 1 active

      // Secondary goal 2: Faturamento
      expect(result.secondaryGoal2.name).toBe('Faturamento');
      expect(result.secondaryGoal2.percentage).toBe(95); // From report data
      expect(result.secondaryGoal2.boostActive).toBe(false); // Boost 2 inactive
    });

    it('should process player data correctly without report data', () => {
      const result = processor.processPlayerData(mockPlayerData);

      expect(result.playerName).toBe('João Silva');
      expect(result.totalPoints).toBe(1500);
      expect(result.pointsLocked).toBe(false);

      // Should use challenge progress data
      expect(result.primaryGoal.percentage).toBe(75); // From challenge progress
      expect(result.secondaryGoal1.percentage).toBe(120); // From challenge progress
      expect(result.secondaryGoal2.percentage).toBe(90); // From challenge progress
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

      // Should use report data values, not challenge progress values
      expect(result.primaryGoal.percentage).toBe(80); // Report: 80, Challenge: 75
      expect(result.secondaryGoal1.percentage).toBe(110); // Report: 110, Challenge: 120
      expect(result.secondaryGoal2.percentage).toBe(95); // Report: 95, Challenge: 90
    });

    it('should validate and sanitize percentage values', () => {
      const invalidReportData = {
        ...mockReportData,
        atividade: -10, // Negative value
        reaisPorAtivo: NaN, // Invalid value
        faturamento: Infinity // Invalid value
      };

      const result = processor.processPlayerData(mockPlayerData, invalidReportData);

      expect(result.primaryGoal.percentage).toBe(0); // Negative becomes 0
      expect(result.secondaryGoal1.percentage).toBe(0); // NaN becomes 0
      expect(result.secondaryGoal2.percentage).toBe(0); // Infinity becomes 0
    });

    it('should create correct progress bar configurations', () => {
      const result = processor.processPlayerData(mockPlayerData, mockReportData);

      // Atividade: 80% -> yellow color
      expect(result.primaryGoal.details.progressBar.color).toBe('yellow');
      expect(result.primaryGoal.details.progressBar.percentage).toBe(80);

      // Reais por Ativo: 110% -> green color
      expect(result.secondaryGoal1.details.progressBar.color).toBe('green');
      expect(result.secondaryGoal1.details.progressBar.percentage).toBe(110);

      // Faturamento: 95% -> yellow color
      expect(result.secondaryGoal2.details.progressBar.color).toBe('yellow');
      expect(result.secondaryGoal2.details.progressBar.percentage).toBe(95);
    });

    it('should include correct challenge IDs in goal details', () => {
      const result = processor.processPlayerData(mockPlayerData, mockReportData);

      expect(result.primaryGoal.details.challengeIds).toEqual(['E6FO12f', 'E6FQIjs', 'E6KQAoh']);
      expect(result.secondaryGoal1.details.challengeIds).toEqual(['E6Gm8RI', 'E6Gke5g']);
      expect(result.secondaryGoal2.details.challengeIds).toEqual(['E6GglPq', 'E6LIVVX']);
    });

    it('should include boost item IDs in secondary goal details', () => {
      const result = processor.processPlayerData(mockPlayerData, mockReportData);

      expect(result.secondaryGoal1.details.boostItemId).toBe(FUNIFIER_CONFIG.CATALOG_ITEMS.BOOST_SECONDARY_1);
      expect(result.secondaryGoal2.details.boostItemId).toBe(FUNIFIER_CONFIG.CATALOG_ITEMS.BOOST_SECONDARY_2);
    });
  });

  describe('analyzeCarteiraIData', () => {
    it('should provide comprehensive analysis of player data', () => {
      const analysis = processor.analyzeCarteiraIData(mockPlayerData, mockReportData);

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
      expect(analysis.rawAnalysis.challengeAnalysis.extractedPercentages.atividade).toBe(75);
      expect(analysis.rawAnalysis.challengeAnalysis.extractedPercentages.reaisPorAtivo).toBe(120);
      expect(analysis.rawAnalysis.challengeAnalysis.extractedPercentages.faturamento).toBe(90);

      // Report data analysis
      expect(analysis.rawAnalysis.reportDataAnalysis.hasReportData).toBe(true);
      expect(analysis.rawAnalysis.reportDataAnalysis.reportPercentages.atividade).toBe(80);
      expect(analysis.rawAnalysis.reportDataAnalysis.reportPercentages.reaisPorAtivo).toBe(110);
      expect(analysis.rawAnalysis.reportDataAnalysis.reportPercentages.faturamento).toBe(95);
      expect(analysis.rawAnalysis.reportDataAnalysis.cycleInfo.currentDay).toBe(12);
      expect(analysis.rawAnalysis.reportDataAnalysis.cycleInfo.totalDays).toBe(21);
    });

    it('should handle analysis without report data', () => {
      const analysis = processor.analyzeCarteiraIData(mockPlayerData);

      expect(analysis.rawAnalysis.reportDataAnalysis.hasReportData).toBe(false);
      expect(analysis.rawAnalysis.reportDataAnalysis.reportPercentages.atividade).toBeUndefined();
      expect(analysis.rawAnalysis.reportDataAnalysis.cycleInfo.currentDay).toBeUndefined();
    });
  });

  describe('singleton instance', () => {
    it('should export a singleton instance', () => {
      expect(carteiraIProcessor).toBeInstanceOf(CarteiraIProcessor);
      expect(carteiraIProcessor).toBe(carteiraIProcessor); // Same instance
    });

    it('should have correct team type', () => {
      expect(carteiraIProcessor['teamType']).toBe(TeamType.CARTEIRA_I);
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
        atividade: 250,
        reaisPorAtivo: 300,
        faturamento: 200
      };

      const result = processor.processPlayerData(mockPlayerData, highPercentageReportData);

      expect(result.primaryGoal.percentage).toBe(250);
      expect(result.secondaryGoal1.percentage).toBe(300);
      expect(result.secondaryGoal2.percentage).toBe(200);

      // Progress bars should handle high values correctly
      expect(result.primaryGoal.details.progressBar.color).toBe('green');
      expect(result.secondaryGoal1.details.progressBar.color).toBe('green');
      expect(result.secondaryGoal2.details.progressBar.color).toBe('green');
    });
  });
});