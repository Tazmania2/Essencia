import { dashboardConfigurationService } from '../dashboard-configuration.service';
import { funifierAuthService } from '../funifier-auth.service';
import { getAllDefaultConfigurations } from '../../utils/dashboard-defaults';
import { TeamType, DashboardConfigurationRecord } from '../../types';
import axios from 'axios';

// Mock dependencies
jest.mock('axios');
jest.mock('../funifier-auth.service');
jest.mock('../../utils/logger');

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedFunifierAuth = funifierAuthService as jest.Mocked<typeof funifierAuthService>;

describe('DashboardConfigurationService', () => {
  let validConfiguration: DashboardConfigurationRecord;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Clear cache before each test
    dashboardConfigurationService.clearCache();
    
    validConfiguration = {
      _id: 'test_config_123',
      version: 1,
      createdAt: '2024-01-01T00:00:00Z',
      createdBy: 'test_user',
      configurations: getAllDefaultConfigurations(),
      isActive: true
    };

    // Default mock setup
    mockedFunifierAuth.getAccessToken.mockResolvedValue('mock_token');
    mockedFunifierAuth.getAuthHeader.mockReturnValue({ Authorization: 'Bearer mock_token' });
  });

  describe('getCurrentConfiguration', () => {
    it('should return database configuration when available', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: [validConfiguration]
      });

      const result = await dashboardConfigurationService.getCurrentConfiguration();

      expect(result).toEqual(validConfiguration);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/database/dashboards__c'),
        expect.objectContaining({
          params: { filter: JSON.stringify({ isActive: true }) }
        })
      );
    });

    it('should return default configuration when no database configuration exists', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: []
      });

      const result = await dashboardConfigurationService.getCurrentConfiguration();

      expect(result._id).toBe('default_config');
      expect(result.version).toBe(0);
      expect(result.configurations).toEqual(getAllDefaultConfigurations());
      expect(result.isActive).toBe(true);
    });

    it('should return default configuration when authentication fails', async () => {
      mockedFunifierAuth.getAccessToken.mockResolvedValueOnce(null);

      const result = await dashboardConfigurationService.getCurrentConfiguration();

      expect(result._id).toBe('default_config');
      expect(result.configurations).toEqual(getAllDefaultConfigurations());
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });

    it('should return default configuration when database request fails', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));

      const result = await dashboardConfigurationService.getCurrentConfiguration();

      expect(result._id).toBe('default_config');
      expect(result.configurations).toEqual(getAllDefaultConfigurations());
    });

    it('should return latest version when multiple configurations exist', async () => {
      const olderConfig = { ...validConfiguration, version: 1 };
      const newerConfig = { ...validConfiguration, version: 2, _id: 'newer_config' };
      
      mockedAxios.get.mockResolvedValueOnce({
        data: [olderConfig, newerConfig]
      });

      const result = await dashboardConfigurationService.getCurrentConfiguration();

      expect(result).toEqual(newerConfig);
      expect(result.version).toBe(2);
    });

    it('should use cached configuration when cache is valid', async () => {
      // First call to populate cache
      mockedAxios.get.mockResolvedValueOnce({
        data: [validConfiguration]
      });

      await dashboardConfigurationService.getCurrentConfiguration();

      // Second call should use cache
      const result = await dashboardConfigurationService.getCurrentConfiguration();

      expect(result).toEqual(validConfiguration);
      expect(mockedAxios.get).toHaveBeenCalledTimes(1); // Only called once
    });
  });

  describe('saveConfiguration', () => {
    it('should save new configuration successfully', async () => {
      const newConfig = {
        createdBy: 'test_user',
        configurations: getAllDefaultConfigurations()
      };

      // Mock getting current config (empty)
      mockedAxios.get.mockResolvedValueOnce({ data: [] });
      
      // Mock saving new config
      const savedConfig = { ...validConfiguration, version: 1 };
      mockedAxios.post.mockResolvedValueOnce({ data: savedConfig });

      const result = await dashboardConfigurationService.saveConfiguration(newConfig);

      expect(result.version).toBe(1);
      expect(result.isActive).toBe(true);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/database/dashboards__c'),
        expect.objectContaining({
          version: 1,
          isActive: true,
          configurations: getAllDefaultConfigurations()
        }),
        expect.any(Object)
      );
    });

    it('should increment version when saving over existing configuration', async () => {
      const newConfig = {
        createdBy: 'test_user',
        configurations: getAllDefaultConfigurations()
      };

      // Mock getting current config
      mockedAxios.get.mockResolvedValueOnce({ data: [validConfiguration] });
      
      // Mock deactivating current config
      mockedAxios.put.mockResolvedValueOnce({ data: { ...validConfiguration, isActive: false } });
      
      // Mock saving new config
      const savedConfig = { ...validConfiguration, version: 2 };
      mockedAxios.post.mockResolvedValueOnce({ data: savedConfig });

      const result = await dashboardConfigurationService.saveConfiguration(newConfig);

      expect(result.version).toBe(2);
    });
  });

  describe('getDefaultConfiguration', () => {
    it('should return valid default configuration', () => {
      const defaultConfig = dashboardConfigurationService.getDefaultConfiguration();

      expect(defaultConfig._id).toBe('default_config');
      expect(defaultConfig.version).toBe(0);
      expect(defaultConfig.isActive).toBe(true);
      expect(defaultConfig.configurations).toEqual(getAllDefaultConfigurations());
      
      // Verify all team types are present
      Object.values(TeamType).forEach(teamType => {
        expect(defaultConfig.configurations[teamType]).toBeDefined();
        expect(defaultConfig.configurations[teamType].teamType).toBe(teamType);
      });
    });
  });

  describe('seedDefaultConfiguration', () => {
    it('should seed configuration when none exists', async () => {
      // Mock no existing configurations
      mockedAxios.get.mockResolvedValueOnce({ data: [] });
      
      // Mock saving seeded config
      const seededConfig = { ...validConfiguration, createdBy: 'system' };
      mockedAxios.post.mockResolvedValueOnce({ data: seededConfig });

      const result = await dashboardConfigurationService.seedDefaultConfiguration();

      expect(result.createdBy).toBe('system');
      expect(result.configurations).toEqual(getAllDefaultConfigurations());
      expect(mockedAxios.post).toHaveBeenCalled();
    });

    it('should skip seeding when configuration already exists', async () => {
      // Mock existing configuration
      mockedAxios.get.mockResolvedValueOnce({ data: [validConfiguration] });

      const result = await dashboardConfigurationService.seedDefaultConfiguration();

      expect(result).toEqual(validConfiguration);
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    it('should return default configuration when seeding fails', async () => {
      // Mock no existing configurations
      mockedAxios.get.mockResolvedValueOnce({ data: [] });
      
      // Mock save failure
      mockedAxios.post.mockRejectedValueOnce(new Error('Save failed'));

      const result = await dashboardConfigurationService.seedDefaultConfiguration();

      expect(result._id).toBe('default_config');
      expect(result.configurations).toEqual(getAllDefaultConfigurations());
    });
  });

  describe('ensureConfigurationExists', () => {
    it('should return existing configuration when available', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: [validConfiguration] });

      const result = await dashboardConfigurationService.ensureConfigurationExists();

      expect(result).toEqual(validConfiguration);
    });

    it('should seed configuration when only default is available', async () => {
      // First call returns empty (triggers default)
      mockedAxios.get.mockResolvedValueOnce({ data: [] });
      
      // Second call for seeding also returns empty
      mockedAxios.get.mockResolvedValueOnce({ data: [] });
      
      // Mock successful seeding
      const seededConfig = { ...validConfiguration, createdBy: 'system' };
      mockedAxios.post.mockResolvedValueOnce({ data: seededConfig });

      const result = await dashboardConfigurationService.ensureConfigurationExists();

      expect(result.createdBy).toBe('system');
      expect(mockedAxios.post).toHaveBeenCalled();
    });
  });

  describe('getConfigurationSafe', () => {
    it('should return configuration when available', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: [validConfiguration] });

      const result = await dashboardConfigurationService.getConfigurationSafe();

      expect(result).toEqual(validConfiguration);
    });

    it('should return default configuration when all methods fail', async () => {
      mockedAxios.get.mockRejectedValue(new Error('All methods failed'));

      const result = await dashboardConfigurationService.getConfigurationSafe();

      expect(result._id).toBe('default_config');
      expect(result.configurations).toEqual(getAllDefaultConfigurations());
    });
  });

  describe('resetToDefaults', () => {
    it('should reset configuration to defaults', async () => {
      const resetConfig = { ...validConfiguration, createdBy: 'system_reset_123456789', version: 2 };
      mockedAxios.post.mockResolvedValueOnce({ data: resetConfig });

      const result = await dashboardConfigurationService.resetToDefaults('admin_user');

      expect(result.configurations).toEqual(getAllDefaultConfigurations());
      expect(result.createdBy).toContain('admin_user');
      expect(mockedAxios.post).toHaveBeenCalled();
    });

    it('should return default configuration when reset fails', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('Reset failed'));

      const result = await dashboardConfigurationService.resetToDefaults();

      expect(result._id).toBe('default_config');
      expect(result.configurations).toEqual(getAllDefaultConfigurations());
    });
  });

  describe('repairConfiguration', () => {
    it('should repair corrupted configuration with defaults', () => {
      const corruptedConfig = {
        _id: 'corrupted_config',
        version: 1,
        // Missing other required fields
      };

      const result = dashboardConfigurationService.repairConfiguration(corruptedConfig);

      expect(result._id).toBe('corrupted_config');
      expect(result.version).toBe(1);
      expect(result.createdAt).toBeDefined();
      expect(result.createdBy).toBeDefined();
      expect(result.configurations).toEqual(getAllDefaultConfigurations());
      expect(result.isActive).toBe(true);
    });

    it('should merge partial configurations with defaults', () => {
      const partialConfig = {
        _id: 'partial_config',
        version: 1,
        createdAt: '2024-01-01T00:00:00Z',
        createdBy: 'test_user',
        configurations: {
          [TeamType.CARTEIRA_I]: getAllDefaultConfigurations()[TeamType.CARTEIRA_I]
          // Missing other team configurations
        },
        isActive: true
      };

      const result = dashboardConfigurationService.repairConfiguration(partialConfig);

      expect(result.configurations[TeamType.CARTEIRA_I]).toEqual(
        getAllDefaultConfigurations()[TeamType.CARTEIRA_I]
      );
      // Other team configurations should be filled from defaults
      expect(result.configurations[TeamType.CARTEIRA_II]).toEqual(
        getAllDefaultConfigurations()[TeamType.CARTEIRA_II]
      );
      expect(result.configurations[TeamType.CARTEIRA_III]).toEqual(
        getAllDefaultConfigurations()[TeamType.CARTEIRA_III]
      );
    });
  });

  describe('cache management', () => {
    it('should clear cache properly', () => {
      // Populate cache first
      mockedAxios.get.mockResolvedValueOnce({ data: [validConfiguration] });
      
      dashboardConfigurationService.getCurrentConfiguration();
      dashboardConfigurationService.clearCache();

      // Next call should hit the API again
      dashboardConfigurationService.getCurrentConfiguration();

      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
    });
  });
});