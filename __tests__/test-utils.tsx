import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { AuthProvider } from '../contexts/AuthContext';

// Mock Next.js router for testing
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/test-path',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock the services for testing
jest.mock('../services/funifier-auth.service', () => ({
  funifierAuthService: {
    isAuthenticated: jest.fn(() => true),
    authenticate: jest.fn(),
    logout: jest.fn(),
    refreshAccessToken: jest.fn()
  }
}));

jest.mock('../services/user-identification.service', () => ({
  userIdentificationService: {
    identifyUser: jest.fn()
  }
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

// Test wrapper with AuthProvider
interface TestWrapperProps {
  children: React.ReactNode;
  user?: any;
}

const TestWrapper: React.FC<TestWrapperProps> = ({ children, user }) => {
  // Mock localStorage to return test user data
  mockLocalStorage.getItem.mockImplementation((key: string) => {
    if (key === 'user') {
      return JSON.stringify(user || {
        id: 'test-user-1',
        userName: 'Test User',
        role: { isAdmin: true, isPlayer: false },
        team: null
      });
    }
    if (key === 'username') {
      return 'test-user';
    }
    return null;
  });

  return <AuthProvider>{children}</AuthProvider>;
};

// Custom render function that includes providers
const customRender = (
  ui: React.ReactElement,
  options?: RenderOptions & { user?: any }
) => {
  const { user, ...renderOptions } = options || {};
  
  return render(ui, {
    wrapper: ({ children }) => <TestWrapper user={user}>{children}</TestWrapper>,
    ...renderOptions,
  });
};

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };
export { mockLocalStorage };