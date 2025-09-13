import { TeamProcessorFactory, teamProcessorFactory } from '../team-processor-factory.service';
import {
  TeamType,
  FunifierPlayerStatus,
  EssenciaReportRecord,
  FUNIFIER_CONFIG
} from '../../types';

describe('TeamProcessorFactory', () => {
  let factory: TeamProcessorFactory;
  let mockPlayerData: FunifierPlayerStatus;
  let mockReportData: EssenciaReportRecord;

  beforeEach(() => {
    factory = TeamProcessorFactory.getInstance();

    mockPlayerData = {
      _id: 'player123',
      name: 'Test Player',
      total_points: 1000,
      total_challenges: 3,
      challenges: {},
      point_categories: {},
      total_catalog_items: 3,
      catalog_items: {
        [FUNIFIER_CONFIG.CATALOG_ITEMS.UNLOCK_POINTS]: 1,
        [FUNIFIER_CONFIG.CATALOG_ITEMS.BOOST_SECONDARY_1]: 1,
        [FUNIFIER_CONFIG.CATALOG_ITEMS.BOOST_SECONDARY_2]: 0
      },
      level_progress: {
        percent_completed: 50,
        next_points: 500,
        total_levels: 10,
        percent: 50
      },
      challenge_progress: [],
      teams: ['carteira_i'],
      positions: [],
      time: Date.now(),
      extra: {},
      pointCategories: {}
    };

    mockReportData = {
      _id: 'player123_2024-01-15',
      playerId: 'player123',
      playerName: 'Test Player',
      team: TeamType.CARTEIRA_I,
      atividade: 75,
      reaisPorAtivo: 110,
      faturamento: 85,
      currentCycleDay: 10,
      totalCycleDays: 21,
      reportDate: '2024-01-15T00:00:00.000Z',
      createdAt: '2024-01-15T00:00:00.000Z',
      updatedAt: '2024-01-15T00:00:00.000Z'
    };
  });

  describe('singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = TeamProcessorFactory.getInstance();
      const instance2 = TeamProcessorFactory.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should export singleton instance', () => {
      expect(teamProcessorFactory).toBeInstanceOf(TeamProcessorFactory);
      expect(teamProcessorFactory).toBe(TeamProcessorFactory.getInstance());
    });
  });

  describe('getProcessor', () => {
    it('should return correct processor for each team type', () => {
      const carteiraIProcessor = factory.getProcessor(TeamType.CARTEIRA_I);
      const carteiraIIProcessor = factory.getProcessor(TeamType.CARTEIRA_II);
      const carteiraIIIProcessor = factory.getProcessor(TeamType.CARTEIRA_III);
      const carteiraIVProcessor = factory.getProcessor(TeamType.CARTEIRA_IV);

      expect(carteiraIProcessor).toBeDefined();
      expect(carteiraIIProcessor).toBeDefined();
      expect(carteiraIIIProcessor).toBeDefined();
      expect(carteiraIVProcessor).toBeDefined();

      // Verify they are different instances for different teams
      expect(carteiraIProcessor).not.toBe(carteiraIIProcessor);
      expect(carteiraIIIProcessor).not.toBe(carteiraIVProcessor);
    });

    it('should throw error for unsupported team type', () => {
      expect(() => {
        factory.getProcessor('INVALID_TEAM' as TeamType);
      }).toThrow('Unsupported team type: INVALID_TEAM');
    });
  });

  describe('processPlayerData', () => {
    it('should process data using correct team processor', () => {
      const result = factory.processPlayerData(TeamType.CARTEIRA_I, mockPlayerData, mockReportData);

      expect(result).toBeDefined();
      expect(result.playerName).toBe('Test Player');
      expect(result.primaryGoal.name).toBe('Atividade'); // Carteira I primary goal
      expect(result.secondaryGoal1.name).toBe('Reais por Ativo');
      expect(result.secondaryGoal2.name).toBe('Faturamento');
    });

    it('should process Carteira II data with local calculations', () => {
      const carteiraIIReportData = {
        ...mockReportData,
        team: TeamType.CARTEIRA_II,
        reaisPorAtivo: 110 // Above 100% threshold
      };

      const result = factory.processPlayerData(TeamType.CARTEIRA_II, mockPlayerData, carteiraIIReportData);

      expect(result.primaryGoal.name).toBe('Reais por Ativo'); // Carteira II primary goal
      expect(result.pointsLocked).toBe(false); // Should be unlocked
      expect(result.totalPoints).toBeGreaterThan(1000); // Should have boost applied
    });

    it('should process Carteira III data prioritizing challenge data', () => {
      const carteiraIIIData = {
        ...mockPlayerData,
        teams: ['carteira_iii'],
        challenge_progress: [
          {
            challengeId: 'E6F8HMK', // Carteira III & IV - Bater Meta Faturamento
            percentage: 90
          }
        ]
      };

      const carteiraIIIReportData = {
        ...mockReportData,
        team: TeamType.CARTEIRA_III,
        faturamento: 85 // Different from challenge data
      };

      const result = factory.processPlayerData(TeamType.CARTEIRA_III, carteiraIIIData, carteiraIIIReportData);

      expect(result.primaryGoal.name).toBe('Faturamento'); // Carteira III primary goal
      expect(result.primaryGoal.percentage).toBe(90); // Should use challenge data, not report data
    });
  });

  describe('determineTeamType', () => {
    it('should determine team type from teams array', () => {
      const playerDataI = { ...mockPlayerData, teams: ['E6F4sCh'] }; // Actual Funifier team ID
      const playerDataII = { ...mockPlayerData, teams: ['E6F4O1b'] }; // Actual Funifier team ID
      const playerDataIII = { ...mockPlayerData, teams: ['E6F4Xf2'] }; // Actual Funifier team ID
      const playerDataIV = { ...mockPlayerData, teams: ['E6F41Bb'] }; // Actual Funifier team ID

      expect(factory.determineTeamType(playerDataI)).toBe(TeamType.CARTEIRA_I);
      expect(factory.determineTeamType(playerDataII)).toBe(TeamType.CARTEIRA_II);
      expect(factory.determineTeamType(playerDataIII)).toBe(TeamType.CARTEIRA_III);
      expect(factory.determineTeamType(playerDataIV)).toBe(TeamType.CARTEIRA_IV);
    });

    it('should determine team type from player ID', () => {
      const playerDataC1 = { ...mockPlayerData, _id: 'player_carteira1_123', teams: [] };
      const playerDataC2 = { ...mockPlayerData, _id: 'player_c2_456', teams: [] };

      expect(factory.determineTeamType(playerDataC1)).toBe(TeamType.CARTEIRA_I);
      expect(factory.determineTeamType(playerDataC2)).toBe(TeamType.CARTEIRA_II);
    });

    it('should return null for unknown team type', () => {
      const unknownPlayerData = { ...mockPlayerData, teams: ['unknown_team'], _id: 'unknown_player' };
      expect(factory.determineTeamType(unknownPlayerData)).toBeNull();
    });

    it('should handle empty teams array', () => {
      const emptyTeamsData = { ...mockPlayerData, teams: [] };
      expect(factory.determineTeamType(emptyTeamsData)).toBeNull();
    });
  });

  describe('processPlayerDataAuto', () => {
    it('should process data with team type from report data', () => {
      const result = factory.processPlayerDataAuto(mockPlayerData, mockReportData);

      expect(result.teamType).toBe(TeamType.CARTEIRA_I);
      expect(result.playerMetrics).toBeDefined();
      expect(result.error).toBeUndefined();
      expect(result.playerMetrics?.playerName).toBe('Test Player');
    });

    it('should process data with team type from player data when report data has no team', () => {
      const reportDataWithoutTeam = { ...mockReportData };
      delete (reportDataWithoutTeam as any).team;

      const result = factory.processPlayerDataAuto(mockPlayerData, reportDataWithoutTeam);

      expect(result.teamType).toBe(TeamType.CARTEIRA_I); // From player data teams array
      expect(result.playerMetrics).toBeDefined();
      expect(result.error).toBeUndefined();
    });

    it('should return error when team type cannot be determined', () => {
      const unknownPlayerData = {
        ...mockPlayerData,
        teams: [],
        _id: 'unknown_player'
      };

      const result = factory.processPlayerDataAuto(unknownPlayerData);

      expect(result.teamType).toBeNull();
      expect(result.playerMetrics).toBeNull();
      expect(result.error).toBe('Unable to determine team type from player data');
    });

    it('should handle processing errors gracefully', () => {
      // Mock a processor that throws an error
      const originalGetProcessor = factory.getProcessor;
      factory.getProcessor = jest.fn().mockImplementation(() => {
        throw new Error('Test processing error');
      });

      const result = factory.processPlayerDataAuto(mockPlayerData, mockReportData);

      expect(result.teamType).toBeNull();
      expect(result.playerMetrics).toBeNull();
      expect(result.error).toBe('Test processing error');

      // Restore original method
      factory.getProcessor = originalGetProcessor;
    });
  });

  describe('getAvailableTeamTypes', () => {
    it('should return all team types', () => {
      const teamTypes = factory.getAvailableTeamTypes();

      expect(teamTypes).toHaveLength(4);
      expect(teamTypes).toContain(TeamType.CARTEIRA_I);
      expect(teamTypes).toContain(TeamType.CARTEIRA_II);
      expect(teamTypes).toContain(TeamType.CARTEIRA_III);
      expect(teamTypes).toContain(TeamType.CARTEIRA_IV);
    });
  });

  describe('getTeamInfo', () => {
    it('should return correct info for Carteira I', () => {
      const info = factory.getTeamInfo(TeamType.CARTEIRA_I);

      expect(info.name).toBe('Carteira I');
      expect(info.primaryGoal).toBe('Atividade');
      expect(info.secondaryGoals).toEqual(['Reais por Ativo', 'Faturamento']);
      expect(info.specialFeatures).toContain('Direct Funifier integration');
    });

    it('should return correct info for Carteira II', () => {
      const info = factory.getTeamInfo(TeamType.CARTEIRA_II);

      expect(info.name).toBe('Carteira II');
      expect(info.primaryGoal).toBe('Reais por Ativo');
      expect(info.secondaryGoals).toEqual(['Atividade', 'Multimarcas por Ativo']);
      expect(info.specialFeatures).toContain('Local points calculation');
      expect(info.specialFeatures).toContain('Unlock threshold at 100%');
    });

    it('should return correct info for Carteira III', () => {
      const info = factory.getTeamInfo(TeamType.CARTEIRA_III);

      expect(info.name).toBe('Carteira III');
      expect(info.primaryGoal).toBe('Faturamento');
      expect(info.secondaryGoals).toEqual(['Reais por Ativo', 'Multimarcas por Ativo']);
      expect(info.specialFeatures).toContain('Challenge data priority');
    });

    it('should return correct info for Carteira IV', () => {
      const info = factory.getTeamInfo(TeamType.CARTEIRA_IV);

      expect(info.name).toBe('Carteira IV');
      expect(info.primaryGoal).toBe('Faturamento');
      expect(info.secondaryGoals).toEqual(['Reais por Ativo', 'Multimarcas por Ativo']);
      expect(info.specialFeatures).toContain('Challenge data priority');
    });

    it('should throw error for unknown team type', () => {
      expect(() => {
        factory.getTeamInfo('UNKNOWN' as TeamType);
      }).toThrow('Unknown team type: UNKNOWN');
    });
  });

  describe('validateConfiguration', () => {
    it('should validate configuration successfully', () => {
      const validation = factory.validateConfiguration();

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect configuration errors', () => {
      // Mock getProcessor to throw an error for one team type
      const originalGetProcessor = factory.getProcessor;
      factory.getProcessor = jest.fn().mockImplementation((teamType) => {
        if (teamType === TeamType.CARTEIRA_I) {
          throw new Error('Processor not available');
        }
        return originalGetProcessor.call(factory, teamType);
      });

      const validation = factory.validateConfiguration();

      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors[0]).toContain('Error getting processor for CARTEIRA_I');

      // Restore original method
      factory.getProcessor = originalGetProcessor;
    });
  });

  describe('getProcessingStats', () => {
    it('should return processing statistics', () => {
      const stats = factory.getProcessingStats();

      expect(stats.availableProcessors).toBe(4);
      expect(stats.supportedTeamTypes).toHaveLength(4);
      expect(stats.processorInfo).toHaveLength(4);

      // Check that all processors are available
      stats.processorInfo.forEach(info => {
        expect(info.isAvailable).toBe(true);
        expect(info.processorName).not.toBe('Unknown');
      });

      // Check specific processor names
      const carteiraIInfo = stats.processorInfo.find(p => p.teamType === TeamType.CARTEIRA_I);
      const carteiraIIInfo = stats.processorInfo.find(p => p.teamType === TeamType.CARTEIRA_II);

      expect(carteiraIInfo?.processorName).toBe('CarteiraIProcessor');
      expect(carteiraIIInfo?.processorName).toBe('CarteiraIIProcessor');
    });

    it('should handle unavailable processors in stats', () => {
      // Mock getProcessor to fail for one team type
      const originalGetProcessor = factory.getProcessor;
      factory.getProcessor = jest.fn().mockImplementation((teamType) => {
        if (teamType === TeamType.CARTEIRA_I) {
          throw new Error('Processor not available');
        }
        return originalGetProcessor.call(factory, teamType);
      });

      const stats = factory.getProcessingStats();

      expect(stats.availableProcessors).toBe(3); // One less than total
      
      const carteiraIInfo = stats.processorInfo.find(p => p.teamType === TeamType.CARTEIRA_I);
      expect(carteiraIInfo?.isAvailable).toBe(false);
      expect(carteiraIInfo?.processorName).toBe('Unknown');

      // Restore original method
      factory.getProcessor = originalGetProcessor;
    });
  });

  describe('integration tests', () => {
    it('should process all team types without errors', () => {
      const teamTypes = factory.getAvailableTeamTypes();
      const teamIdMap = {
        [TeamType.CARTEIRA_I]: 'E6F4sCh',
        [TeamType.CARTEIRA_II]: 'E6F4O1b',
        [TeamType.CARTEIRA_III]: 'E6F4Xf2',
        [TeamType.CARTEIRA_IV]: 'E6F41Bb'
      };

      teamTypes.forEach(teamType => {
        const playerData = {
          ...mockPlayerData,
          teams: [teamIdMap[teamType]]
        };

        const reportData = {
          ...mockReportData,
          team: teamType
        };

        expect(() => {
          const result = factory.processPlayerData(teamType, playerData, reportData);
          expect(result).toBeDefined();
          expect(result.playerName).toBe('Test Player');
        }).not.toThrow();
      });
    });

    it('should handle auto processing for all team types', () => {
      const teamTypes = factory.getAvailableTeamTypes();
      const teamIdMap = {
        [TeamType.CARTEIRA_I]: 'E6F4sCh',
        [TeamType.CARTEIRA_II]: 'E6F4O1b',
        [TeamType.CARTEIRA_III]: 'E6F4Xf2',
        [TeamType.CARTEIRA_IV]: 'E6F41Bb'
      };

      teamTypes.forEach(teamType => {
        const playerData = {
          ...mockPlayerData,
          teams: [teamIdMap[teamType]]
        };

        const reportData = {
          ...mockReportData,
          team: teamType
        };

        const result = factory.processPlayerDataAuto(playerData, reportData);

        expect(result.teamType).toBe(teamType);
        expect(result.playerMetrics).toBeDefined();
        expect(result.error).toBeUndefined();
      });
    });
  });
});