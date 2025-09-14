import { ReportProcessingService } from '../report-processing.service';

describe('CSV Processing for New Format', () => {
  let service: ReportProcessingService;

  beforeEach(() => {
    service = ReportProcessingService.getInstance();
  });

  it('should parse CSV with correct column mapping', async () => {
    // Create a mock CSV file with the expected format
    const csvContent = `123456,15,21,120000,95000,79,1200,1100,92,45,38,84,85,78,92
456789,15,21,110000,88000,80,1150,1050,91,40,35,88,90,85,94`;

    const file = new File([csvContent], 'test.csv', { type: 'text/csv' });
    
    const result = await service.parseFile(file);
    
    expect(result.isValid).toBe(true);
    expect(result.data).toHaveLength(2);
    
    const firstRecord = result.data[0];
    expect(firstRecord.playerId).toBe('123456');
    expect(firstRecord.diaDociclo).toBe(15);
    expect(firstRecord.totalDiasCiclo).toBe(21);
    expect(firstRecord.faturamentoMeta).toBe(120000);
    expect(firstRecord.faturamentoAtual).toBe(95000);
    expect(firstRecord.faturamentoPercentual).toBe(79);
    expect(firstRecord.reaisPorAtivoMeta).toBe(1200);
    expect(firstRecord.reaisPorAtivoAtual).toBe(1100);
    expect(firstRecord.reaisPorAtivoPercentual).toBe(92);
    expect(firstRecord.multimarcasPorAtivoMeta).toBe(45);
    expect(firstRecord.multimarcasPorAtivoAtual).toBe(38);
    expect(firstRecord.multimarcasPorAtivoPercentual).toBe(84);
    expect(firstRecord.atividadeMeta).toBe(85);
    expect(firstRecord.atividadeAtual).toBe(78);
    expect(firstRecord.atividadePercentual).toBe(92);
  });

  it('should validate required fields', async () => {
    // CSV with missing values
    const csvContent = `123456,,21,120000,95000,79,1200,1100,92,45,38,84,85,78,92`;
    
    const file = new File([csvContent], 'test.csv', { type: 'text/csv' });
    
    const result = await service.parseFile(file);
    
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].field).toBe('diaDociclo');
  });

  it('should validate numeric fields', async () => {
    // CSV with invalid numeric values
    const csvContent = `123456,abc,21,120000,95000,79,1200,1100,92,45,38,84,85,78,92`;
    
    const file = new File([csvContent], 'test.csv', { type: 'text/csv' });
    
    const result = await service.parseFile(file);
    
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.field === 'diaDociclo')).toBe(true);
  });

  it('should generate correct summary', () => {
    const mockData = [
      {
        playerId: '123456',
        diaDociclo: 15,
        totalDiasCiclo: 21,
        faturamentoMeta: 120000,
        faturamentoAtual: 95000,
        faturamentoPercentual: 79,
        reaisPorAtivoMeta: 1200,
        reaisPorAtivoAtual: 1100,
        reaisPorAtivoPercentual: 92,
        multimarcasPorAtivoMeta: 45,
        multimarcasPorAtivoAtual: 38,
        multimarcasPorAtivoPercentual: 84,
        atividadeMeta: 85,
        atividadeAtual: 78,
        atividadePercentual: 92,
        reportDate: '2024-01-01'
      }
    ];

    const parseResult = {
      data: mockData,
      errors: [],
      isValid: true
    };

    const summary = service.generateSummary(parseResult);
    
    expect(summary).toContain('1 registros válidos');
    expect(summary).toContain('Dia atual: 15');
    expect(summary).toContain('Total de dias: 21');
  });
});