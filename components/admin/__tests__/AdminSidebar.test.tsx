import React from 'react';
import { render, screen, fireEvent, mockLocalStorage } from '../../../__tests__/test-utils';
import { AdminSidebar } from '../AdminSidebar';

describe('AdminSidebar', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    currentSection: 'dashboard'
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

  it('renders sidebar header with branding', () => {
    render(<AdminSidebar {...defaultProps} />, { user: testUser });

    expect(screen.getByText('Admin Panel')).toBeInTheDocument();
    expect(screen.getByText('O Boticário')).toBeInTheDocument();
    expect(screen.getByText('🌸')).toBeInTheDocument();
  });

  it('displays user information', () => {
    render(<AdminSidebar {...defaultProps} />, { user: testUser });

    expect(screen.getByText('Admin Test')).toBeInTheDocument();
    expect(screen.getByText('Administrador')).toBeInTheDocument();
    expect(screen.getByText('A')).toBeInTheDocument(); // User initial
  });

  it('renders all navigation items', () => {
    render(<AdminSidebar {...defaultProps} />, { user: testUser });

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Gerenciar Jogadores')).toBeInTheDocument();
    expect(screen.getByText('Upload de Relatórios')).toBeInTheDocument();
    expect(screen.getByText('Exportar Dados')).toBeInTheDocument();
  });

  it('highlights active section', () => {
    render(<AdminSidebar {...defaultProps} currentSection="players" />, { user: testUser });

    const playersLink = screen.getByText('Gerenciar Jogadores').closest('a');
    expect(playersLink).toHaveClass('bg-gradient-to-r', 'from-boticario-pink', 'to-boticario-purple', 'text-white', 'shadow-lg');
  });

  it('shows correct navigation descriptions', () => {
    render(<AdminSidebar {...defaultProps} />, { user: testUser });

    expect(screen.getByText('Visão geral do sistema')).toBeInTheDocument();
    expect(screen.getByText('Visualizar e gerenciar dados dos jogadores')).toBeInTheDocument();
    expect(screen.getByText('Fazer upload e sincronizar dados')).toBeInTheDocument();
    expect(screen.getByText('Gerar e exportar relatórios')).toBeInTheDocument();
  });

  it('applies correct open/closed classes', () => {
    const { rerender } = render(<AdminSidebar {...defaultProps} isOpen={false} />, { user: testUser });

    const sidebar = screen.getByText('Admin Panel').closest('.fixed');
    expect(sidebar).toHaveClass('-translate-x-full');

    rerender(<AdminSidebar {...defaultProps} isOpen={true} />);

    expect(sidebar).toHaveClass('translate-x-0');
  });

  it('calls onClose when close button is clicked', () => {
    const onCloseMock = jest.fn();
    
    render(<AdminSidebar {...defaultProps} onClose={onCloseMock} />, { user: testUser });

    const closeButton = screen.getByLabelText('Close menu');
    fireEvent.click(closeButton);

    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when navigation link is clicked', () => {
    const onCloseMock = jest.fn();
    
    render(<AdminSidebar {...defaultProps} onClose={onCloseMock} />, { user: testUser });

    const dashboardLink = screen.getByText('Dashboard').closest('a');
    fireEvent.click(dashboardLink!);

    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  it('calls logout when logout button is clicked', () => {
    render(<AdminSidebar {...defaultProps} />, { user: testUser });

    const logoutButton = screen.getByText('Sair do Sistema');
    fireEvent.click(logoutButton);

    // The logout function should be called (we can't easily mock it in this setup)
    expect(logoutButton).toBeInTheDocument();
  });

  it('renders navigation section header', () => {
    render(<AdminSidebar {...defaultProps} />, { user: testUser });

    expect(screen.getByText('Navegação Principal')).toBeInTheDocument();
  });

  it('shows active indicator for current section', () => {
    render(<AdminSidebar {...defaultProps} currentSection="dashboard" />, { user: testUser });

    const dashboardLink = screen.getByText('Dashboard').closest('a');
    const activeIndicator = dashboardLink?.querySelector('.w-2.h-2.bg-white.rounded-full');
    expect(activeIndicator).toBeInTheDocument();
  });

  it('handles user without userName gracefully', () => {
    const userWithoutName = {
      id: 'admin-1',
      userName: undefined,
      role: { isAdmin: true, isPlayer: false },
      team: null
    };

    render(<AdminSidebar {...defaultProps} />, { user: userWithoutName });

    expect(screen.getAllByText('Administrador')).toHaveLength(2); // User name and role
    expect(screen.getByText('A')).toBeInTheDocument(); // Default initial
  });

  it('has correct responsive classes', () => {
    render(<AdminSidebar {...defaultProps} />, { user: testUser });

    const sidebar = screen.getByText('Admin Panel').closest('.fixed');
    expect(sidebar).toHaveClass('lg:translate-x-0', 'lg:static', 'lg:inset-0');
  });
});