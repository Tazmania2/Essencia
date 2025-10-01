import { DashboardConfigurationRecord, TeamType } from '../types';

export class DashboardConfigurationService {
  private static instance: DashboardConfigurationService;

  public static getInstance(): DashboardConfigurationService {
    if (!DashboardConfigurationService.instance) {
      DashboardConfigurationService.instance = new DashboardConfigurationService();
    }
    return DashboardConfigurationService.instance;
  }

  async getCurrentConfiguration(): Promise<DashboardConfigurationRecord> {
    throw new Error('Dashboard configuration service not implemented. Please configure Funifier API integration.');
    return {
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

  async saveConfiguration(config: Partial<DashboardConfigurationRecord>): Promise<DashboardConfigurationRecord> {
    throw new Error('Dashboard configuration save service not implemented. Please configure Funifier API integration.');
  }
}

export const dashboardConfigurationService = DashboardConfigurationService.getInstance();