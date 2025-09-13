import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AdminHeader } from '../AdminHeader';
import { AuthProvider } from '../../../contexts/AuthContext';

// Mock Next.js router
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

describe('AdminHeader', () => {
  const defaultProps = {
    onMenuClick: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders header title and description', () => {
    render(
      <MockAuthProvider>
        <AdminHeader {...defaultProps} />
      </MockAuthProvider>
    );

    expect(screen.getByText('Painel Administrativo')).toBeInTheDocument();
    expect(screen.getByText('Sistema de Gamificação O Boticário')).toBeInTheDocument();
  });

  it('displays user information', () => {
    render(
      <MockAuthProvider>
        <AdminHeader {...defaultProps} />
      </MockAuthProvider>
    );

    expect(screen.getByText('Admin Test')).toBeInTheDocument();
    expect(screen.getByText('Administrador')).toBeInTheDocument();
    expect(screen.getByText('A')).toBeInTheDocument(); // User initial
  });

  it('calls onMenuClick when mobile menu button is clicked', () => {
    const onMenuClickMock = jest.fn();
    
    render(
      <MockAuthProvider>
        <AdminHeader onMenuClick={onMenuClickMock} />
      </MockAuthProvider>
    );

    const menuButton = screen.getByLabelText('Open menu');
    fireEvent.click(menuButton);

    expect(onMenuClickMock).toHaveBeenCalledTimes(1);
  });

  it('shows system status indicator', () => {
    render(
      <MockAuthProvider>
        <AdminHeader {...defaultProps} />
      </MockAuthProvider>
    );

    expect(screen.getByText('Sistema Online')).toBeInTheDocument();
    
    // Check for the green status indicator
    const statusIndicator = screen.getByText('Sistema Online').previousElementSibling;
    expect(statusIndicator).toHaveClass('w-2', 'h-2', 'bg-green-500', 'rounded-full', 'animate-pulse');
  });

  it('displays notification button with badge', () => {
    render(
      <MockAuthProvider>
        <AdminHeader {...defaultProps} />
      </MockAuthProvider>
    );

    const notificationButton = screen.getByLabelText('Notifications');
    expect(notificationButton).toBeInTheDocument();
    
    // Check for notification badge
    const badge = notificationButton.querySelector('.bg-red-500');
    expect(badge).toBeInTheDocument();
  });

  it('renders secondary header with quick stats', () => {
    render(
      <MockAuthProvider>
        <AdminHeader {...defaultProps} />
      </MockAuthProvider>
    );

    expect(screen.getByText(/Jogadores Ativos:/)).toBeInTheDocument();
    expect(screen.getByText(/Relatórios Hoje:/)).toBeInTheDocument();
    expect(screen.getByText(/Última Sincronização:/)).toBeInTheDocument();
  });

  it('displays current date in Portuguese format', () => {
    render(
      <MockAuthProvider>
        <AdminHeader {...defaultProps} />
      </MockAuthProvider>
    );

    // Check if date is displayed (format will depend on current date)
    const dateElement = screen.getByText(/\d{4}/); // Look for year
    expect(dateElement).toBeInTheDocument();
  });

  it('has correct sticky positioning', () => {
    render(
      <MockAuthProvider>
        <AdminHeader {...defaultProps} />
      </MockAuthProvider>
    );

    const header = screen.getByRole('banner');
    expect(header).toHaveClass('sticky', 'top-0', 'z-30');
  });

  it('applies correct responsive classes for mobile menu button', () => {
    render(
      <MockAuthProvider>
        <AdminHeader {...defaultProps} />
      </MockAuthProvider>
    );

    const menuButton = screen.getByLabelText('Open menu');
    expect(menuButton).toHaveClass('lg:hidden');
  });

  it('hides user info on small screens', () => {
    render(
      <MockAuthProvider>
        <AdminHeader {...defaultProps} />
      </MockAuthProvider>
    );

    const userInfoContainer = screen.getByText('Admin Test').closest('div');
    expect(userInfoContainer).toHaveClass('hidden', 'sm:block');
  });

  it('hides system status on small screens', () => {
    render(
      <MockAuthProvider>
        <AdminHeader {...defaultProps} />
      </MockAuthProvider>
    );

    const statusContainer = screen.getByText('Sistema Online').closest('div');
    expect(statusContainer).toHaveClass('hidden', 'sm:flex');
  });

  it('hides secondary header on small screens', () => {
    render(
      <MockAuthProvider>
        <AdminHeader {...defaultProps} />
      </MockAuthProvider>
    );

    const secondaryHeader = screen.getByText(/Jogadores Ativos:/).closest('.hidden.lg\\:block');
    expect(secondaryHeader).toHaveClass('hidden', 'lg:block');
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
        <AdminHeader {...defaultProps} />
      </MockAuthProvider>
    );

    expect(screen.getByText('Administrador')).toBeInTheDocument();
    expect(screen.getByText('A')).toBeInTheDocument(); // Default initial
  });

  it('has correct background and styling', () => {
    render(
      <MockAuthProvider>
        <AdminHeader {...defaultProps} />
      </MockAuthProvider>
    );

    const header = screen.getByRole('banner');
    expect(header).toHaveClass('bg-white', 'shadow-sm', 'border-b', 'border-gray-200');
  });
});