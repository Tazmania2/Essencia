'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { funifierAuthService } from '../services/funifier-auth.service';
import { userIdentificationService, UserIdentification } from '../services/user-identification.service';
import { LoginCredentials, ApiError, ErrorType } from '../types';

interface AuthContextType {
  // Authentication state
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // User information
  user: UserIdentification | null;
  
  // Authentication methods
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  
  // Convenience getters
  isPlayer: boolean;
  isAdmin: boolean;
  
  // Token management
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<UserIdentification | null>(null);
  const router = useRouter();

  // Initialize authentication state on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  // Set up token refresh interval
  useEffect(() => {
    if (isAuthenticated) {
      const interval = setInterval(async () => {
        try {
          await refreshToken();
        } catch (error) {
          console.warn('Token refresh failed:', error);
          // Don't logout automatically on refresh failure
          // Let the user continue until they make a request that fails
        }
      }, 4 * 60 * 1000); // Refresh every 4 minutes

      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const initializeAuth = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Check if user is already authenticated
      if (funifierAuthService.isAuthenticated()) {
        // We don't have the username stored, so we can't re-identify the user
        // The user will need to login again
        setIsAuthenticated(true);
        // Note: In a real app, you might want to store user info in localStorage
        // or get it from a /me endpoint
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      setError('Erro ao inicializar autenticação');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      setError(null);

      // Authenticate with Funifier
      await funifierAuthService.authenticate(credentials);

      // Identify user role and team
      const userInfo = await userIdentificationService.identifyUser(credentials.username);

      // Update state
      setUser(userInfo);
      setIsAuthenticated(true);

      // Store user info in localStorage for persistence
      localStorage.setItem('user', JSON.stringify(userInfo));
      localStorage.setItem('username', credentials.username);

    } catch (err) {
      let errorMessage = 'Erro inesperado durante o login';

      if (err instanceof ApiError) {
        switch (err.type) {
          case ErrorType.AUTHENTICATION_ERROR:
            errorMessage = 'Credenciais inválidas. Verifique seu usuário e senha.';
            break;
          case ErrorType.NETWORK_ERROR:
            errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
            break;
          case ErrorType.FUNIFIER_API_ERROR:
            errorMessage = 'Erro no servidor. Tente novamente em alguns minutos.';
            break;
          default:
            errorMessage = 'Erro inesperado. Tente novamente.';
        }
      }

      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    try {
      // Clear authentication service
      funifierAuthService.logout();

      // Clear local state
      setIsAuthenticated(false);
      setUser(null);
      setError(null);

      // Clear localStorage
      localStorage.removeItem('user');
      localStorage.removeItem('username');

      // Redirect to login
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const refreshToken = async () => {
    try {
      await funifierAuthService.refreshAccessToken();
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw error;
    }
  };

  // Try to restore user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedUsername = localStorage.getItem('username');
    
    if (storedUser && storedUsername && funifierAuthService.isAuthenticated()) {
      try {
        const userInfo = JSON.parse(storedUser) as UserIdentification;
        setUser(userInfo);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Failed to restore user from localStorage:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('username');
      }
    }
    
    setIsLoading(false);
  }, []);

  const contextValue: AuthContextType = {
    isAuthenticated,
    isLoading,
    error,
    user,
    login,
    logout,
    refreshToken,
    isPlayer: user?.role.isPlayer || false,
    isAdmin: user?.role.isAdmin || false
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}