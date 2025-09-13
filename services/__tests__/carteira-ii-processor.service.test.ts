import { CarteiraIIProcessor, carteiraIIProcessor } from '../carteira-ii-processor.service';
import {
  TeamType,
  FunifierPlayerStatus,
  EssenciaReportRecord,
  FUNIFIER_CONFIG
} from '../../types';

describe('CarteiraIIProcessor', () => {
  let processor: CarteiraIIProcessor;
  let mockPlayerData: FunifierPlayerStatus;
  let mockReportData: EssenciaReportRecord;

  beforeEach(() => {
    processor = new CarteiraIIProcessor();

    mockPlayerData = {
      _id: 'player789',
      name: 'Carlos Oliveira',
      total_points: 1000, // Base points
      total_challenges: 3,
      challenges: {
        'challenge_reais_ativo_c2': 120,
        'challenge_atividade_c2': 80,
        'challenge_multimarcas_c2': 90
      },
      point_categories: {},
      total_catalog_items: 4,
      catalog_items: {
        [FUNIFIER_CONFIG.CATALOG_ITEMS.UNLOCK_POINTS]: 0, // Not used for Carteira II unlock logic
        [FUNIFIER_CONFIG.CATALOG_ITEMS.BOOST_SECONDARY_1]: 1, // Boost 1 active
        [FUNIFIER_CONFIG.CATALOG_ITEMS.BOOST_SECONDARY_2]: 1  // Boost 2 active
      },
      level_progress: {
        percent_completed: 65,
        next_points: 350,
        total_levels: 10,
        percent: 65
      },
      challenge_progress: [
        {
          challengeId: 'E6MTIIK', // Carteira II - Subir Reais por Ativo
          percentage: 120,
          progress: 120,
          current: 120,
          target: 100
        },
        {
          challengeId: 'E6Gv58l', // Carteira II - Subir Atividade
          percentage: 80,
          progress: 80,
          current: 80,
          target: 100
        },
        {
          challengeId: 'E6MWJKs', // Carteira II - Subir Multimarcas por Ativo
          percentage: 90,
          progress: 90,
          current: 90,
          target: 100
        }
      ],
      teams: ['carteira_ii'],
      positions: [],
      time: Date.now(),
      extra: {},
      pointCategories: {}
    };

    mockReportData = {
      _id: 'player789_2024-01-15',
      playerId: 'player789',
      playerName: 'Carlos Oliveira',
      team: TeamType.CARTEIRA_II,
      reaisPorAtivo: 110, // Above 100% - should unlock points
      atividade: 85,
      multimarcasPorAtivo: 95,
      currentCycleDay: 8,
      totalCycleDays: 21,
      reportDate: '2024-01-15T00:00:00.000Z',
      createdAt: '2024-01-15T00:00:00.000Z',
      updatedAt: '2024-01-15T00:00:00.000Z'
    };
  });

  describe('processPlayerData', () => {
    it('should process unlocked points with both boosts active', () => {
      const result = processor.processPlayerData(mockPlayerData, mockReportData);

      expect(result.playerName).toBe('Carlos Oliveira');
      expect(result.pointsLocked).toBe(false); // Unlocked because Reais por Ativo >= 100%
      expect(result.currentCycleDay).toBe(8);
      expect(result.daysUntilCycleEnd).toBe(13); // 21 - 8

      // Points calculation: 1000 * 3 = 3000 (base * (1 + 100% + 100%))
      expect(result.totalPoints).toBe(3000);

      // Primary goal: Reais por Ativo (controls unlock)
      expect(result.primaryGoal.name).toBe('Reais por Ativo');
      expect(result.primaryGoal.percentage).toBe(110); // From report data
      expect(result.primaryGoal.boostActive).toBe(false); // Primary goal doesn't show boost
      expect(result.primaryGoal.details.isUnlockGoal).toBe(true);
      expect(result.primaryGoal.details.unlockThreshold).toBe(100);

      // Secondary goal 1: Atividade
      expect(result.secondaryGoal1.name).toBe('Atividade');
      expect(result.secondaryGoal1.percentage).toBe(85); // From report data
      expect(result.secondaryGoal1.boostActive).toBe(true); // Boost 1 active

      // Secondary goal 2: Multimarcas por Ativo
      expect(result.secondaryGoal2.name).toBe('Multimarcas por Ativo');
      expect(result.secondaryGoal2.percentage).toBe(95); // From report data
      expect(result.secondaryGoal2.boostActive).toBe(true); // Boost 2 active
    });

    it('should keep points locked when Reais por Ativo < 100%', () => {
      const lockedReportData = {
        ...mockReportData,
        reaisPorAtivo: 85 // Below 100% - should keep points locked
      };

      const result = processor.processPlayerData(mockPlayerData, lockedReportData);

      expect(result.pointsLocked).toBe(true); // Locked because Reais por Ativo < 100%
      expect(result.totalPoints).toBe(1000); // No boost applied, original points
      expect(result.primaryGoal.percentage).toBe(85);
    });

    it('should handle single boost scenarios', () => {
      const singleBoostPlayerData = {
        ...mockPlayerData,
        catalog_items: {
          [FUNIFIER_CONFIG.CATALOG_ITEMS.BOOST_SECONDARY_1]: 1, // Only boost 1 active
          [FUNIFIER_CONFIG.CATALOG_ITEMS.BOOST_SECONDARY_2]: 0  // Boost 2 inactive
        }
      };

      const result = processor.processPlayerData(singleBoostPlayerData, mockReportData);

      expect(result.pointsLocked).toBe(false); // Still unlocked
      expect(result.totalPoints).toBe(2000); // 1000 * 2 (base * (1 + 100%))
      expect(result.secondaryGoal1.boostActive).toBe(true); // Boost 1 active
      expect(result.secondaryGoal2.boostActive).toBe(false); // Boost 2 inactive
    });

    it('should handle no boosts scenario', () => {
      const noBoostPlayerData = {
        ...mockPlayerData,
        catalog_items: {
          [FUNIFIER_CONFIG.CATALOG_ITEMS.BOOST_SECONDARY_1]: 0, // Boost 1 inactive
          [FUNIFIER_CONFIG.CATALOG_ITEMS.BOOST_SECONDARY_2]: 0  // Boost 2 inactive
        }
      };

      const result = processor.processPlayerData(noBoostPlayerData, mockReportData);

      expect(result.pointsLocked).toBe(false); // Still unlocked
      expect(result.totalPoints).toBe(1000); // 1000 * 1 (no boost multiplier)
      expect(result.secondaryGoal1.boostActive).toBe(false);
      expect(result.secondaryGoal2.boostActive).toBe(false);
    });

    it('should prioritize report data over challenge progress', () => {
      // Report data has different values than challenge progress
      const result = processor.processPlayerData(mockPlayerData, mockReportData);

      // Should use report data values, not challenge progress values
      expect(result.primaryGoal.percentage).toBe(110); // Report: 110, Challenge: 120
      expect(result.secondaryGoal1.percentage).toBe(85); // Report: 85, Challenge: 80
      expect(result.secondaryGoal2.percentage).toBe(95); // Report: 95, Challenge: 90
    });

    it('should fallback to challenge progress when no report data', () => {
      const result = processor.processPlayerData(mockPlayerData);

      // Should use challenge progress values
      expect(result.primaryGoal.percentage).toBe(120); // From challenge progress
      expect(result.secondaryGoal1.percentage).toBe(80); // From challenge progress
      expect(result.secondaryGoal2.percentage).toBe(90); // From challenge progress
    });

    it('should handle edge case at exactly 100% unlock threshold', () => {
      const exactThresholdReportData = {
        ...mockReportData,
        reaisPorAtivo: 100 // Exactly 100% - should unlock
      };

      const result = processor.processPlayerData(mockPlayerData, exactThresholdReportData);

      expect(result.pointsLocked).toBe(false); // Should be unlocked at exactly 100%
      expect(result.totalPoints).toBe(3000); // Full boost applied
      expect(result.primaryGoal.percentage).toBe(100);
    });

    it('should handle edge case just below unlock threshold', () => {
      const belowThresholdReportData = {
        ...mockReportData,
        reaisPorAtivo: 99.9 // Just below 100% - should stay locked
      };

      const result = processor.processPlayerData(mockPlayerData, belowThresholdReportData);

      expect(result.pointsLocked).toBe(true); // Should be locked
      expect(result.totalPoints).toBe(1000); // No boost applied
      expect(result.primaryGoal.percentage).toBe(99.9);
    });

    it('should validate and sanitize invalid percentage values', () => {
      const invalidReportData = {
        ...mockReportData,
        reaisPorAtivo: -10, // Negative value
        atividade: NaN, // Invalid value
        multimarcasPorAtivo: Infinity // Invalid value
      };

      const result = processor.processPlayerData(mockPlayerData, invalidReportData);

      expect(result.primaryGoal.percentage).toBe(0); // Negative becomes 0
      expect(result.secondaryGoal1.percentage).toBe(0); // NaN becomes 0
      expect(result.secondaryGoal2.percentage).toBe(0); // Infinity becomes 0
      expect(result.pointsLocked).toBe(true); // Locked because 0 < 100%
    });

    it('should create correct progress bar configurations', () => {
      const result = processor.processPlayerData(mockPlayerData, mockReportData);

      // Reais por Ativo: 110% -> green color
      expect(result.primaryGoal.details.progressBar.color).toBe('green');
      expect(result.primaryGoal.details.progressBar.percentage).toBe(110);

      // Atividade: 85% -> yellow color
      expect(result.secondaryGoal1.details.progressBar.color).toBe('yellow');
      expect(result.secondaryGoal1.details.progressBar.percentage).toBe(85);

      // Multimarcas por Ativo: 95% -> yellow color
      expect(result.secondaryGoal2.details.progressBar.color).toBe('yellow');
      expect(result.secondaryGoal2.details.progressBar.percentage).toBe(95);
    });

    it('should include correct challenge IDs in goal details', () => {
      const result = processor.processPlayerData(mockPlayerData, mockReportData);

      expect(result.primaryGoal.details.challengeIds).toEqual(['E6MTIIK']);
      expect(result.secondaryGoal1.details.challengeIds).toEqual(['E6Gv58l', 'E6MZw2L']);
      expect(result.secondaryGoal2.details.challengeIds).toEqual(['E6MWJKs', 'E6MWYj3']);
    });
  });

  describe('analyzeCarteiraIIData', () => {
    it('should provide comprehensive analysis with local calculations', () => {
      const analysis = processor.analyzeCarteiraIIData(mockPlayerData, mockReportData);

      expect(analysis.playerMetrics).toBeDefined();
      expect(analysis.rawAnalysis).toBeDefined();

      // Local calculations analysis
      expect(analysis.rawAnalysis.localCalculations.basePoints).toBe(1000);
      expect(analysis.rawAnalysis.localCalculations.finalPoints).toBe(3000);
      expect(analysis.rawAnalysis.localCalculations.pointsUnlocked).toBe(true);
      expect(analysis.rawAnalysis.localCalculations.unlockThreshold).toBe(100);
      expect(analysis.rawAnalysis.localCalculations.reaisPorAtivoPercentage).toBe(110);

      // Boost analysis
      expect(analysis.rawAnalysis.localCalculations.boostAnalysis.boost1Active).toBe(true);
      expect(analysis.rawAnalysis.localCalculations.boostAnalysis.boost2Active).toBe(true);
      expect(analysis.rawAnalysis.localCalculations.boostAnalysis.totalActiveBoosts).toBe(2);
      expect(analysis.rawAnalysis.localCalculations.boostAnalysis.boostMultiplier).toBe(3);
      expect(analysis.rawAnalysis.localCalculations.boostAnalysis.pointsFromBoosts).toBe(2000); // 3000 - 1000

      // Calculation steps
      expect(analysis.rawAnalysis.localCalculations.calculationSteps.step1_checkUnlock.reaisPorAtivoPercentage).toBe(110);
      expect(analysis.rawAnalysis.localCalculations.calculationSteps.step1_checkUnlock.threshold).toBe(100);
      expect(analysis.rawAnalysis.localCalculations.calculationSteps.step1_checkUnlock.unlocked).toBe(true);

      expect(analysis.rawAnalysis.localCalculations.calculationSteps.step2_calculateBoosts.boost1Active).toBe(true);
      expect(analysis.rawAnalysis.localCalculations.calculationSteps.step2_calculateBoosts.boost2Active).toBe(true);
      expect(analysis.rawAnalysis.localCalculations.calculationSteps.step2_calculateBoosts.multiplier).toBe(3);

      expect(analysis.rawAnalysis.localCalculations.calculationSteps.step3_calculateFinalPoints.basePoints).toBe(1000);
      expect(analysis.rawAnalysis.localCalculations.calculationSteps.step3_calculateFinalPoints.multiplier).toBe(3);
      expect(analysis.rawAnalysis.localCalculations.calculationSteps.step3_calculateFinalPoints.finalPoints).toBe(3000);

      // Data source tracking
      expect(analysis.rawAnalysis.challengeAnalysis.dataSource.reaisPorAtivo).toBe('report');
      expect(analysis.rawAnalysis.challengeAnalysis.dataSource.atividade).toBe('report');
      expect(analysis.rawAnalysis.challengeAnalysis.dataSource.multimarcasPorAtivo).toBe('report');
    });

    it('should track challenge data source when no report data', () => {
      const analysis = processor.analyzeCarteiraIIData(mockPlayerData);

      expect(analysis.rawAnalysis.challengeAnalysis.dataSource.reaisPorAtivo).toBe('challenge');
      expect(analysis.rawAnalysis.challengeAnalysis.dataSource.atividade).toBe('challenge');
      expect(analysis.rawAnalysis.challengeAnalysis.dataSource.multimarcasPorAtivo).toBe('challenge');
    });

    it('should show locked scenario in analysis', () => {
      const lockedReportData = {
        ...mockReportData,
        reaisPorAtivo: 85 // Below threshold
      };

      const analysis = processor.analyzeCarteiraIIData(mockPlayerData, lockedReportData);

      expect(analysis.rawAnalysis.localCalculations.pointsUnlocked).toBe(false);
      expect(analysis.rawAnalysis.localCalculations.finalPoints).toBe(1000); // Same as base
      expect(analysis.rawAnalysis.localCalculations.boostAnalysis.pointsFromBoosts).toBe(0);
      expect(analysis.rawAnalysis.localCalculations.calculationSteps.step1_checkUnlock.unlocked).toBe(false);
    });
  });

  describe('simulateCarteiraIIScenarios', () => {
    it('should simulate all boost scenarios for unlocked points', () => {
      const scenarios = processor.simulateCarteiraIIScenarios(1000, 110); // Above threshold

      expect(scenarios).toHaveLength(4);

      // No boosts
      expect(scenarios[0].scenario).toBe('No boosts');
      expect(scenarios[0].pointsUnlocked).toBe(true);
      expect(scenarios[0].boostMultiplier).toBe(1);
      expect(scenarios[0].finalPoints).toBe(1000);

      // Boost 1 only
      expect(scenarios[1].scenario).toBe('Boost 1 only');
      expect(scenarios[1].pointsUnlocked).toBe(true);
      expect(scenarios[1].boostMultiplier).toBe(2);
      expect(scenarios[1].finalPoints).toBe(2000);

      // Boost 2 only
      expect(scenarios[2].scenario).toBe('Boost 2 only');
      expect(scenarios[2].pointsUnlocked).toBe(true);
      expect(scenarios[2].boostMultiplier).toBe(2);
      expect(scenarios[2].finalPoints).toBe(2000);

      // Both boosts
      expect(scenarios[3].scenario).toBe('Both boosts');
      expect(scenarios[3].pointsUnlocked).toBe(true);
      expect(scenarios[3].boostMultiplier).toBe(3);
      expect(scenarios[3].finalPoints).toBe(3000);
    });

    it('should simulate all scenarios for locked points', () => {
      const scenarios = processor.simulateCarteiraIIScenarios(1000, 85); // Below threshold

      expect(scenarios).toHaveLength(4);

      // All scenarios should have locked points and no boost effect
      scenarios.forEach(scenario => {
        expect(scenario.pointsUnlocked).toBe(false);
        expect(scenario.boostMultiplier).toBe(1);
        expect(scenario.finalPoints).toBe(1000); // Original points
      });
    });

    it('should simulate edge case at exactly 100%', () => {
      const scenarios = processor.simulateCarteiraIIScenarios(1000, 100); // Exactly at threshold

      scenarios.forEach(scenario => {
        expect(scenario.pointsUnlocked).toBe(true); // Should be unlocked at exactly 100%
      });

      expect(scenarios[3].finalPoints).toBe(3000); // Both boosts scenario
    });
  });

  describe('singleton instance', () => {
    it('should export a singleton instance', () => {
      expect(carteiraIIProcessor).toBeInstanceOf(CarteiraIIProcessor);
      expect(carteiraIIProcessor).toBe(carteiraIIProcessor); // Same instance
    });

    it('should have correct team type', () => {
      expect(carteiraIIProcessor['teamType']).toBe(TeamType.CARTEIRA_II);
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
      expect(result.pointsLocked).toBe(true); // Locked because 0 < 100%
      expect(result.primaryGoal.percentage).toBe(0);
      expect(result.secondaryGoal1.percentage).toBe(0);
      expect(result.secondaryGoal2.percentage).toBe(0);
    });

    it('should handle very high percentage values', () => {
      const highPercentageReportData = {
        ...mockReportData,
        reaisPorAtivo: 250,
        atividade: 300,
        multimarcasPorAtivo: 200
      };

      const result = processor.processPlayerData(mockPlayerData, highPercentageReportData);

      expect(result.primaryGoal.percentage).toBe(250);
      expect(result.secondaryGoal1.percentage).toBe(300);
      expect(result.secondaryGoal2.percentage).toBe(200);
      expect(result.pointsLocked).toBe(false); // Still unlocked
      expect(result.totalPoints).toBe(3000); // Full boost applied

      // Progress bars should handle high values correctly
      expect(result.primaryGoal.details.progressBar.color).toBe('green');
      expect(result.secondaryGoal1.details.progressBar.color).toBe('green');
      expect(result.secondaryGoal2.details.progressBar.color).toBe('green');
    });

    it('should handle team type mismatch warning', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const mismatchedReportData = {
        ...mockReportData,
        team: TeamType.CARTEIRA_I // Different team type
      };

      processor.processPlayerData(mockPlayerData, mismatchedReportData);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Team type mismatch')
      );

      consoleSpy.mockRestore();
    });

    it('should handle missing catalog_items', () => {
      const playerDataWithoutCatalog = {
        ...mockPlayerData,
        catalog_items: {}
      };

      const result = processor.processPlayerData(playerDataWithoutCatalog, mockReportData);

      expect(result.secondaryGoal1.boostActive).toBe(false);
      expect(result.secondaryGoal2.boostActive).toBe(false);
      expect(result.totalPoints).toBe(1000); // No boost applied
    });

    it('should handle rounding in points calculation', () => {
      const oddBasePointsData = {
        ...mockPlayerData,
        total_points: 333 // Odd number that might cause rounding issues
      };

      const result = processor.processPlayerData(oddBasePointsData, mockReportData);

      expect(result.totalPoints).toBe(999); // 333 * 3 = 999 (rounded)
      expect(Number.isInteger(result.totalPoints)).toBe(true);
    });
  });
});