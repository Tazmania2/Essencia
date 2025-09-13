import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { LoadingButton } from '../LoadingButton';

describe('LoadingButton', () => {
  it('renders children when not loading', () => {
    render(<LoadingButton>Click me</LoadingButton>);
    
    expect(screen.getByText('Click me')).toBeInTheDocument();
    expect(screen.queryByRole('img', { hidden: true })).not.toBeInTheDocument();
  });

  it('shows loading spinner when loading', () => {
    render(<LoadingButton loading>Click me</LoadingButton>);
    
    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('shows loading text when provided', () => {
    render(
      <LoadingButton loading loadingText="Loading...">
        Click me
      </LoadingButton>
    );
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('Click me')).not.toBeInTheDocument();
  });

  it('is disabled when loading', () => {
    render(<LoadingButton loading>Click me</LoadingButton>);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('is disabled when disabled prop is true', () => {
    render(<LoadingButton disabled>Click me</LoadingButton>);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('handles click events when not loading', () => {
    const handleClick = jest.fn();
    render(<LoadingButton onClick={handleClick}>Click me</LoadingButton>);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not handle click events when loading', () => {
    const handleClick = jest.fn();
    render(
      <LoadingButton loading onClick={handleClick}>
        Click me
      </LoadingButton>
    );
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('applies primary variant styles by default', () => {
    render(<LoadingButton>Click me</LoadingButton>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-pink-600', 'text-white');
  });

  it('applies secondary variant styles', () => {
    render(<LoadingButton variant="secondary">Click me</LoadingButton>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-purple-600', 'text-white');
  });

  it('applies outline variant styles', () => {
    render(<LoadingButton variant="outline">Click me</LoadingButton>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('border', 'border-gray-300', 'text-gray-700');
  });

  it('applies ghost variant styles', () => {
    render(<LoadingButton variant="ghost">Click me</LoadingButton>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('text-gray-700');
  });

  it('applies small size styles', () => {
    render(<LoadingButton size="sm">Click me</LoadingButton>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('px-3', 'py-1.5', 'text-sm');
  });

  it('applies medium size styles by default', () => {
    render(<LoadingButton>Click me</LoadingButton>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('px-4', 'py-2', 'text-sm');
  });

  it('applies large size styles', () => {
    render(<LoadingButton size="lg">Click me</LoadingButton>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('px-6', 'py-3', 'text-base');
  });

  it('applies custom className', () => {
    render(<LoadingButton className="custom-class">Click me</LoadingButton>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });

  it('shows appropriate spinner color for outline variant', () => {
    render(
      <LoadingButton loading variant="outline">
        Click me
      </LoadingButton>
    );
    
    const spinner = screen.getByRole('img', { hidden: true });
    expect(spinner).toHaveClass('text-gray-600');
  });

  it('shows white spinner for primary variant', () => {
    render(
      <LoadingButton loading variant="primary">
        Click me
      </LoadingButton>
    );
    
    const spinner = screen.getByRole('img', { hidden: true });
    expect(spinner).toHaveClass('text-white');
  });
});