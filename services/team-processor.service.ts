import {
  TeamType,
  TeamProcessor,
  PlayerMetrics,
  GoalMetric,
  ProgressBarConfig,
  FunifierPlayerStatus,
  EssenciaReportRecord,
  ChallengeMapping,
  FUNIFIER_CONFIG
} from '../types';

/**
 * Challenge ID mapping configuration for each team
 * 
 * Based on actual Funifier challenges from your instance.
 * These challenges track progress and provide percentage data in player_status.challenge_progress
 * 
 * CHALLENGE SYSTEM OVERVIEW:
 * 
 * 1. CARTEIRA I (E6F4sCh):
 *    - Primary Goal: Atividade (Activity)
 *    - Secondary Goals: Reais por Ativo, Faturamento
 *    - Special Logic: Points are locked initially, unlocked when Atividade >= 100%
 * 
 * 2. CARTEIRA II (E6F4O1b):
 *    - Primary Goal: Reais por Ativo (controls point unlock at 100%)
 *    - Secondary Goals: Atividade, Multimarcas por Ativo
 *    - Special Logic: Local points calculation with boost multipliers
 * 
 * 3. CARTEIRA III (E6F4Xf2):
 *    - Primary Goal: Faturamento (Billing)
 *    - Secondary Goals: Reais por Ativo, Multimarcas por Ativo
 *    - Logic: Direct Funifier integration, points unlock at Faturamento >= 100%
 * 
 * 4. CARTEIRA IV (E6F41Bb):
 *    - Primary Goal: Faturamento (Billing)
 *    - Secondary Goals: Reais por Ativo, Multimarcas por Ativo
 *    - Logic: Same as Carteira III
 * 
 * CHALLENGE TYPES:
 * - "Subir" challenges: Track progress increases, award points
 * - "Bater Meta" challenges: Unlock points/boosts when reaching 100%
 * - "Perder" challenges: Remove boosts when falling below 100%
 * 
 * DATA EXTRACTION:
 * - Challenge progress is available in player_status.challenge_progress
 * - Each challenge provides percentage data via porcentagem_da_meta attribute
 * - Boost status is tracked via catalog_items (E6F0WGc, E6K79Mt)
 * - Points lock/unlock status via catalog_items (E6F0O5f, E6F0MJ3)
 */
export const CHALLENGE_MAPPING: ChallengeMapping = {
  [TeamType.CARTEIRA_I]: {
    atividade: [
      'E6FO12f', // Carteira I - Subir Atividade (Pré Meta)
      'E6FQIjs', // Carteira I - Bater Meta Atividade %
      'E6KQAoh'  // Carteira I - Subir Atividade (Pós-Meta)
    ],
    reaisPorAtivo: [
      'E6Gm8RI', // Carteira I, III & IV - Subir Reais por Ativo
      'E6Gke5g'  // Carteira I, III & IV - Descer Reais Ativo
    ],
    faturamento: [
      'E6GglPq', // Carteira I - Bater Faturamento (Meta)
      'E6LIVVX'  // Carteira I - Perder Faturamento (Meta)
    ]
  },
  [TeamType.CARTEIRA_II]: {
    reaisPorAtivo: [
      'E6MTIIK'  // Carteira II - Subir Reais por Ativo
    ],
    atividade: [
      'E6Gv58l', // Carteira II - Subir Atividade
      'E6MZw2L'  // Carteira II - Perder Atividade
    ],
    multimarcasPorAtivo: [
      'E6MWJKs', // Carteira II - Subir Multimarcas por Ativo
      'E6MWYj3'  // Carteira II - Perder Multimarcas por Ativo
    ]
  },
  [TeamType.CARTEIRA_III]: {
    faturamento: [
      'E6F8HMK', // Carteira III & IV - Bater Meta Faturamento
      'E6Gahd4', // Carteira III & IV - Subir Faturamento (Pre-Meta)
      'E6MLv3L'  // Carteira III & IV - Subir Faturamento (Pós-Meta) - Note: principals only includes IV, but description says III & IV
    ],
    reaisPorAtivo: [
      'E6Gm8RI', // Carteira I, III & IV - Subir Reais por Ativo
      'E6Gke5g'  // Carteira I, III & IV - Descer Reais Ativo
    ],
    multimarcasPorAtivo: [
      'E6MMH5v', // Carteira III & IV - Subir Multimarcas por Ativo
      'E6MM3eK'  // Carteira III & IV - Perder Multimarcas por Ativo
    ]
  },
  [TeamType.CARTEIRA_IV]: {
    faturamento: [
      'E6F8HMK', // Carteira III & IV - Bater Meta Faturamento
      'E6Gahd4', // Carteira III & IV - Subir Faturamento (Pre-Meta)
      'E6MLv3L'  // Carteira III & IV - Subir Faturamento (Pós-Meta)
    ],
    reaisPorAtivo: [
      'E6Gm8RI', // Carteira I, III & IV - Subir Reais por Ativo
      'E6Gke5g'  // Carteira I, III & IV - Descer Reais Ativo
    ],
    multimarcasPorAtivo: [
      'E6MMH5v', // Carteira III & IV - Subir Multimarcas por Ativo
      'E6MM3eK'  // Carteira III & IV - Perder Multimarcas por Ativo
    ]
  }
};

/**
 * Base team processor with common utilities
 */
export abstract class BaseTeamProcessor implements TeamProcessor {
  protected teamType: TeamType;

  constructor(teamType: TeamType) {
    this.teamType = teamType;
  }

  abstract processPlayerData(
    rawData: FunifierPlayerStatus, 
    reportData?: EssenciaReportRecord
  ): PlayerMetrics;

  /**
   * Calculate progress bar configuration based on percentage
   * Special logic: 0-50% red (0-33% fill), 50-100% yellow (33-66% fill), 100-150% green (66-100% fill)
   */
  protected calculateProgressBar(percentage: number): ProgressBarConfig {
    // Round percentage to avoid floating-point precision issues
    const roundedPercentage = Math.round(percentage * 100) / 100;
    
    if (roundedPercentage <= 50) {
      return {
        percentage: roundedPercentage,
        color: 'red',
        fillPercentage: Math.round(((roundedPercentage / 50) * 33.33) * 100) / 100 // 0-50% -> 0-33.33% of bar
      };
    } else if (roundedPercentage <= 100) {
      return {
        percentage: roundedPercentage,
        color: 'yellow',
        fillPercentage: Math.round((33.33 + ((roundedPercentage - 50) / 50) * 33.33) * 100) / 100 // 50-100% -> 33.33-66.66% of bar
      };
    } else {
      return {
        percentage: roundedPercentage,
        color: 'green',
        fillPercentage: Math.round((66.66 + ((Math.min(roundedPercentage, 150) - 100) / 50) * 33.34) * 100) / 100 // 100-150% -> 66.66-100% of bar
      };
    }
  }

  /**
   * Calculate points lock status from catalog items
   */
  protected calculatePointsLocked(catalogItems: Record<string, number>): boolean {
    const unlockItemCount = catalogItems[FUNIFIER_CONFIG.CATALOG_ITEMS.UNLOCK_POINTS] || 0;
    return unlockItemCount === 0; // Locked if unlock item count is 0
  }

  /**
   * Check if boost is active from catalog items
   */
  protected isBoostActive(catalogItems: Record<string, number>, boostType: 'secondary1' | 'secondary2'): boolean {
    const boostItemId = boostType === 'secondary1' 
      ? FUNIFIER_CONFIG.CATALOG_ITEMS.BOOST_SECONDARY_1
      : FUNIFIER_CONFIG.CATALOG_ITEMS.BOOST_SECONDARY_2;
    
    return (catalogItems[boostItemId] || 0) > 0;
  }

  /**
   * Get current cycle day (default implementation)
   */
  protected getCurrentCycleDay(reportData?: EssenciaReportRecord): number {
    if (reportData?.currentCycleDay) {
      return reportData.currentCycleDay;
    }
    
    // Default calculation based on current date
    // This is a simplified implementation - should be replaced with actual business logic
    const now = new Date();
    const dayOfMonth = now.getDate();
    return Math.min(dayOfMonth, 21); // Assuming 21-day cycles
  }

  /**
   * Get days until cycle end
   */
  protected getDaysUntilCycleEnd(reportData?: EssenciaReportRecord): number {
    const totalCycleDays = reportData?.totalCycleDays || 21;
    const currentDay = this.getCurrentCycleDay(reportData);
    return Math.max(0, totalCycleDays - currentDay);
  }

  /**
   * Extract percentage from challenge progress or report data
   */
  protected extractChallengePercentage(
    challengeProgress: any[],
    challengeIds: string[],
    fallbackValue: number = 0
  ): number {
    for (const progress of challengeProgress) {
      if (challengeIds.includes(progress.challenge || progress.challengeId || progress.id)) {
        // Extract percentage from challenge progress - use actual Funifier field names
        const rawPercentage = progress.percent_completed || progress.percentage || progress.progress || fallbackValue;
        // Round to avoid floating-point precision issues
        return Math.round(rawPercentage * 100) / 100;
      }
    }
    return fallbackValue;
  }

  /**
   * Extract percentage from report data by metric name
   */
  protected extractReportPercentage(
    reportData: EssenciaReportRecord | undefined,
    metricName: keyof Pick<EssenciaReportRecord, 'atividade' | 'reaisPorAtivo' | 'faturamento' | 'multimarcasPorAtivo'>
  ): number {
    return reportData?.[metricName] || 0;
  }

  /**
   * Create a goal metric with progress bar configuration
   */
  protected createGoalMetric(
    name: string,
    percentage: number,
    boostActive: boolean = false,
    additionalDetails: Record<string, any> = {}
  ): GoalMetric {
    return {
      name,
      percentage,
      boostActive,
      details: {
        progressBar: this.calculateProgressBar(percentage),
        ...additionalDetails
      }
    };
  }

  /**
   * Validate team type matches processor
   */
  protected validateTeamType(reportData?: EssenciaReportRecord): void {
    if (reportData?.team && reportData.team !== this.teamType) {
      console.warn(`Team type mismatch: processor=${this.teamType}, data=${reportData.team}`);
    }
  }
}

/**
 * Utility functions for team processing
 */
export class TeamProcessorUtils {
  /**
   * Calculate percentage with bounds checking
   */
  static calculatePercentage(current: number, target: number): number {
    if (target <= 0) return 0;
    return Math.max(0, (current / target) * 100);
  }

  /**
   * Format percentage for display
   */
  static formatPercentage(percentage: number, decimals: number = 1): string {
    return `${percentage.toFixed(decimals)}%`;
  }

  /**
   * Calculate date difference in days
   */
  static daysBetween(startDate: Date, endDate: Date): number {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Get cycle start date (assuming cycles start on 1st of each month)
   */
  static getCycleStartDate(date: Date = new Date()): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  /**
   * Get cycle end date (assuming 21-day cycles from start of month)
   */
  static getCycleEndDate(startDate: Date, cycleDays: number = 21): Date {
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + cycleDays);
    return endDate;
  }

  /**
   * Determine team type from team ID or name
   */
  static determineTeamType(teamId: string): TeamType | null {
    const teamIdLower = teamId.toLowerCase();
    
    // Check for actual Funifier team IDs first
    if (teamId === FUNIFIER_CONFIG.TEAM_IDS.CARTEIRA_I) {
      return TeamType.CARTEIRA_I;
    }
    if (teamId === FUNIFIER_CONFIG.TEAM_IDS.CARTEIRA_II) {
      return TeamType.CARTEIRA_II;
    }
    if (teamId === FUNIFIER_CONFIG.TEAM_IDS.CARTEIRA_III) {
      return TeamType.CARTEIRA_III;
    }
    if (teamId === FUNIFIER_CONFIG.TEAM_IDS.CARTEIRA_IV) {
      return TeamType.CARTEIRA_IV;
    }
    
    // Fallback to name-based detection for flexibility
    if (teamIdLower.includes('carteira_iv') || teamIdLower.includes('carteira4') || teamIdLower.includes('carteira iv')) {
      return TeamType.CARTEIRA_IV;
    }
    if (teamIdLower.includes('carteira_iii') || teamIdLower.includes('carteira3') || teamIdLower.includes('carteira iii')) {
      return TeamType.CARTEIRA_III;
    }
    if (teamIdLower.includes('carteira_ii') || teamIdLower.includes('carteira2') || teamIdLower.includes('carteira ii')) {
      return TeamType.CARTEIRA_II;
    }
    if (teamIdLower.includes('carteira_i') || teamIdLower.includes('carteira1') || teamIdLower.includes('carteira i')) {
      return TeamType.CARTEIRA_I;
    }
    
    return null;
  }

  /**
   * Validate percentage value
   */
  static validatePercentage(percentage: number): number {
    if (isNaN(percentage) || !isFinite(percentage)) {
      return 0;
    }
    // Round to 2 decimal places to avoid floating-point precision issues
    return Math.max(0, Math.round(percentage * 100) / 100);
  }

  /**
   * Calculate boost multiplier for Carteira II
   */
  static calculateCarteiraIIBoostMultiplier(
    hasBoost1: boolean,
    hasBoost2: boolean
  ): number {
    let multiplier = 1;
    if (hasBoost1) multiplier += 1; // +100%
    if (hasBoost2) multiplier += 1; // +100% additional
    return multiplier;
  }

  /**
   * Check if points should be unlocked for Carteira II
   */
  static shouldUnlockCarteiraIIPoints(reaisPorAtivoPercentage: number): boolean {
    return reaisPorAtivoPercentage >= 100;
  }
}