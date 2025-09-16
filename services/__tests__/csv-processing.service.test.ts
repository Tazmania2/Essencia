import { CSVProcessingService } from '../csv-processing.service';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('CSVProcessingService', () => {
  let service: CSVProcessingService;

  beforeEach(() => {
    service = CSVProcessingService.getInstance();
    jest.clearAllMocks();
  });

  describe('parseGoalCSV', () => {
    it('should parse CSV with core metrics only (backward compatibility)', () => {
      const csvContent = `Player ID,Dia do Ciclo,Total Dias Ciclo,Faturamento Meta,Faturamento Atual,Faturamento %,Reais por Ativo Meta,Reais por Ativo Atual,Reais por Ativo %,Atividade Meta,Atividade Atual,Atividade %,Multimarcas por Ativo Meta,Multimarcas por Ativo Atual,Multimarcas por Ativo %
123456,12,21,400000,200000,50,1300,325,25,41,36,88,2,1.3,65`;

      const result = service.parseGoalCSV(csvContent);

      expect(result).not.toBeNull();
      expect(result!.playerId).toBe('123456');
      expect(result!.cycleDay).toBe(12);
      expect(result!.totalCycleDays).toBe(21);
      expect(result!.faturamento).toEqual({
        target: 400000,
        current: 200000,
        percentage: 50
      });
      expect(result!.reaisPorAtivo).toEqual({
        target: 1300,
        current: 325,
        percentage: 25
      });
      expect(result!.atividade).toEqual({
        target: 41,
        current: 36,
        percentage: 88
      });
      expect(result!.multimarcasPorAtivo).toEqual({
        target: 2,
        current: 1.3,
        percentage: 65
      });
      expect(result!.conversoes).toBeUndefined();
      expect(result!.upa).toBeUndefined();
    });

    it('should parse CSV with new metrics (conversoes and upa)', () => {
      const csvContent = `Player ID,Dia do Ciclo,Total Dias Ciclo,Faturamento Meta,Faturamento Atual,Faturamento %,Reais por Ativo Meta,Reais por Ativo Atual,Reais por Ativo %,Atividade Meta,Atividade Atual,Atividade %,Multimarcas por Ativo Meta,Multimarcas por Ativo Atual,Multimarcas por Ativo %,Conversões Meta,Conversões Atual,Conversões %,UPA Meta,UPA Atual,UPA %
123456,12,21,400000,200000,50,1300,325,25,41,36,88,2,1.3,65,100,75,75,50.5,45.2,89.5`;

      const result = service.parseGoalCSV(csvContent);

      expect(result).not.toBeNull();
      expect(result!.conversoes).toEqual({
        target: 100,
        current: 75,
        percentage: 75
      });
      expect(result!.upa).toEqual({
        target: 50.5,
        current: 45.2,
        percentage: 89.5
      });
    });

    it('should parse CSV with only conversoes metric', () => {
      const csvContent = `Player ID,Dia do Ciclo,Total Dias Ciclo,Faturamento Meta,Faturamento Atual,Faturamento %,Reais por Ativo Meta,Reais por Ativo Atual,Reais por Ativo %,Atividade Meta,Atividade Atual,Atividade %,Multimarcas por Ativo Meta,Multimarcas por Ativo Atual,Multimarcas por Ativo %,Conversões Meta,Conversões Atual,Conversões %
123456,12,21,400000,200000,50,1300,325,25,41,36,88,2,1.3,65,100,75,75`;

      const result = service.parseGoalCSV(csvContent);

      expect(result).not.toBeNull();
      expect(result!.conversoes).toEqual({
        target: 100,
        current: 75,
        percentage: 75
      });
      expect(result!.upa).toBeUndefined();
    });

    it('should parse CSV with only upa metric', () => {
      const csvContent = `Player ID,Dia do Ciclo,Total Dias Ciclo,Faturamento Meta,Faturamento Atual,Faturamento %,Reais por Ativo Meta,Reais por Ativo Atual,Reais por Ativo %,Atividade Meta,Atividade Atual,Atividade %,Multimarcas por Ativo Meta,Multimarcas por Ativo Atual,Multimarcas por Ativo %,UPA Meta,UPA Atual,UPA %
123456,12,21,400000,200000,50,1300,325,25,41,36,88,2,1.3,65,50.5,45.2,89.5`;

      const result = service.parseGoalCSV(csvContent);

      expect(result).not.toBeNull();
      expect(result!.conversoes).toBeUndefined();
      expect(result!.upa).toEqual({
        target: 50.5,
        current: 45.2,
        percentage: 89.5
      });
    });

    it('should handle invalid numeric values gracefully', () => {
      const csvContent = `Player ID,Dia do Ciclo,Total Dias Ciclo,Faturamento Meta,Faturamento Atual,Faturamento %,Reais por Ativo Meta,Reais por Ativo Atual,Reais por Ativo %,Atividade Meta,Atividade Atual,Atividade %,Multimarcas por Ativo Meta,Multimarcas por Ativo Atual,Multimarcas por Ativo %,Conversões Meta,Conversões Atual,Conversões %
123456,abc,21,400000,200000,50,1300,325,25,41,36,88,2,1.3,65,invalid,75,75`;

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const result = service.parseGoalCSV(csvContent);

      expect(result).not.toBeNull();
      expect(result!.cycleDay).toBe(0); // Default for invalid value
      expect(result!.conversoes!.target).toBe(0); // Default for invalid value
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid'));
      
      consoleSpy.mockRestore();
    });

    it('should return null for invalid CSV content', () => {
      expect(service.parseGoalCSV('')).toBeNull();
      expect(service.parseGoalCSV('invalid')).toBeNull();
      expect(service.parseGoalCSV('header only')).toBeNull();
    });

    it('should return null for missing required fields', () => {
      const csvContent = `Missing Field,Dia do Ciclo,Total Dias Ciclo
123456,12,21`;

      const result = service.parseGoalCSV(csvContent);
      expect(result).toBeNull();
    });
  });

  describe('validateCSVStructure', () => {
    it('should validate CSV with core headers only', () => {
      const csvContent = `Player ID,Dia do Ciclo,Total Dias Ciclo,Faturamento Meta,Faturamento Atual,Faturamento %,Reais por Ativo Meta,Reais por Ativo Atual,Reais por Ativo %,Atividade Meta,Atividade Atual,Atividade %,Multimarcas por Ativo Meta,Multimarcas por Ativo Atual,Multimarcas por Ativo %
123456,12,21,400000,200000,50,1300,325,25,41,36,88,2,1.3,65`;

      expect(service.validateCSVStructure(csvContent)).toBe(true);
    });

    it('should validate CSV with new metrics', () => {
      const csvContent = `Player ID,Dia do Ciclo,Total Dias Ciclo,Faturamento Meta,Faturamento Atual,Faturamento %,Reais por Ativo Meta,Reais por Ativo Atual,Reais por Ativo %,Atividade Meta,Atividade Atual,Atividade %,Multimarcas por Ativo Meta,Multimarcas por Ativo Atual,Multimarcas por Ativo %,Conversões Meta,Conversões Atual,Conversões %,UPA Meta,UPA Atual,UPA %
123456,12,21,400000,200000,50,1300,325,25,41,36,88,2,1.3,65,100,75,75,50.5,45.2,89.5`;

      expect(service.validateCSVStructure(csvContent)).toBe(true);
    });

    it('should reject CSV with incomplete conversoes headers', () => {
      const csvContent = `Player ID,Dia do Ciclo,Total Dias Ciclo,Faturamento Meta,Faturamento Atual,Faturamento %,Reais por Ativo Meta,Reais por Ativo Atual,Reais por Ativo %,Atividade Meta,Atividade Atual,Atividade %,Multimarcas por Ativo Meta,Multimarcas por Ativo Atual,Multimarcas por Ativo %,Conversões Meta,Conversões Atual
123456,12,21,400000,200000,50,1300,325,25,41,36,88,2,1.3,65,100,75`;

      expect(service.validateCSVStructure(csvContent)).toBe(false);
    });

    it('should reject CSV with incomplete UPA headers', () => {
      const csvContent = `Player ID,Dia do Ciclo,Total Dias Ciclo,Faturamento Meta,Faturamento Atual,Faturamento %,Reais por Ativo Meta,Reais por Ativo Atual,Reais por Ativo %,Atividade Meta,Atividade Atual,Atividade %,Multimarcas por Ativo Meta,Multimarcas por Ativo Atual,Multimarcas por Ativo %,UPA Meta
123456,12,21,400000,200000,50,1300,325,25,41,36,88,2,1.3,65,50.5`;

      expect(service.validateCSVStructure(csvContent)).toBe(false);
    });

    it('should reject CSV missing required headers', () => {
      const csvContent = `Player ID,Dia do Ciclo
123456,12`;

      expect(service.validateCSVStructure(csvContent)).toBe(false);
    });

    it('should reject empty or invalid CSV', () => {
      expect(service.validateCSVStructure('')).toBe(false);
      expect(service.validateCSVStructure('single line')).toBe(false);
    });
  });

  describe('getGoalUnit', () => {
    it('should return correct units for all goal types', () => {
      expect(service.getGoalUnit('faturamento')).toBe('R$');
      expect(service.getGoalUnit('reaisPorAtivo')).toBe('R$');
      expect(service.getGoalUnit('multimarcasPorAtivo')).toBe('marcas');
      expect(service.getGoalUnit('atividade')).toBe('pontos');
      expect(service.getGoalUnit('conversoes')).toBe('conversões');
      expect(service.getGoalUnit('upa')).toBe('UPA');
    });
  });

  describe('formatGoalValue', () => {
    it('should format currency values correctly', () => {
      const result1 = service.formatGoalValue(1000, 'faturamento');
      const result2 = service.formatGoalValue(1500.75, 'reaisPorAtivo');
      
      // Check that it contains the expected currency format
      expect(result1).toMatch(/R\$\s*1\.000/);
      expect(result2).toMatch(/R\$\s*1\.501/);
    });

    it('should format multimarcas values with one decimal', () => {
      expect(service.formatGoalValue(2.5, 'multimarcasPorAtivo')).toBe('2.5');
      expect(service.formatGoalValue(3, 'multimarcasPorAtivo')).toBe('3.0');
    });

    it('should format conversoes as rounded integers', () => {
      expect(service.formatGoalValue(75.7, 'conversoes')).toBe('76');
      expect(service.formatGoalValue(100, 'conversoes')).toBe('100');
    });

    it('should format UPA with two decimals', () => {
      expect(service.formatGoalValue(45.234, 'upa')).toBe('45.23');
      expect(service.formatGoalValue(50, 'upa')).toBe('50.00');
    });

    it('should format atividade as rounded integers', () => {
      expect(service.formatGoalValue(85.7, 'atividade')).toBe('86');
      expect(service.formatGoalValue(100, 'atividade')).toBe('100');
    });
  });

  describe('validateNewMetrics', () => {
    it('should validate conversoes metrics correctly', () => {
      const goalData = {
        playerId: '123456',
        cycleDay: 12,
        totalCycleDays: 21,
        faturamento: { target: 1000, current: 500, percentage: 50 },
        reaisPorAtivo: { target: 1000, current: 500, percentage: 50 },
        multimarcasPorAtivo: { target: 1000, current: 500, percentage: 50 },
        atividade: { target: 1000, current: 500, percentage: 50 },
        conversoes: { target: 100, current: 75, percentage: 75 }
      };

      const errors = service.validateNewMetrics(goalData);
      expect(errors).toHaveLength(0);
    });

    it('should validate UPA metrics correctly', () => {
      const goalData = {
        playerId: '123456',
        cycleDay: 12,
        totalCycleDays: 21,
        faturamento: { target: 1000, current: 500, percentage: 50 },
        reaisPorAtivo: { target: 1000, current: 500, percentage: 50 },
        multimarcasPorAtivo: { target: 1000, current: 500, percentage: 50 },
        atividade: { target: 1000, current: 500, percentage: 50 },
        upa: { target: 50.5, current: 45.2, percentage: 89.5 }
      };

      const errors = service.validateNewMetrics(goalData);
      expect(errors).toHaveLength(0);
    });

    it('should detect negative values in conversoes', () => {
      const goalData = {
        playerId: '123456',
        cycleDay: 12,
        totalCycleDays: 21,
        faturamento: { target: 1000, current: 500, percentage: 50 },
        reaisPorAtivo: { target: 1000, current: 500, percentage: 50 },
        multimarcasPorAtivo: { target: 1000, current: 500, percentage: 50 },
        atividade: { target: 1000, current: 500, percentage: 50 },
        conversoes: { target: -100, current: -75, percentage: 150 }
      };

      const errors = service.validateNewMetrics(goalData);
      expect(errors).toContain('Conversões Meta must be non-negative');
      expect(errors).toContain('Conversões Atual must be non-negative');
      expect(errors).toContain('Conversões % must be between 0 and 100');
    });

    it('should detect percentage calculation mismatches', () => {
      const goalData = {
        playerId: '123456',
        cycleDay: 12,
        totalCycleDays: 21,
        faturamento: { target: 1000, current: 500, percentage: 50 },
        reaisPorAtivo: { target: 1000, current: 500, percentage: 50 },
        multimarcasPorAtivo: { target: 1000, current: 500, percentage: 50 },
        atividade: { target: 1000, current: 500, percentage: 50 },
        conversoes: { target: 100, current: 75, percentage: 50 } // Should be 75%
      };

      const errors = service.validateNewMetrics(goalData);
      expect(errors.some(error => error.includes('percentage mismatch'))).toBe(true);
    });

    it('should return empty array when no new metrics present', () => {
      const goalData = {
        playerId: '123456',
        cycleDay: 12,
        totalCycleDays: 21,
        faturamento: { target: 1000, current: 500, percentage: 50 },
        reaisPorAtivo: { target: 1000, current: 500, percentage: 50 },
        multimarcasPorAtivo: { target: 1000, current: 500, percentage: 50 },
        atividade: { target: 1000, current: 500, percentage: 50 }
      };

      const errors = service.validateNewMetrics(goalData);
      expect(errors).toHaveLength(0);
    });
  });

  describe('downloadAndParseCSV', () => {
    it('should download and parse CSV successfully', async () => {
      const csvContent = `Player ID,Dia do Ciclo,Total Dias Ciclo,Faturamento Meta,Faturamento Atual,Faturamento %,Reais por Ativo Meta,Reais por Ativo Atual,Reais por Ativo %,Atividade Meta,Atividade Atual,Atividade %,Multimarcas por Ativo Meta,Multimarcas por Ativo Atual,Multimarcas por Ativo %
123456,12,21,400000,200000,50,1300,325,25,41,36,88,2,1.3,65`;

      mockedAxios.get.mockResolvedValue({ data: csvContent });

      const result = await service.downloadAndParseCSV('https://example.com/test.csv');

      expect(result).not.toBeNull();
      expect(result!.playerId).toBe('123456');
      expect(mockedAxios.get).toHaveBeenCalledWith('https://example.com/test.csv', expect.any(Object));
    });

    it('should handle download errors gracefully', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network error'));

      const result = await service.downloadAndParseCSV('https://example.com/test.csv');

      expect(result).toBeNull();
    });

    it('should handle invalid URLs', async () => {
      const result = await service.downloadAndParseCSV('invalid-url');

      expect(result).toBeNull();
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });

    it('should handle empty response', async () => {
      mockedAxios.get.mockResolvedValue({ data: '' });

      const result = await service.downloadAndParseCSV('https://example.com/test.csv');

      expect(result).toBeNull();
    });
  });
});