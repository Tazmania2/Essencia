import axios, { AxiosError } from 'axios';
import {
  DashboardConfigurationRecord,
  DashboardConfig,
  TeamType,
  ApiError,
  ErrorType,
  FUNIFIER_CONFIG
} from '../types';
import { funifierAuthService } from './funifier-auth.service';
import { secureLogger } from '../utils/logger';
import { getAllDefaultConfigurations } from '../utils/dashboard-defaults';
import { errorHandlerService } from './error-handler.service';

export class DashboardConfigurationService {
  private static instance: DashboardConfigurationService;
  private configCache: DashboardConfigurationRecord | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  public static getInstance(): DashboardConfigurationService {
    if (!DashboardConfigurationService.instance) {
      DashboardConfigurationService.instance = new DashboardConfigurationService();
    }
    return DashboardConfigurationService.instance;
  }

  /**
   * Get the current active dashboard configuration
   */
  public async getCurrentConfiguration(): Promise<DashboardConfigurationRecord> {
    try {
      // Check cache first
      if (this.isCacheValid()) {
        secureLogger.info('Returning cached dashboard configuration', { 
          version: this.configCache?.version,
          cacheAge: Date.now() - this.cacheTimestamp 
        });
        return this.configCache!;
      }

      secureLogger.info('Cache invalid or empty, fetching configuration from database');

      let token: string | null = null;
      try {
        token = await funifierAuthService.getAccessToken();
      } catch (authError) {
        secureLogger.warn('Authentication failed, falling back to default configuration', { 
          error: authError instanceof Error ? authError.message : String(authError) 
        });
        return this.getDefaultConfiguration();
      }

      if (!token) {
        secureLogger.warn('No authentication token available, falling back to default configuration');
        return this.getDefaultConfiguration();
      }

      // Try to get active configuration from database
      const filter = { isActive: true };
      let response;
      
      try {
        response = await axios.get(
          `${FUNIFIER_CONFIG.BASE_URL}/database/${FUNIFIER_CONFIG.DASHBOARD_CONFIG_COLLECTION}`,
          {
            headers: {
              ...funifierAuthService.getAuthHeader(),
              'Content-Type': 'application/json',
            },
            params: { filter: JSON.stringify(filter) },
            timeout: 15000,
          }
        );
      } catch (networkError) {
        const handledError = errorHandlerService.handleFunifierError(networkError, 'getCurrentConfiguration');
        await errorHandlerService.logError(handledError, 'getCurrentConfiguration');
        
        secureLogger.warn('Network error fetching configuration, falling back to default', { 
          error: handledError.message,
          errorType: handledError.type 
        });
        return this.getDefaultConfiguration();
      }

      const configurations = Array.isArray(response.data) ? response.data : [];
      
      if (configurations.length === 0) {
        secureLogger.info('No database configuration found, returning default configuration');
        return this.getDefaultConfiguration();
      }

      // Sort by version descending to get the latest with error handling
      let latestConfig: DashboardConfigurationRecord;
      try {
        latestConfig = configurations.sort((a: DashboardConfigurationRecord, b: DashboardConfigurationRecord) => {
          const versionA = typeof a.version === 'number' ? a.version : 0;
          const versionB = typeof b.version === 'number' ? b.version : 0;
          return versionB - versionA;
        })[0];
      } catch (sortError) {
        secureLogger.warn('Error sorting configurations, using first available', { 
          error: sortError,
          configCount: configurations.length 
        });
        latestConfig = configurations[0];
      }

      // Validate the configuration before caching
      if (this.isValidConfigurationStructure(latestConfig)) {
        this.updateCache(latestConfig);
        secureLogger.info('Retrieved and cached dashboard configuration from database', { 
          version: latestConfig.version,
          configId: latestConfig._id 
        });
        return latestConfig;
      } else {
        secureLogger.warn('Database configuration is corrupted, attempting repair', { 
          configId: latestConfig._id,
          version: latestConfig.version 
        });
        
        // Attempt to repair the configuration
        try {
          const repairedConfig = this.repairConfiguration(latestConfig);
          this.updateCache(repairedConfig);
          secureLogger.info('Configuration repaired and cached', { 
            originalVersion: latestConfig.version,
            repairedVersion: repairedConfig.version 
          });
          return repairedConfig;
        } catch (repairError) {
          secureLogger.error('Failed to repair configuration, falling back to default', { 
            error: repairError 
          });
          return this.getDefaultConfiguration();
        }
      }

    } catch (error) {
      const handledError = errorHandlerService.handleDataProcessingError(error, 'getCurrentConfiguration');
      await errorHandlerService.logError(handledError, 'getCurrentConfiguration');
      
      secureLogger.error('Unexpected error getting current configuration', { 
        error: handledError.message,
        errorType: handledError.type 
      });
      
      // Always fall back to default configuration on any error
      secureLogger.warn('All configuration retrieval methods failed, using default configuration');
      return this.getDefaultConfiguration();
    }
  }

  /**
   * Save a new dashboard configuration
   */
  public async saveConfiguration(config: Omit<DashboardConfigurationRecord, '_id' | 'version' | 'createdAt'>): Promise<DashboardConfigurationRecord> {
    try {
      // Input validation
      if (!config) {
        throw new ApiError({
          type: ErrorType.VALIDATION_ERROR,
          message: 'Configuration data is required',
          timestamp: new Date()
        });
      }

      if (!config.createdBy || typeof config.createdBy !== 'string' || config.createdBy.trim().length === 0) {
        throw new ApiError({
          type: ErrorType.VALIDATION_ERROR,
          message: 'createdBy field is required and must be a non-empty string',
          details: { createdBy: config.createdBy },
          timestamp: new Date()
        });
      }

      if (!config.configurations || typeof config.configurations !== 'object') {
        throw new ApiError({
          type: ErrorType.VALIDATION_ERROR,
          message: 'configurations object is required',
          details: { hasConfigurations: !!config.configurations },
          timestamp: new Date()
        });
      }

      // Validate that all team types are present
      const missingTeamTypes = Object.values(TeamType).filter(teamType => 
        !config.configurations[teamType]
      );

      if (missingTeamTypes.length > 0) {
        throw new ApiError({
          type: ErrorType.VALIDATION_ERROR,
          message: `Missing configurations for team types: ${missingTeamTypes.join(', ')}`,
          details: { missingTeamTypes },
          timestamp: new Date()
        });
      }

      secureLogger.info('Saving dashboard configuration', { 
        createdBy: config.createdBy,
        teamTypes: Object.keys(config.configurations) 
      });

      let token: string | null = null;
      try {
        token = await funifierAuthService.getAccessToken();
      } catch (authError) {
        throw new ApiError({
          type: ErrorType.AUTHENTICATION_ERROR,
          message: 'Failed to obtain authentication token',
          details: { error: authError instanceof Error ? authError.message : String(authError) },
          timestamp: new Date()
        });
      }

      if (!token) {
        throw new ApiError({
          type: ErrorType.AUTHENTICATION_ERROR,
          message: 'No valid authentication token available',
          timestamp: new Date()
        });
      }

      // Get current configuration to determine next version
      let nextVersion = 1;
      try {
        const currentConfig = await this.getCurrentConfiguration();
        if (currentConfig._id && currentConfig._id !== 'default_config') {
          nextVersion = (typeof currentConfig.version === 'number' ? currentConfig.version : 0) + 1;
        }
      } catch (error) {
        // If we can't get current config, start with version 1
        secureLogger.warn('Could not determine current version, starting with version 1', { 
          error: error instanceof Error ? error.message : String(error) 
        });
      }

      // Deactivate current configuration first
      try {
        await this.deactivateCurrentConfiguration();
      } catch (deactivateError) {
        secureLogger.warn('Failed to deactivate current configuration, continuing with save', { 
          error: deactivateError instanceof Error ? deactivateError.message : String(deactivateError) 
        });
      }

      // Create new configuration record
      const newConfig: DashboardConfigurationRecord = {
        _id: this.generateConfigId(),
        version: nextVersion,
        createdAt: new Date().toISOString(),
        createdBy: config.createdBy.trim(),
        configurations: config.configurations,
        isActive: true
      };

      // Validate the new configuration structure before saving
      if (!this.isValidConfigurationStructure(newConfig)) {
        throw new ApiError({
          type: ErrorType.VALIDATION_ERROR,
          message: 'Generated configuration has invalid structure',
          details: { configId: newConfig._id, version: newConfig.version },
          timestamp: new Date()
        });
      }

      // Save to database
      let response;
      try {
        response = await axios.post(
          `${FUNIFIER_CONFIG.BASE_URL}/database/${FUNIFIER_CONFIG.DASHBOARD_CONFIG_COLLECTION}`,
          newConfig,
          {
            headers: {
              ...funifierAuthService.getAuthHeader(),
              'Content-Type': 'application/json',
            },
            timeout: 15000,
          }
        );
      } catch (networkError) {
        const handledError = this.handleConfigurationError(networkError, 'save configuration');
        await errorHandlerService.logError(handledError, 'saveConfiguration');
        throw handledError;
      }

      const savedConfig = response.data;
      
      // Validate saved configuration
      if (!this.isValidConfigurationStructure(savedConfig)) {
        secureLogger.error('Saved configuration has invalid structure', { 
          configId: savedConfig._id,
          version: savedConfig.version 
        });
        
        throw new ApiError({
          type: ErrorType.DATA_PROCESSING_ERROR,
          message: 'Saved configuration has invalid structure',
          details: { configId: savedConfig._id },
          timestamp: new Date()
        });
      }

      // Update cache
      this.updateCache(savedConfig);
      
      secureLogger.info('Dashboard configuration saved successfully', { 
        version: savedConfig.version,
        configId: savedConfig._id,
        createdBy: savedConfig.createdBy 
      });

      return savedConfig;

    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      const handledError = this.handleConfigurationError(error, 'save configuration');
      await errorHandlerService.logError(handledError, 'saveConfiguration');
      throw handledError;
    }
  }

  /**
   * Get configuration history (all versions)
   */
  public async getConfigurationHistory(): Promise<DashboardConfigurationRecord[]> {
    try {
      const token = await funifierAuthService.getAccessToken();
      if (!token) {
        throw new ApiError({
          type: ErrorType.AUTHENTICATION_ERROR,
          message: 'No valid authentication token available',
          timestamp: new Date()
        });
      }

      const response = await axios.get(
        `${FUNIFIER_CONFIG.BASE_URL}/database/${FUNIFIER_CONFIG.DASHBOARD_CONFIG_COLLECTION}`,
        {
          headers: {
            ...funifierAuthService.getAuthHeader(),
            'Content-Type': 'application/json',
          },
          timeout: 20000,
        }
      );

      const configurations = response.data || [];
      
      // Sort by version descending (newest first)
      return configurations.sort((a: DashboardConfigurationRecord, b: DashboardConfigurationRecord) => 
        b.version - a.version
      );

    } catch (error) {
      throw this.handleConfigurationError(error, 'get configuration history');
    }
  }

  /**
   * Update an existing configuration record
   */
  public async updateConfiguration(configId: string, updates: Partial<DashboardConfigurationRecord>): Promise<DashboardConfigurationRecord> {
    try {
      const token = await funifierAuthService.getAccessToken();
      if (!token) {
        throw new ApiError({
          type: ErrorType.AUTHENTICATION_ERROR,
          message: 'No valid authentication token available',
          timestamp: new Date()
        });
      }

      // Add updatedAt timestamp
      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString()
      };

      const response = await axios.put(
        `${FUNIFIER_CONFIG.BASE_URL}/database/${FUNIFIER_CONFIG.DASHBOARD_CONFIG_COLLECTION}/${configId}`,
        updateData,
        {
          headers: {
            ...funifierAuthService.getAuthHeader(),
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        }
      );

      const updatedConfig = response.data;
      
      // Clear cache to force refresh
      this.clearCache();
      
      secureLogger.info('Dashboard configuration updated successfully', { 
        configId: updatedConfig._id,
        version: updatedConfig.version 
      });

      return updatedConfig;

    } catch (error) {
      throw this.handleConfigurationError(error, 'update configuration');
    }
  }

  /**
   * Delete a configuration record
   */
  public async deleteConfiguration(configId: string): Promise<void> {
    try {
      const token = await funifierAuthService.getAccessToken();
      if (!token) {
        throw new ApiError({
          type: ErrorType.AUTHENTICATION_ERROR,
          message: 'No valid authentication token available',
          timestamp: new Date()
        });
      }

      await axios.delete(
        `${FUNIFIER_CONFIG.BASE_URL}/database/${FUNIFIER_CONFIG.DASHBOARD_CONFIG_COLLECTION}/${configId}`,
        {
          headers: {
            ...funifierAuthService.getAuthHeader(),
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        }
      );

      // Clear cache
      this.clearCache();
      
      secureLogger.info('Dashboard configuration deleted successfully', { configId });

    } catch (error) {
      throw this.handleConfigurationError(error, 'delete configuration');
    }
  }

  /**
   * Get configuration for a specific team type
   */
  public async getTeamConfiguration(teamType: TeamType): Promise<DashboardConfig> {
    const currentConfig = await this.getCurrentConfiguration();
    return currentConfig.configurations[teamType];
  }

  /**
   * Clear the configuration cache
   */
  public clearCache(): void {
    this.configCache = null;
    this.cacheTimestamp = 0;
    secureLogger.info('Dashboard configuration cache cleared');
  }

  /**
   * Get the default configuration (hardcoded fallback)
   */
  public getDefaultConfiguration(): DashboardConfigurationRecord {
    return {
      _id: 'default_config',
      version: 0,
      createdAt: new Date().toISOString(),
      createdBy: 'system',
      configurations: getAllDefaultConfigurations(),
      isActive: true
    };
  }

  /**
   * Initialize database with default configuration if none exists
   */
  public async seedDefaultConfiguration(createdBy: string = 'system'): Promise<DashboardConfigurationRecord> {
    try {
      // Check if any configuration exists
      const existingConfigs = await this.getConfigurationHistory();
      
      if (existingConfigs.length > 0) {
        secureLogger.info('Configuration already exists, skipping seed');
        return existingConfigs[0];
      }

      // Create initial configuration from defaults
      const defaultConfig = {
        createdBy,
        configurations: getAllDefaultConfigurations()
      };

      const seededConfig = await this.saveConfiguration(defaultConfig);
      secureLogger.info('Default configuration seeded successfully', { 
        version: seededConfig.version,
        configId: seededConfig._id 
      });

      return seededConfig;

    } catch (error) {
      secureLogger.error('Failed to seed default configuration', { error });
      // Return default configuration even if seeding fails
      secureLogger.warn('Seeding failed, returning default configuration without database storage');
      return this.getDefaultConfiguration();
    }
  }

  /**
   * Ensure configuration exists in database, seed if necessary
   */
  public async ensureConfigurationExists(createdBy: string = 'system'): Promise<DashboardConfigurationRecord> {
    try {
      // Try to get current configuration
      const currentConfig = await this.getCurrentConfiguration();
      
      // If we got a default configuration (no database record), try to seed it
      if (currentConfig._id === 'default_config') {
        secureLogger.info('Default configuration detected, attempting to seed database');
        return await this.seedDefaultConfiguration(createdBy);
      }
      
      return currentConfig;
    } catch (error) {
      secureLogger.error('Failed to ensure configuration exists', { error });
      return this.getDefaultConfiguration();
    }
  }

  /**
   * Get configuration with guaranteed fallback to defaults
   */
  public async getConfigurationSafe(): Promise<DashboardConfigurationRecord> {
    try {
      return await this.getCurrentConfiguration();
    } catch (error) {
      secureLogger.error('All configuration retrieval methods failed, using hardcoded defaults', { error });
      return this.getDefaultConfiguration();
    }
  }

  /**
   * Validate configuration structure integrity
   */
  private isValidConfigurationStructure(config: any): boolean {
    try {
      return !!(
        config &&
        config._id &&
        config.version !== undefined &&
        config.createdAt &&
        config.createdBy &&
        config.configurations &&
        typeof config.configurations === 'object' &&
        typeof config.isActive === 'boolean' &&
        // Check that all team types are present
        Object.values(TeamType).every(teamType => 
          config.configurations[teamType] &&
          config.configurations[teamType].teamType === teamType
        )
      );
    } catch {
      return false;
    }
  }

  /**
   * Repair corrupted configuration by merging with defaults
   */
  public repairConfiguration(corruptedConfig: Partial<DashboardConfigurationRecord>): DashboardConfigurationRecord {
    const defaultConfig = this.getDefaultConfiguration();
    
    return {
      _id: corruptedConfig._id || defaultConfig._id,
      version: corruptedConfig.version || defaultConfig.version,
      createdAt: corruptedConfig.createdAt || defaultConfig.createdAt,
      createdBy: corruptedConfig.createdBy || defaultConfig.createdBy,
      configurations: this.mergeConfigurations(corruptedConfig.configurations, defaultConfig.configurations),
      isActive: corruptedConfig.isActive !== undefined ? corruptedConfig.isActive : defaultConfig.isActive
    };
  }

  /**
   * Merge configurations with defaults as fallback
   */
  private mergeConfigurations(
    userConfigs: Partial<Record<TeamType, DashboardConfig>> | undefined,
    defaultConfigs: Record<TeamType, DashboardConfig>
  ): Record<TeamType, DashboardConfig> {
    const merged: Record<TeamType, DashboardConfig> = { ...defaultConfigs };
    
    if (userConfigs) {
      Object.values(TeamType).forEach(teamType => {
        if (userConfigs[teamType] && this.isValidTeamConfig(userConfigs[teamType]!)) {
          merged[teamType] = userConfigs[teamType]!;
        }
      });
    }
    
    return merged;
  }

  /**
   * Validate individual team configuration structure
   */
  private isValidTeamConfig(config: DashboardConfig): boolean {
    try {
      return !!(
        config.teamType &&
        config.displayName &&
        config.primaryGoal &&
        config.secondaryGoal1 &&
        config.secondaryGoal2 &&
        config.unlockConditions &&
        config.primaryGoal.name &&
        config.primaryGoal.challengeId &&
        config.secondaryGoal1.boost &&
        config.secondaryGoal2.boost
      );
    } catch {
      return false;
    }
  }

  /**
   * Reset configuration to defaults (emergency function)
   */
  public async resetToDefaults(createdBy: string = 'system_reset'): Promise<DashboardConfigurationRecord> {
    try {
      secureLogger.warn('Resetting configuration to defaults', { createdBy });
      
      // Clear cache first
      this.clearCache();
      
      // Create new default configuration
      const resetConfig = {
        createdBy: `${createdBy}_${Date.now()}`,
        configurations: getAllDefaultConfigurations()
      };

      const savedConfig = await this.saveConfiguration(resetConfig);
      secureLogger.info('Configuration reset to defaults successfully', { 
        version: savedConfig.version,
        configId: savedConfig._id 
      });

      return savedConfig;
    } catch (error) {
      secureLogger.error('Failed to reset configuration to defaults', { error });
      // Even if saving fails, return the default configuration
      return this.getDefaultConfiguration();
    }
  }

  /**
   * Check if the cache is still valid
   */
  private isCacheValid(): boolean {
    return this.configCache !== null && 
           (Date.now() - this.cacheTimestamp) < this.CACHE_TTL;
  }

  /**
   * Update the configuration cache
   */
  private updateCache(config: DashboardConfigurationRecord): void {
    this.configCache = config;
    this.cacheTimestamp = Date.now();
  }

  /**
   * Deactivate the current active configuration
   */
  private async deactivateCurrentConfiguration(): Promise<void> {
    try {
      const currentConfig = await this.getCurrentConfiguration();
      if (currentConfig._id) {
        await this.updateConfiguration(currentConfig._id, { isActive: false });
      }
    } catch (error) {
      // If we can't deactivate current config, log warning but continue
      secureLogger.warn('Could not deactivate current configuration', { error });
    }
  }

  /**
   * Generate a unique configuration ID
   */
  private generateConfigId(): string {
    return `config_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Check if error is network or authentication related
   */
  private isNetworkOrAuthError(error: unknown): boolean {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      return !status || status === 401 || status === 403 || status >= 500;
    }
    return error instanceof ApiError && 
           (error.type === ErrorType.NETWORK_ERROR || error.type === ErrorType.AUTHENTICATION_ERROR);
  }

  /**
   * Handle configuration service errors
   */
  private handleConfigurationError(error: unknown, operation: string): ApiError {
    if (error instanceof ApiError) {
      return error;
    }

    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      
      if (axiosError.code === 'ECONNABORTED') {
        return new ApiError({
          type: ErrorType.NETWORK_ERROR,
          message: `Configuration ${operation} request timed out`,
          details: { operation },
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
              message: `Authentication failed during ${operation}`,
              details: { operation, error: data?.error },
              timestamp: new Date()
            });
          case 403:
            return new ApiError({
              type: ErrorType.AUTHENTICATION_ERROR,
              message: `Access forbidden for ${operation}`,
              details: { operation, error: data?.error },
              timestamp: new Date()
            });
          case 400:
            return new ApiError({
              type: ErrorType.VALIDATION_ERROR,
              message: `Invalid request for ${operation}`,
              details: { operation, error: data?.error },
              timestamp: new Date()
            });
          case 404:
            return new ApiError({
              type: ErrorType.FUNIFIER_API_ERROR,
              message: `Configuration collection not found for ${operation}`,
              details: { operation, collection: FUNIFIER_CONFIG.DASHBOARD_CONFIG_COLLECTION },
              timestamp: new Date()
            });
          default:
            return new ApiError({
              type: ErrorType.FUNIFIER_API_ERROR,
              message: `Configuration ${operation} failed with status ${status}`,
              details: { operation, status, error: data?.error || axiosError.message },
              timestamp: new Date()
            });
        }
      }

      if (axiosError.request) {
        return new ApiError({
          type: ErrorType.NETWORK_ERROR,
          message: `Network error during ${operation}`,
          details: { operation, error: 'No response received from server' },
          timestamp: new Date()
        });
      }
    }

    return new ApiError({
      type: ErrorType.DATA_PROCESSING_ERROR,
      message: `Unknown error during ${operation}`,
      details: { 
        operation, 
        error: error instanceof Error ? error.message : String(error) 
      },
      timestamp: new Date()
    });
  }
//
 Export singleton instance
export const dashboardConfigurationService = DashboardConfigurationService.getInstance();