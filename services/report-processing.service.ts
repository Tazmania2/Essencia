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
  private static instance: ReportProcessingService;

  public static getInstance(): ReportProcessingService {
    if (!ReportProcessingService.instance) {
      ReportProcessingService.instance = new ReportProcessingService();
    }
    return ReportProcessingService.instance;
  }

  async processReportFile(file: File, token: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      // Validate file format
      const formatError = ReportProcessingService.validateFileFormat(file);
      if (formatError) {
        return { success: false, error: formatError };
      }

      // Parse file
      const parseResult = await ReportProcessingService.parseFile(file);
      
      if (!parseResult.isValid) {
        return { 
          success: false, 
          error: 'File validation failed',
          data: { errors: parseResult.errors }
        };
      }

      return {
        success: true,
        data: {
          records: parseResult.data,
          summary: parseResult.summary
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

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
    throw new Error('File parsing service not implemented. Please configure CSV/Excel parsing integration.');
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