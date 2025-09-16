import { UserIdentificationService, userIdentificationService } from '../user-identification.service';
import { funifierPlayerService } from '../funifier-player.service';
import { FunifierPlayerStatus, TeamType, FUNIFIER_CONFIG, ApiError, ErrorType } from '../../types';

// Mock the funifier player service
jest.mock('../funifier-player.service');

describe('UserIdentificationService', () => {
  let service: UserIdentificationService;
  const mockFunifierPlayerService = funifierPlayerService as jest.Mocked<typeof funifierPlayerService>;

  beforeEach(() => {
    service = UserIdentificationService.getInstance();
    jest.clearAllMocks();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = UserIdentificationService.getInstance();
      const instance2 = UserIdentificationService.getInstance();
      expect(instance1).toBe(instance2);
      expect(instance1).toBe(userIdentificationService);
    });
  });

  describe('mapTeamIdToType', () => {
    it('should map Carteira 0 team ID to TeamType', () => {
      const result = service.mapTeamIdToType(FUNIFIER_CONFIG.TEAM_IDS.CARTEIRA_0);
      expect(result).toBe(TeamType.CARTEIRA_0);
    });

    it('should map Carteira I team ID to TeamType', () => {
      const result = service.mapTeamIdToType(FUNIFIER_CONFIG.TEAM_IDS.CARTEIRA_I);
      expect(result).toBe(TeamType.CARTEIRA_I);
    });

    it('should map Carteira II team ID to TeamType', () => {
      const result = service.mapTeamIdToType(FUNIFIER_CONFIG.TEAM_IDS.CARTEIRA_II);
      expect(result).toBe(TeamType.CARTEIRA_II);
    });

    it('should map Carteira III team ID to TeamType', () => {
      const result = service.mapTeamIdToType(FUNIFIER_CONFIG.TEAM_IDS.CARTEIRA_III);
      expect(result).toBe(TeamType.CARTEIRA_III);
    });

    it('should map Carteira IV team ID to TeamType', () => {
      const result = service.mapTeamIdToType(FUNIFIER_CONFIG.TEAM_IDS.CARTEIRA_IV);
      expect(result).toBe(TeamType.CARTEIRA_IV);
    });

    it('should map ER team ID to TeamType', () => {
      const result = service.mapTeamIdToType(FUNIFIER_CONFIG.TEAM_IDS.ER);
      expect(result).toBe(TeamType.ER);
    });

    it('should return null for unknown team ID', () => {
      const result = service.mapTeamIdToType('UNKNOWN_TEAM_ID');
      expect(result).toBeNull();
    });
  });

  describe('mapTeamTypeToId', () => {
    it('should map TeamType.CARTEIRA_0 to team ID', () => {
      const result = service.mapTeamTypeToId(TeamType.CARTEIRA_0);
      expect(result).toBe(FUNIFIER_CONFIG.TEAM_IDS.CARTEIRA_0);
    });

    it('should map TeamType.CARTEIRA_I to team ID', () => {
      const result = service.mapTeamTypeToId(TeamType.CARTEIRA_I);
      expect(result).toBe(FUNIFIER_CONFIG.TEAM_IDS.CARTEIRA_I);
    });

    it('should map TeamType.CARTEIRA_II to team ID', () => {
      const result = service.mapTeamTypeToId(TeamType.CARTEIRA_II);
      expect(result).toBe(FUNIFIER_CONFIG.TEAM_IDS.CARTEIRA_II);
    });

    it('should map TeamType.CARTEIRA_III to team ID', () => {
      const result = service.mapTeamTypeToId(TeamType.CARTEIRA_III);
      expect(result).toBe(FUNIFIER_CONFIG.TEAM_IDS.CARTEIRA_III);
    });

    it('should map TeamType.CARTEIRA_IV to team ID', () => {
      const result = service.mapTeamTypeToId(TeamType.CARTEIRA_IV);
      expect(result).toBe(FUNIFIER_CONFIG.TEAM_IDS.CARTEIRA_IV);
    });

    it('should map TeamType.ER to team ID', () => {
      const result = service.mapTeamTypeToId(TeamType.ER);
      expect(result).toBe(FUNIFIER_CONFIG.TEAM_IDS.ER);
    });
  });

  describe('determineUserRole', () => {
    it('should identify regular player', () => {
      const playerData: FunifierPlayerStatus = {
        _id: 'player123',
        name: 'Test Player',
        teams: [FUNIFIER_CONFIG.TEAM_IDS.CARTEIRA_I],
        total_challenges: 5,
        challenges: {},
        total_points: 100,
        point_categories: {},
        total_catalog_items: 3,
        catalog_items: {},
        level_progress: {
          percent_completed: 50,
          next_points: 50,
          total_levels: 10,
          percent: 50
        },
        challenge_progress: [],
        positions: [],
        time: Date.now(),
        extra: {},
        pointCategories: {}
      };

      const result = service.determineUserRole(playerData);
      
      expect(result.isPlayer).toBe(true);
      expect(result.isAdmin).toBe(false);
      expect(result.role).toBe('player');
    });

    it('should identify admin user with admin team membership', () => {
      const playerData: FunifierPlayerStatus = {
        _id: 'admin123',
        name: 'Test Admin',
        teams: [FUNIFIER_CONFIG.TEAM_IDS.ADMIN, FUNIFIER_CONFIG.TEAM_IDS.CARTEIRA_I],
        total_challenges: 5,
        challenges: {},
        total_points: 100,
        point_categories: {},
        total_catalog_items: 3,
        catalog_items: {},
        level_progress: {
          percent_completed: 50,
          next_points: 50,
          total_levels: 10,
          percent: 50
        },
        challenge_progress: [],
        positions: [],
        time: Date.now(),
        extra: {},
        pointCategories: {}
      };

      const result = service.determineUserRole(playerData);
      
      expect(result.isPlayer).toBe(false);
      expect(result.isAdmin).toBe(true);
      expect(result.role).toBe('admin');
    });

    it('should identify admin user with role in extra data', () => {
      const playerData: FunifierPlayerStatus = {
        _id: 'admin123',
        name: 'Test Admin',
        teams: [FUNIFIER_CONFIG.TEAM_IDS.CARTEIRA_I],
        total_challenges: 5,
        challenges: {},
        total_points: 100,
        point_categories: {},
        total_catalog_items: 3,
        catalog_items: {},
        level_progress: {
          percent_completed: 50,
          next_points: 50,
          total_levels: 10,
          percent: 50
        },
        challenge_progress: [],
        positions: [],
        time: Date.now(),
        extra: { role: 'admin' },
        pointCategories: {}
      };

      const result = service.determineUserRole(playerData);
      
      expect(result.isPlayer).toBe(false);
      expect(result.isAdmin).toBe(true);
      expect(result.role).toBe('admin');
    });

    it('should identify admin user with isAdmin flag', () => {
      const playerData: FunifierPlayerStatus = {
        _id: 'admin123',
        name: 'Test Admin',
        teams: [FUNIFIER_CONFIG.TEAM_IDS.CARTEIRA_I],
        total_challenges: 5,
        challenges: {},
        total_points: 100,
        point_categories: {},
        total_catalog_items: 3,
        catalog_items: {},
        level_progress: {
          percent_completed: 50,
          next_points: 50,
          total_levels: 10,
          percent: 50
        },
        challenge_progress: [],
        positions: [],
        time: Date.now(),
        extra: { isAdmin: true },
        pointCategories: {}
      };

      const result = service.determineUserRole(playerData);
      
      expect(result.isPlayer).toBe(false);
      expect(result.isAdmin).toBe(true);
      expect(result.role).toBe('admin');
    });
  });

  describe('extractTeamInformation', () => {
    it('should extract team information for single team player', () => {
      const playerData: FunifierPlayerStatus = {
        _id: 'player123',
        name: 'Test Player',
        teams: [FUNIFIER_CONFIG.TEAM_IDS.CARTEIRA_I],
        total_challenges: 5,
        challenges: {},
        total_points: 100,
        point_categories: {},
        total_catalog_items: 3,
        catalog_items: {},
        level_progress: {
          percent_completed: 50,
          next_points: 50,
          total_levels: 10,
          percent: 50
        },
        challenge_progress: [],
        positions: [],
        time: Date.now(),
        extra: {},
        pointCategories: {}
      };

      const result = service.extractTeamInformation(playerData);
      
      expect(result.teamType).toBe(TeamType.CARTEIRA_I);
      expect(result.teamId).toBe(FUNIFIER_CONFIG.TEAM_IDS.CARTEIRA_I);
      expect(result.allTeams).toEqual([FUNIFIER_CONFIG.TEAM_IDS.CARTEIRA_I]);
      expect(result.allTeamTypes).toEqual([TeamType.CARTEIRA_I]);
      expect(result.hasMultipleTeams).toBe(false);
      expect(result.hasAdminAccess).toBe(false);
    });

    it('should extract team information for multi-team player', () => {
      const playerData: FunifierPlayerStatus = {
        _id: 'player123',
        name: 'Test Player',
        teams: [FUNIFIER_CONFIG.TEAM_IDS.CARTEIRA_I, FUNIFIER_CONFIG.TEAM_IDS.CARTEIRA_0],
        total_challenges: 5,
        challenges: {},
        total_points: 100,
        point_categories: {},
        total_catalog_items: 3,
        catalog_items: {},
        level_progress: {
          percent_completed: 50,
          next_points: 50,
          total_levels: 10,
          percent: 50
        },
        challenge_progress: [],
        positions: [],
        time: Date.now(),
        extra: {},
        pointCategories: {}
      };

      const result = service.extractTeamInformation(playerData);
      
      expect(result.teamType).toBe(TeamType.CARTEIRA_I);
      expect(result.teamId).toBe(FUNIFIER_CONFIG.TEAM_IDS.CARTEIRA_I);
      expect(result.allTeams).toEqual([FUNIFIER_CONFIG.TEAM_IDS.CARTEIRA_I, FUNIFIER_CONFIG.TEAM_IDS.CARTEIRA_0]);
      expect(result.allTeamTypes).toEqual([TeamType.CARTEIRA_I, TeamType.CARTEIRA_0]);
      expect(result.hasMultipleTeams).toBe(true);
      expect(result.hasAdminAccess).toBe(false);
    });

    it('should extract team information for player with admin access', () => {
      const playerData: FunifierPlayerStatus = {
        _id: 'player123',
        name: 'Test Player',
        teams: [FUNIFIER_CONFIG.TEAM_IDS.CARTEIRA_I, FUNIFIER_CONFIG.TEAM_IDS.ADMIN],
        total_challenges: 5,
        challenges: {},
        total_points: 100,
        point_categories: {},
        total_catalog_items: 3,
        catalog_items: {},
        level_progress: {
          percent_completed: 50,
          next_points: 50,
          total_levels: 10,
          percent: 50
        },
        challenge_progress: [],
        positions: [],
        time: Date.now(),
        extra: {},
        pointCategories: {}
      };

      const result = service.extractTeamInformation(playerData);
      
      expect(result.teamType).toBe(TeamType.CARTEIRA_I);
      expect(result.teamId).toBe(FUNIFIER_CONFIG.TEAM_IDS.CARTEIRA_I);
      expect(result.allTeams).toEqual([FUNIFIER_CONFIG.TEAM_IDS.CARTEIRA_I, FUNIFIER_CONFIG.TEAM_IDS.ADMIN]);
      expect(result.allTeamTypes).toEqual([TeamType.CARTEIRA_I]);
      expect(result.hasMultipleTeams).toBe(true);
      expect(result.hasAdminAccess).toBe(true);
    });

    it('should handle admin-only user', () => {
      const playerData: FunifierPlayerStatus = {
        _id: 'admin123',
        name: 'Test Admin',
        teams: [FUNIFIER_CONFIG.TEAM_IDS.ADMIN],
        total_challenges: 5,
        challenges: {},
        total_points: 100,
        point_categories: {},
        total_catalog_items: 3,
        catalog_items: {},
        level_progress: {
          percent_completed: 50,
          next_points: 50,
          total_levels: 10,
          percent: 50
        },
        challenge_progress: [],
        positions: [],
        time: Date.now(),
        extra: {},
        pointCategories: {}
      };

      const result = service.extractTeamInformation(playerData);
      
      expect(result.teamType).toBeNull();
      expect(result.teamId).toBeNull();
      expect(result.allTeams).toEqual([FUNIFIER_CONFIG.TEAM_IDS.ADMIN]);
      expect(result.allTeamTypes).toEqual([]);
      expect(result.hasMultipleTeams).toBe(false);
      expect(result.hasAdminAccess).toBe(true);
    });

    it('should handle player with no teams', () => {
      const playerData: FunifierPlayerStatus = {
        _id: 'player123',
        name: 'Test Player',
        teams: [],
        total_challenges: 5,
        challenges: {},
        total_points: 100,
        point_categories: {},
        total_catalog_items: 3,
        catalog_items: {},
        level_progress: {
          percent_completed: 50,
          next_points: 50,
          total_levels: 10,
          percent: 50
        },
        challenge_progress: [],
        positions: [],
        time: Date.now(),
        extra: {},
        pointCategories: {}
      };

      const result = service.extractTeamInformation(playerData);
      
      expect(result.teamType).toBeNull();
      expect(result.teamId).toBeNull();
      expect(result.allTeams).toEqual([]);
      expect(result.allTeamTypes).toEqual([]);
      expect(result.hasMultipleTeams).toBe(false);
      expect(result.hasAdminAccess).toBe(false);
    });

    it('should handle player with unknown team', () => {
      const playerData: FunifierPlayerStatus = {
        _id: 'player123',
        name: 'Test Player',
        teams: ['UNKNOWN_TEAM_ID'],
        total_challenges: 5,
        challenges: {},
        total_points: 100,
        point_categories: {},
        total_catalog_items: 3,
        catalog_items: {},
        level_progress: {
          percent_completed: 50,
          next_points: 50,
          total_levels: 10,
          percent: 50
        },
        challenge_progress: [],
        positions: [],
        time: Date.now(),
        extra: {},
        pointCategories: {}
      };

      const result = service.extractTeamInformation(playerData);
      
      expect(result.teamType).toBeNull();
      expect(result.teamId).toBe('UNKNOWN_TEAM_ID');
      expect(result.allTeams).toEqual(['UNKNOWN_TEAM_ID']);
      expect(result.allTeamTypes).toEqual([]);
      expect(result.hasMultipleTeams).toBe(false);
      expect(result.hasAdminAccess).toBe(false);
    });
  });

  describe('validateTeamAssignment', () => {
    it('should validate correct team assignment', () => {
      const playerData: FunifierPlayerStatus = {
        _id: 'player123',
        name: 'Test Player',
        teams: [FUNIFIER_CONFIG.TEAM_IDS.CARTEIRA_I],
        total_challenges: 5,
        challenges: {},
        total_points: 100,
        point_categories: {},
        total_catalog_items: 3,
        catalog_items: {},
        level_progress: {
          percent_completed: 50,
          next_points: 50,
          total_levels: 10,
          percent: 50
        },
        challenge_progress: [],
        positions: [],
        time: Date.now(),
        extra: {},
        pointCategories: {}
      };

      const result = service.validateTeamAssignment(TeamType.CARTEIRA_I, playerData);
      expect(result).toBe(true);
    });

    it('should reject incorrect team assignment', () => {
      const playerData: FunifierPlayerStatus = {
        _id: 'player123',
        name: 'Test Player',
        teams: [FUNIFIER_CONFIG.TEAM_IDS.CARTEIRA_I],
        total_challenges: 5,
        challenges: {},
        total_points: 100,
        point_categories: {},
        total_catalog_items: 3,
        catalog_items: {},
        level_progress: {
          percent_completed: 50,
          next_points: 50,
          total_levels: 10,
          percent: 50
        },
        challenge_progress: [],
        positions: [],
        time: Date.now(),
        extra: {},
        pointCategories: {}
      };

      const result = service.validateTeamAssignment(TeamType.CARTEIRA_II, playerData);
      expect(result).toBe(false);
    });
  });

  describe('getTeamDisplayName', () => {
    it('should return correct display names for all team types', () => {
      expect(service.getTeamDisplayName(TeamType.CARTEIRA_0)).toBe('Carteira 0');
      expect(service.getTeamDisplayName(TeamType.CARTEIRA_I)).toBe('Carteira I');
      expect(service.getTeamDisplayName(TeamType.CARTEIRA_II)).toBe('Carteira II');
      expect(service.getTeamDisplayName(TeamType.CARTEIRA_III)).toBe('Carteira III');
      expect(service.getTeamDisplayName(TeamType.CARTEIRA_IV)).toBe('Carteira IV');
      expect(service.getTeamDisplayName(TeamType.ER)).toBe('ER');
    });
  });

  describe('getAllTeamMappings', () => {
    it('should return all team mappings including new teams', () => {
      const result = service.getAllTeamMappings();
      
      expect(result).toHaveLength(6);
      expect(result).toEqual([
        {
          teamType: TeamType.CARTEIRA_0,
          teamId: FUNIFIER_CONFIG.TEAM_IDS.CARTEIRA_0,
          displayName: 'Carteira 0'
        },
        {
          teamType: TeamType.CARTEIRA_I,
          teamId: FUNIFIER_CONFIG.TEAM_IDS.CARTEIRA_I,
          displayName: 'Carteira I'
        },
        {
          teamType: TeamType.CARTEIRA_II,
          teamId: FUNIFIER_CONFIG.TEAM_IDS.CARTEIRA_II,
          displayName: 'Carteira II'
        },
        {
          teamType: TeamType.CARTEIRA_III,
          teamId: FUNIFIER_CONFIG.TEAM_IDS.CARTEIRA_III,
          displayName: 'Carteira III'
        },
        {
          teamType: TeamType.CARTEIRA_IV,
          teamId: FUNIFIER_CONFIG.TEAM_IDS.CARTEIRA_IV,
          displayName: 'Carteira IV'
        },
        {
          teamType: TeamType.ER,
          teamId: FUNIFIER_CONFIG.TEAM_IDS.ER,
          displayName: 'ER'
        }
      ]);
    });
  });

  describe('identifyUser', () => {
    it('should successfully identify a player user', async () => {
      const mockPlayerData: FunifierPlayerStatus = {
        _id: 'player123',
        name: 'Test Player',
        teams: [FUNIFIER_CONFIG.TEAM_IDS.CARTEIRA_I],
        total_challenges: 5,
        challenges: {},
        total_points: 100,
        point_categories: {},
        total_catalog_items: 3,
        catalog_items: {},
        level_progress: {
          percent_completed: 50,
          next_points: 50,
          total_levels: 10,
          percent: 50
        },
        challenge_progress: [],
        positions: [],
        time: Date.now(),
        extra: {},
        pointCategories: {}
      };

      mockFunifierPlayerService.getPlayerStatus.mockResolvedValue(mockPlayerData);

      const result = await service.identifyUser('testuser');

      expect(result.userId).toBe('player123');
      expect(result.userName).toBe('Test Player');
      expect(result.role.isPlayer).toBe(true);
      expect(result.role.isAdmin).toBe(false);
      expect(result.teamInfo.teamType).toBe(TeamType.CARTEIRA_I);
      expect(result.playerData).toBe(mockPlayerData);
      expect(mockFunifierPlayerService.getPlayerStatus).toHaveBeenCalledWith('testuser');
    });

    it('should successfully identify an admin user', async () => {
      const mockPlayerData: FunifierPlayerStatus = {
        _id: 'admin123',
        name: 'Test Admin',
        teams: [FUNIFIER_CONFIG.TEAM_IDS.CARTEIRA_I],
        total_challenges: 5,
        challenges: {},
        total_points: 100,
        point_categories: {},
        total_catalog_items: 3,
        catalog_items: {},
        level_progress: {
          percent_completed: 50,
          next_points: 50,
          total_levels: 10,
          percent: 50
        },
        challenge_progress: [],
        positions: [],
        time: Date.now(),
        extra: { role: 'admin' },
        pointCategories: {}
      };

      mockFunifierPlayerService.getPlayerStatus.mockResolvedValue(mockPlayerData);

      const result = await service.identifyUser('adminuser');

      expect(result.userId).toBe('admin123');
      expect(result.userName).toBe('Test Admin');
      expect(result.role.isPlayer).toBe(false);
      expect(result.role.isAdmin).toBe(true);
      expect(result.teamInfo.teamType).toBe(TeamType.CARTEIRA_I);
      expect(mockFunifierPlayerService.getPlayerStatus).toHaveBeenCalledWith('adminuser');
    });

    it('should handle player service errors', async () => {
      const mockError = new ApiError({
        type: ErrorType.FUNIFIER_API_ERROR,
        message: 'Player not found',
        timestamp: new Date()
      });

      mockFunifierPlayerService.getPlayerStatus.mockRejectedValue(mockError);

      await expect(service.identifyUser('nonexistent')).rejects.toThrow(mockError);
    });

    it('should handle unknown errors', async () => {
      const mockError = new Error('Unknown error');
      mockFunifierPlayerService.getPlayerStatus.mockRejectedValue(mockError);

      await expect(service.identifyUser('testuser')).rejects.toThrow(ApiError);
    });
  });

  describe('getAvailableTeamsForUser', () => {
    it('should return available teams for single team user', () => {
      const playerData: FunifierPlayerStatus = {
        _id: 'player123',
        name: 'Test Player',
        teams: [FUNIFIER_CONFIG.TEAM_IDS.CARTEIRA_I],
        total_challenges: 5,
        challenges: {},
        total_points: 100,
        point_categories: {},
        total_catalog_items: 3,
        catalog_items: {},
        level_progress: {
          percent_completed: 50,
          next_points: 50,
          total_levels: 10,
          percent: 50
        },
        challenge_progress: [],
        positions: [],
        time: Date.now(),
        extra: {},
        pointCategories: {}
      };

      const result = service.getAvailableTeamsForUser(playerData);
      
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        teamType: TeamType.CARTEIRA_I,
        displayName: 'Carteira I',
        teamId: FUNIFIER_CONFIG.TEAM_IDS.CARTEIRA_I
      });
    });

    it('should return available teams for Carteira 0 user', () => {
      const playerData: FunifierPlayerStatus = {
        _id: 'player123',
        name: 'Test Player',
        teams: [FUNIFIER_CONFIG.TEAM_IDS.CARTEIRA_0],
        total_challenges: 5,
        challenges: {},
        total_points: 100,
        point_categories: {},
        total_catalog_items: 3,
        catalog_items: {},
        level_progress: {
          percent_completed: 50,
          next_points: 50,
          total_levels: 10,
          percent: 50
        },
        challenge_progress: [],
        positions: [],
        time: Date.now(),
        extra: {},
        pointCategories: {}
      };

      const result = service.getAvailableTeamsForUser(playerData);
      
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        teamType: TeamType.CARTEIRA_0,
        displayName: 'Carteira 0',
        teamId: FUNIFIER_CONFIG.TEAM_IDS.CARTEIRA_0
      });
    });

    it('should return available teams for ER user', () => {
      const playerData: FunifierPlayerStatus = {
        _id: 'player123',
        name: 'Test Player',
        teams: [FUNIFIER_CONFIG.TEAM_IDS.ER],
        total_challenges: 5,
        challenges: {},
        total_points: 100,
        point_categories: {},
        total_catalog_items: 3,
        catalog_items: {},
        level_progress: {
          percent_completed: 50,
          next_points: 50,
          total_levels: 10,
          percent: 50
        },
        challenge_progress: [],
        positions: [],
        time: Date.now(),
        extra: {},
        pointCategories: {}
      };

      const result = service.getAvailableTeamsForUser(playerData);
      
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        teamType: TeamType.ER,
        displayName: 'ER',
        teamId: FUNIFIER_CONFIG.TEAM_IDS.ER
      });
    });

    it('should return available teams for user with Carteira 0 and ER', () => {
      const playerData: FunifierPlayerStatus = {
        _id: 'player123',
        name: 'Test Player',
        teams: [FUNIFIER_CONFIG.TEAM_IDS.CARTEIRA_0, FUNIFIER_CONFIG.TEAM_IDS.ER],
        total_challenges: 5,
        challenges: {},
        total_points: 100,
        point_categories: {},
        total_catalog_items: 3,
        catalog_items: {},
        level_progress: {
          percent_completed: 50,
          next_points: 50,
          total_levels: 10,
          percent: 50
        },
        challenge_progress: [],
        positions: [],
        time: Date.now(),
        extra: {},
        pointCategories: {}
      };

      const result = service.getAvailableTeamsForUser(playerData);
      
      expect(result).toHaveLength(2);
      expect(result).toEqual([
        {
          teamType: TeamType.CARTEIRA_0,
          displayName: 'Carteira 0',
          teamId: FUNIFIER_CONFIG.TEAM_IDS.CARTEIRA_0
        },
        {
          teamType: TeamType.ER,
          displayName: 'ER',
          teamId: FUNIFIER_CONFIG.TEAM_IDS.ER
        }
      ]);
    });

    it('should return available teams for multi-team user with admin', () => {
      const playerData: FunifierPlayerStatus = {
        _id: 'player123',
        name: 'Test Player',
        teams: [FUNIFIER_CONFIG.TEAM_IDS.CARTEIRA_I, FUNIFIER_CONFIG.TEAM_IDS.CARTEIRA_0, FUNIFIER_CONFIG.TEAM_IDS.ADMIN],
        total_challenges: 5,
        challenges: {},
        total_points: 100,
        point_categories: {},
        total_catalog_items: 3,
        catalog_items: {},
        level_progress: {
          percent_completed: 50,
          next_points: 50,
          total_levels: 10,
          percent: 50
        },
        challenge_progress: [],
        positions: [],
        time: Date.now(),
        extra: {},
        pointCategories: {}
      };

      const result = service.getAvailableTeamsForUser(playerData);
      
      expect(result).toHaveLength(3);
      expect(result).toEqual([
        {
          teamType: TeamType.CARTEIRA_I,
          displayName: 'Carteira I',
          teamId: FUNIFIER_CONFIG.TEAM_IDS.CARTEIRA_I
        },
        {
          teamType: TeamType.CARTEIRA_0,
          displayName: 'Carteira 0',
          teamId: FUNIFIER_CONFIG.TEAM_IDS.CARTEIRA_0
        },
        {
          teamType: 'ADMIN',
          displayName: 'Administrador',
          teamId: FUNIFIER_CONFIG.TEAM_IDS.ADMIN
        }
      ]);
    });

    it('should return admin only for admin-only user', () => {
      const playerData: FunifierPlayerStatus = {
        _id: 'admin123',
        name: 'Test Admin',
        teams: [FUNIFIER_CONFIG.TEAM_IDS.ADMIN],
        total_challenges: 5,
        challenges: {},
        total_points: 100,
        point_categories: {},
        total_catalog_items: 3,
        catalog_items: {},
        level_progress: {
          percent_completed: 50,
          next_points: 50,
          total_levels: 10,
          percent: 50
        },
        challenge_progress: [],
        positions: [],
        time: Date.now(),
        extra: {},
        pointCategories: {}
      };

      const result = service.getAvailableTeamsForUser(playerData);
      
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        teamType: 'ADMIN',
        displayName: 'Administrador',
        teamId: FUNIFIER_CONFIG.TEAM_IDS.ADMIN
      });
    });
  });

  describe('hasMultipleTeamAssignments', () => {
    it('should return false for single team user', () => {
      const playerData: FunifierPlayerStatus = {
        _id: 'player123',
        name: 'Test Player',
        teams: [FUNIFIER_CONFIG.TEAM_IDS.CARTEIRA_I],
        total_challenges: 5,
        challenges: {},
        total_points: 100,
        point_categories: {},
        total_catalog_items: 3,
        catalog_items: {},
        level_progress: {
          percent_completed: 50,
          next_points: 50,
          total_levels: 10,
          percent: 50
        },
        challenge_progress: [],
        positions: [],
        time: Date.now(),
        extra: {},
        pointCategories: {}
      };

      const result = service.hasMultipleTeamAssignments(playerData);
      expect(result).toBe(false);
    });

    it('should return false for single Carteira 0 user', () => {
      const playerData: FunifierPlayerStatus = {
        _id: 'player123',
        name: 'Test Player',
        teams: [FUNIFIER_CONFIG.TEAM_IDS.CARTEIRA_0],
        total_challenges: 5,
        challenges: {},
        total_points: 100,
        point_categories: {},
        total_catalog_items: 3,
        catalog_items: {},
        level_progress: {
          percent_completed: 50,
          next_points: 50,
          total_levels: 10,
          percent: 50
        },
        challenge_progress: [],
        positions: [],
        time: Date.now(),
        extra: {},
        pointCategories: {}
      };

      const result = service.hasMultipleTeamAssignments(playerData);
      expect(result).toBe(false);
    });

    it('should return false for single ER user', () => {
      const playerData: FunifierPlayerStatus = {
        _id: 'player123',
        name: 'Test Player',
        teams: [FUNIFIER_CONFIG.TEAM_IDS.ER],
        total_challenges: 5,
        challenges: {},
        total_points: 100,
        point_categories: {},
        total_catalog_items: 3,
        catalog_items: {},
        level_progress: {
          percent_completed: 50,
          next_points: 50,
          total_levels: 10,
          percent: 50
        },
        challenge_progress: [],
        positions: [],
        time: Date.now(),
        extra: {},
        pointCategories: {}
      };

      const result = service.hasMultipleTeamAssignments(playerData);
      expect(result).toBe(false);
    });

    it('should return true for multi-team user', () => {
      const playerData: FunifierPlayerStatus = {
        _id: 'player123',
        name: 'Test Player',
        teams: [FUNIFIER_CONFIG.TEAM_IDS.CARTEIRA_I, FUNIFIER_CONFIG.TEAM_IDS.CARTEIRA_0],
        total_challenges: 5,
        challenges: {},
        total_points: 100,
        point_categories: {},
        total_catalog_items: 3,
        catalog_items: {},
        level_progress: {
          percent_completed: 50,
          next_points: 50,
          total_levels: 10,
          percent: 50
        },
        challenge_progress: [],
        positions: [],
        time: Date.now(),
        extra: {},
        pointCategories: {}
      };

      const result = service.hasMultipleTeamAssignments(playerData);
      expect(result).toBe(true);
    });

    it('should return true for user with team and admin access', () => {
      const playerData: FunifierPlayerStatus = {
        _id: 'player123',
        name: 'Test Player',
        teams: [FUNIFIER_CONFIG.TEAM_IDS.CARTEIRA_I, FUNIFIER_CONFIG.TEAM_IDS.ADMIN],
        total_challenges: 5,
        challenges: {},
        total_points: 100,
        point_categories: {},
        total_catalog_items: 3,
        catalog_items: {},
        level_progress: {
          percent_completed: 50,
          next_points: 50,
          total_levels: 10,
          percent: 50
        },
        challenge_progress: [],
        positions: [],
        time: Date.now(),
        extra: {},
        pointCategories: {}
      };

      const result = service.hasMultipleTeamAssignments(playerData);
      expect(result).toBe(true);
    });

    it('should return true for user with Carteira 0 and ER teams', () => {
      const playerData: FunifierPlayerStatus = {
        _id: 'player123',
        name: 'Test Player',
        teams: [FUNIFIER_CONFIG.TEAM_IDS.CARTEIRA_0, FUNIFIER_CONFIG.TEAM_IDS.ER],
        total_challenges: 5,
        challenges: {},
        total_points: 100,
        point_categories: {},
        total_catalog_items: 3,
        catalog_items: {},
        level_progress: {
          percent_completed: 50,
          next_points: 50,
          total_levels: 10,
          percent: 50
        },
        challenge_progress: [],
        positions: [],
        time: Date.now(),
        extra: {},
        pointCategories: {}
      };

      const result = service.hasMultipleTeamAssignments(playerData);
      expect(result).toBe(true);
    });

    it('should return true for ER user with admin access', () => {
      const playerData: FunifierPlayerStatus = {
        _id: 'player123',
        name: 'Test Player',
        teams: [FUNIFIER_CONFIG.TEAM_IDS.ER, FUNIFIER_CONFIG.TEAM_IDS.ADMIN],
        total_challenges: 5,
        challenges: {},
        total_points: 100,
        point_categories: {},
        total_catalog_items: 3,
        catalog_items: {},
        level_progress: {
          percent_completed: 50,
          next_points: 50,
          total_levels: 10,
          percent: 50
        },
        challenge_progress: [],
        positions: [],
        time: Date.now(),
        extra: {},
        pointCategories: {}
      };

      const result = service.hasMultipleTeamAssignments(playerData);
      expect(result).toBe(true);
    });
  });

  describe('getPrimaryTeam', () => {
    it('should return primary team for single team user', () => {
      const playerData: FunifierPlayerStatus = {
        _id: 'player123',
        name: 'Test Player',
        teams: [FUNIFIER_CONFIG.TEAM_IDS.CARTEIRA_I],
        total_challenges: 5,
        challenges: {},
        total_points: 100,
        point_categories: {},
        total_catalog_items: 3,
        catalog_items: {},
        level_progress: {
          percent_completed: 50,
          next_points: 50,
          total_levels: 10,
          percent: 50
        },
        challenge_progress: [],
        positions: [],
        time: Date.now(),
        extra: {},
        pointCategories: {}
      };

      const result = service.getPrimaryTeam(playerData);
      
      expect(result).toEqual({
        teamType: TeamType.CARTEIRA_I,
        teamId: FUNIFIER_CONFIG.TEAM_IDS.CARTEIRA_I
      });
    });

    it('should return admin for admin-only user', () => {
      const playerData: FunifierPlayerStatus = {
        _id: 'admin123',
        name: 'Test Admin',
        teams: [FUNIFIER_CONFIG.TEAM_IDS.ADMIN],
        total_challenges: 5,
        challenges: {},
        total_points: 100,
        point_categories: {},
        total_catalog_items: 3,
        catalog_items: {},
        level_progress: {
          percent_completed: 50,
          next_points: 50,
          total_levels: 10,
          percent: 50
        },
        challenge_progress: [],
        positions: [],
        time: Date.now(),
        extra: {},
        pointCategories: {}
      };

      const result = service.getPrimaryTeam(playerData);
      
      expect(result).toEqual({
        teamType: 'ADMIN',
        teamId: FUNIFIER_CONFIG.TEAM_IDS.ADMIN
      });
    });

    it('should return null for multi-team user', () => {
      const playerData: FunifierPlayerStatus = {
        _id: 'player123',
        name: 'Test Player',
        teams: [FUNIFIER_CONFIG.TEAM_IDS.CARTEIRA_I, FUNIFIER_CONFIG.TEAM_IDS.CARTEIRA_0],
        total_challenges: 5,
        challenges: {},
        total_points: 100,
        point_categories: {},
        total_catalog_items: 3,
        catalog_items: {},
        level_progress: {
          percent_completed: 50,
          next_points: 50,
          total_levels: 10,
          percent: 50
        },
        challenge_progress: [],
        positions: [],
        time: Date.now(),
        extra: {},
        pointCategories: {}
      };

      const result = service.getPrimaryTeam(playerData);
      expect(result).toBeNull();
    });

    it('should return null for user with team and admin access', () => {
      const playerData: FunifierPlayerStatus = {
        _id: 'player123',
        name: 'Test Player',
        teams: [FUNIFIER_CONFIG.TEAM_IDS.CARTEIRA_I, FUNIFIER_CONFIG.TEAM_IDS.ADMIN],
        total_challenges: 5,
        challenges: {},
        total_points: 100,
        point_categories: {},
        total_catalog_items: 3,
        catalog_items: {},
        level_progress: {
          percent_completed: 50,
          next_points: 50,
          total_levels: 10,
          percent: 50
        },
        challenge_progress: [],
        positions: [],
        time: Date.now(),
        extra: {},
        pointCategories: {}
      };

      const result = service.getPrimaryTeam(playerData);
      expect(result).toBeNull();
    });

    it('should return primary team for single Carteira 0 user', () => {
      const playerData: FunifierPlayerStatus = {
        _id: 'player123',
        name: 'Test Player',
        teams: [FUNIFIER_CONFIG.TEAM_IDS.CARTEIRA_0],
        total_challenges: 5,
        challenges: {},
        total_points: 100,
        point_categories: {},
        total_catalog_items: 3,
        catalog_items: {},
        level_progress: {
          percent_completed: 50,
          next_points: 50,
          total_levels: 10,
          percent: 50
        },
        challenge_progress: [],
        positions: [],
        time: Date.now(),
        extra: {},
        pointCategories: {}
      };

      const result = service.getPrimaryTeam(playerData);
      
      expect(result).toEqual({
        teamType: TeamType.CARTEIRA_0,
        teamId: FUNIFIER_CONFIG.TEAM_IDS.CARTEIRA_0
      });
    });

    it('should return primary team for single ER user', () => {
      const playerData: FunifierPlayerStatus = {
        _id: 'player123',
        name: 'Test Player',
        teams: [FUNIFIER_CONFIG.TEAM_IDS.ER],
        total_challenges: 5,
        challenges: {},
        total_points: 100,
        point_categories: {},
        total_catalog_items: 3,
        catalog_items: {},
        level_progress: {
          percent_completed: 50,
          next_points: 50,
          total_levels: 10,
          percent: 50
        },
        challenge_progress: [],
        positions: [],
        time: Date.now(),
        extra: {},
        pointCategories: {}
      };

      const result = service.getPrimaryTeam(playerData);
      
      expect(result).toEqual({
        teamType: TeamType.ER,
        teamId: FUNIFIER_CONFIG.TEAM_IDS.ER
      });
    });
  });
});