import {
  CycleHistoryData,
  ProgressDataPoint,
  EssenciaReportRecord,
  EnhancedReportRecord,
  CSVGoalData,
} from '../types';
import { FunifierDatabaseService } from './funifier-database.service';
import { errorHandlerService } from './error-handler.service';
import { secureLogger } from '../utils/logger';

export interface CycleSummaryStats {
  totalCycles: number;
  averagePerformance: number;
  bestCycle: {
    cycleNumber: number;
    performance: number;
  } | null;
  worstCycle: {
    cycleNumber: number;
    performance: number;
  } | null;
  improvementTrend: 'improving' | 'declining' | 'stable';
}

export interface CycleComparison {
  cycle1Data: CycleHistoryData | null;
  cycle2Data: CycleHistoryData | null;
  improvements: {
    primaryGoal: number;
    secondaryGoal1: number;
    secondaryGoal2: number;
  };
  summary: string;
}

export class HistoryService {
  private static instance: HistoryService;
  private databaseService: FunifierDatabaseService;

  private constructor() {
    this.databaseService = FunifierDatabaseService.getInstance();
  }

  public static getInstance(): HistoryService {
    if (!HistoryService.instance) {
      HistoryService.instance = new HistoryService();
    }
    return HistoryService.instance;
  }

  /**
   * Get cycle history for a player - Fetch minimal metadata, then parse CSV files
   */
  async getPlayerCycleHistory(playerId: string): Promise<CycleHistoryData[]> {
    try {
      secureLogger.log('🔍 Getting cycle history for player:', playerId);

      // Fetch ONLY minimal metadata from database
      const filter = {
        playerId: playerId,
        uploadUrl: { $exists: true, $ne: null }, // Only reports with CSV files
        status: 'REGISTERED',
      };

      // Get minimal report metadata
      const reportMetadata = await this.databaseService.getReportData(filter);

      if (!reportMetadata || reportMetadata.length === 0) {
        secureLogger.log(`❌ No report metadata found for player: ${playerId}`);
        return [];
      }

      secureLogger.log(
        `📋 Found ${reportMetadata.length} reports with CSV files for player: ${playerId}`
      );

      // LIMIT CSV downloads to prevent loops and crashes
      const MAX_CSV_DOWNLOADS = 10; // Circuit breaker
      const limitedMetadata = reportMetadata.slice(0, MAX_CSV_DOWNLOADS);

      if (reportMetadata.length > MAX_CSV_DOWNLOADS) {
        secureLogger.warn(
          `⚠️ Limiting CSV downloads to ${MAX_CSV_DOWNLOADS} out of ${reportMetadata.length} reports for player: ${playerId}`
        );
      }

      // Process reports sequentially to avoid overwhelming the system
      const validCycleData = [];

      for (const metadata of limitedMetadata) {
        try {
          const enhancedRecord = metadata as any as EnhancedReportRecord;

          if (!enhancedRecord.uploadUrl) {
            secureLogger.warn(`⚠️ No uploadUrl for report: ${metadata._id}`);
            continue;
          }

          // Parse CSV to get actual goal data
          const csvData =
            await this.databaseService.getCSVGoalData(enhancedRecord);

          if (!csvData) {
            secureLogger.warn(
              `⚠️ Failed to parse CSV for report: ${metadata._id}`
            );
            continue;
          }

          validCycleData.push({
            reportDate: metadata.reportDate,
            cycleDay: csvData.cycleDay,
            totalCycleDays: csvData.totalCycleDays,
            csvData,
            uploadUrl: enhancedRecord.uploadUrl,
          });
        } catch (error) {
          secureLogger.warn(
            `⚠️ Error processing report ${metadata._id}:`,
            error
          );
          // Continue processing other reports instead of failing completely
        }
      }

      if (validCycleData.length === 0) {
        secureLogger.log(
          `❌ No valid cycle data found for player: ${playerId}`
        );
        return [];
      }

      // Group by cycle (estimate cycle number from dates and cycle days)
      const cycleMap = new Map<number, typeof validCycleData>();

      validCycleData.forEach((data) => {
        // Estimate cycle number based on report date and cycle day
        const reportDate = new Date(data.reportDate);
        const cycleStartDate = new Date(reportDate);
        cycleStartDate.setDate(reportDate.getDate() - (data.cycleDay - 1));

        // Use cycle start date as cycle identifier (convert to cycle number)
        const cycleNumber = Math.floor(
          cycleStartDate.getTime() / (1000 * 60 * 60 * 24 * data.totalCycleDays)
        );

        if (!cycleMap.has(cycleNumber)) {
          cycleMap.set(cycleNumber, []);
        }
        cycleMap.get(cycleNumber)!.push(data);
      });

      // Convert to CycleHistoryData format
      const cycleHistory: CycleHistoryData[] = Array.from(
        cycleMap.entries()
      ).map(([cycleNumber, cycleReports]) => {
        // Sort reports by date
        cycleReports.sort(
          (a, b) =>
            new Date(a.reportDate).getTime() - new Date(b.reportDate).getTime()
        );

        const firstReport = cycleReports[0];
        const lastReport = cycleReports[cycleReports.length - 1];

        // Calculate cycle start and end dates
        const firstReportDate = new Date(firstReport.reportDate);
        const cycleStartDate = new Date(firstReportDate);
        cycleStartDate.setDate(
          firstReportDate.getDate() - (firstReport.cycleDay - 1)
        );

        const cycleEndDate = new Date(cycleStartDate);
        cycleEndDate.setDate(
          cycleStartDate.getDate() + firstReport.totalCycleDays - 1
        );

        return {
          cycleNumber,
          startDate: cycleStartDate.toISOString(),
          endDate: cycleEndDate.toISOString(),
          totalDays: firstReport.totalCycleDays,
          completionStatus: 'completed' as const,
          finalMetrics: {
            primaryGoal: {
              name: 'Atividade',
              percentage: lastReport.csvData.atividade.percentage,
              target: lastReport.csvData.atividade.target,
              current: lastReport.csvData.atividade.current,
              unit: '%',
              boostActive: false,
            },
            secondaryGoal1: {
              name: 'Reais por Ativo',
              percentage: lastReport.csvData.reaisPorAtivo.percentage,
              target: lastReport.csvData.reaisPorAtivo.target,
              current: lastReport.csvData.reaisPorAtivo.current,
              unit: '%',
              boostActive: false,
            },
            secondaryGoal2: {
              name: 'Faturamento',
              percentage: lastReport.csvData.faturamento.percentage,
              target: lastReport.csvData.faturamento.target,
              current: lastReport.csvData.faturamento.current,
              unit: '%',
              boostActive: false,
            },
          },
          progressTimeline: cycleReports.map((report, index) => ({
            date: report.reportDate,
            dayInCycle: report.cycleDay,
            uploadSequence: index + 1,
            metrics: {
              primaryGoal: report.csvData.atividade.percentage,
              secondaryGoal1: report.csvData.reaisPorAtivo.percentage,
              secondaryGoal2: report.csvData.faturamento.percentage,
            },
          })),
        };
      });

      // Sort by cycle number (most recent first)
      cycleHistory.sort((a, b) => b.cycleNumber - a.cycleNumber);

      secureLogger.log(
        `✅ Found ${cycleHistory.length} cycles for player: ${playerId}`
      );
      return cycleHistory;
    } catch (error) {
      secureLogger.error('❌ Error getting cycle history:', error);
      return [];
    }
  }

  /**
   * Get detailed data for a specific cycle - DIRECT QUERY (no loops)
   */
  async getCycleDetails(
    playerId: string,
    cycleNumber: number
  ): Promise<CycleHistoryData | null> {
    try {
      secureLogger.log(
        `🔍 Getting cycle details for player: ${playerId}, cycle: ${cycleNumber}`
      );

      // DIRECT database query for specific cycle - no loops
      const filter = {
        playerId: playerId,
        cycleNumber: cycleNumber,
        uploadUrl: { $exists: true, $ne: null },
        status: 'REGISTERED',
      };

      const reportMetadata = await this.databaseService.getReportData(filter);

      if (!reportMetadata || reportMetadata.length === 0) {
        secureLogger.log(
          `❌ No cycle details found for player: ${playerId}, cycle: ${cycleNumber}`
        );
        return null;
      }

      // Process only the reports for this specific cycle
      const cycleReports = [];
      for (const metadata of reportMetadata) {
        try {
          const enhancedRecord = metadata as any as EnhancedReportRecord;
          if (!enhancedRecord.uploadUrl) continue;

          const csvData =
            await this.databaseService.getCSVGoalData(enhancedRecord);
          if (!csvData) continue;

          cycleReports.push({
            reportDate: metadata.reportDate,
            cycleDay: csvData.cycleDay,
            totalCycleDays: csvData.totalCycleDays,
            csvData,
            uploadUrl: enhancedRecord.uploadUrl,
          });
        } catch (error) {
          secureLogger.warn(
            `⚠️ Error processing report ${metadata._id}:`,
            error
          );
        }
      }

      if (cycleReports.length === 0) {
        return null;
      }

      // Sort reports by date
      cycleReports.sort(
        (a, b) =>
          new Date(a.reportDate).getTime() - new Date(b.reportDate).getTime()
      );

      const firstReport = cycleReports[0];
      const lastReport = cycleReports[cycleReports.length - 1];

      // Calculate cycle dates
      const firstReportDate = new Date(firstReport.reportDate);
      const cycleStartDate = new Date(firstReportDate);
      cycleStartDate.setDate(
        firstReportDate.getDate() - (firstReport.cycleDay - 1)
      );

      const cycleEndDate = new Date(cycleStartDate);
      cycleEndDate.setDate(
        cycleStartDate.getDate() + firstReport.totalCycleDays - 1
      );

      const cycleDetails: CycleHistoryData = {
        cycleNumber,
        startDate: cycleStartDate.toISOString(),
        endDate: cycleEndDate.toISOString(),
        totalDays: firstReport.totalCycleDays,
        completionStatus: 'completed' as const,
        finalMetrics: {
          primaryGoal: {
            name: 'Atividade',
            percentage: lastReport.csvData.atividade.percentage,
            target: lastReport.csvData.atividade.target,
            current: lastReport.csvData.atividade.current,
            unit: '%',
            boostActive: false,
          },
          secondaryGoal1: {
            name: 'Reais por Ativo',
            percentage: lastReport.csvData.reaisPorAtivo.percentage,
            target: lastReport.csvData.reaisPorAtivo.target,
            current: lastReport.csvData.reaisPorAtivo.current,
            unit: '%',
            boostActive: false,
          },
          secondaryGoal2: {
            name: 'Faturamento',
            percentage: lastReport.csvData.faturamento.percentage,
            target: lastReport.csvData.faturamento.target,
            current: lastReport.csvData.faturamento.current,
            unit: '%',
            boostActive: false,
          },
        },
        progressTimeline: cycleReports.map((report, index) => ({
          date: report.reportDate,
          dayInCycle: report.cycleDay,
          uploadSequence: index + 1,
          metrics: {
            primaryGoal: report.csvData.atividade.percentage,
            secondaryGoal1: report.csvData.reaisPorAtivo.percentage,
            secondaryGoal2: report.csvData.faturamento.percentage,
          },
        })),
      };

      secureLogger.log(
        `✅ Found cycle details for player: ${playerId}, cycle: ${cycleNumber}`
      );
      return cycleDetails;
    } catch (error) {
      secureLogger.error('❌ Error getting cycle details:', error);
      return null;
    }
  }

  /**
   * Get progress timeline for a specific cycle - DIRECT QUERY (no loops)
   */
  async getCycleProgressTimeline(
    playerId: string,
    cycleNumber: number
  ): Promise<ProgressDataPoint[]> {
    try {
      secureLogger.log(
        `🔍 Getting progress timeline for player: ${playerId}, cycle: ${cycleNumber}`
      );

      // DIRECT database query - no method calls that could loop
      const filter = {
        playerId: playerId,
        cycleNumber: cycleNumber,
        uploadUrl: { $exists: true, $ne: null },
        status: 'REGISTERED',
      };

      const reportMetadata = await this.databaseService.getReportData(filter);

      if (!reportMetadata || reportMetadata.length === 0) {
        secureLogger.log(
          `❌ No timeline found for player: ${playerId}, cycle: ${cycleNumber}`
        );
        return [];
      }

      // Process timeline data directly
      const timelinePoints: ProgressDataPoint[] = [];

      for (const metadata of reportMetadata) {
        try {
          const enhancedRecord = metadata as any as EnhancedReportRecord;
          if (!enhancedRecord.uploadUrl) continue;

          const csvData =
            await this.databaseService.getCSVGoalData(enhancedRecord);
          if (!csvData) continue;

          timelinePoints.push({
            date: metadata.reportDate,
            dayInCycle: csvData.cycleDay,
            uploadSequence: timelinePoints.length + 1,
            metrics: {
              primaryGoal: csvData.atividade.percentage,
              secondaryGoal1: csvData.reaisPorAtivo.percentage,
              secondaryGoal2: csvData.faturamento.percentage,
            },
          });
        } catch (error) {
          secureLogger.warn(
            `⚠️ Error processing timeline report ${metadata._id}:`,
            error
          );
        }
      }

      // Sort by date
      timelinePoints.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      secureLogger.log(
        `✅ Found ${timelinePoints.length} progress points for player: ${playerId}, cycle: ${cycleNumber}`
      );
      return timelinePoints;
    } catch (error) {
      secureLogger.error('❌ Error getting progress timeline:', error);
      return [];
    }
  }

  /**
   * Check if a player has historical data - FAST CHECK
   */
  async hasHistoricalData(playerId: string): Promise<boolean> {
    try {
      // FAST database check - no CSV processing
      const filter = {
        playerId: playerId,
        cycleNumber: { $exists: true, $ne: null },
      };

      const reportMetadata = await this.databaseService.getReportData(filter);
      return reportMetadata && reportMetadata.length > 0;
    } catch (error) {
      secureLogger.warn(
        `Error checking historical data for player: ${playerId}`,
        error
      );
      // If there's an error, allow access anyway - the history page will handle empty data gracefully
      return true;
    }
  }

  /**
   * Get all cycles for a player (including current) - DIRECT QUERY (no loops)
   */
  async getPlayerCycles(playerId: string): Promise<CycleHistoryData[]> {
    try {
      // DIRECT database query for cycle numbers only - no CSV processing
      const filter = {
        playerId: playerId,
        cycleNumber: { $exists: true, $ne: null },
        status: 'REGISTERED',
      };

      const reportMetadata = await this.databaseService.getReportData(filter);

      if (!reportMetadata || reportMetadata.length === 0) {
        secureLogger.log(`❌ No cycles found for player: ${playerId}`);
        return [];
      }

      // Extract unique cycle numbers only - no heavy processing
      const cycleNumbers = new Set<number>();
      reportMetadata.forEach((metadata) => {
        const enhancedRecord = metadata as any as EnhancedReportRecord;
        if (enhancedRecord.cycleNumber) {
          cycleNumbers.add(enhancedRecord.cycleNumber);
        }
      });

      // Create minimal cycle data - no CSV parsing
      const cycles: CycleHistoryData[] = Array.from(cycleNumbers).map(
        (cycleNumber) => ({
          cycleNumber,
          startDate: new Date().toISOString(), // Placeholder
          endDate: new Date().toISOString(), // Placeholder
          totalDays: 21, // Default
          completionStatus: 'completed' as const,
          finalMetrics: {
            primaryGoal: {
              name: 'Atividade',
              percentage: 0,
              target: 100,
              current: 0,
              unit: '%',
              boostActive: false,
            },
            secondaryGoal1: {
              name: 'Reais por Ativo',
              percentage: 0,
              target: 100,
              current: 0,
              unit: '%',
              boostActive: false,
            },
            secondaryGoal2: {
              name: 'Faturamento',
              percentage: 0,
              target: 100,
              current: 0,
              unit: '%',
              boostActive: false,
            },
          },
          progressTimeline: [],
        })
      );

      // Sort by cycle number (most recent first)
      cycles.sort((a, b) => b.cycleNumber - a.cycleNumber);

      secureLogger.log(
        `✅ Found ${cycles.length} cycles for player: ${playerId}`
      );
      return cycles;
    } catch (error) {
      secureLogger.error('❌ Error getting player cycles:', error);
      return [];
    }
  }

  /**
   * Get summary statistics for a player's cycle history - LIGHTWEIGHT
   */
  async getCycleSummaryStats(playerId: string): Promise<CycleSummaryStats> {
    try {
      // Use lightweight getPlayerCycles instead of full history
      const cycles = await this.getPlayerCycles(playerId);

      if (cycles.length === 0) {
        return {
          totalCycles: 0,
          averagePerformance: 0,
          bestCycle: null,
          worstCycle: null,
          improvementTrend: 'stable',
        };
      }

      // Calculate average performance across all goals
      const performances = cycles.map((cycle) => {
        const avg =
          (cycle.finalMetrics.primaryGoal.percentage +
            cycle.finalMetrics.secondaryGoal1.percentage +
            cycle.finalMetrics.secondaryGoal2.percentage) /
          3;
        return { cycleNumber: cycle.cycleNumber, performance: avg };
      });

      const averagePerformance =
        performances.reduce((sum, p) => sum + p.performance, 0) /
        performances.length;

      const bestCycle = performances.reduce((best, current) =>
        current.performance > best.performance ? current : best
      );

      const worstCycle = performances.reduce((worst, current) =>
        current.performance < worst.performance ? current : worst
      );

      // Determine improvement trend (compare first half vs second half)
      let improvementTrend: 'improving' | 'declining' | 'stable' = 'stable';
      if (performances.length >= 4) {
        const midPoint = Math.floor(performances.length / 2);
        const firstHalf = performances.slice(0, midPoint);
        const secondHalf = performances.slice(midPoint);

        const firstHalfAvg =
          firstHalf.reduce((sum, p) => sum + p.performance, 0) /
          firstHalf.length;
        const secondHalfAvg =
          secondHalf.reduce((sum, p) => sum + p.performance, 0) /
          secondHalf.length;

        const difference = secondHalfAvg - firstHalfAvg;
        if (difference > 5) improvementTrend = 'improving';
        else if (difference < -5) improvementTrend = 'declining';
      }

      return {
        totalCycles: cycles.length,
        averagePerformance: Math.round(averagePerformance),
        bestCycle,
        worstCycle,
        improvementTrend,
      };
    } catch (error) {
      const apiError = errorHandlerService.handleDataProcessingError(
        error as Error,
        'getCycleSummaryStats'
      );
      errorHandlerService.logError(
        apiError,
        'HistoryService.getCycleSummaryStats'
      );
      throw apiError;
    }
  }

  /**
   * Compare two cycles for a player
   */
  async compareCycles(
    playerId: string,
    cycle1Number: number,
    cycle2Number: number
  ): Promise<CycleComparison> {
    try {
      const [cycle1Data, cycle2Data] = await Promise.all([
        this.getCycleDetails(playerId, cycle1Number),
        this.getCycleDetails(playerId, cycle2Number),
      ]);

      const improvements = {
        primaryGoal: 0,
        secondaryGoal1: 0,
        secondaryGoal2: 0,
      };

      let summary = 'Não foi possível comparar os ciclos.';

      if (cycle1Data && cycle2Data) {
        improvements.primaryGoal =
          cycle2Data.finalMetrics.primaryGoal.percentage -
          cycle1Data.finalMetrics.primaryGoal.percentage;
        improvements.secondaryGoal1 =
          cycle2Data.finalMetrics.secondaryGoal1.percentage -
          cycle1Data.finalMetrics.secondaryGoal1.percentage;
        improvements.secondaryGoal2 =
          cycle2Data.finalMetrics.secondaryGoal2.percentage -
          cycle1Data.finalMetrics.secondaryGoal2.percentage;

        const totalImprovement =
          improvements.primaryGoal +
          improvements.secondaryGoal1 +
          improvements.secondaryGoal2;

        if (totalImprovement > 10) {
          summary = `Excelente melhoria! Performance geral aumentou ${totalImprovement.toFixed(1)} pontos percentuais.`;
        } else if (totalImprovement > 0) {
          summary = `Boa evolução! Performance geral melhorou ${totalImprovement.toFixed(1)} pontos percentuais.`;
        } else if (totalImprovement > -10) {
          summary = `Performance estável com pequena variação de ${totalImprovement.toFixed(1)} pontos percentuais.`;
        } else {
          summary = `Performance declinou ${Math.abs(totalImprovement).toFixed(1)} pontos percentuais. Foque nas áreas de melhoria.`;
        }
      }

      return {
        cycle1Data,
        cycle2Data,
        improvements,
        summary,
      };
    } catch (error) {
      const apiError = errorHandlerService.handleDataProcessingError(
        error as Error,
        'compareCycles'
      );
      errorHandlerService.logError(apiError, 'HistoryService.compareCycles');
      throw apiError;
    }
  }

  /**
   * Get cycle history with backward compatibility for legacy data
   * Returns minimal metadata only - CSV parsing should be done separately
   */
  async getPlayerCycleHistoryWithCompatibility(
    playerId: string
  ): Promise<EssenciaReportRecord[]> {
    try {
      // Get minimal metadata only - no heavy data processing
      const filter = {
        playerId: playerId,
        // Don't filter by uploadUrl here for backward compatibility
      };

      const records = await this.databaseService.getReportData(filter);

      // Sort by report date to maintain chronological order
      records.sort(
        (a, b) =>
          new Date(a.reportDate).getTime() - new Date(b.reportDate).getTime()
      );

      secureLogger.log(
        `📋 Found ${records.length} report records for player: ${playerId}`
      );
      return records;
    } catch (error) {
      secureLogger.error(
        '❌ Error getting player cycle history with compatibility:',
        error
      );
      return [];
    }
  }
}

// Export singleton instance
export const historyService = HistoryService.getInstance();
