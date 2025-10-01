import { DashboardConfigurationService, dashboardConfigurationService } from '../dashboard-configuration.service';
import { DashboardConfigurationRecord, TeamType } from '../../types';

describe('DashboardConfigurationService', () => {
  let service: DashboardConfigurationService;

  beforeEach(() => {
    service = DashboardConfigurationService.getInstance();
    jest.clearAllMocks();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = DashboardConfigurationService.getInstance();
      const instance2 = DashboardConfigurationService.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should return the same instance as the exported singleton', () => {
      expect(DashboardConfigurationService.getInstance()).toBe(dashboardConfigurationService);
    });
  });

  describe('getCurrentConfiguration', () => {
    it('should return default configuration structure', async () => {
      const result = await service.getCurrentConfiguration();

      expect(result).toHaveProperty('version');
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('createdBy');
      expect(result).toHaveProperty('configurations');
      expect(result.version).toBe('1.0.0');
      expect(result.createdBy).toBe('system');
    });

    it('should include configurations for all team types', async () => {
      const result = await service.getCurrentConfiguration();

      expect(result.configurations).toHaveProperty(TeamType.CARTEIRA_0);
      expect(result.configurations).toHaveProperty(TeamType.CARTEIRA_I);
      expect(result.configurations).toHaveProperty(TeamType.CARTEIRA_II);
      expect(result.configurations).toHaveProperty(TeamType.CARTEIRA_III);
      expect(result.configurations).toHaveProperty(TeamType.CARTEIRA_IV);
      expect(result.configurations).toHaveProperty(TeamType.ER);
    });

    it('should have correct structure for each team configuration', async () => {
      const result = await service.getCurrentConfiguration();
      const carteiraIConfig = result.configurations[TeamType.CARTEIRA_I];

      expect(carteiraIConfig).toHaveProperty('primaryGoal');
      expect(carteiraIConfig).toHaveProperty('secondaryGoal1');
      expect(carteiraIConfig).toHaveProperty('secondaryGoal2');
      
      expect(carteiraIConfig.primaryGoal).toHaveProperty('displayName');
      expect(carteiraIConfig.primaryGoal).toHaveProperty('metric');
      expect(carteiraIConfig.secondaryGoal1).toHaveProperty('displayName');
      expect(carteiraIConfig.secondaryGoal1).toHaveProperty('metric');
      expect(carteiraIConfig.secondaryGoal2).toHaveProperty('displayName');
      expect(carteiraIConfig.secondaryGoal2).toHaveProperty('metric');
    });

    it('should have correct default metrics for Carteira I', async () => {
      const result = await service.getCurrentConfiguration();
      const carteiraIConfig = result.configurations[TeamType.CARTEIRA_I];

      expect(carteiraIConfig.primaryGoal.displayName).toBe('Atividade');
      expect(carteiraIConfig.primaryGoal.metric).toBe('atividade');
      expect(carteiraIConfig.secondaryGoal1.displayName).toBe('Reais por Ativo');
      expect(carteiraIConfig.secondaryGoal1.metric).toBe('reaisPorAtivo');
      expect(carteiraIConfig.secondaryGoal2.displayName).toBe('Faturamento');
      expect(carteiraIConfig.secondaryGoal2.metric).toBe('faturamento');
    });

    it('should have correct default metrics for Carteira II', async () => {
      const result = await service.getCurrentConfiguration();
      const carteiraIIConfig = result.configurations[TeamType.CARTEIRA_II];

      expect(carteiraIIConfig.primaryGoal.displayName).toBe('Reais por Ativo');
      expect(carteiraIIConfig.primaryGoal.metric).toBe('reaisPorAtivo');
      expect(carteiraIIConfig.secondaryGoal1.displayName).toBe('Atividade');
      expect(carteiraIIConfig.secondaryGoal1.metric).toBe('atividade');
      expect(carteiraIIConfig.secondaryGoal2.displayName).toBe('Multimarcas por Ativo');
      expect(carteiraIIConfig.secondaryGoal2.metric).toBe('multimarcasPorAtivo');
    });

    it('should have correct default metrics for ER team', async () => {
      const result = await service.getCurrentConfiguration();
      const erConfig = result.configurations[TeamType.ER];

      expect(erConfig.primaryGoal.displayName).toBe('Faturamento');
      expect(erConfig.primaryGoal.metric).toBe('faturamento');
      expect(erConfig.secondaryGoal1.displayName).toBe('Reais por Ativo');
      expect(erConfig.secondaryGoal1.metric).toBe('reaisPorAtivo');
      expect(erConfig.secondaryGoal2.displayName).toBe('UPA');
      expect(erConfig.secondaryGoal2.metric).toBe('upa');
    });

    it('should return valid timestamp', async () => {
      const result = await service.getCurrentConfiguration();
      const createdAt = new Date(result.createdAt);
      
      expect(createdAt).toBeInstanceOf(Date);
      expect(createdAt.getTime()).not.toBeNaN();
    });
  });

  describe('saveConfiguration', () => {
    it('should save configuration with provided data', async () => {
      const inputConfig: Partial<DashboardConfigurationRecord> = {
        version: '2.0.0',
        createdBy: 'admin123',
        configurations: {
          [TeamType.CARTEIRA_I]: {
            primaryGoal: { displayName: 'Custom Primary', metric: 'customPrimary' },
            secondaryGoal1: { displayName: 'Custom Secondary 1', metric: 'customSecondary1' },
            secondaryGoal2: { displayName: 'Custom Secondary 2', metric: 'customSecondary2' }
          }
        } as any
      };

      const result = await service.saveConfiguration(inputConfig);

      expect(result).toHaveProperty('_id');
      expect(result._id).toMatch(/^config_\d+$/);
      expect(result.version).toBe('2.0.0');
      expect(result.createdBy).toBe('admin123');
      expect(result.configurations).toBe(inputConfig.configurations);
      expect(result).toHaveProperty('updatedAt');
    });

    it('should use default values when not provided', async () => {
      const inputConfig: Partial<DashboardConfigurationRecord> = {};

      const result = await service.saveConfiguration(inputConfig);

      expect(result.version).toBe('1.0.0');
      expect(result.createdBy).toBe('admin');
      expect(result.configurations).toEqual({});
    });

    it('should preserve provided createdAt timestamp', async () => {
      const customCreatedAt = '2024-01-01T00:00:00.000Z';
      const inputConfig: Partial<DashboardConfigurationRecord> = {
        createdAt: customCreatedAt
      };

      const result = await service.saveConfiguration(inputConfig);

      expect(result.createdAt).toBe(customCreatedAt);
    });

    it('should generate new createdAt when not provided', async () => {
      const inputConfig: Partial<DashboardConfigurationRecord> = {};

      const result = await service.saveConfiguration(inputConfig);

      expect(result.createdAt).toBeDefined();
      const createdAt = new Date(result.createdAt);
      expect(createdAt).toBeInstanceOf(Date);
      expect(createdAt.getTime()).not.toBeNaN();
    });

    it('should always generate updatedAt timestamp', async () => {
      const inputConfig: Partial<DashboardConfigurationRecord> = {};

      const result = await service.saveConfiguration(inputConfig);

      expect(result.updatedAt).toBeDefined();
      const updatedAt = new Date(result.updatedAt!);
      expect(updatedAt).toBeInstanceOf(Date);
      expect(updatedAt.getTime()).not.toBeNaN();
    });

    it('should generate unique IDs for different saves', async () => {
      const inputConfig: Partial<DashboardConfigurationRecord> = {};

      const result1 = await service.saveConfiguration(inputConfig);
      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 1));
      const result2 = await service.saveConfiguration(inputConfig);

      expect(result1._id).not.toBe(result2._id);
    });

    it('should handle complex configuration objects', async () => {
      const complexConfig: Partial<DashboardConfigurationRecord> = {
        version: '3.0.0',
        createdBy: 'system-admin',
        configurations: {
          [TeamType.CARTEIRA_0]: {
            primaryGoal: { displayName: 'Conversões Avançadas', metric: 'conversoesAvancadas' },
            secondaryGoal1: { displayName: 'ROI por Cliente', metric: 'roiPorCliente' },
            secondaryGoal2: { displayName: 'Ticket Médio', metric: 'ticketMedio' }
          },
          [TeamType.CARTEIRA_I]: {
            primaryGoal: { displayName: 'Engajamento', metric: 'engajamento' },
            secondaryGoal1: { displayName: 'Satisfação', metric: 'satisfacao' },
            secondaryGoal2: { displayName: 'Retenção', metric: 'retencao' }
          }
        } as any
      };

      const result = await service.saveConfiguration(complexConfig);

      expect(result.configurations[TeamType.CARTEIRA_0].primaryGoal.displayName).toBe('Conversões Avançadas');
      expect(result.configurations[TeamType.CARTEIRA_I].secondaryGoal2.metric).toBe('retencao');
    });
  });

  describe('error handling', () => {
    it('should handle getCurrentConfiguration errors gracefully', async () => {
      // Since this is a mock implementation, we can't easily test real errors
      // But we can verify the method doesn't throw
      await expect(service.getCurrentConfiguration()).resolves.toBeDefined();
    });

    it('should handle saveConfiguration errors gracefully', async () => {
      // Since this is a mock implementation, we can't easily test real errors
      // But we can verify the method doesn't throw
      const config = { version: '1.0.0' };
      await expect(service.saveConfiguration(config)).resolves.toBeDefined();
    });
  });

  describe('data consistency', () => {
    it('should maintain consistent data structure across calls', async () => {
      const config1 = await service.getCurrentConfiguration();
      const config2 = await service.getCurrentConfiguration();

      expect(config1.configurations).toEqual(config2.configurations);
      expect(Object.keys(config1.configurations)).toEqual(Object.keys(config2.configurations));
    });

    it('should have all required team types in configuration', async () => {
      const result = await service.getCurrentConfiguration();
      const teamTypes = Object.values(TeamType);
      const configuredTeams = Object.keys(result.configurations);

      teamTypes.forEach(teamType => {
        expect(configuredTeams).toContain(teamType);
      });
    });

    it('should have consistent goal structure across all teams', async () => {
      const result = await service.getCurrentConfiguration();
      
      Object.values(result.configurations).forEach(teamConfig => {
        expect(teamConfig).toHaveProperty('primaryGoal');
        expect(teamConfig).toHaveProperty('secondaryGoal1');
        expect(teamConfig).toHaveProperty('secondaryGoal2');
        
        [teamConfig.primaryGoal, teamConfig.secondaryGoal1, teamConfig.secondaryGoal2].forEach(goal => {
          expect(goal).toHaveProperty('displayName');
          expect(goal).toHaveProperty('metric');
          expect(typeof goal.displayName).toBe('string');
          expect(typeof goal.metric).toBe('string');
          expect(goal.displayName.length).toBeGreaterThan(0);
          expect(goal.metric.length).toBeGreaterThan(0);
        });
      });
    });
  });
});