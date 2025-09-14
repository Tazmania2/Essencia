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

  it('has cursor-default class and proper hover behavior', () => {
    render(<BoostIndicator isActive={true} />);
    
    const indicator = screen.getByText('⚡').parentElement;
    expect(indicator).toHaveClass('cursor-default');
    expect(indicator).toHaveClass('select-none');
    expect(indicator).toHaveClass('hover:scale-110');
  });

  it('has proper styling for active boost with glow effect', () => {
    render(<BoostIndicator isActive={true} />);
    
    const indicator = screen.getByText('⚡').parentElement;
    expect(indicator).toHaveClass('animate-pulse');
    expect(indicator).toHaveClass('shadow-lg');
  });

  it('has proper accessibility attributes', () => {
    render(<BoostIndicator isActive={true} />);
    
    const indicator = screen.getByText('⚡').parentElement;
    expect(indicator).toHaveAttribute('role', 'img');
    expect(indicator).toHaveAttribute('aria-label', 'Boost Ativo!');
  });

  it('prevents text selection on the icon', () => {
    render(<BoostIndicator isActive={true} />);
    
    const icon = screen.getByText('⚡');
    expect(icon).toHaveClass('pointer-events-none');
  });
});