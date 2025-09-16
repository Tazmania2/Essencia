import { FunifierPlayerService } from './funifier-player.service';
import { FunifierDatabaseService } from './funifier-database.service';
import { TeamProcessorFactory } from './team-processor-factory.service';
import { UserIdentificationService } from './user-identification.service';
import { dashboardCache, playerDataCache, CacheKeys } from './cache.service';
import { secureLogger } from '../utils/logger';
import { 
  FunifierPlayerStatus, 
  EssenciaReportRecord, 
  EnhancedReportRecord,
  CSVGoalData,
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
      secureLogger.log('🚀 Dashboard service called for player:', playerId);
      
      // Check cache first
      const cacheKey = CacheKeys.dashboardData(playerId, 'unknown');
      const cachedData = dashboardCache.get<DashboardData>(cacheKey);
      
      if (cachedData) {
        secureLogger.log('📋 Returning cached dashboard data for:', playerId);
        return cachedData;
      }

      // Get player status from Funifier (with caching) - PRIMARY DATA SOURCE
      secureLogger.log('🔍 Fetching player status from Funifier for:', playerId);
      const playerStatus = await playerDataCache.getOrSet(
        CacheKeys.playerStatus(playerId),
        () => this.playerService.getPlayerStatus(playerId),
        2 * 60 * 1000 // 2 minutes TTL
      );
      
      secureLogger.log('👤 Player status received:', {
        name: playerStatus.name,
        totalPoints: playerStatus.total_points,
        challengeProgressCount: playerStatus.challenge_progress?.length || 0
      });
      
      // Identify team type
      const teamInfo = this.userIdentificationService.extractTeamInformation(playerStatus);
      const teamType = teamInfo.teamType;
      
      // Get enhanced data from database (for missing info and goal details)
      const { reportRecord, csvData } = await this.getEnhancedReportData(playerId);
      
      // Get regular report data as fallback
      const reportData = await this.getLatestReportData(playerId);
      
      // Create enhanced report data that combines both sources
      const enhancedReportData = this.createEnhancedReportData(reportData, reportRecord);
      
      // Process data using appropriate team processor
      if (!teamType) {
        throw new Error(`Unable to determine team type for player ${playerId}`);
      }
      
      const processor = this.teamProcessorFactory.getProcessor(teamType);
      const playerMetrics = processor.processPlayerData(playerStatus, enhancedReportData);
      
      // Convert to dashboard format with enhanced data
      const dashboardData = this.convertTodashboardData(playerMetrics, teamType, reportData, reportRecord, csvData);
      
      // Cache the result with team-specific key
      const teamSpecificCacheKey = CacheKeys.dashboardData(playerId, teamType);
      dashboardCache.set(teamSpecificCacheKey, dashboardData, 2 * 60 * 1000); // 2 minutes TTL
      
      return dashboardData;
    } catch (error) {
      secureLogger.error('Error getting dashboard data:', error);
      throw error;
    }
  }

  private async getLatestReportData(playerId: string): Promise<EssenciaReportRecord | undefined> {
    try {
      const result = await this.databaseService.getLatestPlayerReport(playerId);
      return result || undefined;
    } catch (error) {
      secureLogger.warn('Could not fetch report data, using defaults:', error);
      return undefined;
    }
  }

  private async getEnhancedReportData(playerId: string): Promise<{
    reportRecord: any;
    csvData: any;
  }> {
    try {
      secureLogger.log('🔍 Fetching enhanced report data for player:', playerId);
      const result = await this.databaseService.getCompletePlayerData(playerId);
      secureLogger.log('📊 Enhanced data result:', {
        hasReportRecord: !!result.reportRecord,
        hasCsvData: !!result.csvData,
        reportRecord: result.reportRecord ? 'Found' : 'Not found',
        csvData: result.csvData ? 'Found' : 'Not found'
      });
      return result;
    } catch (error) {
      secureLogger.warn('Could not fetch enhanced report data, continuing with Funifier data only:', error);
      // Always return safe defaults to prevent dashboard breakage
      return { reportRecord: null, csvData: null };
    }
  }

  private createEnhancedReportData(
    regularReportData: EssenciaReportRecord | undefined,
    enhancedReportRecord: any
  ): EssenciaReportRecord | undefined {
    // If we have enhanced data, use it to supplement regular data
    if (enhancedReportRecord) {
      secureLogger.log('🔄 Creating enhanced report data from database record');
      
      const enhancedData: EssenciaReportRecord = {
        _id: enhancedReportRecord._id || 'enhanced',
        playerId: enhancedReportRecord.playerId,
        playerName: regularReportData?.playerName || 'Unknown',
        team: regularReportData?.team || TeamType.CARTEIRA_I,
        // Use enhanced percentages from database
        atividade: enhancedReportRecord.atividadePercentual,
        reaisPorAtivo: enhancedReportRecord.reaisPorAtivoPercentual,
        faturamento: enhancedReportRecord.faturamentoPercentual,
        multimarcasPorAtivo: enhancedReportRecord.multimarcasPorAtivoPercentual,
        // Use enhanced cycle data
        currentCycleDay: enhancedReportRecord.diaDociclo,
        totalCycleDays: enhancedReportRecord.totalDiasCiclo,
        reportDate: enhancedReportRecord.reportDate,
        createdAt: enhancedReportRecord.createdAt,
        updatedAt: enhancedReportRecord.updatedAt || enhancedReportRecord.createdAt
      };

      secureLogger.log('✅ Enhanced report data created:', {
        atividade: enhancedData.atividade,
        reaisPorAtivo: enhancedData.reaisPorAtivo,
        faturamento: enhancedData.faturamento,
        multimarcasPorAtivo: enhancedData.multimarcasPorAtivo,
        currentCycleDay: enhancedData.currentCycleDay,
        totalCycleDays: enhancedData.totalCycleDays
      });

      return enhancedData;
    }

    // Fallback to regular report data
    secureLogger.log('📋 Using regular report data as fallback');
    return regularReportData;
  }

  private convertTodashboardData(
    metrics: PlayerMetrics, 
    teamType: TeamType, 
    reportData?: EssenciaReportRecord,
    enhancedRecord?: any,
    csvData?: any
  ): DashboardData {
    const goalEmojis = this.getGoalEmojis(teamType);
    
    // Calculate cycle information with fallbacks (enhanced data takes priority)
    const totalCycleDays = enhancedRecord?.totalDiasCiclo || csvData?.totalCycleDays || reportData?.totalCycleDays || 21;
    const currentCycleDay = enhancedRecord?.diaDociclo || csvData?.cycleDay || reportData?.currentCycleDay || metrics.currentCycleDay;
    const daysRemaining = Math.max(0, totalCycleDays - currentCycleDay);
    
    // Helper function to get enhanced goal data with error handling
    const getEnhancedGoalData = (goalName: string) => {
      try {
        if (!csvData) return {};
        
        const goalKey = this.getGoalKeyFromName(goalName);
        const goalData = csvData[goalKey];
        
        if (!goalData) return {};
        
        // Validate data before using
        if (typeof goalData.target !== 'number' || typeof goalData.current !== 'number') {
          secureLogger.warn(`Invalid goal data for ${goalName}:`, goalData);
          return {};
        }
        
        return {
          target: goalData.target,
          current: goalData.current,
          unit: this.getGoalUnit(goalKey),
          daysRemaining: daysRemaining
        };
      } catch (error) {
        secureLogger.warn(`Error processing enhanced goal data for ${goalName}:`, error);
        return {};
      }
    };

    return {
      playerName: metrics.playerName,
      totalPoints: metrics.totalPoints,
      pointsLocked: metrics.pointsLocked,
      currentCycleDay: currentCycleDay,
      totalCycleDays: totalCycleDays,
      isDataFromCollection: !!reportData || !!enhancedRecord, // True if we have any database data
      primaryGoal: {
        name: metrics.primaryGoal.name,
        percentage: metrics.primaryGoal.percentage,
        description: this.generateGoalDescription(metrics.primaryGoal),
        emoji: goalEmojis.primary,
        ...getEnhancedGoalData(metrics.primaryGoal.name)
      },
      secondaryGoal1: {
        name: metrics.secondaryGoal1.name,
        percentage: metrics.secondaryGoal1.percentage,
        description: this.generateGoalDescription(metrics.secondaryGoal1),
        emoji: goalEmojis.secondary1,
        hasBoost: true,
        isBoostActive: metrics.secondaryGoal1.boostActive || false,
        ...getEnhancedGoalData(metrics.secondaryGoal1.name)
      },
      secondaryGoal2: {
        name: metrics.secondaryGoal2.name,
        percentage: metrics.secondaryGoal2.percentage,
        description: this.generateGoalDescription(metrics.secondaryGoal2),
        emoji: goalEmojis.secondary2,
        hasBoost: true,
        isBoostActive: metrics.secondaryGoal2.boostActive || false,
        ...getEnhancedGoalData(metrics.secondaryGoal2.name)
      }
    };
  }

  private getGoalEmojis(teamType: TeamType): { primary: string; secondary1: string; secondary2: string } {
    const emojiMap = {
      [TeamType.CARTEIRA_0]: {
        primary: '🔄', // Conversões
        secondary1: '💰', // Reais por Ativo
        secondary2: '📈' // Faturamento
      },
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
      },
      [TeamType.ER]: {
        primary: '📈', // Faturamento
        secondary1: '💰', // Reais por Ativo
        secondary2: '📊' // UPA
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

  private getGoalKeyFromName(goalName: string): 'faturamento' | 'reaisPorAtivo' | 'multimarcasPorAtivo' | 'atividade' {
    const nameMap: Record<string, 'faturamento' | 'reaisPorAtivo' | 'multimarcasPorAtivo' | 'atividade'> = {
      'Faturamento': 'faturamento',
      'Reais por Ativo': 'reaisPorAtivo',
      'Multimarcas por Ativo': 'multimarcasPorAtivo',
      'Atividade': 'atividade'
    };
    
    return nameMap[goalName] || 'atividade';
  }

  private getGoalUnit(goalType: 'faturamento' | 'reaisPorAtivo' | 'multimarcasPorAtivo' | 'atividade'): string {
    const units = {
      faturamento: 'R$',
      reaisPorAtivo: 'R$',
      multimarcasPorAtivo: 'marcas',
      atividade: 'pontos'
    };

    return units[goalType] || '';
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
      secureLogger.error('Error processing player data to dashboard:', error);
      throw error;
    }
  }

  /**
   * Extract dashboard data directly from Funifier API response for debugging
   * This bypasses team processors and extracts data directly from the API response
   * 
   * IMPORTANT: When players reach 100% and have boosts active, Funifier stops tracking
   * progress in challenge_progress. In this case, we should fetch from collection data.
   */
  static extractDirectDashboardData(playerStatus: FunifierPlayerStatus): DashboardData {
    // Extract basic player info
    const playerName = playerStatus.name;
    const totalPoints = playerStatus.total_points;
    
    // Check if points are unlocked (E6F0O5f > 0)
    const pointsLocked = !(playerStatus.catalog_items?.['E6F0O5f'] > 0);
    
    // Check boost status - this indicates if player has reached 100% on secondary goals
    const boost1Active = (playerStatus.catalog_items?.['E6F0WGc'] || 0) > 0;
    const boost2Active = (playerStatus.catalog_items?.['E6K79Mt'] || 0) > 0;

    // Determine team type from teams array first
    const teamId = playerStatus.teams?.[0];
    let teamType: TeamType = TeamType.CARTEIRA_I; // Default
    
    switch (teamId) {
      case 'E6F5k30':
        teamType = TeamType.CARTEIRA_0;
        break;
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
      case 'E500AbT':
        teamType = TeamType.ER;
        break;
    }

    // Team-specific challenge IDs for goal tracking
    let challengeIds: { atividade?: string; reaisPorAtivo: string; faturamento?: string; multimarcas?: string; conversoes?: string; upa?: string };
    
    switch (teamType) {
      case TeamType.CARTEIRA_0:
        challengeIds = {
          conversoes: 'E6GglPq',     // Carteira 0 - Conversões (reusing challenge ID)
          reaisPorAtivo: 'E6Gm8RI',  // Carteira I, III & IV - Subir Reais por Ativo
          faturamento: 'E6GglPq'     // Carteira I - Bater Faturamento (Meta)
        };
        break;
      case TeamType.CARTEIRA_I:
        challengeIds = {
          atividade: 'E6FQIjs',      // Carteira I - Bater Meta Atividade %
          reaisPorAtivo: 'E6Gm8RI',  // Carteira I, III & IV - Subir Reais por Ativo
          faturamento: 'E6GglPq'     // Carteira I - Bater Faturamento (Meta)
        };
        break;
      case TeamType.CARTEIRA_II:
        challengeIds = {
          reaisPorAtivo: 'E6MTIIK',  // Carteira II - Subir Reais por Ativo (PRIMARY GOAL)
          atividade: 'E6Gv58l',      // Carteira II - Subir Atividade (SECONDARY GOAL 1)
          multimarcas: 'E6MWJKs'     // Carteira II - Subir Multimarcas por Ativo (SECONDARY GOAL 2)
        };
        break;
      case TeamType.CARTEIRA_III:
      case TeamType.CARTEIRA_IV:
        challengeIds = {
          faturamento: 'E6Gahd4',    // Carteira III & IV - Subir Faturamento (Pre-Meta)
          reaisPorAtivo: 'E6Gm8RI',  // Carteira I, III & IV - Subir Reais por Ativo
          multimarcas: 'E6MMH5v'     // Carteira III & IV - Subir Multimarcas por Ativo
        };
        break;
      case TeamType.ER:
        challengeIds = {
          faturamento: 'E6Gahd4',    // Carteira III & IV - Subir Faturamento (Pre-Meta) (reused)
          reaisPorAtivo: 'E6Gm8RI',  // Carteira I, III & IV - Subir Reais por Ativo (reused)
          upa: 'E62x2PW'             // ER - UPA metric
        };
        break;
    }

    // Extract goal progress from challenge_progress using team-specific challenge IDs
    const getGoalProgress = (challengeId: string): number => {
      const challenge = playerStatus.challenge_progress?.find(c => c.challenge === challengeId);
      return challenge ? Math.round(challenge.percent_completed) : 0;
    };

    let atividadeProgress = challengeIds.atividade ? getGoalProgress(challengeIds.atividade) : 0;
    let reaisProgress = getGoalProgress(challengeIds.reaisPorAtivo);
    let faturamentoProgress = challengeIds.faturamento ? getGoalProgress(challengeIds.faturamento) : 0;
    let multimarcasProgress = challengeIds.multimarcas ? getGoalProgress(challengeIds.multimarcas) : 0;
    let conversoesProgress = challengeIds.conversoes ? getGoalProgress(challengeIds.conversoes) : 0;
    let upaProgress = challengeIds.upa ? getGoalProgress(challengeIds.upa) : 0;

    // IMPORTANT: When boosts are active, it means the player reached 100% on those goals
    // and Funifier stops tracking progress. We need to show 100%+ for those goals to trigger green color.
    // In a real implementation, this data should come from the collection/report data.
    
    // For now, if boost is active, show 101% minimum for the corresponding secondary goals
    // This ensures the progress bar shows green (100%+ range) instead of yellow (50-100% range)
    switch (teamType) {
      case TeamType.CARTEIRA_0:
        if (boost1Active && reaisProgress <= 100) {
          reaisProgress = 101; // Reais por Ativo reached 100%+ (boost1 = secondary goal 1)
        }
        if (boost2Active && faturamentoProgress <= 100) {
          faturamentoProgress = 101; // Faturamento reached 100%+ (boost2 = secondary goal 2)
        }
        break;
      case TeamType.CARTEIRA_I:
        if (boost1Active && reaisProgress <= 100) {
          reaisProgress = 101; // Reais por Ativo reached 100%+ (boost1 = secondary goal 1)
        }
        if (boost2Active && faturamentoProgress <= 100) {
          faturamentoProgress = 101; // Faturamento reached 100%+ (boost2 = secondary goal 2)
        }
        break;
      case TeamType.CARTEIRA_II:
        if (boost1Active && atividadeProgress <= 100) {
          atividadeProgress = 101; // Atividade reached 100%+ (boost1 = secondary goal 1)
        }
        if (boost2Active && multimarcasProgress <= 100) {
          multimarcasProgress = 101; // Multimarcas por Ativo reached 100%+ (boost2 = secondary goal 2)
        }
        break;
      case TeamType.CARTEIRA_III:
      case TeamType.CARTEIRA_IV:
        if (boost1Active && reaisProgress <= 100) {
          reaisProgress = 101; // Reais por Ativo reached 100%+ (boost1 = secondary goal 1)
        }
        if (boost2Active && multimarcasProgress <= 100) {
          multimarcasProgress = 101; // Multimarcas por Ativo reached 100%+ (boost2 = secondary goal 2)
        }
        break;
      case TeamType.ER:
        if (boost1Active && reaisProgress <= 100) {
          reaisProgress = 101; // Reais por Ativo reached 100%+ (boost1 = secondary goal 1)
        }
        if (boost2Active && upaProgress <= 100) {
          upaProgress = 101; // UPA reached 100%+ (boost2 = secondary goal 2)
        }
        break;
    }

    // Set goals based on team type
    let primaryGoal: { name: string; percentage: number; emoji: string };
    let secondaryGoal1: { name: string; percentage: number; emoji: string; isBoostActive: boolean };
    let secondaryGoal2: { name: string; percentage: number; emoji: string; isBoostActive: boolean };
    
    switch (teamType) {
      case TeamType.CARTEIRA_0:
        primaryGoal = { name: 'Conversões', percentage: conversoesProgress, emoji: '🔄' };
        secondaryGoal1 = { name: 'Reais por Ativo', percentage: reaisProgress, emoji: '💰', isBoostActive: boost1Active };
        secondaryGoal2 = { name: 'Faturamento', percentage: faturamentoProgress, emoji: '📈', isBoostActive: boost2Active };
        break;
      case TeamType.CARTEIRA_I:
        primaryGoal = { name: 'Atividade', percentage: atividadeProgress, emoji: '🎯' };
        secondaryGoal1 = { name: 'Reais por Ativo', percentage: reaisProgress, emoji: '💰', isBoostActive: boost1Active };
        secondaryGoal2 = { name: 'Faturamento', percentage: faturamentoProgress, emoji: '📈', isBoostActive: boost2Active };
        break;
      case TeamType.CARTEIRA_II:
        primaryGoal = { name: 'Reais por Ativo', percentage: reaisProgress, emoji: '💰' };
        secondaryGoal1 = { name: 'Atividade', percentage: atividadeProgress, emoji: '🎯', isBoostActive: boost1Active };
        secondaryGoal2 = { name: 'Multimarcas por Ativo', percentage: multimarcasProgress, emoji: '🏪', isBoostActive: boost2Active };
        break;
      case TeamType.CARTEIRA_III:
      case TeamType.CARTEIRA_IV:
        primaryGoal = { name: 'Faturamento', percentage: faturamentoProgress, emoji: '📈' };
        secondaryGoal1 = { name: 'Reais por Ativo', percentage: reaisProgress, emoji: '💰', isBoostActive: boost1Active };
        secondaryGoal2 = { name: 'Multimarcas por Ativo', percentage: multimarcasProgress, emoji: '🏪', isBoostActive: boost2Active };
        break;
      case TeamType.ER:
        primaryGoal = { name: 'Faturamento', percentage: faturamentoProgress, emoji: '📈' };
        secondaryGoal1 = { name: 'Reais por Ativo', percentage: reaisProgress, emoji: '💰', isBoostActive: boost1Active };
        secondaryGoal2 = { name: 'UPA', percentage: upaProgress, emoji: '📊', isBoostActive: boost2Active };
        break;
    }

    const generateDescription = (percentage: number, isBoostActive: boolean): string => {
      if (isBoostActive && percentage >= 100) {
        return `Meta superada! ${percentage}% concluído - Boost ativo! 🚀`;
      } else if (percentage >= 100) {
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
        description: generateDescription(primaryGoal.percentage, false),
        emoji: primaryGoal.emoji
      },
      secondaryGoal1: {
        name: secondaryGoal1.name,
        percentage: secondaryGoal1.percentage,
        description: generateDescription(secondaryGoal1.percentage, secondaryGoal1.isBoostActive),
        emoji: secondaryGoal1.emoji,
        hasBoost: true as const,
        isBoostActive: secondaryGoal1.isBoostActive
      },
      secondaryGoal2: {
        name: secondaryGoal2.name,
        percentage: secondaryGoal2.percentage,
        description: generateDescription(secondaryGoal2.percentage, secondaryGoal2.isBoostActive),
        emoji: secondaryGoal2.emoji,
        hasBoost: true as const,
        isBoostActive: secondaryGoal2.isBoostActive
      }
    };
  }
}