import axios from 'axios';
import { ReportData, ParseResult } from './report-processing.service';

// Basic auth token for Funifier API
const FUNIFIER_AUTH_TOKEN = 'Basic NjhhNjczN2E2ZTFkMGUyMTk2ZGIxYjFlOjY3ZWM0ZTRhMjMyN2Y3NGYzYTJmOTZmNQ==';
const FUNIFIER_BASE_URL = 'https://service2.funifier.com/v3';

export interface ReportRecord {
  _id?: string;
  playerId: string;
  diaDociclo: number;
  totalDiasCiclo: number;
  faturamentoPercentual: number;
  reaisPorAtivoPercentual: number;
  multimarcasPorAtivoPercentual: number;
  atividadePercentual: number;
  reportDate: string;
  uploadUrl?: string;
  status: 'PENDING' | 'REGISTERED';
  createdAt: string;
  updatedAt: string;
}

export interface ActionLogEntry {
  actionId: string;
  userId: string;
  attributes: {
    porcentagem_da_meta: number;
  };
}

export interface ComparisonDifference {
  playerId: string;
  metric: string;
  oldValue: number;
  newValue: number;
  difference: number;
  isFirstEntry: boolean;
}

export interface SubmissionResult {
  success: boolean;
  recordsProcessed: number;
  actionLogsCreated: number;
  differences: ComparisonDifference[];
  uploadUrl?: string;
  errors: string[];
  summary: string;
}

export class ReportSubmissionService {
  private static instance: ReportSubmissionService;

  private constructor() {}

  public static getInstance(): ReportSubmissionService {
    if (!ReportSubmissionService.instance) {
      ReportSubmissionService.instance = new ReportSubmissionService();
    }
    return ReportSubmissionService.instance;
  }

  /**
   * Complete submission workflow:
   * 1. Store parsed data in report__c collection
   * 2. Compare with previous data
   * 3. Create action logs based on differences
   * 4. Upload CSV file
   * 5. Update records with file URL
   */
  public async submitReport(
    parseResult: ParseResult,
    csvFile: File
  ): Promise<SubmissionResult> {
    const result: SubmissionResult = {
      success: false,
      recordsProcessed: 0,
      actionLogsCreated: 0,
      differences: [],
      errors: [],
      summary: ''
    };

    try {
      // Step 1: Store parsed data in report__c collection
      console.log('Step 1: Storing report data...');
      const reportRecords = await this.storeReportData(parseResult.data);
      result.recordsProcessed = reportRecords.length;

      // Step 2: Compare with previous data and create action logs
      console.log('Step 2: Comparing data and creating action logs...');
      const { differences, actionLogsCreated } = await this.processDataComparison(reportRecords);
      result.differences = differences;
      result.actionLogsCreated = actionLogsCreated;

      // Step 3: Upload CSV file
      console.log('Step 3: Uploading CSV file...');
      const uploadUrl = await this.uploadCsvFile(csvFile);
      result.uploadUrl = uploadUrl;

      // Step 4: Update records with file URL and mark as REGISTERED
      console.log('Step 4: Updating records with file URL...');
      await this.updateRecordsWithFileUrl(reportRecords, uploadUrl);

      result.success = true;
      result.summary = this.generateSummary(result);

    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : 'Unknown error occurred');
      result.summary = `Erro durante o processamento: ${result.errors.join(', ')}`;
    }

    return result;
  }

  /**
   * Step 1: Store report data in report__c collection
   */
  private async storeReportData(reportData: ReportData[]): Promise<ReportRecord[]> {
    const reportRecords: ReportRecord[] = [];

    // Insert records one by one to get their _id values
    for (const data of reportData) {
      const recordToInsert = {
        playerId: data.playerId,
        diaDociclo: data.diaDociclo,
        totalDiasCiclo: data.totalDiasCiclo,
        faturamentoPercentual: data.faturamentoPercentual,
        reaisPorAtivoPercentual: data.reaisPorAtivoPercentual,
        multimarcasPorAtivoPercentual: data.multimarcasPorAtivoPercentual,
        atividadePercentual: data.atividadePercentual,
        reportDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Insert individual record to get _id
      const response = await axios.post(
        `${FUNIFIER_BASE_URL}/database/report__c`,
        recordToInsert,
        {
          headers: {
            'Authorization': FUNIFIER_AUTH_TOKEN,
            'Content-Type': 'application/json'
          }
        }
      );

      // Add the returned record with _id to our array
      reportRecords.push(response.data);
    }

    console.log('Stored report data:', reportRecords.length, 'records');
    return reportRecords;
  }

  /**
   * Step 2: Compare with previous data and create action logs
   */
  private async processDataComparison(reportRecords: ReportRecord[]): Promise<{
    differences: ComparisonDifference[];
    actionLogsCreated: number;
  }> {
    const differences: ComparisonDifference[] = [];
    const actionLogs: ActionLogEntry[] = [];

    for (const record of reportRecords) {
      // Get previous data for this player
      const previousData = await this.getPreviousPlayerData(record.playerId, record.reportDate);
      
      const metrics = [
        { key: 'faturamentoPercentual', actionId: 'faturamento' },
        { key: 'reaisPorAtivoPercentual', actionId: 'reais_por_ativo' },
        { key: 'multimarcasPorAtivoPercentual', actionId: 'multimarcas_por_ativo' },
        { key: 'atividadePercentual', actionId: 'atividade' }
      ];

      for (const metric of metrics) {
        const newValue = (record as any)[metric.key];
        const oldValue = previousData ? (previousData as any)[metric.key] || 0 : 0;
        const isFirstEntry = !previousData;

        let attributeValue: number;
        
        if (isFirstEntry) {
          // First entry: use the value directly from the report
          attributeValue = newValue;
        } else {
          // Subsequent entries: use the difference
          attributeValue = newValue - oldValue;
        }

        // Only create action log if there's a meaningful change or it's the first entry
        if (isFirstEntry || Math.abs(attributeValue) > 0.01) {
          actionLogs.push({
            actionId: metric.actionId,
            userId: record.playerId,
            attributes: {
              porcentagem_da_meta: attributeValue
            }
          });

          differences.push({
            playerId: record.playerId,
            metric: metric.key,
            oldValue,
            newValue,
            difference: attributeValue,
            isFirstEntry
          });
        }
      }
    }

    // Submit action logs in bulk
    let actionLogsCreated = 0;
    if (actionLogs.length > 0) {
      const response = await axios.post(
        `${FUNIFIER_BASE_URL}/action/log/bulk`,
        actionLogs,
        {
          headers: {
            'Authorization': FUNIFIER_AUTH_TOKEN,
            'Content-Type': 'application/json'
          }
        }
      );
      
      actionLogsCreated = response.data.total_registered || actionLogs.length;
      console.log('Created action logs:', response.data);
    }

    return { differences, actionLogsCreated };
  }

  /**
   * Get previous data for a player (excluding current report date)
   */
  private async getPreviousPlayerData(playerId: string, currentReportDate: string): Promise<ReportRecord | null> {
    try {
      // Use aggregation to get the most recent record for this player before the current date
      const pipeline = [
        {
          $match: {
            playerId: playerId,
            reportDate: { $lt: currentReportDate }
          }
        },
        {
          $sort: { reportDate: -1, createdAt: -1 }
        },
        {
          $limit: 1
        }
      ];

      const response = await axios.post(
        `${FUNIFIER_BASE_URL}/database/report__c/aggregate?strict=true`,
        pipeline,
        {
          headers: {
            'Authorization': FUNIFIER_AUTH_TOKEN,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.length > 0 ? response.data[0] : null;
    } catch (error) {
      console.warn(`Could not fetch previous data for player ${playerId}:`, error);
      return null;
    }
  }

  /**
   * Step 3: Upload CSV file
   */
  private async uploadCsvFile(csvFile: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', csvFile);
    formData.append('extra', JSON.stringify({
      session: 'reports',
      description: 'CSV report upload',
      uploadDate: new Date().toISOString()
    }));

    const response = await axios.post(
      `${FUNIFIER_BASE_URL}/upload/file`,
      formData,
      {
        headers: {
          'Authorization': FUNIFIER_AUTH_TOKEN,
          'Content-Type': 'multipart/form-data'
        }
      }
    );

    const uploadUrl = response.data.uploads[0]?.url;
    if (!uploadUrl) {
      throw new Error('Failed to get upload URL from response');
    }

    console.log('Uploaded CSV file:', uploadUrl);
    return uploadUrl;
  }

  /**
   * Step 4: Update records with file URL and mark as REGISTERED
   */
  private async updateRecordsWithFileUrl(reportRecords: ReportRecord[], uploadUrl: string): Promise<void> {
    // Update each record individually using PUT with _id
    for (const record of reportRecords) {
      if (!record._id) {
        throw new Error(`Record for player ${record.playerId} is missing _id`);
      }

      const updatedRecord = {
        ...record,
        uploadUrl,
        status: 'REGISTERED' as const,
        updatedAt: new Date().toISOString()
      };

      // Use PUT to update the specific record by _id
      await axios.put(
        `${FUNIFIER_BASE_URL}/database/report__c`,
        updatedRecord,
        {
          headers: {
            'Authorization': FUNIFIER_AUTH_TOKEN,
            'Content-Type': 'application/json'
          }
        }
      );
    }

    console.log('Updated records with file URL and REGISTERED status');
  }

  /**
   * Generate summary of the submission process
   */
  private generateSummary(result: SubmissionResult): string {
    let summary = `✅ Processamento concluído com sucesso!\n\n`;
    summary += `📊 Registros processados: ${result.recordsProcessed}\n`;
    summary += `🎯 Action logs criados: ${result.actionLogsCreated}\n`;
    summary += `📈 Diferenças encontradas: ${result.differences.length}\n`;
    
    if (result.uploadUrl) {
      summary += `📁 Arquivo CSV armazenado com sucesso\n`;
    }

    // Group differences by player
    const playerDifferences = result.differences.reduce((acc, diff) => {
      if (!acc[diff.playerId]) {
        acc[diff.playerId] = [];
      }
      acc[diff.playerId].push(diff);
      return acc;
    }, {} as Record<string, ComparisonDifference[]>);

    if (Object.keys(playerDifferences).length > 0) {
      summary += `\n📋 Detalhes por jogador:\n`;
      Object.entries(playerDifferences).forEach(([playerId, diffs]) => {
        const firstEntry = diffs.some(d => d.isFirstEntry);
        summary += `\n👤 ${playerId} ${firstEntry ? '(Primeira entrada)' : ''}:\n`;
        diffs.forEach(diff => {
          const sign = diff.difference >= 0 ? '+' : '';
          summary += `  • ${diff.metric}: ${sign}${diff.difference.toFixed(2)}%\n`;
        });
      });
    }

    return summary;
  }
}

export const reportSubmissionService = ReportSubmissionService.getInstance();