'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { secureLogger } from '../utils/logger';
import { funifierAuthService } from '../services/funifier-auth.service';
import {
  userIdentificationService,
  UserIdentification,
} from '../services/user-identification.service';
import { LoginCredentials, ApiError, ErrorType, TeamType } from '../types';
import { TeamSelectionModal, TeamOption } from '../components/auth/TeamSelectionModal';

interface AuthContextType {
  // Authentication state
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // User information
  user: UserIdentification | null;

  // Team selection state
  showTeamSelection: boolean;
  availableTeams: TeamOption[];
  selectedTeam: TeamType | 'ADMIN' | null;

  // Authentication methods
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  selectTeam: (teamType: TeamType | 'ADMIN') => void;
  cancelTeamSelection: () => void;

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
  const [showTeamSelection, setShowTeamSelection] = useState(false);
  const [availableTeams, setAvailableTeams] = useState<TeamOption[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<TeamType | 'ADMIN' | null>(null);
  const router = useRouter();

  // Set up token refresh interval
  useEffect(() => {
    if (isAuthenticated) {
      const interval = setInterval(
        async () => {
          try {
            await refreshToken();
          } catch (error) {
            secureLogger.warn('Token refresh failed:', error);
            // Don't logout automatically on refresh failure
            // Let the user continue until they make a request that fails
          }
        },
        4 * 60 * 1000
      ); // Refresh every 4 minutes

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
      secureLogger.error('Auth initialization error:', error);
      setError('Erro ao inicializar autenticação');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      setError(null);

      secureLogger.log('🔐 Starting login process for:', credentials.username);

      // Call the API route for authentication
      const authResponse = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      secureLogger.log('🔐 Auth API response status:', authResponse.status);

      if (!authResponse.ok) {
        const errorData = await authResponse.json();
        secureLogger.error('🔐 Auth API error:', errorData);
        throw new Error(errorData.error || 'Authentication failed');
      }

      const authResult = await authResponse.json();
      secureLogger.log('🔐 Auth result type:', typeof authResult);
      secureLogger.log('🔐 Auth result:', authResult);

      // Handle both string and object responses for backward compatibility
      let accessToken: string;
      let expiresIn: number = 3600; // Default 1 hour

      if (typeof authResult === 'string') {
        // API returned raw token string
        accessToken = authResult;
        secureLogger.log('🔐 Auth successful, token received (string)');
      } else if (authResult && authResult.access_token) {
        // API returned object with access_token
        accessToken = authResult.access_token;
        expiresIn = authResult.expires_in || 3600;
        secureLogger.log('🔐 Auth successful, token received (object)');
      } else {
        throw new Error('Invalid authentication response format');
      }

      // Store the token in the auth service so other services can use it
      secureLogger.log('💾 Storing token in auth service...');
      funifierAuthService.setAccessToken(accessToken, expiresIn);

      // Identify user role and team
      secureLogger.log('👤 Identifying user role and team...');
      const userInfo = await userIdentificationService.identifyUser(
        credentials.username
      );
      secureLogger.log('👤 User identified:', userInfo);

      // Update state
      setUser(userInfo);
      setIsAuthenticated(true);

      // Store user info in localStorage for persistence
      localStorage.setItem('user', JSON.stringify(userInfo));
      localStorage.setItem('username', credentials.username);
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('tokenExpiry', (Date.now() + expiresIn * 1000).toString());

      secureLogger.log('✅ Login completed successfully');

      // Handle post-login routing based on team assignments
      handlePostLoginRouting(userInfo);
    } catch (err) {
      secureLogger.error('❌ Login error:', err);

      let errorMessage = 'Erro inesperado durante o login';

      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (err instanceof ApiError) {
        switch (err.type) {
          case ErrorType.AUTHENTICATION_ERROR:
            errorMessage =
              'Credenciais inválidas. Verifique seu usuário e senha.';
            break;
          case ErrorType.NETWORK_ERROR:
            errorMessage =
              'Erro de conexão. Verifique sua internet e tente novamente.';
            break;
          case ErrorType.FUNIFIER_API_ERROR:
            errorMessage =
              'Erro no servidor. Tente novamente em alguns minutos.';
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
      setShowTeamSelection(false);
      setAvailableTeams([]);
      setSelectedTeam(null);

      // Clear localStorage
      localStorage.removeItem('user');
      localStorage.removeItem('username');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('tokenExpiry');
      localStorage.removeItem('selectedTeam');

      // Redirect to login
      router.push('/login');
    } catch (error) {
      secureLogger.error('Logout error:', error);
    }
  };

  const refreshToken = async () => {
    try {
      await funifierAuthService.refreshAccessToken();
    } catch (error) {
      secureLogger.error('Token refresh failed:', error);
      throw error;
    }
  };

  const selectTeam = (teamType: TeamType | 'ADMIN') => {
    setSelectedTeam(teamType);
    setShowTeamSelection(false);
    
    // Route user to appropriate dashboard
    if (teamType === 'ADMIN') {
      router.push('/admin');
    } else {
      router.push('/dashboard');
    }
    
    // Store selected team for future sessions
    localStorage.setItem('selectedTeam', teamType);
  };

  const cancelTeamSelection = () => {
    setShowTeamSelection(false);
    logout(); // Log out user if they cancel team selection
  };

  const handlePostLoginRouting = (userInfo: UserIdentification) => {
    if (!userInfo.playerData) {
      secureLogger.error('No player data available for routing');
      setError('Dados do usuário não disponíveis');
      return;
    }

    // Check if user has multiple team assignments
    const hasMultipleTeams = userIdentificationService.hasMultipleTeamAssignments(userInfo.playerData);
    
    if (hasMultipleTeams) {
      // Show team selection modal
      const teams = userIdentificationService.getAvailableTeamsForUser(userInfo.playerData);
      setAvailableTeams(teams);
      setShowTeamSelection(true);
      secureLogger.log('👥 Multiple teams detected, showing team selection modal');
    } else {
      // Single team assignment - route directly
      const primaryTeam = userIdentificationService.getPrimaryTeam(userInfo.playerData);
      
      if (primaryTeam) {
        setSelectedTeam(primaryTeam.teamType);
        
        if (primaryTeam.teamType === 'ADMIN') {
          router.push('/admin');
        } else {
          router.push('/dashboard');
        }
        
        // Store selected team for future sessions
        localStorage.setItem('selectedTeam', primaryTeam.teamType);
        secureLogger.log('🎯 Single team detected, routing to:', primaryTeam.teamType);
      } else {
        secureLogger.error('No valid team assignment found');
        setError('Nenhuma equipe válida encontrada');
      }
    }
  };

  // Initialize authentication state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        setError(null);

        secureLogger.log('🔄 Initializing authentication...');

        // Try to restore user from localStorage
        const storedUser = localStorage.getItem('user');
        const storedUsername = localStorage.getItem('username');
        const storedToken = localStorage.getItem('accessToken');
        const storedTokenExpiry = localStorage.getItem('tokenExpiry');
        const storedSelectedTeam = localStorage.getItem('selectedTeam');

        if (storedUser && storedUsername && storedToken && storedTokenExpiry) {
          try {
            const userInfo = JSON.parse(storedUser) as UserIdentification;
            const tokenExpiry = parseInt(storedTokenExpiry);
            
            // Check if token is still valid
            if (Date.now() < tokenExpiry) {
              secureLogger.log('👤 Restored user from localStorage:', userInfo.userName);
              secureLogger.log('🔑 Restored token from localStorage');
              
              // Restore token to auth service
              const expiresIn = Math.floor((tokenExpiry - Date.now()) / 1000);
              funifierAuthService.setAccessToken(storedToken, expiresIn);
              
              setUser(userInfo);
              setIsAuthenticated(true);

              // Restore selected team if available
              if (storedSelectedTeam) {
                setSelectedTeam(storedSelectedTeam as TeamType | 'ADMIN');
                secureLogger.log('🎯 Restored selected team:', storedSelectedTeam);
              }
            } else {
              secureLogger.log('🔑 Stored token has expired, clearing localStorage');
              localStorage.removeItem('user');
              localStorage.removeItem('username');
              localStorage.removeItem('accessToken');
              localStorage.removeItem('tokenExpiry');
              localStorage.removeItem('selectedTeam');
            }
          } catch (error) {
            secureLogger.error('❌ Failed to restore user from localStorage:', error);
            localStorage.removeItem('user');
            localStorage.removeItem('username');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('tokenExpiry');
            localStorage.removeItem('selectedTeam');
          }
        }

        secureLogger.log('✅ Auth initialization complete');
      } catch (error) {
        secureLogger.error('❌ Auth initialization error:', error);
        setError('Erro ao inicializar autenticação');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const contextValue: AuthContextType = {
    isAuthenticated,
    isLoading,
    error,
    user,
    showTeamSelection,
    availableTeams,
    selectedTeam,
    login,
    logout,
    selectTeam,
    cancelTeamSelection,
    refreshToken,
    isPlayer: user?.role.isPlayer || false,
    isAdmin: user?.role.isAdmin || false,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
      {showTeamSelection && (
        <TeamSelectionModal
          availableTeams={availableTeams}
          onTeamSelect={selectTeam}
          onClose={cancelTeamSelection}
          isLoading={isLoading}
        />
      )}
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
