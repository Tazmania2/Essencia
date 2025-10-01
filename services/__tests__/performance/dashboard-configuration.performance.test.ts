/**
 * Performance tests for DashboardConfigurationService
 * Tests configuration caching, validation performance, and large configuration handling
 */

import { DashboardConfigurationService } from '../../dashboard-configuration.service';
import { ConfigurationValidator } from '../../configuration-validator.service';
import { DashboardConfigurationRecord, TeamType, DashboardConfig } from '../../../types';

// Mock dependencies
jest.mock('../../../utils/logger');
jest.mock('../../error-handler.service');

describe('DashboardConfigurationService Performance Tests', () => {
  let service: DashboardConfigurationService;
  let validator: ConfigurationValidator;

  beforeEach(() => {
    service = DashboardConfigurationService.getInstance();
    validator = ConfigurationValidator.getInstance();
    jest.clearAllMocks();
  });

  describe('Configuration Retrieval Performance', () => {
    it('should retrieve default configuration quickly', async () => {
      const startTime = performance.now();
      const config = await service.getCurrentConfiguration();
      const endTime = performance.now();

      const executionTime = endTime - startTime;

      expect(config).toBeDefined();
      expect(config.configurations).toBeDefined();
      expect(Object.keys(config.configurations)).toHaveLength(6); // All team types
      expect(executionTime).toBeLessThan(10); // Should be very fast for default config
    });

    it('should handle repeated configuration retrievals efficiently', async () => {
      const iterations = 100;
      const startTime = performance.now();

      const promises = Array.from({ length: iterations }, () => 
        service.getCurrentConfiguration()
      );

      const results = await Promise.all(promises);
      const endTime = performance.now();

      const executionTime = endTime - startTime;
      const averageTime = executionTime / iterations;

      expect(results).toHaveLength(iterations);
      results.forEach(config => {
        expect(config).toBeDefined();
        expect(config.configurations).toBeDefined();
      });

      expect(averageTime).toBeLessThan(1); // Each call should average less than 1ms
      expect(executionTime).toBeLessThan(100); // Total should be under 100ms
    });
  });

  describe('Configuration Validation Performance', () => {
    it('should validate large configurations efficiently', async () => {
      // Create a large configuration with all team types and complex structures
      const largeConfig: DashboardConfigurationRecord = {
        _id: 'large_config_test',
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        createdBy: 'performance_test',
        configurations: {} as Record<TeamType, DashboardConfig>
      };

      // Add configurations for all team types with detailed structures
      Object.values(TeamType).forEach(teamType => {
        largeConfig.configurations[teamType] = {
          teamType,
          displayName: `${teamType} Dashboard - Performance Test`,
          primaryGoal: {
            name: 'performance_primary',
            displayName: 'Performance Primary Goal',
            metric: 'performance_primary_metric',
            challengeId: 'PERF001',
            actionId: 'action_performance_primary',
            calculationType: 'funifier_api'
          },
          secondaryGoal1: {
            name: 'performance_secondary1',
            displayName: 'Performance Secondary Goal 1',
            metric: 'performance_secondary1_metric',
            challengeId: 'PERF002',
            actionId: 'action_performance_secondary1',
            calculationType: 'funifier_api',
            boost: {
              catalogItemId: 'boost_perf1',
              name: 'Performance Boost 1',
              description: 'Performance boost description 1 with detailed explanation of boost mechanics and effects'
            }
          },
          secondaryGoal2: {
            name: 'performance_secondary2',
            displayName: 'Performance Secondary Goal 2',
            metric: 'performance_secondary2_metric',
            challengeId: 'PERF003',
            actionId: 'action_performance_secondary2',
            calculationType: 'funifier_api',
            boost: {
              catalogItemId: 'boost_perf2',
              name: 'Performance Boost 2',
              description: 'Performance boost description 2 with detailed explanation of boost mechanics and effects'
            }
          },
          unlockConditions: {
            catalogItemId: 'unlock_performance',
            description: 'Performance unlock conditions with detailed requirements and criteria'
          }
        };
      });

      const startTime = performance.now();
      const validationResult = validator.validateDashboardConfiguration(largeConfig);
      const endTime = performance.now();

      const executionTime = endTime - startTime;

      expect(validationResult).toBeDefined();
      expect(validationResult.isValid).toBe(true);
      expect(executionTime).toBeLessThan(50); // Should validate within 50ms
    });

    it('should handle validation of multiple configurations concurrently', async () => {
      // Create multiple different configurations
      const configurations = Array.from({ length: 20 }, (_, i) => ({
        _id: `config_${i}`,
        version: `1.${i}.0`,
        createdAt: new Date().toISOString(),
        createdBy: `user_${i}`,
        configurations: {
          [TeamType.CARTEIRA_I]: {
            teamType: TeamType.CARTEIRA_I,
            displayName: `Carteira I Config ${i}`,
            primaryGoal: {
              name: `primary_${i}`,
              displayName: `Primary Goal ${i}`,
              metric: `primary_metric_${i}`,
              challengeId: `PRIM${String(i).padStart(3, '0')}`,
              actionId: `action_primary_${i}`,
              calculationType: 'funifier_api'
            },
            secondaryGoal1: {
              name: `secondary1_${i}`,
              displayName: `Secondary Goal 1 ${i}`,
              metric: `secondary1_metric_${i}`,
              challengeId: `SEC1${String(i).padStart(3, '0')}`,
              actionId: `action_secondary1_${i}`,
              calculationType: 'funifier_api',
              boost: {
                catalogItemId: `boost1_${i}`,
                name: `Boost 1 ${i}`,
                description: `Boost description 1 ${i}`
              }
            },
            secondaryGoal2: {
              name: `secondary2_${i}`,
              displayName: `Secondary Goal 2 ${i}`,
              metric: `secondary2_metric_${i}`,
              challengeId: `SEC2${String(i).padStart(3, '0')}`,
              actionId: `action_secondary2_${i}`,
              calculationType: 'funifier_api',
              boost: {
                catalogItemId: `boost2_${i}`,
                name: `Boost 2 ${i}`,
                description: `Boost description 2 ${i}`
              }
            },
            unlockConditions: {
              catalogItemId: `unlock_${i}`,
              description: `Unlock conditions ${i}`
            }
          }
        } as Record<TeamType, DashboardConfig>
      })) as DashboardConfigurationRecord[];

      const startTime = performance.now();
      
      const validationPromises = configurations.map(config => 
        validator.validateDashboardConfiguration(config)
      );
      
      const results = await Promise.all(validationPromises);
      const endTime = performance.now();

      const executionTime = endTime - startTime;
      const averageTime = executionTime / configurations.length;

      expect(results).toHaveLength(20);
      results.forEach(result => {
        expect(result.isValid).toBe(true);
      });

      expect(averageTime).toBeLessThan(5); // Each validation should average less than 5ms
      expect(executionTime).toBeLessThan(100); // Total should be under 100ms
    });

    it('should handle Carteira II special validation efficiently', async () => {
      const carteiraIIConfig: DashboardConfigurationRecord = {
        _id: 'carteira_ii_perf_test',
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        createdBy: 'performance_test',
        configurations: {
          [TeamType.CARTEIRA_II]: {
            teamType: TeamType.CARTEIRA_II,
            displayName: 'Carteira II Performance Test',
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

      const iterations = 50;
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        const validationResult = validator.validateDashboardConfiguration(carteiraIIConfig);
        expect(validationResult.isValid).toBe(true);
        expect(validationResult.warnings.length).toBeGreaterThan(0);
      }

      const endTime = performance.now();
      const executionTime = endTime - startTime;
      const averageTime = executionTime / iterations;

      expect(averageTime).toBeLessThan(2); // Each Carteira II validation should be under 2ms
    });
  });

  describe('Configuration Save Performance', () => {
    it('should save configurations quickly', async () => {
      const configToSave = {
        version: '2.0.0',
        createdBy: 'performance_test',
        configurations: {
          [TeamType.CARTEIRA_I]: {
            teamType: TeamType.CARTEIRA_I,
            displayName: 'Performance Test Config',
            primaryGoal: {
              name: 'test_primary',
              displayName: 'Test Primary',
              metric: 'test_primary',
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
                description: 'Test boost description'
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
                description: 'Test boost description'
              }
            },
            unlockConditions: {
              catalogItemId: 'unlock_test',
              description: 'Test unlock conditions'
            }
          }
        } as Record<TeamType, DashboardConfig>
      };

      const startTime = performance.now();
      const savedConfig = await service.saveConfiguration(configToSave);
      const endTime = performance.now();

      const executionTime = endTime - startTime;

      expect(savedConfig).toBeDefined();
      expect(savedConfig._id).toBeDefined();
      expect(savedConfig.version).toBe('2.0.0');
      expect(executionTime).toBeLessThan(20); // Should save within 20ms
    });

    it('should handle batch configuration saves efficiently', async () => {
      const batchSize = 10;
      const configurations = Array.from({ length: batchSize }, (_, i) => ({
        version: `batch_${i}.0.0`,
        createdBy: `batch_user_${i}`,
        configurations: {} as Record<TeamType, DashboardConfig>
      }));

      const startTime = performance.now();
      
      const savePromises = configurations.map(config => 
        service.saveConfiguration(config)
      );
      
      const results = await Promise.all(savePromises);
      const endTime = performance.now();

      const executionTime = endTime - startTime;
      const averageTime = executionTime / batchSize;

      expect(results).toHaveLength(batchSize);
      results.forEach((result, i) => {
        expect(result._id).toBeDefined();
        expect(result.version).toBe(`batch_${i}.0.0`);
      });

      expect(averageTime).toBeLessThan(10); // Each save should average less than 10ms
      expect(executionTime).toBeLessThan(100); // Total should be under 100ms
    });
  });

  describe('Configuration Change Detection Performance', () => {
    it('should detect configuration changes efficiently', async () => {
      const baseConfig: DashboardConfigurationRecord = {
        _id: 'base_config',
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        createdBy: 'test_user',
        configurations: {
          [TeamType.CARTEIRA_I]: {
            teamType: TeamType.CARTEIRA_I,
            displayName: 'Base Config',
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

      // Create multiple variations of the config
      const variations = Array.from({ length: 20 }, (_, i) => ({
        ...baseConfig,
        _id: `variation_${i}`,
        version: `1.${i}.0`,
        configurations: {
          ...baseConfig.configurations,
          [TeamType.CARTEIRA_I]: {
            ...baseConfig.configurations[TeamType.CARTEIRA_I],
            primaryGoal: {
              ...baseConfig.configurations[TeamType.CARTEIRA_I].primaryGoal,
              name: i % 2 === 0 ? 'atividade' : 'faturamento' // Alternate changes
            }
          }
        }
      }));

      const startTime = performance.now();
      
      const changeDetectionPromises = variations.map(variation => 
        validator.validateConfigurationChanges(baseConfig, variation)
      );
      
      const results = await Promise.all(changeDetectionPromises);
      const endTime = performance.now();

      const executionTime = endTime - startTime;
      const averageTime = executionTime / variations.length;

      expect(results).toHaveLength(20);
      results.forEach((result, i) => {
        expect(result.isValid).toBe(true);
        if (i % 2 === 1) {
          // Should detect the metric change
          expect(result.warnings.some(w => w.message?.includes('changed from'))).toBe(true);
        }
      });

      expect(averageTime).toBeLessThan(3); // Each change detection should be under 3ms
      expect(executionTime).toBeLessThan(60); // Total should be under 60ms
    });
  });

  describe('Memory Usage Performance', () => {
    it('should handle large configurations without excessive memory usage', async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Create and process many large configurations
      const largeConfigs = Array.from({ length: 100 }, (_, i) => ({
        _id: `large_config_${i}`,
        version: `1.${i}.0`,
        createdAt: new Date().toISOString(),
        createdBy: `user_${i}`,
        configurations: Object.fromEntries(
          Object.values(TeamType).map(teamType => [
            teamType,
            {
              teamType,
              displayName: `${teamType} Large Config ${i}`,
              primaryGoal: {
                name: `primary_${teamType}_${i}`,
                displayName: `Primary Goal ${teamType} ${i}`,
                metric: `primary_metric_${teamType}_${i}`,
                challengeId: `PRIM${teamType}${String(i).padStart(3, '0')}`,
                actionId: `action_primary_${teamType}_${i}`,
                calculationType: 'funifier_api'
              },
              secondaryGoal1: {
                name: `secondary1_${teamType}_${i}`,
                displayName: `Secondary Goal 1 ${teamType} ${i}`,
                metric: `secondary1_metric_${teamType}_${i}`,
                challengeId: `SEC1${teamType}${String(i).padStart(3, '0')}`,
                actionId: `action_secondary1_${teamType}_${i}`,
                calculationType: 'funifier_api',
                boost: {
                  catalogItemId: `boost1_${teamType}_${i}`,
                  name: `Boost 1 ${teamType} ${i}`,
                  description: `Detailed boost description for ${teamType} configuration ${i} with extensive explanation`
                }
              },
              secondaryGoal2: {
                name: `secondary2_${teamType}_${i}`,
                displayName: `Secondary Goal 2 ${teamType} ${i}`,
                metric: `secondary2_metric_${teamType}_${i}`,
                challengeId: `SEC2${teamType}${String(i).padStart(3, '0')}`,
                actionId: `action_secondary2_${teamType}_${i}`,
                calculationType: 'funifier_api',
                boost: {
                  catalogItemId: `boost2_${teamType}_${i}`,
                  name: `Boost 2 ${teamType} ${i}`,
                  description: `Detailed boost description for ${teamType} configuration ${i} with extensive explanation`
                }
              },
              unlockConditions: {
                catalogItemId: `unlock_${teamType}_${i}`,
                description: `Detailed unlock conditions for ${teamType} configuration ${i}`
              }
            }
          ])
        ) as Record<TeamType, DashboardConfig>
      })) as DashboardConfigurationRecord[];

      // Process all configurations
      const results = await Promise.all(
        largeConfigs.map(config => service.saveConfiguration(config))
      );

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      expect(results).toHaveLength(100);
      results.forEach(result => {
        expect(result._id).toBeDefined();
      });

      // Memory increase should be reasonable (less than 100MB for this dataset)
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
    });
  });

  describe('Caching Performance', () => {
    it('should benefit from configuration caching', async () => {
      // First retrieval (potential cache miss)
      const startTime1 = performance.now();
      const config1 = await service.getCurrentConfiguration();
      const endTime1 = performance.now();
      const firstRetrievalTime = endTime1 - startTime1;

      // Subsequent retrievals (should benefit from caching)
      const subsequentTimes: number[] = [];
      
      for (let i = 0; i < 10; i++) {
        const startTime = performance.now();
        const config = await service.getCurrentConfiguration();
        const endTime = performance.now();
        
        subsequentTimes.push(endTime - startTime);
        expect(config).toEqual(config1);
      }

      const averageSubsequentTime = subsequentTimes.reduce((a, b) => a + b, 0) / subsequentTimes.length;

      // All retrievals should be fast
      expect(firstRetrievalTime).toBeLessThan(20);
      expect(averageSubsequentTime).toBeLessThan(10);
      
      // In a real implementation with caching, subsequent calls should be faster
      // For now, we just verify they're all reasonably fast
      subsequentTimes.forEach(time => {
        expect(time).toBeLessThan(15);
      });
    });
  });
});