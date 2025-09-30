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
    // Mock implementation - replace with actual API call
    return {
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      createdBy: 'system',
      configurations: {
        [TeamType.CARTEIRA_0]: {
          primaryGoal: { displayName: 'Conversões', metric: 'conversoes' },
          secondaryGoal1: { displayName: 'Reais por Ativo', metric: 'reaisPorAtivo' },
          secondaryGoal2: { displayName: 'Faturamento', metric: 'faturamento' }
        },
        [TeamType.CARTEIRA_I]: {
          primaryGoal: { displayName: 'Atividade', metric: 'atividade' },
          secondaryGoal1: { displayName: 'Reais por Ativo', metric: 'reaisPorAtivo' },
          secondaryGoal2: { displayName: 'Faturamento', metric: 'faturamento' }
        },
        [TeamType.CARTEIRA_II]: {
          primaryGoal: { displayName: 'Reais por Ativo', metric: 'reaisPorAtivo' },
          secondaryGoal1: { displayName: 'Atividade', metric: 'atividade' },
          secondaryGoal2: { displayName: 'Multimarcas por Ativo', metric: 'multimarcasPorAtivo' }
        },
        [TeamType.CARTEIRA_III]: {
          primaryGoal: { displayName: 'Faturamento', metric: 'faturamento' },
          secondaryGoal1: { displayName: 'Reais por Ativo', metric: 'reaisPorAtivo' },
          secondaryGoal2: { displayName: 'Multimarcas por Ativo', metric: 'multimarcasPorAtivo' }
        },
        [TeamType.CARTEIRA_IV]: {
          primaryGoal: { displayName: 'Faturamento', metric: 'faturamento' },
          secondaryGoal1: { displayName: 'Reais por Ativo', metric: 'reaisPorAtivo' },
          secondaryGoal2: { displayName: 'Multimarcas por Ativo', metric: 'multimarcasPorAtivo' }
        },
        [TeamType.ER]: {
          primaryGoal: { displayName: 'Faturamento', metric: 'faturamento' },
          secondaryGoal1: { displayName: 'Reais por Ativo', metric: 'reaisPorAtivo' },
          secondaryGoal2: { displayName: 'UPA', metric: 'upa' }
        }
      }
    };
  }

  async saveConfiguration(config: Partial<DashboardConfigurationRecord>): Promise<DashboardConfigurationRecord> {
    // Mock implementation - replace with actual API call
    const savedConfig: DashboardConfigurationRecord = {
      _id: 'config_' + Date.now(),
      version: config.version || '1.0.0',
      createdAt: config.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: config.createdBy || 'admin',
      configurations: config.configurations || {} as any
    };

    return savedConfig;
  }
}

export const dashboardConfigurationService = DashboardConfigurationService.getInstance();