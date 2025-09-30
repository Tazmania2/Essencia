import { DashboardConfig, TeamType } from '../types';

export function validateConfigurationStructure(config: DashboardConfig): boolean {
  if (!config) return false;
  
  // Check required properties
  if (!config.teamType || !config.displayName) return false;
  if (!config.primaryGoal || !config.secondaryGoal1 || !config.secondaryGoal2) return false;
  if (!config.unlockConditions) return false;
  
  // Check goal structure
  const goals = [config.primaryGoal, config.secondaryGoal1, config.secondaryGoal2];
  for (const goal of goals) {
    if (!goal.name || !goal.displayName || !goal.metric) return false;
    if (!goal.challengeId || !goal.actionId || !goal.calculationType) return false;
  }
  
  // Check unlock conditions
  if (!config.unlockConditions.catalogItemId || !config.unlockConditions.description) return false;
  
  return true;
}

export function getDefaultConfiguration(teamType: TeamType): DashboardConfig {
  const baseConfig = {
    teamType,
    displayName: getTeamDisplayName(teamType),
    unlockConditions: {
      catalogItemId: 'E6F0O5f',
      description: 'Unlock points to access dashboard features'
    }
  };

  switch (teamType) {
    case TeamType.CARTEIRA_I:
      return {
        ...baseConfig,
        primaryGoal: {
          name: 'atividade',
          displayName: 'Atividade',
          metric: 'atividade',
          challengeId: 'E6FQIjs',
          actionId: 'atividade',
          calculationType: 'funifier_api'
        },
        secondaryGoal1: {
          name: 'reaisPorAtivo',
          displayName: 'Reais por Ativo',
          metric: 'reaisPorAtivo',
          challengeId: 'E6Gm8RI',
          actionId: 'reais_por_ativo',
          calculationType: 'funifier_api',
          boost: {
            catalogItemId: 'E6F0WGc',
            name: 'Boost Reais por Ativo',
            description: 'Boost para meta de reais por ativo'
          }
        },
        secondaryGoal2: {
          name: 'faturamento',
          displayName: 'Faturamento',
          metric: 'faturamento',
          challengeId: 'E6GglPq',
          actionId: 'faturamento',
          calculationType: 'funifier_api',
          boost: {
            catalogItemId: 'E6K79Mt',
            name: 'Boost Faturamento',
            description: 'Boost para meta de faturamento'
          }
        }
      };
    
    default:
      // Return a basic configuration for other team types
      return {
        ...baseConfig,
        primaryGoal: {
          name: 'atividade',
          displayName: 'Atividade',
          metric: 'atividade',
          challengeId: 'default',
          actionId: 'atividade',
          calculationType: 'funifier_api'
        },
        secondaryGoal1: {
          name: 'reaisPorAtivo',
          displayName: 'Reais por Ativo',
          metric: 'reaisPorAtivo',
          challengeId: 'default',
          actionId: 'reais_por_ativo',
          calculationType: 'funifier_api'
        },
        secondaryGoal2: {
          name: 'faturamento',
          displayName: 'Faturamento',
          metric: 'faturamento',
          challengeId: 'default',
          actionId: 'faturamento',
          calculationType: 'funifier_api'
        }
      };
  }
}

function getTeamDisplayName(teamType: TeamType): string {
  const names = {
    [TeamType.CARTEIRA_0]: 'Carteira 0',
    [TeamType.CARTEIRA_I]: 'Carteira I',
    [TeamType.CARTEIRA_II]: 'Carteira II',
    [TeamType.CARTEIRA_III]: 'Carteira III',
    [TeamType.CARTEIRA_IV]: 'Carteira IV',
    [TeamType.ER]: 'ER'
  };
  return names[teamType] || teamType;
}