import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AdminLayout } from '../AdminLayout';
import { AuthContext } from '../../../contexts/AuthContext';

// Mock the auth context
const mockAuthContext = {
  user: {
    id: 'admin-1',
    userName: 'Admin Test',
    role: 'admin' as const,
    name: 'Admin Test'
  },
  isAuthenticated: true,
  isPlayer: false,
  isAdmin: true,
  team: null,
  login: jest.fn(),
  logout: jest.fn(),
  loading: false
};

const MockAuthProvider = ({ children }: { children: React.ReactNode }) => (
  <AuthContext.Provider value={mockAuthContext}>
    {children}
  </AuthContext.Provider>
);

describe('AdminLayout', () => {
  const defaultProps = {
    children: <div data-testid="test-content">Test Content</div>
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders children content', () => {
    render(
      <MockAuthProvider>
        <AdminLayout {...defaultProps} />
      </MockAuthProvider>
    );

    expect(screen.getByTestId('test-content')).toBeInTheDocument();
  });

  it('renders with default dashboard section', () => {
    render(
      <MockAuthProvider>
        <AdminLayout {...defaultProps} />
      </MockAuthProvider>
    );

    // Check if dashboard section is active in sidebar
    const dashboardLink = screen.getByText('Dashboard');
    expect(dashboardLink.closest('a')).toHaveClass('bg-gradient-to-r');
  });

  it('renders with custom current section', () => {
    render(
      <MockAuthProvider>
        <AdminLayout {...defaultProps} currentSection="players" />
      </MockAuthProvider>
    );

    // Check if players section is active in sidebar
    const playersLink = screen.getByText('Gerenciar Jogadores');
    expect(playersLink.closest('a')).toHaveClass('bg-gradient-to-r');
  });

  it('renders breadcrumb when items are provided', () => {
    const breadcrumbItems = [
      { label: 'Players', href: '/admin/players' },
      { label: 'Details', isActive: true }
    ];

    render(
      <MockAuthProvider>
        <AdminLayout {...defaultProps} breadcrumbItems={breadcrumbItems} />
      </MockAuthProvider>
    );

    expect(screen.getByText('Players')).toBeInTheDocument();
    expect(screen.getByText('Details')).toBeInTheDocument();
  });

  it('does not render breadcrumb when no items provided', () => {
    render(
      <MockAuthProvider>
        <AdminLayout {...defaultProps} />
      </MockAuthProvider>
    );

    // Breadcrumb navigation should not be present
    expect(screen.queryByRole('navigation', { name: /breadcrumb/i })).not.toBeInTheDocument();
  });

  it('toggles mobile sidebar when menu button is clicked', () => {
    render(
      <MockAuthProvider>
        <AdminLayout {...defaultProps} />
      </MockAuthProvider>
    );

    // Find mobile menu button
    const menuButton = screen.getByRole('button', { name: /menu/i });
    
    // Initially sidebar should be closed (translated)
    const sidebar = screen.getByText('Admin Panel').closest('div');
    expect(sidebar).toHaveClass('-translate-x-full');

    // Click menu button to open sidebar
    fireEvent.click(menuButton);
    expect(sidebar).toHaveClass('translate-x-0');

    // Click menu button again to close sidebar
    fireEvent.click(menuButton);
    expect(sidebar).toHaveClass('-translate-x-full');
  });

  it('closes mobile sidebar when overlay is clicked', () => {
    render(
      <MockAuthProvider>
        <AdminLayout {...defaultProps} />
      </MockAuthProvider>
    );

    const menuButton = screen.getByRole('button', { name: /menu/i });
    
    // Open sidebar
    fireEvent.click(menuButton);
    
    // Find and click overlay
    const overlay = document.querySelector('.bg-black.bg-opacity-50');
    expect(overlay).toBeInTheDocument();
    
    fireEvent.click(overlay!);
    
    // Sidebar should be closed
    const sidebar = screen.getByText('Admin Panel').closest('div');
    expect(sidebar).toHaveClass('-translate-x-full');
  });

  it('applies correct responsive classes', () => {
    render(
      <MockAuthProvider>
        <AdminLayout {...defaultProps} />
      </MockAuthProvider>
    );

    // Check main content area has correct responsive padding
    const mainContent = screen.getByRole('main');
    expect(mainContent).toHaveClass('lg:pl-64');
  });

  it('renders admin header with correct props', () => {
    render(
      <MockAuthProvider>
        <AdminLayout {...defaultProps} />
      </MockAuthProvider>
    );

    // Check if admin header elements are present
    expect(screen.getByText('Painel Administrativo')).toBeInTheDocument();
    expect(screen.getByText('Sistema de Gamificação O Boticário')).toBeInTheDocument();
  });

  it('has correct background gradient', () => {
    render(
      <MockAuthProvider>
        <AdminLayout {...defaultProps} />
      </MockAuthProvider>
    );

    const container = screen.getByTestId('test-content').closest('.min-h-screen');
    expect(container).toHaveClass('bg-gradient-to-br', 'from-pink-50', 'via-purple-50', 'to-pink-100');
  });
});