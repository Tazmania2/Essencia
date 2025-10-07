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
  TeamType, 
  DashboardData,
  PlayerMetrics,
  DashboardConfigurationRecord,
  FUNIFIER_CONFIG 
} from '../types';

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

  async getDashboardData(playerId: string, _token: string, selectedTeamType?: TeamType): Promise<DashboardData> {
    try {
      secureLogger.log('🚀 Dashboard service called for player:', playerId);
      
      // Get current configuration first
      const configuration = await this.getCurrentConfiguration();
      secureLogger.log('🔧 Dashboard using configuration:', {
        id: configuration._id,
        version: configuration.version,
        isDefault: configuration._id === 'default_config'
      });
      
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
        const hasAccess = teamInfo.allTeamTypes.indexOf(selectedTeamType) !== -1;
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
      
      const processor = this.teamProcessorFactory.getProcessor(teamType);
      const playerMetrics = processor.processPlayerData(playerStatus, enhancedReportData);
      
      // Convert to dashboard format with enhanced data
      const dashboardData = this.convertTodashboardData(playerId, playerMetrics, teamType, configuration, reportData, reportRecord, csvData);
      
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
    playerId: string,
    metrics: PlayerMetrics, 
    teamType: TeamType,
    configuration: any,
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
          unit: this.getConfiguredGoalUnit(configuration, teamType, goalName),
          daysRemaining: daysRemaining
        };
      } catch (error) {
        secureLogger.warn(`Error processing enhanced goal data for ${goalName}:`, error);
        return {};
      }
    };

    return {
      playerId: playerId,
      playerName: metrics.playerName,
      totalPoints: metrics.totalPoints,
      pointsLocked: metrics.pointsLocked,
      currentCycleDay: currentCycleDay,
      totalCycleDays: totalCycleDays,
      isDataFromCollection: !!reportData || !!enhancedRecord, // True if we have any database data
      primaryGoal: {
        name: this.getConfiguredDisplayName(configuration, teamType, 'primaryGoal') || metrics.primaryGoal.name,
        percentage: metrics.primaryGoal.percentage,
        description: this.generateGoalDescription(metrics.primaryGoal),
        emoji: goalEmojis.primary,
        ...getEnhancedGoalData(metrics.primaryGoal.name)
      },
      secondaryGoal1: {
        name: this.getConfiguredDisplayName(configuration, teamType, 'secondaryGoal1') || metrics.secondaryGoal1.name,
        percentage: metrics.secondaryGoal1.percentage,
        description: this.generateGoalDescription(metrics.secondaryGoal1),
        emoji: goalEmojis.secondary1,
        hasBoost: true,
        isBoostActive: metrics.secondaryGoal1.boostActive || false,
        ...getEnhancedGoalData(metrics.secondaryGoal1.name)
      },
      secondaryGoal2: {
        name: this.getConfiguredDisplayName(configuration, teamType, 'secondaryGoal2') || metrics.secondaryGoal2.name,
        percentage: metrics.secondaryGoal2.percentage,
        description: this.generateGoalDescription(metrics.secondaryGoal2),
        emoji: goalEmojis.secondary2,
        hasBoost: true,
        isBoostActive: metrics.secondaryGoal2.boostActive || false,
        ...getEnhancedGoalData(metrics.secondaryGoal2.name)
      },
      goalDetails: this.generateGoalDetails(metrics, configuration, teamType, enhancedRecord, csvData)
    };
  }

  private generateGoalDetails(
    metrics: PlayerMetrics,
    configuration: any,
    teamType: TeamType,
    enhancedRecord?: any, 
    csvData?: any
  ): Array<{
    title: string;
    items: string[];
    bgColor: string;
    textColor: string;
  }> {
    const details = [];

    // Primary Goal Details
    const primaryGoalData = this.getGoalDataFromSources(metrics.primaryGoal.name, enhancedRecord, csvData);
    details.push({
      title: this.getConfiguredDisplayName(configuration, teamType, 'primaryGoal') || metrics.primaryGoal.name,
      items: this.formatGoalItems(metrics.primaryGoal.name, primaryGoalData, metrics.primaryGoal.percentage, configuration, teamType),
      bgColor: 'bg-boticario-light',
      textColor: 'text-boticario-dark'
    });

    // Secondary Goal 1 Details
    const secondary1Data = this.getGoalDataFromSources(metrics.secondaryGoal1.name, enhancedRecord, csvData);
    details.push({
      title: this.getConfiguredDisplayName(configuration, teamType, 'secondaryGoal1') || metrics.secondaryGoal1.name,
      items: this.formatGoalItems(metrics.secondaryGoal1.name, secondary1Data, metrics.secondaryGoal1.percentage, configuration, teamType),
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-800'
    });

    // Secondary Goal 2 Details
    const secondary2Data = this.getGoalDataFromSources(metrics.secondaryGoal2.name, enhancedRecord, csvData);
    details.push({
      title: this.getConfiguredDisplayName(configuration, teamType, 'secondaryGoal2') || metrics.secondaryGoal2.name,
      items: this.formatGoalItems(metrics.secondaryGoal2.name, secondary2Data, metrics.secondaryGoal2.percentage, configuration, teamType),
      bgColor: 'bg-pink-50',
      textColor: 'text-pink-800'
    });

    return details;
  }

  private getGoalDataFromSources(goalName: string, enhancedRecord?: any, csvData?: any): any {
    // Try to get data from CSV first (most detailed)
    if (csvData) {
      const goalKey = this.getGoalKeyFromName(goalName);
      if (csvData[goalKey]) {
        return csvData[goalKey];
      }
    }

    // Fallback to enhanced record
    if (enhancedRecord) {
      const goalKey = this.getGoalKeyFromName(goalName);
      return {
        target: enhancedRecord[`${goalKey}Meta`],
        current: enhancedRecord[`${goalKey}Atual`],
        percentage: enhancedRecord[`${goalKey}Percentual`]
      };
    }

    return null;
  }

  private formatGoalItems(goalName: string, goalData: any, percentage: number, configuration?: any, teamType?: TeamType): string[] {
    const items = [];

    if (goalData?.target !== undefined) {
      const unit = configuration && teamType ? 
        this.getConfiguredGoalUnit(configuration, teamType, goalName) : 
        this.getGoalUnit(this.getGoalKeyFromName(goalName));
      items.push(`META: ${this.formatValue(goalData.target, unit)}`);
    } else {
      items.push(`META: Não disponível`);
    }

    if (goalData?.current !== undefined) {
      const unit = configuration && teamType ? 
        this.getConfiguredGoalUnit(configuration, teamType, goalName) : 
        this.getGoalUnit(this.getGoalKeyFromName(goalName));
      items.push(`ATUAL: ${this.formatValue(goalData.current, unit)}`);
    } else {
      items.push(`ATUAL: Não disponível`);
    }

    items.push(`PROGRESSO: ${percentage.toFixed(1)}%`);

    if (goalData?.target && goalData?.current) {
      const remaining = Math.max(0, goalData.target - goalData.current);
      const unit = configuration && teamType ? 
        this.getConfiguredGoalUnit(configuration, teamType, goalName) : 
        this.getGoalUnit(this.getGoalKeyFromName(goalName));
      items.push(`FALTAM: ${this.formatValue(remaining, unit)}`);
    }

    return items;
  }

  private formatValue(value: number, unit: string): string {
    if (unit === 'R$') {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value);
    } else if (unit === '%') {
      return `${value.toFixed(1)}%`;
    } else {
      return value.toLocaleString('pt-BR');
    }
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
   * Get configured unit for a goal from configuration
   */
  private getConfiguredGoalUnit(configuration: any, teamType: TeamType, goalName: string): string {
    try {
      const teamConfig = configuration.configurations[teamType];
      
      // Check primary goal
      if (teamConfig?.primaryGoal?.name === goalName) {
        return teamConfig.primaryGoal.unit || this.getGoalUnit(goalName as any);
      }
      
      // Check secondary goal 1
      if (teamConfig?.secondaryGoal1?.name === goalName) {
        return teamConfig.secondaryGoal1.unit || this.getGoalUnit(goalName as any);
      }
      
      // Check secondary goal 2
      if (teamConfig?.secondaryGoal2?.name === goalName) {
        return teamConfig.secondaryGoal2.unit || this.getGoalUnit(goalName as any);
      }
      
      // Fallback to hardcoded units
      return this.getGoalUnit(goalName as any);
    } catch (error) {
      secureLogger.warn('Failed to get configured goal unit:', error);
      return this.getGoalUnit(goalName as any);
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
  async processPlayerDataToDashboard(playerId: string, playerStatus: FunifierPlayerStatus, teamType: TeamType): Promise<DashboardData> {
    try {
      // Get current configuration
      const configuration = await this.getCurrentConfiguration();
      
      // Get report data from custom collection (optional)
      const reportData = await this.getLatestReportData(playerStatus._id);
      
      // Process data using appropriate team processor
      const processor = this.teamProcessorFactory.getProcessor(teamType);
      const playerMetrics = processor.processPlayerData(playerStatus, reportData);
      
      // Convert to dashboard format
      const dashboardData = this.convertTodashboardData(playerId, playerMetrics, teamType, configuration, reportData);
      
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
  static async extractDirectDashboardData(playerId: string, playerStatus: FunifierPlayerStatus): Promise<DashboardData> {
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

    // Get challenge IDs from configuration (with fallback to hardcoded values)
    const configuration = await dashboardConfigurationService.getCurrentConfiguration();
    const teamConfig = configuration.configurations[teamType];
    
    const challengeIds = {
      atividade: teamConfig.primaryGoal.name === 'atividade' ? teamConfig.primaryGoal.challengeId :
                teamConfig.secondaryGoal1.name === 'atividade' ? teamConfig.secondaryGoal1.challengeId :
                teamConfig.secondaryGoal2.name === 'atividade' ? teamConfig.secondaryGoal2.challengeId : undefined,
      reaisPorAtivo: teamConfig.primaryGoal.name === 'reaisPorAtivo' ? teamConfig.primaryGoal.challengeId :
                    teamConfig.secondaryGoal1.name === 'reaisPorAtivo' ? teamConfig.secondaryGoal1.challengeId :
                    teamConfig.secondaryGoal2.name === 'reaisPorAtivo' ? teamConfig.secondaryGoal2.challengeId : 'E6Gm8RI',
      faturamento: teamConfig.primaryGoal.name === 'faturamento' ? teamConfig.primaryGoal.challengeId :
                  teamConfig.secondaryGoal1.name === 'faturamento' ? teamConfig.secondaryGoal1.challengeId :
                  teamConfig.secondaryGoal2.name === 'faturamento' ? teamConfig.secondaryGoal2.challengeId : undefined,
      multimarcas: teamConfig.primaryGoal.name === 'multimarcasPorAtivo' ? teamConfig.primaryGoal.challengeId :
                  teamConfig.secondaryGoal1.name === 'multimarcasPorAtivo' ? teamConfig.secondaryGoal1.challengeId :
                  teamConfig.secondaryGoal2.name === 'multimarcasPorAtivo' ? teamConfig.secondaryGoal2.challengeId : undefined,
      conversoes: teamConfig.primaryGoal.name === 'conversoes' ? teamConfig.primaryGoal.challengeId :
                 teamConfig.secondaryGoal1.name === 'conversoes' ? teamConfig.secondaryGoal1.challengeId :
                 teamConfig.secondaryGoal2.name === 'conversoes' ? teamConfig.secondaryGoal2.challengeId : undefined,
      upa: teamConfig.primaryGoal.name === 'upa' ? teamConfig.primaryGoal.challengeId :
          teamConfig.secondaryGoal1.name === 'upa' ? teamConfig.secondaryGoal1.challengeId :
          teamConfig.secondaryGoal2.name === 'upa' ? teamConfig.secondaryGoal2.challengeId : undefined
    };

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
    // Get team configuration from dashboard configuration service
    const goalConfig = configuration.configurations[teamType];
    
    // Map progress values to goal names
    const progressMap = {
      'atividade': atividadeProgress,
      'reaisPorAtivo': reaisProgress,
      'faturamento': faturamentoProgress,
      'multimarcasPorAtivo': multimarcasProgress,
      'conversoes': conversoesProgress,
      'upa': upaProgress
    };

    // Create goals using configuration data
    const createGoalFromConfig = (goalConfig: any, hasBoost: boolean = false) => ({
      name: goalConfig.displayName || goalConfig.name,
      percentage: progressMap[goalConfig.name as keyof typeof progressMap] || 0,
      emoji: goalConfig.emoji || '📊',
      isBoostActive: hasBoost && (goalConfig.boost ? true : false),
      unit: goalConfig.unit || '',
      target: goalConfig.targetValue,
      description: goalConfig.description || ''
    });

    const primaryGoal = createGoalFromConfig(goalConfig.primaryGoal);
    const secondaryGoal1 = createGoalFromConfig(goalConfig.secondaryGoal1, boost1Active);
    const secondaryGoal2 = createGoalFromConfig(goalConfig.secondaryGoal2, boost2Active);

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
      playerId,
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
   * Get configured display name for a goal
   */
  private getConfiguredDisplayName(configuration: any, teamType: TeamType, goalType: 'primaryGoal' | 'secondaryGoal1' | 'secondaryGoal2'): string | null {
    try {
      const teamConfig = configuration.configurations[teamType];
      return teamConfig?.[goalType]?.displayName || null;
    } catch (error) {
      secureLogger.warn('Failed to get configured display name:', error);
      return null;
    }
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
}