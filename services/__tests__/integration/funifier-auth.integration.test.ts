import { FunifierAuthService } from '../../funifier-auth.service';
import { LoginCredentials } from '../../../types';
import axios from 'axios';

// Mock axios for integration tests
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('FunifierAuthService Integration Tests', () => {
  let authService: FunifierAuthService;

  beforeEach(() => {
    authService = FunifierAuthService.getInstance();
    jest.clearAllMocks();
  });

  describe('Authentication Flow', () => {
    it('should successfully authenticate with valid credentials', async () => {
      // Mock successful authentication response
      const mockResponse = {
        data: {
          access_token: 'mock-access-token-12345',
          token_type: 'Bearer',
          expires_in: 3600,
          refresh_token: 'mock-refresh-token-67890'
        },
        status: 200
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const credentials: LoginCredentials = {
        username: 'testuser',
        password: 'testpass'
      };

      const result = await authService.authenticate(credentials);

      expect(result).toBe('mock-access-token-12345');
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://service2.funifier.com/v3/auth/token',
        {
          apiKey: '68a6737a6e1d0e2196db1b1e',
          grant_type: 'password',
          username: 'testuser',
          password: 'testpass'
        },
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        })
      );
    });

    it('should handle authentication failure with invalid credentials', async () => {
      // Mock authentication failure response
      const mockError = {
        response: {
          status: 401,
          data: {
            error: 'invalid_grant',
            error_description: 'Invalid username or password'
          }
        }
      };

      mockedAxios.post.mockRejectedValueOnce(mockError);

      const credentials: LoginCredentials = {
        username: 'invaliduser',
        password: 'wrongpass'
      };

      await expect(
        authService.authenticate(credentials)
      ).rejects.toThrow();

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://service2.funifier.com/v3/auth/token',
        {
          apiKey: '68a6737a6e1d0e2196db1b1e',
          grant_type: 'password',
          username: 'invaliduser',
          password: 'wrongpass'
        },
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        })
      );
    });

    it('should handle network errors during authentication', async () => {
      // Mock network error
      const networkError = new Error('Network Error');
      mockedAxios.post.mockRejectedValueOnce(networkError);

      const credentials: LoginCredentials = {
        username: 'testuser',
        password: 'testpass'
      };

      await expect(
        authService.authenticate(credentials)
      ).rejects.toThrow();
    });

    it('should handle API key validation errors', async () => {
      // Mock API key validation error
      const mockError = {
        response: {
          status: 403,
          data: {
            error: 'invalid_api_key',
            error_description: 'The provided API key is invalid'
          }
        }
      };

      mockedAxios.post.mockRejectedValueOnce(mockError);

      const credentials: LoginCredentials = {
        username: 'testuser',
        password: 'testpass'
      };

      await expect(
        authService.authenticate(credentials)
      ).rejects.toThrow();
    });

    it('should handle rate limiting errors', async () => {
      // Mock rate limiting error
      const mockError = {
        response: {
          status: 429,
          data: {
            error: 'rate_limit_exceeded',
            error_description: 'Too many requests'
          }
        }
      };

      mockedAxios.post.mockRejectedValueOnce(mockError);

      const credentials: LoginCredentials = {
        username: 'testuser',
        password: 'testpass'
      };

      await expect(
        authService.authenticate(credentials)
      ).rejects.toThrow();
    });
  });

  describe('Token Management', () => {
    it('should return access token when authenticated', async () => {
      // Mock successful authentication
      const mockResponse = {
        data: {
          access_token: 'mock-access-token-12345',
          token_type: 'Bearer',
          expires_in: 3600
        },
        status: 200
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const credentials: LoginCredentials = {
        username: 'testuser',
        password: 'testpass'
      };

      await authService.authenticate(credentials);
      const token = await authService.getAccessToken();

      expect(token).toBe('mock-access-token-12345');
    });

    it('should return null when not authenticated', async () => {
      authService.logout(); // Clear any existing tokens
      const token = await authService.getAccessToken();
      expect(token).toBeNull();
    });

    it('should check authentication status correctly', async () => {
      // Initially not authenticated
      expect(authService.isAuthenticated()).toBe(false);

      // Mock successful authentication
      const mockResponse = {
        data: {
          access_token: 'mock-access-token-12345',
          token_type: 'Bearer',
          expires_in: 3600
        },
        status: 200
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const credentials: LoginCredentials = {
        username: 'testuser',
        password: 'testpass'
      };

      await authService.authenticate(credentials);
      expect(authService.isAuthenticated()).toBe(true);

      // After logout
      authService.logout();
      expect(authService.isAuthenticated()).toBe(false);
    });

    it('should provide correct authorization header', async () => {
      // Mock successful authentication
      const mockResponse = {
        data: {
          access_token: 'mock-access-token-12345',
          token_type: 'Bearer',
          expires_in: 3600
        },
        status: 200
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const credentials: LoginCredentials = {
        username: 'testuser',
        password: 'testpass'
      };

      await authService.authenticate(credentials);
      const authHeader = authService.getAuthHeader();

      expect(authHeader).toEqual({
        'Authorization': 'Bearer mock-access-token-12345'
      });
    });

    it('should throw error when getting auth header without token', () => {
      authService.logout(); // Clear any existing tokens

      expect(() => {
        authService.getAuthHeader();
      }).toThrow();
    });
  });

  describe('Token Refresh', () => {
    it('should refresh token when available', async () => {
      // Mock initial authentication with refresh token
      const initialResponse = {
        data: {
          access_token: 'initial-token',
          token_type: 'Bearer',
          expires_in: 3600,
          refresh_token: 'refresh-token-123'
        },
        status: 200
      };

      // Mock refresh response
      const refreshResponse = {
        data: {
          access_token: 'new-access-token',
          token_type: 'Bearer',
          expires_in: 3600,
          refresh_token: 'new-refresh-token'
        },
        status: 200
      };

      mockedAxios.post
        .mockResolvedValueOnce(initialResponse)
        .mockResolvedValueOnce(refreshResponse);

      const credentials: LoginCredentials = {
        username: 'testuser',
        password: 'testpass'
      };

      await authService.authenticate(credentials);
      const newToken = await authService.refreshAccessToken();

      expect(newToken).toBe('new-access-token');
      expect(mockedAxios.post).toHaveBeenCalledTimes(2);
    });

    it('should handle refresh token errors', async () => {
      // Mock initial authentication without refresh token
      const initialResponse = {
        data: {
          access_token: 'initial-token',
          token_type: 'Bearer',
          expires_in: 3600
          // No refresh_token
        },
        status: 200
      };

      mockedAxios.post.mockResolvedValueOnce(initialResponse);

      const credentials: LoginCredentials = {
        username: 'testuser',
        password: 'testpass'
      };

      await authService.authenticate(credentials);

      await expect(
        authService.refreshAccessToken()
      ).rejects.toThrow();
    });
  });
});