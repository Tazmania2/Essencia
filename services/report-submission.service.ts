import { ParseResult } from './report-processing.service';
import { ReportComparisonService } from './report-comparison.service';
import { ActionLogService, BatchSubmissionResult } from './action-log.service';
import { FunifierDatabaseService } from './funifier-database.service';
import { funifierAuthService } from './funifier-auth.service';
import { secureLogger } from '../utils/logger';
import { EnhancedReportRecord } from '../types';

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

  async submitReport(
    parseResult: ParseResult,
    file: File,
    cycleNumber?: number
  ): Promise<SubmissionResult> {
    const submissionId = `sub_${Date.now()}`;
    const cycle = cycleNumber || 1;
    const currentTime = Date.now();

    try {
      secureLogger.log('🚀 Starting report submission process', {
        fileName: file.name,
        recordCount: parseResult.data.length,
        cycleNumber: cycle,
      });

      // Step 1: Get authentication token
      const token = await funifierAuthService.getAccessToken();
      if (!token) {
        throw new Error('Failed to get authentication token');
      }

      // Step 2: Check if this is a new cycle and compare with existing data
      secureLogger.log('📊 Checking cycle and comparing report data with stored data...');
      const isNewCycle = await this.checkIfNewCycle(cycle, token);
      
      if (isNewCycle) {
        secureLogger.log('🆕 New cycle detected - treating all data as new');
      }
      
      const comparisonReport = await ReportComparisonService.compareReportData(
        parseResult.data,
        token,
        cycle,
        isNewCycle
      );

      // Step 3: Generate action logs from differences
      secureLogger.log('📝 Generating action logs from differences...');
      const actionLogs = ActionLogService.generateActionLogs(
        comparisonReport.results
      );

      let actionLogResult: BatchSubmissionResult | null = null;

      // Step 4: Submit action logs if there are any
      if (actionLogs.length > 0) {
        secureLogger.log(`🔄 Submitting ${actionLogs.length} action logs...`);
        actionLogResult = await ActionLogService.submitActionLogsBatch(
          actionLogs,
          token
        );
      }

      // Step 5: Upload file and get URL FIRST (this is critical for the original workflow)
      secureLogger.log('📤 Uploading file to Funifier...');
      const uploadUrl = await this.uploadFileToFunifier(file, token);
      secureLogger.log('✅ File uploaded successfully', { uploadUrl });

      // Step 6: Store report data in database with ORIGINAL structure INCLUDING CYCLE
      secureLogger.log('💾 Storing report data in database...');
      const reportRecords: EnhancedReportRecord[] = parseResult.data.map(
        (record) => ({
          _id: `${record.playerId}_${cycle}_${new Date().toISOString().split('T')[0]}`,
          playerId: record.playerId,
          // Store the ORIGINAL percentage fields that were working
          reaisPorAtivoPercentual: record.reaisPorAtivoPercentual || 0,
          diaDociclo: record.diaDociclo,
          totalDiasCiclo: record.totalDiasCiclo,
          faturamentoPercentual: record.faturamentoPercentual || 0,
          atividadePercentual: record.atividadePercentual || 0,
          multimarcasPorAtivoPercentual:
            record.multimarcasPorAtivoPercentual || 0,
          // Add the CRITICAL missing fields INCLUDING CYCLE
          cycleNumber: cycle,
          uploadUrl: uploadUrl,
          status: 'REGISTERED',
          time: currentTime,
          reportDate: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
      );

      await this.databaseService.bulkInsertEnhancedReportData(reportRecords);

      // Prepare differences for response
      const differences: DifferenceRecord[] = comparisonReport.results.flatMap(
        (result) =>
          result.differences.map((diff) => ({
            playerId: diff.playerId,
            metric: diff.metric,
            difference: diff.difference,
            isFirstEntry: !comparisonReport.results.some(
              (r) => r.playerId === diff.playerId
            ),
          }))
      );

      const successMessage = [
        `Relatório enviado com sucesso!`,
        `${parseResult.data.length} registros processados para o Ciclo ${cycle}`,
        actionLogResult
          ? `${actionLogResult.successfulSubmissions} action logs criados`
          : 'Nenhum action log necessário',
        comparisonReport.playersWithChanges > 0
          ? `${comparisonReport.playersWithChanges} jogadores com alterações`
          : 'Nenhuma alteração detectada',
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
        uploadUrl,
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
        errors: [error instanceof Error ? error.message : 'Erro desconhecido'],
      };
    }
  }

  private async checkIfNewCycle(cycleNumber: number, token: string): Promise<boolean> {
    try {
      // Check if there are any records for this cycle number
      const existingRecords = await this.databaseService.getReportData({
        cycleNumber: cycleNumber
      });
      
      // If no records exist for this cycle, it's a new cycle
      return existingRecords.length === 0;
    } catch (error) {
      secureLogger.warn('⚠️ Could not check for existing cycle data, treating as new cycle', error);
      // If we can't check, assume it's a new cycle to be safe
      return true;
    }
  }

  private async uploadFileToFunifier(
    file: File,
    token: string
  ): Promise<string> {
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);

      // Upload to Funifier reports endpoint
      const response = await fetch(
        `${process.env.FUNIFIER_BASE_URL || 'https://service2.funifier.com/v3'}/reports/upload`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(
          `Upload failed with status ${response.status}: ${response.statusText}`
        );
      }

      const result = await response.json();

      if (!result.uploadUrl) {
        throw new Error('Upload response missing uploadUrl');
      }

      return result.uploadUrl;
    } catch (error) {
      secureLogger.error('❌ File upload to Funifier failed', error);
      throw new Error(
        `File upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}

export const reportSubmissionService = ReportSubmissionService.getInstance();
