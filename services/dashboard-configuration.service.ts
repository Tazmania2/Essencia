import { DashboardConfigurationRecord, TeamType, DashboardConfig } from '../types';
import { FunifierDatabaseService } from './funifier-database.service';

export class DashboardConfigurationService {
  private static instance: DashboardConfigurationService;
  private funifierDb: FunifierDatabaseService;
  private configCache: DashboardConfigurationRecord | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  private constructor() {
    this.funifierDb = FunifierDatabaseService.getInstance();
  }

  public static getInstance(): DashboardConfigurationService {
    if (!DashboardConfigurationService.instance) {
      DashboardConfigurationService.instance = new DashboardConfigurationService();
    }
    return DashboardConfigurationService.instance;
  }

  async getCurrentConfiguration(): Promise<DashboardConfigurationRecord> {
    try {
      // Check cache first
      if (this.isCacheValid()) {
        return this.configCache!;
      }

      // Try to get configuration from Funifier database first
      console.log('🔍 Attempting to load dashboard configuration from database...');
      const storedConfig = await this.funifierDb.getDashboardConfiguration();
      console.log('📊 Database configuration result:', storedConfig ? 'Found' : 'Not found', storedConfig);
      
      if (storedConfig && storedConfig.configurations) {
        // Validate that the stored configuration has all required fields
        if (this.isConfigurationComplete(storedConfig.configurations)) {
          const config: DashboardConfigurationRecord = {
            _id: storedConfig._id || 'dashboard_config_v1',
            version: storedConfig.version,
            createdAt: storedConfig.createdAt,
            createdBy: storedConfig.createdBy,
            configurations: storedConfig.configurations
          };
          
          // Update cache
          this.updateCache(config);
          return config;
        } else {
          console.warn('⚠️ Stored configuration is incomplete, falling back to defaults');
        }
      }
    } catch (error) {
      console.warn('Failed to load configuration from database, using defaults:', error);
    }

    // Return default configuration if none exists in database
    console.log('⚠️ No configuration found in database, returning complete default configuration');
    const defaultConfig = this.getDefaultConfiguration();
    console.log('📋 Default configuration loaded with all fields populated');
    return defaultConfig;
  }

  async saveConfiguration(config: Omit<DashboardConfigurationRecord, '_id' | 'version' | 'createdAt'>): Promise<DashboardConfigurationRecord> {
    try {
      // Get current configuration to determine next version
      let nextVersion = '1.0.0';
      try {
        const currentConfig = await this.getCurrentConfiguration();
        if (currentConfig._id && currentConfig._id !== 'default_config') {
          const currentVersionNum = parseFloat(currentConfig.version) || 1.0;
          nextVersion = (currentVersionNum + 0.1).toFixed(1);
        }
      } catch (error) {
        console.warn('Could not determine current version, starting with version 1.0.0');
      }

      // Generate unique ID with timestamp
      const timestamp = Date.now();
      const uniqueId = `dashboard_config_${timestamp}`;

      // Create new configuration record
      const newConfig: DashboardConfigurationRecord = {
        _id: uniqueId,
        version: nextVersion,
        createdAt: new Date().toISOString(),
        createdBy: config.createdBy,
        configurations: config.configurations
      };

      // Save to Funifier database using dashboard__c collection
      const savedConfig = await this.funifierDb.saveDashboardConfiguration(newConfig);
      
      // Update the config with the actual saved ID if different
      if (savedConfig && savedConfig._id) {
        newConfig._id = savedConfig._id;
      }
      
      // Update cache
      this.updateCache(newConfig);
      
      console.log('Dashboard configuration saved successfully:', {
        version: newConfig.version,
        configId: newConfig._id,
        createdBy: newConfig.createdBy 
      });

      return newConfig;

    } catch (error) {
      console.error('Error saving configuration:', error);
      throw error;
    }
  }

  async getTeamConfiguration(teamType: TeamType): Promise<DashboardConfig> {
    const currentConfig = await this.getCurrentConfiguration();
    return currentConfig.configurations[teamType];
  }

  async getAllConfigurations(): Promise<DashboardConfigurationRecord[]> {
    try {
      const configs = await this.funifierDb.getAllDashboardConfigurations();
      return configs.map(config => ({
        _id: config._id,
        version: config.version,
        createdAt: config.createdAt,
        createdBy: config.createdBy,
        configurations: config.configurations
      }));
    } catch (error) {
      console.warn('Failed to load all configurations from database:', error);
      return [];
    }
  }

  clearCache(): void {
    this.configCache = null;
    this.cacheTimestamp = 0;
    console.log('🧹 Configuration cache cleared');
  }

  public getDefaultConfiguration(): DashboardConfigurationRecord {
    return {
      _id: 'default_config',
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      createdBy: 'system',
      configurations: {
        [TeamType.CARTEIRA_0]: {
          teamType: TeamType.CARTEIRA_0,
          displayName: 'Carteira 0',
          primaryGoal: { 
            name: 'conversoes',
            displayName: 'Conversões', 
            metric: 'conversoes',
            challengeId: 'E6GglPq', // Real Funifier Challenge ID for Conversões
            actionId: 'action_conversoes',
            calculationType: 'funifier_api',
            emoji: '🎯',
            unit: 'conversões',
            csvField: 'conversoes',
            description: 'Número de conversões realizadas'
          },
          secondaryGoal1: { 
            name: 'reaisPorAtivo',
            displayName: 'Reais por Ativo', 
            metric: 'reaisPorAtivo',
            challengeId: 'E6Gm8RI', // Real Funifier Challenge ID for Reais por Ativo
            actionId: 'action_reais_ativo',
            calculationType: 'funifier_api',
            emoji: '💰',
            unit: 'R$',
            csvField: 'reais_por_ativo',
            description: 'Valor em reais por ativo',
            boost: {
              catalogItemId: 'E6F0WGc',
              name: 'Boost RPA',
              description: 'Boost para Reais por Ativo'
            }
          },
          secondaryGoal2: { 
            name: 'faturamento',
            displayName: 'Faturamento', 
            metric: 'faturamento',
            challengeId: 'E6GglPq', // Real Funifier Challenge ID for Faturamento
            actionId: 'action_faturamento',
            calculationType: 'funifier_api',
            emoji: '📈',
            unit: 'R$',
            csvField: 'faturamento',
            description: 'Faturamento total',
            boost: {
              catalogItemId: 'E6K79Mt',
              name: 'Boost Faturamento',
              description: 'Boost para Faturamento'
            }
          },
          unlockConditions: {
            catalogItemId: 'unlock_points',
            description: 'Unlock conditions'
          }
        },
        [TeamType.CARTEIRA_I]: {
          teamType: TeamType.CARTEIRA_I,
          displayName: 'Carteira I',
          primaryGoal: { 
            name: 'atividade',
            displayName: 'Atividade', 
            metric: 'atividade',
            challengeId: 'E6FQIjs', // Real Funifier Challenge ID for Atividade
            actionId: 'action_atividade',
            calculationType: 'funifier_api',
            emoji: '🎯',
            unit: 'pontos',
            csvField: 'atividade',
            description: 'Pontuação de atividade'
          },
          secondaryGoal1: { 
            name: 'reaisPorAtivo',
            displayName: 'Reais por Ativo', 
            metric: 'reaisPorAtivo',
            challengeId: 'E6Gm8RI', // Real Funifier Challenge ID for Reais por Ativo
            actionId: 'action_reais_ativo',
            calculationType: 'funifier_api',
            emoji: '💰',
            unit: 'R$',
            csvField: 'reais_por_ativo',
            description: 'Valor em reais por ativo',
            boost: {
              catalogItemId: 'E6F0WGc',
              name: 'Boost RPA',
              description: 'Boost para Reais por Ativo'
            }
          },
          secondaryGoal2: { 
            name: 'faturamento',
            displayName: 'Faturamento', 
            metric: 'faturamento',
            challengeId: 'E6GglPq', // Real Funifier Challenge ID for Faturamento
            actionId: 'action_faturamento',
            calculationType: 'funifier_api',
            emoji: '📈',
            unit: 'R$',
            csvField: 'faturamento',
            description: 'Faturamento total',
            boost: {
              catalogItemId: 'E6K79Mt',
              name: 'Boost Faturamento',
              description: 'Boost para Faturamento'
            }
          },
          unlockConditions: {
            catalogItemId: 'unlock_points',
            description: 'Unlock conditions'
          }
        },
        [TeamType.CARTEIRA_II]: {
          teamType: TeamType.CARTEIRA_II,
          displayName: 'Carteira II',
          primaryGoal: { 
            name: 'reaisPorAtivo',
            displayName: 'Reais por Ativo', 
            metric: 'reaisPorAtivo',
            challengeId: 'E6MTIIK', // Real Funifier Challenge ID for Carteira II Reais por Ativo
            actionId: 'action_reais_ativo',
            calculationType: 'local_processing',
            emoji: '💰',
            unit: 'R$',
            csvField: 'reaisPorAtivo',
            description: 'Valor em reais por ativo'
          },
          secondaryGoal1: { 
            name: 'atividade',
            displayName: 'Atividade', 
            metric: 'atividade',
            challengeId: 'E6Gv58l', // Real Funifier Challenge ID for Carteira II Atividade
            actionId: 'action_atividade',
            calculationType: 'local_processing',
            emoji: '🎯',
            unit: 'pontos',
            csvField: 'atividade',
            description: 'Pontuação de atividade',
            boost: {
              catalogItemId: 'E6F0WGc',
              name: 'Boost Atividade',
              description: 'Boost para Atividade'
            }
          },
          secondaryGoal2: { 
            name: 'multimarcasPorAtivo',
            displayName: 'Multimarcas por Ativo', 
            metric: 'multimarcasPorAtivo',
            challengeId: 'E6MWJKs', // Real Funifier Challenge ID for Carteira II Multimarcas
            actionId: 'action_multimarcas',
            calculationType: 'local_processing',
            emoji: '🏪',
            unit: 'marcas',
            csvField: 'multimarcasPorAtivo',
            description: 'Número de multimarcas por ativo',
            boost: {
              catalogItemId: 'E6K79Mt',
              name: 'Boost Multimarcas',
              description: 'Boost para Multimarcas'
            }
          },
          unlockConditions: {
            catalogItemId: 'unlock_points',
            description: 'Unlock conditions'
          },
          specialProcessing: {
            type: 'carteira_ii_local',
            warnings: ['Local processing warning']
          }
        },
        [TeamType.CARTEIRA_III]: {
          teamType: TeamType.CARTEIRA_III,
          displayName: 'Carteira III',
          primaryGoal: { 
            name: 'faturamento',
            displayName: 'Faturamento', 
            metric: 'faturamento',
            challengeId: 'E6Gahd4', // Real Funifier Challenge ID for Carteira III/IV Faturamento
            actionId: 'action_faturamento',
            calculationType: 'funifier_api',
            emoji: '📈',
            unit: 'R$',
            csvField: 'faturamento',
            description: 'Faturamento total'
          },
          secondaryGoal1: { 
            name: 'reaisPorAtivo',
            displayName: 'Reais por Ativo', 
            metric: 'reaisPorAtivo',
            challengeId: 'E6Gm8RI', // Real Funifier Challenge ID for Reais por Ativo
            actionId: 'action_reais_ativo',
            calculationType: 'funifier_api',
            boost: {
              catalogItemId: 'E6F0WGc',
              name: 'Boost RPA',
              description: 'Boost para Reais por Ativo'
            }
          },
          secondaryGoal2: { 
            name: 'multimarcasPorAtivo',
            displayName: 'Multimarcas por Ativo', 
            metric: 'multimarcasPorAtivo',
            challengeId: 'E6MMH5v', // Real Funifier Challenge ID for Carteira III/IV Multimarcas
            actionId: 'action_multimarcas',
            calculationType: 'funifier_api',
            boost: {
              catalogItemId: 'E6K79Mt',
              name: 'Boost Multimarcas',
              description: 'Boost para Multimarcas'
            }
          },
          unlockConditions: {
            catalogItemId: 'unlock_points',
            description: 'Unlock conditions'
          }
        },
        [TeamType.CARTEIRA_IV]: {
          teamType: TeamType.CARTEIRA_IV,
          displayName: 'Carteira IV',
          primaryGoal: { 
            name: 'faturamento',
            displayName: 'Faturamento', 
            metric: 'faturamento',
            challengeId: 'E6Gahd4', // Real Funifier Challenge ID for Carteira III/IV Faturamento
            actionId: 'action_faturamento',
            calculationType: 'funifier_api',
            emoji: '📈',
            unit: 'R$',
            csvField: 'faturamento',
            description: 'Faturamento total'
          },
          secondaryGoal1: { 
            name: 'reaisPorAtivo',
            displayName: 'Reais por Ativo', 
            metric: 'reaisPorAtivo',
            challengeId: 'E6Gm8RI', // Real Funifier Challenge ID for Reais por Ativo
            actionId: 'action_reais_ativo',
            calculationType: 'funifier_api',
            emoji: '💰',
            unit: 'R$',
            csvField: 'reaisPorAtivo',
            description: 'Valor em reais por ativo',
            boost: {
              catalogItemId: 'E6F0WGc',
              name: 'Boost RPA',
              description: 'Boost para Reais por Ativo'
            }
          },
          secondaryGoal2: { 
            name: 'multimarcasPorAtivo',
            displayName: 'Multimarcas por Ativo', 
            metric: 'multimarcasPorAtivo',
            challengeId: 'E6MMH5v', // Real Funifier Challenge ID for Carteira III/IV Multimarcas
            actionId: 'action_multimarcas',
            calculationType: 'funifier_api',
            boost: {
              catalogItemId: 'E6K79Mt',
              name: 'Boost Multimarcas',
              description: 'Boost para Multimarcas'
            }
          },
          unlockConditions: {
            catalogItemId: 'unlock_points',
            description: 'Unlock conditions'
          }
        },
        [TeamType.ER]: {
          teamType: TeamType.ER,
          displayName: 'ER',
          primaryGoal: { 
            name: 'faturamento',
            displayName: 'Faturamento', 
            metric: 'faturamento',
            challengeId: 'E6Gahd4', // Real Funifier Challenge ID for Faturamento (reused)
            actionId: 'action_faturamento',
            calculationType: 'funifier_api',
            emoji: '📈',
            unit: 'R$',
            csvField: 'faturamento',
            description: 'Faturamento total'
          },
          secondaryGoal1: { 
            name: 'reaisPorAtivo',
            displayName: 'Reais por Ativo', 
            metric: 'reaisPorAtivo',
            challengeId: 'E6Gm8RI', // Real Funifier Challenge ID for Reais por Ativo (reused)
            actionId: 'action_reais_ativo',
            calculationType: 'funifier_api',
            boost: {
              catalogItemId: 'E6F0WGc',
              name: 'Boost RPA',
              description: 'Boost para Reais por Ativo'
            }
          },
          secondaryGoal2: { 
            name: 'upa',
            displayName: 'UPA', 
            metric: 'upa',
            challengeId: 'E62x2PW', // Real Funifier Challenge ID for UPA
            actionId: 'action_upa',
            calculationType: 'funifier_api',
            boost: {
              catalogItemId: 'E6K79Mt',
              name: 'Boost UPA',
              description: 'Boost para UPA'
            }
          },
          unlockConditions: {
            catalogItemId: 'unlock_points',
            description: 'Unlock conditions'
          }
        }
      }
    };
  }

  private isCacheValid(): boolean {
    return this.configCache !== null && 
           (Date.now() - this.cacheTimestamp) < this.CACHE_TTL;
  }

  private updateCache(config: DashboardConfigurationRecord): void {
    this.configCache = config;
    this.cacheTimestamp = Date.now();
  }

  /**
   * Validate that a configuration has all required fields
   */
  private isConfigurationComplete(configurations: any): boolean {
    try {
      // Check if configurations object exists
      if (!configurations || typeof configurations !== 'object') {
        return false;
      }

      // Required fields for each goal
      const requiredGoalFields = ['name', 'displayName', 'metric', 'challengeId', 'actionId', 'calculationType', 'emoji', 'unit', 'csvField', 'description'];

      // Check each team configuration
      for (const teamType of Object.keys(configurations)) {
        const teamConfig = configurations[teamType];
        
        if (!teamConfig || typeof teamConfig !== 'object') {
          console.warn(`Invalid team configuration for ${teamType}`);
          return false;
        }

        // Check required team fields
        if (!teamConfig.teamType || !teamConfig.displayName || !teamConfig.primaryGoal || !teamConfig.secondaryGoal1 || !teamConfig.secondaryGoal2) {
          console.warn(`Missing required team fields for ${teamType}`);
          return false;
        }

        // Check only critical fields (more lenient validation)
        const criticalFields = ['name', 'displayName', 'challengeId'];
        
        // Check primary goal critical fields
        for (const field of criticalFields) {
          if (!teamConfig.primaryGoal[field]) {
            console.warn(`Missing critical field ${field} in primaryGoal for ${teamType}`);
            return false;
          }
        }

        // Check secondary goal 1 critical fields
        for (const field of criticalFields) {
          if (!teamConfig.secondaryGoal1[field]) {
            console.warn(`Missing critical field ${field} in secondaryGoal1 for ${teamType}`);
            return false;
          }
        }

        // Check secondary goal 2 critical fields
        for (const field of criticalFields) {
          if (!teamConfig.secondaryGoal2[field]) {
            console.warn(`Missing critical field ${field} in secondaryGoal2 for ${teamType}`);
            return false;
          }
        }
      }

      console.log('✅ Configuration validation passed - using stored configuration');
      return true;
    } catch (error) {
      console.error('Error validating configuration:', error);
      return false;
    }
  }
}

export const dashboardConfigurationService = DashboardConfigurationService.getInstance();