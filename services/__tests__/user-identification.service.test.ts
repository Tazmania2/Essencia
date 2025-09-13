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

    it('should return null for unknown team ID', () => {
      const result = service.mapTeamIdToType('UNKNOWN_TEAM_ID');
      expect(result).toBeNull();
    });
  });

  describe('mapTeamTypeToId', () => {
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
    it('should extract team information for Carteira I player', () => {
      const playerData: FunifierPlayerStatus = {
        _id: 'player123',
        name: 'Test Player',
        teams: [FUNIFIER_CONFIG.TEAM_IDS.CARTEIRA_I, 'OTHER_TEAM'],
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
      expect(result.allTeams).toEqual([FUNIFIER_CONFIG.TEAM_IDS.CARTEIRA_I, 'OTHER_TEAM']);
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
      expect(service.getTeamDisplayName(TeamType.CARTEIRA_I)).toBe('Carteira I');
      expect(service.getTeamDisplayName(TeamType.CARTEIRA_II)).toBe('Carteira II');
      expect(service.getTeamDisplayName(TeamType.CARTEIRA_III)).toBe('Carteira III');
      expect(service.getTeamDisplayName(TeamType.CARTEIRA_IV)).toBe('Carteira IV');
    });
  });

  describe('getAllTeamMappings', () => {
    it('should return all team mappings', () => {
      const result = service.getAllTeamMappings();
      
      expect(result).toHaveLength(4);
      expect(result).toEqual([
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
});