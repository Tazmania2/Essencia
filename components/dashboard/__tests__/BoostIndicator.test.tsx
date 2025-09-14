import React from 'react';
import { render, screen } from '@testing-library/react';
import { BoostIndicator } from '../BoostIndicator';

describe('BoostIndicator', () => {
  it('renders active boost correctly', () => {
    render(<BoostIndicator isActive={true} />);
    
    const indicator = screen.getByText('⚡').parentElement;
    expect(indicator).toHaveClass('bg-boticario-gold');
    expect(screen.getByText('⚡')).toHaveClass('text-white');
  });

  it('renders inactive boost correctly', () => {
    render(<BoostIndicator isActive={false} />);
    
    const indicator = screen.getByText('⚡').parentElement;
    expect(indicator).toHaveClass('bg-gray-300');
    expect(screen.getByText('⚡')).toHaveClass('text-gray-500');
  });

  it('shows correct tooltip for active boost', () => {
    render(<BoostIndicator isActive={true} />);
    
    const indicator = screen.getByText('⚡').parentElement;
    expect(indicator).toHaveAttribute('title', 'Boost Ativo!');
  });

  it('shows correct tooltip for inactive boost', () => {
    render(<BoostIndicator isActive={false} />);
    
    const indicator = screen.getByText('⚡').parentElement;
    expect(indicator).toHaveAttribute('title', 'Boost Inativo');
  });

  it('applies custom className', () => {
    render(<BoostIndicator isActive={true} className="custom-boost" />);
    
    const indicator = screen.getByText('⚡').parentElement;
    expect(indicator).toHaveClass('custom-boost');
  });

  it('does not have cursor-pointer class (not clickable)', () => {
    render(<BoostIndicator isActive={true} />);
    
    const indicator = screen.getByText('⚡').parentElement;
    expect(indicator).not.toHaveClass('cursor-pointer');
  });

  it('has proper styling for active boost with glow effect', () => {
    render(<BoostIndicator isActive={true} />);
    
    const indicator = screen.getByText('⚡').parentElement;
    expect(indicator).toHaveClass('animate-pulse');
    expect(indicator).toHaveClass('shadow-lg');
  });
});