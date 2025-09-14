import { userIdentificationService } from '../user-identification.service';
import { funifierPlayerService } from '../funifier-player.service';
import { FunifierPlayerStatus, FUNIFIER_CONFIG } from '../../types';

describe('Admin Detection', () => {
  const mockPlayerData: FunifierPlayerStatus = {
    _id: '123456',
    name: 'Tairã Rabelo',
    total_points: 3985,
    total_challenges: 17,
    total_catalog_items: 4,
    catalog_items: {
      'E6F0O5f': 1,
      'E6K79Mt': 1,
      'E6F0WGc': 1,
      'E6F0MJ3': 1
    },
    teams: ['E6F41Bb', 'E6U1B1p'], // Includes admin team
    level_progress: {
      percent_completed: 100,
      next_points: 0,
      total_levels: 0,
      percent: 100
    },
    challenges: {},
    point_categories: {},
    challenge_progress: [],
    positions: [],
    time: 1757835222625,
    extra: {},
    pointCategories: {}
  };

  const mockRegularPlayerData: FunifierPlayerStatus = {
    ...mockPlayerData,
    teams: ['E6F41Bb'], // Only regular team, no admin team
    name: 'Regular Player'
  };

  describe('userIdentificationService', () => {
    it('should identify admin user correctly', () => {
      const role = userIdentificationService.determineUserRole(mockPlayerData);
      
      expect(role.isAdmin).toBe(true);
      expect(role.isPlayer).toBe(false);
      expect(role.role).toBe('admin');
    });

    it('should identify regular player correctly', () => {
      const role = userIdentificationService.determineUserRole(mockRegularPlayerData);
      
      expect(role.isAdmin).toBe(false);
      expect(role.isPlayer).toBe(true);
      expect(role.role).toBe('player');
    });

    it('should return correct admin team ID', () => {
      const adminTeamId = userIdentificationService.getAdminTeamId();
      expect(adminTeamId).toBe('E6U1B1p');
    });

    it('should check admin status correctly', () => {
      expect(userIdentificationService.isUserAdmin(mockPlayerData)).toBe(true);
      expect(userIdentificationService.isUserAdmin(mockRegularPlayerData)).toBe(false);
    });
  });

  describe('funifierPlayerService', () => {
    it('should detect admin player correctly', () => {
      expect(funifierPlayerService.isPlayerAdmin(mockPlayerData)).toBe(true);
      expect(funifierPlayerService.isPlayerAdmin(mockRegularPlayerData)).toBe(false);
    });

    it('should include admin status in player analysis', () => {
      const analysis = funifierPlayerService.analyzePlayerData(mockPlayerData);
      expect(analysis.isAdmin).toBe(true);

      const regularAnalysis = funifierPlayerService.analyzePlayerData(mockRegularPlayerData);
      expect(regularAnalysis.isAdmin).toBe(false);
    });
  });

  describe('FUNIFIER_CONFIG', () => {
    it('should have admin team ID defined', () => {
      expect(FUNIFIER_CONFIG.TEAM_IDS.ADMIN).toBe('E6U1B1p');
    });

    it('should have all required team IDs', () => {
      expect(FUNIFIER_CONFIG.TEAM_IDS.CARTEIRA_I).toBeDefined();
      expect(FUNIFIER_CONFIG.TEAM_IDS.CARTEIRA_II).toBeDefined();
      expect(FUNIFIER_CONFIG.TEAM_IDS.CARTEIRA_III).toBeDefined();
      expect(FUNIFIER_CONFIG.TEAM_IDS.CARTEIRA_IV).toBeDefined();
      expect(FUNIFIER_CONFIG.TEAM_IDS.ADMIN).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle player with no teams', () => {
      const noTeamsPlayer: FunifierPlayerStatus = {
        ...mockPlayerData,
        teams: []
      };

      expect(userIdentificationService.isUserAdmin(noTeamsPlayer)).toBe(false);
      expect(funifierPlayerService.isPlayerAdmin(noTeamsPlayer)).toBe(false);
    });

    it('should handle player with undefined teams', () => {
      const undefinedTeamsPlayer: FunifierPlayerStatus = {
        ...mockPlayerData,
        teams: undefined as any
      };

      expect(userIdentificationService.isUserAdmin(undefinedTeamsPlayer)).toBe(false);
      expect(funifierPlayerService.isPlayerAdmin(undefinedTeamsPlayer)).toBe(false);
    });

    it('should handle admin role in extra data as fallback', () => {
      const extraAdminPlayer: FunifierPlayerStatus = {
        ...mockRegularPlayerData,
        extra: { role: 'admin' }
      };

      expect(userIdentificationService.isUserAdmin(extraAdminPlayer)).toBe(true);
    });

    it('should handle isAdmin flag in extra data as fallback', () => {
      const flagAdminPlayer: FunifierPlayerStatus = {
        ...mockRegularPlayerData,
        extra: { isAdmin: true }
      };

      expect(userIdentificationService.isUserAdmin(flagAdminPlayer)).toBe(true);
    });
  });
});