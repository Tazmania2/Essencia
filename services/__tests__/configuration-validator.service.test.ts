import { configurationValidator } from '../configuration-validator.service';
import {
  DashboardConfig,
  DashboardConfigurationRecord,
  TeamType,
  ValidationResult
} from '../../types';
import { getAllDefaultConfigurations } from '../../utils/dashboard-defaults';

describe('ConfigurationValidator', () => {
  let validConfiguration: DashboardConfigurationRecord;
  let validCarteiraIConfig: DashboardConfig;
  let validCarteiraIIConfig: DashboardConfig;

  beforeEach(() => {
    const defaultConfigs = getAllDefaultConfigurations();
    
    validConfiguration = {
      _id: 'test_config_123',
      version: 1,
      createdAt: '2024-01-01T00:00:00Z',
      createdBy: 'test_user',
      configurations: defaultConfigs,
      isActive: true
    };

    validCarteiraIConfig = { ...defaultConfigs[TeamType.CARTEIRA_I] };
    validCarteiraIIConfig = { ...defaultConfigs[TeamType.CARTEIRA_II] };
  });

  describe('validateDashboardConfiguration', () => {
    it('should validate a complete valid configuration', () => {
      const result = configurationValidator.validateDashboardConfiguration(validConfiguration);
      
      expect(result.isValid).toBe(true);
      expect(result.errors.filter(e => e.severity === 'error')).toHaveLength(0);
    });

    it('should detect missing basic structure fields', () => {
      const invalidConfig = { ...validConfiguration };
      delete (invalidConfig as any)._id;
      delete (invalidConfig as any).version;

      const result = configurationValidator.validateDashboardConfiguration(invalidConfig);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: '_id',
          message: 'Configuration ID is required',
          severity: 'error'
        })
      );
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'version',
          message: 'Valid version number is required',
          severity: 'error'
        })
      );
    });

    it('should detect missing team configurations', () => {
      const invalidConfig = { ...validConfiguration };
      delete invalidConfig.configurations[TeamType.CARTEIRA_I];

      const result = configurationValidator.validateDashboardConfiguration(invalidConfig);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: `configurations.${TeamType.CARTEIRA_I}`,
          message: `Missing configuration for team type ${TeamType.CARTEIRA_I}`,
          severity: 'error'
        })
      );
    });

    it('should validate all team types are present', () => {
      const result = configurationValidator.validateDashboardConfiguration(validConfiguration);
      
      // Should not have missing team configuration errors
      const missingTeamErrors = result.errors.filter(e => 
        e.field.startsWith('configurations.') && e.message.includes('Missing configuration')
      );
      expect(missingTeamErrors).toHaveLength(0);
    });
  });

  describe('validateTeamConfiguration', () => {
    it('should validate a valid team configuration', () => {
      const result = configurationValidator.validateTeamConfiguration(validCarteiraIConfig);
      
      expect(result.isValid).toBe(true);
      expect(result.errors.filter(e => e.severity === 'error')).toHaveLength(0);
    });

    it('should detect invalid team type', () => {
      const invalidConfig = { ...validCarteiraIConfig };
      (invalidConfig as any).teamType = 'INVALID_TEAM';

      const result = configurationValidator.validateTeamConfiguration(invalidConfig);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'teamType',
          message: 'Invalid team type: INVALID_TEAM',
          severity: 'error'
        })
      );
    });

    it('should detect empty display name', () => {
      const invalidConfig = { ...validCarteiraIConfig };
      invalidConfig.displayName = '';

      const result = configurationValidator.validateTeamConfiguration(invalidConfig);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'displayName',
          message: 'Display name is required and cannot be empty',
          severity: 'error'
        })
      );
    });

    it('should detect invalid challenge ID format', () => {
      const invalidConfig = { ...validCarteiraIConfig };
      invalidConfig.primaryGoal.challengeId = 'invalid-id-with-dashes';

      const result = configurationValidator.validateTeamConfiguration(invalidConfig);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'primaryGoal.challengeId',
          message: 'Challenge ID must be alphanumeric',
          severity: 'error'
        })
      );
    });

    it('should detect missing boost information', () => {
      const invalidConfig = { ...validCarteiraIConfig };
      delete (invalidConfig.secondaryGoal1 as any).boost;

      const result = configurationValidator.validateTeamConfiguration(invalidConfig);
      
      expect(result.isValid).toBe(false);
    });
  });

  describe('validateCarteiraIISpecialProcessing', () => {
    it('should validate Carteira II special processing correctly', () => {
      const errors: any[] = [];
      const warnings: any[] = [];

      configurationValidator.validateCarteiraIISpecialProcessing(validCarteiraIIConfig, errors, warnings);
      
      expect(errors.filter(e => e.severity === 'error')).toHaveLength(0);
      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings).toContainEqual(
        expect.objectContaining({
          field: 'specialProcessing',
          message: expect.stringContaining('local calculations'),
          type: 'business_rule'
        })
      );
    });

    it('should detect missing special processing for Carteira II', () => {
      const invalidConfig = { ...validCarteiraIIConfig };
      delete (invalidConfig as any).specialProcessing;

      const errors: any[] = [];
      const warnings: any[] = [];

      configurationValidator.validateCarteiraIISpecialProcessing(invalidConfig, errors, warnings);
      
      expect(errors).toContainEqual(
        expect.objectContaining({
          field: 'specialProcessing',
          message: 'Carteira II must have special processing configuration',
          severity: 'error'
        })
      );
    });

    it('should detect wrong calculation type for Carteira II primary goal', () => {
      const invalidConfig = { ...validCarteiraIIConfig };
      invalidConfig.primaryGoal.calculationType = 'funifier_direct';

      const errors: any[] = [];
      const warnings: any[] = [];

      configurationValidator.validateCarteiraIISpecialProcessing(invalidConfig, errors, warnings);
      
      expect(errors).toContainEqual(
        expect.objectContaining({
          field: 'primaryGoal.calculationType',
          message: 'Carteira II primary goal must use local_processing calculation type',
          severity: 'error'
        })
      );
    });

    it('should detect wrong calculation type for Carteira II secondary goals', () => {
      const invalidConfig = { ...validCarteiraIIConfig };
      invalidConfig.secondaryGoal1.calculationType = 'funifier_direct';
      invalidConfig.secondaryGoal2.calculationType = 'funifier_direct';

      const errors: any[] = [];
      const warnings: any[] = [];

      configurationValidator.validateCarteiraIISpecialProcessing(invalidConfig, errors, warnings);
      
      expect(errors).toContainEqual(
        expect.objectContaining({
          field: 'secondaryGoal1.calculationType',
          message: 'Carteira II secondary goal 1 must use local_processing calculation type',
          severity: 'error'
        })
      );
      expect(errors).toContainEqual(
        expect.objectContaining({
          field: 'secondaryGoal2.calculationType',
          message: 'Carteira II secondary goal 2 must use local_processing calculation type',
          severity: 'error'
        })
      );
    });

    it('should not validate special processing for non-Carteira II teams', () => {
      const errors: any[] = [];
      const warnings: any[] = [];

      configurationValidator.validateCarteiraIISpecialProcessing(validCarteiraIConfig, errors, warnings);
      
      expect(errors).toHaveLength(0);
      expect(warnings).toHaveLength(0);
    });

    it('should detect invalid special processing type', () => {
      const invalidConfig = { ...validCarteiraIIConfig };
      if (invalidConfig.specialProcessing) {
        (invalidConfig.specialProcessing as any).type = 'invalid_type';
      }

      const errors: any[] = [];
      const warnings: any[] = [];

      configurationValidator.validateCarteiraIISpecialProcessing(invalidConfig, errors, warnings);
      
      expect(errors).toContainEqual(
        expect.objectContaining({
          field: 'specialProcessing.type',
          message: 'Carteira II special processing type must be "carteira_ii_local"',
          severity: 'error'
        })
      );
    });
  });

  describe('validateConfigurationChanges', () => {
    it('should detect metric changes between configurations', () => {
      const oldConfig = { ...validConfiguration };
      const newConfig = { ...validConfiguration };
      
      // Change primary goal metric for Carteira I
      newConfig.configurations[TeamType.CARTEIRA_I].primaryGoal.name = 'faturamento';

      const result = configurationValidator.validateConfigurationChanges(oldConfig, newConfig);
      
      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          field: `${TeamType.CARTEIRA_I}.primaryGoal.name`,
          message: expect.stringContaining('Primary goal metric changed from atividade to faturamento'),
          type: 'business_rule'
        })
      );
    });

    it('should detect calculation type changes', () => {
      const oldConfig = { ...validConfiguration };
      const newConfig = { ...validConfiguration };
      
      // Change calculation type (this would be invalid for Carteira II, but let's test the detection)
      newConfig.configurations[TeamType.CARTEIRA_I].primaryGoal.calculationType = 'local_processing';

      const result = configurationValidator.validateConfigurationChanges(oldConfig, newConfig);
      
      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          field: `${TeamType.CARTEIRA_I}.primaryGoal.calculationType`,
          message: expect.stringContaining('calculation type changed'),
          type: 'compatibility'
        })
      );
    });

    it('should detect boost catalog item changes', () => {
      const oldConfig = { ...validConfiguration };
      const newConfig = { ...validConfiguration };
      
      // Change boost catalog item
      newConfig.configurations[TeamType.CARTEIRA_I].secondaryGoal1.boost.catalogItemId = 'NEW_BOOST_ID';

      const result = configurationValidator.validateConfigurationChanges(oldConfig, newConfig);
      
      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          field: `${TeamType.CARTEIRA_I}.secondaryGoal1.boost.catalogItemId`,
          message: expect.stringContaining('Boost catalog item changed'),
          type: 'business_rule'
        })
      );
    });
  });

  describe('getCarteiraIIWarnings', () => {
    it('should return appropriate warnings for Carteira II', () => {
      const warnings = configurationValidator.getCarteiraIIWarnings();
      
      expect(warnings).toHaveLength(5);
      expect(warnings).toContain('Esta carteira usa cálculos locais em vez de dados diretos da Funifier');
      expect(warnings).toContain('Mudanças nas métricas podem afetar a lógica de processamento local');
      expect(warnings).toContain('Boosts são calculados localmente e não sincronizados com a Funifier');
      expect(warnings).toContain('Alterações podem quebrar a funcionalidade existente de boost/unlock');
      expect(warnings).toContain('Teste cuidadosamente após fazer alterações na configuração');
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle configuration with missing boost names', () => {
      const invalidConfig = { ...validCarteiraIConfig };
      invalidConfig.secondaryGoal1.boost.name = '';
      invalidConfig.secondaryGoal2.boost.description = '';

      const result = configurationValidator.validateTeamConfiguration(invalidConfig);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'secondaryGoal1.boost.name',
          message: 'Boost name is required',
          severity: 'error'
        })
      );
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'secondaryGoal2.boost.description',
          message: 'Boost description is required',
          severity: 'error'
        })
      );
    });

    it('should handle configuration with invalid unlock conditions', () => {
      const invalidConfig = { ...validCarteiraIConfig };
      invalidConfig.unlockConditions.catalogItemId = 'invalid-id-with-special-chars!';
      invalidConfig.unlockConditions.description = '';

      const result = configurationValidator.validateTeamConfiguration(invalidConfig);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'unlockConditions.catalogItemId',
          message: 'Unlock conditions catalog item ID must be alphanumeric',
          severity: 'error'
        })
      );
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'unlockConditions.description',
          message: 'Unlock conditions description is required',
          severity: 'error'
        })
      );
    });

    it('should warn about duplicate boost catalog items within a team', () => {
      const configWithDuplicates = { ...validCarteiraIConfig };
      configWithDuplicates.secondaryGoal2.boost.catalogItemId = configWithDuplicates.secondaryGoal1.boost.catalogItemId;

      const result = configurationValidator.validateTeamConfiguration(configWithDuplicates);
      
      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          field: 'boost.catalogItemId',
          message: 'Secondary goals use the same boost catalog item ID',
          type: 'business_rule'
        })
      );
    });

    it('should handle malformed configuration gracefully', () => {
      const malformedConfig = {
        _id: 'test',
        version: 1,
        createdAt: '2024-01-01T00:00:00Z',
        createdBy: 'test',
        configurations: null,
        isActive: true
      } as any;

      const result = configurationValidator.validateDashboardConfiguration(malformedConfig);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'configurations',
          message: 'Configurations object is required',
          severity: 'error'
        })
      );
    });
  });
});