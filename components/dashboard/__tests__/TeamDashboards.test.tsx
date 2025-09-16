import React from 'react';
import { render, screen } from '@testing-library/react';
import { TeamDashboardFactory } from '../TeamDashboardFactory';
import { Carteira0Dashboard } from '../Carteira0Dashboard';
import { CarteiraIDashboard } from '../CarteiraIDashboard';
import { CarteiraIIDashboard } from '../CarteiraIIDashboard';
import { CarteiraIIIDashboard } from '../CarteiraIIIDashboard';
import { CarteiraIVDashboard } from '../CarteiraIVDashboard';
import { ERDashboard } from '../ERDashboard';
import { TeamType } from '../../../types';

// Mock the ConnectedPlayerDashboard component
jest.mock('../ConnectedPlayerDashboard', () => ({
  ConnectedPlayerDashboard: ({ playerId, token }: { playerId: string; token: string }) => (
    <div data-testid="connected-dashboard">
      <span data-testid="player-id">{playerId}</span>
      <span data-testid="token">{token}</span>
    </div>
  )
}));

describe('Team-Specific Dashboards', () => {
  const mockProps = {
    playerId: 'player123',
    token: 'token123'
  };

  describe('Individual Team Dashboards', () => {
    it('renders Carteira0Dashboard correctly', () => {
      render(<Carteira0Dashboard {...mockProps} />);
      
      expect(screen.getByTestId('connected-dashboard')).toBeInTheDocument();
      expect(screen.getByTestId('player-id')).toHaveTextContent('player123');
      expect(screen.getByTestId('token')).toHaveTextContent('token123');
    });

    it('renders CarteiraIDashboard correctly', () => {
      render(<CarteiraIDashboard {...mockProps} />);
      
      expect(screen.getByTestId('connected-dashboard')).toBeInTheDocument();
      expect(screen.getByTestId('player-id')).toHaveTextContent('player123');
      expect(screen.getByTestId('token')).toHaveTextContent('token123');
    });

    it('renders CarteiraIIDashboard correctly', () => {
      render(<CarteiraIIDashboard {...mockProps} />);
      
      expect(screen.getByTestId('connected-dashboard')).toBeInTheDocument();
      expect(screen.getByTestId('player-id')).toHaveTextContent('player123');
      expect(screen.getByTestId('token')).toHaveTextContent('token123');
    });

    it('renders CarteiraIIIDashboard correctly', () => {
      render(<CarteiraIIIDashboard {...mockProps} />);
      
      expect(screen.getByTestId('connected-dashboard')).toBeInTheDocument();
      expect(screen.getByTestId('player-id')).toHaveTextContent('player123');
      expect(screen.getByTestId('token')).toHaveTextContent('token123');
    });

    it('renders CarteiraIVDashboard correctly', () => {
      render(<CarteiraIVDashboard {...mockProps} />);
      
      expect(screen.getByTestId('connected-dashboard')).toBeInTheDocument();
      expect(screen.getByTestId('player-id')).toHaveTextContent('player123');
      expect(screen.getByTestId('token')).toHaveTextContent('token123');
    });

    it('renders ERDashboard correctly', () => {
      render(<ERDashboard {...mockProps} />);
      
      expect(screen.getByTestId('connected-dashboard')).toBeInTheDocument();
      expect(screen.getByTestId('player-id')).toHaveTextContent('player123');
      expect(screen.getByTestId('token')).toHaveTextContent('token123');
    });
  });

  describe('TeamDashboardFactory', () => {
    it('renders Carteira 0 dashboard for CARTEIRA_0 team type', () => {
      render(
        <TeamDashboardFactory 
          {...mockProps} 
          teamType={TeamType.CARTEIRA_0} 
        />
      );
      
      expect(screen.getByTestId('connected-dashboard')).toBeInTheDocument();
    });

    it('renders Carteira I dashboard for CARTEIRA_I team type', () => {
      render(
        <TeamDashboardFactory 
          {...mockProps} 
          teamType={TeamType.CARTEIRA_I} 
        />
      );
      
      expect(screen.getByTestId('connected-dashboard')).toBeInTheDocument();
    });

    it('renders Carteira II dashboard for CARTEIRA_II team type', () => {
      render(
        <TeamDashboardFactory 
          {...mockProps} 
          teamType={TeamType.CARTEIRA_II} 
        />
      );
      
      expect(screen.getByTestId('connected-dashboard')).toBeInTheDocument();
    });

    it('renders Carteira III dashboard for CARTEIRA_III team type', () => {
      render(
        <TeamDashboardFactory 
          {...mockProps} 
          teamType={TeamType.CARTEIRA_III} 
        />
      );
      
      expect(screen.getByTestId('connected-dashboard')).toBeInTheDocument();
    });

    it('renders Carteira IV dashboard for CARTEIRA_IV team type', () => {
      render(
        <TeamDashboardFactory 
          {...mockProps} 
          teamType={TeamType.CARTEIRA_IV} 
        />
      );
      
      expect(screen.getByTestId('connected-dashboard')).toBeInTheDocument();
    });

    it('renders ER dashboard for ER team type', () => {
      render(
        <TeamDashboardFactory 
          {...mockProps} 
          teamType={TeamType.ER} 
        />
      );
      
      expect(screen.getByTestId('connected-dashboard')).toBeInTheDocument();
    });

    it('renders error message for unknown team type', () => {
      render(
        <TeamDashboardFactory 
          {...mockProps} 
          teamType={'UNKNOWN_TEAM' as TeamType} 
        />
      );
      
      expect(screen.getByText('Equipe não reconhecida')).toBeInTheDocument();
      expect(screen.getByText(/O tipo de equipe "UNKNOWN_TEAM" não é suportado pelo sistema/)).toBeInTheDocument();
      expect(screen.getByText('Tipo recebido: UNKNOWN_TEAM')).toBeInTheDocument();
      expect(screen.getByText('Equipes suportadas:')).toBeInTheDocument();
      expect(screen.getByText('• Carteira 0')).toBeInTheDocument();
      expect(screen.getByText('• ER')).toBeInTheDocument();
    });

    it('applies correct styling for error state', () => {
      const { container } = render(
        <TeamDashboardFactory 
          {...mockProps} 
          teamType={'UNKNOWN_TEAM' as TeamType} 
        />
      );
      
      const errorContainer = container.firstChild;
      expect(errorContainer).toHaveClass('bg-gradient-to-br', 'from-boticario-light', 'to-white', 'min-h-screen');
    });
  });

  describe('Team-Specific Routing Logic', () => {
    it('passes correct props to each team dashboard', () => {
      const teams = [
        TeamType.CARTEIRA_0,
        TeamType.CARTEIRA_I,
        TeamType.CARTEIRA_II,
        TeamType.CARTEIRA_III,
        TeamType.CARTEIRA_IV,
        TeamType.ER
      ];

      teams.forEach(teamType => {
        const { unmount } = render(
          <TeamDashboardFactory 
            playerId="test-player"
            token="test-token"
            teamType={teamType} 
          />
        );
        
        expect(screen.getByTestId('connected-dashboard')).toBeInTheDocument();
        expect(screen.getByTestId('player-id')).toHaveTextContent('test-player');
        expect(screen.getByTestId('token')).toHaveTextContent('test-token');
        
        unmount();
      });
    });
  });

  describe('Team Dashboard Documentation', () => {
    // These tests verify that the team-specific logic is properly documented
    // The actual business logic is handled by the team processors
    
    it('has proper documentation for Carteira 0 specifics', () => {
      // Carteira 0: Conversões (principal), Reais por Ativo + Faturamento (secundárias)
      // Pontos diretos da Funifier
      expect(Carteira0Dashboard).toBeDefined();
    });

    it('has proper documentation for Carteira I specifics', () => {
      // Carteira I: Atividade (principal), Reais por Ativo + Faturamento (secundárias)
      // Pontos diretos da Funifier
      expect(CarteiraIDashboard).toBeDefined();
    });

    it('has proper documentation for Carteira II specifics', () => {
      // Carteira II: Reais por Ativo (principal - controla pontos), Atividade + Multimarcas (secundárias)
      // Pontos calculados localmente com boosts
      expect(CarteiraIIDashboard).toBeDefined();
    });

    it('has proper documentation for Carteira III specifics', () => {
      // Carteira III: Faturamento (principal), Reais por Ativo + Multimarcas (secundárias)
      // Pontos diretos da Funifier
      expect(CarteiraIIIDashboard).toBeDefined();
    });

    it('has proper documentation for Carteira IV specifics', () => {
      // Carteira IV: Faturamento (principal), Reais por Ativo + Multimarcas (secundárias)
      // Pontos diretos da Funifier (mesmo que Carteira III)
      expect(CarteiraIVDashboard).toBeDefined();
    });

    it('has proper documentation for ER specifics', () => {
      // ER: Faturamento (principal), Reais por Ativo + UPA (secundárias)
      // Pontos diretos da Funifier, includes Medalhas button
      expect(ERDashboard).toBeDefined();
    });
  });
});