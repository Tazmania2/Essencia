import { FUNIFIER_CONFIG } from '../types';

export class FunifierAuthService {
  private static instance: FunifierAuthService;
  private accessToken: string | null = null;
  private tokenExpiry: number | null = null;

  public static getInstance(): FunifierAuthService {
    if (!FunifierAuthService.instance) {
      FunifierAuthService.instance = new FunifierAuthService();
    }
    return FunifierAuthService.instance;
  }

  async authenticate(credentials: { username: string; password: string }): Promise<{ success: boolean; token?: string; error?: string }> {
    try {
      const { username, password } = credentials;
      
      if (!username || !password) {
        return {
          success: false,
          error: 'Username and password are required'
        };
      }

      // Get API key from environment
      const apiKey = process.env.FUNIFIER_API_KEY;
      if (!apiKey) {
        return {
          success: false,
          error: 'Funifier API key not configured'
        };
      }

      // Make request to Funifier authentication endpoint
      const authData = {
        apiKey: apiKey,
        grant_type: 'password',
        username: username,
        password: password
      };

      const response = await fetch(`${FUNIFIER_CONFIG.BASE_URL}/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(authData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.error || `Authentication failed with status ${response.status}`
        };
      }

      const authResult = await response.json();
      
      if (authResult.access_token) {
        // Store the token
        this.setAccessToken(authResult.access_token, authResult.expires_in);
        
        return {
          success: true,
          token: authResult.access_token
        };
      } else {
        return {
          success: false,
          error: 'No access token received from Funifier API'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed'
      };
    }
  }

  isAuthenticated(): boolean {
    if (!this.accessToken || !this.tokenExpiry) {
      return false;
    }
    return Date.now() < this.tokenExpiry;
  }

  setAccessToken(token: string, expiresIn?: number): void {
    this.accessToken = token;
    this.tokenExpiry = expiresIn ? Date.now() + (expiresIn * 1000) : null;
  }

  async getAccessToken(): Promise<string | null> {
    if (!this.isAuthenticated()) {
      return null;
    }
    return this.accessToken;
  }

  async requestPasswordReset(userId: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      // This would need to be implemented based on Funifier's password reset API
      // For now, return a placeholder response
      if (userId) {
        return {
          success: true,
          message: 'Password reset functionality not yet implemented. Please contact your administrator.'
        };
      }
      
      return {
        success: false,
        error: 'User ID is required'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Password reset failed'
      };
    }
  }

  async resetPassword(userId: string, code: string, newPassword: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      // This would need to be implemented based on Funifier's password reset API
      // For now, return a placeholder response
      if (userId && code && newPassword) {
        return {
          success: true,
          message: 'Password reset functionality not yet implemented. Please contact your administrator.'
        };
      }
      
      return {
        success: false,
        error: 'All fields are required'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Password reset failed'
      };
    }
  }

  async refreshAccessToken(): Promise<void> {
    try {
      // For now, we don't have refresh token implementation
      // This would need to be implemented based on Funifier's refresh token flow
      console.log('Token refresh not implemented - user will need to re-authenticate');
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw error;
    }
  }

  logout(): void {
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  getAuthHeader(): Record<string, string> {
    const token = this.accessToken;
    if (!token) {
      throw new Error('No access token available. Please authenticate first.');
    }
    return {
      'Authorization': `Bearer ${token}`
    };
  }
}

export const funifierAuthService = FunifierAuthService.getInstance();