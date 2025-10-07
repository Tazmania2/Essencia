import { DashboardConfigurationRecord, TeamType } from '../types';

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error';
}

export interface ValidationWarning {
  field: string;
  message: string;
  severity: 'warning';
}

export class ConfigurationValidator {
  private static instance: ConfigurationValidator;

  private constructor() {}

  public static getInstance(): ConfigurationValidator {
    if (!ConfigurationValidator.instance) {
      ConfigurationValidator.instance = new ConfigurationValidator();
    }
    return ConfigurationValidator.instance;
  }

  validateDashboardConfiguration(config: DashboardConfigurationRecord): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    try {
      // Basic validation
      if (!config) {
        errors.push({
          field: 'config',
          message: 'Configuration object is required',
          severity: 'error'
        });
        return { isValid: false, errors, warnings };
      }

      if (!config.configurations) {
        errors.push({
          field: 'configurations',
          message: 'Configurations object is required',
          severity: 'error'
        });
        return { isValid: false, errors, warnings };
      }

      // Validate that all team types are present
      const requiredTeamTypes = [
        TeamType.CARTEIRA_0,
        TeamType.CARTEIRA_I,
        TeamType.CARTEIRA_II,
        TeamType.CARTEIRA_III,
        TeamType.CARTEIRA_IV,
        TeamType.ER
      ];

      const missingTeamTypes = requiredTeamTypes.filter(teamType => 
        !config.configurations[teamType]
      );

      if (missingTeamTypes.length > 0) {
        errors.push({
          field: 'configurations',
          message: `Missing configurations for team types: ${missingTeamTypes.join(', ')}`,
          severity: 'error'
        });
      }

      // Validate each team configuration
      Object.entries(config.configurations).forEach(([teamType, teamConfig]) => {
        if (!teamConfig.primaryGoal) {
          errors.push({
            field: `${teamType}.primaryGoal`,
            message: 'Primary goal is required',
            severity: 'error'
          });
        }

        if (!teamConfig.secondaryGoal1) {
          errors.push({
            field: `${teamType}.secondaryGoal1`,
            message: 'Secondary goal 1 is required',
            severity: 'error'
          });
        }

        if (!teamConfig.secondaryGoal2) {
          errors.push({
            field: `${teamType}.secondaryGoal2`,
            message: 'Secondary goal 2 is required',
            severity: 'error'
          });
        }

        // Add warnings for special cases
        if (teamType === TeamType.CARTEIRA_II && teamConfig.primaryGoal?.calculationType !== 'local_processing') {
          warnings.push({
            field: `${teamType}.primaryGoal.calculationType`,
            message: 'Carteira II typically uses local processing',
            severity: 'warning'
          });
        }
      });

      return {
        isValid: errors.length === 0,
        errors,
        warnings
      };

    } catch (error) {
      console.error('Error validating configuration:', error);
      errors.push({
        field: 'general',
        message: 'Validation error occurred',
        severity: 'error'
      });

      return { isValid: false, errors, warnings };
    }
  }
}

export const configurationValidator = ConfigurationValidator.getInstance();