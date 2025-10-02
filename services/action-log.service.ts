import axios from 'axios';
import { MetricDifference, ComparisonResult } from './report-comparison.service';

export interface ActionLog {
  playerId: string;
  challengeType: string;
  attribute: string;
  value: number;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface ActionLogSubmissionResult {
  success: boolean;
  actionLog: ActionLog;
  error?: string;
}

export interface BatchSubmissionResult {
  totalLogs: number;
  successfulSubmissions: number;
  failedSubmissions: number;
  results: ActionLogSubmissionResult[];
  summary: string;
}

export class ActionLogService {
  private static readonly BASE_URL = 'https://service2.funifier.com/v3';
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY = 1000; // 1 second

  // Mapping of metric names to Funifier ACTION IDs (not challenge types)
  private static readonly METRIC_TO_ACTION_MAP: Record<string, string> = {
    'atividade': 'atividade',
    'reaisPorAtivo': 'reais_por_ativo', 
    'faturamento': 'faturamento',
    'multimarcasPorAtivo': 'multimarcas_por_ativo',
    'conversoes': 'conversoes',
    'upa': 'upa'
  };

  /**
   * Generate action logs from comparison results
   */
  static generateActionLogs(comparisonResults: ComparisonResult[]): ActionLog[] {
    const actionLogs: ActionLog[] = [];

    comparisonResults.forEach(result => {
      if (!result.hasChanges) return;

      result.differences.forEach(difference => {
        if (!difference.requiresUpdate) return;

        const actionLog = this.createActionLog(difference);
        if (actionLog) {
          actionLogs.push(actionLog);
        }
      });
    });

    return actionLogs;
  }

  /**
   * Create individual action log from metric difference
   */
  private static createActionLog(difference: MetricDifference): ActionLog | null {
    const actionId = this.METRIC_TO_ACTION_MAP[difference.metric];
    
    if (!actionId) {
      console.warn(`Unknown metric type: ${difference.metric}`);
      return null;
    }

    // Calculate the porcentagem_da_meta to send to Funifier
    // This is the percentage change since last report - what awards/deducts points
    const value = difference.difference;

    return {
      playerId: difference.playerId,
      challengeType: actionId, // This will be used as actionId in the API call
      attribute: difference.metric,
      value,
      timestamp: new Date().toISOString(),
      metadata: {
        playerName: difference.playerName,
        previousValue: difference.funifierValue,
        newValue: difference.reportValue,
        percentageChange: difference.percentageChange
      }
    };
  }

  /**
   * Submit single action log to Funifier
   */
  static async submitActionLog(
    actionLog: ActionLog,
    token: string
  ): Promise<ActionLogSubmissionResult> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        await this.sendActionLogRequest(actionLog, token);
        
        return {
          success: true,
          actionLog
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt < this.MAX_RETRIES) {
          await this.delay(this.RETRY_DELAY * attempt);
        }
      }
    }

    return {
      success: false,
      actionLog,
      error: lastError?.message || 'Failed to submit action log'
    };
  }

  /**
   * Submit multiple action logs in batch using BULK endpoint for efficiency
   */
  static async submitActionLogsBatch(
    actionLogs: ActionLog[],
    token: string,
    onProgress?: (completed: number, total: number) => void
  ): Promise<BatchSubmissionResult> {
    try {
      // Use bulk endpoint for better performance
      const bulkPayload = actionLogs.map(actionLog => ({
        actionId: actionLog.challengeType,
        userId: actionLog.playerId,
        attributes: {
          porcentagem_da_meta: actionLog.value // ✅ Only send the essential field
        }
      }));

      const response = await axios.post(
        `${this.BASE_URL}/action/log/bulk`,
        bulkPayload,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000 // 30 second timeout for bulk
        }
      );

      const responseData = response.data;
      const successfulSubmissions = responseData.total_registered || 0;
      const failedSubmissions = actionLogs.length - successfulSubmissions;

      // Create results array
      const results: ActionLogSubmissionResult[] = actionLogs.map((actionLog, index) => ({
        success: index < successfulSubmissions,
        actionLog,
        error: index >= successfulSubmissions ? 'Failed in bulk submission' : undefined
      }));

      if (onProgress) {
        // Simulate progress for bulk submission to provide better UX feedback
        for (let i = 1; i <= actionLogs.length; i++) {
          onProgress(i, actionLogs.length);
        }
      }

      const summary = this.generateBatchSummary(
        actionLogs.length,
        successfulSubmissions,
        failedSubmissions
      );

      return {
        totalLogs: actionLogs.length,
        successfulSubmissions,
        failedSubmissions,
        results,
        summary
      };

    } catch (error) {
      // Fallback to individual submissions if bulk fails
      console.warn('Bulk submission failed, falling back to individual submissions:', error);
      
      const results: ActionLogSubmissionResult[] = [];
      let successfulSubmissions = 0;
      let failedSubmissions = 0;

      for (let i = 0; i < actionLogs.length; i++) {
        const actionLog = actionLogs[i];
        
        try {
          const result = await this.submitActionLog(actionLog, token);
          results.push(result);
          
          if (result.success) {
            successfulSubmissions++;
          } else {
            failedSubmissions++;
          }
          
          // Call progress callback if provided
          if (onProgress) {
            onProgress(i + 1, actionLogs.length);
          }
          
          // Small delay between requests to avoid rate limiting
          if (i < actionLogs.length - 1) {
            await this.delay(100);
          }
        } catch (error) {
          const errorResult: ActionLogSubmissionResult = {
            success: false,
            actionLog,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
          
          results.push(errorResult);
          failedSubmissions++;
          
          if (onProgress) {
            onProgress(i + 1, actionLogs.length);
          }
        }
      }

      const summary = this.generateBatchSummary(
        actionLogs.length,
        successfulSubmissions,
        failedSubmissions
      );

      return {
        totalLogs: actionLogs.length,
        successfulSubmissions,
        failedSubmissions,
        results,
        summary
      };
    }
  }

  /**
   * Send action log request to Funifier API using CORRECT endpoint and payload
   */
  private static async sendActionLogRequest(
    actionLog: ActionLog,
    token: string
  ): Promise<void> {
    const url = `${this.BASE_URL}/action/log`;
    
    // ✅ CORRECT payload structure for Funifier API - only porcentagem_da_meta is essential
    const payload = {
      actionId: actionLog.challengeType, // Use challengeType as actionId
      userId: actionLog.playerId,
      attributes: {
        porcentagem_da_meta: actionLog.value // ✅ This is the key field that awards/deducts points
      }
    };

    const response = await axios.post(url, payload, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10 second timeout
    });

    if (response.status < 200 || response.status >= 300) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }

  /**
   * Generate summary for batch submission
   */
  private static generateBatchSummary(
    total: number,
    successful: number,
    failed: number
  ): string {
    let summary = `Envio de action logs concluído:\n`;
    summary += `• ${total} logs processados\n`;
    summary += `• ${successful} enviados com sucesso\n`;
    summary += `• ${failed} falharam\n`;

    if (failed === 0) {
      summary += `\n✅ Todos os logs foram enviados com sucesso`;
    } else {
      const successRate = ((successful / total) * 100).toFixed(1);
      summary += `\n⚠️ Taxa de sucesso: ${successRate}%`;
    }

    return summary;
  }

  /**
   * Validate action logs before submission
   */
  static validateActionLogs(actionLogs: ActionLog[]): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (actionLogs.length === 0) {
      errors.push('Nenhum action log para enviar');
      return { isValid: false, errors };
    }

    actionLogs.forEach((log, index) => {
      // Validate required fields
      if (!log.playerId) {
        errors.push(`Action log ${index + 1}: playerId é obrigatório`);
      }

      if (!log.challengeType) {
        errors.push(`Action log ${index + 1}: challengeType é obrigatório`);
      }

      if (!log.attribute) {
        errors.push(`Action log ${index + 1}: attribute é obrigatório`);
      }

      if (typeof log.value !== 'number' || isNaN(log.value)) {
        errors.push(`Action log ${index + 1}: value deve ser um número válido`);
      }

      if (!log.timestamp) {
        errors.push(`Action log ${index + 1}: timestamp é obrigatório`);
      }

      // Validate timestamp format
      if (log.timestamp && isNaN(Date.parse(log.timestamp))) {
        errors.push(`Action log ${index + 1}: timestamp deve ser uma data válida`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get failed action logs from batch result
   */
  static getFailedActionLogs(batchResult: BatchSubmissionResult): ActionLog[] {
    return batchResult.results
      .filter(result => !result.success)
      .map(result => result.actionLog);
  }

  /**
   * Retry failed action logs
   */
  static async retryFailedActionLogs(
    batchResult: BatchSubmissionResult,
    token: string,
    onProgress?: (completed: number, total: number) => void
  ): Promise<BatchSubmissionResult> {
    const failedLogs = this.getFailedActionLogs(batchResult);
    
    if (failedLogs.length === 0) {
      return {
        totalLogs: 0,
        successfulSubmissions: 0,
        failedSubmissions: 0,
        results: [],
        summary: 'Nenhum action log para reenviar'
      };
    }

    return this.submitActionLogsBatch(failedLogs, token, onProgress);
  }

  /**
   * Export action logs to JSON format
   */
  static exportActionLogsToJSON(actionLogs: ActionLog[]): string {
    return JSON.stringify(actionLogs, null, 2);
  }

  /**
   * Export batch results to CSV format
   */
  static exportBatchResultsToCSV(batchResult: BatchSubmissionResult): string {
    const headers = [
      'Player ID',
      'Challenge Type',
      'Attribute',
      'Value',
      'Timestamp',
      'Success',
      'Error'
    ];

    const rows = [headers.join(',')];

    batchResult.results.forEach(result => {
      const log = result.actionLog;
      rows.push([
        log.playerId,
        log.challengeType,
        log.attribute,
        log.value.toString(),
        log.timestamp,
        result.success.toString(),
        result.error ? `"${result.error}"` : ''
      ].join(','));
    });

    return rows.join('\n');
  }

  /**
   * Utility function for delays
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get action logs grouped by player
   */
  static groupActionLogsByPlayer(actionLogs: ActionLog[]): Record<string, ActionLog[]> {
    const grouped: Record<string, ActionLog[]> = {};

    actionLogs.forEach(log => {
      if (!grouped[log.playerId]) {
        grouped[log.playerId] = [];
      }
      grouped[log.playerId].push(log);
    });

    return grouped;
  }

  /**
   * Get action logs grouped by metric type
   */
  static groupActionLogsByMetric(actionLogs: ActionLog[]): Record<string, ActionLog[]> {
    const grouped: Record<string, ActionLog[]> = {};

    actionLogs.forEach(log => {
      if (!grouped[log.attribute]) {
        grouped[log.attribute] = [];
      }
      grouped[log.attribute].push(log);
    });

    return grouped;
  }
}