import { DashboardConfig, TeamType } from '../types';

/**
 * Default dashboard configurations matching current system behavior
 * These serve as fallback when database configuration is unavailable
 */
export const DEFAULT_DASHBOARD_CONFIGURATIONS: Record<TeamType, DashboardConfig> = {
  [TeamType.CARTEIRA_0]: {
    teamType: TeamType.CARTEIRA_0,
    displayName: 'Carteira 0',
    primaryGoal: {
      name: 'conversoes',
      displayName: 'Conversões',
      challengeId: 'E6FQIjs',
      actionId: 'conversoes',
      emoji: '🎯',
      unit: 'conversões',
      calculationType: 'funifier_direct'
    },
    secondaryGoal1: {
      name: 'reaisPorAtivo',
      displayName: 'Reais por Ativo',
      challengeId: 'E6Gm8RI',
      actionId: 'reais_por_ativo',
      emoji: '💰',
      unit: 'R$',
      calculationType: 'funifier_direct',
      boost: {
        catalogItemId: 'E6F0WGc',
        name: 'Boost Reais por Ativo',
        description: 'Multiplicador ativo quando meta é atingida'
      }
    },
    secondaryGoal2: {
      name: 'faturamento',
      displayName: 'Faturamento',
      challengeId: 'E6GglPq',
      actionId: 'faturamento',
      emoji: '📈',
      unit: 'R$',
      calculationType: 'funifier_direct',
      boost: {
        catalogItemId: 'E6K79Mt',
        name: 'Boost Faturamento',
        description: 'Multiplicador ativo quando meta é atingida'
      }
    },
    unlockConditions: {
      catalogItemId: 'E6F0O5f',
      description: 'Pontos desbloqueados quando condições são atendidas'
    }
  },

  [TeamType.CARTEIRA_I]: {
    teamType: TeamType.CARTEIRA_I,
    displayName: 'Carteira I',
    primaryGoal: {
      name: 'atividade',
      displayName: 'Atividade',
      challengeId: 'E6FQIjs',
      actionId: 'atividade',
      emoji: '🎯',
      unit: 'pontos',
      calculationType: 'funifier_direct'
    },
    secondaryGoal1: {
      name: 'reaisPorAtivo',
      displayName: 'Reais por Ativo',
      challengeId: 'E6Gm8RI',
      actionId: 'reais_por_ativo',
      emoji: '💰',
      unit: 'R$',
      calculationType: 'funifier_direct',
      boost: {
        catalogItemId: 'E6F0WGc',
        name: 'Boost Reais por Ativo',
        description: 'Multiplicador ativo quando meta é atingida'
      }
    },
    secondaryGoal2: {
      name: 'faturamento',
      displayName: 'Faturamento',
      challengeId: 'E6GglPq',
      actionId: 'faturamento',
      emoji: '📈',
      unit: 'R$',
      calculationType: 'funifier_direct',
      boost: {
        catalogItemId: 'E6K79Mt',
        name: 'Boost Faturamento',
        description: 'Multiplicador ativo quando meta é atingida'
      }
    },
    unlockConditions: {
      catalogItemId: 'E6F0O5f',
      description: 'Pontos desbloqueados quando condições são atendidas'
    }
  },

  [TeamType.CARTEIRA_II]: {
    teamType: TeamType.CARTEIRA_II,
    displayName: 'Carteira II',
    specialProcessing: {
      type: 'carteira_ii_local',
      description: 'Processamento local devido à volatilidade da meta principal',
      warnings: [
        'Esta carteira usa cálculos locais em vez de dados diretos da Funifier',
        'Mudanças nas métricas podem afetar a lógica de processamento local',
        'Boosts são calculados localmente e não sincronizados com a Funifier'
      ]
    },
    primaryGoal: {
      name: 'reaisPorAtivo',
      displayName: 'Reais por Ativo',
      challengeId: 'E6MTIIK',
      actionId: 'reais_por_ativo',
      emoji: '💰',
      unit: 'R$',
      calculationType: 'local_processing'
    },
    secondaryGoal1: {
      name: 'atividade',
      displayName: 'Atividade',
      challengeId: 'E6MTIIl',
      actionId: 'atividade',
      emoji: '🎯',
      unit: 'pontos',
      calculationType: 'local_processing',
      boost: {
        catalogItemId: 'E6F0WGc',
        name: 'Boost Atividade',
        description: 'Multiplicador ativo quando meta é atingida (processamento local)'
      }
    },
    secondaryGoal2: {
      name: 'multimarcasPorAtivo',
      displayName: 'Multimarcas por Ativo',
      challengeId: 'E6MTIIm',
      actionId: 'multimarcas_por_ativo',
      emoji: '🏷️',
      unit: 'marcas',
      calculationType: 'local_processing',
      boost: {
        catalogItemId: 'E6K79Mt',
        name: 'Boost Multimarcas',
        description: 'Multiplicador ativo quando meta é atingida (processamento local)'
      }
    },
    unlockConditions: {
      catalogItemId: 'E6F0O5f',
      description: 'Pontos desbloqueados quando condições são atendidas (processamento local)'
    }
  },

  [TeamType.CARTEIRA_III]: {
    teamType: TeamType.CARTEIRA_III,
    displayName: 'Carteira III',
    primaryGoal: {
      name: 'faturamento',
      displayName: 'Faturamento',
      challengeId: 'E6GglPq',
      actionId: 'faturamento',
      emoji: '📈',
      unit: 'R$',
      calculationType: 'funifier_direct'
    },
    secondaryGoal1: {
      name: 'reaisPorAtivo',
      displayName: 'Reais por Ativo',
      challengeId: 'E6Gm8RI',
      actionId: 'reais_por_ativo',
      emoji: '💰',
      unit: 'R$',
      calculationType: 'funifier_direct',
      boost: {
        catalogItemId: 'E6F0WGc',
        name: 'Boost Reais por Ativo',
        description: 'Multiplicador ativo quando meta é atingida'
      }
    },
    secondaryGoal2: {
      name: 'multimarcasPorAtivo',
      displayName: 'Multimarcas por Ativo',
      challengeId: 'E6MTIIm',
      actionId: 'multimarcas_por_ativo',
      emoji: '🏷️',
      unit: 'marcas',
      calculationType: 'funifier_direct',
      boost: {
        catalogItemId: 'E6K79Mt',
        name: 'Boost Multimarcas',
        description: 'Multiplicador ativo quando meta é atingida'
      }
    },
    unlockConditions: {
      catalogItemId: 'E6F0O5f',
      description: 'Pontos desbloqueados quando condições são atendidas'
    }
  },

  [TeamType.CARTEIRA_IV]: {
    teamType: TeamType.CARTEIRA_IV,
    displayName: 'Carteira IV',
    primaryGoal: {
      name: 'faturamento',
      displayName: 'Faturamento',
      challengeId: 'E6GglPq',
      actionId: 'faturamento',
      emoji: '📈',
      unit: 'R$',
      calculationType: 'funifier_direct'
    },
    secondaryGoal1: {
      name: 'reaisPorAtivo',
      displayName: 'Reais por Ativo',
      challengeId: 'E6Gm8RI',
      actionId: 'reais_por_ativo',
      emoji: '💰',
      unit: 'R$',
      calculationType: 'funifier_direct',
      boost: {
        catalogItemId: 'E6F0WGc',
        name: 'Boost Reais por Ativo',
        description: 'Multiplicador ativo quando meta é atingida'
      }
    },
    secondaryGoal2: {
      name: 'multimarcasPorAtivo',
      displayName: 'Multimarcas por Ativo',
      challengeId: 'E6MTIIm',
      actionId: 'multimarcas_por_ativo',
      emoji: '🏷️',
      unit: 'marcas',
      calculationType: 'funifier_direct',
      boost: {
        catalogItemId: 'E6K79Mt',
        name: 'Boost Multimarcas',
        description: 'Multiplicador ativo quando meta é atingida'
      }
    },
    unlockConditions: {
      catalogItemId: 'E6F0O5f',
      description: 'Pontos desbloqueados quando condições são atendidas'
    }
  },

  [TeamType.ER]: {
    teamType: TeamType.ER,
    displayName: 'ER',
    primaryGoal: {
      name: 'faturamento',
      displayName: 'Faturamento',
      challengeId: 'E6GglPq',
      actionId: 'faturamento',
      emoji: '📈',
      unit: 'R$',
      calculationType: 'funifier_direct'
    },
    secondaryGoal1: {
      name: 'reaisPorAtivo',
      displayName: 'Reais por Ativo',
      challengeId: 'E6Gm8RI',
      actionId: 'reais_por_ativo',
      emoji: '💰',
      unit: 'R$',
      calculationType: 'funifier_direct',
      boost: {
        catalogItemId: 'E6F0WGc',
        name: 'Boost Reais por Ativo',
        description: 'Multiplicador ativo quando meta é atingida'
      }
    },
    secondaryGoal2: {
      name: 'upa',
      displayName: 'UPA',
      challengeId: 'E6MTIIn',
      actionId: 'upa',
      emoji: '📊',
      unit: 'UPA',
      calculationType: 'funifier_direct',
      boost: {
        catalogItemId: 'E6K79Mt',
        name: 'Boost UPA',
        description: 'Multiplicador ativo quando meta é atingida'
      }
    },
    unlockConditions: {
      catalogItemId: 'E6F0O5f',
      description: 'Pontos desbloqueados quando condições são atendidas'
    }
  }
};

/**
 * Get default configuration for a specific team type
 */
export function getDefaultDashboardConfig(teamType: TeamType): DashboardConfig {
  return DEFAULT_DASHBOARD_CONFIGURATIONS[teamType];
}

/**
 * Get all default configurations
 */
export function getAllDefaultConfigurations(): Record<TeamType, DashboardConfig> {
  return { ...DEFAULT_DASHBOARD_CONFIGURATIONS };
}

/**
 * Validate if a configuration matches the expected structure
 */
export function validateConfigurationStructure(config: DashboardConfig): boolean {
  try {
    return !!(
      config.teamType &&
      config.displayName &&
      config.primaryGoal &&
      config.secondaryGoal1 &&
      config.secondaryGoal2 &&
      config.unlockConditions &&
      config.primaryGoal.name &&
      config.primaryGoal.displayName &&
      config.primaryGoal.challengeId &&
      config.primaryGoal.actionId &&
      config.primaryGoal.emoji &&
      config.primaryGoal.unit &&
      config.primaryGoal.calculationType &&
      config.secondaryGoal1.boost &&
      config.secondaryGoal2.boost
    );
  } catch {
    return false;
  }
}