import { FunifierPlayerService } from './funifier-player.service';
import { FunifierDatabaseService } from './funifier-database.service';
import { TeamProcessorFactory } from './team-processor-factory.service';
import { UserIdentificationService } from './user-identification.service';
import { dashboardConfigurationService } from './dashboard-configuration.service';
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
  DashboardConfig,
  DashboardConfigurationRecord,
  FUNIFIER_CONFIG 
} from '../types';
import { PrecisionMath } from '../utils/precision-math';

export class DashboardService {
  private configurationCache: DashboardConfigurationRecord | null = null;
  private configCacheTimestamp: number = 0;
  private readonly CONFIG_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(
    private playerService: FunifierPlayerService,
    private databaseService: FunifierDatabaseService,
    private teamProcessorFactory: TeamProcessorFactory,
    private userIdentificationService: UserIdentificationService
  ) {}

  async getDashboardData(playerId: string, token: string, selectedTeamType?: TeamType): Promise<DashboardData> {
    try {
      secureLogger.log('🚀 Dashboard service called for player:', playerId);
      
      // Get current configuration first
      const configuration = await this.getCurrentConfiguration();
      
      // Check cache first (include configuration version in cache key)
      const cacheKey = CacheKeys.dashboardData(playerId, selectedTeamType || 'unknown') + `_config_${configuration.version}`;
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
      
      // Use selected team type if provided, otherwise determine from player data
      let teamType: TeamType;
      if (selectedTeamType) {
        // Validate that the user has access to the selected team
        const teamInfo = this.userIdentificationService.extractTeamInformation(playerStatus);
        const hasAccess = teamInfo.allTeamTypes.includes(selectedTeamType);
        if (!hasAccess) {
          throw new Error(`User does not have access to team type: ${selectedTeamType}`);
        }
        teamType = selectedTeamType;
      } else {
        // Fallback to primary team
        const teamInfo = this.userIdentificationService.extractTeamInformation(playerStatus);
        if (!teamInfo.teamType) {
          throw new Error(`Unable to determine team type for player ${playerId}`);
        }
        teamType = teamInfo.teamType;
      }
      
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
      
      // Get team-specific configuration
      const teamConfig = configuration.configurations[teamType];
      
      const processor = this.teamProcessorFactory.getProcessor(teamType);
      const playerMetrics = processor.processPlayerData(playerStatus, enhancedReportData, teamConfig);
      
      // Convert to dashboard format with enhanced data and configuration
      const dashboardData = this.convertTodashboardData(playerMetrics, teamType, reportData, reportRecord, csvData, teamConfig);
      
      // Cache the result with team-specific key including configuration version
      const teamSpecificCacheKey = CacheKeys.dashboardData(playerId, teamType) + `_config_${configuration.version}`;
      dashboardCache.set(teamSpecificCacheKey, dashboardData, 2 * 60 * 1000); // 2 minutes TTL
      
      return dashboardData;
    } catch (error) {
      secureLogger.error('Error getting dashboard data:', error);
      throw error;
    }
  }

  /**
   * Get current dashboard configuration with caching
   */
  private async getCurrentConfiguration(): Promise<DashboardConfigurationRecord> {
    try {
      // Check cache first
      if (this.isConfigCacheValid()) {
        secureLogger.log('📋 Returning cached dashboard configuration');
        return this.configurationCache!;
      }

      // Fetch from configuration service
      const configuration = await dashboardConfigurationService.getCurrentConfiguration();
      
      // Update cache
      this.configurationCache = configuration;
      this.configCacheTimestamp = Date.now();
      
      secureLogger.log('🔧 Dashboard configuration loaded', { version: configuration.version });
      return configuration;
    } catch (error) {
      secureLogger.error('Failed to get dashboard configuration, using defaults:', error);
      // Fallback to default configuration
      const defaultConfig = dashboardConfigurationService.getDefaultConfiguration();
      this.configurationCache = defaultConfig;
      this.configCacheTimestamp = Date.now();
      return defaultConfig;
    }
  }

  /**
   * Check if configuration cache is still valid
   */
  private isConfigCacheValid(): boolean {
    return this.configurationCache !== null && 
           (Date.now() - this.configCacheTimestamp) < this.CONFIG_CACHE_TTL;
  }

  /**
   * Clear configuration cache (called when configuration changes)
   */
  public clearConfigurationCache(): void {
    this.configurationCache = null;
    this.configCacheTimestamp = 0;
    // Also clear dashboard data cache since it depends on configuration
    dashboardCache.clear();
    secureLogger.log('🧹 Dashboard configuration cache cleared');
  }

  /**
   * Get team configuration for a specific team type
   */
  public async getTeamConfiguration(teamType: TeamType): Promise<DashboardConfig> {
    const configuration = await this.getCurrentConfiguration();
    return configuration.configurations[teamType];
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
    csvData?: any,
    teamConfig?: DashboardConfig
  ): DashboardData {
    // Use configuration for emojis if available, otherwise fallback to hardcoded
    const goalEmojis = teamConfig ? {
      primary: teamConfig.primaryGoal.emoji,
      secondary1: teamConfig.secondaryGoal1.emoji,
      secondary2: teamConfig.secondaryGoal2.emoji
    } : this.getGoalEmojis(teamType);
    
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
      hasSpecialProcessing: teamConfig?.specialProcessing?.type === 'carteira_ii_local',
      specialProcessingNote: teamConfig?.specialProcessing?.description || "Pontos calculados localmente",
      primaryGoal: {
        name: teamConfig?.primaryGoal.displayName || metrics.primaryGoal.name,
        percentage: metrics.primaryGoal.percentage,
        description: this.generateGoalDescription(metrics.primaryGoal),
        emoji: goalEmojis.primary,
        ...getEnhancedGoalData(teamConfig?.primaryGoal.displayName || metrics.primaryGoal.name)
      },
      secondaryGoal1: {
        name: teamConfig?.secondaryGoal1.displayName || metrics.secondaryGoal1.name,
        percentage: metrics.secondaryGoal1.percentage,
        description: this.generateGoalDescription(metrics.secondaryGoal1),
        emoji: goalEmojis.secondary1,
        hasBoost: true,
        isBoostActive: metrics.secondaryGoal1.boostActive || false,
        ...getEnhancedGoalData(teamConfig?.secondaryGoal1.displayName || metrics.secondaryGoal1.name)
      },
      secondaryGoal2: {
        name: teamConfig?.secondaryGoal2.displayName || metrics.secondaryGoal2.name,
        percentage: metrics.secondaryGoal2.percentage,
        description: this.generateGoalDescription(metrics.secondaryGoal2),
        emoji: goalEmojis.secondary2,
        hasBoost: true,
        isBoostActive: metrics.secondaryGoal2.boostActive || false,
        ...getEnhancedGoalData(teamConfig?.secondaryGoal2.displayName || metrics.secondaryGoal2.name)
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

  /**
   * Get challenge IDs from configuration or use defaults
   */
  private static getChallengeIdsFromConfig(
    teamType: TeamType, 
    teamConfig?: DashboardConfig
  ): { atividade?: string; reaisPorAtivo: string; faturamento?: string; multimarcas?: string; conversoes?: string; upa?: string } {
    if (teamConfig) {
      // Use configuration challenge IDs
      return {
        atividade: teamConfig.primaryGoal.name === 'Atividade' ? teamConfig.primaryGoal.challengeId : 
                  teamConfig.secondaryGoal1.name === 'Atividade' ? teamConfig.secondaryGoal1.challengeId :
                  teamConfig.secondaryGoal2.name === 'Atividade' ? teamConfig.secondaryGoal2.challengeId : undefined,
        reaisPorAtivo: teamConfig.primaryGoal.name === 'Reais por Ativo' ? teamConfig.primaryGoal.challengeId : 
                      teamConfig.secondaryGoal1.name === 'Reais por Ativo' ? teamConfig.secondaryGoal1.challengeId :
                      teamConfig.secondaryGoal2.name === 'Reais por Ativo' ? teamConfig.secondaryGoal2.challengeId : 'E6Gm8RI',
        faturamento: teamConfig.primaryGoal.name === 'Faturamento' ? teamConfig.primaryGoal.challengeId : 
                    teamConfig.secondaryGoal1.name === 'Faturamento' ? teamConfig.secondaryGoal1.challengeId :
                    teamConfig.secondaryGoal2.name === 'Faturamento' ? teamConfig.secondaryGoal2.challengeId : undefined,
        multimarcas: teamConfig.primaryGoal.name === 'Multimarcas por Ativo' ? teamConfig.primaryGoal.challengeId : 
                    teamConfig.secondaryGoal1.name === 'Multimarcas por Ativo' ? teamConfig.secondaryGoal1.challengeId :
                    teamConfig.secondaryGoal2.name === 'Multimarcas por Ativo' ? teamConfig.secondaryGoal2.challengeId : undefined,
        conversoes: teamConfig.primaryGoal.name === 'Conversões' ? teamConfig.primaryGoal.challengeId : 
                   teamConfig.secondaryGoal1.name === 'Conversões' ? teamConfig.secondaryGoal1.challengeId :
                   teamConfig.secondaryGoal2.name === 'Conversões' ? teamConfig.secondaryGoal2.challengeId : undefined,
        upa: teamConfig.primaryGoal.name === 'UPA' ? teamConfig.primaryGoal.challengeId : 
            teamConfig.secondaryGoal1.name === 'UPA' ? teamConfig.secondaryGoal1.challengeId :
            teamConfig.secondaryGoal2.name === 'UPA' ? teamConfig.secondaryGoal2.challengeId : undefined
      };
    }

    // Fallback to hardcoded defaults
    switch (teamType) {
      case TeamType.CARTEIRA_0:
        return {
          conversoes: 'E6GglPq',     // Carteira 0 - Conversões (reusing challenge ID)
          reaisPorAtivo: 'E6Gm8RI',  // Carteira I, III & IV - Subir Reais por Ativo
          faturamento: 'E6GglPq'     // Carteira I - Bater Faturamento (Meta)
        };
      case TeamType.CARTEIRA_I:
        return {
          atividade: 'E6FQIjs',      // Carteira I - Bater Meta Atividade %
          reaisPorAtivo: 'E6Gm8RI',  // Carteira I, III & IV - Subir Reais por Ativo
          faturamento: 'E6GglPq'     // Carteira I - Bater Faturamento (Meta)
        };
      case TeamType.CARTEIRA_II:
        return {
          reaisPorAtivo: 'E6MTIIK',  // Carteira II - Subir Reais por Ativo (PRIMARY GOAL)
          atividade: 'E6Gv58l',      // Carteira II - Subir Atividade (SECONDARY GOAL 1)
          multimarcas: 'E6MWJKs'     // Carteira II - Subir Multimarcas por Ativo (SECONDARY GOAL 2)
        };
      case TeamType.CARTEIRA_III:
      case TeamType.CARTEIRA_IV:
        return {
          faturamento: 'E6Gahd4',    // Carteira III & IV - Subir Faturamento (Pre-Meta)
          reaisPorAtivo: 'E6Gm8RI',  // Carteira I, III & IV - Subir Reais por Ativo
          multimarcas: 'E6MMH5v'     // Carteira III & IV - Subir Multimarcas por Ativo
        };
      case TeamType.ER:
        return {
          faturamento: 'E6Gahd4',    // Carteira III & IV - Subir Faturamento (Pre-Meta) (reused)
          reaisPorAtivo: 'E6Gm8RI',  // Carteira I, III & IV - Subir Reais por Ativo (reused)
          upa: 'E62x2PW'             // ER - UPA metric
        };
      default:
        return { reaisPorAtivo: 'E6Gm8RI' };
    }
  }

  /**
   * Get goal data from configuration or use defaults
   */
  private static getGoalDataFromConfig(
    teamType: TeamType,
    teamConfig: DashboardConfig | undefined,
    progressData: {
      atividade: number;
      reaisPorAtivo: number;
      faturamento: number;
      multimarcasPorAtivo: number;
      conversoes: number;
      upa: number;
    },
    boostStatus: { boost1Active: boolean; boost2Active: boolean }
  ): {
    primaryGoal: { name: string; percentage: number; emoji: string };
    secondaryGoal1: { name: string; percentage: number; emoji: string; isBoostActive: boolean };
    secondaryGoal2: { name: string; percentage: number; emoji: string; isBoostActive: boolean };
  } {
    if (teamConfig) {
      // Use configuration
      const getProgressForMetric = (metricName: string): number => {
        switch (metricName) {
          case 'Atividade': return progressData.atividade;
          case 'Reais por Ativo': return progressData.reaisPorAtivo;
          case 'Faturamento': return progressData.faturamento;
          case 'Multimarcas por Ativo': return progressData.multimarcasPorAtivo;
          case 'Conversões': return progressData.conversoes;
          case 'UPA': return progressData.upa;
          default: return 0;
        }
      };

      return {
        primaryGoal: {
          name: teamConfig.primaryGoal.displayName,
          percentage: getProgressForMetric(teamConfig.primaryGoal.name),
          emoji: teamConfig.primaryGoal.emoji
        },
        secondaryGoal1: {
          name: teamConfig.secondaryGoal1.displayName,
          percentage: getProgressForMetric(teamConfig.secondaryGoal1.name),
          emoji: teamConfig.secondaryGoal1.emoji,
          isBoostActive: boostStatus.boost1Active
        },
        secondaryGoal2: {
          name: teamConfig.secondaryGoal2.displayName,
          percentage: getProgressForMetric(teamConfig.secondaryGoal2.name),
          emoji: teamConfig.secondaryGoal2.emoji,
          isBoostActive: boostStatus.boost2Active
        }
      };
    }

    // Fallback to hardcoded defaults
    switch (teamType) {
      case TeamType.CARTEIRA_0:
        return {
          primaryGoal: { name: 'Conversões', percentage: progressData.conversoes, emoji: '🔄' },
          secondaryGoal1: { name: 'Reais por Ativo', percentage: progressData.reaisPorAtivo, emoji: '💰', isBoostActive: boostStatus.boost1Active },
          secondaryGoal2: { name: 'Faturamento', percentage: progressData.faturamento, emoji: '📈', isBoostActive: boostStatus.boost2Active }
        };
      case TeamType.CARTEIRA_I:
        return {
          primaryGoal: { name: 'Atividade', percentage: progressData.atividade, emoji: '🎯' },
          secondaryGoal1: { name: 'Reais por Ativo', percentage: progressData.reaisPorAtivo, emoji: '💰', isBoostActive: boostStatus.boost1Active },
          secondaryGoal2: { name: 'Faturamento', percentage: progressData.faturamento, emoji: '📈', isBoostActive: boostStatus.boost2Active }
        };
      case TeamType.CARTEIRA_II:
        return {
          primaryGoal: { name: 'Reais por Ativo', percentage: progressData.reaisPorAtivo, emoji: '💰' },
          secondaryGoal1: { name: 'Atividade', percentage: progressData.atividade, emoji: '🎯', isBoostActive: boostStatus.boost1Active },
          secondaryGoal2: { name: 'Multimarcas por Ativo', percentage: progressData.multimarcasPorAtivo, emoji: '🏪', isBoostActive: boostStatus.boost2Active }
        };
      case TeamType.CARTEIRA_III:
      case TeamType.CARTEIRA_IV:
        return {
          primaryGoal: { name: 'Faturamento', percentage: progressData.faturamento, emoji: '📈' },
          secondaryGoal1: { name: 'Reais por Ativo', percentage: progressData.reaisPorAtivo, emoji: '💰', isBoostActive: boostStatus.boost1Active },
          secondaryGoal2: { name: 'Multimarcas por Ativo', percentage: progressData.multimarcasPorAtivo, emoji: '🏪', isBoostActive: boostStatus.boost2Active }
        };
      case TeamType.ER:
        return {
          primaryGoal: { name: 'Faturamento', percentage: progressData.faturamento, emoji: '📈' },
          secondaryGoal1: { name: 'Reais por Ativo', percentage: progressData.reaisPorAtivo, emoji: '💰', isBoostActive: boostStatus.boost1Active },
          secondaryGoal2: { name: 'UPA', percentage: progressData.upa, emoji: '📊', isBoostActive: boostStatus.boost2Active }
        };
      default:
        return {
          primaryGoal: { name: 'Atividade', percentage: progressData.atividade, emoji: '🎯' },
          secondaryGoal1: { name: 'Reais por Ativo', percentage: progressData.reaisPorAtivo, emoji: '💰', isBoostActive: boostStatus.boost1Active },
          secondaryGoal2: { name: 'Faturamento', percentage: progressData.faturamento, emoji: '📈', isBoostActive: boostStatus.boost2Active }
        };
    }
  }

  // Method to check if points are unlocked based on catalog items
  static isPointsUnlocked(catalogItems: Record<string, number>, teamConfig?: DashboardConfig): boolean {
    const unlockItemId = teamConfig?.unlockConditions.catalogItemId || FUNIFIER_CONFIG.CATALOG_ITEMS.UNLOCK_POINTS;
    const unlockItem = catalogItems[unlockItemId] || 0;
    return unlockItem > 0;
  }

  // Method to check boost status
  static getBoostStatus(catalogItems: Record<string, number>, teamConfig?: DashboardConfig): {
    boost1Active: boolean;
    boost2Active: boolean;
  } {
    const boost1ItemId = teamConfig?.secondaryGoal1.boost.catalogItemId || FUNIFIER_CONFIG.CATALOG_ITEMS.BOOST_SECONDARY_1;
    const boost2ItemId = teamConfig?.secondaryGoal2.boost.catalogItemId || FUNIFIER_CONFIG.CATALOG_ITEMS.BOOST_SECONDARY_2;
    
    const boost1 = catalogItems[boost1ItemId] || 0;
    const boost2 = catalogItems[boost2ItemId] || 0;
    
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
      // Get current configuration
      const configuration = await this.getCurrentConfiguration();
      const teamConfig = configuration.configurations[teamType];
      
      // Get report data from custom collection (optional)
      const reportData = await this.getLatestReportData(playerStatus._id);
      
      // Process data using appropriate team processor
      const processor = this.teamProcessorFactory.getProcessor(teamType);
      const playerMetrics = processor.processPlayerData(playerStatus, reportData, teamConfig);
      
      // Convert to dashboard format with configuration
      const dashboardData = this.convertTodashboardData(playerMetrics, teamType, reportData, undefined, undefined, teamConfig);
      
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
  static extractDirectDashboardData(playerStatus: FunifierPlayerStatus, teamConfig?: DashboardConfig): DashboardData {
    // Extract basic player info
    const playerName = playerStatus.name;
    const totalPoints = playerStatus.total_points;
    
    // Check if points are unlocked using configuration or default
    const pointsLocked = !DashboardService.isPointsUnlocked(playerStatus.catalog_items || {}, teamConfig);
    
    // Check boost status using configuration or default
    const boostStatus = DashboardService.getBoostStatus(playerStatus.catalog_items || {}, teamConfig);
    const boost1Active = boostStatus.boost1Active;
    const boost2Active = boostStatus.boost2Active;

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

    // Get challenge IDs from configuration or use defaults
    const challengeIds = DashboardService.getChallengeIdsFromConfig(teamType, teamConfig);

    // Extract goal progress from challenge_progress using team-specific challenge IDs
    const getGoalProgress = (challengeId: string): number => {
      const challenge = playerStatus.challenge_progress?.find(c => c.challenge === challengeId);
      if (!challenge) return 0;
      
      // Use PrecisionMath to fix floating-point precision issues
      const precisionMetric = PrecisionMath.fixExistingPercentage(challenge.percent_completed);
      return precisionMetric.value;
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

    // Set goals based on team configuration or defaults
    const goalData = DashboardService.getGoalDataFromConfig(
      teamType, 
      teamConfig,
      {
        atividade: atividadeProgress,
        reaisPorAtivo: reaisProgress,
        faturamento: faturamentoProgress,
        multimarcasPorAtivo: multimarcasProgress,
        conversoes: conversoesProgress,
        upa: upaProgress
      },
      { boost1Active, boost2Active }
    );

    const primaryGoal = goalData.primaryGoal;
    const secondaryGoal1 = goalData.secondaryGoal1;
    const secondaryGoal2 = goalData.secondaryGoal2;

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