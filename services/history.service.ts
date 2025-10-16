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

  // Circuit breaker to prevent rapid successive calls
  private lastCallTime: Map<string, number> = new Map();
  private readonly CALL_COOLDOWN = 5000; // 5 seconds between calls for same player

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
   * Get cycle history for a player - Show all CSVs grouped by cycle number
   */
  async getPlayerCycleHistory(playerId: string): Promise<CycleHistoryData[]> {
    try {
      // ✅ CIRCUIT BREAKER: Prevent rapid successive calls
      const now = Date.now();
      const lastCall = this.lastCallTime.get(playerId);

      if (lastCall && now - lastCall < this.CALL_COOLDOWN) {
        const remainingTime = Math.ceil(
          (this.CALL_COOLDOWN - (now - lastCall)) / 1000
        );
        secureLogger.warn(
          `⏳ Rate limit: Please wait ${remainingTime}s before calling again for player: ${playerId}`
        );
        return [];
      }

      this.lastCallTime.set(playerId, now);

      secureLogger.log('🔍 Getting cycle history for player:', playerId);

      // ✅ Simplified approach: Get ALL reports for this player first
      let reportMetadata;
      
      // Try simple query first - but we need to cast to EnhancedReportRecord since that has uploadUrl
      try {
        const allReports = await this.databaseService.getReportData({ playerId });
        secureLogger.log(`📊 Found ${allReports.length} total reports for player: ${playerId}`);
        
        // Filter for reports with CSV files - cast to any to access uploadUrl and status
        reportMetadata = allReports.filter((report: any) => 
          report.uploadUrl && 
          report.uploadUrl.trim() !== '' &&
          (report.status === 'REGISTERED' || !report.status) // Some reports might not have status
        );
        
        secureLogger.log(`📊 Found ${reportMetadata.length} reports with CSV files`);
        
      } catch (simpleQueryError) {
        secureLogger.error('Simple query failed, trying aggregation:', simpleQueryError);
        
        // Fallback to aggregation if simple query fails
        const aggregationPipeline = [
          {
            $match: {
              playerId: playerId,
              uploadUrl: { $exists: true, $ne: null },
            },
          },
          {
            $sort: { reportDate: 1 },
          },
        ];

        try {
          reportMetadata = (await Promise.race([
            this.databaseService.aggregateReportData(aggregationPipeline),
            new Promise((_, reject) =>
              setTimeout(
                () => reject(new Error('Database aggregation timeout')),
                10000
              )
            ),
          ])) as any[];
          
          secureLogger.log(`📋 Aggregation returned ${reportMetadata?.length || 0} results`);
        } catch (dbError) {
          secureLogger.error(
            `❌ Database aggregation error for player ${playerId}:`,
            dbError
          );
          return [];
        }
      }

      if (!reportMetadata || reportMetadata.length === 0) {
        secureLogger.log(`❌ No report metadata found for player: ${playerId}`);
        
        // ✅ Try to understand why no data was found
        secureLogger.log(`🔍 No CSV reports found for player: ${playerId}`);
        
        return [];
      }

      secureLogger.log(
        `📋 Found ${reportMetadata.length} reports with CSV files for player: ${playerId}`
      );

      // ✅ Process ALL reports and group by cycle number from CSV
      const cycleMap = new Map<number, any[]>();

      for (const metadata of reportMetadata) {
        try {
          const enhancedRecord = metadata as any as EnhancedReportRecord;

          if (!(enhancedRecord as any).uploadUrl) {
            secureLogger.warn(`⚠️ No uploadUrl for report: ${metadata._id}`);
            continue;
          }

          // Parse CSV to get actual goal data and cycle info
          const csvData = await this.databaseService.getCSVGoalData(enhancedRecord);

          if (!csvData) {
            secureLogger.warn(`⚠️ Failed to parse CSV for report: ${metadata._id}`);
            continue;
          }

          // ✅ Use the cycle number from the database record, defaulting to 1 if not present
          const cycleNumber = (metadata as any).cycleNumber || 1;

          if (!cycleMap.has(cycleNumber)) {
            cycleMap.set(cycleNumber, []);
          }

          cycleMap.get(cycleNumber)!.push({
            reportDate: metadata.reportDate,
            cycleDay: csvData.cycleDay,
            totalCycleDays: csvData.totalCycleDays,
            csvData,
            uploadUrl: (enhancedRecord as any).uploadUrl,
            cycleNumber: cycleNumber,
          });

        } catch (error) {
          secureLogger.warn(`⚠️ Error processing report ${metadata._id}:`, error);
          // Continue processing other reports instead of failing completely
        }
      }

      if (cycleMap.size === 0) {
        secureLogger.log(`❌ No valid cycle data found for player: ${playerId}`);
        return [];
      }

      // ✅ Convert to CycleHistoryData format
      const cycleHistory: CycleHistoryData[] = Array.from(cycleMap.entries()).map(([cycleNumber, cycleReports]) => {
        // Sort reports by date within each cycle
        cycleReports.sort((a, b) => new Date(a.reportDate).getTime() - new Date(b.reportDate).getTime());

        const firstReport = cycleReports[0];
        const lastReport = cycleReports[cycleReports.length - 1];

        // Calculate cycle start and end dates based on first report
        const firstReportDate = new Date(firstReport.reportDate);
        const cycleStartDate = new Date(firstReportDate);
        cycleStartDate.setDate(firstReportDate.getDate() - (firstReport.cycleDay - 1));

        const cycleEndDate = new Date(cycleStartDate);
        cycleEndDate.setDate(cycleStartDate.getDate() + firstReport.totalCycleDays - 1);

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

      secureLogger.log(`✅ Found ${cycleHistory.length} cycles for player: ${playerId}`);
      return cycleHistory;
    } catch (error) {
      secureLogger.error('❌ Error getting cycle history:', error);

      // Clear the rate limit on error to allow immediate retry if needed
      this.lastCallTime.delete(playerId);

      // Return empty array to prevent crashes
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

      // Use MongoDB aggregation for specific cycle query
      const aggregationPipeline = [
        {
          $match: {
            playerId: playerId,
            uploadUrl: { $exists: true, $ne: null },
            status: 'REGISTERED',
            // ✅ Handle cycle 1 requests for records without cycleNumber
            $or: [
              { cycleNumber: cycleNumber },
              ...(cycleNumber === 1
                ? [{ cycleNumber: { $exists: false } }, { cycleNumber: null }]
                : []),
            ],
          },
        },
        {
          $addFields: {
            // ✅ Treat records without cycleNumber as cycle 1
            cycleNumber: {
              $ifNull: ['$cycleNumber', 1],
            },
          },
        },
        {
          $sort: { reportDate: 1 }, // Chronological order for timeline
        },
        {
          $project: {
            _id: 1,
            playerId: 1,
            reportDate: 1,
            uploadUrl: 1,
            status: 1,
            cycleNumber: 1,
            time: 1,
          },
        },
      ];

      const reportMetadata =
        await this.databaseService.aggregateReportData(aggregationPipeline);

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

      // Use MongoDB aggregation for timeline query
      const aggregationPipeline = [
        {
          $match: {
            playerId: playerId,
            uploadUrl: { $exists: true, $ne: null },
            status: 'REGISTERED',
            // ✅ Handle cycle 1 requests for records without cycleNumber
            $or: [
              { cycleNumber: cycleNumber },
              ...(cycleNumber === 1
                ? [{ cycleNumber: { $exists: false } }, { cycleNumber: null }]
                : []),
            ],
          },
        },
        {
          $addFields: {
            // ✅ Treat records without cycleNumber as cycle 1
            cycleNumber: {
              $ifNull: ['$cycleNumber', 1],
            },
          },
        },
        {
          $sort: { reportDate: 1 }, // Chronological order for timeline
        },
        {
          $project: {
            _id: 1,
            playerId: 1,
            reportDate: 1,
            uploadUrl: 1,
            status: 1,
            cycleNumber: 1,
            time: 1,
          },
        },
      ];

      const reportMetadata =
        await this.databaseService.aggregateReportData(aggregationPipeline);

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
      // Use MongoDB aggregation for fast existence check (any reports, including cycle 1)
      const aggregationPipeline = [
        {
          $match: {
            playerId: playerId,
            // ✅ Check for any reports - cycle number can be missing (treated as cycle 1)
          },
        },
        {
          $limit: 1, // Just check if any record exists
        },
        {
          $project: {
            _id: 1,
          },
        },
      ];

      const result =
        await this.databaseService.aggregateReportData(aggregationPipeline);
      return result && result.length > 0;
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
      // Use MongoDB aggregation to get unique cycle numbers efficiently
      const aggregationPipeline = [
        {
          $match: {
            playerId: playerId,
            status: 'REGISTERED',
          },
        },
        {
          $addFields: {
            // ✅ Treat records without cycleNumber as cycle 1
            cycleNumber: {
              $ifNull: ['$cycleNumber', 1],
            },
          },
        },
        {
          $group: {
            _id: '$cycleNumber',
            cycleNumber: { $first: '$cycleNumber' },
            firstReport: { $min: '$reportDate' },
            lastReport: { $max: '$reportDate' },
          },
        },
        {
          $sort: { cycleNumber: -1 }, // Most recent cycles first
        },
        {
          $project: {
            _id: 0,
            cycleNumber: 1,
            firstReport: 1,
            lastReport: 1,
          },
        },
      ];

      const cycleData =
        await this.databaseService.aggregateReportData(aggregationPipeline);

      if (!cycleData || cycleData.length === 0) {
        secureLogger.log(`❌ No cycles found for player: ${playerId}`);
        return [];
      }

      // Create minimal cycle data from aggregation results - no CSV parsing
      const cycles: CycleHistoryData[] = cycleData.map((cycle) => ({
        cycleNumber: cycle.cycleNumber,
        startDate: cycle.firstReport || new Date().toISOString(),
        endDate: cycle.lastReport || new Date().toISOString(),
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
      }));

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
