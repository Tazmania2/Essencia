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
          playerId: 'P001',
          playerName: 'João Silva',
          team: 'CARTEIRA_I',
          atividade: '85.5',
          reaisPorAtivo: '120.0'
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
        playerName: 'João Silva',
        team: 'CARTEIRA_I',
        atividade: 85.5,
        reaisPorAtivo: 120.0
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
        ['playerId', 'playerName', 'team', 'atividade'],
        ['P001', 'João Silva', 'CARTEIRA_I', '85.5']
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
          playerId: '',
          playerName: 'João Silva',
          team: 'CARTEIRA_I'
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
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('playerId');
      expect(result.errors[0].message).toContain('Campo obrigatório');
    });

    it('should validate team values', async () => {
      const mockData = [
        {
          playerId: 'P001',
          playerName: 'João Silva',
          team: 'INVALID_TEAM'
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
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('team');
      expect(result.errors[0].message).toContain('Time inválido');
    });

    it('should validate numeric fields', async () => {
      const mockData = [
        {
          playerId: 'P001',
          playerName: 'João Silva',
          team: 'CARTEIRA_I',
          atividade: 'not_a_number'
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
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('atividade');
      expect(result.errors[0].message).toContain('deve ser um número');
    });

    it('should reject negative values', async () => {
      const mockData = [
        {
          playerId: 'P001',
          playerName: 'João Silva',
          team: 'CARTEIRA_I',
          atividade: '-10'
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
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('atividade');
      expect(result.errors[0].message).toContain('não pode ser negativo');
    });
  });

  describe('generateSummary', () => {
    it('should generate summary for valid data', () => {
      const parseResult = {
        data: [
          {
            playerId: 'P001',
            playerName: 'João Silva',
            team: 'CARTEIRA_I',
            reportDate: '2024-01-01'
          },
          {
            playerId: 'P002',
            playerName: 'Maria Santos',
            team: 'CARTEIRA_II',
            reportDate: '2024-01-01'
          }
        ] as ReportData[],
        errors: [] as ValidationError[],
        isValid: true
      };

      const summary = ReportProcessingService.generateSummary(parseResult);

      expect(summary).toContain('2 registros válidos');
      expect(summary).toContain('CARTEIRA_I: 1 jogadores');
      expect(summary).toContain('CARTEIRA_II: 1 jogadores');
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