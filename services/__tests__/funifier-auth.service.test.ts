import axios from 'axios';
import { FunifierAuthService, funifierAuthService } from '../funifier-auth.service';
import { ErrorType, FUNIFIER_CONFIG } from '../../types';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('FunifierAuthService', () => {
  let authService: FunifierAuthService;

  beforeEach(() => {
    // Get fresh instance for each test
    authService = FunifierAuthService.getInstance();
    authService.logout(); // Clear any existing tokens
    jest.clearAllMocks();
  });

  describe('authenticate', () => {
    const mockCredentials = {
      username: 'testuser',
      password: 'testpass'
    };

    const mockAuthResponse = {
      data: {
        access_token: 'mock_access_token',
        token_type: 'Bearer',
        expires_in: 3600,
        refresh_token: 'mock_refresh_token'
      }
    };

    it('should authenticate successfully with valid credentials', async () => {
      mockedAxios.post.mockResolvedValueOnce(mockAuthResponse);

      const response = await authService.authenticate(mockCredentials);

      expect(response.access_token).toBe('mock_access_token');
      expect(mockedAxios.post).toHaveBeenCalledWith(
        `${FUNIFIER_CONFIG.BASE_URL}/auth/token`,
        {
          apiKey: FUNIFIER_CONFIG.API_KEY,
          grant_type: 'password',
          username: mockCredentials.username,
          password: mockCredentials.password
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );
    });

    it('should handle 401 unauthorized error', async () => {
      const mockError = {
        isAxiosError: true,
        response: {
          status: 401,
          data: { error: 'Invalid credentials' }
        }
      };
      mockedAxios.post.mockRejectedValueOnce(mockError);
      mockedAxios.isAxiosError.mockReturnValue(true);

      await expect(authService.authenticate(mockCredentials)).rejects.toMatchObject({
        type: ErrorType.AUTHENTICATION_ERROR,
        message: 'Credenciais inválidas ou sessão expirada'
      });
    });

    it('should handle network timeout error', async () => {
      const mockError = {
        isAxiosError: true,
        code: 'ECONNABORTED',
        message: 'timeout of 10000ms exceeded'
      };
      mockedAxios.post.mockRejectedValueOnce(mockError);
      mockedAxios.isAxiosError.mockReturnValue(true);

      await expect(authService.authenticate(mockCredentials)).rejects.toMatchObject({
        type: ErrorType.NETWORK_ERROR,
        message: 'Tempo limite de conexão excedido'
      });
    });

    it('should handle 429 rate limit error', async () => {
      const mockError = {
        isAxiosError: true,
        response: {
          status: 429,
          data: { error: 'Rate limit exceeded' }
        }
      };
      mockedAxios.post.mockRejectedValueOnce(mockError);
      mockedAxios.isAxiosError.mockReturnValue(true);

      await expect(authService.authenticate(mockCredentials)).rejects.toMatchObject({
        type: ErrorType.FUNIFIER_API_ERROR,
        message: 'Muitas requisições. Tente novamente em alguns instantes'
      });
    });

    it('should handle network error without response', async () => {
      const mockError = {
        isAxiosError: true,
        request: {},
        message: 'Network Error'
      };
      mockedAxios.post.mockRejectedValueOnce(mockError);
      mockedAxios.isAxiosError.mockReturnValue(true);

      await expect(authService.authenticate(mockCredentials)).rejects.toMatchObject({
        type: ErrorType.NETWORK_ERROR,
        message: 'Erro de rede - sem resposta do servidor'
      });
    });
  });

  describe('getAccessToken', () => {
    it('should return null when not authenticated', async () => {
      const token = await authService.getAccessToken();
      expect(token).toBeNull();
    });

    it('should return current token when valid', async () => {
      // Mock successful authentication
      const mockAuthResponse = {
        data: {
          access_token: 'mock_access_token',
          token_type: 'Bearer',
          expires_in: 3600,
          refresh_token: 'mock_refresh_token'
        }
      };
      mockedAxios.post.mockResolvedValueOnce(mockAuthResponse);

      await authService.authenticate({ username: 'test', password: 'test' });
      const token = await authService.getAccessToken();

      expect(token).toBe('mock_access_token');
    });

    it('should refresh token when expiring soon', async () => {
      // Mock initial authentication with short expiry
      const mockAuthResponse = {
        data: {
          access_token: 'initial_token',
          token_type: 'Bearer',
          expires_in: 60, // 1 minute - will be considered expiring soon
          refresh_token: 'mock_refresh_token'
        }
      };
      mockedAxios.post.mockResolvedValueOnce(mockAuthResponse);

      // Mock refresh response
      const mockRefreshResponse = {
        data: {
          access_token: 'refreshed_token',
          token_type: 'Bearer',
          expires_in: 3600,
          refresh_token: 'new_refresh_token'
        }
      };
      mockedAxios.post.mockResolvedValueOnce(mockRefreshResponse);

      await authService.authenticate({ username: 'test', password: 'test' });
      
      // Wait a bit to ensure token is considered expiring soon
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const token = await authService.getAccessToken();

      expect(token).toBe('refreshed_token');
      expect(mockedAxios.post).toHaveBeenCalledTimes(2); // auth + refresh
    });
  });

  describe('refreshAccessToken', () => {
    it('should throw error when no refresh token available', async () => {
      await expect(authService.refreshAccessToken()).rejects.toMatchObject({
        type: ErrorType.AUTHENTICATION_ERROR,
        message: 'No refresh token available'
      });
    });

    it('should refresh token successfully', async () => {
      // First authenticate to get refresh token
      const mockAuthResponse = {
        data: {
          access_token: 'initial_token',
          token_type: 'Bearer',
          expires_in: 3600,
          refresh_token: 'mock_refresh_token'
        }
      };
      mockedAxios.post.mockResolvedValueOnce(mockAuthResponse);

      await authService.authenticate({ username: 'test', password: 'test' });

      // Mock refresh response
      const mockRefreshResponse = {
        data: {
          access_token: 'refreshed_token',
          token_type: 'Bearer',
          expires_in: 3600,
          refresh_token: 'new_refresh_token'
        }
      };
      mockedAxios.post.mockResolvedValueOnce(mockRefreshResponse);

      const newToken = await authService.refreshAccessToken();

      expect(newToken).toBe('refreshed_token');
      expect(mockedAxios.post).toHaveBeenCalledWith(
        `${FUNIFIER_CONFIG.BASE_URL}/auth/refresh`,
        {
          apiKey: FUNIFIER_CONFIG.API_KEY,
          grant_type: 'refresh_token',
          refresh_token: 'mock_refresh_token'
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );
    });

    it('should clear tokens when refresh fails', async () => {
      // First authenticate to get refresh token
      const mockAuthResponse = {
        data: {
          access_token: 'initial_token',
          token_type: 'Bearer',
          expires_in: 3600,
          refresh_token: 'mock_refresh_token'
        }
      };
      mockedAxios.post.mockResolvedValueOnce(mockAuthResponse);

      await authService.authenticate({ username: 'test', password: 'test' });

      // Mock refresh failure
      const mockError = {
        isAxiosError: true,
        response: {
          status: 401,
          data: { error: 'Invalid refresh token' }
        }
      };
      mockedAxios.post.mockRejectedValueOnce(mockError);
      mockedAxios.isAxiosError.mockReturnValue(true);

      await expect(authService.refreshAccessToken()).rejects.toMatchObject({
        type: ErrorType.AUTHENTICATION_ERROR,
        message: 'Credenciais inválidas ou sessão expirada'
      });

      expect(authService.isAuthenticated()).toBe(false);
    });
  });

  describe('isAuthenticated', () => {
    it('should return false when not authenticated', () => {
      expect(authService.isAuthenticated()).toBe(false);
    });

    it('should return true when authenticated with valid token', async () => {
      const mockAuthResponse = {
        data: {
          access_token: 'mock_access_token',
          token_type: 'Bearer',
          expires_in: 3600,
          refresh_token: 'mock_refresh_token'
        }
      };
      mockedAxios.post.mockResolvedValueOnce(mockAuthResponse);

      await authService.authenticate({ username: 'test', password: 'test' });

      expect(authService.isAuthenticated()).toBe(true);
    });
  });

  describe('logout', () => {
    it('should clear all tokens', async () => {
      const mockAuthResponse = {
        data: {
          access_token: 'mock_access_token',
          token_type: 'Bearer',
          expires_in: 3600,
          refresh_token: 'mock_refresh_token'
        }
      };
      mockedAxios.post.mockResolvedValueOnce(mockAuthResponse);

      await authService.authenticate({ username: 'test', password: 'test' });
      expect(authService.isAuthenticated()).toBe(true);

      authService.logout();
      expect(authService.isAuthenticated()).toBe(false);
    });
  });

  describe('getAuthHeader', () => {
    it('should return authorization header when authenticated', async () => {
      const mockAuthResponse = {
        data: {
          access_token: 'mock_access_token',
          token_type: 'Bearer',
          expires_in: 3600,
          refresh_token: 'mock_refresh_token'
        }
      };
      mockedAxios.post.mockResolvedValueOnce(mockAuthResponse);

      await authService.authenticate({ username: 'test', password: 'test' });
      const header = authService.getAuthHeader();

      expect(header).toEqual({
        'Authorization': 'Bearer mock_access_token'
      });
    });

    it('should throw error when not authenticated', () => {
      expect(() => authService.getAuthHeader()).toThrow();
    });
  });

  describe('singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = FunifierAuthService.getInstance();
      const instance2 = FunifierAuthService.getInstance();
      
      expect(instance1).toBe(instance2);
      expect(instance1).toBe(funifierAuthService);
    });
  });

  describe('password reset', () => {
    describe('requestPasswordReset', () => {
      it('should request password reset successfully', async () => {
        const userId = 'testuser';
        mockedAxios.get.mockResolvedValue({ data: {} });

        await authService.requestPasswordReset(userId);

        expect(mockedAxios.get).toHaveBeenCalledWith(
          `https://service2.funifier.com/v3/system/user/password/code?user=${userId}`,
          {
            headers: {
              'Authorization': `Basic ${Buffer.from(FUNIFIER_CONFIG.API_KEY).toString('base64')}`,
            },
            timeout: 10000,
          }
        );
      });

      it('should handle request password reset error', async () => {
        const userId = 'testuser';
        const error = new Error('Network error');
        mockedAxios.get.mockRejectedValue(error);

        await expect(authService.requestPasswordReset(userId)).rejects.toThrow();
      });

      it('should encode user ID in URL', async () => {
        const userId = 'test@user.com';
        mockedAxios.get.mockResolvedValue({ data: {} });

        await authService.requestPasswordReset(userId);

        expect(mockedAxios.get).toHaveBeenCalledWith(
          `https://service2.funifier.com/v3/system/user/password/code?user=${encodeURIComponent(userId)}`,
          {
            headers: {
              'Authorization': `Basic ${Buffer.from(FUNIFIER_CONFIG.API_KEY).toString('base64')}`,
            },
            timeout: 10000,
          }
        );
      });
    });

    describe('resetPassword', () => {
      it('should reset password successfully', async () => {
        const userId = 'testuser';
        const code = '123456';
        const newPassword = 'newpassword';
        mockedAxios.put.mockResolvedValue({ data: {} });

        await authService.resetPassword(userId, code, newPassword);

        expect(mockedAxios.put).toHaveBeenCalledWith(
          'https://service2.funifier.com/v3/system/user/password/code',
          {
            code,
            new_password: newPassword,
            user: userId,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Basic ${Buffer.from(FUNIFIER_CONFIG.API_KEY).toString('base64')}`,
            },
            timeout: 10000,
          }
        );
      });

      it('should handle reset password error', async () => {
        const userId = 'testuser';
        const code = '123456';
        const newPassword = 'newpassword';
        const error = new Error('Invalid code');
        mockedAxios.put.mockRejectedValue(error);

        await expect(authService.resetPassword(userId, code, newPassword)).rejects.toThrow();
      });
    });
  });
});