import React from 'react';
import { render, screen, fireEvent, mockLocalStorage } from '../../../__tests__/test-utils';
import { AdminHeader } from '../AdminHeader';

describe('AdminHeader', () => {
  const defaultProps = {
    onMenuClick: jest.fn()
  };

  const testUser = {
    id: 'admin-1',
    userName: 'Admin Test',
    role: { isAdmin: true, isPlayer: false },
    team: null
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders header title and description', () => {
    render(<AdminHeader {...defaultProps} />, { user: testUser });

    expect(screen.getByText('Painel Administrativo')).toBeInTheDocument();
    expect(screen.getByText('Sistema de Gamificação O Boticário')).toBeInTheDocument();
  });

  it('displays user information', () => {
    render(<AdminHeader {...defaultProps} />, { user: testUser });

    expect(screen.getByText('Admin Test')).toBeInTheDocument();
    expect(screen.getByText('Administrador')).toBeInTheDocument();
    expect(screen.getByText('A')).toBeInTheDocument(); // User initial
  });

  it('calls onMenuClick when mobile menu button is clicked', () => {
    const onMenuClickMock = jest.fn();
    
    render(<AdminHeader onMenuClick={onMenuClickMock} />, { user: testUser });

    const menuButton = screen.getByLabelText('Open menu');
    fireEvent.click(menuButton);

    expect(onMenuClickMock).toHaveBeenCalledTimes(1);
  });

  it('shows system status indicator', () => {
    render(<AdminHeader {...defaultProps} />, { user: testUser });

    expect(screen.getByText('Sistema Online')).toBeInTheDocument();
    
    // Check for the green status indicator
    const statusIndicator = screen.getByText('Sistema Online').previousElementSibling;
    expect(statusIndicator).toHaveClass('w-2', 'h-2', 'bg-green-500', 'rounded-full', 'animate-pulse');
  });

  it('displays notification button with badge', () => {
    render(<AdminHeader {...defaultProps} />, { user: testUser });

    const notificationButton = screen.getByLabelText('Notifications');
    expect(notificationButton).toBeInTheDocument();
    
    // Check for notification badge
    const badge = notificationButton.querySelector('.bg-red-500');
    expect(badge).toBeInTheDocument();
  });

  it('renders secondary header with quick stats', () => {
    render(<AdminHeader {...defaultProps} />, { user: testUser });

    expect(screen.getByText(/Jogadores Ativos:/)).toBeInTheDocument();
    expect(screen.getByText(/Relatórios Hoje:/)).toBeInTheDocument();
    expect(screen.getByText(/Última Sincronização:/)).toBeInTheDocument();
  });

  it('displays current date in Portuguese format', () => {
    render(<AdminHeader {...defaultProps} />, { user: testUser });

    // Check if date is displayed (format will depend on current date)
    const dateElement = screen.getByText(/\d{4}/); // Look for year
    expect(dateElement).toBeInTheDocument();
  });

  it('has correct sticky positioning', () => {
    render(<AdminHeader {...defaultProps} />, { user: testUser });

    const header = screen.getByRole('banner');
    expect(header).toHaveClass('sticky', 'top-0', 'z-30');
  });

  it('applies correct responsive classes for mobile menu button', () => {
    render(<AdminHeader {...defaultProps} />, { user: testUser });

    const menuButton = screen.getByLabelText('Open menu');
    expect(menuButton).toHaveClass('lg:hidden');
  });

  it('hides user info on small screens', () => {
    render(<AdminHeader {...defaultProps} />, { user: testUser });

    const userInfoContainer = screen.getByText('Admin Test').closest('div');
    expect(userInfoContainer).toHaveClass('hidden', 'sm:block');
  });

  it('hides system status on small screens', () => {
    render(<AdminHeader {...defaultProps} />, { user: testUser });

    const statusContainer = screen.getByText('Sistema Online').closest('div');
    expect(statusContainer).toHaveClass('hidden', 'sm:flex');
  });

  it('hides secondary header on small screens', () => {
    render(<AdminHeader {...defaultProps} />, { user: testUser });

    const secondaryHeader = screen.getByText(/Jogadores Ativos:/).closest('.hidden.lg\\:block');
    expect(secondaryHeader).toHaveClass('hidden', 'lg:block');
  });

  it('handles user without userName gracefully', () => {
    const userWithoutName = {
      id: 'admin-1',
      userName: undefined,
      role: { isAdmin: true, isPlayer: false },
      team: null
    };

    render(<AdminHeader {...defaultProps} />, { user: userWithoutName });

    expect(screen.getAllByText('Administrador')).toHaveLength(2); // User name and role
    expect(screen.getByText('A')).toBeInTheDocument(); // Default initial
  });

  it('has correct background and styling', () => {
    render(<AdminHeader {...defaultProps} />, { user: testUser });

    const header = screen.getByRole('banner');
    expect(header).toHaveClass('bg-white', 'shadow-sm', 'border-b', 'border-gray-200');
  });
});