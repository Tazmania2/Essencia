import React from 'react';
import { render, screen } from '@testing-library/react';
import { CycleCard } from '../CycleCard';

describe('CycleCard', () => {
  it('renders cycle information correctly', () => {
    render(<CycleCard currentDay={15} totalDays={30} />);
    
    expect(screen.getByText('Ciclo Atual')).toBeInTheDocument();
    expect(screen.getByText('Dia Atual')).toBeInTheDocument();
    expect(screen.getByText('Dias Restantes')).toBeInTheDocument();
    expect(screen.getByText('50% do ciclo concluído')).toBeInTheDocument();
    
    // Check that we have two "15" elements (current day and days remaining)
    const fifteenElements = screen.getAllByText('15');
    expect(fifteenElements).toHaveLength(2);
  });

  it('handles fallback to 21 days when totalDays is 0', () => {
    render(<CycleCard currentDay={10} totalDays={0} />);
    
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('11')).toBeInTheDocument(); // 21 - 10 = 11 days remaining
    expect(screen.getByText('* Usando padrão de 21 dias')).toBeInTheDocument();
  });

  it('handles fallback to 21 days when totalDays is negative', () => {
    render(<CycleCard currentDay={5} totalDays={-5} />);
    
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('16')).toBeInTheDocument(); // 21 - 5 = 16 days remaining
    expect(screen.getByText('* Usando padrão de 21 dias')).toBeInTheDocument();
  });

  it('clamps current day to valid range', () => {
    render(<CycleCard currentDay={35} totalDays={30} />);
    
    // Should show 30 (clamped to totalDays) and 0 days remaining
    expect(screen.getByText('30')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('⚠️ Ciclo vencido')).toBeInTheDocument();
  });

  it('handles negative current day', () => {
    render(<CycleCard currentDay={-5} totalDays={30} />);
    
    // Should show 0 (clamped to minimum) and 30 days remaining
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
    expect(screen.getByText('0% do ciclo concluído')).toBeInTheDocument();
  });

  it('shows overdue status when current day exceeds total days', () => {
    render(<CycleCard currentDay={35} totalDays={30} />);
    
    expect(screen.getByText('⚠️ Ciclo vencido')).toBeInTheDocument();
    
    // Should have red styling for overdue
    const currentDayElement = screen.getByText('30');
    const daysRemainingElement = screen.getByText('0');
    
    expect(currentDayElement).toHaveClass('text-red-500');
    expect(daysRemainingElement).toHaveClass('text-red-500');
  });

  it('shows 100% progress when overdue', () => {
    render(<CycleCard currentDay={35} totalDays={30} />);
    
    expect(screen.getByText('100% do ciclo concluído')).toBeInTheDocument();
  });

  it('does not show fallback message when data is from collection', () => {
    render(<CycleCard currentDay={10} totalDays={30} isDataFromCollection={true} />);
    
    expect(screen.queryByText('* Usando padrão de 21 dias')).not.toBeInTheDocument();
  });

  it('shows fallback message when data is not from collection', () => {
    render(<CycleCard currentDay={10} totalDays={21} isDataFromCollection={false} />);
    
    expect(screen.getByText('* Usando padrão de 21 dias')).toBeInTheDocument();
  });

  it('calculates progress percentage correctly', () => {
    render(<CycleCard currentDay={7} totalDays={21} />);
    
    // 7/21 = 33.33%, should round to 33%
    expect(screen.getByText('33% do ciclo concluído')).toBeInTheDocument();
  });

  it('handles edge case of 0 current day', () => {
    render(<CycleCard currentDay={0} totalDays={30} />);
    
    const zeroElements = screen.getAllByText('0');
    expect(zeroElements.length).toBeGreaterThanOrEqual(1); // At least one "0" for current day
    expect(screen.getByText('30')).toBeInTheDocument();
    expect(screen.getByText('0% do ciclo concluído')).toBeInTheDocument();
  });

  it('handles edge case of current day equals total days', () => {
    render(<CycleCard currentDay={30} totalDays={30} />);
    
    const thirtyElements = screen.getAllByText('30');
    expect(thirtyElements.length).toBeGreaterThanOrEqual(1); // At least one "30" for current day
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('100% do ciclo concluído')).toBeInTheDocument();
  });

  it('applies correct styling for normal progress', () => {
    const { container } = render(<CycleCard currentDay={15} totalDays={30} />);
    
    const progressBar = container.querySelector('.bg-boticario-purple');
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveStyle({ width: '50%' });
  });

  it('applies correct styling for overdue progress', () => {
    const { container } = render(<CycleCard currentDay={35} totalDays={30} />);
    
    const progressBar = container.querySelector('.bg-red-500');
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveStyle({ width: '100%' });
  });
});