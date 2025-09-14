import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export interface ReportData {
  playerId: string;
  diaDociclo: number;
  totalDiasCiclo: number;
  faturamentoMeta: number;
  faturamentoAtual: number;
  faturamentoPercentual: number;
  reaisPorAtivoMeta: number;
  reaisPorAtivoAtual: number;
  reaisPorAtivoPercentual: number;
  multimarcasPorAtivoMeta: number;
  multimarcasPorAtivoAtual: number;
  multimarcasPorAtivoPercentual: number;
  atividadeMeta: number;
  atividadeAtual: number;
  atividadePercentual: number;
  reportDate: string;
}

export interface ValidationError {
  row: number;
  field: string;
  message: string;
  value?: any;
}

export interface ParseResult {
  data: ReportData[];
  errors: ValidationError[];
  isValid: boolean;
}

export interface ProcessingResult {
  processed: number;
  changes: number;
  actionLogsSubmitted: number;
  errors: string[];
}

export class ReportProcessingService {
  private static instance: ReportProcessingService;

  private static readonly REQUIRED_FIELDS = [
    'playerId',
    'diaDociclo',
    'totalDiasCiclo',
    'faturamentoMeta',
    'faturamentoAtual',
    'faturamentoPercentual',
    'reaisPorAtivoMeta',
    'reaisPorAtivoAtual',
    'reaisPorAtivoPercentual',
    'multimarcasPorAtivoMeta',
    'multimarcasPorAtivoAtual',
    'multimarcasPorAtivoPercentual',
    'atividadeMeta',
    'atividadeAtual',
    'atividadePercentual',
  ];

  private static readonly OPTIONAL_FIELDS: string[] = [];

  private static readonly VALID_TEAMS = [
    'CARTEIRA_I',
    'CARTEIRA_II',
    'CARTEIRA_III',
    'CARTEIRA_IV',
  ];

  private constructor() {}

  public static getInstance(): ReportProcessingService {
    if (!ReportProcessingService.instance) {
      ReportProcessingService.instance = new ReportProcessingService();
    }
    return ReportProcessingService.instance;
  }

  /**
   * Static method for validating file format
   */
  public static validateFileFormat(file: File): string | null {
    const instance = ReportProcessingService.getInstance();
    return instance.validateFileFormat(file);
  }

  /**
   * Static method for parsing files
   */
  public static async parseFile(file: File): Promise<ParseResult> {
    const instance = ReportProcessingService.getInstance();
    return instance.parseFile(file);
  }

  /**
   * Static method for generating summary
   */
  public static generateSummary(parseResult: ParseResult): string {
    const instance = ReportProcessingService.getInstance();
    return instance.generateSummary(parseResult);
  }

  /**
   * Process report file (parse and upload)
   */
  public async processReportFile(
    file: File,
    token: string
  ): Promise<ProcessingResult> {
    try {
      // Parse the file first
      const parseResult = await this.parseFile(file);

      if (!parseResult.isValid) {
        return {
          processed: 0,
          changes: 0,
          actionLogsSubmitted: 0,
          errors: parseResult.errors.map((e) => e.message),
        };
      }

      // Process the parsed data
      return await this.processUploadedReport(parseResult.data);
    } catch (error) {
      return {
        processed: 0,
        changes: 0,
        actionLogsSubmitted: 0,
        errors: [
          error instanceof Error ? error.message : 'Unknown error occurred',
        ],
      };
    }
  }

  /**
   * Process uploaded report data and sync with Funifier
   */
  public async processUploadedReport(
    reportData: ReportData[],
    token?: string
  ): Promise<ProcessingResult> {
    if (!reportData || reportData.length === 0) {
      return {
        processed: 0,
        changes: 0,
        actionLogsSubmitted: 0,
        errors: [],
      };
    }

    let processed = 0;
    let changes = 0;
    let actionLogsSubmitted = 0;
    const errors: string[] = [];

    try {
      // Import action log service dynamically to avoid circular dependencies
      const { ActionLogService } = await import('./action-log.service');
      const { funifierDatabaseService } = await import(
        './funifier-database.service'
      );

      for (const record of reportData) {
        try {
          processed++;

          // Store the report data in the database
          const essenciaRecord = {
            _id: `${record.playerId}_${new Date().toISOString().split('T')[0]}`,
            playerId: record.playerId,
            playerName: '', // Will be filled by database service
            team: 'CARTEIRA_I' as any, // Will be determined by database service
            atividade: record.atividadePercentual,
            reaisPorAtivo: record.reaisPorAtivoPercentual,
            faturamento: record.faturamentoPercentual,
            multimarcasPorAtivo: record.multimarcasPorAtivoPercentual,
            currentCycleDay: record.diaDociclo,
            totalCycleDays: record.totalDiasCiclo,
            reportDate: record.reportDate.split('T')[0],
            createdAt: record.reportDate,
            updatedAt: record.reportDate,
          };

          // Store in database (this will handle team detection and player name lookup)
          await funifierDatabaseService.insertReportRecord(essenciaRecord);
          changes++;

          // Create action logs for each metric if token is provided
          if (token) {
            const actionLogs = this.createActionLogsFromReport(record);

            if (actionLogs.length > 0) {
              const batchResult = await ActionLogService.submitActionLogsBatch(
                actionLogs,
                token
              );
              actionLogsSubmitted += batchResult.successfulSubmissions;

              if (batchResult.failedSubmissions > 0) {
                errors.push(
                  `Failed to submit ${batchResult.failedSubmissions} action logs for player ${record.playerId}`
                );
              }
            }
          }
        } catch (error) {
          errors.push(
            `Error processing record for player ${record.playerId}: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }

      return {
        processed,
        changes,
        actionLogsSubmitted,
        errors,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create action logs from report data
   */
  private createActionLogsFromReport(record: ReportData): any[] {
    const actionLogs: any[] = [];
    const timestamp = new Date().toISOString();

    // Create action logs for each metric using the percentage values
    const metrics = [
      {
        attribute: 'atividade',
        value: record.atividadePercentual,
        challengeType: 'atividade_challenge',
      },
      {
        attribute: 'reaisPorAtivo',
        value: record.reaisPorAtivoPercentual,
        challengeType: 'reais_por_ativo_challenge',
      },
      {
        attribute: 'faturamento',
        value: record.faturamentoPercentual,
        challengeType: 'faturamento_challenge',
      },
      {
        attribute: 'multimarcasPorAtivo',
        value: record.multimarcasPorAtivoPercentual,
        challengeType: 'multimarcas_por_ativo_challenge',
      },
    ];

    metrics.forEach((metric) => {
      if (metric.value !== undefined && metric.value !== null) {
        actionLogs.push({
          playerId: record.playerId,
          challengeType: metric.challengeType,
          attribute: metric.attribute,
          value: metric.value,
          timestamp,
          metadata: {
            cycleDay: record.diaDociclo,
            totalCycleDays: record.totalDiasCiclo,
            reportDate: record.reportDate,
          },
        });
      }
    });

    return actionLogs;
  }

  /**
   * Parse uploaded file and validate data structure
   */
  public async parseFile(file: File): Promise<ParseResult> {
    try {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();

      let rawData: any[];

      if (fileExtension === 'csv') {
        rawData = await this.parseCSV(file);
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        rawData = await this.parseExcel(file);
      } else {
        throw new Error('Formato de arquivo não suportado');
      }

      return this.validateAndTransformData(rawData);
    } catch (error) {
      return {
        data: [],
        errors: [
          {
            row: 0,
            field: 'file',
            message:
              error instanceof Error
                ? error.message
                : 'Erro ao processar arquivo',
          },
        ],
        isValid: false,
      };
    }
  }

  /**
   * Parse CSV file using PapaParse
   */
  private parseCSV(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true, // Use first row as headers
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            reject(
              new Error(`Erro ao processar CSV: ${results.errors[0].message}`)
            );
          } else {
            // Convert the parsed data to our expected format
            // PapaParse with header:true returns objects with header names as keys
            const rawData = results.data as any[];
            
            const mappedData = rawData.map((row: any) => {
              // Get values by position since headers might vary
              const values = Object.values(row);
              
              return {
                playerId: String(values[0] || ''),
                diaDociclo: String(values[1] || ''),
                totalDiasCiclo: String(values[2] || ''),
                faturamentoMeta: String(values[3] || ''),
                faturamentoAtual: String(values[4] || ''),
                faturamentoPercentual: String(values[5] || ''),
                reaisPorAtivoMeta: String(values[6] || ''),
                reaisPorAtivoAtual: String(values[7] || ''),
                reaisPorAtivoPercentual: String(values[8] || ''),
                multimarcasPorAtivoMeta: String(values[9] || ''),
                multimarcasPorAtivoAtual: String(values[10] || ''),
                multimarcasPorAtivoPercentual: String(values[11] || ''),
                atividadeMeta: String(values[12] || ''),
                atividadeAtual: String(values[13] || ''),
                atividadePercentual: String(values[14] || '')
              };
            });

            resolve(mappedData);
          }
        },
        error: (error) => {
          reject(new Error(`Erro ao ler CSV: ${error.message}`));
        },
      });
    });
  }

  /**
   * Parse Excel file using XLSX
   */
  private async parseExcel(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });

          // Use first sheet
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];

          // Convert to JSON with header normalization
          const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            defval: '',
          }) as any[][];

          if (jsonData.length === 0) {
            reject(new Error('Planilha vazia'));
            return;
          }

          // Map headers by position to expected field names
          const fieldMapping = [
            'playerId', // 0 - Player ID (Funifier ID)
            'diaDociclo', // 1 - Dia do Ciclo
            'totalDiasCiclo', // 2 - Total Dias Ciclo
            'faturamentoMeta', // 3 - Faturamento Meta
            'faturamentoAtual', // 4 - Faturamento Atual
            'faturamentoPercentual', // 5 - Faturamento %
            'reaisPorAtivoMeta', // 6 - Reais por Ativo Meta
            'reaisPorAtivoAtual', // 7 - Reais por Ativo Atual
            'reaisPorAtivoPercentual', // 8 - Reais por Ativo %
            'multimarcasPorAtivoMeta', // 9 - Multimarcas por Ativo Meta
            'multimarcasPorAtivoAtual', // 10 - Multimarcas por Ativo Atual
            'multimarcasPorAtivoPercentual', // 11 - Multimarcas por Ativo %
            'atividadeMeta', // 12 - Atividade Meta
            'atividadeAtual', // 13 - Atividade Atual
            'atividadePercentual', // 14 - Atividade %
          ];

          const headers = fieldMapping;

          // Convert rows to objects
          const rows = jsonData.slice(1).map((row) => {
            const obj: any = {};
            headers.forEach((header, index) => {
              obj[header] = row[index] || '';
            });
            return obj;
          });

          resolve(rows);
        } catch (error) {
          reject(
            new Error(
              `Erro ao processar Excel: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
            )
          );
        }
      };

      reader.onerror = () => {
        reject(new Error('Erro ao ler arquivo'));
      };

      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Validate and transform raw data to ReportData format
   */
  private validateAndTransformData(rawData: any[]): ParseResult {
    const errors: ValidationError[] = [];
    const validData: ReportData[] = [];

    if (!Array.isArray(rawData) || rawData.length === 0) {
      errors.push({
        row: 0,
        field: 'data',
        message: 'Arquivo não contém dados válidos',
      });
      return { data: [], errors, isValid: false };
    }

    rawData.forEach((row, index) => {
      const rowNumber = index + 1;
      const rowErrors: ValidationError[] = [];

      // Check required fields
      ReportProcessingService.REQUIRED_FIELDS.forEach((field) => {
        if (!row[field] || row[field].toString().trim() === '') {
          rowErrors.push({
            row: rowNumber,
            field,
            message: `Campo obrigatório '${field}' está vazio`,
            value: row[field],
          });
        }
      });

      // Validate numeric fields (all fields except playerId are numeric)
      ReportProcessingService.REQUIRED_FIELDS.slice(1).forEach((field) => {
        if (row[field] !== undefined && row[field] !== '') {
          const numValue = parseFloat(row[field]);
          if (isNaN(numValue)) {
            rowErrors.push({
              row: rowNumber,
              field,
              message: `Campo '${field}' deve ser um número`,
              value: row[field],
            });
          } else if (numValue < 0) {
            rowErrors.push({
              row: rowNumber,
              field,
              message: `Campo '${field}' não pode ser negativo`,
              value: row[field],
            });
          }
        }
      });

      // If no errors, add to valid data
      if (rowErrors.length === 0) {
        const reportData: ReportData = {
          playerId: row.playerId.toString().trim(),
          diaDociclo: parseFloat(row.diaDociclo),
          totalDiasCiclo: parseFloat(row.totalDiasCiclo),
          faturamentoMeta: parseFloat(row.faturamentoMeta),
          faturamentoAtual: parseFloat(row.faturamentoAtual),
          faturamentoPercentual: parseFloat(row.faturamentoPercentual),
          reaisPorAtivoMeta: parseFloat(row.reaisPorAtivoMeta),
          reaisPorAtivoAtual: parseFloat(row.reaisPorAtivoAtual),
          reaisPorAtivoPercentual: parseFloat(row.reaisPorAtivoPercentual),
          multimarcasPorAtivoMeta: parseFloat(row.multimarcasPorAtivoMeta),
          multimarcasPorAtivoAtual: parseFloat(row.multimarcasPorAtivoAtual),
          multimarcasPorAtivoPercentual: parseFloat(
            row.multimarcasPorAtivoPercentual
          ),
          atividadeMeta: parseFloat(row.atividadeMeta),
          atividadeAtual: parseFloat(row.atividadeAtual),
          atividadePercentual: parseFloat(row.atividadePercentual),
          reportDate: new Date().toISOString(),
        };

        validData.push(reportData);
      } else {
        errors.push(...rowErrors);
      }
    });

    return {
      data: validData,
      errors,
      isValid: errors.length === 0,
    };
  }

  /**
   * Validate file format and size before processing
   */
  public validateFileFormat(file: File): string | null {
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];
    const allowedExtensions = ['.csv', '.xls', '.xlsx'];

    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!allowedExtensions.includes(fileExtension)) {
      return `Formato de arquivo não suportado. Aceitos: ${allowedExtensions.join(', ')}`;
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return 'Arquivo muito grande. Tamanho máximo: 10MB';
    }

    return null;
  }

  /**
   * Generate summary of parsed data
   */
  public generateSummary(parseResult: ParseResult): string {
    const { data, errors } = parseResult;

    let summary = `Processamento concluído:\n`;
    summary += `• ${data.length} registros válidos\n`;

    if (errors.length > 0) {
      summary += `• ${errors.length} erros encontrados\n`;
    }

    // Show cycle information
    if (data.length > 0) {
      const firstRecord = data[0];
      summary += `\nInformações do ciclo:\n`;
      summary += `• Dia atual: ${firstRecord.diaDociclo}\n`;
      summary += `• Total de dias: ${firstRecord.totalDiasCiclo}\n`;
    }

    return summary;
  }
}
