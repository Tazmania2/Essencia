import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PlayerSelector } from '../PlayerSelector';
import { funifierPlayerService } from '../../../services/funifier-player.service';
import { funifierDatabaseService } from '../../../services/funifier-database.service';
import { TeamType } from '../../../types';

// Mock the services
jest.mock('../../../services/funifier-player.service', () => ({
  funifierPlayerService: {
    getPlayerStatus: jest.fn(),
    extractPointsLockStatus: jest.fn(),
    extractBoostStatus: jest.fn(),
  }
}));

jest.mock('../../../services/funifier-database.service', () => ({
  funifierDatabaseService: {
    getCollectionData: jest.fn(),
  }
}));

const mockFunifierPlayerService = funifierPlayerService as jest.Mocked<typeof funifierPlayerService>;
const mockFunifierDatabaseService = funifierDatabaseService as jest.Mocked<typeof funifierDatabaseService>;

// Mock data
const mockReportData = [
  {
    _id: 'player1_2024-01-01',
    playerId: 'player1',
    playerName: 'João Silva',
    team: TeamType.CARTEIRA_I,
    atividade: 85,
    reaisPorAtivo: 120,
    faturamento: 95,
    reportDate: '2024-01-01',
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-01T10:00:00Z'
  },
  {
    _id: 'player2_2024-01-01',
    playerId: 'player2',
    playerName: 'Maria Santos',
    team: TeamType.CARTEIRA_II,
    atividade: 75,
    reaisPorAtivo: 110,
    multimarcasPorAtivo: 80,
    reportDate: '2024-01-01',
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-01T10:00:00Z'
  }
];

const mockPlayerStatus = {
  _id: 'player1',
  name: 'João Silva',
  total_points: 1500,
  total_challenges: 5,
  total_catalog_items: 3,
  catalog_items: {
    'E6F0O5f': 1, // Unlock points
    'E6F0WGc': 1, // Boost 1
    'E6K79Mt': 0  // Boost 2
  },
  teams: ['E6F4sCh'],
  level_progress: {
    percent_completed: 75,
    next_points: 500,
    total_levels: 10,
    percent: 75
  },
  challenges: {},
  point_categories: {},
  challenge_progress: [],
  positions: [],
  time: Date.now(),
  extra: {},
  pointCategories: {}
};

describe('PlayerSelector', () => {
  const mockOnPlayerSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockFunifierDatabaseService.getCollectionData.mockResolvedValue(mockReportData);
    mockFunifierPlayerService.getPlayerStatus.mockResolvedValue(mockPlayerStatus);
    mockFunifierPlayerService.extractPointsLockStatus.mockReturnValue({
      isUnlocked: true,
      unlockItemCount: 1,
      lockItemCount: 0
    });
    mockFunifierPlayerService.extractBoostStatus.mockReturnValue({
      hasSecondaryBoost1: true,
      hasSecondaryBoost2: false,
      boost1Count: 1,
      boost2Count: 0,
      totalActiveBoosts: 1
    });
  });

  it('renders player selector with search input', () => {
    render(
      <PlayerSelector
        onPlayerSelect={mockOnPlayerSelect}
        selectedPlayer={null}
      />
    );

    expect(screen.getByLabelText('Selecionar Jogador')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Digite o nome do jogador...')).toBeInTheDocument();
    expect(screen.getByText('Atualizar Lista')).toBeInTheDocument();
  });

  it('loads players on mount', async () => {
    render(
      <PlayerSelector
        onPlayerSelect={mockOnPlayerSelect}
        selectedPlayer={null}
      />
    );

    await waitFor(() => {
      expect(mockFunifierDatabaseService.getCollectionData).toHaveBeenCalled();
    });
  });

  it('displays loading state while fetching players', async () => {
    // Make the service return a pending promise
    mockFunifierDatabaseService.getCollectionData.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(mockReportData), 100))
    );

    render(
      <PlayerSelector
        onPlayerSelect={mockOnPlayerSelect}
        selectedPlayer={null}
      />
    );

    // Should show loading spinner in search input
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('shows dropdown with players when input is focused', async () => {
    render(
      <PlayerSelector
        onPlayerSelect={mockOnPlayerSelect}
        selectedPlayer={null}
      />
    );

    // Wait for players to load
    await waitFor(() => {
      expect(mockFunifierDatabaseService.getCollectionData).toHaveBeenCalled();
    });

    const searchInput = screen.getByPlaceholderText('Digite o nome do jogador...');
    fireEvent.focus(searchInput);

    await waitFor(() => {
      expect(screen.getByText('João Silva')).toBeInTheDocument();
      expect(screen.getByText('Maria Santos')).toBeInTheDocument();
    });
  });

  it('filters players based on search term', async () => {
    const user = userEvent.setup();
    
    render(
      <PlayerSelector
        onPlayerSelect={mockOnPlayerSelect}
        selectedPlayer={null}
      />
    );

    // Wait for players to load
    await waitFor(() => {
      expect(mockFunifierDatabaseService.getCollectionData).toHaveBeenCalled();
    });

    const searchInput = screen.getByPlaceholderText('Digite o nome do jogador...');
    await user.type(searchInput, 'João');

    await waitFor(() => {
      expect(screen.getByText('João Silva')).toBeInTheDocument();
      expect(screen.queryByText('Maria Santos')).not.toBeInTheDocument();
    });
  });

  it('selects player and loads detailed data', async () => {
    const user = userEvent.setup();
    
    render(
      <PlayerSelector
        onPlayerSelect={mockOnPlayerSelect}
        selectedPlayer={null}
      />
    );

    // Wait for players to load
    await waitFor(() => {
      expect(mockFunifierDatabaseService.getCollectionData).toHaveBeenCalled();
    });

    const searchInput = screen.getByPlaceholderText('Digite o nome do jogador...');
    fireEvent.focus(searchInput);

    await waitFor(() => {
      expect(screen.getByText('João Silva')).toBeInTheDocument();
    });

    // Click on player
    const playerOption = screen.getByText('João Silva');
    await user.click(playerOption);

    // Should load player data
    await waitFor(() => {
      expect(mockFunifierPlayerService.getPlayerStatus).toHaveBeenCalledWith('player1');
    });

    // Should call onPlayerSelect with updated player data
    await waitFor(() => {
      expect(mockOnPlayerSelect).toHaveBeenCalledWith({
        id: 'player1',
        name: 'João Silva',
        team: TeamType.CARTEIRA_I,
        totalPoints: 1500,
        isActive: true,
        lastUpdated: expect.any(Date)
      });
    });
  });

  it('displays selected player information', async () => {
    const selectedPlayer = {
      id: 'player1',
      name: 'João Silva',
      team: TeamType.CARTEIRA_I,
      totalPoints: 1500,
      isActive: true
    };

    render(
      <PlayerSelector
        onPlayerSelect={mockOnPlayerSelect}
        selectedPlayer={selectedPlayer}
      />
    );

    expect(screen.getByText('Informações do Jogador')).toBeInTheDocument();
    expect(screen.getByText('João Silva')).toBeInTheDocument();
    expect(screen.getByText('player1')).toBeInTheDocument();
    expect(screen.getByText('Carteira I')).toBeInTheDocument();
    expect(screen.getByText('1.500')).toBeInTheDocument();
  });

  it('shows team colors correctly', async () => {
    render(
      <PlayerSelector
        onPlayerSelect={mockOnPlayerSelect}
        selectedPlayer={null}
      />
    );

    // Wait for players to load
    await waitFor(() => {
      expect(mockFunifierDatabaseService.getCollectionData).toHaveBeenCalled();
    });

    const searchInput = screen.getByPlaceholderText('Digite o nome do jogador...');
    fireEvent.focus(searchInput);

    await waitFor(() => {
      const carteiraIBadge = screen.getByText('Carteira I');
      const carteiraIIBadge = screen.getByText('Carteira II');
      
      expect(carteiraIBadge).toHaveClass('bg-blue-100', 'text-blue-800');
      expect(carteiraIIBadge).toHaveClass('bg-green-100', 'text-green-800');
    });
  });

  it('clears selection when clear button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <PlayerSelector
        onPlayerSelect={mockOnPlayerSelect}
        selectedPlayer={null}
      />
    );

    const searchInput = screen.getByPlaceholderText('Digite o nome do jogador...');
    await user.type(searchInput, 'João');

    // Clear button should appear
    const clearButton = screen.getByRole('button', { name: /clear/i });
    await user.click(clearButton);

    expect(searchInput).toHaveValue('');
    expect(mockOnPlayerSelect).toHaveBeenCalledWith(null);
  });

  it('handles error when loading players fails', async () => {
    mockFunifierDatabaseService.getCollectionData.mockRejectedValue(
      new Error('Network error')
    );

    render(
      <PlayerSelector
        onPlayerSelect={mockOnPlayerSelect}
        selectedPlayer={null}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Erro ao carregar lista de jogadores. Tente novamente.')).toBeInTheDocument();
    });
  });

  it('handles error when loading player data fails', async () => {
    const user = userEvent.setup();
    
    mockFunifierPlayerService.getPlayerStatus.mockRejectedValue(
      new Error('Player not found')
    );

    render(
      <PlayerSelector
        onPlayerSelect={mockOnPlayerSelect}
        selectedPlayer={null}
      />
    );

    // Wait for players to load
    await waitFor(() => {
      expect(mockFunifierDatabaseService.getCollectionData).toHaveBeenCalled();
    });

    const searchInput = screen.getByPlaceholderText('Digite o nome do jogador...');
    fireEvent.focus(searchInput);

    await waitFor(() => {
      expect(screen.getByText('João Silva')).toBeInTheDocument();
    });

    // Click on player
    const playerOption = screen.getByText('João Silva');
    await user.click(playerOption);

    await waitFor(() => {
      expect(screen.getByText('Erro ao carregar dados do jogador. Tente novamente.')).toBeInTheDocument();
    });
  });

  it('refreshes player list when refresh button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <PlayerSelector
        onPlayerSelect={mockOnPlayerSelect}
        selectedPlayer={null}
      />
    );

    // Wait for initial load
    await waitFor(() => {
      expect(mockFunifierDatabaseService.getCollectionData).toHaveBeenCalledTimes(1);
    });

    const refreshButton = screen.getByText('Atualizar Lista');
    await user.click(refreshButton);

    await waitFor(() => {
      expect(mockFunifierDatabaseService.getCollectionData).toHaveBeenCalledTimes(2);
    });
  });

  it('shows empty state when no players found', async () => {
    mockFunifierDatabaseService.getCollectionData.mockResolvedValue([]);

    render(
      <PlayerSelector
        onPlayerSelect={mockOnPlayerSelect}
        selectedPlayer={null}
      />
    );

    const searchInput = screen.getByPlaceholderText('Digite o nome do jogador...');
    fireEvent.focus(searchInput);

    await waitFor(() => {
      expect(screen.getByText('Nenhum jogador disponível')).toBeInTheDocument();
    });
  });

  it('shows no results when search term matches no players', async () => {
    const user = userEvent.setup();
    
    render(
      <PlayerSelector
        onPlayerSelect={mockOnPlayerSelect}
        selectedPlayer={null}
      />
    );

    // Wait for players to load
    await waitFor(() => {
      expect(mockFunifierDatabaseService.getCollectionData).toHaveBeenCalled();
    });

    const searchInput = screen.getByPlaceholderText('Digite o nome do jogador...');
    await user.type(searchInput, 'NonExistentPlayer');

    await waitFor(() => {
      expect(screen.getByText('Nenhum jogador encontrado')).toBeInTheDocument();
    });
  });

  it('displays boost and lock status correctly', async () => {
    const selectedPlayer = {
      id: 'player1',
      name: 'João Silva',
      team: TeamType.CARTEIRA_I,
      totalPoints: 1500,
      isActive: true
    };

    render(
      <PlayerSelector
        onPlayerSelect={mockOnPlayerSelect}
        selectedPlayer={selectedPlayer}
      />
    );

    // Mock the player data loading
    await waitFor(() => {
      expect(screen.getByText('Desbloqueados')).toBeInTheDocument();
      expect(screen.getByText('1 de 2 boosts ativos')).toBeInTheDocument();
    });
  });
});