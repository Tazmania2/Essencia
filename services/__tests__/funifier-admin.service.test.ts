import { funifierAdminService } from '../funifier-admin.service';
import { FUNIFIER_CONFIG } from '../../types';

// Mock axios
jest.mock('axios');

describe('FunifierAdminService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllPlayers', () => {
    it('should fetch all players successfully', async () => {
      const mockPlayers = [
        {
          _id: 'player1',
          name: 'Test Player 1',
          email: 'player1@test.com',
          created: Date.now(),
          updated: Date.now()
        },
        {
          _id: 'player2',
          name: 'Test Player 2',
          email: 'player2@test.com',
          created: Date.now(),
          updated: Date.now()
        }
      ];

      const axios = require('axios');
      axios.get.mockResolvedValue({ data: mockPlayers });

      const result = await funifierAdminService.getAllPlayers();

      expect(result).toEqual(mockPlayers);
      expect(axios.get).toHaveBeenCalledWith(
        `${FUNIFIER_CONFIG.BASE_URL}/player`,
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': expect.stringContaining('Basic'),
            'Content-Type': 'application/json'
          }),
          timeout: 15000
        })
      );
    });

    it('should handle empty player list', async () => {
      const axios = require('axios');
      axios.get.mockResolvedValue({ data: null });

      const result = await funifierAdminService.getAllPlayers();

      expect(result).toEqual([]);
    });

    it('should handle API errors', async () => {
      const axios = require('axios');
      axios.get.mockRejectedValue(new Error('API Error'));

      await expect(funifierAdminService.getAllPlayers()).rejects.toThrow();
    });
  });

  describe('getPlayerById', () => {
    it('should fetch player by ID successfully', async () => {
      const mockPlayer = {
        _id: 'player1',
        name: 'Test Player',
        email: 'player@test.com',
        created: Date.now(),
        updated: Date.now()
      };

      const axios = require('axios');
      axios.get.mockResolvedValue({ data: mockPlayer });

      const result = await funifierAdminService.getPlayerById('player1');

      expect(result).toEqual(mockPlayer);
      expect(axios.get).toHaveBeenCalledWith(
        `${FUNIFIER_CONFIG.BASE_URL}/player/player1`,
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': expect.stringContaining('Basic'),
            'Content-Type': 'application/json'
          }),
          timeout: 15000
        })
      );
    });
  });

  describe('getPlayerStatus', () => {
    it('should fetch player status successfully', async () => {
      const mockStatus = {
        _id: 'player1',
        name: 'Test Player',
        total_points: 1000,
        teams: [FUNIFIER_CONFIG.TEAM_IDS.CARTEIRA_I],
        total_challenges: 5
      };

      const axios = require('axios');
      axios.get.mockResolvedValue({ data: mockStatus });

      const result = await funifierAdminService.getPlayerStatus('player1');

      expect(result).toEqual(mockStatus);
      expect(axios.get).toHaveBeenCalledWith(
        `${FUNIFIER_CONFIG.BASE_URL}/player/player1/status`,
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': expect.stringContaining('Basic'),
            'Content-Type': 'application/json'
          }),
          timeout: 15000
        })
      );
    });
  });

  describe('getPlayerTeamInfo', () => {
    it('should extract team information correctly', () => {
      const playerStatus = {
        teams: [FUNIFIER_CONFIG.TEAM_IDS.CARTEIRA_I, FUNIFIER_CONFIG.TEAM_IDS.ADMIN]
      };

      const result = funifierAdminService.getPlayerTeamInfo(playerStatus);

      expect(result).toEqual({
        teams: [FUNIFIER_CONFIG.TEAM_IDS.CARTEIRA_I, FUNIFIER_CONFIG.TEAM_IDS.ADMIN],
        teamNames: ['Carteira I', 'Admin'],
        primaryTeam: FUNIFIER_CONFIG.TEAM_IDS.CARTEIRA_I,
        isAdmin: true
      });
    });

    it('should handle player with no teams', () => {
      const playerStatus = { teams: [] };

      const result = funifierAdminService.getPlayerTeamInfo(playerStatus);

      expect(result).toEqual({
        teams: [],
        teamNames: [],
        primaryTeam: null,
        isAdmin: false
      });
    });

    it('should handle missing teams field', () => {
      const playerStatus = {};

      const result = funifierAdminService.getPlayerTeamInfo(playerStatus);

      expect(result).toEqual({
        teams: [],
        teamNames: [],
        primaryTeam: null,
        isAdmin: false
      });
    });
  });

  describe('getPlayerAdminData', () => {
    it('should fetch comprehensive player data', async () => {
      const mockPlayer = {
        _id: 'player1',
        name: 'Test Player',
        email: 'player@test.com',
        created: Date.now(),
        updated: Date.now()
      };

      const mockStatus = {
        _id: 'player1',
        name: 'Test Player',
        total_points: 1000,
        point_categories: { primary: 500, secondary: 500 },
        teams: [FUNIFIER_CONFIG.TEAM_IDS.CARTEIRA_I],
        total_challenges: 5
      };

      const axios = require('axios');
      axios.get
        .mockResolvedValueOnce({ data: mockPlayer })
        .mockResolvedValueOnce({ data: mockStatus });

      const result = await funifierAdminService.getPlayerAdminData('player1');

      expect(result).toEqual({
        basicInfo: mockPlayer,
        status: mockStatus,
        teamInfo: {
          teams: [FUNIFIER_CONFIG.TEAM_IDS.CARTEIRA_I],
          teamNames: ['Carteira I'],
          primaryTeam: FUNIFIER_CONFIG.TEAM_IDS.CARTEIRA_I,
          isAdmin: false
        },
        points: {
          total: 1000,
          categories: { primary: 500, secondary: 500 }
        },
        activity: {
          lastUpdated: new Date(mockPlayer.updated),
          totalChallenges: 5
        }
      });
    });
  });
});