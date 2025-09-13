import React from 'react';
import { render, screen } from '@testing-library/react';
import { DashboardHeader } from '../DashboardHeader';

describe('DashboardHeader', () => {
  it('renders player name correctly', () => {
    const playerName = 'Maria Silva';
    render(<DashboardHeader playerName={playerName} />);
    
    expect(screen.getByText(`Olá, ${playerName}! ✨`)).toBeInTheDocument();
    expect(screen.getByText('Bem-vinda de volta!')).toBeInTheDocument();
    expect(screen.getByText('O Boticário Rewards')).toBeInTheDocument();
  });

  it('renders with correct styling classes', () => {
    render(<DashboardHeader playerName="Test User" />);
    
    const header = screen.getByRole('banner');
    expect(header).toHaveClass('bg-gradient-to-r', 'from-boticario-pink', 'to-boticario-purple');
  });

  it('displays the brand icon', () => {
    render(<DashboardHeader playerName="Test User" />);
    
    expect(screen.getByText('🌸')).toBeInTheDocument();
  });
});