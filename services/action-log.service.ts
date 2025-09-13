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

  // Mapping of metric names to Funifier challenge types
  private static readonly METRIC_TO_CHALLENGE_MAP: Record<string, string> = {
    'atividade': 'atividade_challenge',
    'reaisPorAtivo': 'reais_por_ativo_challenge',
    'faturamento': 'faturamento_challenge',
    'multimarcasPorAtivo': 'multimarcas_por_ativo_challenge'
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
    const challengeType = this.METRIC_TO_CHALLENGE_MAP[difference.metric];
    
    if (!challengeType) {
      console.warn(`Unknown metric type: ${difference.metric}`);
      return null;
    }

    // Calculate the value to send to Funifier
    // We send the difference, not the absolute value
    const value = difference.difference;

    return {
      playerId: difference.playerId,
      challengeType,
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
   * Submit multiple action logs in batch
   */
  static async submitActionLogsBatch(
    actionLogs: ActionLog[],
    token: string,
    onProgress?: (completed: number, total: number) => void
  ): Promise<BatchSubmissionResult> {
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

  /**
   * Send action log request to Funifier API
   */
  private static async sendActionLogRequest(
    actionLog: ActionLog,
    token: string
  ): Promise<void> {
    const url = `${this.BASE_URL}/action-logs`;
    
    const payload = {
      player_id: actionLog.playerId,
      challenge_type: actionLog.challengeType,
      attribute: actionLog.attribute,
      value: actionLog.value,
      timestamp: actionLog.timestamp,
      metadata: actionLog.metadata
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