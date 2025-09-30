export interface ParseResult {
  isValid: boolean;
  data: ReportData[];
  errors: ValidationError[];
  summary?: string;
}

export interface ReportData {
  playerId: string;
  diaDociclo: number;
  totalDiasCiclo: number;
  faturamentoMeta?: number;
  faturamentoAtual?: number;
  faturamentoPercentual?: number;
  reaisPorAtivoMeta?: number;
  reaisPorAtivoAtual?: number;
  reaisPorAtivoPercentual?: number;
  multimarcasPorAtivoMeta?: number;
  multimarcasPorAtivoAtual?: number;
  multimarcasPorAtivoPercentual?: number;
  atividadeMeta?: number;
  atividadeAtual?: number;
  atividadePercentual?: number;
  conversoesMeta?: number;
  conversoesAtual?: number;
  conversoesPercentual?: number;
  upaMeta?: number;
  upaAtual?: number;
  upaPercentual?: number;
}

export interface ValidationError {
  row: number;
  field: string;
  message: string;
  value?: any;
}

export class ReportProcessingService {
  static validateFileFormat(file: File): string | null {
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    const allowedExtensions = ['.csv', '.xls', '.xlsx'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      return 'Formato de arquivo não suportado. Use CSV, XLS ou XLSX.';
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB
      return 'Arquivo muito grande. Tamanho máximo: 10MB.';
    }
    
    return null;
  }

  static async parseFile(file: File): Promise<ParseResult> {
    // Mock implementation - replace with actual parsing logic
    const mockData: ReportData[] = [
      {
        playerId: 'player1',
        diaDociclo: 15,
        totalDiasCiclo: 21,
        faturamentoPercentual: 85,
        reaisPorAtivoPercentual: 92,
        atividadePercentual: 78
      }
    ];

    const mockErrors: ValidationError[] = [];

    return {
      isValid: mockErrors.length === 0,
      data: mockData,
      errors: mockErrors,
      summary: `${mockData.length} registros processados com sucesso`
    };
  }

  static generateSummary(parseResult: ParseResult): string {
    const { data, errors } = parseResult;
    let summary = `Processamento concluído:\n`;
    summary += `✅ ${data.length} registros válidos\n`;
    
    if (errors.length > 0) {
      summary += `❌ ${errors.length} erros encontrados\n`;
    }
    
    return summary;
  }
}