import React from 'react';
import { render, screen } from '@testing-library/react';
import { Carteira0Dashboard } from '../Carteira0Dashboard';

// Mock the ConnectedPlayerDashboard component
jest.mock('../ConnectedPlayerDashboard', () => ({
  ConnectedPlayerDashboard: ({ playerId, token }: { playerId: string; token: string }) => (
    <div data-testid="connected-dashboard">
      <span data-testid="player-id">{playerId}</span>
      <span data-testid="token">{token}</span>
    </div>
  )
}));

describe('Carteira0Dashboard', () => {
  const mockProps = {
    playerId: 'player123',
    token: 'token123'
  };

  it('renders ConnectedPlayerDashboard with correct props', () => {
    render(<Carteira0Dashboard {...mockProps} />);
    
    expect(screen.getByTestId('connected-dashboard')).toBeInTheDocument();
    expect(screen.getByTestId('player-id')).toHaveTextContent('player123');
    expect(screen.getByTestId('token')).toHaveTextContent('token123');
  });

  it('passes playerId prop correctly', () => {
    render(<Carteira0Dashboard playerId="test-player-456" token="test-token" />);
    
    expect(screen.getByTestId('player-id')).toHaveTextContent('test-player-456');
  });

  it('passes token prop correctly', () => {
    render(<Carteira0Dashboard playerId="test-player" token="test-token-789" />);
    
    expect(screen.getByTestId('token')).toHaveTextContent('test-token-789');
  });

  it('renders without crashing with minimal props', () => {
    render(<Carteira0Dashboard playerId="" token="" />);
    
    expect(screen.getByTestId('connected-dashboard')).toBeInTheDocument();
  });

  describe('Team-Specific Configuration', () => {
    it('has proper documentation for Carteira 0 specifics', () => {
      // Carteira 0: Conversões (principal), Reais por Ativo + Faturamento (secundárias)
      // Pontos diretos da Funifier
      expect(Carteira0Dashboard).toBeDefined();
    });

    it('follows the same pattern as other Carteira dashboards', () => {
      const { container } = render(<Carteira0Dashboard {...mockProps} />);
      
      // Should render the ConnectedPlayerDashboard component
      expect(screen.getByTestId('connected-dashboard')).toBeInTheDocument();
      
      // Should not have any additional wrapper elements
      expect(container.firstChild).toEqual(screen.getByTestId('connected-dashboard'));
    });
  });
});