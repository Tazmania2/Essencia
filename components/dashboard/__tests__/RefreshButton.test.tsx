import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { RefreshButton } from '../RefreshButton';

describe('RefreshButton', () => {
  const mockOnRefresh = jest.fn();
  const defaultProps = {
    onRefresh: mockOnRefresh,
    loading: false,
    lastUpdated: new Date('2024-01-15T10:00:00Z')
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders refresh button with status', () => {
    render(<RefreshButton {...defaultProps} />);
    
    expect(screen.getByText('Atualizar')).toBeInTheDocument();
    expect(screen.getByText('Dados atualizados')).toBeInTheDocument();
    expect(screen.getByText('✅')).toBeInTheDocument();
  });

  it('shows loading state correctly', () => {
    render(<RefreshButton {...defaultProps} loading={true} />);
    
    expect(screen.getAllByText('Atualizando...').length).toBeGreaterThan(0);
    expect(screen.getByText('🔄')).toBeInTheDocument();
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveClass('cursor-not-allowed');
  });

  it('calls onRefresh when button is clicked', async () => {
    mockOnRefresh.mockResolvedValue(undefined);
    render(<RefreshButton {...defaultProps} />);
    
    const button = screen.getByRole('button', { name: /atualizar/i });
    fireEvent.click(button);
    
    expect(mockOnRefresh).toHaveBeenCalledTimes(1);
  });

  it('does not call onRefresh when loading', () => {
    render(<RefreshButton {...defaultProps} loading={true} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(mockOnRefresh).not.toHaveBeenCalled();
  });

  it('formats last updated time correctly', () => {
    const oneHourAgo = new Date(Date.now() - (60 * 60 * 1000));
    render(<RefreshButton {...defaultProps} lastUpdated={oneHourAgo} />);
    
    expect(screen.getByText(/há 1h/)).toBeInTheDocument();
  });

  it('shows \"agora mesmo\" for very recent updates', () => {
    const justNow = new Date(Date.now() - 30000); // 30 seconds ago
    render(<RefreshButton {...defaultProps} lastUpdated={justNow} />);
    
    expect(screen.getByText(/agora mesmo/)).toBeInTheDocument();
  });

  it('shows auto-refresh information', () => {
    render(<RefreshButton {...defaultProps} />);
    
    expect(screen.getByText('Atualização automática: diária')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <RefreshButton {...defaultProps} className="custom-class" />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('shows correct tooltip text', () => {
    render(<RefreshButton {...defaultProps} />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('title', 'Atualizar dados do Funifier');
  });

  it('shows loading tooltip when loading', () => {
    render(<RefreshButton {...defaultProps} loading={true} />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('title', 'Atualizando dados...');
  });

  it('handles null lastUpdated gracefully', () => {
    render(<RefreshButton {...defaultProps} lastUpdated={null} />);
    
    expect(screen.getByText('Dados atualizados')).toBeInTheDocument();
    expect(screen.queryByText(/Última atualização/)).not.toBeInTheDocument();
  });
});