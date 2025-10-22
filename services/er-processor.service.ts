import {
  TeamType,
  PlayerMetrics,
  FunifierPlayerStatus,
  EssenciaReportRecord,
  FUNIFIER_CONFIG
} from '../types';
import { BaseTeamProcessor, CHALLENGE_MAPPING } from './team-processor.service';

/**
 * ER Team Processor
 * 
 * Processing logic:
 * - Primary goal: Faturamento (from challenge_progress or report data)
 * - Secondary goal 1: Reais por Ativo (from challenge_progress or report data)
 * - Secondary goal 2: UPA (from challenge_progress or report data)
 * - Points and lock status: directly from Funifier catalog_items
 * - Boost status: from catalog_items (presence of boost items indicates goal completion)
 * 
 * Reuses existing challenge IDs from Carteira III/IV for Faturamento and Reais por Ativo
 * Uses new challenge ID E62x2PW for UPA metric
 */
export class ERProcessor extends BaseTeamProcessor {
  constructor() {
    super(TeamType.ER);
  }

  processPlayerData(
    rawData: FunifierPlayerStatus,
    reportData?: EssenciaReportRecord
  ): PlayerMetrics {
    this.validateTeamType(reportData);

    const playerName = rawData.name;
    const pointsLocked = this.calculatePointsLocked(rawData.catalog_items || {});
    
    // Calculate the appropriate points to display based on lock status
    const totalPoints = this.calculateDisplayPoints(rawData, pointsLocked);
    
    const currentCycleDay = this.getCurrentCycleDay(reportData);
    const daysUntilCycleEnd = this.getDaysUntilCycleEnd(reportData);

    // Extract goal percentage
    const faturamentoPercentage = this.extractFaturamentoPercentage(rawData, reportData);
    const reaisPorAtivoPercentage = this.extractReaisPorAtivoPercentage(rawData, reportData);
    const upaPercentage = this.extractUpaPercentage(rawData, reportData);

    // Extract boost status from catalog_items
    const boost1Active = this.isBoostActive(rawData.catalog_items || {}, 'secondary1');
    const boost2Active = this.isBoostActive(rawData.catalog_items || {}, 'secondary2');

    // Create goal metrics
    const primaryGoal = this.createGoalMetric(
      'Faturamento',
      faturamentoPercentage,
      false, // Primary goal doesn't have boost visual indicator
      {
        isMainGoal: true,
        challengeIds: CHALLENGE_MAPPING[TeamType.ER].faturamento
      }
    );

    const secondaryGoal1 = this.createGoalMetric(
      'Reais por Ativo',
      reaisPorAtivoPercentage,
      boost1Active,
      {
        boostItemId: FUNIFIER_CONFIG.CATALOG_ITEMS.BOOST_SECONDARY_1,
        challengeIds: CHALLENGE_MAPPING[TeamType.ER].reaisPorAtivo
      }
    );

    const secondaryGoal2 = this.createGoalMetric(
      'UPA',
      upaPercentage,
      boost2Active,
      {
        boostItemId: FUNIFIER_CONFIG.CATALOG_ITEMS.BOOST_SECONDARY_2,
        challengeIds: CHALLENGE_MAPPING[TeamType.ER].upa
      }
    );

    return {
      playerName,
      totalPoints,
      pointsLocked,
      currentCycleDay,
      daysUntilCycleEnd,
      primaryGoal,
      secondaryGoal1,
      secondaryGoal2
    };
  }

  /**
   * Extract Faturamento goal percentage from challenge_progress or report data
   * Reuses Carteira III/IV challenge IDs for consistency
   */
  private extractFaturamentoPercentage(
    rawData: FunifierPlayerStatus,
    reportData?: EssenciaReportRecord
  ): number {
    // Priority 1: Funifier challenge progress (primary source)
    const challengeIds = CHALLENGE_MAPPING[TeamType.ER].faturamento;
    const challengeFound = this.hasChallengeData(rawData.challenge_progress || [], challengeIds);

    if (challengeFound) {
      const challengePercentage = this.extractChallengePercentage(
        rawData.challenge_progress || [],
        challengeIds
      );
      console.log('📈 ER Faturamento from Funifier challenge:', challengePercentage);
      return this.validatePercentage(challengePercentage);
    }

    // Priority 2: Report data (fallback when Funifier data is missing)
    if (reportData?.faturamento !== undefined) {
      console.log('📈 ER Faturamento from report data:', reportData.faturamento);
      return this.validatePercentage(reportData.faturamento);
    }

    console.log('📈 No ER Faturamento data found, using 0');
    return 0;
  }

  /**
   * Extract Reais por ativo goal percentage from challenge_progress or report data
   * Reuses Carteira III/IV challenge IDs for consistency
   */
  private extractReaisPorAtivoPercentage(
    rawData: FunifierPlayerStatus,
    reportData?: EssenciaReportRecord
  ): number {
    // Priority 1: Funifier challenge progress (primary source)
    const challengeIds = CHALLENGE_MAPPING[TeamType.ER].reaisPorAtivo;
    const challengeFound = this.hasChallengeData(rawData.challenge_progress || [], challengeIds);

    if (challengeFound) {
      const challengePercentage = this.extractChallengePercentage(
        rawData.challenge_progress || [],
        challengeIds
      );
      console.log('💰 ER Reais por Ativo from Funifier challenge:', challengePercentage);
      return this.validatePercentage(challengePercentage);
    }

    // Priority 2: Report data (fallback when Funifier data is missing)
    if (reportData?.reaisPorAtivo !== undefined) {
      console.log('💰 ER Reais por Ativo from report data:', reportData.reaisPorAtivo);
      return this.validatePercentage(reportData.reaisPorAtivo);
    }

    console.log('💰 No ER Reais por Ativo data found, using 0');
    return 0;
  }

  /**
   * Extract UPA goal percentage from challenge_progress or report data
   * Uses new challenge ID E62x2PW for UPA metric
   */
  private extractUpaPercentage(
    rawData: FunifierPlayerStatus,
    reportData?: EssenciaReportRecord
  ): number {
    // Priority 1: Funifier challenge progress (primary source)
    const challengeIds = CHALLENGE_MAPPING[TeamType.ER].upa;
    const challengeFound = this.hasChallengeData(rawData.challenge_progress || [], challengeIds);

    if (challengeFound) {
      const challengePercentage = this.extractChallengePercentage(
        rawData.challenge_progress || [],
        challengeIds
      );
      console.log('🎯 ER UPA from Funifier challenge:', challengePercentage);
      return this.validatePercentage(challengePercentage);
    }

    // Priority 2: Report data (fallback when Funifier data is missing)
    if (reportData?.upa !== undefined) {
      console.log('🎯 ER UPA from report data:', reportData.upa);
      return this.validatePercentage(reportData.upa);
    }

    console.log('🎯 No ER UPA data found, using 0');
    return 0;
  }

  /**
   * Check if challenge data exists for given challenge IDs
   */
  private hasChallengeData(challengeProgress: any[], challengeIds: string[]): boolean {
    console.log('🔍 ER - Checking for challenge data:', {
      challengeIds,
      availableChallenges: challengeProgress.map(p => ({
        id: p.challenge || p.challengeId || p.id,
        percentage: p.percent_completed || p.percentage || p.progress
      }))
    });

    const found = challengeProgress.some(progress =>
      challengeIds.includes(progress.challenge || progress.challengeId || progress.id)
    );

    console.log('🎯 ER - Challenge data found:', found);
    return found;
  }

  /**
   * Validate and sanitize percentage values
   */
  private validatePercentage(percentage: number): number {
    if (isNaN(percentage) || !isFinite(percentage)) {
      return 0;
    }
    return Math.max(0, percentage);
  }

  /**
   * Get detailed analysis of ER player data
   */
  public analyzeERData(
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
          faturamento: number;
          reaisPorAtivo: number;
          upa: number;
        };
        dataSource: {
          faturamento: 'challenge' | 'report' | 'default';
          reaisPorAtivo: 'challenge' | 'report' | 'default';
          upa: 'challenge' | 'report' | 'default';
        };
      };
      reportDataAnalysis: {
        hasReportData: boolean;
        reportPercentages: {
          faturamento?: number;
          reaisPorAtivo?: number;
          upa?: number;
        };
        cycleInfo: {
          currentDay?: number;
          totalDays?: number;
        };
      };
    };
  } {
    const playerMetrics = this.processPlayerData(rawData, reportData);
    const catalogItems = rawData.catalog_items || {};

    // Determine data sources for each metric
    const challengeIds = CHALLENGE_MAPPING[TeamType.ER];
    const faturamentoFromChallenge = this.extractChallengePercentage(
      rawData.challenge_progress || [],
      challengeIds.faturamento
    );
    const reaisPorAtivoFromChallenge = this.extractChallengePercentage(
      rawData.challenge_progress || [],
      challengeIds.reaisPorAtivo
    );
    const upaFromChallenge = this.extractChallengePercentage(
      rawData.challenge_progress || [],
      challengeIds.upa
    );

    return {
      playerMetrics,
      rawAnalysis: {
        catalogItemsAnalysis: {
          unlockStatus: !this.calculatePointsLocked(catalogItems),
          boost1Status: this.isBoostActive(catalogItems, 'secondary1'),
          boost2Status: this.isBoostActive(catalogItems, 'secondary2'),
          unlockItemCount: catalogItems[FUNIFIER_CONFIG.CATALOG_ITEMS.UNLOCK_POINTS] || 0,
          boost1ItemCount: catalogItems[FUNIFIER_CONFIG.CATALOG_ITEMS.BOOST_SECONDARY_1] || 0,
          boost2ItemCount: catalogItems[FUNIFIER_CONFIG.CATALOG_ITEMS.BOOST_SECONDARY_2] || 0
        },
        challengeAnalysis: {
          totalChallenges: rawData.total_challenges || 0,
          challengeProgress: rawData.challenge_progress || [],
          extractedPercentages: {
            faturamento: this.extractFaturamentoPercentage(rawData, reportData),
            reaisPorAtivo: this.extractReaisPorAtivoPercentage(rawData, reportData),
            upa: this.extractUpaPercentage(rawData, reportData)
          },
          dataSource: {
            faturamento: faturamentoFromChallenge > 0 ? 'challenge' :
              (reportData?.faturamento !== undefined ? 'report' : 'default'),
            reaisPorAtivo: reaisPorAtivoFromChallenge > 0 ? 'challenge' :
              (reportData?.reaisPorAtivo !== undefined ? 'report' : 'default'),
            upa: upaFromChallenge > 0 ? 'challenge' :
              (reportData?.upa !== undefined ? 'report' : 'default')
          }
        },
        reportDataAnalysis: {
          hasReportData: !!reportData,
          reportPercentages: {
            faturamento: reportData?.faturamento,
            reaisPorAtivo: reportData?.reaisPorAtivo,
            upa: reportData?.upa
          },
          cycleInfo: {
            currentDay: reportData?.currentCycleDay,
            totalDays: reportData?.totalCycleDays
          }
        }
      }
    };
  }
}

/**
 * Factory function to create ER processor
 */
export function createERProcessor(): ERProcessor {
  return new ERProcessor();
}

// Export singleton instance
export const erProcessor = new ERProcessor();