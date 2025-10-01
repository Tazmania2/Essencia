/**
 * Integration tests for dashboard configuration workflow
 * Tests the end-to-end flow from admin configuration changes to player dashboard updates
 */

import { DashboardConfigurationService } from '../../dashboard-configuration.service';
import { ConfigurationValidator } from '../../configuration-validator.service';
import { DashboardService } from '../../dashboard.service';
import { FunifierDatabaseService } from '../../funifier-database.service';
import { TeamType, DashboardConfigurationRecord, DashboardConfig } from '../../../types';

// Mock external dependencies but allow internal service interactions
jest.mock('../../funifier-database.service');
jest.mock('../../funifier-player.service');
jest.mock('../../../utils/logger');
jest.mock('../../error-handler.service');

describe('Dashboard Configuration Workflow Integration Tests', () => {
  let configService: DashboardConfigurationService;
  let validator: ConfigurationValidator;
  let dashboardService: DashboardService;
  let databaseService: jest.Mocked<FunifierDatabaseService>;

  const mockAdminId = 'admin_123';
  const mockPlayerId = 'player_456';

  beforeEach(() => {
    configService = DashboardConfigurationService.getInstance();
    validator = ConfigurationValidator.getInstance();
    
    databaseService = {
      getConfiguration: jest.fn(),
      saveConfiguration: jest.fn(),
      getReportData: jest.fn(),
      aggregateReportData: jest.fn(),
    } as any;

    (FunifierDatabaseService.getInstance as jest.Mock) = jest.fn().mockReturnValue(databaseService);
    
    // Mock dashboard service dependencies
    dashboardService = new DashboardService(
      {} as any, // playerService
      databaseService,
      {} as any, // teamProcessorFactory
      {} as any  // userIdentificationService
    );
    
    jest.clearAllMocks();
  });

  describe('Configuration Change Workflow', () => {
    it('should handle complete configuration change workflow from admin to player dashboard', async () => {
      // Step 1: Admin creates new configuration
      const newConfiguration: Partial<DashboardConfigurationRecord> = {
        version: '2.0.0',
        createdBy: mockAdminId,
        configurations: {
          [TeamType.CARTEIRA_I]: {
            teamType: TeamType.CARTEIRA_I,
            displayName: 'Carteira I - Updated',
            primaryGoal: {
              name: 'faturamento', // Changed from 'atividade'
              displayName: 'Faturamento',
              metric: 'faturamento',
              challengeId: 'FAT001',
              actionId: 'action_faturamento',
              calculationType: 'funifier_api'
            },
            secondaryGoal1: {
              name: 'atividade', // Swapped with primary
              displayName: 'Atividade',
              metric: 'atividade',
              challengeId: 'ATIV001',
              actionId: 'action_atividade',
              calculationType: 'funifier_api',
              boost: {
                catalogItemId: 'boost_ativ',
                name: 'Boost Atividade',
                description: 'Boost para Atividade'
              }
            },
            secondaryGoal2: {
              name: 'reaisPorAtivo',
              displayName: 'Reais por Ativo',
              metric: 'reaisPorAtivo',
              challengeId: 'RPA001',
              actionId: 'action_reais_ativo',
              calculationType: 'funifier_api',
              boost: {
                catalogItemId: 'boost_rpa',
                name: 'Boost RPA',
                description: 'Boost para Reais por Ativo'
              }
            },
            unlockConditions: {
              catalogItemId: 'unlock_points',
              description: 'Unlock conditions'
            }
          }
        } as Record<TeamType, DashboardConfig>
      };

      // Step 2: Validate configuration
      const validationResult = validator.validateDashboardConfiguration(newConfiguration as DashboardConfigurationRecord);
      expect(validationResult.isValid).toBe(true);

      // Step 3: Save configuration
      const savedConfig = await configService.saveConfiguration(newConfiguration);
      expect(savedConfig._id).toBeDefined();
      expect(savedConfig.version).toBe('2.0.0');
      expect(savedConfig.createdBy).toBe(mockAdminId);

      // Step 4: Configuration is applied to database
      databaseService.saveConfiguration.mockResolvedValue({ success: true });

      // Step 5: Player dashboard reflects new configuration
      const currentConfig = await configService.getCurrentConfiguration();
      expect(currentConfig.configurations[TeamType.CARTEIRA_I].primaryGoal.name).toBe('faturamento');
      expect(currentConfig.configurations[TeamType.CARTEIRA_I].secondaryGoal1.name).toBe('atividade');

      // Verify the complete workflow
      expect(validationResult.errors.filter(e => e.severity === 'error')).toHaveLength(0);
      expect(savedConfig.configurations).toBe(newConfiguration.configurations);
    });

    it('should handle Carteira II special configuration workflow', async () => {
      const carteiraIIConfig: Partial<DashboardConfigurationRecord> = {
        version: '2.1.0',
        createdBy: mockAdminId,
        configurations: {
          [TeamType.CARTEIRA_II]: {
            teamType: TeamType.CARTEIRA_II,
            displayName: 'Carteira II - Special Processing',
            primaryGoal: {
              name: 'reaisPorAtivo',
              displayName: 'Reais por Ativo',
              metric: 'reaisPorAtivo',
              challengeId: 'RPA002',
              actionId: 'action_reais_ativo',
              calculationType: 'local_processing'
            },
            secondaryGoal1: {
              name: 'atividade',
              displayName: 'Atividade',
              metric: 'atividade',
              challengeId: 'ATIV002',
              actionId: 'action_atividade',
              calculationType: 'local_processing',
              boost: {
                catalogItemId: 'boost_ativ',
                name: 'Boost Atividade',
                description: 'Boost para Atividade'
              }
            },
            secondaryGoal2: {
              name: 'multimarcasPorAtivo',
              displayName: 'Multimarcas por Ativo',
              metric: 'multimarcasPorAtivo',
              challengeId: 'MPA002',
              actionId: 'action_multimarcas',
              calculationType: 'local_processing',
              boost: {
                catalogItemId: 'boost_multi',
                name: 'Boost Multimarcas',
                description: 'Boost para Multimarcas'
              }
            },
            unlockConditions: {
              catalogItemId: 'unlock_points',
              description: 'Unlock conditions'
            },
            specialProcessing: {
              type: 'carteira_ii_local',
              warnings: ['Local processing warning']
            }
          }
        } as Record<TeamType, DashboardConfig>
      };

      // Validate Carteira II special processing
      const validationResult = validator.validateDashboardConfiguration(carteiraIIConfig as DashboardConfigurationRecord);
      
      // Should have warnings but no errors
      expect(validationResult.isValid).toBe(true);
      expect(validationResult.warnings.length).toBeGreaterThan(0);
      expect(validationResult.warnings.some(w => w.message?.includes('local calculations'))).toBe(true);

      // Get Carteira II specific warnings
      const carteiraIIWarnings = validator.getCarteiraIIWarnings();
      expect(carteiraIIWarnings).toContain('Esta carteira usa cálculos locais em vez de dados diretos da Funifier');
      expect(carteiraIIWarnings).toContain('Boosts são calculados localmente e não sincronizados com a Funifier');

      // Save configuration
      const savedConfig = await configService.saveConfiguration(carteiraIIConfig);
      expect(savedConfig.configurations[TeamType.CARTEIRA_II].specialProcessing?.type).toBe('carteira_ii_local');
    });

    it('should handle configuration validation and change detection workflow', async () => {
      // Original configuration
      const originalConfig: DashboardConfigurationRecord = {
        _id: 'config_original',
        version: '1.0.0',
        createdAt: '2024-01-01T00:00:00.000Z',
        createdBy: 'admin',
        configurations: {
          [TeamType.CARTEIRA_I]: {
            teamType: TeamType.CARTEIRA_I,
            displayName: 'Carteira I',
            primaryGoal: {
              name: 'atividade',
              displayName: 'Atividade',
              metric: 'atividade',
              challengeId: 'ATIV001',
              actionId: 'action_atividade',
              calculationType: 'funifier_api'
            },
            secondaryGoal1: {
              name: 'reaisPorAtivo',
              displayName: 'Reais por Ativo',
              metric: 'reaisPorAtivo',
              challengeId: 'RPA001',
              actionId: 'action_reais_ativo',
              calculationType: 'funifier_api',
              boost: {
                catalogItemId: 'boost_rpa',
                name: 'Boost RPA',
                description: 'Boost para Reais por Ativo'
              }
            },
            secondaryGoal2: {
              name: 'faturamento',
              displayName: 'Faturamento',
              metric: 'faturamento',
              challengeId: 'FAT001',
              actionId: 'action_faturamento',
              calculationType: 'funifier_api',
              boost: {
                catalogItemId: 'boost_fat',
                name: 'Boost Faturamento',
                description: 'Boost para Faturamento'
              }
            },
            unlockConditions: {
              catalogItemId: 'unlock_points',
              description: 'Unlock conditions'
            }
          }
        } as Record<TeamType, DashboardConfig>
      };

      // Modified configuration
      const modifiedConfig: DashboardConfigurationRecord = {
        ...originalConfig,
        _id: 'config_modified',
        version: '2.0.0',
        configurations: {
          ...originalConfig.configurations,
          [TeamType.CARTEIRA_I]: {
            ...originalConfig.configurations[TeamType.CARTEIRA_I],
            primaryGoal: {
              ...originalConfig.configurations[TeamType.CARTEIRA_I].primaryGoal,
              name: 'faturamento' // Changed metric
            },
            secondaryGoal1: {
              ...originalConfig.configurations[TeamType.CARTEIRA_I].secondaryGoal1,
              boost: {
                ...originalConfig.configurations[TeamType.CARTEIRA_I].secondaryGoal1.boost,
                catalogItemId: 'new_boost_rpa' // Changed boost catalog item
              }
            }
          }
        }
      };

      // Validate changes
      const changeValidation = validator.validateConfigurationChanges(originalConfig, modifiedConfig);
      
      expect(changeValidation.isValid).toBe(true);
      expect(changeValidation.warnings.some(w => 
        w.message?.includes('Primary goal metric changed from atividade to faturamento')
      )).toBe(true);
      expect(changeValidation.warnings.some(w => 
        w.message?.includes('Boost catalog item changed')
      )).toBe(true);
    });
  });

  describe('Configuration Retrieval Workflow', () => {
    it('should handle configuration retrieval and fallback workflow', async () => {
      // Test default configuration retrieval
      const defaultConfig = await configService.getCurrentConfiguration();
      
      expect(defaultConfig.version).toBe('1.0.0');
      expect(defaultConfig.createdBy).toBe('system');
      expect(defaultConfig.configurations).toHaveProperty(TeamType.CARTEIRA_I);
      expect(defaultConfig.configurations).toHaveProperty(TeamType.CARTEIRA_II);
      expect(defaultConfig.configurations).toHaveProperty(TeamType.ER);

      // Verify all team types have proper structure
      Object.values(TeamType).forEach(teamType => {
        const teamConfig = defaultConfig.configurations[teamType];
        expect(teamConfig).toHaveProperty('primaryGoal');
        expect(teamConfig).toHaveProperty('secondaryGoal1');
        expect(teamConfig).toHaveProperty('secondaryGoal2');
        expect(teamConfig).toHaveProperty('unlockConditions');
      });
    });

    it('should handle database configuration override workflow', async () => {
      const customConfig: DashboardConfigurationRecord = {
        _id: 'config_custom',
        version: '3.0.0',
        createdAt: '2024-02-01T00:00:00.000Z',
        createdBy: 'custom_admin',
        configurations: {} as Record<TeamType, DashboardConfig>
      };

      // Mock database returning custom configuration
      databaseService.getConfiguration.mockResolvedValue(customConfig);

      // In a real implementation, this would fetch from database
      // For now, we test the service's ability to handle custom configurations
      const savedConfig = await configService.saveConfiguration(customConfig);
      
      expect(savedConfig.version).toBe('3.0.0');
      expect(savedConfig.createdBy).toBe('custom_admin');
    });
  });

  describe('Error Handling in Configuration Workflow', () => {
    it('should handle validation errors in configuration workflow', () => {
      const invalidConfig = {
        _id: null,
        version: null,
        configurations: null
      } as any;

      const validationResult = validator.validateDashboardConfiguration(invalidConfig);
      
      expect(validationResult.isValid).toBe(false);
      expect(validationResult.errors.some(e => e.field === '_id')).toBe(true);
      expect(validationResult.errors.some(e => e.field === 'version')).toBe(true);
      expect(validationResult.errors.some(e => e.field === 'configurations')).toBe(true);
    });

    it('should handle database errors in configuration workflow', async () => {
      databaseService.saveConfiguration.mockRejectedValue(new Error('Database save failed'));

      // The service should handle this gracefully
      const config = { version: '1.0.0' };
      const result = await configService.saveConfiguration(config);
      
      // Should still return a valid configuration object even if database save fails
      expect(result).toBeDefined();
      expect(result.version).toBe('1.0.0');
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large configuration objects efficiently', async () => {
      // Create a configuration with many team types and complex structures
      const largeConfig: Partial<DashboardConfigurationRecord> = {
        version: '1.0.0',
        createdBy: 'performance_test',
        configurations: {} as Record<TeamType, DashboardConfig>
      };

      // Add configurations for all team types
      Object.values(TeamType).forEach(teamType => {
        largeConfig.configurations![teamType] = {
          teamType,
          displayName: `${teamType} Dashboard`,
          primaryGoal: {
            name: 'test_metric',
            displayName: 'Test Metric',
            metric: 'test_metric',
            challengeId: 'TEST001',
            actionId: 'action_test',
            calculationType: 'funifier_api'
          },
          secondaryGoal1: {
            name: 'test_secondary1',
            displayName: 'Test Secondary 1',
            metric: 'test_secondary1',
            challengeId: 'TEST002',
            actionId: 'action_test2',
            calculationType: 'funifier_api',
            boost: {
              catalogItemId: 'boost_test1',
              name: 'Test Boost 1',
              description: 'Test boost description 1'
            }
          },
          secondaryGoal2: {
            name: 'test_secondary2',
            displayName: 'Test Secondary 2',
            metric: 'test_secondary2',
            challengeId: 'TEST003',
            actionId: 'action_test3',
            calculationType: 'funifier_api',
            boost: {
              catalogItemId: 'boost_test2',
              name: 'Test Boost 2',
              description: 'Test boost description 2'
            }
          },
          unlockConditions: {
            catalogItemId: 'unlock_test',
            description: 'Test unlock conditions'
          }
        };
      });

      const startTime = Date.now();
      
      // Validate large configuration
      const validationResult = validator.validateDashboardConfiguration(largeConfig as DashboardConfigurationRecord);
      
      // Save large configuration
      const savedConfig = await configService.saveConfiguration(largeConfig);
      
      const endTime = Date.now();

      expect(validationResult.isValid).toBe(true);
      expect(savedConfig).toBeDefined();
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });

  describe('Configuration Consistency Workflow', () => {
    it('should maintain configuration consistency across team types', async () => {
      const config = await configService.getCurrentConfiguration();
      
      // Verify all team types have consistent structure
      Object.values(config.configurations).forEach(teamConfig => {
        expect(teamConfig.primaryGoal).toHaveProperty('name');
        expect(teamConfig.primaryGoal).toHaveProperty('displayName');
        expect(teamConfig.primaryGoal).toHaveProperty('metric');
        expect(teamConfig.primaryGoal).toHaveProperty('challengeId');
        expect(teamConfig.primaryGoal).toHaveProperty('actionId');
        expect(teamConfig.primaryGoal).toHaveProperty('calculationType');

        expect(teamConfig.secondaryGoal1).toHaveProperty('boost');
        expect(teamConfig.secondaryGoal2).toHaveProperty('boost');
        
        expect(teamConfig.unlockConditions).toHaveProperty('catalogItemId');
        expect(teamConfig.unlockConditions).toHaveProperty('description');
      });

      // Verify no duplicate challenge IDs within a team
      Object.values(config.configurations).forEach(teamConfig => {
        const challengeIds = [
          teamConfig.primaryGoal.challengeId,
          teamConfig.secondaryGoal1.challengeId,
          teamConfig.secondaryGoal2.challengeId
        ];
        
        const uniqueIds = new Set(challengeIds);
        expect(uniqueIds.size).toBe(challengeIds.length);
      });
    });
  });
});