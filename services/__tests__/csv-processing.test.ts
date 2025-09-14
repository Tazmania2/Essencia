import { ReportProcessingService } from '../report-processing.service';

describe('CSV Processing for New Format', () => {
  let service: ReportProcessingService;

  beforeEach(() => {
    service = ReportProcessingService.getInstance();
  });

  it('should parse CSV with correct column mapping', async () => {
    // Create a mock CSV file with headers and test data
    const csvContent = `Player ID,Dia do Ciclo,Total Dias Ciclo,Faturamento Meta,Faturamento Atual,Faturamento %,Reais por Ativo Meta,Reais por Ativo Atual,Reais por Ativo %,Multimarcas por Ativo Meta,Multimarcas por Ativo Atual,Multimarcas por Ativo %,Atividade Meta,Atividade Atual,Atividade %
123456,12,21,400000,200000,50,1300,325,25,2,1.3,65,41,36,88`;

    const file = new File([csvContent], 'test.csv', { type: 'text/csv' });
    
    const result = await service.parseFile(file);
    
    expect(result.isValid).toBe(true);
    expect(result.data).toHaveLength(1);
    
    const firstRecord = result.data[0];
    expect(firstRecord.playerId).toBe('123456');
    expect(firstRecord.diaDociclo).toBe(12);
    expect(firstRecord.totalDiasCiclo).toBe(21);
    expect(firstRecord.faturamentoMeta).toBe(400000);
    expect(firstRecord.faturamentoAtual).toBe(200000);
    expect(firstRecord.faturamentoPercentual).toBe(50);
    expect(firstRecord.reaisPorAtivoMeta).toBe(1300);
    expect(firstRecord.reaisPorAtivoAtual).toBe(325);
    expect(firstRecord.reaisPorAtivoPercentual).toBe(25);
    expect(firstRecord.multimarcasPorAtivoMeta).toBe(2);
    expect(firstRecord.multimarcasPorAtivoAtual).toBe(1.3);
    expect(firstRecord.multimarcasPorAtivoPercentual).toBe(65);
    expect(firstRecord.atividadeMeta).toBe(41);
    expect(firstRecord.atividadeAtual).toBe(36);
    expect(firstRecord.atividadePercentual).toBe(88);
  });

  it('should validate required fields', async () => {
    // CSV with missing values (empty Dia do Ciclo)
    const csvContent = `Player ID,Dia do Ciclo,Total Dias Ciclo,Faturamento Meta,Faturamento Atual,Faturamento %,Reais por Ativo Meta,Reais por Ativo Atual,Reais por Ativo %,Multimarcas por Ativo Meta,Multimarcas por Ativo Atual,Multimarcas por Ativo %,Atividade Meta,Atividade Atual,Atividade %
123456,,21,120000,95000,79,1200,1100,92,45,38,84,85,78,92`;
    
    const file = new File([csvContent], 'test.csv', { type: 'text/csv' });
    
    const result = await service.parseFile(file);
    
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some(e => e.field === 'diaDociclo')).toBe(true);
  });

  it('should validate numeric fields', async () => {
    // CSV with invalid numeric values (abc instead of number)
    const csvContent = `Player ID,Dia do Ciclo,Total Dias Ciclo,Faturamento Meta,Faturamento Atual,Faturamento %,Reais por Ativo Meta,Reais por Ativo Atual,Reais por Ativo %,Multimarcas por Ativo Meta,Multimarcas por Ativo Atual,Multimarcas por Ativo %,Atividade Meta,Atividade Atual,Atividade %
123456,abc,21,120000,95000,79,1200,1100,92,45,38,84,85,78,92`;
    
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