import {
  TeamType,
  PlayerMetrics,
  FunifierPlayerStatus,
  EssenciaReportRecord,
  DashboardConfig,
  FUNIFIER_CONFIG
} from '../types';
import { BaseTeamProcessor, CHALLENGE_MAPPING } from './team-processor.service';

/**
 * Carteira 0 Team Processor
 * 
 * Processing logic:
 * - Primary goal: Conversões (from challenge_progress or report data)
 * - Secondary goal 1: Reais por Ativo (from challenge_progress or report data)
 * - Secondary goal 2: Faturamento (from challenge_progress or report data)
 * - Points and lock status: directly from Funifier catalog_items
 * - Boost status: from catalog_items (presence of boost items indicates goal completion)
 * 
 * Reuses existing challenge IDs from Carteira I for Reais por Ativo and Faturamento
 * Uses new challenge ID E6GglPq for Conversões metric
 */
export class Carteira0Processor extends BaseTeamProcessor {
  constructor() {
    super(TeamType.CARTEIRA_0);
  }

  processPlayerData(
    rawData: FunifierPlayerStatus,
    reportData?: EssenciaReportRecord,
    teamConfig?: DashboardConfig
  ): PlayerMetrics {
    this.validateTeamType(reportData);

    const playerName = rawData.name;
    const totalPoints = rawData.total_points || 0;
    const pointsLocked = this.calculatePointsLocked(rawData.catalog_items || {});
    const currentCycleDay = this.getCurrentCycleDay(reportData);
    const daysUntilCycleEnd = this.getDaysUntilCycleEnd(reportData);

    // Extract goal percentages
    const conversoesPercentage = this.extractConversoesPercentage(rawData, reportData);
    const reaisPorAtivoPercentage = this.extractReaisPorAtivoPercentage(rawData, reportData);
    const faturamentoPercentage = this.extractFaturamentoPercentage(rawData, reportData);

    // Extract boost status from catalog_items
    const boost1Active = this.isBoostActive(rawData.catalog_items || {}, 'secondary1');
    const boost2Active = this.isBoostActive(rawData.catalog_items || {}, 'secondary2');

    // Create goal metrics
    const primaryGoal = this.createGoalMetric(
      'Conversões',
      conversoesPercentage,
      false, // Primary goal doesn't have boost visual indicator
      {
        isMainGoal: true,
        challengeIds: CHALLENGE_MAPPING[TeamType.CARTEIRA_0].conversoes
      }
    );

    const secondaryGoal1 = this.createGoalMetric(
      'Reais por Ativo',
      reaisPorAtivoPercentage,
      boost1Active,
      {
        boostItemId: FUNIFIER_CONFIG.CATALOG_ITEMS.BOOST_SECONDARY_1,
        challengeIds: CHALLENGE_MAPPING[TeamType.CARTEIRA_0].reaisPorAtivo
      }
    );

    const secondaryGoal2 = this.createGoalMetric(
      'Faturamento',
      faturamentoPercentage,
      boost2Active,
      {
        boostItemId: FUNIFIER_CONFIG.CATALOG_ITEMS.BOOST_SECONDARY_2,
        challengeIds: CHALLENGE_MAPPING[TeamType.CARTEIRA_0].faturamento
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
   * Extract Conversões goal percentage from challenge_progress or report data
   */
  private extractConversoesPercentage(
    rawData: FunifierPlayerStatus,
    reportData?: EssenciaReportRecord
  ): number {
    // Priority 1: Funifier challenge progress (primary source)
    const challengeIds = CHALLENGE_MAPPING[TeamType.CARTEIRA_0].conversoes;
    const challengeFound = this.hasChallengeData(rawData.challenge_progress || [], challengeIds);
    
    if (challengeFound) {
      const challengePercentage = this.extractChallengePercentage(
        rawData.challenge_progress || [],
        challengeIds
      );
      console.log('🔄 Conversões from Funifier challenge:', challengePercentage);
      return this.validatePercentage(challengePercentage);
    }

    // Priority 2: Report data (fallback when Funifier data is missing)
    if (reportData?.conversoes !== undefined) {
      console.log('🔄 Conversões from report data:', reportData.conversoes);
      return this.validatePercentage(reportData.conversoes);
    }

    console.log('🔄 No Conversões data found, using 0');
    return 0;
  }

  /**
   * Extract Reais por ativo goal percentage from challenge_progress or report data
   * Reuses Carteira I challenge IDs for consistency
   */
  private extractReaisPorAtivoPercentage(
    rawData: FunifierPlayerStatus,
    reportData?: EssenciaReportRecord
  ): number {
    // Priority 1: Funifier challenge progress (primary source)
    const challengeIds = CHALLENGE_MAPPING[TeamType.CARTEIRA_0].reaisPorAtivo;
    const challengeFound = this.hasChallengeData(rawData.challenge_progress || [], challengeIds);
    
    if (challengeFound) {
      const challengePercentage = this.extractChallengePercentage(
        rawData.challenge_progress || [],
        challengeIds
      );
      console.log('💰 Reais por Ativo from Funifier challenge:', challengePercentage);
      return this.validatePercentage(challengePercentage);
    }

    // Priority 2: Report data (fallback when Funifier data is missing)
    if (reportData?.reaisPorAtivo !== undefined) {
      console.log('💰 Reais por Ativo from report data:', reportData.reaisPorAtivo);
      return this.validatePercentage(reportData.reaisPorAtivo);
    }

    console.log('💰 No Reais por Ativo data found, using 0');
    return 0;
  }

  /**
   * Extract Faturamento goal percentage from challenge_progress or report data
   * Reuses Carteira I challenge IDs for consistency
   */
  private extractFaturamentoPercentage(
    rawData: FunifierPlayerStatus,
    reportData?: EssenciaReportRecord
  ): number {
    // Priority 1: Funifier challenge progress (primary source)
    const challengeIds = CHALLENGE_MAPPING[TeamType.CARTEIRA_0].faturamento;
    const challengeFound = this.hasChallengeData(rawData.challenge_progress || [], challengeIds);
    
    if (challengeFound) {
      const challengePercentage = this.extractChallengePercentage(
        rawData.challenge_progress || [],
        challengeIds
      );
      console.log('📈 Faturamento from Funifier challenge:', challengePercentage);
      return this.validatePercentage(challengePercentage);
    }

    // Priority 2: Report data (fallback when Funifier data is missing)
    if (reportData?.faturamento !== undefined) {
      console.log('📈 Faturamento from report data:', reportData.faturamento);
      return this.validatePercentage(reportData.faturamento);
    }

    console.log('📈 No Faturamento data found, using 0');
    return 0;
  }

  /**
   * Check if challenge data exists for given challenge IDs
   */
  private hasChallengeData(challengeProgress: any[], challengeIds: string[]): boolean {
    console.log('🔍 Checking for challenge data:', {
      challengeIds,
      availableChallenges: challengeProgress.map(p => ({
        id: p.challenge || p.challengeId || p.id,
        percentage: p.percent_completed || p.percentage || p.progress
      }))
    });
    
    const found = challengeProgress.some(progress => 
      challengeIds.includes(progress.challenge || progress.challengeId || progress.id)
    );
    
    console.log('🎯 Challenge data found:', found);
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
   * Get detailed analysis of Carteira 0 player data
   */
  public analyzeCarteira0Data(
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
          conversoes: number;
          reaisPorAtivo: number;
          faturamento: number;
        };
      };
      reportDataAnalysis: {
        hasReportData: boolean;
        reportPercentages: {
          conversoes?: number;
          reaisPorAtivo?: number;
          faturamento?: number;
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
            conversoes: this.extractConversoesPercentage(rawData),
            reaisPorAtivo: this.extractReaisPorAtivoPercentage(rawData),
            faturamento: this.extractFaturamentoPercentage(rawData)
          }
        },
        reportDataAnalysis: {
          hasReportData: !!reportData,
          reportPercentages: {
            conversoes: reportData?.conversoes,
            reaisPorAtivo: reportData?.reaisPorAtivo,
            faturamento: reportData?.faturamento
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

// Export singleton instance
export const carteira0Processor = new Carteira0Processor();