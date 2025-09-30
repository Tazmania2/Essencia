import {
  TeamType,
  TeamProcessor,
  PlayerMetrics,
  FunifierPlayerStatus,
  EssenciaReportRecord,
  DashboardConfig
} from '../types';
import { carteiraIProcessor } from './carteira-i-processor.service';
import { carteiraIIProcessor } from './carteira-ii-processor.service';
import { carteiraIIIProcessor, carteiraIVProcessor } from './carteira-iii-iv-processor.service';
import { carteira0Processor } from './carteira-0-processor.service';
import { erProcessor } from './er-processor.service';
import { TeamProcessorUtils } from './team-processor.service';

/**
 * Team Processor Factory Service
 * 
 * Provides a unified interface for processing player data across all team types.
 * Automatically selects the appropriate processor based on team type.
 */
export class TeamProcessorFactory {
  private static instance: TeamProcessorFactory;

  private constructor() {}

  public static getInstance(): TeamProcessorFactory {
    if (!TeamProcessorFactory.instance) {
      TeamProcessorFactory.instance = new TeamProcessorFactory();
    }
    return TeamProcessorFactory.instance;
  }

  /**
   * Get the appropriate processor for a team type
   */
  public getProcessor(teamType: TeamType): TeamProcessor {
    switch (teamType) {
      case TeamType.CARTEIRA_0:
        return carteira0Processor;
      case TeamType.CARTEIRA_I:
        return carteiraIProcessor;
      case TeamType.CARTEIRA_II:
        return carteiraIIProcessor;
      case TeamType.CARTEIRA_III:
        return carteiraIIIProcessor;
      case TeamType.CARTEIRA_IV:
        return carteiraIVProcessor;
      case TeamType.ER:
        return erProcessor;
      default:
        throw new Error(`Unsupported team type: ${teamType}`);
    }
  }

  /**
   * Process player data using the appropriate team processor
   */
  public processPlayerData(
    teamType: TeamType,
    rawData: FunifierPlayerStatus,
    reportData?: EssenciaReportRecord,
    teamConfig?: DashboardConfig
  ): PlayerMetrics {
    const processor = this.getProcessor(teamType);
    return processor.processPlayerData(rawData, reportData, teamConfig);
  }

  /**
   * Determine team type from player data
   */
  public determineTeamType(playerData: FunifierPlayerStatus): TeamType | null {
    // Try to determine from teams array
    if (playerData.teams && playerData.teams.length > 0) {
      const primaryTeam = playerData.teams[0];
      const teamType = TeamProcessorUtils.determineTeamType(primaryTeam);
      if (teamType) {
        return teamType;
      }
    }

    // Try to determine from player ID or other identifiers
    // This could be extended based on actual Funifier data structure
    const playerId = playerData._id?.toLowerCase() || '';
    
    // Check for team-related patterns in player ID (fallback)
    if (playerId.includes('carteira0') || playerId.includes('c0')) {
      return TeamType.CARTEIRA_0;
    }
    if (playerId.includes('carteira1') || playerId.includes('c1')) {
      return TeamType.CARTEIRA_I;
    }
    if (playerId.includes('carteira2') || playerId.includes('c2')) {
      return TeamType.CARTEIRA_II;
    }
    if (playerId.includes('carteira3') || playerId.includes('c3')) {
      return TeamType.CARTEIRA_III;
    }
    if (playerId.includes('carteira4') || playerId.includes('c4')) {
      return TeamType.CARTEIRA_IV;
    }
    if (playerId.includes('er') || playerId.includes('external')) {
      return TeamType.ER;
    }

    return null;
  }

  /**
   * Process player data with automatic team type detection
   */
  public processPlayerDataAuto(
    rawData: FunifierPlayerStatus,
    reportData?: EssenciaReportRecord,
    teamConfig?: DashboardConfig
  ): {
    teamType: TeamType | null;
    playerMetrics: PlayerMetrics | null;
    error?: string;
  } {
    try {
      // Try to determine team type from report data first
      let teamType = reportData?.team || null;
      
      // If not in report data, try to determine from player data
      if (!teamType) {
        teamType = this.determineTeamType(rawData);
      }

      if (!teamType) {
        return {
          teamType: null,
          playerMetrics: null,
          error: 'Unable to determine team type from player data'
        };
      }

      const playerMetrics = this.processPlayerData(teamType, rawData, reportData, teamConfig);

      return {
        teamType,
        playerMetrics,
      };
    } catch (error) {
      return {
        teamType: null,
        playerMetrics: null,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Get all available team types
   */
  public getAvailableTeamTypes(): TeamType[] {
    return [
      TeamType.CARTEIRA_0,
      TeamType.CARTEIRA_I,
      TeamType.CARTEIRA_II,
      TeamType.CARTEIRA_III,
      TeamType.CARTEIRA_IV,
      TeamType.ER
    ];
  }

  /**
   * Get team-specific information
   */
  public getTeamInfo(teamType: TeamType): {
    name: string;
    primaryGoal: string;
    secondaryGoals: string[];
    specialFeatures: string[];
  } {
    switch (teamType) {
      case TeamType.CARTEIRA_0:
        return {
          name: 'Carteira 0',
          primaryGoal: 'Conversões',
          secondaryGoals: ['Reais por Ativo', 'Faturamento'],
          specialFeatures: ['Direct Funifier integration', 'Conversion-based metrics']
        };
      case TeamType.CARTEIRA_I:
        return {
          name: 'Carteira I',
          primaryGoal: 'Atividade',
          secondaryGoals: ['Reais por Ativo', 'Faturamento'],
          specialFeatures: ['Direct Funifier integration', 'Standard boost logic']
        };
      case TeamType.CARTEIRA_II:
        return {
          name: 'Carteira II',
          primaryGoal: 'Reais por Ativo',
          secondaryGoals: ['Atividade', 'Multimarcas por Ativo'],
          specialFeatures: [
            'Local points calculation',
            'Unlock threshold at 100%',
            'Boost multipliers: +100% each',
            'Collection data priority'
          ]
        };
      case TeamType.CARTEIRA_III:
        return {
          name: 'Carteira III',
          primaryGoal: 'Faturamento',
          secondaryGoals: ['Reais por Ativo', 'Multimarcas por Ativo'],
          specialFeatures: ['Challenge data priority', 'Direct Funifier integration']
        };
      case TeamType.CARTEIRA_IV:
        return {
          name: 'Carteira IV',
          primaryGoal: 'Faturamento',
          secondaryGoals: ['Reais por Ativo', 'Multimarcas por Ativo'],
          specialFeatures: ['Challenge data priority', 'Direct Funifier integration']
        };
      case TeamType.ER:
        return {
          name: 'ER',
          primaryGoal: 'Faturamento',
          secondaryGoals: ['Reais por Ativo', 'UPA'],
          specialFeatures: ['Challenge data priority', 'UPA metrics', 'Medalhas functionality']
        };
      default:
        throw new Error(`Unknown team type: ${teamType}`);
    }
  }

  /**
   * Validate team processor configuration
   */
  public validateConfiguration(): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Test each processor
      const teamTypes = this.getAvailableTeamTypes();
      
      for (const teamType of teamTypes) {
        try {
          const processor = this.getProcessor(teamType);
          if (!processor) {
            errors.push(`No processor found for team type: ${teamType}`);
          }
        } catch (error) {
          errors.push(`Error getting processor for ${teamType}: ${error}`);
        }
      }

      // Check if all required processors are available
      const requiredProcessors = [
        carteira0Processor,
        carteiraIProcessor,
        carteiraIIProcessor,
        carteiraIIIProcessor,
        carteiraIVProcessor,
        erProcessor
      ];

      for (let i = 0; i < requiredProcessors.length; i++) {
        if (!requiredProcessors[i]) {
          errors.push(`Required processor ${i + 1} is not available`);
        }
      }

    } catch (error) {
      errors.push(`Configuration validation failed: ${error}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get processing statistics for debugging
   */
  public getProcessingStats(): {
    availableProcessors: number;
    supportedTeamTypes: TeamType[];
    processorInfo: {
      teamType: TeamType;
      processorName: string;
      isAvailable: boolean;
    }[];
  } {
    const supportedTeamTypes = this.getAvailableTeamTypes();
    const processorInfo = supportedTeamTypes.map(teamType => {
      let processorName = '';
      let isAvailable = false;

      try {
        const processor = this.getProcessor(teamType);
        processorName = processor.constructor.name;
        isAvailable = true;
      } catch (error) {
        processorName = 'Unknown';
        isAvailable = false;
      }

      return {
        teamType,
        processorName,
        isAvailable
      };
    });

    return {
      availableProcessors: processorInfo.filter(p => p.isAvailable).length,
      supportedTeamTypes,
      processorInfo
    };
  }
}

// Export singleton instance
export const teamProcessorFactory = TeamProcessorFactory.getInstance();