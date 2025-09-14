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

  /**
   * Process player data directly to dashboard format without making API calls
   * This is used when we already have the player data from login
   */
  async processPlayerDataToDashboard(playerStatus: FunifierPlayerStatus, teamType: TeamType): Promise<DashboardData> {
    try {
      // Get report data from custom collection (optional)
      const reportData = await this.getLatestReportData(playerStatus._id);
      
      // Process data using appropriate team processor
      const processor = this.teamProcessorFactory.getProcessor(teamType);
      const playerMetrics = processor.processPlayerData(playerStatus, reportData);
      
      // Convert to dashboard format
      const dashboardData = this.convertTodashboardData(playerMetrics, teamType, reportData);
      
      return dashboardData;
    } catch (error) {
      console.error('Error processing player data to dashboard:', error);
      throw error;
    }
  }

  /**
   * Extract dashboard data directly from Funifier API response for debugging
   * This bypasses team processors and extracts data directly from the API response
   */
  static extractDirectDashboardData(playerStatus: FunifierPlayerStatus): DashboardData {
    // Challenge IDs for goal tracking
    const CHALLENGE_IDS = {
      ATIVIDADE: 'E6FQIjs',
      REAIS_POR_ATIVO: 'E6Gm8RI', 
      FATURAMENTO: 'E6GglPq'
    };

    // Extract basic player info
    const playerName = playerStatus.name;
    const totalPoints = playerStatus.total_points;
    
    // Check if points are unlocked (E6F0O5f > 0)
    const pointsLocked = !(playerStatus.catalog_items?.['E6F0O5f'] > 0);
    
    // Check boost status
    const boost1Active = (playerStatus.catalog_items?.['E6F0WGc'] || 0) > 0;
    const boost2Active = (playerStatus.catalog_items?.['E6K79Mt'] || 0) > 0;
    
    // Extract goal progress from challenge_progress
    const getGoalProgress = (challengeId: string): number => {
      const challenge = playerStatus.challenge_progress?.find(c => c.challenge === challengeId);
      return challenge ? Math.round(challenge.percent_completed) : 0;
    };

    const atividadeProgress = getGoalProgress(CHALLENGE_IDS.ATIVIDADE);
    const reaisProgress = getGoalProgress(CHALLENGE_IDS.REAIS_POR_ATIVO);
    const faturamentoProgress = getGoalProgress(CHALLENGE_IDS.FATURAMENTO);

    // Determine team type from teams array (simplified)
    const teamId = playerStatus.teams?.[0];
    let teamType: TeamType = TeamType.CARTEIRA_I; // Default
    
    switch (teamId) {
      case 'E6F4sCh':
        teamType = TeamType.CARTEIRA_I;
        break;
      case 'E6F4O1b':
        teamType = TeamType.CARTEIRA_II;
        break;
      case 'E6F4Xf2':
        teamType = TeamType.CARTEIRA_III;
        break;
      case 'E6F41Bb':
        teamType = TeamType.CARTEIRA_IV;
        break;
    }

    // Set goals based on team type
    let primaryGoal: { name: string; percentage: number; emoji: string };
    let secondaryGoal1: { name: string; percentage: number; emoji: string; isBoostActive: boolean };
    let secondaryGoal2: { name: string; percentage: number; emoji: string; isBoostActive: boolean };
    
    switch (teamType) {
      case TeamType.CARTEIRA_I:
        primaryGoal = { name: 'Atividade', percentage: atividadeProgress, emoji: '🎯' };
        secondaryGoal1 = { name: 'Reais por Ativo', percentage: reaisProgress, emoji: '💰', isBoostActive: boost1Active };
        secondaryGoal2 = { name: 'Faturamento', percentage: faturamentoProgress, emoji: '📈', isBoostActive: boost2Active };
        break;
      case TeamType.CARTEIRA_II:
        primaryGoal = { name: 'Reais por Ativo', percentage: reaisProgress, emoji: '💰' };
        secondaryGoal1 = { name: 'Atividade', percentage: atividadeProgress, emoji: '🎯', isBoostActive: boost1Active };
        secondaryGoal2 = { name: 'Multimarcas por Ativo', percentage: 0, emoji: '🏪', isBoostActive: boost2Active }; // No data yet
        break;
      case TeamType.CARTEIRA_III:
      case TeamType.CARTEIRA_IV:
        primaryGoal = { name: 'Faturamento', percentage: faturamentoProgress, emoji: '📈' };
        secondaryGoal1 = { name: 'Reais por Ativo', percentage: reaisProgress, emoji: '💰', isBoostActive: boost1Active };
        secondaryGoal2 = { name: 'Multimarcas por Ativo', percentage: 0, emoji: '🏪', isBoostActive: boost2Active }; // No data yet
        break;
    }

    const generateDescription = (percentage: number): string => {
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
    };

    return {
      playerName,
      totalPoints,
      pointsLocked,
      currentCycleDay: 15, // Default until we get from reports
      totalCycleDays: 21, // Default until we get from reports
      isDataFromCollection: false, // No report data yet
      primaryGoal: {
        name: primaryGoal.name,
        percentage: primaryGoal.percentage,
        description: generateDescription(primaryGoal.percentage),
        emoji: primaryGoal.emoji
      },
      secondaryGoal1: {
        name: secondaryGoal1.name,
        percentage: secondaryGoal1.percentage,
        description: generateDescription(secondaryGoal1.percentage),
        emoji: secondaryGoal1.emoji,
        hasBoost: true as const,
        isBoostActive: secondaryGoal1.isBoostActive
      },
      secondaryGoal2: {
        name: secondaryGoal2.name,
        percentage: secondaryGoal2.percentage,
        description: generateDescription(secondaryGoal2.percentage),
        emoji: secondaryGoal2.emoji,
        hasBoost: true as const,
        isBoostActive: secondaryGoal2.isBoostActive
      }
    };
  }
}