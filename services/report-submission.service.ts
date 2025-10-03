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
    cycleNumber?: number,
    forceFirstUpload?: boolean
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
      const isNewCycle = forceFirstUpload || await this.checkIfNewCycle(cycle, token);
      
      if (forceFirstUpload) {
        secureLogger.log('🔄 Force first upload enabled - treating all data as new (reset mode)');
      } else if (isNewCycle) {
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

      // Step 6: Store report data in database with COMPLETE data INCLUDING targets and current values
      secureLogger.log('💾 Storing report data in database...');
      const reportRecords: EnhancedReportRecord[] = parseResult.data.map(
        (record, index) => ({
          _id: `${record.playerId}_${cycle}_${new Date().toISOString().split('T')[0]}_${index}`,
          playerId: record.playerId,
          // Store percentage fields
          reaisPorAtivoPercentual: record.reaisPorAtivoPercentual || 0,
          faturamentoPercentual: record.faturamentoPercentual || 0,
          atividadePercentual: record.atividadePercentual || 0,
          multimarcasPorAtivoPercentual: record.multimarcasPorAtivoPercentual || 0,
          // Store target (Meta) values
          faturamentoMeta: record.faturamentoMeta || 0,
          reaisPorAtivoMeta: record.reaisPorAtivoMeta || 0,
          multimarcasPorAtivoMeta: record.multimarcasPorAtivoMeta || 0,
          atividadeMeta: record.atividadeMeta || 0,
          // Store current (Atual) values
          faturamentoAtual: record.faturamentoAtual || 0,
          reaisPorAtivoAtual: record.reaisPorAtivoAtual || 0,
          multimarcasPorAtivoAtual: record.multimarcasPorAtivoAtual || 0,
          atividadeAtual: record.atividadeAtual || 0,
          // Store cycle information
          diaDociclo: record.diaDociclo,
          totalDiasCiclo: record.totalDiasCiclo,
          cycleNumber: cycle,
          // Store optional new metrics if present
          conversoesMeta: record.conversoesMeta,
          conversoesAtual: record.conversoesAtual,
          conversoesPercentual: record.conversoesPercentual,
          upaMeta: record.upaMeta,
          upaAtual: record.upaAtual,
          upaPercentual: record.upaPercentual,
          // System fields
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
      // Use aggregation to efficiently check if there are any records for this cycle
      const pipeline = [
        {
          $match: { 
            cycleNumber: cycleNumber,
            status: "REGISTERED"
          }
        },
        {
          $limit: 1 // We only need to know if at least one record exists
        },
        {
          $project: { _id: 1 } // Only return the _id field to minimize data transfer
        }
      ];
      
      secureLogger.log(`🔍 [CHECK_CYCLE] Checking for existing cycle ${cycleNumber} using aggregation`);
      secureLogger.log(`🔍 [CHECK_CYCLE] Pipeline:`, JSON.stringify(pipeline, null, 2));
      const existingRecords = await this.databaseService.aggregateReportData(pipeline);
      
      const isNewCycle = existingRecords.length === 0;
      secureLogger.log(`📊 Cycle ${cycleNumber} check result: ${isNewCycle ? 'NEW CYCLE' : 'EXISTING CYCLE'} (${existingRecords.length} records found)`);
      
      return isNewCycle;
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
      // Create FormData for file upload using CORRECT Funifier API
      const formData = new FormData();
      formData.append('file', file);
      // REQUIRED extra field as JSON string
      formData.append('extra', JSON.stringify({
        session: 'reports',
        name: `report_${Date.now()}`,
        cycleNumber: 'cycle_data'
      }));

      // Upload to CORRECT Funifier upload endpoint
      const response = await fetch(
        `${process.env.FUNIFIER_BASE_URL || 'https://service2.funifier.com/v3'}/upload/file`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            // Don't set Content-Type - let browser set it with boundary for multipart
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

      // Check for correct response structure
      if (!result.uploads || !result.uploads[0] || !result.uploads[0].url) {
        throw new Error('Upload response missing url in uploads array');
      }

      return result.uploads[0].url;
    } catch (error) {
      secureLogger.error('❌ File upload to Funifier failed', error);
      throw new Error(
        `File upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}

export const reportSubmissionService = ReportSubmissionService.getInstance();
