import { Point } from '../types';
import { funifierApiService } from './funifier-api.service';
import { errorHandlerService } from './error-handler.service';

/**
 * PointsService - Manages currency/points operations for the storefront
 * 
 * Responsibilities:
 * - Fetch available point types from Funifier API
 * - Retrieve player balance for specific currencies
 * - Handle currency-related data transformations
 */
export class PointsService {
  private static instance: PointsService;

  private constructor() {}

  public static getInstance(): PointsService {
    if (!PointsService.instance) {
      PointsService.instance = new PointsService();
    }
    return PointsService.instance;
  }

  /**
   * Get all available point types from Funifier API
   * @returns Array of Point objects
   * @throws Error if API call fails
   */
  public async getAvailablePoints(): Promise<Point[]> {
    try {
      const rawPoints = await funifierApiService.getPoints();
      
      // Transform raw API data to Point interface
      // Note: In Funifier, _id IS the category identifier (e.g., "locked_points", "coins")
      const points: Point[] = rawPoints.map((point: any) => ({
        _id: point._id, // This is the actual category ID used in point_categories
        category: point.category || point._id, // Display name
        shortName: point.shortName || point.category || point._id,
        extra: point.extra || {},
        techniques: point.techniques || []
      }));

      return points;
    } catch (error) {
      throw errorHandlerService.handleFunifierError(error, 'get_available_points');
    }
  }

  /**
   * Get player's balance for a specific currency
   * Extracts balance from existing player/status data
   * @param playerId - The player's ID
   * @param currencyId - The currency/point category ID (e.g., "coins", "points")
   * @returns The player's balance for the specified currency, or 0 if not found
   */
  public async getPlayerBalance(playerId: string, currencyId: string): Promise<number> {
    try {
      // Fetch player status which includes point_categories
      const playerStatus = await funifierApiService.getPlayerStatus(playerId);
      
      // Extract balance from point_categories
      const pointCategories = playerStatus.point_categories || {};
      
      // Return the balance for the specified currency, default to 0 if not found
      const balance = pointCategories[currencyId] || 0;
      
      return balance;
    } catch (error) {
      // Handle missing currency gracefully by returning 0
      if (error instanceof Error && error.message.includes('not found')) {
        console.warn(`Currency ${currencyId} not found for player ${playerId}, returning 0`);
        return 0;
      }
      
      throw errorHandlerService.handleFunifierError(error, `get_player_balance:${playerId}:${currencyId}`);
    }
  }

  /**
   * Get player's balance from existing player status data (without additional API call)
   * Useful when player status is already available
   * @param playerStatus - The player's status object
   * @param currencyId - The currency/point category ID
   * @returns The player's balance for the specified currency, or 0 if not found
   */
  public getPlayerBalanceFromStatus(playerStatus: any, currencyId: string): number {
    const pointCategories = playerStatus.point_categories || {};
    return pointCategories[currencyId] || 0;
  }

  /**
   * Get player's owned catalog items
   * @param playerId - The player's ID
   * @returns Object mapping item IDs to quantities owned
   */
  public async getPlayerCatalogItems(playerId: string): Promise<Record<string, number>> {
    try {
      const playerStatus = await funifierApiService.getPlayerStatus(playerId);
      return playerStatus.catalog_items || {};
    } catch (error) {
      throw errorHandlerService.handleFunifierError(error, `get_player_catalog_items:${playerId}`);
    }
  }

  /**
   * Check if player owns a specific catalog item
   * @param playerId - The player's ID
   * @param itemId - The catalog item ID to check
   * @returns True if player owns at least one of the item, false otherwise
   */
  public async playerOwnsItem(playerId: string, itemId: string): Promise<boolean> {
    try {
      const catalogItems = await this.getPlayerCatalogItems(playerId);
      return (catalogItems[itemId] || 0) > 0;
    } catch (error) {
      console.warn(`Error checking if player owns item ${itemId}:`, error);
      return false;
    }
  }
}

// Export singleton instance
export const pointsService = PointsService.getInstance();
