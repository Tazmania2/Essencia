import axios, { AxiosError } from 'axios';
import {
  FunifierPlayerStatus,
  ApiError,
  ErrorType,
  FUNIFIER_CONFIG
} from '../types';
import { funifierAuthService } from './funifier-auth.service';
import { errorHandlerService } from './error-handler.service';

export class FunifierPlayerService {
  private static instance: FunifierPlayerService;

  private constructor() {}

  public static getInstance(): FunifierPlayerService {
    if (!FunifierPlayerService.instance) {
      FunifierPlayerService.instance = new FunifierPlayerService();
    }
    return FunifierPlayerService.instance;
  }

  /**
   * Retrieve player status from Funifier API
   */
  public async getPlayerStatus(playerId: string): Promise<FunifierPlayerStatus> {
    try {
      const token = await funifierAuthService.getAccessToken();
      if (!token) {
        throw new ApiError({
          type: ErrorType.AUTHENTICATION_ERROR,
          message: 'No valid authentication token available',
          timestamp: new Date()
        });
      }

      const response = await axios.get<FunifierPlayerStatus>(
        `${FUNIFIER_CONFIG.BASE_URL}/player_status`,
        {
          headers: {
            ...funifierAuthService.getAuthHeader(),
            'Content-Type': 'application/json',
          },
          params: {
            id: playerId
          },
          timeout: 15000, // 15 second timeout for player data
        }
      );

      const playerData = response.data;
      
      // Log the actual response to understand the structure
      console.log('🎮 Funifier API Response:', JSON.stringify(playerData, null, 2));
      
      // Validate the response structure
      this.validatePlayerStatusResponse(playerData);

      return playerData;
    } catch (error) {
      const apiError = errorHandlerService.handleFunifierError(error, `player_status:${playerId}`);
      throw apiError;
    }
  }

  /**
   * Extract points lock/unlock status from catalog_items
   */
  public extractPointsLockStatus(catalogItems: Record<string, number>): {
    isUnlocked: boolean;
    unlockItemCount: number;
    lockItemCount: number;
  } {
    const unlockItemCount = catalogItems[FUNIFIER_CONFIG.CATALOG_ITEMS.UNLOCK_POINTS] || 0;
    const lockItemCount = catalogItems[FUNIFIER_CONFIG.CATALOG_ITEMS.LOCK_POINTS] || 0;

    // Points are unlocked if unlock item count > 0
    const isUnlocked = unlockItemCount > 0;

    return {
      isUnlocked,
      unlockItemCount,
      lockItemCount
    };
  }

  /**
   * Extract boost status from catalog_items
   */
  public extractBoostStatus(catalogItems: Record<string, number>): {
    hasSecondaryBoost1: boolean;
    hasSecondaryBoost2: boolean;
    boost1Count: number;
    boost2Count: number;
    totalActiveBoosts: number;
  } {
    const boost1Count = catalogItems[FUNIFIER_CONFIG.CATALOG_ITEMS.BOOST_SECONDARY_1] || 0;
    const boost2Count = catalogItems[FUNIFIER_CONFIG.CATALOG_ITEMS.BOOST_SECONDARY_2] || 0;

    const hasSecondaryBoost1 = boost1Count > 0;
    const hasSecondaryBoost2 = boost2Count > 0;
    const totalActiveBoosts = (hasSecondaryBoost1 ? 1 : 0) + (hasSecondaryBoost2 ? 1 : 0);

    return {
      hasSecondaryBoost1,
      hasSecondaryBoost2,
      boost1Count,
      boost2Count,
      totalActiveBoosts
    };
  }

  /**
   * Get player's team information
   */
  public extractTeamInfo(playerData: FunifierPlayerStatus): {
    teams: string[];
    primaryTeam: string | null;
  } {
    const teams = playerData.teams || [];
    const primaryTeam = teams.length > 0 ? teams[0] : null;

    return {
      teams,
      primaryTeam
    };
  }

  /**
   * Extract challenge progress information
   */
  public extractChallengeProgress(playerData: FunifierPlayerStatus): {
    totalChallenges: number;
    challengeData: Record<string, number>;
    challengeProgress: any[];
  } {
    return {
      totalChallenges: playerData.total_challenges || 0,
      challengeData: playerData.challenges || {},
      challengeProgress: playerData.challenge_progress || []
    };
  }

  /**
   * Extract points and level information
   */
  public extractPointsInfo(playerData: FunifierPlayerStatus): {
    totalPoints: number;
    pointCategories: Record<string, number>;
    levelProgress: {
      percentCompleted: number;
      nextPoints: number;
      totalLevels: number;
      percent: number;
    };
  } {
    return {
      totalPoints: playerData.total_points || 0,
      pointCategories: playerData.point_categories || {},
      levelProgress: {
        percentCompleted: playerData.level_progress?.percent_completed || 0,
        nextPoints: playerData.level_progress?.next_points || 0,
        totalLevels: playerData.level_progress?.total_levels || 0,
        percent: playerData.level_progress?.percent || 0
      }
    };
  }

  /**
   * Get comprehensive player analysis
   */
  public analyzePlayerData(playerData: FunifierPlayerStatus): {
    playerId: string;
    playerName: string;
    pointsInfo: {
      totalPoints: number;
      pointCategories: Record<string, number>;
      levelProgress: {
        percentCompleted: number;
        nextPoints: number;
        totalLevels: number;
        percent: number;
      };
    };
    lockStatus: {
      isUnlocked: boolean;
      unlockItemCount: number;
      lockItemCount: number;
    };
    boostStatus: {
      hasSecondaryBoost1: boolean;
      hasSecondaryBoost2: boolean;
      boost1Count: number;
      boost2Count: number;
      totalActiveBoosts: number;
    };
    teamInfo: {
      teams: string[];
      primaryTeam: string | null;
    };
    challengeInfo: {
      totalChallenges: number;
      challengeData: Record<string, number>;
      challengeProgress: any[];
    };
    catalogItemsCount: number;
    hasImage: boolean;
  } {
    return {
      playerId: playerData._id,
      playerName: playerData.name,
      pointsInfo: this.extractPointsInfo(playerData),
      lockStatus: this.extractPointsLockStatus(playerData.catalog_items),
      boostStatus: this.extractBoostStatus(playerData.catalog_items),
      teamInfo: this.extractTeamInfo(playerData),
      challengeInfo: this.extractChallengeProgress(playerData),
      catalogItemsCount: playerData.total_catalog_items || 0,
      hasImage: !!playerData.image
    };
  }

  /**
   * Validate the player status response structure
   */
  private validatePlayerStatusResponse(data: any): void {
    if (!data) {
      throw new ApiError({
        type: ErrorType.DATA_PROCESSING_ERROR,
        message: 'Empty response from Funifier API',
        timestamp: new Date()
      });
    }

    // Check for ID field (could be _id, id, or playerId)
    const hasId = data._id || data.id || data.playerId || data.player_id;
    if (!hasId) {
      throw new ApiError({
        type: ErrorType.DATA_PROCESSING_ERROR,
        message: 'Missing player ID field (_id, id, playerId, or player_id)',
        details: { receivedData: data },
        timestamp: new Date()
      });
    }

    // Normalize the ID field to _id for consistency
    if (!data._id) {
      data._id = data.id || data.playerId || data.player_id;
    }

    // Check for name field
    if (!data.name) {
      throw new ApiError({
        type: ErrorType.DATA_PROCESSING_ERROR,
        message: 'Missing required field: name',
        details: { receivedData: data },
        timestamp: new Date()
      });
    }

    // Validate teams field (critical for team identification)
    if (!data.teams || !Array.isArray(data.teams)) {
      throw new ApiError({
        type: ErrorType.DATA_PROCESSING_ERROR,
        message: 'Missing or invalid teams field - teams array is required',
        details: { receivedData: data },
        timestamp: new Date()
      });
    }

    // Validate catalog_items structure
    if (data.catalog_items && typeof data.catalog_items !== 'object') {
      throw new ApiError({
        type: ErrorType.DATA_PROCESSING_ERROR,
        message: 'Invalid catalog_items structure - expected object',
        details: { catalogItems: data.catalog_items },
        timestamp: new Date()
      });
    }

    // Validate teams structure
    if (data.teams && !Array.isArray(data.teams)) {
      throw new ApiError({
        type: ErrorType.DATA_PROCESSING_ERROR,
        message: 'Invalid teams structure - expected array',
        details: { teams: data.teams },
        timestamp: new Date()
      });
    }

    // Validate numeric fields
    const numericFields = ['total_points', 'total_challenges', 'total_catalog_items'];
    for (const field of numericFields) {
      if (field in data && typeof data[field] !== 'number') {
        throw new ApiError({
          type: ErrorType.DATA_PROCESSING_ERROR,
          message: `Invalid ${field} - expected number`,
          details: { field, value: data[field] },
          timestamp: new Date()
        });
      }
    }
  }

  /**
   * Handle errors from player data operations
   */
  private handlePlayerDataError(error: unknown, playerId?: string): ApiError {
    if (error instanceof ApiError) {
      return error;
    }

    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      
      if (axiosError.code === 'ECONNABORTED') {
        return new ApiError({
          type: ErrorType.NETWORK_ERROR,
          message: 'Player data request timed out',
          details: { playerId, timeout: '15000ms' },
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
              message: 'Authentication failed while fetching player data',
              details: { playerId, error: data?.error },
              timestamp: new Date()
            });
          case 403:
            return new ApiError({
              type: ErrorType.AUTHENTICATION_ERROR,
              message: 'Access forbidden for player data',
              details: { playerId, error: data?.error },
              timestamp: new Date()
            });
          case 404:
            return new ApiError({
              type: ErrorType.FUNIFIER_API_ERROR,
              message: 'Player not found',
              details: { playerId, error: data?.error },
              timestamp: new Date()
            });
          case 429:
            return new ApiError({
              type: ErrorType.FUNIFIER_API_ERROR,
              message: 'Rate limit exceeded for player data requests',
              details: { playerId, error: data?.error },
              timestamp: new Date()
            });
          case 500:
            return new ApiError({
              type: ErrorType.FUNIFIER_API_ERROR,
              message: 'Funifier server error',
              details: { playerId, error: data?.error },
              timestamp: new Date()
            });
          default:
            return new ApiError({
              type: ErrorType.FUNIFIER_API_ERROR,
              message: `Player data request failed with status ${status}`,
              details: { playerId, status, error: data?.error || axiosError.message },
              timestamp: new Date()
            });
        }
      }

      if (axiosError.request) {
        return new ApiError({
          type: ErrorType.NETWORK_ERROR,
          message: 'Network error while fetching player data',
          details: { playerId, error: 'No response received from server' },
          timestamp: new Date()
        });
      }
    }

    return new ApiError({
      type: ErrorType.DATA_PROCESSING_ERROR,
      message: 'Unknown error while processing player data',
      details: { 
        playerId, 
        error: error instanceof Error ? error.message : String(error) 
      },
      timestamp: new Date()
    });
  }
}

// Export singleton instance
export const funifierPlayerService = FunifierPlayerService.getInstance();