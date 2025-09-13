import React from 'react';
import { render, screen } from '@testing-library/react';
import { PointsCard } from '../PointsCard';

describe('PointsCard', () => {
  it('renders unlocked points correctly', () => {
    render(<PointsCard points={2847} isUnlocked={true} />);
    
    expect(screen.getByText('2.847')).toBeInTheDocument();
    expect(screen.getByText('Desbloqueados')).toBeInTheDocument();
    expect(screen.getByText('pontos disponíveis')).toBeInTheDocument();
  });

  it('renders locked points correctly', () => {
    render(<PointsCard points={1500} isUnlocked={false} />);
    
    expect(screen.getByText('1.500')).toBeInTheDocument();
    expect(screen.getByText('Bloqueados')).toBeInTheDocument();
  });

  it('applies correct styling for unlocked points', () => {
    render(<PointsCard points={2847} isUnlocked={true} />);
    
    const pointsValue = screen.getByText('2.847');
    expect(pointsValue).toHaveClass('text-green-600');
    
    const status = screen.getByText('Desbloqueados');
    expect(status).toHaveClass('text-green-600');
    
    expect(screen.getByText('pontos disponíveis')).toBeInTheDocument();
  });

  it('applies correct styling for locked points', () => {
    render(<PointsCard points={1500} isUnlocked={false} />);
    
    const pointsValue = screen.getByText('1.500');
    expect(pointsValue).toHaveClass('text-red-600');
    
    const status = screen.getByText('Bloqueados');
    expect(status).toHaveClass('text-red-600');
    
    expect(screen.getByText('pontos bloqueados')).toBeInTheDocument();
  });

  it('formats large numbers correctly', () => {
    render(<PointsCard points={123456} isUnlocked={true} />);
    
    expect(screen.getByText('123.456')).toBeInTheDocument();
  });
}); 
 it('shows special note for Carteira II team', () => {
    render(<PointsCard points={2847} isUnlocked={true} teamType="CARTEIRA_II" />);
    
    expect(screen.getByText('* Pontos calculados localmente')).toBeInTheDocument();
  });

  it('does not show special note for other teams', () => {
    render(<PointsCard points={2847} isUnlocked={true} teamType="CARTEIRA_I" />);
    
    expect(screen.queryByText('* Pontos calculados localmente')).not.toBeInTheDocument();
  });