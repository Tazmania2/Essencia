import { FunifierDatabaseService } from './funifier-database.service';
import { ReportData } from './report-processing.service';

export interface MetricDifference {
  playerId: string;
  playerName: string;
  metric: string;
  funifierValue: number;
  reportValue: number;
  difference: number;
  percentageChange: number;
  requiresUpdate: boolean;
}

export interface ComparisonResult {
  playerId: string;
  playerName: string;
  team: string;
  differences: MetricDifference[];
  hasChanges: boolean;
  summary: string;
}

export interface ComparisonReport {
  totalPlayers: number;
  playersWithChanges: number;
  totalDifferences: number;
  results: ComparisonResult[];
  summary: string;
}

export class ReportComparisonService {
  private static readonly COLLECTION_NAME = 'essencia_reports__c';
  private static readonly TOLERANCE = 0.01; // 1% tolerance for floating point comparisons

  /**
   * Compare report data with stored Funifier data
   */
  static async compareReportData(
    reportData: ReportData[],
    token: string,
    cycleNumber?: number,
    isNewCycle?: boolean
  ): Promise<ComparisonReport> {
    try {
      // If it's a new cycle, treat all data as new (no comparison needed)
      if (isNewCycle) {
        const results: ComparisonResult[] = reportData.map(reportRecord =>
          this.comparePlayerData(reportRecord, null, true)
        );

        const playersWithChanges = results.length; // All players are "new" in a new cycle
        const totalDifferences = results.reduce((sum, r) => sum + r.differences.length, 0);
        const summary = `Novo ciclo ${cycleNumber || 'N/A'}: Todos os ${results.length} jogadores são novos`;

        return {
          totalPlayers: results.length,
          playersWithChanges,
          totalDifferences,
          results,
          summary
        };
      }

      // Get current data from Funifier custom collection for the specific cycle
      // This will get the LATEST report for each player using aggregation
      const storedData = await this.getStoredData(cycleNumber);

      console.log(`📊 Comparison: Found ${storedData.length} stored records for cycle ${cycleNumber || 'all'}`);

      // Create lookup map for stored data
      const storedDataMap = new Map<string, any>();
      storedData.forEach(record => {
        console.log(`📋 Stored data for player ${record.playerId}:`, {
          time: record.time,
          createdAt: record.createdAt,
          cycleNumber: record.cycleNumber,
          percentages: {
            atividade: record.atividadePercentual,
            reaisPorAtivo: record.reaisPorAtivoPercentual,
            faturamento: record.faturamentoPercentual,
            multimarcas: record.multimarcasPorAtivoPercentual
          }
        });
        storedDataMap.set(record.playerId, record);
      });

      // Compare each player's data
      const results: ComparisonResult[] = [];

      for (const reportRecord of reportData) {
        const storedRecord = storedDataMap.get(reportRecord.playerId);
        const comparisonResult = this.comparePlayerData(reportRecord, storedRecord, false);
        results.push(comparisonResult);
      }

      // Generate summary
      const playersWithChanges = results.filter(r => r.hasChanges).length;
      const totalDifferences = results.reduce((sum, r) => sum + r.differences.length, 0);

      const summary = this.generateComparisonSummary(results.length, playersWithChanges, totalDifferences);

      return {
        totalPlayers: results.length,
        playersWithChanges,
        totalDifferences,
        results,
        summary
      };
    } catch (error) {
      throw new Error(`Erro ao comparar dados: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Get stored data from Funifier custom collection for specific cycle
   * Uses aggregation to get the LATEST report for each player in the cycle
   */
  private static async getStoredData(cycleNumber?: number): Promise<any[]> {
    try {
      const databaseService = FunifierDatabaseService.getInstance();

      // Use aggregation to get the latest report for each player
      // This is much more efficient and accurate than filtering
      const pipeline = [];

      // Match records for the specific cycle (if provided)
      if (cycleNumber) {
        pipeline.push({
          $match: {
            cycleNumber: cycleNumber,
            status: "REGISTERED",
            time: { $exists: true }
          }
        });
      } else {
        pipeline.push({
          $match: {
            status: "REGISTERED",
            time: { $exists: true }
          }
        });
      }

      // Group by playerId and get the latest record for each player
      pipeline.push({
        $sort: { time: -1 } // Sort by time descending (latest first)
      });

      pipeline.push({
        $group: {
          _id: "$playerId",
          latestRecord: { $first: "$$ROOT" } // Get the first (latest) record for each player
        }
      });

      // Replace root with the latest record
      pipeline.push({
        $replaceRoot: { newRoot: "$latestRecord" }
      });

      console.log('🔍 [COMPARISON] Using aggregation pipeline for stored data:', JSON.stringify(pipeline, null, 2));
      console.log('🔍 [COMPARISON] This should be the FULL pipeline, not the limited checkIfNewCycle pipeline!');

      const results = await databaseService.aggregateReportData(pipeline);

      console.log(`📊 [COMPARISON] Found ${results.length} latest records for cycle ${cycleNumber || 'all'}`);

      // Debug: Log the first few results to see what we're getting
      if (results.length > 0) {
        console.log('📋 [COMPARISON] Sample results from aggregation:');
        results.slice(0, 2).forEach((result, index) => {
          console.log(`  Result ${index + 1}:`, {
            playerId: result.playerId,
            time: result.time,
            createdAt: result.createdAt,
            hasPercentages: !!(result.atividadePercentual !== undefined && result.reaisPorAtivoPercentual !== undefined)
          });
        });
      } else {
        console.log('❌ No results returned from aggregation');
      }

      return results;
    } catch (error) {
      // If collection doesn't exist or is empty, return empty array
      console.warn('No stored data found in Funifier collection:', error);
      return [];
    }
  }

  /**
   * Compare individual player data
   */
  private static comparePlayerData(
    reportRecord: ReportData,
    storedRecord?: any,
    isNewCycle: boolean = false
  ): ComparisonResult {
    const differences: MetricDifference[] = [];

    // If no stored record exists OR it's a new cycle, all values are new
    if (!storedRecord || isNewCycle) {
      const metrics = ['atividadePercentual', 'reaisPorAtivoPercentual', 'faturamentoPercentual', 'multimarcasPorAtivoPercentual'];

      metrics.forEach(metric => {
        const reportValue = (reportRecord as any)[metric];
        if (reportValue !== undefined && reportValue !== null) {
          differences.push({
            playerId: reportRecord.playerId,
            playerName: reportRecord.playerId, // Use playerId as fallback since playerName is not available
            metric: metric.replace('Percentual', ''), // Remove 'Percentual' suffix for cleaner metric names
            funifierValue: 0,
            reportValue,
            difference: reportValue,
            percentageChange: reportValue > 0 ? 100 : 0,
            requiresUpdate: true
          });
        }
      });
    } else {
      // Compare each metric using the correct field names
      const metrics = ['atividadePercentual', 'reaisPorAtivoPercentual', 'faturamentoPercentual', 'multimarcasPorAtivoPercentual'];

      metrics.forEach(metric => {
        const reportValue = (reportRecord as any)[metric];
        const storedValue = storedRecord[metric] || 0;

        if (reportValue !== undefined && reportValue !== null) {
          const difference = reportValue - storedValue;
          const percentageChange = storedValue > 0 ? (difference / storedValue) * 100 : (reportValue > 0 ? 100 : 0);

          // Only consider it a change if difference is above tolerance
          if (Math.abs(difference) > this.TOLERANCE) {
            differences.push({
              playerId: reportRecord.playerId,
              playerName: reportRecord.playerId, // Use playerId as fallback since playerName is not available
              metric: metric.replace('Percentual', ''), // Remove 'Percentual' suffix for cleaner metric names
              funifierValue: storedValue,
              reportValue,
              difference,
              percentageChange,
              requiresUpdate: true
            });
          }
        }
      });
    }

    const hasChanges = differences.length > 0;
    const summary = this.generatePlayerSummary(reportRecord.playerId, differences);

    return {
      playerId: reportRecord.playerId,
      playerName: reportRecord.playerId, // Use playerId as fallback since playerName is not available
      team: 'UNKNOWN', // Default team since not available in report data
      differences,
      hasChanges,
      summary
    };
  }

  /**
   * Generate summary for individual player comparison
   */
  private static generatePlayerSummary(playerName: string, differences: MetricDifference[]): string {
    if (differences.length === 0) {
      return `${playerName}: Nenhuma alteração detectada`;
    }

    let summary = `${playerName}: ${differences.length} alteração(ões) detectada(s)\n`;

    differences.forEach(diff => {
      const direction = diff.difference > 0 ? '↑' : '↓';
      const absChange = Math.abs(diff.percentageChange);

      summary += `• ${diff.metric}: ${diff.funifierValue.toFixed(1)}% → ${diff.reportValue.toFixed(1)}% `;
      summary += `(${direction} ${absChange.toFixed(1)}%)\n`;
    });

    return summary.trim();
  }

  /**
   * Generate overall comparison summary
   */
  private static generateComparisonSummary(
    totalPlayers: number,
    playersWithChanges: number,
    totalDifferences: number
  ): string {
    let summary = `Comparação concluída:\n`;
    summary += `• ${totalPlayers} jogadores analisados\n`;
    summary += `• ${playersWithChanges} jogadores com alterações\n`;
    summary += `• ${totalDifferences} diferenças encontradas\n`;

    if (playersWithChanges === 0) {
      summary += `\n✅ Todos os dados estão sincronizados`;
    } else {
      const percentage = ((playersWithChanges / totalPlayers) * 100).toFixed(1);
      summary += `\n⚠️ ${percentage}% dos jogadores precisam de atualização`;
    }

    return summary;
  }

  /**
   * Filter results to show only players with changes
   */
  static filterChangesOnly(comparisonReport: ComparisonReport): ComparisonReport {
    const filteredResults = comparisonReport.results.filter(result => result.hasChanges);

    return {
      ...comparisonReport,
      results: filteredResults,
      summary: this.generateComparisonSummary(
        comparisonReport.totalPlayers,
        filteredResults.length,
        filteredResults.reduce((sum, r) => sum + r.differences.length, 0)
      )
    };
  }

  /**
   * Get differences by metric type
   */
  static getDifferencesByMetric(comparisonReport: ComparisonReport): Record<string, MetricDifference[]> {
    const byMetric: Record<string, MetricDifference[]> = {};

    comparisonReport.results.forEach(result => {
      result.differences.forEach(diff => {
        if (!byMetric[diff.metric]) {
          byMetric[diff.metric] = [];
        }
        byMetric[diff.metric].push(diff);
      });
    });

    return byMetric;
  }

  /**
   * Get players with significant changes (above threshold)
   */
  static getSignificantChanges(
    comparisonReport: ComparisonReport,
    thresholdPercentage: number = 10
  ): ComparisonResult[] {
    return comparisonReport.results.filter(result => {
      return result.differences.some(diff =>
        Math.abs(diff.percentageChange) >= thresholdPercentage
      );
    });
  }

  /**
   * Export comparison results to CSV format
   */
  static exportToCSV(comparisonReport: ComparisonReport): string {
    const headers = [
      'Player ID',
      'Player Name',
      'Team',
      'Metric',
      'Funifier Value',
      'Report Value',
      'Difference',
      'Percentage Change',
      'Requires Update'
    ];

    const rows = [headers.join(',')];

    comparisonReport.results.forEach(result => {
      if (result.differences.length === 0) {
        // Add row for players with no changes
        rows.push([
          result.playerId,
          `"${result.playerName}"`,
          result.team,
          'No changes',
          '',
          '',
          '',
          '',
          'false'
        ].join(','));
      } else {
        result.differences.forEach(diff => {
          rows.push([
            diff.playerId,
            `"${diff.playerName}"`,
            result.team,
            diff.metric,
            diff.funifierValue.toFixed(2),
            diff.reportValue.toFixed(2),
            diff.difference.toFixed(2),
            diff.percentageChange.toFixed(2),
            diff.requiresUpdate.toString()
          ].join(','));
        });
      }
    });

    return rows.join('\n');
  }

  /**
   * Get the latest report for a specific player in a cycle
   * Useful for debugging and individual player comparisons
   */
  static async getLatestPlayerReport(playerId: string, cycleNumber?: number): Promise<any | null> {
    try {
      const databaseService = FunifierDatabaseService.getInstance();

      const pipeline = [];

      // Match the specific player and cycle
      const matchConditions: any = {
        playerId: playerId,
        status: "REGISTERED",
        time: { $exists: true }
      };

      if (cycleNumber) {
        matchConditions.cycleNumber = cycleNumber;
      }

      pipeline.push({ $match: matchConditions });
      pipeline.push({ $sort: { time: -1 } }); // Latest first
      pipeline.push({ $limit: 1 }); // Only the latest one

      console.log(`🔍 Getting latest report for player ${playerId}, cycle ${cycleNumber || 'any'}`);

      const results = await databaseService.aggregateReportData(pipeline);

      const result = results.length > 0 ? results[0] : null;

      if (result) {
        console.log(`✅ Found latest report for player ${playerId}:`, {
          time: result.time,
          createdAt: result.createdAt,
          cycleNumber: result.cycleNumber
        });
      } else {
        console.log(`❌ No report found for player ${playerId}`);
      }

      return result;
    } catch (error) {
      console.error(`Error getting latest report for player ${playerId}:`, error);
      return null;
    }
  }

  /**
   * Validate comparison results before processing
   */
  static validateComparisonResults(comparisonReport: ComparisonReport): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check if we have any results
    if (comparisonReport.results.length === 0) {
      errors.push('Nenhum resultado de comparação encontrado');
    }

    // Check for invalid differences
    comparisonReport.results.forEach(result => {
      result.differences.forEach(diff => {
        if (isNaN(diff.reportValue) || isNaN(diff.funifierValue)) {
          errors.push(`Valores inválidos para ${diff.playerName} - ${diff.metric}`);
        }

        if (diff.reportValue < 0 || diff.funifierValue < 0) {
          errors.push(`Valores negativos detectados para ${diff.playerName} - ${diff.metric}`);
        }
      });
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}