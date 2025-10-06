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
      const storedConfig = await this.funifierDb.getDashboardConfiguration();
      
      if (storedConfig && storedConfig.configurations) {
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
      }
    } catch (error) {
      console.warn('Failed to load configuration from database, using defaults:', error);
    }

    // Return default configuration if none exists in database
    return this.getDefaultConfiguration();
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

      // Create new configuration record
      const newConfig: DashboardConfigurationRecord = {
        _id: 'dashboard_config_v1',
        version: nextVersion,
        createdAt: new Date().toISOString(),
        createdBy: config.createdBy,
        configurations: config.configurations
      };

      // Save to Funifier database using dashboard__c collection
      await this.funifierDb.saveDashboardConfiguration(newConfig);
      
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

  clearCache(): void {
    this.configCache = null;
    this.cacheTimestamp = 0;
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
            challengeId: 'CONV001',
            actionId: 'action_conversoes',
            calculationType: 'funifier_api'
          },
          secondaryGoal1: { 
            name: 'reaisPorAtivo',
            displayName: 'Reais por Ativo', 
            metric: 'reaisPorAtivo',
            challengeId: 'RPA001',
            actionId: 'action_reais_ativo',
            calculationType: 'funifier_api',
            boost: {
              catalogItemId: 'boost_rpa_0',
              name: 'Boost RPA',
              description: 'Boost para Reais por Ativo'
            }
          },
          secondaryGoal2: { 
            name: 'faturamento',
            displayName: 'Faturamento', 
            metric: 'faturamento',
            challengeId: 'FAT001',
            actionId: 'action_faturamento',
            calculationType: 'funifier_api',
            boost: {
              catalogItemId: 'boost_fat_0',
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
            challengeId: 'ATIV001',
            actionId: 'action_atividade',
            calculationType: 'funifier_api'
          },
          secondaryGoal1: { 
            name: 'reaisPorAtivo',
            displayName: 'Reais por Ativo', 
            metric: 'reaisPorAtivo',
            challengeId: 'RPA002',
            actionId: 'action_reais_ativo',
            calculationType: 'funifier_api',
            boost: {
              catalogItemId: 'boost_rpa_1',
              name: 'Boost RPA',
              description: 'Boost para Reais por Ativo'
            }
          },
          secondaryGoal2: { 
            name: 'faturamento',
            displayName: 'Faturamento', 
            metric: 'faturamento',
            challengeId: 'FAT002',
            actionId: 'action_faturamento',
            calculationType: 'funifier_api',
            boost: {
              catalogItemId: 'boost_fat_1',
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
            challengeId: 'RPA003',
            actionId: 'action_reais_ativo',
            calculationType: 'local_processing'
          },
          secondaryGoal1: { 
            name: 'atividade',
            displayName: 'Atividade', 
            metric: 'atividade',
            challengeId: 'ATIV003',
            actionId: 'action_atividade',
            calculationType: 'local_processing',
            boost: {
              catalogItemId: 'boost_ativ_2',
              name: 'Boost Atividade',
              description: 'Boost para Atividade'
            }
          },
          secondaryGoal2: { 
            name: 'multimarcasPorAtivo',
            displayName: 'Multimarcas por Ativo', 
            metric: 'multimarcasPorAtivo',
            challengeId: 'MPA003',
            actionId: 'action_multimarcas',
            calculationType: 'local_processing',
            boost: {
              catalogItemId: 'boost_multi_2',
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
            challengeId: 'FAT003',
            actionId: 'action_faturamento',
            calculationType: 'funifier_api'
          },
          secondaryGoal1: { 
            name: 'reaisPorAtivo',
            displayName: 'Reais por Ativo', 
            metric: 'reaisPorAtivo',
            challengeId: 'RPA004',
            actionId: 'action_reais_ativo',
            calculationType: 'funifier_api',
            boost: {
              catalogItemId: 'boost_rpa_3',
              name: 'Boost RPA',
              description: 'Boost para Reais por Ativo'
            }
          },
          secondaryGoal2: { 
            name: 'multimarcasPorAtivo',
            displayName: 'Multimarcas por Ativo', 
            metric: 'multimarcasPorAtivo',
            challengeId: 'MPA004',
            actionId: 'action_multimarcas',
            calculationType: 'funifier_api',
            boost: {
              catalogItemId: 'boost_multi_3',
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
            challengeId: 'FAT004',
            actionId: 'action_faturamento',
            calculationType: 'funifier_api'
          },
          secondaryGoal1: { 
            name: 'reaisPorAtivo',
            displayName: 'Reais por Ativo', 
            metric: 'reaisPorAtivo',
            challengeId: 'RPA005',
            actionId: 'action_reais_ativo',
            calculationType: 'funifier_api',
            boost: {
              catalogItemId: 'boost_rpa_4',
              name: 'Boost RPA',
              description: 'Boost para Reais por Ativo'
            }
          },
          secondaryGoal2: { 
            name: 'multimarcasPorAtivo',
            displayName: 'Multimarcas por Ativo', 
            metric: 'multimarcasPorAtivo',
            challengeId: 'MPA005',
            actionId: 'action_multimarcas',
            calculationType: 'funifier_api',
            boost: {
              catalogItemId: 'boost_multi_4',
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
            challengeId: 'FAT005',
            actionId: 'action_faturamento',
            calculationType: 'funifier_api'
          },
          secondaryGoal1: { 
            name: 'reaisPorAtivo',
            displayName: 'Reais por Ativo', 
            metric: 'reaisPorAtivo',
            challengeId: 'RPA006',
            actionId: 'action_reais_ativo',
            calculationType: 'funifier_api',
            boost: {
              catalogItemId: 'boost_rpa_er',
              name: 'Boost RPA',
              description: 'Boost para Reais por Ativo'
            }
          },
          secondaryGoal2: { 
            name: 'upa',
            displayName: 'UPA', 
            metric: 'upa',
            challengeId: 'UPA001',
            actionId: 'action_upa',
            calculationType: 'funifier_api',
            boost: {
              catalogItemId: 'boost_upa_er',
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
}

export const dashboardConfigurationService = DashboardConfigurationService.getInstance();