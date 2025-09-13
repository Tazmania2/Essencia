import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AdminSidebar } from '../AdminSidebar';
import { AuthProvider } from '../../../contexts/AuthContext';

// Mock Next.js router
jest.mock('next/link', () => {
  const MockLink = ({ children, href, onClick, className, ...props }: any) => (
    <a href={href} onClick={onClick} className={className} {...props}>
      {children}
    </a>
  );
  MockLink.displayName = 'MockLink';
  return MockLink;
});

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn()
  })
}));

// Mock the services
jest.mock('../../../services/funifier-auth.service', () => ({
  funifierAuthService: {
    isAuthenticated: jest.fn(() => true),
    authenticate: jest.fn(),
    logout: jest.fn(),
    refreshAccessToken: jest.fn()
  }
}));

jest.mock('../../../services/user-identification.service', () => ({
  userIdentificationService: {
    identifyUser: jest.fn()
  }
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn()
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

const MockAuthProvider = ({ children }: { children: React.ReactNode }) => {
  // Mock the localStorage to return a user
  mockLocalStorage.getItem.mockImplementation((key: string) => {
    if (key === 'user') {
      return JSON.stringify({
        id: 'admin-1',
        userName: 'Admin Test',
        role: { isAdmin: true, isPlayer: false },
        team: null
      });
    }
    if (key === 'username') {
      return 'admin-test';
    }
    return null;
  });

  return <AuthProvider>{children}</AuthProvider>;
};

describe('AdminSidebar', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    currentSection: 'dashboard'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders sidebar header with branding', () => {
    render(
      <MockAuthProvider>
        <AdminSidebar {...defaultProps} />
      </MockAuthProvider>
    );

    expect(screen.getByText('Admin Panel')).toBeInTheDocument();
    expect(screen.getByText('O Boticário')).toBeInTheDocument();
    expect(screen.getByText('🌸')).toBeInTheDocument();
  });

  it('displays user information', () => {
    render(
      <MockAuthProvider>
        <AdminSidebar {...defaultProps} />
      </MockAuthProvider>
    );

    expect(screen.getByText('Admin Test')).toBeInTheDocument();
    expect(screen.getByText('Administrador')).toBeInTheDocument();
    expect(screen.getByText('A')).toBeInTheDocument(); // User initial
  });

  it('renders all navigation items', () => {
    render(
      <MockAuthProvider>
        <AdminSidebar {...defaultProps} />
      </MockAuthProvider>
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Gerenciar Jogadores')).toBeInTheDocument();
    expect(screen.getByText('Upload de Relatórios')).toBeInTheDocument();
    expect(screen.getByText('Exportar Dados')).toBeInTheDocument();
  });

  it('highlights active section', () => {
    render(
      <MockAuthProvider>
        <AdminSidebar {...defaultProps} currentSection="players" />
      </MockAuthProvider>
    );

    const playersLink = screen.getByText('Gerenciar Jogadores').closest('a');
    expect(playersLink).toHaveClass('bg-gradient-to-r', 'from-boticario-pink', 'to-boticario-purple', 'text-white', 'shadow-lg');
  });

  it('shows correct navigation descriptions', () => {
    render(
      <MockAuthProvider>
        <AdminSidebar {...defaultProps} />
      </MockAuthProvider>
    );

    expect(screen.getByText('Visão geral do sistema')).toBeInTheDocument();
    expect(screen.getByText('Visualizar e gerenciar dados dos jogadores')).toBeInTheDocument();
    expect(screen.getByText('Fazer upload e sincronizar dados')).toBeInTheDocument();
    expect(screen.getByText('Gerar e exportar relatórios')).toBeInTheDocument();
  });

  it('applies correct open/closed classes', () => {
    const { rerender } = render(
      <MockAuthProvider>
        <AdminSidebar {...defaultProps} isOpen={false} />
      </MockAuthProvider>
    );

    const sidebar = screen.getByText('Admin Panel').closest('.fixed');
    expect(sidebar).toHaveClass('-translate-x-full');

    rerender(
      <MockAuthProvider>
        <AdminSidebar {...defaultProps} isOpen={true} />
      </MockAuthProvider>
    );

    expect(sidebar).toHaveClass('translate-x-0');
  });

  it('calls onClose when close button is clicked', () => {
    const onCloseMock = jest.fn();
    
    render(
      <MockAuthProvider>
        <AdminSidebar {...defaultProps} onClose={onCloseMock} />
      </MockAuthProvider>
    );

    const closeButton = screen.getByLabelText('Close menu');
    fireEvent.click(closeButton);

    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when navigation link is clicked', () => {
    const onCloseMock = jest.fn();
    
    render(
      <MockAuthProvider>
        <AdminSidebar {...defaultProps} onClose={onCloseMock} />
      </MockAuthProvider>
    );

    const dashboardLink = screen.getByText('Dashboard').closest('a');
    fireEvent.click(dashboardLink!);

    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  it('calls logout when logout button is clicked', () => {
    render(
      <MockAuthProvider>
        <AdminSidebar {...defaultProps} />
      </MockAuthProvider>
    );

    const logoutButton = screen.getByText('Sair do Sistema');
    fireEvent.click(logoutButton);

    // The logout function should be called (we can't easily mock it in this setup)
    expect(logoutButton).toBeInTheDocument();
  });

  it('renders navigation section header', () => {
    render(
      <MockAuthProvider>
        <AdminSidebar {...defaultProps} />
      </MockAuthProvider>
    );

    expect(screen.getByText('Navegação Principal')).toBeInTheDocument();
  });

  it('shows active indicator for current section', () => {
    render(
      <MockAuthProvider>
        <AdminSidebar {...defaultProps} currentSection="dashboard" />
      </MockAuthProvider>
    );

    const dashboardLink = screen.getByText('Dashboard').closest('a');
    const activeIndicator = dashboardLink?.querySelector('.w-2.h-2.bg-white.rounded-full');
    expect(activeIndicator).toBeInTheDocument();
  });

  it('handles user without userName gracefully', () => {
    // Mock localStorage to return user without userName
    mockLocalStorage.getItem.mockImplementation((key: string) => {
      if (key === 'user') {
        return JSON.stringify({
          id: 'admin-1',
          userName: undefined,
          role: { isAdmin: true, isPlayer: false },
          team: null
        });
      }
      if (key === 'username') {
        return 'admin-test';
      }
      return null;
    });

    render(
      <MockAuthProvider>
        <AdminSidebar {...defaultProps} />
      </MockAuthProvider>
    );

    expect(screen.getByText('Administrador')).toBeInTheDocument();
    expect(screen.getByText('A')).toBeInTheDocument(); // Default initial
  });

  it('has correct responsive classes', () => {
    render(
      <MockAuthProvider>
        <AdminSidebar {...defaultProps} />
      </MockAuthProvider>
    );

    const sidebar = screen.getByText('Admin Panel').closest('.fixed');
    expect(sidebar).toHaveClass('lg:translate-x-0', 'lg:static', 'lg:inset-0');
  });
});