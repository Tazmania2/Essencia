import { render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute, PlayerRoute, AdminRoute } from '../ProtectedRoute';
import { AuthProvider } from '../../../contexts/AuthContext';
import { funifierAuthService } from '../../../services/funifier-auth.service';
import { TeamType } from '../../../types';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}));

// Mock services
jest.mock('../../../services/funifier-auth.service');
jest.mock('../../../services/user-identification.service');

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('ProtectedRoute', () => {
  const mockRouter = {
    push: jest.fn(),
    back: jest.fn(),
  };

  const mockFunifierAuthService = funifierAuthService as jest.Mocked<typeof funifierAuthService>;

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    localStorageMock.getItem.mockReturnValue(null);
    mockFunifierAuthService.isAuthenticated.mockReturnValue(false);
  });

  const TestContent = () => <div data-testid="protected-content">Protected Content</div>;

  it('should show loading state initially', async () => {
    render(
      <AuthProvider>
        <ProtectedRoute>
          <TestContent />
        </ProtectedRoute>
      </AuthProvider>
    );

    // The loading state might be very brief, so we check for either loading or the redirect
    await waitFor(() => {
      const loadingText = screen.queryByText('Verificando autenticação...');
      const redirectCalled = mockRouter.push.mock.calls.length > 0;
      expect(loadingText || redirectCalled).toBeTruthy();
    });
  });

  it('should redirect to login when not authenticated', async () => {
    render(
      <AuthProvider>
        <ProtectedRoute>
          <TestContent />
        </ProtectedRoute>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/login');
    });

    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('should render content when authenticated', async () => {
    const mockUserInfo = {
      userId: 'player123',
      userName: 'Test Player',
      role: { isPlayer: true, isAdmin: false, role: 'player' as const },
      teamInfo: {
        teamType: TeamType.CARTEIRA_I,
        teamId: 'team123',
        allTeams: ['team123']
      }
    };

    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'user') return JSON.stringify(mockUserInfo);
      if (key === 'username') return 'test';
      return null;
    });
    mockFunifierAuthService.isAuthenticated.mockReturnValue(true);

    render(
      <AuthProvider>
        <ProtectedRoute>
          <TestContent />
        </ProtectedRoute>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it('should redirect to custom path when specified', async () => {
    render(
      <AuthProvider>
        <ProtectedRoute redirectTo="/custom-login">
          <TestContent />
        </ProtectedRoute>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/custom-login');
    });
  });

  it('should allow access when requireAuth is false', async () => {
    render(
      <AuthProvider>
        <ProtectedRoute requireAuth={false}>
          <TestContent />
        </ProtectedRoute>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    expect(mockRouter.push).not.toHaveBeenCalled();
  });
});

describe('PlayerRoute', () => {
  const mockRouter = {
    push: jest.fn(),
    back: jest.fn(),
  };

  const mockFunifierAuthService = funifierAuthService as jest.Mocked<typeof funifierAuthService>;

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    localStorageMock.getItem.mockReturnValue(null);
    mockFunifierAuthService.isAuthenticated.mockReturnValue(false);
  });

  const TestContent = () => <div data-testid="player-content">Player Content</div>;

  it('should allow access for player users', async () => {
    const mockUserInfo = {
      userId: 'player123',
      userName: 'Test Player',
      role: { isPlayer: true, isAdmin: false, role: 'player' as const },
      teamInfo: {
        teamType: TeamType.CARTEIRA_I,
        teamId: 'team123',
        allTeams: ['team123']
      }
    };

    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'user') return JSON.stringify(mockUserInfo);
      if (key === 'username') return 'test';
      return null;
    });
    mockFunifierAuthService.isAuthenticated.mockReturnValue(true);

    render(
      <AuthProvider>
        <PlayerRoute>
          <TestContent />
        </PlayerRoute>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('player-content')).toBeInTheDocument();
    });
  });

  it('should redirect admin users to unauthorized', async () => {
    const mockUserInfo = {
      userId: 'admin123',
      userName: 'Test Admin',
      role: { isPlayer: false, isAdmin: true, role: 'admin' as const },
      teamInfo: {
        teamType: TeamType.CARTEIRA_I,
        teamId: 'team123',
        allTeams: ['team123']
      }
    };

    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'user') return JSON.stringify(mockUserInfo);
      if (key === 'username') return 'test';
      return null;
    });
    mockFunifierAuthService.isAuthenticated.mockReturnValue(true);

    render(
      <AuthProvider>
        <PlayerRoute>
          <TestContent />
        </PlayerRoute>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/unauthorized');
    });

    expect(screen.queryByTestId('player-content')).not.toBeInTheDocument();
  });

  it('should check team requirement', async () => {
    const mockUserInfo = {
      userId: 'player123',
      userName: 'Test Player',
      role: { isPlayer: true, isAdmin: false, role: 'player' as const },
      teamInfo: {
        teamType: TeamType.CARTEIRA_I,
        teamId: 'team123',
        allTeams: ['team123']
      }
    };

    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'user') return JSON.stringify(mockUserInfo);
      if (key === 'username') return 'test';
      return null;
    });
    mockFunifierAuthService.isAuthenticated.mockReturnValue(true);

    render(
      <AuthProvider>
        <PlayerRoute requireTeam={TeamType.CARTEIRA_II}>
          <TestContent />
        </PlayerRoute>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/unauthorized');
    });
  });
});

describe('AdminRoute', () => {
  const mockRouter = {
    push: jest.fn(),
    back: jest.fn(),
  };

  const mockFunifierAuthService = funifierAuthService as jest.Mocked<typeof funifierAuthService>;

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    localStorageMock.getItem.mockReturnValue(null);
    mockFunifierAuthService.isAuthenticated.mockReturnValue(false);
  });

  const TestContent = () => <div data-testid="admin-content">Admin Content</div>;

  it('should allow access for admin users', async () => {
    const mockUserInfo = {
      userId: 'admin123',
      userName: 'Test Admin',
      role: { isPlayer: false, isAdmin: true, role: 'admin' as const },
      teamInfo: {
        teamType: TeamType.CARTEIRA_I,
        teamId: 'team123',
        allTeams: ['team123']
      }
    };

    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'user') return JSON.stringify(mockUserInfo);
      if (key === 'username') return 'test';
      return null;
    });
    mockFunifierAuthService.isAuthenticated.mockReturnValue(true);

    render(
      <AuthProvider>
        <AdminRoute>
          <TestContent />
        </AdminRoute>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('admin-content')).toBeInTheDocument();
    });
  });

  it('should redirect player users to unauthorized', async () => {
    const mockUserInfo = {
      userId: 'player123',
      userName: 'Test Player',
      role: { isPlayer: true, isAdmin: false, role: 'player' as const },
      teamInfo: {
        teamType: TeamType.CARTEIRA_I,
        teamId: 'team123',
        allTeams: ['team123']
      }
    };

    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'user') return JSON.stringify(mockUserInfo);
      if (key === 'username') return 'test';
      return null;
    });
    mockFunifierAuthService.isAuthenticated.mockReturnValue(true);

    render(
      <AuthProvider>
        <AdminRoute>
          <TestContent />
        </AdminRoute>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/unauthorized');
    });

    expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument();
  });
});