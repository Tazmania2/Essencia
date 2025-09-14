import axios from 'axios';
import { ReportData, ParseResult } from './report-processing.service';
import { secureLogger } from '../utils/logger';

// Get Basic auth token from environment variables
const FUNIFIER_AUTH_TOKEN = process.env.FUNIFIER_BASIC_TOKEN;
const FUNIFIER_BASE_URL = process.env.FUNIFIER_BASE_URL || 'https://service2.funifier.com/v3';

if (!FUNIFIER_AUTH_TOKEN) {
  throw new Error('FUNIFIER_BASIC_TOKEN environment variable is required');
}

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
  time: number; // Unix timestamp with milliseconds (Funifier pattern)
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
      const currentTime = Date.now(); // Unix timestamp with milliseconds (Funifier pattern)
      
      const recordToInsert = {
        playerId: data.playerId,
        diaDociclo: data.diaDociclo,
        totalDiasCiclo: data.totalDiasCiclo,
        faturamentoPercentual: data.faturamentoPercentual,
        reaisPorAtivoPercentual: data.reaisPorAtivoPercentual,
        multimarcasPorAtivoPercentual: data.multimarcasPorAtivoPercentual,
        atividadePercentual: data.atividadePercentual,
        reportDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
        time: currentTime, // Unix timestamp with milliseconds
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
      // Get previous data for this player (excluding current record)
      const previousData = await this.getPreviousPlayerData(record.playerId, record._id);
      
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
   * Get previous data for a player (excluding current submission)
   */
  private async getPreviousPlayerData(playerId: string, currentRecordId?: string): Promise<ReportRecord | null> {
    try {
      // Use simple List Data API to get all records, then filter in JavaScript
      const response = await axios.get(
        `${FUNIFIER_BASE_URL}/database/report__c`,
        {
          headers: {
            'Authorization': FUNIFIER_AUTH_TOKEN,
            'Content-Type': 'application/json'
          }
        }
      );

      // Filter and sort the data in JavaScript
      const allRecords = response.data as ReportRecord[];
      const playerRecords = allRecords
        .filter(record => {
          // Include records for this player that are:
          // 1. Not the current record being processed (if we have its ID)
          // 2. Have status 'REGISTERED' (completed submissions)
          // 3. Are for the same player
          return record.playerId === playerId && 
                 record.status === 'REGISTERED' &&
                 (!currentRecordId || record._id !== currentRecordId);
        })
        .sort((a, b) => {
          // Sort by time descending (most recent first) - Unix timestamp with milliseconds
          return b.time - a.time;
        });

      console.log(`Found ${playerRecords.length} previous records for player ${playerId}`);
      if (playerRecords.length > 0) {
        console.log(`Most recent previous record:`, playerRecords[0]);
      }

      return playerRecords.length > 0 ? playerRecords[0] : null;
    } catch (error) {
      console.warn(`Could not fetch previous data for player ${playerId}:`, error);
      return null;
    }
  }

  /**
   * Alternative: Get previous data using correct aggregation format
   * (Uncomment this method if you prefer to use aggregation)
   */
  private async getPreviousPlayerDataWithAggregation(playerId: string, currentRecordId?: string): Promise<ReportRecord | null> {
    try {
      // Correct aggregation pipeline format as per Funifier API docs
      const matchConditions: any = {
        "playerId": playerId,
        "status": "REGISTERED"
      };

      // Exclude current record if we have its ID
      if (currentRecordId) {
        matchConditions["_id"] = { "$ne": currentRecordId };
      }

      const pipeline = [
        {
          "$match": matchConditions
        },
        {
          "$sort": { "time": -1 }
        },
        {
          "$limit": 1
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
        time: Date.now(), // Update time when marking as REGISTERED
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