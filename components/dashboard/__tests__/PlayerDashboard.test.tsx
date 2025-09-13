import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PlayerDashboard } from '../PlayerDashboard';

describe('PlayerDashboard', () => {
  const mockProps = {
    playerName: 'Maria Silva',
    totalPoints: 2847,
    pointsLocked: false,
    currentCycleDay: 15,
    totalCycleDays: 30,
    primaryGoal: {
      name: 'Faturamento',
      percentage: 75,
      description: 'R$ 750 de R$ 1.000 - Faltam apenas R$ 250!',
      emoji: '🎯'
    },
    secondaryGoal1: {
      name: 'Fragrâncias',
      percentage: 60,
      description: '3 de 5 fragrâncias compradas',
      emoji: '🌟',
      hasBoost: true,
      isBoostActive: true
    },
    secondaryGoal2: {
      name: 'Maquiagem',
      percentage: 40,
      description: 'R$ 200 de R$ 500 em maquiagem',
      emoji: '💄',
      hasBoost: true,
      isBoostActive: false
    }
  };

  it('renders all main components', () => {
    render(<PlayerDashboard {...mockProps} />);
    
    // Header
    expect(screen.getByText('Olá, Maria Silva! ✨')).toBeInTheDocument();
    
    // Points card
    expect(screen.getByText('2.847')).toBeInTheDocument();
    expect(screen.getByText('Desbloqueados')).toBeInTheDocument();
    
    // Cycle card
    expect(screen.getByText('Dia Atual')).toBeInTheDocument();
    expect(screen.getByText('Dias Restantes')).toBeInTheDocument();
    
    // Goals
    expect(screen.getByText('🎯 Faturamento')).toBeInTheDocument();
    expect(screen.getByText('🌟 Fragrâncias')).toBeInTheDocument();
    expect(screen.getByText('💄 Maquiagem')).toBeInTheDocument();
    
    // Quick actions
    expect(screen.getByText('🚀 Ações Rápidas')).toBeInTheDocument();
  });

  it('handles boost toggle correctly', () => {
    render(<PlayerDashboard {...mockProps} />);
    
    const boostIndicators = screen.getAllByText('⚡');
    expect(boostIndicators).toHaveLength(2);
    
    // First boost should be active (gold background)
    const firstBoost = boostIndicators[0].parentElement;
    expect(firstBoost).toHaveClass('bg-boticario-gold');
    
    // Second boost should be inactive (gray background)
    const secondBoost = boostIndicators[1].parentElement;
    expect(secondBoost).toHaveClass('bg-gray-300');
    
    // Click to toggle first boost
    fireEvent.click(firstBoost!);
    
    // After click, first boost should become inactive
    expect(firstBoost).toHaveClass('bg-gray-300');
  });

  it('renders locked points correctly', () => {
    const lockedProps = { ...mockProps, pointsLocked: true };
    render(<PlayerDashboard {...lockedProps} />);
    
    expect(screen.getByText('Bloqueados')).toBeInTheDocument();
  });

  it('calculates cycle progress correctly', () => {
    render(<PlayerDashboard {...mockProps} />);
    
    // 15 days out of 30 = 50% progress
    expect(screen.getByText('50% do ciclo concluído')).toBeInTheDocument();
  });

  it('renders goal details accordion', () => {
    render(<PlayerDashboard {...mockProps} />);
    
    const accordionButton = screen.getByText('📊 Detalhes das Metas');
    expect(accordionButton).toBeInTheDocument();
    
    // Click to open accordion
    fireEvent.click(accordionButton);
    
    // Should show goal details
    expect(screen.getByText('Meta Principal')).toBeInTheDocument();
    expect(screen.getByText('Fragrâncias')).toBeInTheDocument();
    expect(screen.getByText('Maquiagem')).toBeInTheDocument();
  });

  it('applies correct background gradient', () => {
    const { container } = render(<PlayerDashboard {...mockProps} />);
    
    const mainDiv = container.firstChild;
    expect(mainDiv).toHaveClass('bg-gradient-to-br', 'from-boticario-light', 'to-white');
  });
});