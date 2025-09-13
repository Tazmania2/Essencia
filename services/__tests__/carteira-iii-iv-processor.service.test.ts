import {
  CarteiraIIIIVProcessor,
  createCarteiraIIIProcessor,
  createCarteiraIVProcessor,
  carteiraIIIProcessor,
  carteiraIVProcessor
} from '../carteira-iii-iv-processor.service';
import {
  TeamType,
  FunifierPlayerStatus,
  EssenciaReportRecord,
  FUNIFIER_CONFIG
} from '../../types';

describe('CarteiraIIIIVProcessor', () => {
  let processorIII: CarteiraIIIIVProcessor;
  let processorIV: CarteiraIIIIVProcessor;
  let mockPlayerData: FunifierPlayerStatus;
  let mockReportData: EssenciaReportRecord;

  beforeEach(() => {
    processorIII = new CarteiraIIIIVProcessor(TeamType.CARTEIRA_III);
    processorIV = new CarteiraIIIIVProcessor(TeamType.CARTEIRA_IV);

    mockPlayerData = {
      _id: 'player456',
      name: 'Maria Santos',
      total_points: 2000,
      total_challenges: 3,
      challenges: {
        'challenge_faturamento_c3': 85,
        'challenge_reais_ativo_c3': 110,
        'challenge_multimarcas_c3': 95
      },
      point_categories: {},
      total_catalog_items: 4,
      catalog_items: {
        [FUNIFIER_CONFIG.CATALOG_ITEMS.UNLOCK_POINTS]: 1, // Points unlocked
        [FUNIFIER_CONFIG.CATALOG_ITEMS.BOOST_SECONDARY_1]: 0, // Boost 1 inactive
        [FUNIFIER_CONFIG.CATALOG_ITEMS.BOOST_SECONDARY_2]: 1  // Boost 2 active
      },
      level_progress: {
        percent_completed: 70,
        next_points: 300,
        total_levels: 10,
        percent: 70
      },
      challenge_progress: [
        {
          challengeId: 'E6F8HMK', // Carteira III & IV - Bater Meta Faturamento
          percentage: 85,
          progress: 85,
          current: 85,
          target: 100
        },
        {
          challengeId: 'E6Gm8RI', // Carteira I, III & IV - Subir Reais por Ativo
          percentage: 110,
          progress: 110,
          current: 110,
          target: 100
        },
        {
          challengeId: 'E6MMH5v', // Carteira III & IV - Subir Multimarcas por Ativo
          percentage: 95,
          progress: 95,
          current: 95,
          target: 100
        }
      ],
      teams: ['carteira_iii'],
      positions: [],
      time: Date.now(),
      extra: {},
      pointCategories: {}
    };

    mockReportData = {
      _id: 'player456_2024-01-15',
      playerId: 'player456',
      playerName: 'Maria Santos',
      team: TeamType.CARTEIRA_III,
      faturamento: 90,
      reaisPorAtivo: 105,
      multimarcasPorAtivo: 100,
      currentCycleDay: 15,
      totalCycleDays: 21,
      reportDate: '2024-01-15T00:00:00.000Z',
      createdAt: '2024-01-15T00:00:00.000Z',
      updatedAt: '2024-01-15T00:00:00.000Z'
    };
  });

  describe('constructor', () => {
    it('should create processor for Carteira III', () => {
      const processor = new CarteiraIIIIVProcessor(TeamType.CARTEIRA_III);
      expect(processor['teamType']).toBe(TeamType.CARTEIRA_III);
    });

    it('should create processor for Carteira IV', () => {
      const processor = new CarteiraIIIIVProcessor(TeamType.CARTEIRA_IV);
      expect(processor['teamType']).toBe(TeamType.CARTEIRA_IV);
    });

    it('should throw error for invalid team type', () => {
      expect(() => {
        new CarteiraIIIIVProcessor(TeamType.CARTEIRA_I as any);
      }).toThrow('Invalid team type for CarteiraIIIIVProcessor: CARTEIRA_I');
    });
  });

  describe('processPlayerData - Carteira III', () => {
    it('should process player data correctly prioritizing challenge data', () => {
      const result = processorIII.processPlayerData(mockPlayerData, mockReportData);

      expect(result.playerName).toBe('Maria Santos');
      expect(result.totalPoints).toBe(2000);
      expect(result.pointsLocked).toBe(false); // Unlock item count > 0
      expect(result.currentCycleDay).toBe(15);
      expect(result.daysUntilCycleEnd).toBe(6); // 21 - 15

      // Primary goal: Faturamento (should use challenge data: 85, not report data: 90)
      expect(result.primaryGoal.name).toBe('Faturamento');
      expect(result.primaryGoal.percentage).toBe(85); // From challenge progress
      expect(result.primaryGoal.boostActive).toBe(false); // Primary goal doesn't show boost

      // Secondary goal 1: Reais por Ativo (should use challenge data: 110, not report data: 105)
      expect(result.secondaryGoal1.name).toBe('Reais por Ativo');
      expect(result.secondaryGoal1.percentage).toBe(110); // From challenge progress
      expect(result.secondaryGoal1.boostActive).toBe(false); // Boost 1 inactive

      // Secondary goal 2: Multimarcas por Ativo (should use challenge data: 95, not report data: 100)
      expect(result.secondaryGoal2.name).toBe('Multimarcas por Ativo');
      expect(result.secondaryGoal2.percentage).toBe(95); // From challenge progress
      expect(result.secondaryGoal2.boostActive).toBe(true); // Boost 2 active
    });

    it('should fallback to report data when challenge data is not available', () => {
      const playerDataWithoutChallenges = {
        ...mockPlayerData,
        challenge_progress: [] // No challenge progress
      };

      const result = processorIII.processPlayerData(playerDataWithoutChallenges, mockReportData);

      // Should use report data as fallback
      expect(result.primaryGoal.percentage).toBe(90); // From report data
      expect(result.secondaryGoal1.percentage).toBe(105); // From report data
      expect(result.secondaryGoal2.percentage).toBe(100); // From report data
    });

    it('should handle missing both challenge and report data', () => {
      const playerDataWithoutChallenges = {
        ...mockPlayerData,
        challenge_progress: []
      };

      const result = processorIII.processPlayerData(playerDataWithoutChallenges);

      // Should default to 0 when no data available
      expect(result.primaryGoal.percentage).toBe(0);
      expect(result.secondaryGoal1.percentage).toBe(0);
      expect(result.secondaryGoal2.percentage).toBe(0);
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

      const result = processorIII.processPlayerData(lockedPlayerData, mockReportData);

      expect(result.pointsLocked).toBe(true);
      expect(result.secondaryGoal1.boostActive).toBe(false);
      expect(result.secondaryGoal2.boostActive).toBe(false);
    });

    it('should create correct progress bar configurations', () => {
      const result = processorIII.processPlayerData(mockPlayerData, mockReportData);

      // Faturamento: 85% -> yellow color
      expect(result.primaryGoal.details.progressBar.color).toBe('yellow');
      expect(result.primaryGoal.details.progressBar.percentage).toBe(85);

      // Reais por Ativo: 110% -> green color
      expect(result.secondaryGoal1.details.progressBar.color).toBe('green');
      expect(result.secondaryGoal1.details.progressBar.percentage).toBe(110);

      // Multimarcas por Ativo: 95% -> yellow color
      expect(result.secondaryGoal2.details.progressBar.color).toBe('yellow');
      expect(result.secondaryGoal2.details.progressBar.percentage).toBe(95);
    });

    it('should include correct challenge IDs in goal details', () => {
      const result = processorIII.processPlayerData(mockPlayerData, mockReportData);

      expect(result.primaryGoal.details.challengeIds).toEqual(['E6F8HMK', 'E6Gahd4', 'E6MLv3L']);
      expect(result.secondaryGoal1.details.challengeIds).toEqual(['E6Gm8RI', 'E6Gke5g']);
      expect(result.secondaryGoal2.details.challengeIds).toEqual(['E6MMH5v', 'E6MM3eK']);
    });
  });

  describe('processPlayerData - Carteira IV', () => {
    it('should process Carteira IV data with correct challenge IDs', () => {
      const carteiraIVData = {
        ...mockPlayerData,
        teams: ['carteira_iv'],
        challenge_progress: [
          {
            challengeId: 'E6F8HMK', // Carteira III & IV - Bater Meta Faturamento
            percentage: 80,
            progress: 80
          },
          {
            challengeId: 'E6Gm8RI', // Carteira I, III & IV - Subir Reais por Ativo
            percentage: 115,
            progress: 115
          },
          {
            challengeId: 'E6MMH5v', // Carteira III & IV - Subir Multimarcas por Ativo
            percentage: 88,
            progress: 88
          }
        ]
      };

      const carteiraIVReportData = {
        ...mockReportData,
        team: TeamType.CARTEIRA_IV
      };

      const result = processorIV.processPlayerData(carteiraIVData, carteiraIVReportData);

      expect(result.primaryGoal.percentage).toBe(80); // From challenge progress
      expect(result.secondaryGoal1.percentage).toBe(115); // From challenge progress
      expect(result.secondaryGoal2.percentage).toBe(88); // From challenge progress

      expect(result.primaryGoal.details.challengeIds).toEqual(['E6F8HMK', 'E6Gahd4', 'E6MLv3L']);
      expect(result.secondaryGoal1.details.challengeIds).toEqual(['E6Gm8RI', 'E6Gke5g']);
      expect(result.secondaryGoal2.details.challengeIds).toEqual(['E6MMH5v', 'E6MM3eK']);
    });
  });

  describe('analyzeCarteiraIIIIVData', () => {
    it('should provide comprehensive analysis with data source tracking', () => {
      const analysis = processorIII.analyzeCarteiraIIIIVData(mockPlayerData, mockReportData);

      expect(analysis.teamType).toBe(TeamType.CARTEIRA_III);
      expect(analysis.playerMetrics).toBeDefined();
      expect(analysis.rawAnalysis).toBeDefined();

      // Catalog items analysis
      expect(analysis.rawAnalysis.catalogItemsAnalysis.unlockStatus).toBe(true);
      expect(analysis.rawAnalysis.catalogItemsAnalysis.boost1Status).toBe(false);
      expect(analysis.rawAnalysis.catalogItemsAnalysis.boost2Status).toBe(true);
      expect(analysis.rawAnalysis.catalogItemsAnalysis.unlockItemCount).toBe(1);
      expect(analysis.rawAnalysis.catalogItemsAnalysis.boost1ItemCount).toBe(0);
      expect(analysis.rawAnalysis.catalogItemsAnalysis.boost2ItemCount).toBe(1);

      // Challenge analysis with data source tracking
      expect(analysis.rawAnalysis.challengeAnalysis.totalChallenges).toBe(3);
      expect(analysis.rawAnalysis.challengeAnalysis.challengeProgress).toHaveLength(3);
      expect(analysis.rawAnalysis.challengeAnalysis.extractedPercentages.faturamento).toBe(85);
      expect(analysis.rawAnalysis.challengeAnalysis.extractedPercentages.reaisPorAtivo).toBe(110);
      expect(analysis.rawAnalysis.challengeAnalysis.extractedPercentages.multimarcasPorAtivo).toBe(95);

      // Data source should be 'challenge' since challenge data is available
      expect(analysis.rawAnalysis.challengeAnalysis.dataSource.faturamento).toBe('challenge');
      expect(analysis.rawAnalysis.challengeAnalysis.dataSource.reaisPorAtivo).toBe('challenge');
      expect(analysis.rawAnalysis.challengeAnalysis.dataSource.multimarcasPorAtivo).toBe('challenge');

      // Report data analysis
      expect(analysis.rawAnalysis.reportDataAnalysis.hasReportData).toBe(true);
      expect(analysis.rawAnalysis.reportDataAnalysis.reportPercentages.faturamento).toBe(90);
      expect(analysis.rawAnalysis.reportDataAnalysis.reportPercentages.reaisPorAtivo).toBe(105);
      expect(analysis.rawAnalysis.reportDataAnalysis.reportPercentages.multimarcasPorAtivo).toBe(100);
      expect(analysis.rawAnalysis.reportDataAnalysis.cycleInfo.currentDay).toBe(15);
      expect(analysis.rawAnalysis.reportDataAnalysis.cycleInfo.totalDays).toBe(21);
    });

    it('should track report data source when challenge data is not available', () => {
      const playerDataWithoutChallenges = {
        ...mockPlayerData,
        challenge_progress: []
      };

      const analysis = processorIII.analyzeCarteiraIIIIVData(playerDataWithoutChallenges, mockReportData);

      // Data source should be 'report' since challenge data is not available
      expect(analysis.rawAnalysis.challengeAnalysis.dataSource.faturamento).toBe('report');
      expect(analysis.rawAnalysis.challengeAnalysis.dataSource.reaisPorAtivo).toBe('report');
      expect(analysis.rawAnalysis.challengeAnalysis.dataSource.multimarcasPorAtivo).toBe('report');
    });

    it('should track default data source when no data is available', () => {
      const playerDataWithoutChallenges = {
        ...mockPlayerData,
        challenge_progress: []
      };

      const analysis = processorIII.analyzeCarteiraIIIIVData(playerDataWithoutChallenges);

      // Data source should be 'default' since no data is available
      expect(analysis.rawAnalysis.challengeAnalysis.dataSource.faturamento).toBe('default');
      expect(analysis.rawAnalysis.challengeAnalysis.dataSource.reaisPorAtivo).toBe('default');
      expect(analysis.rawAnalysis.challengeAnalysis.dataSource.multimarcasPorAtivo).toBe('default');
    });
  });

  describe('factory functions and singletons', () => {
    it('should create Carteira III processor via factory', () => {
      const processor = createCarteiraIIIProcessor();
      expect(processor).toBeInstanceOf(CarteiraIIIIVProcessor);
      expect(processor['teamType']).toBe(TeamType.CARTEIRA_III);
    });

    it('should create Carteira IV processor via factory', () => {
      const processor = createCarteiraIVProcessor();
      expect(processor).toBeInstanceOf(CarteiraIIIIVProcessor);
      expect(processor['teamType']).toBe(TeamType.CARTEIRA_IV);
    });

    it('should export singleton instances', () => {
      expect(carteiraIIIProcessor).toBeInstanceOf(CarteiraIIIIVProcessor);
      expect(carteiraIVProcessor).toBeInstanceOf(CarteiraIIIIVProcessor);
      expect(carteiraIIIProcessor['teamType']).toBe(TeamType.CARTEIRA_III);
      expect(carteiraIVProcessor['teamType']).toBe(TeamType.CARTEIRA_IV);
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

      const result = processorIII.processPlayerData(emptyPlayerData);

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
        team: TeamType.CARTEIRA_I // Different team type
      };

      processorIII.processPlayerData(mockPlayerData, mismatchedReportData);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Team type mismatch')
      );

      consoleSpy.mockRestore();
    });

    it('should validate and sanitize invalid percentage values', () => {
      const invalidChallengeData = {
        ...mockPlayerData,
        challenge_progress: [
          {
            challengeId: 'challenge_faturamento_c3',
            percentage: -10 // Negative value
          },
          {
            challengeId: 'challenge_reais_ativo_c3',
            percentage: NaN // Invalid value
          },
          {
            challengeId: 'challenge_multimarcas_c3',
            percentage: Infinity // Invalid value
          }
        ]
      };

      const result = processorIII.processPlayerData(invalidChallengeData);

      expect(result.primaryGoal.percentage).toBe(0); // Negative becomes 0
      expect(result.secondaryGoal1.percentage).toBe(0); // NaN becomes 0
      expect(result.secondaryGoal2.percentage).toBe(0); // Infinity becomes 0
    });

    it('should handle very high percentage values', () => {
      const highPercentageChallengeData = {
        ...mockPlayerData,
        challenge_progress: [
          {
            challengeId: 'E6F8HMK', // Carteira III & IV - Bater Meta Faturamento
            percentage: 250
          },
          {
            challengeId: 'E6Gm8RI', // Carteira I, III & IV - Subir Reais por Ativo
            percentage: 300
          },
          {
            challengeId: 'E6MMH5v', // Carteira III & IV - Subir Multimarcas por Ativo
            percentage: 200
          }
        ]
      };

      const result = processorIII.processPlayerData(highPercentageChallengeData);

      expect(result.primaryGoal.percentage).toBe(250);
      expect(result.secondaryGoal1.percentage).toBe(300);
      expect(result.secondaryGoal2.percentage).toBe(200);

      // Progress bars should handle high values correctly
      expect(result.primaryGoal.details.progressBar.color).toBe('green');
      expect(result.secondaryGoal1.details.progressBar.color).toBe('green');
      expect(result.secondaryGoal2.details.progressBar.color).toBe('green');
    });

    it('should handle missing catalog_items', () => {
      const playerDataWithoutCatalog = {
        ...mockPlayerData,
        catalog_items: {}
      };

      const result = processorIII.processPlayerData(playerDataWithoutCatalog, mockReportData);

      expect(result.pointsLocked).toBe(true); // Default to locked when no catalog items
      expect(result.secondaryGoal1.boostActive).toBe(false);
      expect(result.secondaryGoal2.boostActive).toBe(false);
    });
  });
});