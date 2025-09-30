export class FunifierAuthService {
  private static instance: FunifierAuthService;

  public static getInstance(): FunifierAuthService {
    if (!FunifierAuthService.instance) {
      FunifierAuthService.instance = new FunifierAuthService();
    }
    return FunifierAuthService.instance;
  }

  async getAccessToken(): Promise<string | null> {
    // Mock implementation - replace with actual auth logic
    return 'mock_token';
  }

  getAuthHeader(): Record<string, string> {
    return {
      'Authorization': 'Bearer mock_token'
    };
  }
}

export const funifierAuthService = FunifierAuthService.getInstance();