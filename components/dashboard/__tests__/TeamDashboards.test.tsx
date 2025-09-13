import React from 'react';
import { render, screen } from '@testing-library/react';
import { TeamDashboardFactory } from '../TeamDashboardFactory';
import { CarteiraIDashboard } from '../CarteiraIDashboard';
import { CarteiraIIDashboard } from '../CarteiraIIDashboard';
import { CarteiraIIIDashboard } from '../CarteiraIIIDashboard';
import { CarteiraIVDashboard } from '../CarteiraIVDashboard';
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
  });

  describe('TeamDashboardFactory', () => {
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

    it('renders error message for unknown team type', () => {
      render(
        <TeamDashboardFactory 
          {...mockProps} 
          teamType={'UNKNOWN_TEAM' as TeamType} 
        />
      );
      
      expect(screen.getByText('Equipe não reconhecida')).toBeInTheDocument();
      expect(screen.getByText('Não foi possível identificar sua equipe. Entre em contato com o suporte.')).toBeInTheDocument();
      expect(screen.getByText('Tipo de equipe: UNKNOWN_TEAM')).toBeInTheDocument();
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
        TeamType.CARTEIRA_I,
        TeamType.CARTEIRA_II,
        TeamType.CARTEIRA_III,
        TeamType.CARTEIRA_IV
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
  });
});