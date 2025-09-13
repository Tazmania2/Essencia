import axios, { AxiosError } from 'axios';
import {
  FunifierAuthRequest,
  FunifierAuthResponse,
  LoginCredentials,
  ApiError,
  ErrorType,
  FUNIFIER_CONFIG
} from '../types';

export class FunifierAuthService {
  private static instance: FunifierAuthService;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiry: Date | null = null;

  private constructor() {}

  public static getInstance(): FunifierAuthService {
    if (!FunifierAuthService.instance) {
      FunifierAuthService.instance = new FunifierAuthService();
    }
    return FunifierAuthService.instance;
  }

  /**
   * Authenticate with Funifier API using username and password
   */
  public async authenticate(credentials: LoginCredentials): Promise<string> {
    try {
      const authRequest: FunifierAuthRequest = {
        apiKey: FUNIFIER_CONFIG.API_KEY,
        grant_type: 'password',
        username: credentials.username,
        password: credentials.password
      };

      const response = await axios.post<FunifierAuthResponse>(
        `${FUNIFIER_CONFIG.BASE_URL}/auth/token`,
        authRequest,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000, // 10 second timeout
        }
      );

      const { access_token, expires_in, refresh_token } = response.data;

      // Store tokens and calculate expiry
      this.accessToken = access_token;
      this.refreshToken = refresh_token || null;
      this.tokenExpiry = new Date(Date.now() + (expires_in * 1000));

      return access_token;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Get current access token, refreshing if necessary
   */
  public async getAccessToken(): Promise<string | null> {
    if (!this.accessToken) {
      return null;
    }

    // Check if token is expired or will expire in the next 5 minutes
    if (this.tokenExpiry && this.isTokenExpiringSoon()) {
      try {
        await this.refreshAccessToken();
      } catch (error) {
        // If refresh fails, clear tokens
        this.clearTokens();
        throw error;
      }
    }

    return this.accessToken;
  }

  /**
   * Refresh the access token using refresh token
   */
  public async refreshAccessToken(): Promise<string> {
    if (!this.refreshToken) {
      throw new ApiError({
        type: ErrorType.AUTHENTICATION_ERROR,
        message: 'No refresh token available',
        timestamp: new Date()
      });
    }

    try {
      const response = await axios.post<FunifierAuthResponse>(
        `${FUNIFIER_CONFIG.BASE_URL}/auth/refresh`,
        {
          apiKey: FUNIFIER_CONFIG.API_KEY,
          grant_type: 'refresh_token',
          refresh_token: this.refreshToken
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      const { access_token, expires_in, refresh_token } = response.data;

      this.accessToken = access_token;
      this.refreshToken = refresh_token || this.refreshToken;
      this.tokenExpiry = new Date(Date.now() + (expires_in * 1000));

      return access_token;
    } catch (error) {
      this.clearTokens();
      throw this.handleAuthError(error);
    }
  }

  /**
   * Check if user is currently authenticated
   */
  public isAuthenticated(): boolean {
    return this.accessToken !== null && !this.isTokenExpired();
  }

  /**
   * Logout and clear all tokens
   */
  public logout(): void {
    this.clearTokens();
  }

  /**
   * Get authorization header for API requests
   */
  public getAuthHeader(): Record<string, string> {
    if (!this.accessToken) {
      throw new ApiError({
        type: ErrorType.AUTHENTICATION_ERROR,
        message: 'No access token available',
        timestamp: new Date()
      });
    }

    return {
      'Authorization': `Bearer ${this.accessToken}`
    };
  }

  private isTokenExpired(): boolean {
    if (!this.tokenExpiry) {
      return true;
    }
    return new Date() >= this.tokenExpiry;
  }

  private isTokenExpiringSoon(): boolean {
    if (!this.tokenExpiry) {
      return true;
    }
    // Check if token expires in the next 5 minutes
    const fiveMinutesFromNow = new Date(Date.now() + (5 * 60 * 1000));
    return this.tokenExpiry <= fiveMinutesFromNow;
  }

  private clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;
  }

  private handleAuthError(error: unknown): ApiError {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      
      if (axiosError.code === 'ECONNABORTED') {
        return new ApiError({
          type: ErrorType.NETWORK_ERROR,
          message: 'Authentication request timed out',
          details: axiosError.message,
          timestamp: new Date()
        });
      }

      if (axiosError.response) {
        const status = axiosError.response.status;
        const data = axiosError.response.data as any;

        switch (status) {
          case 401:
            return new ApiError({
              type: ErrorType.AUTHENTICATION_ERROR,
              message: 'Invalid credentials',
              details: data?.error || 'Unauthorized',
              timestamp: new Date()
            });
          case 403:
            return new ApiError({
              type: ErrorType.AUTHENTICATION_ERROR,
              message: 'Access forbidden',
              details: data?.error || 'Forbidden',
              timestamp: new Date()
            });
          case 429:
            return new ApiError({
              type: ErrorType.FUNIFIER_API_ERROR,
              message: 'Too many authentication attempts',
              details: data?.error || 'Rate limit exceeded',
              timestamp: new Date()
            });
          default:
            return new ApiError({
              type: ErrorType.FUNIFIER_API_ERROR,
              message: `Authentication failed with status ${status}`,
              details: data?.error || axiosError.message,
              timestamp: new Date()
            });
        }
      }

      if (axiosError.request) {
        return new ApiError({
          type: ErrorType.NETWORK_ERROR,
          message: 'Network error during authentication',
          details: 'No response received from server',
          timestamp: new Date()
        });
      }
    }

    return new ApiError({
      type: ErrorType.AUTHENTICATION_ERROR,
      message: 'Unknown authentication error',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date()
    });
  }
}

// Export singleton instance
export const funifierAuthService = FunifierAuthService.getInstance();