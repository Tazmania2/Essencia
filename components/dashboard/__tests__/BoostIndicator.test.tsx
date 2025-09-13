import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
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

  it('calls onClick when clicked', () => {
    const mockOnClick = jest.fn();
    render(<BoostIndicator isActive={true} onClick={mockOnClick} />);
    
    const indicator = screen.getByText('⚡').parentElement;
    fireEvent.click(indicator!);
    
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('applies custom className', () => {
    render(<BoostIndicator isActive={true} className="custom-boost" />);
    
    const indicator = screen.getByText('⚡').parentElement;
    expect(indicator).toHaveClass('custom-boost');
  });

  it('has cursor-pointer class for interactivity', () => {
    render(<BoostIndicator isActive={true} />);
    
    const indicator = screen.getByText('⚡').parentElement;
    expect(indicator).toHaveClass('cursor-pointer');
  });
});