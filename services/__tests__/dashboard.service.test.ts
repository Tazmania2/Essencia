import { DashboardService } from '../dashboard.service';
import { FunifierPlayerService } from '../funifier-player.service';
import { FunifierDatabaseService } from '../funifier-database.service';
import { TeamProcessorFactory } from '../team-processor-factory.service';
import { UserIdentificationService } from '../user-identification.service';
import { TeamType, FunifierPlayerStatus, EssenciaReportRecord, PlayerMetrics } from '../../types';

// Mock all dependencies
jest.mock('../funifier-player.service');
jest.mock('../funifier-database.service');
jest.mock('../team-processor-factory.service');
jest.mock('../user-identification.service');

describe('DashboardService', () => {
  let dashboardService: DashboardService;
  let mockPlayerService: jest.Mocked<FunifierPlayerService>;
  let mockDatabaseService: jest.Mocked<FunifierDatabaseService>;
  let mockTeamProcessorFactory: jest.Mocked<TeamProcessorFactory>;
  let mockUserIdentificationService: jest.Mocked<UserIdentificationService>;
  let mockTeamProcessor: any;

  const mockPlayerStatus: FunifierPlayerStatus = {
    name: 'Test Player',
    total_points: 2500,
    catalog_items: {
      'E6F0O5f': 1, // Unlock points
      'E6F0WGc': 1, // Boost 1
      'E6K79Mt': 0  // Boost 2
    },
    teams: ['E6F4sCh'],
    challenges: {},
    point_categories: {},
    total_catalog_items: 3,
    level_progress: {
      percent_completed: 50,
      next_points: 500,
      total_levels: 10,
      percent: 50
    },
    challenge_progress: [],
    positions: [],
    time: Date.now(),
    extra: {},
    pointCategories: {},
    _id: 'player123',
    total_challenges: 0
  };

  const mockReportData: EssenciaReportRecord = {
    _id: 'report123',
    playerId: 'player123',
    playerName: 'Test Player',
    team: TeamType.CARTEIRA_I,
    atividade: 75,
    reaisPorAtivo: 60,
    faturamento: 80,
    currentCycleDay: 15,
    totalCycleDays: 30,
    reportDate: '2024-01-15',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z'
  };

  const mockPlayerMetrics: PlayerMetrics = {
    playerName: 'Test Player',
    totalPoints: 2500,
    pointsLocked: false,
    currentCycleDay: 15,
    daysUntilCycleEnd: 15,
    primaryGoal: {
      name: 'Atividade',
      percentage: 75,
      boostActive: false,
      details: {}
    },
    secondaryGoal1: {
      name: 'Reais por Ativo',
      percentage: 60,
      boostActive: true,
      details: {}
    },
    secondaryGoal2: {
      name: 'Faturamento',
      percentage: 80,
      boostActive: false,
      details: {}
    }
  };

  beforeEach(() => {
    // Create mocked instances with proper method mocking
    mockPlayerService = {
      getPlayerStatus: jest.fn()
    } as any;
    
    mockDatabaseService = {
      aggregateCollectionData: jest.fn()
    } as any;
    
    mockTeamProcessorFactory = {
      getProcessor: jest.fn()
    } as any;
    
    mockUserIdentificationService = {
      identifyTeam: jest.fn()
    } as any;

    // Mock team processor
    mockTeamProcessor = {
      processPlayerData: jest.fn().mockReturnValue(mockPlayerMetrics)
    };

    // Setup mocks
    mockPlayerService.getPlayerStatus.mockResolvedValue(mockPlayerStatus);
    mockDatabaseService.aggregateCollectionData.mockResolvedValue([mockReportData]);
    mockTeamProcessorFactory.getProcessor.mockReturnValue(mockTeamProcessor);
    mockUserIdentificationService.identifyTeam.mockReturnValue(TeamType.CARTEIRA_I);

    dashboardService = new DashboardService(
      mockPlayerService,
      mockDatabaseService,
      mockTeamProcessorFactory,
      mockUserIdentificationService
    );
  });

  describe('getDashboardData', () => {
    it('should return dashboard data successfully', async () => {
      const result = await dashboardService.getDashboardData('player123', 'token123');

      expect(result).toEqual({
        playerName: 'Test Player',
        totalPoints: 2500,
        pointsLocked: false,
        currentCycleDay: 15,
        totalCycleDays: 30,
        isDataFromCollection: true,
        primaryGoal: {
          name: 'Atividade',
          percentage: 75,
          description: 'Quase lá! 75% concluído - Faltam apenas 25%',
          emoji: '🎯'
        },
        secondaryGoal1: {
          name: 'Reais por Ativo',
          percentage: 60,
          description: 'Bom progresso! 60% concluído - Continue assim!',
          emoji: '💰',
          hasBoost: true,
          isBoostActive: true
        },
        secondaryGoal2: {
          name: 'Faturamento',
          percentage: 80,
          description: 'Quase lá! 80% concluído - Faltam apenas 20%',
          emoji: '📈',
          hasBoost: true,
          isBoostActive: false
        }
      });

      expect(mockPlayerService.getPlayerStatus).toHaveBeenCalledWith('player123', 'token123');
      expect(mockUserIdentificationService.identifyTeam).toHaveBeenCalledWith(mockPlayerStatus);
      expect(mockTeamProcessorFactory.getProcessor).toHaveBeenCalledWith(TeamType.CARTEIRA_I);
      expect(mockTeamProcessor.processPlayerData).toHaveBeenCalledWith(mockPlayerStatus, mockReportData);
    });

    it('should handle missing report data gracefully', async () => {
      mockDatabaseService.aggregateCollectionData.mockResolvedValue([]);

      const result = await dashboardService.getDashboardData('player123', 'token123');

      expect(result).toBeDefined();
      expect(result.isDataFromCollection).toBe(false);
      expect(result.totalCycleDays).toBe(21); // Should use default
      expect(mockTeamProcessor.processPlayerData).toHaveBeenCalledWith(mockPlayerStatus, undefined);
    });

    it('should handle database errors gracefully', async () => {
      mockDatabaseService.aggregateCollectionData.mockRejectedValue(new Error('Database error'));

      const result = await dashboardService.getDashboardData('player123', 'token123');

      expect(result).toBeDefined();
      expect(mockTeamProcessor.processPlayerData).toHaveBeenCalledWith(mockPlayerStatus, undefined);
    });

    it('should propagate player service errors', async () => {
      mockPlayerService.getPlayerStatus.mockRejectedValue(new Error('Player service error'));

      await expect(dashboardService.getDashboardData('player123', 'token123'))
        .rejects.toThrow('Player service error');
    });
  });

  describe('isPointsUnlocked', () => {
    it('should return true when unlock item is present', () => {
      const catalogItems = { 'E6F0O5f': 1 };
      expect(DashboardService.isPointsUnlocked(catalogItems)).toBe(true);
    });

    it('should return false when unlock item is not present', () => {
      const catalogItems = { 'E6F0O5f': 0 };
      expect(DashboardService.isPointsUnlocked(catalogItems)).toBe(false);
    });

    it('should return false when unlock item is missing', () => {
      const catalogItems = {};
      expect(DashboardService.isPointsUnlocked(catalogItems)).toBe(false);
    });
  });

  describe('getBoostStatus', () => {
    it('should return correct boost status', () => {
      const catalogItems = {
        'E6F0WGc': 1, // Boost 1 active
        'E6K79Mt': 0  // Boost 2 inactive
      };

      const result = DashboardService.getBoostStatus(catalogItems);

      expect(result).toEqual({
        boost1Active: true,
        boost2Active: false
      });
    });

    it('should handle missing boost items', () => {
      const catalogItems = {};

      const result = DashboardService.getBoostStatus(catalogItems);

      expect(result).toEqual({
        boost1Active: false,
        boost2Active: false
      });
    });
  });

  describe('goal descriptions', () => {
    it('should generate appropriate descriptions for different percentages', async () => {
      // Test different percentage ranges
      const testCases = [
        { percentage: 120, expected: 'Meta atingida! 120% concluído - Parabéns! 🎉' },
        { percentage: 85, expected: 'Quase lá! 85% concluído - Faltam apenas 15%' },
        { percentage: 65, expected: 'Bom progresso! 65% concluído - Continue assim!' },
        { percentage: 35, expected: '35% concluído - Vamos acelerar o ritmo!' },
        { percentage: 15, expected: '15% concluído - Vamos começar forte!' }
      ];

      for (const testCase of testCases) {
        const modifiedMetrics = {
          ...mockPlayerMetrics,
          primaryGoal: {
            ...mockPlayerMetrics.primaryGoal,
            percentage: testCase.percentage
          }
        };

        mockTeamProcessor.processPlayerData.mockReturnValue(modifiedMetrics);

        const result = await dashboardService.getDashboardData('player123', 'token123');
        expect(result.primaryGoal.description).toBe(testCase.expected);
      }
    });
  });
});