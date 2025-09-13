import React from 'react';
import { render, screen } from '@testing-library/react';
import { LoadingSpinner } from '../LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders with default props', () => {
    render(<LoadingSpinner />);
    
    const spinner = screen.getByRole('img', { hidden: true });
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('w-6', 'h-6', 'text-pink-600');
  });

  it('renders with custom size', () => {
    render(<LoadingSpinner size="lg" />);
    
    const spinner = screen.getByRole('img', { hidden: true });
    expect(spinner).toHaveClass('w-8', 'h-8');
  });

  it('renders with custom color', () => {
    render(<LoadingSpinner color="white" />);
    
    const spinner = screen.getByRole('img', { hidden: true });
    expect(spinner).toHaveClass('text-white');
  });

  it('applies custom className', () => {
    render(<LoadingSpinner className="custom-class" />);
    
    const container = screen.getByRole('img', { hidden: true }).parentElement;
    expect(container).toHaveClass('custom-class');
  });

  it('has spinning animation', () => {
    render(<LoadingSpinner />);
    
    const spinner = screen.getByRole('img', { hidden: true });
    expect(spinner).toHaveClass('animate-spin');
  });

  it('renders all size variants correctly', () => {
    const sizes = ['sm', 'md', 'lg', 'xl'] as const;
    const expectedClasses = ['w-4 h-4', 'w-6 h-6', 'w-8 h-8', 'w-12 h-12'];

    sizes.forEach((size, index) => {
      const { unmount } = render(<LoadingSpinner size={size} />);
      
      const spinner = screen.getByRole('img', { hidden: true });
      const [widthClass, heightClass] = expectedClasses[index].split(' ');
      
      expect(spinner).toHaveClass(widthClass, heightClass);
      
      unmount();
    });
  });

  it('renders all color variants correctly', () => {
    const colors = ['primary', 'secondary', 'white', 'gray'] as const;
    const expectedClasses = ['text-pink-600', 'text-purple-600', 'text-white', 'text-gray-600'];

    colors.forEach((color, index) => {
      const { unmount } = render(<LoadingSpinner color={color} />);
      
      const spinner = screen.getByRole('img', { hidden: true });
      expect(spinner).toHaveClass(expectedClasses[index]);
      
      unmount();
    });
  });
});