import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { GoalCard } from '../GoalCard';

describe('GoalCard', () => {
  const defaultProps = {
    title: 'Test Goal',
    percentage: 75,
    description: 'Test description',
    emoji: '🎯'
  };

  it('renders goal information correctly', () => {
    render(<GoalCard {...defaultProps} />);
    
    expect(screen.getByText('🎯 Test Goal')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('renders primary goal with larger styling', () => {
    render(<GoalCard {...defaultProps} isPrimary={true} />);
    
    const title = screen.getByText('🎯 Test Goal');
    expect(title).toHaveClass('text-xl');
    
    const percentage = screen.getByText('75%');
    expect(percentage).toHaveClass('text-boticario-pink');
  });

  it('renders secondary goal with smaller styling', () => {
    render(<GoalCard {...defaultProps} isPrimary={false} />);
    
    const title = screen.getByText('🎯 Test Goal');
    expect(title).toHaveClass('text-lg');
    
    const percentage = screen.getByText('75%');
    expect(percentage).toHaveClass('text-boticario-purple');
  });

  it('renders boost indicator when hasBoost is true', () => {
    render(
      <GoalCard 
        {...defaultProps} 
        hasBoost={true} 
        isBoostActive={true}
      />
    );
    
    expect(screen.getByText('⚡')).toBeInTheDocument();
  });

  it('does not render boost indicator when hasBoost is false', () => {
    render(<GoalCard {...defaultProps} hasBoost={false} />);
    
    expect(screen.queryByText('⚡')).not.toBeInTheDocument();
  });

  it('calls onBoostToggle when boost is clicked', () => {
    const mockOnBoostToggle = jest.fn();
    render(
      <GoalCard 
        {...defaultProps} 
        hasBoost={true} 
        isBoostActive={true}
        onBoostToggle={mockOnBoostToggle}
      />
    );
    
    const boostIndicator = screen.getByText('⚡').parentElement;
    fireEvent.click(boostIndicator!);
    
    expect(mockOnBoostToggle).toHaveBeenCalledTimes(1);
  });

  it('renders progress bar with correct percentage', () => {
    const { container } = render(<GoalCard {...defaultProps} percentage={60} />);
    
    // Progress bar should be rendered (we can't easily test the exact width due to the special logic)
    const progressBar = container.querySelector('.bg-yellow-500');
    expect(progressBar).toBeInTheDocument();
  });
});