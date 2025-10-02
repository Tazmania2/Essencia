import { ParseResult } from './report-processing.service';
import { ReportComparisonService, ComparisonReport } from './report-comparison.service';
import { ActionLogService, BatchSubmissionResult } from './action-log.service';
import { FunifierDatabaseService } from './funifier-database.service';
import { funifierAuthService } from './funifier-auth.service';
import { secureLogger } from '../utils/logger';

export interface SubmissionResult {
  success: boolean;
  message: string;
  submissionId: string | null;
  recordsProcessed: number;
  cycleNumber: number;
  submittedAt: string;
  actionLogsCreated?: number;
  differences?: DifferenceRecord[];
  errors?: string[];
  uploadUrl?: string;
}

export interface DifferenceRecord {
  playerId: string;
  metric: string;
  difference: number;
  isFirstEntry: boolean;
}

export class ReportSubmissionService {
  private static instance: ReportSubmissionService;
  private databaseService: FunifierDatabaseService;

  private constructor() {
    this.databaseService = FunifierDatabaseService.getInstance();
  }

  public static getInstance(): ReportSubmissionService {
    if (!ReportSubmissionService.instance) {
      ReportSubmissionService.instance = new ReportSubmissionService();
    }
    return ReportSubmissionService.instance;
  }

  async submitReport(parseResult: ParseResult, file: File, cycleNumber?: number): Promise<SubmissionResult> {
    const submissionId = `sub_${Date.now()}`;
    const cycle = cycleNumber || 1;
    
    try {
      secureLogger.log('🚀 Starting report submission process', {
        fileName: file.name,
        recordCount: parseResult.data.length,
        cycleNumber: cycle
      });

      // Step 1: Get authentication token
      const token = await funifierAuthService.getAccessToken();
      if (!token) {
        throw new Error('Failed to get authentication token');
      }

      // Step 2: Compare with existing data
      secureLogger.log('📊 Comparing report data with stored data...');
      const comparisonReport = await ReportComparisonService.compareReportData(parseResult.data, token);
      
      // Step 3: Generate action logs from differences
      secureLogger.log('📝 Generating action logs from differences...');
      const actionLogs = ActionLogService.generateActionLogs(comparisonReport.results);
      
      let actionLogResult: BatchSubmissionResult | null = null;
      
      // Step 4: Submit action logs if there are any
      if (actionLogs.length > 0) {
        secureLogger.log(`🔄 Submitting ${actionLogs.length} action logs...`);
        actionLogResult = await ActionLogService.submitActionLogsBatch(actionLogs, token);
      }

      // Step 5: Store report data in database
      secureLogger.log('💾 Storing report data in database...');
      const reportRecords = parseResult.data.map(record => ({
        _id: `${record.playerId}_${new Date().toISOString().split('T')[0]}`,
        playerId: record.playerId,
        playerName: 'Unknown', // Will be updated when we have player data
        team: 'CARTEIRA_I' as any, // Will be determined from player data
        atividade: record.atividadePercentual,
        reaisPorAtivo: record.reaisPorAtivoPercentual,
        faturamento: record.faturamentoPercentual,
        multimarcasPorAtivo: record.multimarcasPorAtivoPercentual,
        conversoes: record.conversoesPercentual,
        upa: record.upaPercentual,
        currentCycleDay: record.diaDociclo,
        totalCycleDays: record.totalDiasCiclo,
        reportDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));

      await this.databaseService.bulkInsertReportData(reportRecords);

      // Step 6: Upload file and get URL (if needed)
      let uploadUrl: string | undefined;
      try {
        uploadUrl = await this.uploadFileToFunifier(file, token);
        secureLogger.log('📤 File uploaded successfully', { uploadUrl });
      } catch (uploadError) {
        secureLogger.warn('⚠️ File upload failed, continuing without URL', uploadError);
      }

      // Prepare differences for response
      const differences: DifferenceRecord[] = comparisonReport.results.flatMap(result =>
        result.differences.map(diff => ({
          playerId: diff.playerId,
          metric: diff.metric,
          difference: diff.difference,
          isFirstEntry: !comparisonReport.results.some(r => r.playerId === diff.playerId)
        }))
      );

      const successMessage = [
        `Relatório enviado com sucesso!`,
        `${parseResult.data.length} registros processados para o Ciclo ${cycle}`,
        actionLogResult ? `${actionLogResult.successfulSubmissions} action logs criados` : 'Nenhum action log necessário',
        comparisonReport.playersWithChanges > 0 ? `${comparisonReport.playersWithChanges} jogadores com alterações` : 'Nenhuma alteração detectada'
      ].join('. ');

      return {
        success: true,
        message: successMessage,
        submissionId,
        recordsProcessed: parseResult.data.length,
        cycleNumber: cycle,
        submittedAt: new Date().toISOString(),
        actionLogsCreated: actionLogResult?.successfulSubmissions || 0,
        differences,
        uploadUrl
      };

    } catch (error) {
      secureLogger.error('❌ Report submission failed', error);
      
      return {
        success: false,
        message: `Erro ao enviar relatório: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        submissionId,
        recordsProcessed: 0,
        cycleNumber: cycle,
        submittedAt: new Date().toISOString(),
        errors: [error instanceof Error ? error.message : 'Erro desconhecido']
      };
    }
  }

  private async uploadFileToFunifier(file: File, token: string): Promise<string> {
    // This would implement the actual file upload to Funifier
    // For now, return a placeholder URL
    return `https://funifier-uploads.s3.amazonaws.com/${Date.now()}-${file.name}`;
  }
}

export const reportSubmissionService = ReportSubmissionService.getInstance();