import { ReportProcessingService, ReportData, ValidationError } from '../report-processing.service';

// Mock Papa and XLSX
jest.mock('papaparse', () => ({
  parse: jest.fn()
}));

jest.mock('xlsx', () => ({
  read: jest.fn(),
  utils: {
    sheet_to_json: jest.fn()
  }
}));

import Papa from 'papaparse';
import * as XLSX from 'xlsx';

const mockPapa = Papa as jest.Mocked<typeof Papa>;
const mockXLSX = XLSX as jest.Mocked<typeof XLSX>;

describe('ReportProcessingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateFileFormat', () => {
    it('should accept CSV files', () => {
      const file = new File([''], 'test.csv', { type: 'text/csv' });
      const result = ReportProcessingService.validateFileFormat(file);
      expect(result).toBeNull();
    });

    it('should accept Excel files', () => {
      const file = new File([''], 'test.xlsx', { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const result = ReportProcessingService.validateFileFormat(file);
      expect(result).toBeNull();
    });

    it('should reject unsupported file types', () => {
      const file = new File([''], 'test.txt', { type: 'text/plain' });
      const result = ReportProcessingService.validateFileFormat(file);
      expect(result).toContain('Formato de arquivo não suportado');
    });

    it('should reject files that are too large', () => {
      const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.csv', { type: 'text/csv' });
      const result = ReportProcessingService.validateFileFormat(largeFile);
      expect(result).toContain('Arquivo muito grande');
    });
  });

  describe('parseFile - CSV', () => {
    it('should parse valid CSV data successfully', async () => {
      const mockData = [
        {
          'Player ID': 'P001',
          'Dia do Ciclo': '12',
          'Total Dias Ciclo': '21',
          'Faturamento Meta': '400000',
          'Faturamento Atual': '200000',
          'Faturamento %': '50',
          'Reais por Ativo Meta': '1300',
          'Reais por Ativo Atual': '325',
          'Reais por Ativo %': '25',
          'Multimarcas por Ativo Meta': '2',
          'Multimarcas por Ativo Atual': '1.3',
          'Multimarcas por Ativo %': '65',
          'Atividade Meta': '41',
          'Atividade Atual': '36',
          'Atividade %': '88',
          'Conversões Meta': '100',
          'Conversões Atual': '75',
          'Conversões %': '75',
          'UPA Meta': '50',
          'UPA Atual': '40',
          'UPA %': '80'
        }
      ];

      mockPapa.parse.mockImplementation((file, options) => {
        if (options?.complete) {
          options.complete({
            data: mockData,
            errors: [],
            meta: { fields: [] }
          });
        }
        return {} as any;
      });

      const file = new File([''], 'test.csv', { type: 'text/csv' });
      const result = await ReportProcessingService.parseFile(file);

      expect(result.isValid).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toMatchObject({
        playerId: 'P001',
        diaDociclo: 12,
        totalDiasCiclo: 21,
        faturamentoMeta: 400000,
        faturamentoAtual: 200000,
        faturamentoPercentual: 50,
        atividadePercentual: 88,
        conversoesPercentual: 75,
        upaPercentual: 80
      });
      expect(result.errors).toHaveLength(0);
    });

    it('should handle CSV parsing errors', async () => {
      mockPapa.parse.mockImplementation((file, options) => {
        if (options?.complete) {
          options.complete({
            data: [],
            errors: [{ message: 'Invalid CSV format' }],
            meta: { fields: [] }
          });
        }
        return {} as any;
      });

      const file = new File([''], 'invalid.csv', { type: 'text/csv' });
      const result = await ReportProcessingService.parseFile(file);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('Erro ao processar CSV');
    });
  });

  describe('parseFile - Excel', () => {
    it('should parse valid Excel data successfully', async () => {
      const mockWorkbook = {
        SheetNames: ['Sheet1'],
        Sheets: {
          Sheet1: {}
        }
      };

      const mockSheetData = [
        ['Player ID', 'Dia do Ciclo', 'Total Dias Ciclo', 'Faturamento Meta', 'Faturamento Atual', 'Faturamento %', 'Reais por Ativo Meta', 'Reais por Ativo Atual', 'Reais por Ativo %', 'Multimarcas por Ativo Meta', 'Multimarcas por Ativo Atual', 'Multimarcas por Ativo %', 'Atividade Meta', 'Atividade Atual', 'Atividade %', 'Conversões Meta', 'Conversões Atual', 'Conversões %', 'UPA Meta', 'UPA Atual', 'UPA %'],
        ['P001', '12', '21', '400000', '200000', '50', '1300', '325', '25', '2', '1.3', '65', '41', '36', '88', '100', '75', '75', '50', '40', '80']
      ];

      mockXLSX.read.mockReturnValue(mockWorkbook as any);
      mockXLSX.utils.sheet_to_json.mockReturnValue(mockSheetData as any);

      // Mock FileReader
      const mockFileReader = {
        onload: null as any,
        onerror: null as any,
        readAsArrayBuffer: jest.fn()
      };

      global.FileReader = jest.fn(() => mockFileReader) as any;

      const file = new File([''], 'test.xlsx', { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });

      const parsePromise = ReportProcessingService.parseFile(file);

      // Simulate FileReader success
      setTimeout(() => {
        if (mockFileReader.onload) {
          mockFileReader.onload({
            target: { result: new ArrayBuffer(8) }
          });
        }
      }, 0);

      const result = await parsePromise;

      expect(result.isValid).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].playerId).toBe('P001');
    });
  });

  describe('data validation', () => {
    it('should validate required fields', async () => {
      const mockData = [
        {
          'Player ID': '',
          'Dia do Ciclo': '12',
          'Total Dias Ciclo': '21',
          'Faturamento Meta': '400000',
          'Faturamento Atual': '200000',
          'Faturamento %': '50',
          'Reais por Ativo Meta': '1300',
          'Reais por Ativo Atual': '325',
          'Reais por Ativo %': '25',
          'Multimarcas por Ativo Meta': '2',
          'Multimarcas por Ativo Atual': '1.3',
          'Multimarcas por Ativo %': '65',
          'Atividade Meta': '41',
          'Atividade Atual': '36',
          'Atividade %': '88'
        }
      ];

      mockPapa.parse.mockImplementation((file, options) => {
        if (options?.complete) {
          options.complete({
            data: mockData,
            errors: [],
            meta: { fields: [] }
          });
        }
        return {} as any;
      });

      const file = new File([''], 'test.csv', { type: 'text/csv' });
      const result = await ReportProcessingService.parseFile(file);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.field === 'playerId')).toBe(true);
      expect(result.errors.find(e => e.field === 'playerId')?.message).toContain('Campo obrigatório');
    });

    it('should validate numeric fields', async () => {
      // Mock data that will be converted to the expected format by parseCSV
      const mockData = [
        {
          'Player ID': 'P001',
          'Dia do Ciclo': 'not_a_number', // This will cause validation error
          'Total Dias Ciclo': '21',
          'Faturamento Meta': '400000',
          'Faturamento Atual': '200000',
          'Faturamento %': '50',
          'Reais por Ativo Meta': '1300',
          'Reais por Ativo Atual': '325',
          'Reais por Ativo %': '25',
          'Multimarcas por Ativo Meta': '2',
          'Multimarcas por Ativo Atual': '1.3',
          'Multimarcas por Ativo %': '65',
          'Atividade Meta': '41',
          'Atividade Atual': '36',
          'Atividade %': '88'
        }
      ];

      mockPapa.parse.mockImplementation((file, options) => {
        if (options?.complete) {
          options.complete({
            data: mockData,
            errors: [],
            meta: { fields: [] }
          });
        }
        return {} as any;
      });

      const file = new File([''], 'test.csv', { type: 'text/csv' });
      const result = await ReportProcessingService.parseFile(file);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      // The error should be for diaDociclo field after mapping
      expect(result.errors.some(e => e.field === 'diaDociclo')).toBe(true);
      const diaDocicloError = result.errors.find(e => e.field === 'diaDociclo');
      expect(diaDocicloError?.message).toContain('deve ser um número');
    });

    it('should reject negative values', async () => {
      const mockData = [
        {
          'Player ID': 'P001',
          'Dia do Ciclo': '12',
          'Total Dias Ciclo': '21',
          'Faturamento Meta': '-400000',
          'Faturamento Atual': '200000',
          'Faturamento %': '50',
          'Reais por Ativo Meta': '1300',
          'Reais por Ativo Atual': '325',
          'Reais por Ativo %': '25',
          'Multimarcas por Ativo Meta': '2',
          'Multimarcas por Ativo Atual': '1.3',
          'Multimarcas por Ativo %': '65',
          'Atividade Meta': '41',
          'Atividade Atual': '36',
          'Atividade %': '88'
        }
      ];

      mockPapa.parse.mockImplementation((file, options) => {
        if (options?.complete) {
          options.complete({
            data: mockData,
            errors: [],
            meta: { fields: [] }
          });
        }
        return {} as any;
      });

      const file = new File([''], 'test.csv', { type: 'text/csv' });
      const result = await ReportProcessingService.parseFile(file);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.field === 'faturamentoMeta')).toBe(true);
      expect(result.errors.find(e => e.field === 'faturamentoMeta')?.message).toContain('não pode ser negativo');
    });

    it('should handle optional new metrics correctly', async () => {
      const mockData = [
        {
          'Player ID': 'P001',
          'Dia do Ciclo': '12',
          'Total Dias Ciclo': '21',
          'Faturamento Meta': '400000',
          'Faturamento Atual': '200000',
          'Faturamento %': '50',
          'Reais por Ativo Meta': '1300',
          'Reais por Ativo Atual': '325',
          'Reais por Ativo %': '25',
          'Multimarcas por Ativo Meta': '2',
          'Multimarcas por Ativo Atual': '1.3',
          'Multimarcas por Ativo %': '65',
          'Atividade Meta': '41',
          'Atividade Atual': '36',
          'Atividade %': '88',
          'Conversões Meta': '100',
          'Conversões Atual': '75',
          'Conversões %': '75',
          'UPA Meta': '',
          'UPA Atual': '',
          'UPA %': ''
        }
      ];

      mockPapa.parse.mockImplementation((file, options) => {
        if (options?.complete) {
          options.complete({
            data: mockData,
            errors: [],
            meta: { fields: [] }
          });
        }
        return {} as any;
      });

      const file = new File([''], 'test.csv', { type: 'text/csv' });
      const result = await ReportProcessingService.parseFile(file);

      expect(result.isValid).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].conversoesPercentual).toBe(75);
      expect(result.data[0].upaPercentual).toBeUndefined();
    });

    it('should validate new metrics when provided', async () => {
      const mockData = [
        {
          'Player ID': 'P001',
          'Dia do Ciclo': '12',
          'Total Dias Ciclo': '21',
          'Faturamento Meta': '400000',
          'Faturamento Atual': '200000',
          'Faturamento %': '50',
          'Reais por Ativo Meta': '1300',
          'Reais por Ativo Atual': '325',
          'Reais por Ativo %': '25',
          'Multimarcas por Ativo Meta': '2',
          'Multimarcas por Ativo Atual': '1.3',
          'Multimarcas por Ativo %': '65',
          'Atividade Meta': '41',
          'Atividade Atual': '36',
          'Atividade %': '88',
          'Conversões Meta': 'invalid_number',
          'Conversões Atual': '75',
          'Conversões %': '75',
          'UPA Meta': '50',
          'UPA Atual': '40',
          'UPA %': '-10'
        }
      ];

      mockPapa.parse.mockImplementation((file, options) => {
        if (options?.complete) {
          options.complete({
            data: mockData,
            errors: [],
            meta: { fields: [] }
          });
        }
        return {} as any;
      });

      const file = new File([''], 'test.csv', { type: 'text/csv' });
      const result = await ReportProcessingService.parseFile(file);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.field === 'conversoesMeta')).toBe(true);
      expect(result.errors.some(e => e.field === 'upaPercentual')).toBe(true);
      expect(result.errors.find(e => e.field === 'conversoesMeta')?.message).toContain('deve ser um número');
      expect(result.errors.find(e => e.field === 'upaPercentual')?.message).toContain('não pode ser negativo');
    });
  });

  describe('generateSummary', () => {
    it('should generate summary for valid data', () => {
      const parseResult = {
        data: [
          {
            playerId: 'P001',
            diaDociclo: 12,
            totalDiasCiclo: 21,
            faturamentoMeta: 400000,
            faturamentoAtual: 200000,
            faturamentoPercentual: 50,
            reaisPorAtivoMeta: 1300,
            reaisPorAtivoAtual: 325,
            reaisPorAtivoPercentual: 25,
            multimarcasPorAtivoMeta: 2,
            multimarcasPorAtivoAtual: 1.3,
            multimarcasPorAtivoPercentual: 65,
            atividadeMeta: 41,
            atividadeAtual: 36,
            atividadePercentual: 88,
            conversoesPercentual: 75,
            reportDate: '2024-01-01'
          },
          {
            playerId: 'P002',
            diaDociclo: 12,
            totalDiasCiclo: 21,
            faturamentoMeta: 300000,
            faturamentoAtual: 150000,
            faturamentoPercentual: 50,
            reaisPorAtivoMeta: 1200,
            reaisPorAtivoAtual: 300,
            reaisPorAtivoPercentual: 25,
            multimarcasPorAtivoMeta: 3,
            multimarcasPorAtivoAtual: 2,
            multimarcasPorAtivoPercentual: 67,
            atividadeMeta: 40,
            atividadeAtual: 35,
            atividadePercentual: 88,
            upaPercentual: 80,
            reportDate: '2024-01-01'
          }
        ] as ReportData[],
        errors: [] as ValidationError[],
        isValid: true
      };

      const summary = ReportProcessingService.generateSummary(parseResult);

      expect(summary).toContain('2 registros válidos');
      expect(summary).toContain('Dia atual: 12');
      expect(summary).toContain('Total de dias: 21');
      expect(summary).toContain('Conversões: 1 registros');
      expect(summary).toContain('UPA: 1 registros');
    });

    it('should include error count in summary', () => {
      const parseResult = {
        data: [] as ReportData[],
        errors: [
          { row: 1, field: 'playerId', message: 'Required field missing' }
        ] as ValidationError[],
        isValid: false
      };

      const summary = ReportProcessingService.generateSummary(parseResult);

      expect(summary).toContain('0 registros válidos');
      expect(summary).toContain('1 erros encontrados');
    });
  });
});