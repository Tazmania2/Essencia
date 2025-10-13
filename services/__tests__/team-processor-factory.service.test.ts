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
      const carteira0Processor = factory.getProcessor(TeamType.CARTEIRA_0);
      const carteiraIProcessor = factory.getProcessor(TeamType.CARTEIRA_I);
      const carteiraIIProcessor = factory.getProcessor(TeamType.CARTEIRA_II);
      const carteiraIIIProcessor = factory.getProcessor(TeamType.CARTEIRA_III);
      const carteiraIVProcessor = factory.getProcessor(TeamType.CARTEIRA_IV);
      const erProcessor = factory.getProcessor(TeamType.ER);

      expect(carteira0Processor).toBeDefined();
      expect(carteiraIProcessor).toBeDefined();
      expect(carteiraIIProcessor).toBeDefined();
      expect(carteiraIIIProcessor).toBeDefined();
      expect(carteiraIVProcessor).toBeDefined();
      expect(erProcessor).toBeDefined();

      // Verify they are different instances for different teams
      expect(carteira0Processor).not.toBe(carteiraIProcessor);
      expect(carteiraIProcessor).not.toBe(carteiraIIProcessor);
      expect(carteiraIIIProcessor).not.toBe(carteiraIVProcessor);
      expect(carteiraIVProcessor).not.toBe(erProcessor);
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

    it('should process Carteira 0 data with Conversões as primary goal', () => {
      const carteira0Data = {
        ...mockPlayerData,
        teams: ['E6F5k30'], // Carteira 0 team ID
        challenge_progress: [
          {
            challengeId: 'E82R5cQ', // Carteira 0 - Conversões
            percentage: 75
          }
        ]
      };

      const carteira0ReportData = {
        ...mockReportData,
        team: TeamType.CARTEIRA_0,
        conversoes: 80, // Different from challenge data
        reaisPorAtivo: 110,
        faturamento: 95
      };

      const result = factory.processPlayerData(TeamType.CARTEIRA_0, carteira0Data, carteira0ReportData);

      expect(result.primaryGoal.name).toBe('Conversões'); // Carteira 0 primary goal
      expect(result.secondaryGoal1.name).toBe('Reais por Ativo');
      expect(result.secondaryGoal2.name).toBe('Faturamento');
      expect(result.primaryGoal.percentage).toBe(75); // Should use challenge data, not report data
    });

    it('should process ER data with Faturamento as primary goal and UPA as secondary', () => {
      const erData = {
        ...mockPlayerData,
        teams: ['E500AbT'], // ER team ID
        challenge_progress: [
          {
            challengeId: 'E6F8HMK', // ER - Faturamento (reused from Carteira III/IV)
            percentage: 85
          },
          {
            challengeId: 'E62x2PW', // ER - UPA
            percentage: 70
          }
        ]
      };

      const erReportData = {
        ...mockReportData,
        team: TeamType.ER,
        faturamento: 90, // Different from challenge data
        reaisPorAtivo: 105,
        upa: 65 // Different from challenge data
      };

      const result = factory.processPlayerData(TeamType.ER, erData, erReportData);

      expect(result.primaryGoal.name).toBe('Faturamento'); // ER primary goal
      expect(result.secondaryGoal1.name).toBe('Reais por Ativo');
      expect(result.secondaryGoal2.name).toBe('UPA'); // ER specific metric
      expect(result.primaryGoal.percentage).toBe(85); // Should use challenge data, not report data
      expect(result.secondaryGoal2.percentage).toBe(70); // Should use challenge data for UPA
    });
  });

  describe('determineTeamType', () => {
    it('should determine team type from teams array', () => {
      const playerData0 = { ...mockPlayerData, teams: ['E6F5k30'] }; // Actual Funifier team ID for Carteira 0
      const playerDataI = { ...mockPlayerData, teams: ['E6F4sCh'] }; // Actual Funifier team ID
      const playerDataII = { ...mockPlayerData, teams: ['E6F4O1b'] }; // Actual Funifier team ID
      const playerDataIII = { ...mockPlayerData, teams: ['E6F4Xf2'] }; // Actual Funifier team ID
      const playerDataIV = { ...mockPlayerData, teams: ['E6F41Bb'] }; // Actual Funifier team ID
      const playerDataER = { ...mockPlayerData, teams: ['E500AbT'] }; // Actual Funifier team ID for ER

      expect(factory.determineTeamType(playerData0)).toBe(TeamType.CARTEIRA_0);
      expect(factory.determineTeamType(playerDataI)).toBe(TeamType.CARTEIRA_I);
      expect(factory.determineTeamType(playerDataII)).toBe(TeamType.CARTEIRA_II);
      expect(factory.determineTeamType(playerDataIII)).toBe(TeamType.CARTEIRA_III);
      expect(factory.determineTeamType(playerDataIV)).toBe(TeamType.CARTEIRA_IV);
      expect(factory.determineTeamType(playerDataER)).toBe(TeamType.ER);
    });

    it('should determine team type from player ID', () => {
      const playerDataC0 = { ...mockPlayerData, _id: 'player_carteira0_123', teams: [] };
      const playerDataC1 = { ...mockPlayerData, _id: 'player_carteira1_123', teams: [] };
      const playerDataC2 = { ...mockPlayerData, _id: 'player_c2_456', teams: [] };
      const playerDataER = { ...mockPlayerData, _id: 'player_er_789', teams: [] };

      expect(factory.determineTeamType(playerDataC0)).toBe(TeamType.CARTEIRA_0);
      expect(factory.determineTeamType(playerDataC1)).toBe(TeamType.CARTEIRA_I);
      expect(factory.determineTeamType(playerDataC2)).toBe(TeamType.CARTEIRA_II);
      expect(factory.determineTeamType(playerDataER)).toBe(TeamType.ER);
    });

    it('should return null for unknown team type', () => {
      const unknownPlayerData = { ...mockPlayerData, teams: ['unknown_team'], _id: 'unknown_playid_123' };
      expect(factory.determineTeamType(unknownPlayerData)).toBeNull();
    });

    it('should handle empty teams array', () => {
      const emptyTeamsData = { ...mockPlayerData, teams: [], _id: 'unknown_playid_456' };
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
        _id: 'unknown_playid_789'
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

      expect(teamTypes).toHaveLength(6);
      expect(teamTypes).toContain(TeamType.CARTEIRA_0);
      expect(teamTypes).toContain(TeamType.CARTEIRA_I);
      expect(teamTypes).toContain(TeamType.CARTEIRA_II);
      expect(teamTypes).toContain(TeamType.CARTEIRA_III);
      expect(teamTypes).toContain(TeamType.CARTEIRA_IV);
      expect(teamTypes).toContain(TeamType.ER);
    });
  });

  describe('getTeamInfo', () => {
    it('should return correct info for Carteira 0', () => {
      const info = factory.getTeamInfo(TeamType.CARTEIRA_0);

      expect(info.name).toBe('Carteira 0');
      expect(info.primaryGoal).toBe('Conversões');
      expect(info.secondaryGoals).toEqual(['Reais por Ativo', 'Faturamento']);
      expect(info.specialFeatures).toContain('Direct Funifier integration');
      expect(info.specialFeatures).toContain('Conversion-based metrics');
    });

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

    it('should return correct info for ER', () => {
      const info = factory.getTeamInfo(TeamType.ER);

      expect(info.name).toBe('ER');
      expect(info.primaryGoal).toBe('Faturamento');
      expect(info.secondaryGoals).toEqual(['Reais por Ativo', 'UPA']);
      expect(info.specialFeatures).toContain('Challenge data priority');
      expect(info.specialFeatures).toContain('UPA metrics');
      expect(info.specialFeatures).toContain('Medalhas functionality');
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

      expect(stats.availableProcessors).toBe(6);
      expect(stats.supportedTeamTypes).toHaveLength(6);
      expect(stats.processorInfo).toHaveLength(6);

      // Check that all processors are available
      stats.processorInfo.forEach(info => {
        expect(info.isAvailable).toBe(true);
        expect(info.processorName).not.toBe('Unknown');
      });

      // Check specific processor names
      const carteira0Info = stats.processorInfo.find(p => p.teamType === TeamType.CARTEIRA_0);
      const carteiraIInfo = stats.processorInfo.find(p => p.teamType === TeamType.CARTEIRA_I);
      const carteiraIIInfo = stats.processorInfo.find(p => p.teamType === TeamType.CARTEIRA_II);
      const erInfo = stats.processorInfo.find(p => p.teamType === TeamType.ER);

      expect(carteira0Info?.processorName).toBe('Carteira0Processor');
      expect(carteiraIInfo?.processorName).toBe('CarteiraIProcessor');
      expect(carteiraIIInfo?.processorName).toBe('CarteiraIIProcessor');
      expect(erInfo?.processorName).toBe('ERProcessor');
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

      expect(stats.availableProcessors).toBe(5); // One less than total (6-1=5)
      
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
        [TeamType.CARTEIRA_0]: 'E6F5k30',
        [TeamType.CARTEIRA_I]: 'E6F4sCh',
        [TeamType.CARTEIRA_II]: 'E6F4O1b',
        [TeamType.CARTEIRA_III]: 'E6F4Xf2',
        [TeamType.CARTEIRA_IV]: 'E6F41Bb',
        [TeamType.ER]: 'E500AbT'
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
        [TeamType.CARTEIRA_0]: 'E6F5k30',
        [TeamType.CARTEIRA_I]: 'E6F4sCh',
        [TeamType.CARTEIRA_II]: 'E6F4O1b',
        [TeamType.CARTEIRA_III]: 'E6F4Xf2',
        [TeamType.CARTEIRA_IV]: 'E6F41Bb',
        [TeamType.ER]: 'E500AbT'
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