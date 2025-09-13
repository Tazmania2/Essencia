import { FunifierPlayerService } from '../../funifier-player.service';
import { funifierAuthService } from '../../funifier-auth.service';
import { FunifierPlayerStatus, TeamType } from '../../../types';
import axios from 'axios';

// Mock axios, auth service, and error handler for integration tests
jest.mock('axios');
jest.mock('../../funifier-auth.service');
jest.mock('../../error-handler.service');
const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedAuthService = funifierAuthService as jest.Mocked<typeof funifierAuthService>;

describe('FunifierPlayerService Integration Tests', () => {
  let playerService: FunifierPlayerService;
  const mockToken = 'mock-access-token-12345';

  beforeEach(() => {
    playerService = FunifierPlayerService.getInstance();
    jest.clearAllMocks();
    
    // Reset all mocks
    mockedAxios.get.mockReset();
    
    // Mock auth service methods
    mockedAuthService.getAccessToken.mockResolvedValue(mockToken);
    mockedAuthService.getAuthHeader.mockReturnValue({
      'Authorization': `Bearer ${mockToken}`
    });
  });

  describe('Player Data Retrieval', () => {
    it('should successfully retrieve player status with complete data', async () => {
      // Mock complete player status response
      const mockPlayerStatus: FunifierPlayerStatus = {
        name: 'João Silva',
        image: {
          small: { url: 'https://example.com/small.jpg', size: 1024, width: 50, height: 50, depth: 24 },
          medium: { url: 'https://example.com/medium.jpg', size: 4096, width: 100, height: 100, depth: 24 },
          original: { url: 'https://example.com/original.jpg', size: 16384, width: 200, height: 200, depth: 24 }
        },
        total_challenges: 5,
        challenges: {
          'challenge_atividade': 85,
          'challenge_reais_por_ativo': 120,
          'challenge_faturamento': 95
        },
        total_points: 1500,
        point_categories: {
          'base_points': 1000,
          'bonus_points': 500
        },
        total_catalog_items: 3,
        catalog_items: {
          'E6F0O5f': 1, // Points unlocked
          'E6F0WGc': 1, // Boost secondary 1
          'E6K79Mt': 0  // Boost secondary 2 not active
        },
        level_progress: {
          percent_completed: 75,
          next_points: 500,
          total_levels: 10,
          percent: 0.75
        },
        challenge_progress: [
          {
            challenge_id: 'challenge_atividade',
            current_value: 85,
            target_value: 100,
            percentage: 85
          }
        ],
        teams: ['team_carteira_i'],
        positions: [],
        time: Date.now(),
        extra: {},
        pointCategories: {
          'base_points': 1000,
          'bonus_points': 500
        },
        _id: 'player_123'
      };

      const mockResponse = {
        data: mockPlayerStatus,
        status: 200
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await playerService.getPlayerStatus('player_123');

      expect(result).toEqual(mockPlayerStatus);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://service2.funifier.com/v3/player_status',
        {
          headers: { 
            Authorization: `Bearer ${mockToken}`,
            'Content-Type': 'application/json',
          },
          params: { id: 'player_123' },
          timeout: 15000,
        }
      );
    });

    it('should handle player not found error', async () => {
      const mockError = {
        response: {
          status: 404,
          data: {
            error: 'player_not_found',
            error_description: 'Player with ID player_999 not found'
          }
        }
      };

      mockedAxios.get.mockRejectedValueOnce(mockError);

      await expect(
        playerService.getPlayerStatus('player_999')
      ).rejects.toThrow();
    });

    it('should handle invalid token error', async () => {
      const mockError = {
        response: {
          status: 401,
          data: {
            error: 'invalid_token',
            error_description: 'The access token is invalid or expired'
          }
        }
      };

      mockedAxios.get.mockRejectedValueOnce(mockError);

      // Mock auth service to return null (invalid token)
      mockedAuthService.getAccessToken.mockResolvedValueOnce(null);

      await expect(
        playerService.getPlayerStatus('player_123')
      ).rejects.toThrow();
    });

    it('should validate and process catalog items correctly', async () => {
      const mockPlayerStatus: FunifierPlayerStatus = {
        name: 'Maria Santos',
        total_challenges: 3,
        challenges: {},
        total_points: 2000,
        point_categories: {},
        total_catalog_items: 2,
        catalog_items: {
          'E6F0O5f': 1, // Points unlocked
          'E6F0WGc': 1, // Boost active
          'E6K79Mt': 1  // Second boost active
        },
        level_progress: {
          percent_completed: 90,
          next_points: 200,
          total_levels: 10,
          percent: 0.9
        },
        challenge_progress: [],
        teams: ['team_carteira_ii'],
        positions: [],
        time: Date.now(),
        extra: {},
        pointCategories: {},
        _id: 'player_456'
      };

      const mockResponse = {
        data: mockPlayerStatus,
        status: 200
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await playerService.getPlayerStatus('player_456');

      // Verify catalog items processing
      const lockStatus = playerService.extractPointsLockStatus(result.catalog_items);
      const boostStatus = playerService.extractBoostStatus(result.catalog_items);

      expect(lockStatus.isUnlocked).toBe(true);
      expect(boostStatus.hasSecondaryBoost1).toBe(true);
      expect(boostStatus.hasSecondaryBoost2).toBe(true);
    });

    it('should handle missing catalog items gracefully', async () => {
      const mockPlayerStatus: FunifierPlayerStatus = {
        name: 'Pedro Costa',
        total_challenges: 2,
        challenges: {},
        total_points: 500,
        point_categories: {},
        total_catalog_items: 0,
        catalog_items: {}, // No catalog items
        level_progress: {
          percent_completed: 25,
          next_points: 1500,
          total_levels: 10,
          percent: 0.25
        },
        challenge_progress: [],
        teams: ['team_carteira_iii'],
        positions: [],
        time: Date.now(),
        extra: {},
        pointCategories: {},
        _id: 'player_789'
      };

      const mockResponse = {
        data: mockPlayerStatus,
        status: 200
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await playerService.getPlayerStatus('player_789');

      // Verify default behavior with missing catalog items
      const lockStatus = playerService.extractPointsLockStatus(result.catalog_items);
      const boostStatus = playerService.extractBoostStatus(result.catalog_items);

      expect(lockStatus.isUnlocked).toBe(false); // Default to locked when no unlock item
      expect(lockStatus.unlockItemCount).toBe(0);
      expect(boostStatus.hasSecondaryBoost1).toBe(false); // Default to no boost when item missing
      expect(boostStatus.hasSecondaryBoost2).toBe(false);
    });
  });

  describe('Team Identification', () => {
    it('should correctly identify team type from teams array', async () => {
      const testCases = [
        { teams: ['team_carteira_i'], expected: TeamType.CARTEIRA_I },
        { teams: ['team_carteira_ii'], expected: TeamType.CARTEIRA_II },
        { teams: ['team_carteira_iii'], expected: TeamType.CARTEIRA_III },
        { teams: ['team_carteira_iv'], expected: TeamType.CARTEIRA_IV }
      ];

      for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i];
        const mockPlayerStatus: FunifierPlayerStatus = {
          name: 'Test Player',
          teams: testCase.teams,
          total_challenges: 1,
          challenges: {},
          total_points: 1000,
          point_categories: {},
          total_catalog_items: 0,
          catalog_items: {},
          level_progress: {
            percent_completed: 50,
            next_points: 1000,
            total_levels: 10,
            percent: 0.5
          },
          challenge_progress: [],
          positions: [],
          time: Date.now(),
          extra: {},
          pointCategories: {},
          _id: `test_player_${i}`
        };

        const mockResponse = {
          data: mockPlayerStatus,
          status: 200
        };

        mockedAxios.get.mockResolvedValueOnce(mockResponse);

        const result = await playerService.getPlayerStatus(`test_player_${i}`);
        const teamInfo = playerService.extractTeamInfo(result);

        expect(teamInfo.teams).toEqual(testCase.teams);
        expect(teamInfo.primaryTeam).toBe(testCase.teams[0]);
      }
    });

    it('should handle unknown team gracefully', async () => {
      const mockPlayerStatus: FunifierPlayerStatus = {
        name: 'Unknown Team Player',
        teams: ['unknown_team'],
        total_challenges: 1,
        challenges: {},
        total_points: 1000,
        point_categories: {},
        total_catalog_items: 0,
        catalog_items: {},
        level_progress: {
          percent_completed: 50,
          next_points: 1000,
          total_levels: 10,
          percent: 0.5
        },
        challenge_progress: [],
        positions: [],
        time: Date.now(),
        extra: {},
        pointCategories: {},
        _id: 'unknown_player'
      };

      const mockResponse = {
        data: mockPlayerStatus,
        status: 200
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await playerService.getPlayerStatus('unknown_player');
      const teamInfo = playerService.extractTeamInfo(result);

      expect(teamInfo.teams).toEqual(['unknown_team']);
      expect(teamInfo.primaryTeam).toBe('unknown_team');
    });
  });

  describe('Data Processing and Validation', () => {
    it('should validate required fields in player status', async () => {
      const incompletePlayerStatus = {
        // Missing required fields like name, _id, etc.
        total_points: 1000
      };

      const mockResponse = {
        data: incompletePlayerStatus,
        status: 200
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      await expect(
        playerService.getPlayerStatus('incomplete_player')
      ).rejects.toThrow();
    });

    it('should handle API timeout errors', async () => {
      const timeoutError = {
        code: 'ECONNABORTED',
        message: 'timeout of 5000ms exceeded'
      };

      mockedAxios.get.mockRejectedValueOnce(timeoutError);

      await expect(
        playerService.getPlayerStatus('player_123')
      ).rejects.toThrow();
    });

    it('should handle server errors gracefully', async () => {
      const serverError = {
        response: {
          status: 500,
          data: {
            error: 'internal_server_error',
            error_description: 'An internal server error occurred'
          }
        }
      };

      mockedAxios.get.mockRejectedValueOnce(serverError);

      await expect(
        playerService.getPlayerStatus('player_123')
      ).rejects.toThrow();
    });
  });

  describe('Data Analysis', () => {
    it('should provide comprehensive player analysis', async () => {
      const mockPlayerStatus: FunifierPlayerStatus = {
        name: 'Analysis Player',
        total_challenges: 3,
        challenges: { 'challenge_1': 85 },
        total_points: 1200,
        point_categories: { 'base': 1000, 'bonus': 200 },
        total_catalog_items: 2,
        catalog_items: { 'E6F0O5f': 1, 'E6F0WGc': 1 },
        level_progress: {
          percent_completed: 60,
          next_points: 800,
          total_levels: 10,
          percent: 0.6
        },
        challenge_progress: [],
        teams: ['team_carteira_i'],
        positions: [],
        time: Date.now(),
        extra: {},
        pointCategories: { 'base': 1000, 'bonus': 200 },
        _id: 'analysis_player'
      };

      const mockResponse = {
        data: mockPlayerStatus,
        status: 200
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await playerService.getPlayerStatus('analysis_player');
      const analysis = playerService.analyzePlayerData(result);

      expect(analysis.playerId).toBe('analysis_player');
      expect(analysis.playerName).toBe('Analysis Player');
      expect(analysis.pointsInfo.totalPoints).toBe(1200);
      expect(analysis.lockStatus.isUnlocked).toBe(true);
      expect(analysis.boostStatus.hasSecondaryBoost1).toBe(true);
      expect(analysis.teamInfo.primaryTeam).toBe('team_carteira_i');
      expect(analysis.challengeInfo.totalChallenges).toBe(3);
      expect(analysis.catalogItemsCount).toBe(2);
      expect(analysis.hasImage).toBe(false);
    });
  });
});