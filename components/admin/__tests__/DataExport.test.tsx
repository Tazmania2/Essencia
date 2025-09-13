import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataExport } from '../DataExport';
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

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-url');
global.URL.revokeObjectURL = jest.fn();

// Mock document.createElement and appendChild/removeChild
const mockLink = {
  setAttribute: jest.fn(),
  click: jest.fn(),
  style: { visibility: '' }
};

const originalCreateElement = document.createElement;
document.createElement = jest.fn((tagName) => {
  if (tagName === 'a') {
    return mockLink as any;
  }
  return originalCreateElement.call(document, tagName);
});

const mockAppendChild = jest.fn();
const mockRemoveChild = jest.fn();
document.body.appendChild = mockAppendChild;
document.body.removeChild = mockRemoveChild;

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
    currentCycleDay: 15,
    totalCycleDays: 21,
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
    currentCycleDay: 15,
    totalCycleDays: 21,
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

describe('DataExport', () => {
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

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders export filters and options', () => {
    render(<DataExport />);

    expect(screen.getByText('Filtros de Exportação')).toBeInTheDocument();
    expect(screen.getByLabelText('Data Inicial')).toBeInTheDocument();
    expect(screen.getByLabelText('Data Final')).toBeInTheDocument();
    expect(screen.getByText('Times')).toBeInTheDocument();
    expect(screen.getByText('Dados a Incluir')).toBeInTheDocument();
    expect(screen.getByText('Carregar Dados')).toBeInTheDocument();
  });

  it('sets default date range to last 30 days', () => {
    render(<DataExport />);

    const startDateInput = screen.getByLabelText('Data Inicial') as HTMLInputElement;
    const endDateInput = screen.getByLabelText('Data Final') as HTMLInputElement;

    expect(startDateInput.value).toBeTruthy();
    expect(endDateInput.value).toBeTruthy();
    
    // Check that start date is before end date
    const startDate = new Date(startDateInput.value);
    const endDate = new Date(endDateInput.value);
    expect(startDate < endDate).toBe(true);
  });

  it('allows selecting and deselecting teams', async () => {
    const user = userEvent.setup();
    render(<DataExport />);

    const carteiraICheckbox = screen.getByRole('checkbox', { name: /carteira i/i });
    const carteiraIICheckbox = screen.getByRole('checkbox', { name: /carteira ii/i });

    // Initially unchecked
    expect(carteiraICheckbox).not.toBeChecked();
    expect(carteiraIICheckbox).not.toBeChecked();

    // Select Carteira I
    await user.click(carteiraICheckbox);
    expect(carteiraICheckbox).toBeChecked();

    // Select Carteira II
    await user.click(carteiraIICheckbox);
    expect(carteiraIICheckbox).toBeChecked();

    // Deselect Carteira I
    await user.click(carteiraICheckbox);
    expect(carteiraICheckbox).not.toBeChecked();
  });

  it('handles select all teams functionality', async () => {
    const user = userEvent.setup();
    render(<DataExport />);

    const selectAllButton = screen.getByText('Selecionar Todos');
    
    // Click select all
    await user.click(selectAllButton);

    // All team checkboxes should be checked
    const teamCheckboxes = screen.getAllByRole('checkbox').filter(checkbox => 
      checkbox.getAttribute('type') === 'checkbox' && 
      (checkbox as HTMLInputElement).name !== 'includePlayerDetails'
    );
    
    const teamOnlyCheckboxes = teamCheckboxes.slice(0, 4); // First 4 are team checkboxes
    teamOnlyCheckboxes.forEach(checkbox => {
      expect(checkbox).toBeChecked();
    });

    // Button text should change
    expect(screen.getByText('Desmarcar Todos')).toBeInTheDocument();

    // Click deselect all
    await user.click(screen.getByText('Desmarcar Todos'));
    
    teamOnlyCheckboxes.forEach(checkbox => {
      expect(checkbox).not.toBeChecked();
    });
  });

  it('toggles data inclusion options', async () => {
    const user = userEvent.setup();
    render(<DataExport />);

    const playerDetailsCheckbox = screen.getByRole('checkbox', { name: /detalhes do jogador/i });
    const goalMetricsCheckbox = screen.getByRole('checkbox', { name: /métricas das metas/i });
    const boostStatusCheckbox = screen.getByRole('checkbox', { name: /status dos boosts/i });
    const levelProgressCheckbox = screen.getByRole('checkbox', { name: /progresso de nível/i });

    // Check initial states (some should be checked by default)
    expect(playerDetailsCheckbox).toBeChecked();
    expect(goalMetricsCheckbox).toBeChecked();
    expect(boostStatusCheckbox).toBeChecked();
    expect(levelProgressCheckbox).not.toBeChecked();

    // Toggle level progress
    await user.click(levelProgressCheckbox);
    expect(levelProgressCheckbox).toBeChecked();

    // Toggle player details
    await user.click(playerDetailsCheckbox);
    expect(playerDetailsCheckbox).not.toBeChecked();
  });

  it('loads export data when button is clicked', async () => {
    const user = userEvent.setup();
    render(<DataExport />);

    const loadButton = screen.getByText('Carregar Dados');
    await user.click(loadButton);

    await waitFor(() => {
      expect(mockFunifierDatabaseService.getCollectionData).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByText('Dados Prontos para Exportação')).toBeInTheDocument();
    });
  });

  it('shows loading state while loading data', async () => {
    const user = userEvent.setup();
    
    // Make the service return a pending promise
    mockFunifierDatabaseService.getCollectionData.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(mockReportData), 100))
    );

    render(<DataExport />);

    const loadButton = screen.getByText('Carregar Dados');
    await user.click(loadButton);

    expect(screen.getByText('Carregando Dados...')).toBeInTheDocument();
    expect(loadButton).toBeDisabled();
  });

  it('shows progress bar while loading player details', async () => {
    const user = userEvent.setup();
    
    // Mock slow player data loading
    mockFunifierPlayerService.getPlayerStatus.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(mockPlayerStatus), 50))
    );

    render(<DataExport />);

    const loadButton = screen.getByText('Carregar Dados');
    await user.click(loadButton);

    await waitFor(() => {
      expect(screen.getByText('Carregando dados dos jogadores...')).toBeInTheDocument();
    });
  });

  it('displays export preview table', async () => {
    const user = userEvent.setup();
    render(<DataExport />);

    const loadButton = screen.getByText('Carregar Dados');
    await user.click(loadButton);

    await waitFor(() => {
      expect(screen.getByText('Dados Prontos para Exportação')).toBeInTheDocument();
    });

    // Check table headers
    expect(screen.getByText('Jogador')).toBeInTheDocument();
    expect(screen.getByText('Time')).toBeInTheDocument();
    expect(screen.getByText('Pontos')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();

    // Check data rows
    expect(screen.getByText('João Silva')).toBeInTheDocument();
    expect(screen.getByText('Maria Santos')).toBeInTheDocument();
  });

  it('exports data to CSV when CSV button is clicked', async () => {
    const user = userEvent.setup();
    render(<DataExport />);

    // Load data first
    const loadButton = screen.getByText('Carregar Dados');
    await user.click(loadButton);

    await waitFor(() => {
      expect(screen.getByText('Exportar CSV')).toBeInTheDocument();
    });

    // Click export CSV
    const exportButton = screen.getByText('Exportar CSV');
    await user.click(exportButton);

    // Check that file download was triggered
    expect(mockLink.setAttribute).toHaveBeenCalledWith('href', 'mock-url');
    expect(mockLink.setAttribute).toHaveBeenCalledWith('download', expect.stringContaining('.csv'));
    expect(mockLink.click).toHaveBeenCalled();
  });

  it('exports data to JSON when JSON button is clicked', async () => {
    const user = userEvent.setup();
    render(<DataExport />);

    // Load data first
    const loadButton = screen.getByText('Carregar Dados');
    await user.click(loadButton);

    await waitFor(() => {
      expect(screen.getByText('Exportar JSON')).toBeInTheDocument();
    });

    // Click export JSON
    const exportButton = screen.getByText('Exportar JSON');
    await user.click(exportButton);

    // Check that file download was triggered
    expect(mockLink.setAttribute).toHaveBeenCalledWith('href', 'mock-url');
    expect(mockLink.setAttribute).toHaveBeenCalledWith('download', expect.stringContaining('.json'));
    expect(mockLink.click).toHaveBeenCalled();
  });

  it('handles error when loading data fails', async () => {
    const user = userEvent.setup();
    
    mockFunifierDatabaseService.getCollectionData.mockRejectedValue(
      new Error('Network error')
    );

    render(<DataExport />);

    const loadButton = screen.getByText('Carregar Dados');
    await user.click(loadButton);

    await waitFor(() => {
      expect(screen.getByText('Erro ao carregar dados para exportação. Tente novamente.')).toBeInTheDocument();
    });
  });

  it('shows error when trying to export without data', async () => {
    const user = userEvent.setup();
    render(<DataExport />);

    // Try to export without loading data first
    // Since there's no export button visible without data, we need to simulate the scenario
    // by mocking empty data and then trying to export
    mockFunifierDatabaseService.getCollectionData.mockResolvedValue([]);

    const loadButton = screen.getByText('Carregar Dados');
    await user.click(loadButton);

    // No export buttons should be visible with empty data
    await waitFor(() => {
      expect(screen.queryByText('Exportar CSV')).not.toBeInTheDocument();
      expect(screen.queryByText('Exportar JSON')).not.toBeInTheDocument();
    });
  });

  it('filters data by selected teams', async () => {
    const user = userEvent.setup();
    render(<DataExport />);

    // Select only Carteira I
    const carteiraICheckbox = screen.getByRole('checkbox', { name: /carteira i/i });
    await user.click(carteiraICheckbox);

    const loadButton = screen.getByText('Carregar Dados');
    await user.click(loadButton);

    await waitFor(() => {
      expect(screen.getByText('Dados Prontos para Exportação')).toBeInTheDocument();
    });

    // Should only show Carteira I player
    expect(screen.getByText('João Silva')).toBeInTheDocument();
    expect(screen.queryByText('Maria Santos')).not.toBeInTheDocument();
  });

  it('filters data by date range', async () => {
    const user = userEvent.setup();
    render(<DataExport />);

    // Set date range that excludes our mock data
    const startDateInput = screen.getByLabelText('Data Inicial');
    const endDateInput = screen.getByLabelText('Data Final');
    
    await user.clear(startDateInput);
    await user.type(startDateInput, '2024-02-01');
    await user.clear(endDateInput);
    await user.type(endDateInput, '2024-02-28');

    const loadButton = screen.getByText('Carregar Dados');
    await user.click(loadButton);

    await waitFor(() => {
      // Should show no data since our mock data is from 2024-01-01
      expect(screen.queryByText('Dados Prontos para Exportação')).not.toBeInTheDocument();
    });
  });

  it('handles player data loading errors gracefully', async () => {
    const user = userEvent.setup();
    
    // Mock player service to fail for one player
    mockFunifierPlayerService.getPlayerStatus
      .mockResolvedValueOnce(mockPlayerStatus)
      .mockRejectedValueOnce(new Error('Player not found'));

    render(<DataExport />);

    const loadButton = screen.getByText('Carregar Dados');
    await user.click(loadButton);

    await waitFor(() => {
      expect(screen.getByText('Dados Prontos para Exportação')).toBeInTheDocument();
    });

    // Should still show data for players that loaded successfully
    expect(screen.getByText('João Silva')).toBeInTheDocument();
  });

  it('shows correct record count', async () => {
    const user = userEvent.setup();
    render(<DataExport />);

    const loadButton = screen.getByText('Carregar Dados');
    await user.click(loadButton);

    await waitFor(() => {
      expect(screen.getByText('2 registros encontrados')).toBeInTheDocument();
    });
  });

  it('shows preview of first 5 records only', async () => {
    const user = userEvent.setup();
    
    // Mock more than 5 records
    const manyRecords = Array.from({ length: 7 }, (_, i) => ({
      ...mockReportData[0],
      _id: `player${i}_2024-01-01`,
      playerId: `player${i}`,
      playerName: `Player ${i}`
    }));
    
    mockFunifierDatabaseService.getCollectionData.mockResolvedValue(manyRecords);

    render(<DataExport />);

    const loadButton = screen.getByText('Carregar Dados');
    await user.click(loadButton);

    await waitFor(() => {
      expect(screen.getByText('... e mais 2 registros')).toBeInTheDocument();
    });
  });
});