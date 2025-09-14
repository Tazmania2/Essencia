import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { DebugDashboard } from '../DebugDashboard';
import { FunifierPlayerService } from '../../../services/funifier-player.service';
import { DashboardService } from '../../../services/dashboard.service';

// Mock the services
jest.mock('../../../services/funifier-player.service');
jest.mock('../../../services/dashboard.service');

// Mock the PlayerDashboard component
jest.mock('../PlayerDashboard', () => ({
  PlayerDashboard: ({ playerName, totalPoints }: any) => (
    <div data-testid="player-dashboard">
      <span data-testid="player-name">{playerName}</span>
      <span data-testid="total-points">{totalPoints}</span>
    </div>
  )
}));

describe('DebugDashboard', () => {
  const mockPlayerData = {
    name: 'Tairã Rabelo',
    total_points: 1415,
    catalog_items: {
      'E6F0O5f': 1, // Points unlocked
      'E6F0WGc': 0, // Boost 1 inactive
      'E6K79Mt': 0  // Boost 2 inactive
    },
    challenge_progress: [
      {
        challenge: 'E6FQIjs', // Atividade
        percent_completed: 2
      },
      {
        challenge: 'E6Gm8RI', // Reais por Ativo
        percent_completed: 1
      },
      {
        challenge: 'E6GglPq', // Faturamento
        percent_completed: 1
      }
    ],
    teams: ['E6F4sCh'], // Carteira I
    _id: '123456'
  };

  const mockDashboardData = {
    playerName: 'Tairã Rabelo',
    totalPoints: 1415,
    pointsLocked: false,
    currentCycleDay: 15,
    totalCycleDays: 21,
    isDataFromCollection: false,
    primaryGoal: {
      name: 'Atividade',
      percentage: 2,
      description: '2% concluído - Vamos começar forte!',
      emoji: '🎯'
    },
    secondaryGoal1: {
      name: 'Reais por Ativo',
      percentage: 1,
      description: '1% concluído - Vamos começar forte!',
      emoji: '💰',
      hasBoost: true,
      isBoostActive: false
    },
    secondaryGoal2: {
      name: 'Faturamento',
      percentage: 1,
      description: '1% concluído - Vamos começar forte!',
      emoji: '📈',
      hasBoost: true,
      isBoostActive: false
    }
  };

  beforeEach(() => {
    // Mock FunifierPlayerService
    (FunifierPlayerService as jest.MockedClass<typeof FunifierPlayerService>).mockImplementation(() => ({
      getPlayerStatus: jest.fn().mockResolvedValue(mockPlayerData)
    } as any));

    // Mock DashboardService static method
    (DashboardService.extractDirectDashboardData as jest.MockedFunction<typeof DashboardService.extractDirectDashboardData>)
      .mockReturnValue(mockDashboardData);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    render(<DebugDashboard playerId="123456" token="test-token" />);
    
    expect(screen.getByText('Carregando dados do Funifier...')).toBeInTheDocument();
  });

  it('renders dashboard with extracted data', async () => {
    render(<DebugDashboard playerId="123456" token="test-token" />);
    
    await waitFor(() => {
      expect(screen.getByTestId('player-dashboard')).toBeInTheDocument();
    });

    expect(screen.getByTestId('player-name')).toHaveTextContent('Tairã Rabelo');
    expect(screen.getByTestId('total-points')).toHaveTextContent('1415');
  });

  it('shows debug info in development mode', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    render(<DebugDashboard playerId="123456" token="test-token" />);
    
    await waitFor(() => {
      expect(screen.getByText('🐛 Debug Info (Click to expand)')).toBeInTheDocument();
    });

    process.env.NODE_ENV = originalEnv;
  });

  it('handles API errors gracefully', async () => {
    const mockError = new Error('API Error');
    (FunifierPlayerService as jest.MockedClass<typeof FunifierPlayerService>).mockImplementation(() => ({
      getPlayerStatus: jest.fn().mockRejectedValue(mockError)
    } as any));

    render(<DebugDashboard playerId="123456" token="test-token" />);
    
    await waitFor(() => {
      expect(screen.getByText('Erro ao carregar dados')).toBeInTheDocument();
      expect(screen.getByText('API Error')).toBeInTheDocument();
    });
  });

  it('calls FunifierPlayerService with correct parameters', async () => {
    const mockGetPlayerStatus = jest.fn().mockResolvedValue(mockPlayerData);
    (FunifierPlayerService as jest.MockedClass<typeof FunifierPlayerService>).mockImplementation(() => ({
      getPlayerStatus: mockGetPlayerStatus
    } as any));

    render(<DebugDashboard playerId="123456" token="test-token" />);
    
    await waitFor(() => {
      expect(mockGetPlayerStatus).toHaveBeenCalledWith('123456', 'test-token');
    });
  });

  it('calls DashboardService.extractDirectDashboardData with player data', async () => {
    render(<DebugDashboard playerId="123456" token="test-token" />);
    
    await waitFor(() => {
      expect(DashboardService.extractDirectDashboardData).toHaveBeenCalledWith(mockPlayerData);
    });
  });

  it('does not render debug info in production mode', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    render(<DebugDashboard playerId="123456" token="test-token" />);
    
    await waitFor(() => {
      expect(screen.getByTestId('player-dashboard')).toBeInTheDocument();
    });

    expect(screen.queryByText('🐛 Debug Info (Click to expand)')).not.toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });
});