import {
  TeamType,
  PlayerMetrics,
  FunifierPlayerStatus,
  EssenciaReportRecord,
  DashboardConfig,
  FUNIFIER_CONFIG
} from '../types';
import { BaseTeamProcessor, CHALLENGE_MAPPING, TeamProcessorUtils } from './team-processor.service';

/**
 * Carteira II Team Processor with Local Calculations
 * 
 * Processing logic (special case):
 * - Primary goal: Reais por ativo (controls point unlock, from collection data)
 * - Secondary goal 1: Atividade (from collection data)
 * - Secondary goal 2: Multimarcas por ativo (from collection data)
 * - Points unlock logic: unlock when Reais por Ativo >= 100%
 * - Boost multiplier logic: +100% per active boost (max 200% with both boosts)
 * - Final points: base_points * (1 + boost_multipliers) only if unlocked
 * - Boost status: from catalog_items for secondary goals
 */
export class CarteiraIIProcessor extends BaseTeamProcessor {
  constructor() {
    super(TeamType.CARTEIRA_II);
  }

  processPlayerData(
    rawData: FunifierPlayerStatus,
    reportData?: EssenciaReportRecord,
    teamConfig?: DashboardConfig
  ): PlayerMetrics {
    this.validateTeamType(reportData);

    const playerName = rawData.name;
    const basePoints = rawData.total_points || 0;
    const currentCycleDay = this.getCurrentCycleDay(reportData);
    const daysUntilCycleEnd = this.getDaysUntilCycleEnd(reportData);

    // Extract goal percentages (prioritize collection/report data)
    const reaisPorAtivoPercentage = this.extractReaisPorAtivoPercentage(rawData, reportData);
    const atividadePercentage = this.extractAtividadePercentage(rawData, reportData);
    const multimarcasPorAtivoPercentage = this.extractMultimarcasPorAtivoPercentage(rawData, reportData);

    // Extract boost status from catalog_items
    const boost1Active = this.isBoostActive(
      rawData.catalog_items || {}, 
      'secondary1',
      teamConfig?.secondaryGoal1.boost.catalogItemId
    );
    const boost2Active = this.isBoostActive(
      rawData.catalog_items || {}, 
      'secondary2',
      teamConfig?.secondaryGoal2.boost.catalogItemId
    );

    // Calculate local points processing
    const pointsCalculation = this.calculateCarteiraIIPoints(
      basePoints,
      reaisPorAtivoPercentage,
      boost1Active,
      boost2Active
    );

    // Create goal metrics
    const primaryGoal = this.createGoalMetric(
      'Reais por Ativo',
      reaisPorAtivoPercentage,
      false, // Primary goal doesn't have boost visual indicator
      {
        isMainGoal: true,
        isUnlockGoal: true, // This goal controls point unlock
        unlockThreshold: 100,
        challengeIds: CHALLENGE_MAPPING[TeamType.CARTEIRA_II].reaisPorAtivo
      }
    );

    const secondaryGoal1 = this.createGoalMetric(
      'Atividade',
      atividadePercentage,
      boost1Active,
      {
        boostItemId: FUNIFIER_CONFIG.CATALOG_ITEMS.BOOST_SECONDARY_1,
        challengeIds: CHALLENGE_MAPPING[TeamType.CARTEIRA_II].atividade
      }
    );

    const secondaryGoal2 = this.createGoalMetric(
      'Multimarcas por Ativo',
      multimarcasPorAtivoPercentage,
      boost2Active,
      {
        boostItemId: FUNIFIER_CONFIG.CATALOG_ITEMS.BOOST_SECONDARY_2,
        challengeIds: CHALLENGE_MAPPING[TeamType.CARTEIRA_II].multimarcasPorAtivo
      }
    );

    return {
      playerName,
      totalPoints: pointsCalculation.finalPoints,
      pointsLocked: pointsCalculation.locked,
      currentCycleDay,
      daysUntilCycleEnd,
      primaryGoal,
      secondaryGoal1,
      secondaryGoal2
    };
  }

  /**
   * Calculate Carteira II points with local processing logic
   */
  private calculateCarteiraIIPoints(
    basePoints: number,
    reaisPorAtivoPercentage: number,
    boost1Active: boolean,
    boost2Active: boolean
  ): {
    basePoints: number;
    finalPoints: number;
    locked: boolean;
    unlocked: boolean;
    boostMultiplier: number;
    boost1Active: boolean;
    boost2Active: boolean;
  } {
    // Points unlock when Reais por Ativo >= 100%
    const unlocked = TeamProcessorUtils.shouldUnlockCarteiraIIPoints(reaisPorAtivoPercentage);
    const locked = !unlocked;

    if (locked) {
      return {
        basePoints,
        finalPoints: basePoints,
        locked: true,
        unlocked: false,
        boostMultiplier: 1,
        boost1Active,
        boost2Active
      };
    }

    // Calculate boost multiplier: +100% per active boost (max 200% with both boosts)
    const boostMultiplier = TeamProcessorUtils.calculateCarteiraIIBoostMultiplier(
      boost1Active,
      boost2Active
    );

    // Final points: base_points * (1 + boost_multipliers) only if unlocked
    const finalPoints = Math.round(basePoints * boostMultiplier);

    return {
      basePoints,
      finalPoints,
      locked: false,
      unlocked: true,
      boostMultiplier,
      boost1Active,
      boost2Active
    };
  }

  /**
   * Extract Reais por ativo percentage (primary goal that controls unlock)
   */
  private extractReaisPorAtivoPercentage(
    rawData: FunifierPlayerStatus,
    reportData?: EssenciaReportRecord
  ): number {
    // Priority 1: Report/collection data (most accurate for Carteira II)
    if (reportData?.reaisPorAtivo !== undefined) {
      return this.validatePercentage(reportData.reaisPorAtivo);
    }

    // Priority 2: Challenge progress from Funifier (fallback)
    const challengeIds = CHALLENGE_MAPPING[TeamType.CARTEIRA_II].reaisPorAtivo;
    const challengePercentage = this.extractChallengePercentage(
      rawData.challenge_progress || [],
      challengeIds,
      0
    );

    return this.validatePercentage(challengePercentage);
  }

  /**
   * Extract Atividade percentage (secondary goal from collection data)
   */
  private extractAtividadePercentage(
    rawData: FunifierPlayerStatus,
    reportData?: EssenciaReportRecord
  ): number {
    // Priority 1: Report/collection data (most accurate for Carteira II)
    if (reportData?.atividade !== undefined) {
      return this.validatePercentage(reportData.atividade);
    }

    // Priority 2: Challenge progress from Funifier (fallback)
    const challengeIds = CHALLENGE_MAPPING[TeamType.CARTEIRA_II].atividade;
    const challengePercentage = this.extractChallengePercentage(
      rawData.challenge_progress || [],
      challengeIds,
      0
    );

    return this.validatePercentage(challengePercentage);
  }

  /**
   * Extract Multimarcas por ativo percentage (secondary goal from collection data)
   */
  private extractMultimarcasPorAtivoPercentage(
    rawData: FunifierPlayerStatus,
    reportData?: EssenciaReportRecord
  ): number {
    // Priority 1: Report/collection data (most accurate for Carteira II)
    if (reportData?.multimarcasPorAtivo !== undefined) {
      return this.validatePercentage(reportData.multimarcasPorAtivo);
    }

    // Priority 2: Challenge progress from Funifier (fallback)
    const challengeIds = CHALLENGE_MAPPING[TeamType.CARTEIRA_II].multimarcasPorAtivo;
    const challengePercentage = this.extractChallengePercentage(
      rawData.challenge_progress || [],
      challengeIds,
      0
    );

    return this.validatePercentage(challengePercentage);
  }

  /**
   * Validate and sanitize percentage values
   */
  private validatePercentage(percentage: number): number {
    return TeamProcessorUtils.validatePercentage(percentage);
  }

  /**
   * Get detailed analysis of Carteira II player data with local calculations
   */
  public analyzeCarteiraIIData(
    rawData: FunifierPlayerStatus,
    reportData?: EssenciaReportRecord
  ): {
    playerMetrics: PlayerMetrics;
    rawAnalysis: {
      catalogItemsAnalysis: {
        unlockStatus: boolean;
        boost1Status: boolean;
        boost2Status: boolean;
        unlockItemCount: number;
        boost1ItemCount: number;
        boost2ItemCount: number;
      };
      challengeAnalysis: {
        totalChallenges: number;
        challengeProgress: any[];
        extractedPercentages: {
          reaisPorAtivo: number;
          atividade: number;
          multimarcasPorAtivo: number;
        };
        dataSource: {
          reaisPorAtivo: 'challenge' | 'report' | 'default';
          atividade: 'challenge' | 'report' | 'default';
          multimarcasPorAtivo: 'challenge' | 'report' | 'default';
        };
      };
      reportDataAnalysis: {
        hasReportData: boolean;
        reportPercentages: {
          reaisPorAtivo?: number;
          atividade?: number;
          multimarcasPorAtivo?: number;
        };
        cycleInfo: {
          currentDay?: number;
          totalDays?: number;
        };
      };
      localCalculations: {
        basePoints: number;
        finalPoints: number;
        pointsUnlocked: boolean;
        unlockThreshold: number;
        reaisPorAtivoPercentage: number;
        boostAnalysis: {
          boost1Active: boolean;
          boost2Active: boolean;
          totalActiveBoosts: number;
          boostMultiplier: number;
          pointsFromBoosts: number;
        };
        calculationSteps: {
          step1_checkUnlock: {
            reaisPorAtivoPercentage: number;
            threshold: number;
            unlocked: boolean;
          };
          step2_calculateBoosts: {
            boost1Active: boolean;
            boost2Active: boolean;
            multiplier: number;
          };
          step3_calculateFinalPoints: {
            basePoints: number;
            multiplier: number;
            finalPoints: number;
          };
        };
      };
    };
  } {
    const playerMetrics = this.processPlayerData(rawData, reportData);
    const catalogItems = rawData.catalog_items || {};

    // Extract percentages for analysis
    const reaisPorAtivoPercentage = this.extractReaisPorAtivoPercentage(rawData, reportData);
    const atividadePercentage = this.extractAtividadePercentage(rawData, reportData);
    const multimarcasPorAtivoPercentage = this.extractMultimarcasPorAtivoPercentage(rawData, reportData);

    // Determine data sources
    const challengeIds = CHALLENGE_MAPPING[TeamType.CARTEIRA_II];
    const reaisPorAtivoFromChallenge = this.extractChallengePercentage(
      rawData.challenge_progress || [],
      challengeIds.reaisPorAtivo
    );
    const atividadeFromChallenge = this.extractChallengePercentage(
      rawData.challenge_progress || [],
      challengeIds.atividade
    );
    const multimarcasFromChallenge = this.extractChallengePercentage(
      rawData.challenge_progress || [],
      challengeIds.multimarcasPorAtivo
    );

    // Boost analysis
    const boost1Active = this.isBoostActive(catalogItems, 'secondary1');
    const boost2Active = this.isBoostActive(catalogItems, 'secondary2');
    const boostMultiplier = TeamProcessorUtils.calculateCarteiraIIBoostMultiplier(boost1Active, boost2Active);
    const basePoints = rawData.total_points || 0;
    const pointsUnlocked = TeamProcessorUtils.shouldUnlockCarteiraIIPoints(reaisPorAtivoPercentage);
    const finalPoints = pointsUnlocked ? Math.round(basePoints * boostMultiplier) : basePoints;

    return {
      playerMetrics,
      rawAnalysis: {
        catalogItemsAnalysis: {
          unlockStatus: !this.calculatePointsLocked(catalogItems),
          boost1Status: boost1Active,
          boost2Status: boost2Active,
          unlockItemCount: catalogItems[FUNIFIER_CONFIG.CATALOG_ITEMS.UNLOCK_POINTS] || 0,
          boost1ItemCount: catalogItems[FUNIFIER_CONFIG.CATALOG_ITEMS.BOOST_SECONDARY_1] || 0,
          boost2ItemCount: catalogItems[FUNIFIER_CONFIG.CATALOG_ITEMS.BOOST_SECONDARY_2] || 0
        },
        challengeAnalysis: {
          totalChallenges: rawData.total_challenges || 0,
          challengeProgress: rawData.challenge_progress || [],
          extractedPercentages: {
            reaisPorAtivo: reaisPorAtivoPercentage,
            atividade: atividadePercentage,
            multimarcasPorAtivo: multimarcasPorAtivoPercentage
          },
          dataSource: {
            reaisPorAtivo: reportData?.reaisPorAtivo !== undefined ? 'report' : 
                          (reaisPorAtivoFromChallenge > 0 ? 'challenge' : 'default'),
            atividade: reportData?.atividade !== undefined ? 'report' : 
                      (atividadeFromChallenge > 0 ? 'challenge' : 'default'),
            multimarcasPorAtivo: reportData?.multimarcasPorAtivo !== undefined ? 'report' : 
                                (multimarcasFromChallenge > 0 ? 'challenge' : 'default')
          }
        },
        reportDataAnalysis: {
          hasReportData: !!reportData,
          reportPercentages: {
            reaisPorAtivo: reportData?.reaisPorAtivo,
            atividade: reportData?.atividade,
            multimarcasPorAtivo: reportData?.multimarcasPorAtivo
          },
          cycleInfo: {
            currentDay: reportData?.currentCycleDay,
            totalDays: reportData?.totalCycleDays
          }
        },
        localCalculations: {
          basePoints,
          finalPoints,
          pointsUnlocked,
          unlockThreshold: 100,
          reaisPorAtivoPercentage,
          boostAnalysis: {
            boost1Active,
            boost2Active,
            totalActiveBoosts: (boost1Active ? 1 : 0) + (boost2Active ? 1 : 0),
            boostMultiplier,
            pointsFromBoosts: finalPoints - basePoints
          },
          calculationSteps: {
            step1_checkUnlock: {
              reaisPorAtivoPercentage,
              threshold: 100,
              unlocked: pointsUnlocked
            },
            step2_calculateBoosts: {
              boost1Active,
              boost2Active,
              multiplier: boostMultiplier
            },
            step3_calculateFinalPoints: {
              basePoints,
              multiplier: boostMultiplier,
              finalPoints
            }
          }
        }
      }
    };
  }

  /**
   * Simulate different scenarios for Carteira II calculations
   */
  public simulateCarteiraIIScenarios(
    basePoints: number,
    reaisPorAtivoPercentage: number
  ): {
    scenario: string;
    reaisPorAtivoPercentage: number;
    boost1Active: boolean;
    boost2Active: boolean;
    pointsUnlocked: boolean;
    boostMultiplier: number;
    finalPoints: number;
  }[] {
    const scenarios = [
      { name: 'No boosts', boost1: false, boost2: false },
      { name: 'Boost 1 only', boost1: true, boost2: false },
      { name: 'Boost 2 only', boost1: false, boost2: true },
      { name: 'Both boosts', boost1: true, boost2: true }
    ];

    return scenarios.map(scenario => {
      const pointsUnlocked = TeamProcessorUtils.shouldUnlockCarteiraIIPoints(reaisPorAtivoPercentage);
      const boostMultiplier = pointsUnlocked 
        ? TeamProcessorUtils.calculateCarteiraIIBoostMultiplier(scenario.boost1, scenario.boost2)
        : 1;
      const finalPoints = pointsUnlocked ? Math.round(basePoints * boostMultiplier) : basePoints;

      return {
        scenario: scenario.name,
        reaisPorAtivoPercentage,
        boost1Active: scenario.boost1,
        boost2Active: scenario.boost2,
        pointsUnlocked,
        boostMultiplier,
        finalPoints
      };
    });
  }
}

// Export singleton instance
export const carteiraIIProcessor = new CarteiraIIProcessor();