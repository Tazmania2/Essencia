import { FunifierPlayerService } from './funifier-player.service';
import { FunifierDatabaseService } from './funifier-database.service';
import { TeamProcessorFactory } from './team-processor-factory.service';
import { UserIdentificationService } from './user-identification.service';
import { dashboardCache, playerDataCache, CacheKeys } from './cache.service';
import { 
  FunifierPlayerStatus, 
  EssenciaReportRecord, 
  TeamType, 
  DashboardData,
  PlayerMetrics,
  FUNIFIER_CONFIG 
} from '../types';

export class DashboardService {
  constructor(
    private playerService: FunifierPlayerService,
    private databaseService: FunifierDatabaseService,
    private teamProcessorFactory: TeamProcessorFactory,
    private userIdentificationService: UserIdentificationService
  ) {}

  async getDashboardData(playerId: string, token: string): Promise<DashboardData> {
    try {
      // Check cache first
      const cacheKey = CacheKeys.dashboardData(playerId, 'unknown');
      const cachedData = dashboardCache.get<DashboardData>(cacheKey);
      
      if (cachedData) {
        return cachedData;
      }

      // Get player status from Funifier (with caching)
      const playerStatus = await playerDataCache.getOrSet(
        CacheKeys.playerStatus(playerId),
        () => this.playerService.getPlayerStatus(playerId),
        2 * 60 * 1000 // 2 minutes TTL
      );
      
      // Identify team type
      const teamInfo = this.userIdentificationService.extractTeamInformation(playerStatus);
      const teamType = teamInfo.teamType;
      
      // Get report data from custom collection
      const reportData = await this.getLatestReportData(playerId);
      
      // Process data using appropriate team processor
      if (!teamType) {
        throw new Error(`Unable to determine team type for player ${playerId}`);
      }
      
      const processor = this.teamProcessorFactory.getProcessor(teamType);
      const playerMetrics = processor.processPlayerData(playerStatus, reportData);
      
      // Convert to dashboard format
      const dashboardData = this.convertTodashboardData(playerMetrics, teamType, reportData);
      
      // Cache the result with team-specific key
      const teamSpecificCacheKey = CacheKeys.dashboardData(playerId, teamType);
      dashboardCache.set(teamSpecificCacheKey, dashboardData, 2 * 60 * 1000); // 2 minutes TTL
      
      return dashboardData;
    } catch (error) {
      console.error('Error getting dashboard data:', error);
      throw error;
    }
  }

  private async getLatestReportData(playerId: string): Promise<EssenciaReportRecord | undefined> {
    try {
      const result = await this.databaseService.getLatestPlayerReport(playerId);
      return result || undefined;
    } catch (error) {
      console.warn('Could not fetch report data, using defaults:', error);
      return undefined;
    }
  }

  private convertTodashboardData(metrics: PlayerMetrics, teamType: TeamType, reportData?: EssenciaReportRecord): DashboardData {
    const goalEmojis = this.getGoalEmojis(teamType);
    
    // Calculate cycle information with fallbacks
    const totalCycleDays = reportData?.totalCycleDays || 21; // Default to 21 days
    const currentCycleDay = reportData?.currentCycleDay || metrics.currentCycleDay;
    
    return {
      playerName: metrics.playerName,
      totalPoints: metrics.totalPoints,
      pointsLocked: metrics.pointsLocked,
      currentCycleDay: currentCycleDay,
      totalCycleDays: totalCycleDays,
      isDataFromCollection: !!reportData, // True if we have report data from collection
      primaryGoal: {
        name: metrics.primaryGoal.name,
        percentage: metrics.primaryGoal.percentage,
        description: this.generateGoalDescription(metrics.primaryGoal),
        emoji: goalEmojis.primary
      },
      secondaryGoal1: {
        name: metrics.secondaryGoal1.name,
        percentage: metrics.secondaryGoal1.percentage,
        description: this.generateGoalDescription(metrics.secondaryGoal1),
        emoji: goalEmojis.secondary1,
        hasBoost: true,
        isBoostActive: metrics.secondaryGoal1.boostActive || false
      },
      secondaryGoal2: {
        name: metrics.secondaryGoal2.name,
        percentage: metrics.secondaryGoal2.percentage,
        description: this.generateGoalDescription(metrics.secondaryGoal2),
        emoji: goalEmojis.secondary2,
        hasBoost: true,
        isBoostActive: metrics.secondaryGoal2.boostActive || false
      }
    };
  }

  private getGoalEmojis(teamType: TeamType): { primary: string; secondary1: string; secondary2: string } {
    const emojiMap = {
      [TeamType.CARTEIRA_I]: {
        primary: '🎯', // Atividade
        secondary1: '💰', // Reais por Ativo
        secondary2: '📈' // Faturamento
      },
      [TeamType.CARTEIRA_II]: {
        primary: '💰', // Reais por Ativo
        secondary1: '🎯', // Atividade
        secondary2: '🏪' // Multimarcas por Ativo
      },
      [TeamType.CARTEIRA_III]: {
        primary: '📈', // Faturamento
        secondary1: '💰', // Reais por Ativo
        secondary2: '🏪' // Multimarcas por Ativo
      },
      [TeamType.CARTEIRA_IV]: {
        primary: '📈', // Faturamento
        secondary1: '💰', // Reais por Ativo
        secondary2: '🏪' // Multimarcas por Ativo
      }
    };

    return emojiMap[teamType];
  }

  private generateGoalDescription(goal: any): string {
    const percentage = goal.percentage;
    
    if (percentage >= 100) {
      return `Meta atingida! ${percentage}% concluído - Parabéns! 🎉`;
    } else if (percentage >= 75) {
      return `Quase lá! ${percentage}% concluído - Faltam apenas ${100 - percentage}%`;
    } else if (percentage >= 50) {
      return `Bom progresso! ${percentage}% concluído - Continue assim!`;
    } else if (percentage >= 25) {
      return `${percentage}% concluído - Vamos acelerar o ritmo!`;
    } else {
      return `${percentage}% concluído - Vamos começar forte!`;
    }
  }

  // Method to check if points are unlocked based on catalog items
  static isPointsUnlocked(catalogItems: Record<string, number>): boolean {
    const unlockItem = catalogItems[FUNIFIER_CONFIG.CATALOG_ITEMS.UNLOCK_POINTS] || 0;
    return unlockItem > 0;
  }

  // Method to check boost status
  static getBoostStatus(catalogItems: Record<string, number>): {
    boost1Active: boolean;
    boost2Active: boolean;
  } {
    const boost1 = catalogItems[FUNIFIER_CONFIG.CATALOG_ITEMS.BOOST_SECONDARY_1] || 0;
    const boost2 = catalogItems[FUNIFIER_CONFIG.CATALOG_ITEMS.BOOST_SECONDARY_2] || 0;
    
    return {
      boost1Active: boost1 > 0,
      boost2Active: boost2 > 0
    };
  }
}