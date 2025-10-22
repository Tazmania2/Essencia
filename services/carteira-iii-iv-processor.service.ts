import {
  TeamType,
  PlayerMetrics,
  FunifierPlayerStatus,
  EssenciaReportRecord,
  FUNIFIER_CONFIG
} from '../types';
import { BaseTeamProcessor, CHALLENGE_MAPPING } from './team-processor.service';

/**
 * Carteira III/IV Team Processor
 * 
 * Processing logic:
 * - Primary goal: Faturamento (from challenges)
 * - Secondary goal 1: Reais por ativo (from challenges)
 * - Secondary goal 2: Multimarcas por ativo (from challenges)
 * - Points and lock status: directly from Funifier
 * - Boost status: from catalog_items
 * 
 * Note: This processor handles both Carteira III and IV as they have the same logic
 */
export class CarteiraIIIIVProcessor extends BaseTeamProcessor {
  constructor(teamType: TeamType.CARTEIRA_III | TeamType.CARTEIRA_IV) {
    super(teamType);
    
    if (teamType !== TeamType.CARTEIRA_III && teamType !== TeamType.CARTEIRA_IV) {
      throw new Error(`Invalid team type for CarteiraIIIIVProcessor: ${teamType}`);
    }
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

    // Extract goal percentages from challenges (Funifier data takes priority)
    const faturamentoPercentage = this.extractFaturamentoPercentage(rawData, reportData);
    const reaisPorAtivoPercentage = this.extractReaisPorAtivoPercentage(rawData, reportData);
    const multimarcasPorAtivoPercentage = this.extractMultimarcasPorAtivoPercentage(rawData, reportData);

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
        challengeIds: (CHALLENGE_MAPPING[this.teamType] as any).faturamento
      }
    );

    const secondaryGoal1 = this.createGoalMetric(
      'Reais por Ativo',
      reaisPorAtivoPercentage,
      boost1Active,
      {
        boostItemId: FUNIFIER_CONFIG.CATALOG_ITEMS.BOOST_SECONDARY_1,
        challengeIds: CHALLENGE_MAPPING[this.teamType].reaisPorAtivo
      }
    );

    const secondaryGoal2 = this.createGoalMetric(
      'Multimarcas por Ativo',
      multimarcasPorAtivoPercentage,
      boost2Active,
      {
        boostItemId: FUNIFIER_CONFIG.CATALOG_ITEMS.BOOST_SECONDARY_2,
        challengeIds: (CHALLENGE_MAPPING[this.teamType] as any).multimarcasPorAtivo
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
   * Extract Faturamento goal percentage from challenges (primary source) or report data (fallback)
   */
  private extractFaturamentoPercentage(
    rawData: FunifierPlayerStatus,
    reportData?: EssenciaReportRecord
  ): number {
    // Priority 1: Challenge progress from Funifier (primary source for Carteira III/IV)
    const challengeIds = (CHALLENGE_MAPPING[this.teamType] as any).faturamento;
    const challengePercentage = this.extractChallengePercentage(
      rawData.challenge_progress || [],
      challengeIds
    );

    if (challengePercentage > 0) {
      return this.validatePercentage(challengePercentage);
    }

    // Priority 2: Report data (fallback)
    if (reportData?.faturamento !== undefined) {
      return this.validatePercentage(reportData.faturamento);
    }

    return 0;
  }

  /**
   * Extract Reais por ativo goal percentage from challenges (primary source) or report data (fallback)
   */
  private extractReaisPorAtivoPercentage(
    rawData: FunifierPlayerStatus,
    reportData?: EssenciaReportRecord
  ): number {
    // Priority 1: Challenge progress from Funifier (primary source for Carteira III/IV)
    const challengeIds = CHALLENGE_MAPPING[this.teamType].reaisPorAtivo;
    const challengePercentage = this.extractChallengePercentage(
      rawData.challenge_progress || [],
      challengeIds
    );

    if (challengePercentage > 0) {
      return this.validatePercentage(challengePercentage);
    }

    // Priority 2: Report data (fallback)
    if (reportData?.reaisPorAtivo !== undefined) {
      return this.validatePercentage(reportData.reaisPorAtivo);
    }

    return 0;
  }

  /**
   * Extract Multimarcas por ativo goal percentage from challenges (primary source) or report data (fallback)
   */
  private extractMultimarcasPorAtivoPercentage(
    rawData: FunifierPlayerStatus,
    reportData?: EssenciaReportRecord
  ): number {
    // Priority 1: Challenge progress from Funifier (primary source for Carteira III/IV)
    const challengeIds = (CHALLENGE_MAPPING[this.teamType] as any).multimarcasPorAtivo;
    const challengePercentage = this.extractChallengePercentage(
      rawData.challenge_progress || [],
      challengeIds
    );

    if (challengePercentage > 0) {
      return this.validatePercentage(challengePercentage);
    }

    // Priority 2: Report data (fallback)
    if (reportData?.multimarcasPorAtivo !== undefined) {
      return this.validatePercentage(reportData.multimarcasPorAtivo);
    }

    return 0;
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
   * Get detailed analysis of Carteira III/IV player data
   */
  public analyzeCarteiraIIIIVData(
    rawData: FunifierPlayerStatus,
    reportData?: EssenciaReportRecord
  ): {
    teamType: TeamType;
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
          multimarcasPorAtivo: number;
        };
        dataSource: {
          faturamento: 'challenge' | 'report' | 'default';
          reaisPorAtivo: 'challenge' | 'report' | 'default';
          multimarcasPorAtivo: 'challenge' | 'report' | 'default';
        };
      };
      reportDataAnalysis: {
        hasReportData: boolean;
        reportPercentages: {
          faturamento?: number;
          reaisPorAtivo?: number;
          multimarcasPorAtivo?: number;
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
    const challengeIds = CHALLENGE_MAPPING[this.teamType] as any;
    const faturamentoFromChallenge = this.extractChallengePercentage(
      rawData.challenge_progress || [],
      challengeIds.faturamento
    );
    const reaisPorAtivoFromChallenge = this.extractChallengePercentage(
      rawData.challenge_progress || [],
      challengeIds.reaisPorAtivo
    );
    const multimarcasFromChallenge = this.extractChallengePercentage(
      rawData.challenge_progress || [],
      challengeIds.multimarcasPorAtivo
    );

    return {
      teamType: this.teamType,
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
            multimarcasPorAtivo: this.extractMultimarcasPorAtivoPercentage(rawData, reportData)
          },
          dataSource: {
            faturamento: faturamentoFromChallenge > 0 ? 'challenge' : 
                        (reportData?.faturamento !== undefined ? 'report' : 'default'),
            reaisPorAtivo: reaisPorAtivoFromChallenge > 0 ? 'challenge' : 
                          (reportData?.reaisPorAtivo !== undefined ? 'report' : 'default'),
            multimarcasPorAtivo: multimarcasFromChallenge > 0 ? 'challenge' : 
                                (reportData?.multimarcasPorAtivo !== undefined ? 'report' : 'default')
          }
        },
        reportDataAnalysis: {
          hasReportData: !!reportData,
          reportPercentages: {
            faturamento: reportData?.faturamento,
            reaisPorAtivo: reportData?.reaisPorAtivo,
            multimarcasPorAtivo: reportData?.multimarcasPorAtivo
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
 * Factory function to create Carteira III processor
 */
export function createCarteiraIIIProcessor(): CarteiraIIIIVProcessor {
  return new CarteiraIIIIVProcessor(TeamType.CARTEIRA_III);
}

/**
 * Factory function to create Carteira IV processor
 */
export function createCarteiraIVProcessor(): CarteiraIIIIVProcessor {
  return new CarteiraIIIIVProcessor(TeamType.CARTEIRA_IV);
}

// Export singleton instances
export const carteiraIIIProcessor = createCarteiraIIIProcessor();
export const carteiraIVProcessor = createCarteiraIVProcessor();