import { funifierApiService } from './funifier-api.service';
import { errorHandlerService } from './error-handler.service';
import { secureLogger } from '../utils/logger';
import { VirtualGoodItem, Catalog, STORE_ERROR_MESSAGES } from '../types';

/**
 * Service for managing virtual goods items and catalogs
 * Handles fetching, filtering, and organizing virtual goods from Funifier API
 */
export class VirtualGoodsService {
  private static instance: VirtualGoodsService;

  private constructor() {}

  public static getInstance(): VirtualGoodsService {
    if (!VirtualGoodsService.instance) {
      VirtualGoodsService.instance = new VirtualGoodsService();
    }
    return VirtualGoodsService.instance;
  }

  /**
   * Fetch all virtual goods items from Funifier API
   * @returns Array of virtual goods items
   */
  public async getVirtualGoodsItems(): Promise<VirtualGoodItem[]> {
    try {
      secureLogger.log('🛍️ Fetching virtual goods items from Funifier API');
      const items = await funifierApiService.getVirtualGoodsItems();
      secureLogger.log(`✅ Fetched ${items.length} virtual goods items`);
      return items as VirtualGoodItem[];
    } catch (error) {
      secureLogger.error('❌ Error fetching virtual goods items:', error);
      throw errorHandlerService.handleFunifierError(error, 'get_virtual_goods_items');
    }
  }

  /**
   * Filter items by currency type (type 0 requirements)
   * Only returns items that have a type 0 requirement matching the specified currency
   * @param items Array of virtual goods items to filter
   * @param currencyId The currency point ID to filter by (e.g., "coins")
   * @returns Filtered array of items that can be purchased with the specified currency
   */
  public filterItemsByCurrency(items: VirtualGoodItem[], currencyId: string): VirtualGoodItem[] {
    secureLogger.log(`🔍 Filtering ${items.length} items by currency: ${currencyId}`);
    
    const filteredItems = items.filter(item => {
      // Check if item has any type 0 requirement matching the currency
      const hasMatchingCurrency = item.requires.some(
        req => req.type === 0 && req.item === currencyId
      );
      return hasMatchingCurrency;
    });

    secureLogger.log(`✅ Filtered to ${filteredItems.length} items with currency ${currencyId}`);
    return filteredItems;
  }

  /**
   * Extract the price of an item for a specific currency
   * Looks for type 0 requirement matching the currency and returns the total
   * @param item The virtual goods item
   * @param currencyId The currency point ID (e.g., "coins")
   * @returns The price as a number, or null if no matching currency requirement found
   */
  public getItemPrice(item: VirtualGoodItem, currencyId: string): number | null {
    const requirement = item.requires.find(
      req => req.type === 0 && req.item === currencyId
    );

    if (!requirement) {
      secureLogger.log(`⚠️ No price found for item ${item._id} with currency ${currencyId}`);
      return null;
    }

    return requirement.total;
  }

  /**
   * Fetch all catalogs from Funifier API
   * @returns Array of catalogs
   */
  public async getCatalogs(): Promise<Catalog[]> {
    try {
      secureLogger.log('📚 Fetching catalogs from Funifier API');
      const catalogs = await funifierApiService.getCatalogs();
      secureLogger.log(`✅ Fetched ${catalogs.length} catalogs`);
      return catalogs as Catalog[];
    } catch (error) {
      secureLogger.error('❌ Error fetching catalogs:', error);
      throw errorHandlerService.handleFunifierError(error, 'get_catalogs');
    }
  }

  /**
   * Group items by their catalog ID
   * @param items Array of virtual goods items to group
   * @returns Map with catalog IDs as keys and arrays of items as values
   */
  public groupItemsByCatalog(items: VirtualGoodItem[]): Map<string, VirtualGoodItem[]> {
    secureLogger.log(`📦 Grouping ${items.length} items by catalog`);
    
    const groupedItems = new Map<string, VirtualGoodItem[]>();

    items.forEach(item => {
      const catalogId = item.catalogId;
      
      if (!groupedItems.has(catalogId)) {
        groupedItems.set(catalogId, []);
      }
      
      groupedItems.get(catalogId)!.push(item);
    });

    secureLogger.log(`✅ Grouped items into ${groupedItems.size} catalogs`);
    return groupedItems;
  }
}

// Export singleton instance
export const virtualGoodsService = VirtualGoodsService.getInstance();
