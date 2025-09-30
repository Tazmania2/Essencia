import {
  DashboardConfig,
  DashboardConfigurationRecord,
  TeamType,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  FUNIFIER_CONFIG
} from '../types';
import { validateConfigurationStructure } from '../utils/dashboard-defaults';
import { secureLogger } from '../utils/logger';
import { errorHandlerService } from './error-handler.service';

export class ConfigurationValidator {
  private static instance: ConfigurationValidator;

  private constructor() {}

  public static getInstance(): ConfigurationValidator {
    if (!ConfigurationValidator.instance) {
      ConfigurationValidator.instance = new ConfigurationValidator();
    }
    return ConfigurationValidator.instance;
  }

  /**
   * Validate a complete dashboard configuration record
   */
  public validateDashboardConfiguration(config: DashboardConfigurationRecord): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    try {
      // Input validation
      if (!config) {
        errors.push({
          field: 'config',
          message: 'Configuration object is required',
          severity: 'error'
        });
        return { isValid: false, errors, warnings };
      }

      secureLogger.info('Validating dashboard configuration', { 
        configId: config._id,
        version: config.version,
        hasConfigurations: !!config.configurations 
      });

      // Validate basic structure
      try {
        this.validateBasicStructure(config, errors);
      } catch (structureError) {
        secureLogger.error('Error validating basic structure', { 
          configId: config._id,
          error: structureError 
        });
        errors.push({
          field: 'structure',
          message: 'Failed to validate basic configuration structure',
          severity: 'error'
        });
      }

      // Validate each team configuration with error handling
      Object.values(TeamType).forEach(teamType => {
        try {
          const teamConfig = config.configurations?.[teamType];
          if (teamConfig) {
            const teamValidation = this.validateTeamConfiguration(teamConfig, [], []);
            errors.push(...teamValidation.errors);
            warnings.push(...teamValidation.warnings);
          } else {
            errors.push({
              field: `configurations.${teamType}`,
              message: `Missing configuration for team type ${teamType}`,
              severity: 'error'
            });
          }
        } catch (teamError) {
          secureLogger.error('Error validating team configuration', { 
            teamType,
            configId: config._id,
            error: teamError 
          });
          errors.push({
            field: `configurations.${teamType}`,
            message: `Failed to validate ${teamType} configuration`,
            severity: 'error'
          });
        }
      });

      // Validate configuration consistency with error handling
      try {
        this.validateConfigurationConsistency(config, errors, warnings);
      } catch (consistencyError) {
        secureLogger.error('Error validating configuration consistency', { 
          configId: config._id,
          error: consistencyError 
        });
        warnings.push({
          field: 'consistency',
          message: 'Could not fully validate configuration consistency',
          type: 'validation_error'
        });
      }

      const isValid = errors.filter(e => e.severity === 'error').length === 0;
      
      secureLogger.info('Configuration validation completed', { 
        configId: config._id,
        isValid,
        errorCount: errors.filter(e => e.severity === 'error').length,
        warningCount: warnings.length 
      });

    } catch (error) {
      const handledError = errorHandlerService.handleValidationError(error, 'validateDashboardConfiguration');
      errorHandlerService.logError(handledError, `validateDashboardConfiguration:${config?._id}`);
      
      secureLogger.error('Unexpected validation error occurred', { 
        configId: config?._id,
        error: handledError.message 
      });
      
      errors.push({
        field: 'general',
        message: 'Unexpected validation error occurred',
        severity: 'error'
      });
    }

    return {
      isValid: errors.filter(e => e.severity === 'error').length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate a single team configuration
   */
  public validateTeamConfiguration(config: DashboardConfig, errors: ValidationError[] = [], warnings: ValidationWarning[] = []): ValidationResult {
    try {
      // Input validation
      if (!config) {
        errors.push({
          field: 'config',
          message: 'Team configuration object is required',
          severity: 'error'
        });
        return { isValid: false, errors, warnings };
      }

      secureLogger.debug('Validating team configuration', { 
        teamType: config.teamType,
        hasStructure: !!config.primaryGoal && !!config.secondaryGoal1 && !!config.secondaryGoal2 
      });

      // Basic structure validation with error handling
      try {
        if (!validateConfigurationStructure(config)) {
          errors.push({
            field: 'structure',
            message: `Invalid configuration structure for ${config.teamType || 'unknown team'}`,
            severity: 'error'
          });
        }
      } catch (structureError) {
        secureLogger.error('Error validating team configuration structure', { 
          teamType: config.teamType,
          error: structureError 
        });
        errors.push({
          field: 'structure',
          message: `Failed to validate structure for ${config.teamType || 'unknown team'}`,
          severity: 'error'
        });
      }

      // Validate team-specific requirements with error handling
      try {
        this.validateTeamSpecificRequirements(config, errors, warnings);
      } catch (teamError) {
        secureLogger.error('Error validating team-specific requirements', { 
          teamType: config.teamType,
          error: teamError 
        });
        errors.push({
          field: 'teamSpecific',
          message: `Failed to validate team-specific requirements for ${config.teamType}`,
          severity: 'error'
        });
      }

      // Validate Carteira II special processing with error handling
      if (config.teamType === TeamType.CARTEIRA_II) {
        try {
          this.validateCarteiraIISpecialProcessing(config, errors, warnings);
        } catch (carteiraError) {
          secureLogger.error('Error validating Carteira II special processing', { 
            teamType: config.teamType,
            error: carteiraError 
          });
          errors.push({
            field: 'specialProcessing',
            message: 'Failed to validate Carteira II special processing requirements',
            severity: 'error'
          });
        }
      }

      // Validate challenge IDs and action IDs with error handling
      try {
        this.validateChallengeAndActionIds(config, errors, warnings);
      } catch (idError) {
        secureLogger.error('Error validating challenge and action IDs', { 
          teamType: config.teamType,
          error: idError 
        });
        warnings.push({
          field: 'ids',
          message: 'Could not fully validate challenge and action IDs',
          type: 'validation_error'
        });
      }

      // Validate boost configurations with error handling
      try {
        this.validateBoostConfigurations(config, errors, warnings);
      } catch (boostError) {
        secureLogger.error('Error validating boost configurations', { 
          teamType: config.teamType,
          error: boostError 
        });
        errors.push({
          field: 'boost',
          message: 'Failed to validate boost configurations',
          severity: 'error'
        });
      }

      // Validate unlock conditions with error handling
      try {
        this.validateUnlockConditions(config, errors, warnings);
      } catch (unlockError) {
        secureLogger.error('Error validating unlock conditions', { 
          teamType: config.teamType,
          error: unlockError 
        });
        errors.push({
          field: 'unlock',
          message: 'Failed to validate unlock conditions',
          severity: 'error'
        });
      }

      const isValid = errors.filter(e => e.severity === 'error').length === 0;
      
      secureLogger.debug('Team configuration validation completed', { 
        teamType: config.teamType,
        isValid,
        errorCount: errors.filter(e => e.severity === 'error').length,
        warningCount: warnings.length 
      });

    } catch (error) {
      const handledError = errorHandlerService.handleValidationError(error, 'validateTeamConfiguration');
      errorHandlerService.logError(handledError, `validateTeamConfiguration:${config?.teamType}`);
      
      secureLogger.error('Unexpected error validating team configuration', { 
        teamType: config?.teamType,
        error: handledError.message 
      });
      
      errors.push({
        field: 'general',
        message: `Unexpected validation error for ${config?.teamType || 'unknown team'}`,
        severity: 'error'
      });
    }

    return {
      isValid: errors.filter(e => e.severity === 'error').length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate Carteira II special processing requirements
   */
  public validateCarteiraIISpecialProcessing(config: DashboardConfig, errors: ValidationError[], warnings: ValidationWarning[]): void {
    if (config.teamType !== TeamType.CARTEIRA_II) {
      return;
    }

    // Check if special processing is defined
    if (!config.specialProcessing) {
      errors.push({
        field: 'specialProcessing',
        message: 'Carteira II must have special processing configuration',
        severity: 'error'
      });
      return;
    }

    // Validate special processing type
    if (config.specialProcessing.type !== 'carteira_ii_local') {
      errors.push({
        field: 'specialProcessing.type',
        message: 'Carteira II special processing type must be "carteira_ii_local"',
        severity: 'error'
      });
    }

    // Validate that primary goal uses local processing
    if (config.primaryGoal.calculationType !== 'local_processing') {
      errors.push({
        field: 'primaryGoal.calculationType',
        message: 'Carteira II primary goal must use local_processing calculation type',
        severity: 'error'
      });
    }

    // Validate that secondary goals use local processing
    if (config.secondaryGoal1.calculationType !== 'local_processing') {
      errors.push({
        field: 'secondaryGoal1.calculationType',
        message: 'Carteira II secondary goal 1 must use local_processing calculation type',
        severity: 'error'
      });
    }

    if (config.secondaryGoal2.calculationType !== 'local_processing') {
      errors.push({
        field: 'secondaryGoal2.calculationType',
        message: 'Carteira II secondary goal 2 must use local_processing calculation type',
        severity: 'error'
      });
    }

    // Add warnings about local processing implications
    warnings.push({
      field: 'specialProcessing',
      message: 'Carteira II uses local calculations - changes may affect existing processing logic',
      type: 'business_rule'
    });

    warnings.push({
      field: 'specialProcessing',
      message: 'Boost mechanics for Carteira II are calculated locally and not synchronized with Funifier',
      type: 'compatibility'
    });

    // Validate that warnings are present
    if (!config.specialProcessing.warnings || config.specialProcessing.warnings.length === 0) {
      warnings.push({
        field: 'specialProcessing.warnings',
        message: 'Carteira II should include warnings about local processing implications',
        type: 'business_rule'
      });
    }
  }

  /**
   * Validate basic configuration structure
   */
  private validateBasicStructure(config: DashboardConfigurationRecord, errors: ValidationError[]): void {
    if (!config._id) {
      errors.push({
        field: '_id',
        message: 'Configuration ID is required',
        severity: 'error'
      });
    }

    if (!config.version) {
      errors.push({
        field: 'version',
        message: 'Valid version number is required',
        severity: 'error'
      });
    }

    if (!config.createdAt) {
      errors.push({
        field: 'createdAt',
        message: 'Creation timestamp is required',
        severity: 'error'
      });
    }

    if (!config.createdBy) {
      errors.push({
        field: 'createdBy',
        message: 'Creator information is required',
        severity: 'error'
      });
    }

    if (!config.configurations || typeof config.configurations !== 'object') {
      errors.push({
        field: 'configurations',
        message: 'Configurations object is required',
        severity: 'error'
      });
    }

    // isActive is optional in our interface, so we don't validate it
  }

  /**
   * Validate team-specific requirements
   */
  private validateTeamSpecificRequirements(config: DashboardConfig, errors: ValidationError[], warnings: ValidationWarning[]): void {
    // Validate team type matches configuration
    if (!Object.values(TeamType).includes(config.teamType)) {
      errors.push({
        field: 'teamType',
        message: `Invalid team type: ${config.teamType}`,
        severity: 'error'
      });
    }

    // Validate display name
    if (!config.displayName || config.displayName.trim().length === 0) {
      errors.push({
        field: 'displayName',
        message: 'Display name is required and cannot be empty',
        severity: 'error'
      });
    }

    // Validate metric names are appropriate for team type
    this.validateMetricNamesForTeam(config, errors, warnings);
  }

  /**
   * Validate metric names are appropriate for the team type
   */
  private validateMetricNamesForTeam(config: DashboardConfig, errors: ValidationError[], warnings: ValidationWarning[]): void {
    const validMetricsForTeam: Record<TeamType, string[]> = {
      [TeamType.CARTEIRA_0]: ['conversoes', 'reaisPorAtivo', 'faturamento'],
      [TeamType.CARTEIRA_I]: ['atividade', 'reaisPorAtivo', 'faturamento'],
      [TeamType.CARTEIRA_II]: ['reaisPorAtivo', 'atividade', 'multimarcasPorAtivo'],
      [TeamType.CARTEIRA_III]: ['faturamento', 'reaisPorAtivo', 'multimarcasPorAtivo'],
      [TeamType.CARTEIRA_IV]: ['faturamento', 'reaisPorAtivo', 'multimarcasPorAtivo'],
      [TeamType.ER]: ['faturamento', 'reaisPorAtivo', 'upa']
    };

    const validMetrics = validMetricsForTeam[config.teamType] || [];
    
    if (!validMetrics.includes(config.primaryGoal.name)) {
      warnings.push({
        field: 'primaryGoal.name',
        message: `Metric '${config.primaryGoal.name}' is not typically used as primary goal for ${config.teamType}`,
        type: 'business_rule'
      });
    }

    if (!validMetrics.includes(config.secondaryGoal1.name)) {
      warnings.push({
        field: 'secondaryGoal1.name',
        message: `Metric '${config.secondaryGoal1.name}' is not typically used for ${config.teamType}`,
        type: 'business_rule'
      });
    }

    if (!validMetrics.includes(config.secondaryGoal2.name)) {
      warnings.push({
        field: 'secondaryGoal2.name',
        message: `Metric '${config.secondaryGoal2.name}' is not typically used for ${config.teamType}`,
        type: 'business_rule'
      });
    }
  }

  /**
   * Validate challenge IDs and action IDs
   */
  private validateChallengeAndActionIds(config: DashboardConfig, errors: ValidationError[], warnings: ValidationWarning[]): void {
    // Validate challenge ID format (should be alphanumeric)
    const challengeIdPattern = /^[A-Za-z0-9]+$/;

    if (!challengeIdPattern.test(config.primaryGoal.challengeId)) {
      errors.push({
        field: 'primaryGoal.challengeId',
        message: 'Challenge ID must be alphanumeric',
        severity: 'error'
      });
    }

    if (!challengeIdPattern.test(config.secondaryGoal1.challengeId)) {
      errors.push({
        field: 'secondaryGoal1.challengeId',
        message: 'Challenge ID must be alphanumeric',
        severity: 'error'
      });
    }

    if (!challengeIdPattern.test(config.secondaryGoal2.challengeId)) {
      errors.push({
        field: 'secondaryGoal2.challengeId',
        message: 'Challenge ID must be alphanumeric',
        severity: 'error'
      });
    }

    // Validate action IDs match expected values
    const validActionIds = Object.values(FUNIFIER_CONFIG.ACTION_IDS);
    
    if (!validActionIds.includes(config.primaryGoal.actionId as any)) {
      warnings.push({
        field: 'primaryGoal.actionId',
        message: `Action ID '${config.primaryGoal.actionId}' is not a standard action ID`,
        type: 'compatibility'
      });
    }

    if (!validActionIds.includes(config.secondaryGoal1.actionId as any)) {
      warnings.push({
        field: 'secondaryGoal1.actionId',
        message: `Action ID '${config.secondaryGoal1.actionId}' is not a standard action ID`,
        type: 'compatibility'
      });
    }

    if (!validActionIds.includes(config.secondaryGoal2.actionId as any)) {
      warnings.push({
        field: 'secondaryGoal2.actionId',
        message: `Action ID '${config.secondaryGoal2.actionId}' is not a standard action ID`,
        type: 'compatibility'
      });
    }
  }

  /**
   * Validate boost configurations
   */
  private validateBoostConfigurations(config: DashboardConfig, errors: ValidationError[], warnings: ValidationWarning[]): void {
    // Validate boost catalog item IDs
    const catalogItemPattern = /^[A-Za-z0-9]+$/;

    if (!catalogItemPattern.test(config.secondaryGoal1.boost.catalogItemId)) {
      errors.push({
        field: 'secondaryGoal1.boost.catalogItemId',
        message: 'Boost catalog item ID must be alphanumeric',
        severity: 'error'
      });
    }

    if (!catalogItemPattern.test(config.secondaryGoal2.boost.catalogItemId)) {
      errors.push({
        field: 'secondaryGoal2.boost.catalogItemId',
        message: 'Boost catalog item ID must be alphanumeric',
        severity: 'error'
      });
    }

    // Validate boost names and descriptions
    if (!config.secondaryGoal1.boost.name || config.secondaryGoal1.boost.name.trim().length === 0) {
      errors.push({
        field: 'secondaryGoal1.boost.name',
        message: 'Boost name is required',
        severity: 'error'
      });
    }

    if (!config.secondaryGoal2.boost.name || config.secondaryGoal2.boost.name.trim().length === 0) {
      errors.push({
        field: 'secondaryGoal2.boost.name',
        message: 'Boost name is required',
        severity: 'error'
      });
    }

    if (!config.secondaryGoal1.boost.description || config.secondaryGoal1.boost.description.trim().length === 0) {
      errors.push({
        field: 'secondaryGoal1.boost.description',
        message: 'Boost description is required',
        severity: 'error'
      });
    }

    if (!config.secondaryGoal2.boost.description || config.secondaryGoal2.boost.description.trim().length === 0) {
      errors.push({
        field: 'secondaryGoal2.boost.description',
        message: 'Boost description is required',
        severity: 'error'
      });
    }

    // Check for duplicate boost catalog items
    if (config.secondaryGoal1.boost.catalogItemId === config.secondaryGoal2.boost.catalogItemId) {
      warnings.push({
        field: 'boost.catalogItemId',
        message: 'Secondary goals use the same boost catalog item ID',
        type: 'business_rule'
      });
    }
  }

  /**
   * Validate unlock conditions
   */
  private validateUnlockConditions(config: DashboardConfig, errors: ValidationError[], warnings: ValidationWarning[]): void {
    const catalogItemPattern = /^[A-Za-z0-9]+$/;

    if (!catalogItemPattern.test(config.unlockConditions.catalogItemId)) {
      errors.push({
        field: 'unlockConditions.catalogItemId',
        message: 'Unlock conditions catalog item ID must be alphanumeric',
        severity: 'error'
      });
    }

    if (!config.unlockConditions.description || config.unlockConditions.description.trim().length === 0) {
      errors.push({
        field: 'unlockConditions.description',
        message: 'Unlock conditions description is required',
        severity: 'error'
      });
    }

    // Check if unlock catalog item is the standard one
    if (config.unlockConditions.catalogItemId !== FUNIFIER_CONFIG.CATALOG_ITEMS.UNLOCK_POINTS) {
      warnings.push({
        field: 'unlockConditions.catalogItemId',
        message: 'Using non-standard unlock catalog item ID',
        type: 'compatibility'
      });
    }
  }

  /**
   * Validate configuration consistency across teams
   */
  private validateConfigurationConsistency(config: DashboardConfigurationRecord, errors: ValidationError[], warnings: ValidationWarning[]): void {
    const configurations = Object.values(config.configurations);
    
    // Check for duplicate challenge IDs across teams (which might be intentional)
    const challengeIds = new Set<string>();
    const duplicateChallengeIds = new Set<string>();

    configurations.forEach(teamConfig => {
      [teamConfig.primaryGoal, teamConfig.secondaryGoal1, teamConfig.secondaryGoal2].forEach(goal => {
        if (challengeIds.has(goal.challengeId)) {
          duplicateChallengeIds.add(goal.challengeId);
        } else {
          challengeIds.add(goal.challengeId);
        }
      });
    });

    if (duplicateChallengeIds.size > 0) {
      warnings.push({
        field: 'configurations',
        message: `Duplicate challenge IDs found: ${Array.from(duplicateChallengeIds).join(', ')}`,
        type: 'compatibility'
      });
    }

    // Check for inconsistent boost catalog items
    const boostCatalogIds = new Set<string>();
    configurations.forEach(teamConfig => {
      boostCatalogIds.add(teamConfig.secondaryGoal1.boost.catalogItemId);
      boostCatalogIds.add(teamConfig.secondaryGoal2.boost.catalogItemId);
    });

    if (boostCatalogIds.size > 2) {
      warnings.push({
        field: 'configurations',
        message: 'Multiple different boost catalog items detected - ensure this is intentional',
        type: 'business_rule'
      });
    }
  }

  /**
   * Get validation warnings for Carteira II configuration changes
   */
  public getCarteiraIIWarnings(): string[] {
    return [
      'Esta carteira usa cálculos locais em vez de dados diretos da Funifier',
      'Mudanças nas métricas podem afetar a lógica de processamento local',
      'Boosts são calculados localmente e não sincronizados com a Funifier',
      'Alterações podem quebrar a funcionalidade existente de boost/unlock',
      'Teste cuidadosamente após fazer alterações na configuração'
    ];
  }

  /**
   * Validate configuration changes for breaking changes
   */
  public validateConfigurationChanges(
    oldConfig: DashboardConfigurationRecord, 
    newConfig: DashboardConfigurationRecord
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // First validate the new configuration
    const newConfigValidation = this.validateDashboardConfiguration(newConfig);
    errors.push(...newConfigValidation.errors);
    warnings.push(...newConfigValidation.warnings);

    // Check for breaking changes
    Object.values(TeamType).forEach(teamType => {
      const oldTeamConfig = oldConfig.configurations[teamType];
      const newTeamConfig = newConfig.configurations[teamType];

      if (oldTeamConfig && newTeamConfig) {
        this.validateTeamConfigurationChanges(oldTeamConfig, newTeamConfig, warnings);
      }
    });

    return {
      isValid: errors.filter(e => e.severity === 'error').length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate changes between team configurations
   */
  private validateTeamConfigurationChanges(
    oldConfig: DashboardConfig, 
    newConfig: DashboardConfig, 
    warnings: ValidationWarning[]
  ): void {
    // Check for metric changes
    if (oldConfig.primaryGoal.name !== newConfig.primaryGoal.name) {
      warnings.push({
        field: `${newConfig.teamType}.primaryGoal.name`,
        message: `Primary goal metric changed from ${oldConfig.primaryGoal.name} to ${newConfig.primaryGoal.name}`,
        type: 'business_rule'
      });
    }

    if (oldConfig.secondaryGoal1.name !== newConfig.secondaryGoal1.name) {
      warnings.push({
        field: `${newConfig.teamType}.secondaryGoal1.name`,
        message: `Secondary goal 1 metric changed from ${oldConfig.secondaryGoal1.name} to ${newConfig.secondaryGoal1.name}`,
        type: 'business_rule'
      });
    }

    if (oldConfig.secondaryGoal2.name !== newConfig.secondaryGoal2.name) {
      warnings.push({
        field: `${newConfig.teamType}.secondaryGoal2.name`,
        message: `Secondary goal 2 metric changed from ${oldConfig.secondaryGoal2.name} to ${newConfig.secondaryGoal2.name}`,
        type: 'business_rule'
      });
    }

    // Check for calculation type changes
    if (oldConfig.primaryGoal.calculationType !== newConfig.primaryGoal.calculationType) {
      warnings.push({
        field: `${newConfig.teamType}.primaryGoal.calculationType`,
        message: `Primary goal calculation type changed - this may affect data processing`,
        type: 'compatibility'
      });
    }

    // Check for boost catalog item changes
    if (oldConfig.secondaryGoal1.boost.catalogItemId !== newConfig.secondaryGoal1.boost.catalogItemId) {
      warnings.push({
        field: `${newConfig.teamType}.secondaryGoal1.boost.catalogItemId`,
        message: `Boost catalog item changed - existing boosts may be affected`,
        type: 'business_rule'
      });
    }

    if (oldConfig.secondaryGoal2.boost.catalogItemId !== newConfig.secondaryGoal2.boost.catalogItemId) {
      warnings.push({
        field: `${newConfig.teamType}.secondaryGoal2.boost.catalogItemId`,
        message: `Boost catalog item changed - existing boosts may be affected`,
        type: 'business_rule'
      });
    }
  }
}

// Export singleton instance
export const configurationValidator = ConfigurationValidator.getInstance();