import { StoreConfiguration, DEFAULT_STORE_CONFIG, STORE_ERROR_MESSAGES } from '../types';
import { funifierApiService } from './funifier-api.service';
import { errorHandlerService } from './error-handler.service';
import { secureLogger } from '../utils/logger';

/**
 * StoreService - Manages store configuration for the storefront
 * 
 * Responsibilities:
 * - Fetch store configuration from store__c custom collection
 * - Save store configuration to store__c custom collection
 * - Provide default configuration when none exists
 * - Validate configuration data
 * - Cache configuration for session
 */
export class StoreService {
  private static instance: StoreService;
  private configCache: StoreConfiguration | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

  private constructor() {}

  public static getInstance(): StoreService {
    if (!StoreService.instance) {
      StoreService.instance = new StoreService();
    }
    return StoreService.instance;
  }

  /**
   * Get store configuration with fallback to default
   * Implements caching to reduce API calls
   * @returns Store configuration object
   */
  public async getStoreConfiguration(): Promise<StoreConfiguration> {
    try {
      // Check if cache is valid
      const now = Date.now();
      if (this.configCache && (now - this.cacheTimestamp) < this.CACHE_TTL) {
        secureLogger.log('📦 Returning cached store configuration');
        return this.configCache;
      }

      secureLogger.log('🔍 Fetching store configuration from Funifier');
      
      // Fetch configuration from store__c collection
      const rawConfig = await funifierApiService.getStoreConfig();

      if (!rawConfig) {
        secureLogger.log('⚠️ No store configuration found, using default configuration');
        const defaultConfig = this.getDefaultConfiguration();
        
        // Cache the default configuration
        this.configCache = defaultConfig;
        this.cacheTimestamp = now;
        
        return defaultConfig;
      }

      // Transform raw config to StoreConfiguration interface
      const config: StoreConfiguration = {
        currencyId: rawConfig.currencyId || DEFAULT_STORE_CONFIG.currencyId,
        currencyName: rawConfig.currencyName || DEFAULT_STORE_CONFIG.currencyName,
        grayOutLocked: rawConfig.grayOutLocked ?? DEFAULT_STORE_CONFIG.grayOutLocked,
        levels: rawConfig.levels || DEFAULT_STORE_CONFIG.levels
      };

      // Validate the configuration
      if (!this.validateConfiguration(config)) {
        secureLogger.log('⚠️ Invalid store configuration, using default configuration');
        const defaultConfig = this.getDefaultConfiguration();
        
        // Cache the default configuration
        this.configCache = defaultConfig;
        this.cacheTimestamp = now;
        
        return defaultConfig;
      }

      secureLogger.log('✅ Store configuration loaded successfully');
      
      // Cache the configuration
      this.configCache = config;
      this.cacheTimestamp = now;

      return config;
    } catch (error) {
      secureLogger.error('❌ Error fetching store configuration:', error);
      
      // Fallback to default configuration on error
      secureLogger.log('⚠️ Falling back to default configuration due to error');
      const defaultConfig = this.getDefaultConfiguration();
      
      // Cache the default configuration
      this.configCache = defaultConfig;
      this.cacheTimestamp = Date.now();
      
      return defaultConfig;
    }
  }

  /**
   * Save store configuration to store__c custom collection
   * Validates configuration before saving
   * Invalidates cache after successful save
   * @param config Store configuration to save
   * @throws Error if validation fails or save operation fails
   */
  public async saveStoreConfiguration(config: StoreConfiguration): Promise<void> {
    try {
      secureLogger.log('💾 Saving store configuration');

      // Validate configuration before saving
      if (!this.validateConfiguration(config)) {
        const error = new Error(STORE_ERROR_MESSAGES.INVALID_CONFIGURATION);
        secureLogger.error('❌ Invalid configuration:', error);
        throw error;
      }

      // Save to store__c collection
      await funifierApiService.saveStoreConfig(config);

      secureLogger.log('✅ Store configuration saved successfully');

      // Invalidate cache to force refresh on next fetch
      this.invalidateCache();
    } catch (error) {
      secureLogger.error('❌ Error saving store configuration:', error);
      throw errorHandlerService.handleFunifierError(error, 'save_store_configuration');
    }
  }

  /**
   * Get default store configuration
   * Returns the default configuration with backend_tools hidden
   * @returns Default store configuration
   */
  public getDefaultConfiguration(): StoreConfiguration {
    secureLogger.log('📋 Returning default store configuration');
    
    // Return a deep copy to prevent mutations
    return {
      currencyId: DEFAULT_STORE_CONFIG.currencyId,
      currencyName: DEFAULT_STORE_CONFIG.currencyName,
      grayOutLocked: DEFAULT_STORE_CONFIG.grayOutLocked,
      levels: DEFAULT_STORE_CONFIG.levels.map(level => ({ ...level }))
    };
  }

  /**
   * Validate store configuration
   * Checks for required fields and valid data types
   * @param config Store configuration to validate
   * @returns true if configuration is valid, false otherwise
   */
  public validateConfiguration(config: StoreConfiguration): boolean {
    try {
      // Check required fields exist
      if (!config.currencyId || typeof config.currencyId !== 'string') {
        secureLogger.log('⚠️ Invalid currencyId in configuration');
        return false;
      }

      if (!config.currencyName || typeof config.currencyName !== 'string') {
        secureLogger.log('⚠️ Invalid currencyName in configuration');
        return false;
      }

      if (typeof config.grayOutLocked !== 'boolean') {
        secureLogger.log('⚠️ Invalid grayOutLocked in configuration');
        return false;
      }

      if (!Array.isArray(config.levels)) {
        secureLogger.log('⚠️ Invalid levels array in configuration');
        return false;
      }

      // Validate each level configuration
      for (const level of config.levels) {
        if (!level.catalogId || typeof level.catalogId !== 'string') {
          secureLogger.log(`⚠️ Invalid catalogId in level: ${JSON.stringify(level)}`);
          return false;
        }

        if (typeof level.levelNumber !== 'number' || level.levelNumber < 0) {
          secureLogger.log(`⚠️ Invalid levelNumber in level: ${JSON.stringify(level)}`);
          return false;
        }

        if (!level.levelName || typeof level.levelName !== 'string') {
          secureLogger.log(`⚠️ Invalid levelName in level: ${JSON.stringify(level)}`);
          return false;
        }

        if (typeof level.visible !== 'boolean') {
          secureLogger.log(`⚠️ Invalid visible flag in level: ${JSON.stringify(level)}`);
          return false;
        }
      }

      secureLogger.log('✅ Configuration validation passed');
      return true;
    } catch (error) {
      secureLogger.error('❌ Error during configuration validation:', error);
      return false;
    }
  }

  /**
   * Invalidate the configuration cache
   * Forces next getStoreConfiguration call to fetch fresh data
   */
  public invalidateCache(): void {
    secureLogger.log('🗑️ Invalidating store configuration cache');
    this.configCache = null;
    this.cacheTimestamp = 0;
  }

  /**
   * Clear the configuration cache (alias for invalidateCache)
   */
  public clearCache(): void {
    this.invalidateCache();
  }
}

// Export singleton instance
export const storeService = StoreService.getInstance();
