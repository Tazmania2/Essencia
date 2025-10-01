import { ConfigurationValidator, configurationValidator } from '../configuration-validator.service';
import { 
  DashboardConfig, 
  DashboardConfigurationRecord, 
  TeamType,
  ValidationResult,
  ValidationError,
  ValidationWarning
} from '../../types';

// Mock dependencies
jest.mock('../../utils/dashboard-defaults');
jest.mock('../../utils/logger');
jest.mock('../error-handler.service');

describe('ConfigurationValidator', () => {
  let service: ConfigurationValidator;

  beforeEach(() => {
    service = ConfigurationValidator.getInstance();
    jest.clearAllMocks();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = ConfigurationValidator.getInstance();
      const instance2 = ConfigurationValidator.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should return the same instance as the exported singleton', () => {
      expect(ConfigurationValidator.getInstance()).toBe(configurationValidator);
    });
  });

  describe('validateDashboardConfiguration', () => {
    const mockValidConfig: DashboardConfigurationRecord = {
      _id: 'config_123',
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
            challengeId: 'ATIV001',
            actionId: 'action_atividade',
            calculationType: 'api_data'
          },
          secondaryGoal1: {
            name: 'reaisPorAtivo',
            displayName: 'Reais por Ativo',
            challengeId: 'RPA001',
            actionId: 'action_reais_ativo',
            calculationType: 'api_data',
            boost: {
              catalogItemId: 'boost_rpa',
              name: 'Boost RPA',
              description: 'Boost para Reais por Ativo'
            }
          },
          secondaryGoal2: {
            name: 'faturamento',
            displayName: 'Faturamento',
            challengeId: 'FAT001',
            actionId: 'action_faturamento',
            calculationType: 'api_data',
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
        } as DashboardConfig
      }
    };

    it('should validate a correct configuration', () => {
      const result = service.validateDashboardConfiguration(mockValidConfig);
      
      expect(result.isValid).toBe(true);
      expect(result.errors.filter(e => e.severity === 'error')).toHaveLength(0);
    });

    it('should return errors for missing required fields', () => {
      const invalidConfig = {
        ...mockValidConfig,
        _id: undefined,
        version: undefined
      } as any;

      const result = service.validateDashboardConfiguration(invalidConfig);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === '_id')).toBe(true);
      expect(result.errors.some(e => e.field === 'version')).toBe(true);
    });

    it('should return error for null configuration', () => {
      const result = service.validateDashboardConfiguration(null as any);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'config')).toBe(true);
    });

    it('should validate all team types are present', () => {
      const incompleteConfig = {
        ...mockValidConfig,
        configurations: {
          [TeamType.CARTEIRA_I]: mockValidConfig.configurations[TeamType.CARTEIRA_I]
        }
      };

      const result = service.validateDashboardConfiguration(incompleteConfig);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field?.includes(TeamType.CARTEIRA_II))).toBe(true);
    });
  });

  describe('validateTeamConfiguration', () => {
    const mockTeamConfig: DashboardConfig = {
      teamType: TeamType.CARTEIRA_I,
      displayName: 'Carteira I',
      primaryGoal: {
        name: 'atividade',
        displayName: 'Atividade',
        challengeId: 'ATIV001',
        actionId: 'action_atividade',
        calculationType: 'api_data'
      },
      secondaryGoal1: {
        name: 'reaisPorAtivo',
        displayName: 'Reais por Ativo',
        challengeId: 'RPA001',
        actionId: 'action_reais_ativo',
        calculationType: 'api_data',
        boost: {
          catalogItemId: 'boost_rpa',
          name: 'Boost RPA',
          description: 'Boost para Reais por Ativo'
        }
      },
      secondaryGoal2: {
        name: 'faturamento',
        displayName: 'Faturamento',
        challengeId: 'FAT001',
        actionId: 'action_faturamento',
        calculationType: 'api_data',
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
    };

    it('should validate a correct team configuration', () => {
      const result = service.validateTeamConfiguration(mockTeamConfig);
      
      expect(result.isValid).toBe(true);
      expect(result.errors.filter(e => e.severity === 'error')).toHaveLength(0);
    });

    it('should return error for null team configuration', () => {
      const result = service.validateTeamConfiguration(null as any);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'config')).toBe(true);
    });

    it('should validate challenge ID format', () => {
      const invalidConfig = {
        ...mockTeamConfig,
        primaryGoal: {
          ...mockTeamConfig.primaryGoal,
          challengeId: 'invalid-id!'
        }
      };

      const result = service.validateTeamConfiguration(invalidConfig);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'primaryGoal.challengeId')).toBe(true);
    });

    it('should validate boost catalog item format', () => {
      const invalidConfig = {
        ...mockTeamConfig,
        secondaryGoal1: {
          ...mockTeamConfig.secondaryGoal1,
          boost: {
            ...mockTeamConfig.secondaryGoal1.boost,
            catalogItemId: 'invalid-id!'
          }
        }
      };

      const result = service.validateTeamConfiguration(invalidConfig);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'secondaryGoal1.boost.catalogItemId')).toBe(true);
    });

    it('should validate required boost fields', () => {
      const invalidConfig = {
        ...mockTeamConfig,
        secondaryGoal1: {
          ...mockTeamConfig.secondaryGoal1,
          boost: {
            ...mockTeamConfig.secondaryGoal1.boost,
            name: '',
            description: ''
          }
        }
      };

      const result = service.validateTeamConfiguration(invalidConfig);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'secondaryGoal1.boost.name')).toBe(true);
      expect(result.errors.some(e => e.field === 'secondaryGoal1.boost.description')).toBe(true);
    });
  });

  describe('validateCarteiraIISpecialProcessing', () => {
    const mockCarteiraIIConfig: DashboardConfig = {
      teamType: TeamType.CARTEIRA_II,
      displayName: 'Carteira II',
      primaryGoal: {
        name: 'reaisPorAtivo',
        displayName: 'Reais por Ativo',
        challengeId: 'RPA002',
        actionId: 'action_reais_ativo',
        calculationType: 'local_processing'
      },
      secondaryGoal1: {
        name: 'atividade',
        displayName: 'Atividade',
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
    };

    it('should validate correct Carteira II configuration', () => {
      const errors: ValidationError[] = [];
      const warnings: ValidationWarning[] = [];
      
      service.validateCarteiraIISpecialProcessing(mockCarteiraIIConfig, errors, warnings);
      
      expect(errors.filter(e => e.severity === 'error')).toHaveLength(0);
      expect(warnings.length).toBeGreaterThan(0);
    });

    it('should skip validation for non-Carteira II teams', () => {
      const nonCarteiraIIConfig = { ...mockCarteiraIIConfig, teamType: TeamType.CARTEIRA_I };
      const errors: ValidationError[] = [];
      const warnings: ValidationWarning[] = [];
      
      service.validateCarteiraIISpecialProcessing(nonCarteiraIIConfig, errors, warnings);
      
      expect(errors).toHaveLength(0);
      expect(warnings).toHaveLength(0);
    });

    it('should require special processing configuration', () => {
      const configWithoutSpecialProcessing = {
        ...mockCarteiraIIConfig,
        specialProcessing: undefined
      };
      const errors: ValidationError[] = [];
      const warnings: ValidationWarning[] = [];
      
      service.validateCarteiraIISpecialProcessing(configWithoutSpecialProcessing, errors, warnings);
      
      expect(errors.some(e => e.field === 'specialProcessing')).toBe(true);
    });

    it('should validate special processing type', () => {
      const configWithWrongType = {
        ...mockCarteiraIIConfig,
        specialProcessing: {
          type: 'wrong_type',
          warnings: []
        }
      };
      const errors: ValidationError[] = [];
      const warnings: ValidationWarning[] = [];
      
      service.validateCarteiraIISpecialProcessing(configWithWrongType, errors, warnings);
      
      expect(errors.some(e => e.field === 'specialProcessing.type')).toBe(true);
    });

    it('should validate local processing calculation types', () => {
      const configWithWrongCalculationType = {
        ...mockCarteiraIIConfig,
        primaryGoal: {
          ...mockCarteiraIIConfig.primaryGoal,
          calculationType: 'api_data'
        }
      };
      const errors: ValidationError[] = [];
      const warnings: ValidationWarning[] = [];
      
      service.validateCarteiraIISpecialProcessing(configWithWrongCalculationType, errors, warnings);
      
      expect(errors.some(e => e.field === 'primaryGoal.calculationType')).toBe(true);
    });
  });

  describe('getCarteiraIIWarnings', () => {
    it('should return array of warning messages', () => {
      const warnings = service.getCarteiraIIWarnings();
      
      expect(Array.isArray(warnings)).toBe(true);
      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings.every(w => typeof w === 'string')).toBe(true);
    });

    it('should include key warning messages', () => {
      const warnings = service.getCarteiraIIWarnings();
      
      expect(warnings.some(w => w.includes('cálculos locais'))).toBe(true);
      expect(warnings.some(w => w.includes('Boosts'))).toBe(true);
      expect(warnings.some(w => w.includes('Teste cuidadosamente'))).toBe(true);
    });
  });

  describe('validateConfigurationChanges', () => {
    const oldConfig: DashboardConfigurationRecord = {
      _id: 'config_old',
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
            challengeId: 'ATIV001',
            actionId: 'action_atividade',
            calculationType: 'api_data'
          },
          secondaryGoal1: {
            name: 'reaisPorAtivo',
            displayName: 'Reais por Ativo',
            challengeId: 'RPA001',
            actionId: 'action_reais_ativo',
            calculationType: 'api_data',
            boost: {
              catalogItemId: 'boost_rpa',
              name: 'Boost RPA',
              description: 'Boost para Reais por Ativo'
            }
          },
          secondaryGoal2: {
            name: 'faturamento',
            displayName: 'Faturamento',
            challengeId: 'FAT001',
            actionId: 'action_faturamento',
            calculationType: 'api_data',
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
        } as DashboardConfig
      }
    };

    it('should detect metric changes', () => {
      const newConfig = {
        ...oldConfig,
        _id: 'config_new',
        configurations: {
          ...oldConfig.configurations,
          [TeamType.CARTEIRA_I]: {
            ...oldConfig.configurations[TeamType.CARTEIRA_I],
            primaryGoal: {
              ...oldConfig.configurations[TeamType.CARTEIRA_I].primaryGoal,
              name: 'faturamento'
            }
          }
        }
      };

      const result = service.validateConfigurationChanges(oldConfig, newConfig);
      
      expect(result.warnings.some(w => 
        w.field?.includes('primaryGoal.name') && w.message?.includes('changed from')
      )).toBe(true);
    });

    it('should detect boost catalog item changes', () => {
      const newConfig = {
        ...oldConfig,
        _id: 'config_new',
        configurations: {
          ...oldConfig.configurations,
          [TeamType.CARTEIRA_I]: {
            ...oldConfig.configurations[TeamType.CARTEIRA_I],
            secondaryGoal1: {
              ...oldConfig.configurations[TeamType.CARTEIRA_I].secondaryGoal1,
              boost: {
                ...oldConfig.configurations[TeamType.CARTEIRA_I].secondaryGoal1.boost,
                catalogItemId: 'new_boost_id'
              }
            }
          }
        }
      };

      const result = service.validateConfigurationChanges(oldConfig, newConfig);
      
      expect(result.warnings.some(w => 
        w.message?.includes('Boost catalog item changed')
      )).toBe(true);
    });

    it('should detect calculation type changes', () => {
      const newConfig = {
        ...oldConfig,
        _id: 'config_new',
        configurations: {
          ...oldConfig.configurations,
          [TeamType.CARTEIRA_I]: {
            ...oldConfig.configurations[TeamType.CARTEIRA_I],
            primaryGoal: {
              ...oldConfig.configurations[TeamType.CARTEIRA_I].primaryGoal,
              calculationType: 'local_processing'
            }
          }
        }
      };

      const result = service.validateConfigurationChanges(oldConfig, newConfig);
      
      expect(result.warnings.some(w => 
        w.message?.includes('calculation type changed')
      )).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle validation errors gracefully', () => {
      // Test with malformed configuration that might cause errors
      const malformedConfig = {
        _id: 'test',
        configurations: null
      } as any;

      const result = service.validateDashboardConfiguration(malformedConfig);
      
      expect(result).toBeDefined();
      expect(result.isValid).toBe(false);
      expect(Array.isArray(result.errors)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
    });

    it('should handle team configuration validation errors', () => {
      const malformedTeamConfig = {
        teamType: 'invalid_type',
        primaryGoal: null
      } as any;

      const result = service.validateTeamConfiguration(malformedTeamConfig);
      
      expect(result).toBeDefined();
      expect(result.isValid).toBe(false);
      expect(Array.isArray(result.errors)).toBe(true);
    });
  });
}); 