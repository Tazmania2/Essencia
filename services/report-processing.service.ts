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

  async processReportFile(
    file: File,
    token: string
  ): Promise<{ success: boolean; data?: any; error?: string }> {
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
          data: { errors: parseResult.errors },
        };
      }

      return {
        success: true,
        data: {
          records: parseResult.data,
          summary: parseResult.summary,
        },
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  static validateFileFormat(file: File): string | null {
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    const allowedExtensions = ['.csv', '.xls', '.xlsx'];
    const fileExtension = file.name
      .toLowerCase()
      .substring(file.name.lastIndexOf('.'));

    if (
      !allowedTypes.includes(file.type) &&
      !allowedExtensions.includes(fileExtension)
    ) {
      return 'Formato de arquivo não suportado. Use CSV, XLS ou XLSX.';
    }

    if (file.size > 10 * 1024 * 1024) {
      // 10MB
      return 'Arquivo muito grande. Tamanho máximo: 10MB.';
    }

    return null;
  }

  static async parseFile(file: File): Promise<ParseResult> {
    try {
      const text = await file.text();
      const lines = text.trim().split('\n');

      if (lines.length < 2) {
        return {
          isValid: false,
          data: [],
          errors: [
            {
              row: 0,
              field: 'file',
              message:
                'Arquivo deve conter pelo menos uma linha de cabeçalho e uma linha de dados',
            },
          ],
        };
      }

      const headers = lines[0]
        .split(',')
        .map((h) => h.trim().replace(/"/g, ''));
      const data: ReportData[] = [];
      const errors: ValidationError[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i]
          .split(',')
          .map((v) => v.trim().replace(/"/g, ''));

        if (values.length !== headers.length) {
          errors.push({
            row: i + 1,
            field: 'structure',
            message: `Linha ${i + 1}: Número de colunas não corresponde ao cabeçalho`,
          });
          continue;
        }

        const record: any = {};
        headers.forEach((header, index) => {
          record[header] = values[index];
        });

        // Convert to ReportData format - only parse fields that exist in CSV
        const reportData: ReportData = {
          playerId: record['Player ID'] || '',
          diaDociclo: parseInt(record['Dia do Ciclo']) || 0,
          totalDiasCiclo: parseInt(record['Total Dias Ciclo']) || 0,
          faturamentoMeta: parseFloat(record['Faturamento Meta']) || 0,
          faturamentoAtual: parseFloat(record['Faturamento Atual']) || 0,
          faturamentoPercentual: parseFloat(record['Faturamento %']) || 0,
          reaisPorAtivoMeta: parseFloat(record['Reais por Ativo Meta']) || 0,
          reaisPorAtivoAtual: parseFloat(record['Reais por Ativo Atual']) || 0,
          reaisPorAtivoPercentual: parseFloat(record['Reais por Ativo %']) || 0,
          multimarcasPorAtivoMeta:
            parseFloat(record['Multimarcas por Ativo Meta']) || 0,
          multimarcasPorAtivoAtual:
            parseFloat(record['Multimarcas por Ativo Atual']) || 0,
          multimarcasPorAtivoPercentual:
            parseFloat(record['Multimarcas por Ativo %']) || 0,
          atividadeMeta: parseFloat(record['Atividade Meta']) || 0,
          atividadeAtual: parseFloat(record['Atividade Atual']) || 0,
          atividadePercentual: parseFloat(record['Atividade %']) || 0,
          // Optional fields that may not exist in all CSV formats
          conversoesMeta: parseFloat(record['Conversões Meta']) || undefined,
          conversoesAtual: parseFloat(record['Conversões Atual']) || undefined,
          conversoesPercentual: parseFloat(record['Conversões %']) || undefined,
          upaMeta: parseFloat(record['UPA Meta']) || undefined,
          upaAtual: parseFloat(record['UPA Atual']) || undefined,
          upaPercentual: parseFloat(record['UPA %']) || undefined,
        };

        // Basic validation
        if (!reportData.playerId) {
          errors.push({
            row: i + 1,
            field: 'Player ID',
            message: 'Player ID é obrigatório',
          });
        }

        data.push(reportData);
      }

      return {
        isValid: errors.length === 0,
        data,
        errors,
        summary: ReportProcessingService.generateSummary({
          isValid: errors.length === 0,
          data,
          errors,
        }),
      };
    } catch (error) {
      return {
        isValid: false,
        data: [],
        errors: [
          {
            row: 0,
            field: 'file',
            message: `Erro ao processar arquivo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
          },
        ],
      };
    }
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
