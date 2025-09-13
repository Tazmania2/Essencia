import axios from 'axios';
import { FunifierPlayerService, funifierPlayerService } from '../funifier-player.service';
import { funifierAuthService } from '../funifier-auth.service';
import { ErrorType, FUNIFIER_CONFIG, FunifierPlayerStatus } from '../../types';

// Mock axios and auth service
jest.mock('axios');
jest.mock('../funifier-auth.service');

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedAuthService = funifierAuthService as jest.Mocked<typeof funifierAuthService>;

describe('FunifierPlayerService', () => {
  let playerService: FunifierPlayerService;

  const mockPlayerData: FunifierPlayerStatus = {
    _id: 'player123',
    name: 'Test Player',
    image: {
      small: { url: 'small.jpg', size: 100, width: 50, height: 50, depth: 24 },
      medium: { url: 'medium.jpg', size: 400, width: 100, height: 100, depth: 24 },
      original: { url: 'original.jpg', size: 1600, width: 200, height: 200, depth: 24 }
    },
    total_challenges: 5,
    challenges: { 'challenge1': 10, 'challenge2': 20 },
    total_points: 1500,
    point_categories: { 'category1': 500, 'category2': 1000 },
    total_catalog_items: 3,
    catalog_items: {
      [FUNIFIER_CONFIG.CATALOG_ITEMS.UNLOCK_POINTS]: 1,
      [FUNIFIER_CONFIG.CATALOG_ITEMS.BOOST_SECONDARY_1]: 2,
      [FUNIFIER_CONFIG.CATALOG_ITEMS.BOOST_SECONDARY_2]: 0
    },
    level_progress: {
      percent_completed: 75,
      next_points: 500,
      total_levels: 10,
      percent: 75
    },
    challenge_progress: [{ id: 'challenge1', progress: 50 }],
    teams: ['team1', 'team2'],
    positions: [],
    time: Date.now(),
    extra: {},
    pointCategories: { 'category1': 500, 'category2': 1000 }
  };

  beforeEach(() => {
    playerService = FunifierPlayerService.getInstance();
    jest.clearAllMocks();
    
    // Mock auth service default behavior
    mockedAuthService.getAccessToken.mockResolvedValue('mock_token');
    mockedAuthService.getAuthHeader.mockReturnValue({
      'Authorization': 'Bearer mock_token'
    });
  });

  describe('getPlayerStatus', () => {
    it('should retrieve player status successfully', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: mockPlayerData });

      const result = await playerService.getPlayerStatus('player123');

      expect(result).toEqual(mockPlayerData);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        `${FUNIFIER_CONFIG.BASE_URL}/player_status`,
        {
          headers: {
            'Authorization': 'Bearer mock_token',
            'Content-Type': 'application/json',
          },
          params: { id: 'player123' },
          timeout: 15000,
        }
      );
    });

    it('should throw error when no authentication token available', async () => {
      mockedAuthService.getAccessToken.mockResolvedValueOnce(null);

      await expect(playerService.getPlayerStatus('player123')).rejects.toMatchObject({
        type: ErrorType.AUTHENTICATION_ERROR,
        message: 'No valid authentication token available'
      });
    });

    it('should handle 404 player not found error', async () => {
      const mockError = {
        isAxiosError: true,
        response: {
          status: 404,
          data: { error: 'Player not found' }
        }
      };
      mockedAxios.get.mockRejectedValueOnce(mockError);
      mockedAxios.isAxiosError.mockReturnValue(true);

      await expect(playerService.getPlayerStatus('nonexistent')).rejects.toMatchObject({
        type: ErrorType.FUNIFIER_API_ERROR,
        message: 'Player not found'
      });
    });

    it('should handle network timeout error', async () => {
      const mockError = {
        isAxiosError: true,
        code: 'ECONNABORTED',
        message: 'timeout of 15000ms exceeded'
      };
      mockedAxios.get.mockRejectedValueOnce(mockError);
      mockedAxios.isAxiosError.mockReturnValue(true);

      await expect(playerService.getPlayerStatus('player123')).rejects.toMatchObject({
        type: ErrorType.NETWORK_ERROR,
        message: 'Player data request timed out'
      });
    });

    it('should validate response structure and throw error for missing required fields', async () => {
      const invalidData = { name: 'Test Player' }; // missing _id
      mockedAxios.get.mockResolvedValueOnce({ data: invalidData });

      await expect(playerService.getPlayerStatus('player123')).rejects.toMatchObject({
        type: ErrorType.DATA_PROCESSING_ERROR,
        message: 'Missing required field: _id'
      });
    });

    it('should validate catalog_items structure', async () => {
      const invalidData = {
        _id: 'player123',
        name: 'Test Player',
        catalog_items: 'invalid_structure' // should be object
      };
      mockedAxios.get.mockResolvedValueOnce({ data: invalidData });

      await expect(playerService.getPlayerStatus('player123')).rejects.toMatchObject({
        type: ErrorType.DATA_PROCESSING_ERROR,
        message: 'Invalid catalog_items structure - expected object'
      });
    });

    it('should validate teams structure', async () => {
      const invalidData = {
        _id: 'player123',
        name: 'Test Player',
        teams: 'invalid_structure' // should be array
      };
      mockedAxios.get.mockResolvedValueOnce({ data: invalidData });

      await expect(playerService.getPlayerStatus('player123')).rejects.toMatchObject({
        type: ErrorType.DATA_PROCESSING_ERROR,
        message: 'Invalid teams structure - expected array'
      });
    });
  });

  describe('extractPointsLockStatus', () => {
    it('should correctly identify unlocked points', () => {
      const catalogItems = {
        [FUNIFIER_CONFIG.CATALOG_ITEMS.UNLOCK_POINTS]: 1,
        [FUNIFIER_CONFIG.CATALOG_ITEMS.LOCK_POINTS]: 0
      };

      const result = playerService.extractPointsLockStatus(catalogItems);

      expect(result).toEqual({
        isUnlocked: true,
        unlockItemCount: 1,
        lockItemCount: 0
      });
    });

    it('should correctly identify locked points', () => {
      const catalogItems = {
        [FUNIFIER_CONFIG.CATALOG_ITEMS.UNLOCK_POINTS]: 0,
        [FUNIFIER_CONFIG.CATALOG_ITEMS.LOCK_POINTS]: 1
      };

      const result = playerService.extractPointsLockStatus(catalogItems);

      expect(result).toEqual({
        isUnlocked: false,
        unlockItemCount: 0,
        lockItemCount: 1
      });
    });

    it('should handle missing catalog items', () => {
      const catalogItems = {};

      const result = playerService.extractPointsLockStatus(catalogItems);

      expect(result).toEqual({
        isUnlocked: false,
        unlockItemCount: 0,
        lockItemCount: 0
      });
    });
  });

  describe('extractBoostStatus', () => {
    it('should correctly identify active boosts', () => {
      const catalogItems = {
        [FUNIFIER_CONFIG.CATALOG_ITEMS.BOOST_SECONDARY_1]: 2,
        [FUNIFIER_CONFIG.CATALOG_ITEMS.BOOST_SECONDARY_2]: 1
      };

      const result = playerService.extractBoostStatus(catalogItems);

      expect(result).toEqual({
        hasSecondaryBoost1: true,
        hasSecondaryBoost2: true,
        boost1Count: 2,
        boost2Count: 1,
        totalActiveBoosts: 2
      });
    });

    it('should correctly identify no active boosts', () => {
      const catalogItems = {
        [FUNIFIER_CONFIG.CATALOG_ITEMS.BOOST_SECONDARY_1]: 0,
        [FUNIFIER_CONFIG.CATALOG_ITEMS.BOOST_SECONDARY_2]: 0
      };

      const result = playerService.extractBoostStatus(catalogItems);

      expect(result).toEqual({
        hasSecondaryBoost1: false,
        hasSecondaryBoost2: false,
        boost1Count: 0,
        boost2Count: 0,
        totalActiveBoosts: 0
      });
    });

    it('should handle partial boost activation', () => {
      const catalogItems = {
        [FUNIFIER_CONFIG.CATALOG_ITEMS.BOOST_SECONDARY_1]: 3,
        [FUNIFIER_CONFIG.CATALOG_ITEMS.BOOST_SECONDARY_2]: 0
      };

      const result = playerService.extractBoostStatus(catalogItems);

      expect(result).toEqual({
        hasSecondaryBoost1: true,
        hasSecondaryBoost2: false,
        boost1Count: 3,
        boost2Count: 0,
        totalActiveBoosts: 1
      });
    });

    it('should handle missing boost items', () => {
      const catalogItems = {};

      const result = playerService.extractBoostStatus(catalogItems);

      expect(result).toEqual({
        hasSecondaryBoost1: false,
        hasSecondaryBoost2: false,
        boost1Count: 0,
        boost2Count: 0,
        totalActiveBoosts: 0
      });
    });
  });

  describe('extractTeamInfo', () => {
    it('should extract team information correctly', () => {
      const playerData = {
        ...mockPlayerData,
        teams: ['team1', 'team2', 'team3']
      };

      const result = playerService.extractTeamInfo(playerData);

      expect(result).toEqual({
        teams: ['team1', 'team2', 'team3'],
        primaryTeam: 'team1'
      });
    });

    it('should handle empty teams array', () => {
      const playerData = {
        ...mockPlayerData,
        teams: []
      };

      const result = playerService.extractTeamInfo(playerData);

      expect(result).toEqual({
        teams: [],
        primaryTeam: null
      });
    });

    it('should handle missing teams field', () => {
      const playerData = {
        ...mockPlayerData,
        teams: undefined as any
      };

      const result = playerService.extractTeamInfo(playerData);

      expect(result).toEqual({
        teams: [],
        primaryTeam: null
      });
    });
  });

  describe('extractChallengeProgress', () => {
    it('should extract challenge progress correctly', () => {
      const result = playerService.extractChallengeProgress(mockPlayerData);

      expect(result).toEqual({
        totalChallenges: 5,
        challengeData: { 'challenge1': 10, 'challenge2': 20 },
        challengeProgress: [{ id: 'challenge1', progress: 50 }]
      });
    });

    it('should handle missing challenge data', () => {
      const playerData = {
        ...mockPlayerData,
        total_challenges: undefined as any,
        challenges: undefined as any,
        challenge_progress: undefined as any
      };

      const result = playerService.extractChallengeProgress(playerData);

      expect(result).toEqual({
        totalChallenges: 0,
        challengeData: {},
        challengeProgress: []
      });
    });
  });

  describe('extractPointsInfo', () => {
    it('should extract points information correctly', () => {
      const result = playerService.extractPointsInfo(mockPlayerData);

      expect(result).toEqual({
        totalPoints: 1500,
        pointCategories: { 'category1': 500, 'category2': 1000 },
        levelProgress: {
          percentCompleted: 75,
          nextPoints: 500,
          totalLevels: 10,
          percent: 75
        }
      });
    });

    it('should handle missing points data', () => {
      const playerData = {
        ...mockPlayerData,
        total_points: undefined as any,
        point_categories: undefined as any,
        level_progress: undefined as any
      };

      const result = playerService.extractPointsInfo(playerData);

      expect(result).toEqual({
        totalPoints: 0,
        pointCategories: {},
        levelProgress: {
          percentCompleted: 0,
          nextPoints: 0,
          totalLevels: 0,
          percent: 0
        }
      });
    });
  });

  describe('analyzePlayerData', () => {
    it('should provide comprehensive player analysis', () => {
      const result = playerService.analyzePlayerData(mockPlayerData);

      expect(result).toEqual({
        playerId: 'player123',
        playerName: 'Test Player',
        pointsInfo: {
          totalPoints: 1500,
          pointCategories: { 'category1': 500, 'category2': 1000 },
          levelProgress: {
            percentCompleted: 75,
            nextPoints: 500,
            totalLevels: 10,
            percent: 75
          }
        },
        lockStatus: {
          isUnlocked: true,
          unlockItemCount: 1,
          lockItemCount: 0
        },
        boostStatus: {
          hasSecondaryBoost1: true,
          hasSecondaryBoost2: false,
          boost1Count: 2,
          boost2Count: 0,
          totalActiveBoosts: 1
        },
        teamInfo: {
          teams: ['team1', 'team2'],
          primaryTeam: 'team1'
        },
        challengeInfo: {
          totalChallenges: 5,
          challengeData: { 'challenge1': 10, 'challenge2': 20 },
          challengeProgress: [{ id: 'challenge1', progress: 50 }]
        },
        catalogItemsCount: 3,
        hasImage: true
      });
    });

    it('should handle player without image', () => {
      const playerDataNoImage = {
        ...mockPlayerData,
        image: undefined
      };

      const result = playerService.analyzePlayerData(playerDataNoImage);

      expect(result.hasImage).toBe(false);
    });
  });

  describe('singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = FunifierPlayerService.getInstance();
      const instance2 = FunifierPlayerService.getInstance();
      
      expect(instance1).toBe(instance2);
      expect(instance1).toBe(funifierPlayerService);
    });
  });

  describe('error handling', () => {
    it('should handle 401 authentication error', async () => {
      const mockError = {
        isAxiosError: true,
        response: {
          status: 401,
          data: { error: 'Token expired' }
        }
      };
      mockedAxios.get.mockRejectedValueOnce(mockError);
      mockedAxios.isAxiosError.mockReturnValue(true);

      await expect(playerService.getPlayerStatus('player123')).rejects.toMatchObject({
        type: ErrorType.AUTHENTICATION_ERROR,
        message: 'Authentication failed while fetching player data'
      });
    });

    it('should handle 500 server error', async () => {
      const mockError = {
        isAxiosError: true,
        response: {
          status: 500,
          data: { error: 'Internal server error' }
        }
      };
      mockedAxios.get.mockRejectedValueOnce(mockError);
      mockedAxios.isAxiosError.mockReturnValue(true);

      await expect(playerService.getPlayerStatus('player123')).rejects.toMatchObject({
        type: ErrorType.FUNIFIER_API_ERROR,
        message: 'Funifier server error'
      });
    });

    it('should handle network error without response', async () => {
      const mockError = {
        isAxiosError: true,
        request: {},
        message: 'Network Error'
      };
      mockedAxios.get.mockRejectedValueOnce(mockError);
      mockedAxios.isAxiosError.mockReturnValue(true);

      await expect(playerService.getPlayerStatus('player123')).rejects.toMatchObject({
        type: ErrorType.NETWORK_ERROR,
        message: 'Network error while fetching player data'
      });
    });
  });
});