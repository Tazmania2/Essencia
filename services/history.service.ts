import { 
  CycleHistoryData, 
  ProgressDataPoint, 
  EssenciaReportRecord 
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
   * Get cycle history for a player, excluding current cycle
   */
  async getPlayerCycleHistory(playerId: string): Promise<CycleHistoryData[]> {
    try {
      secureLogger.log('🔍 Getting cycle history for player:', playerId);

      // Get all cycle data for the player
      const pipeline = [
        {
          $match: {
            playerId: playerId,
            cycleNumber: { $exists: true, $ne: null },
            completionStatus: 'completed' // Only show completed cycles
          }
        },
        {
          $group: {
            _id: '$cycleNumber',
            cycleNumber: { $first: '$cycleNumber' },
            startDate: { $min: '$cycleStartDate' },
            endDate: { $max: '$cycleEndDate' },
            totalDays: { $first: '$totalCycleDays' },
            completionStatus: { $first: '$completionStatus' },
            finalMetrics: {
              $last: {
                primaryGoal: {
                  name: '$primaryGoalName',
                  percentage: '$primaryGoalPercentage',
                  target: '$primaryGoalTarget',
                  current: '$primaryGoalCurrent',
                  unit: '$primaryGoalUnit',
                  boostActive: false
                },
                secondaryGoal1: {
                  name: '$secondaryGoal1Name',
                  percentage: '$secondaryGoal1Percentage',
                  target: '$secondaryGoal1Target',
                  current: '$secondaryGoal1Current',
                  unit: '$secondaryGoal1Unit',
                  boostActive: '$secondaryGoal1BoostActive'
                },
                secondaryGoal2: {
                  name: '$secondaryGoal2Name',
                  percentage: '$secondaryGoal2Percentage',
                  target: '$secondaryGoal2Target',
                  current: '$secondaryGoal2Current',
                  unit: '$secondaryGoal2Unit',
                  boostActive: '$secondaryGoal2BoostActive'
                }
              }
            },
            progressTimeline: {
              $push: {
                date: '$reportDate',
                dayInCycle: '$currentCycleDay',
                uploadSequence: '$uploadSequence',
                metrics: {
                  primaryGoal: '$primaryGoalPercentage',
                  secondaryGoal1: '$secondaryGoal1Percentage',
                  secondaryGoal2: '$secondaryGoal2Percentage'
                }
              }
            }
          }
        },
        {
          $sort: { cycleNumber: -1 } // Most recent first
        }
      ];

      const results = await this.databaseService.aggregateReportData(pipeline);
      
      const cycleHistory: CycleHistoryData[] = results.map(result => ({
        cycleNumber: result.cycleNumber,
        startDate: result.startDate,
        endDate: result.endDate,
        totalDays: result.totalDays || 21,
        completionStatus: result.completionStatus || 'completed',
        finalMetrics: result.finalMetrics || {
          primaryGoal: { name: 'Unknown', percentage: 0, target: 0, current: 0, unit: '', boostActive: false },
          secondaryGoal1: { name: 'Unknown', percentage: 0, target: 0, current: 0, unit: '', boostActive: false },
          secondaryGoal2: { name: 'Unknown', percentage: 0, target: 0, current: 0, unit: '', boostActive: false }
        },
        progressTimeline: result.progressTimeline || []
      }));

      secureLogger.log(`✅ Found ${cycleHistory.length} completed cycles for player:`, playerId);
      return cycleHistory;

    } catch (error) {
      const apiError = errorHandlerService.handleDataProcessingError(
        error as Error,
        'getPlayerCycleHistory'
      );
      errorHandlerService.logError(apiError, 'HistoryService.getPlayerCycleHistory');
      throw apiError;
    }
  }

  /**
   * Get detailed data for a specific cycle
   */
  async getCycleDetails(playerId: string, cycleNumber: number): Promise<CycleHistoryData | null> {
    try {
      secureLogger.log(`🔍 Getting cycle details for player: ${playerId}, cycle: ${cycleNumber}`);

      const pipeline = [
        {
          $match: {
            playerId: playerId,
            cycleNumber: cycleNumber
          }
        },
        {
          $group: {
            _id: '$cycleNumber',
            cycleNumber: { $first: '$cycleNumber' },
            startDate: { $min: '$cycleStartDate' },
            endDate: { $max: '$cycleEndDate' },
            totalDays: { $first: '$totalCycleDays' },
            completionStatus: { $first: '$completionStatus' },
            finalMetrics: {
              $last: {
                primaryGoal: {
                  name: '$primaryGoalName',
                  percentage: '$primaryGoalPercentage',
                  target: '$primaryGoalTarget',
                  current: '$primaryGoalCurrent',
                  unit: '$primaryGoalUnit',
                  boostActive: false
                },
                secondaryGoal1: {
                  name: '$secondaryGoal1Name',
                  percentage: '$secondaryGoal1Percentage',
                  target: '$secondaryGoal1Target',
                  current: '$secondaryGoal1Current',
                  unit: '$secondaryGoal1Unit',
                  boostActive: '$secondaryGoal1BoostActive'
                },
                secondaryGoal2: {
                  name: '$secondaryGoal2Name',
                  percentage: '$secondaryGoal2Percentage',
                  target: '$secondaryGoal2Target',
                  current: '$secondaryGoal2Current',
                  unit: '$secondaryGoal2Unit',
                  boostActive: '$secondaryGoal2BoostActive'
                }
              }
            },
            progressTimeline: {
              $push: {
                date: '$reportDate',
                dayInCycle: '$currentCycleDay',
                uploadSequence: '$uploadSequence',
                metrics: {
                  primaryGoal: '$primaryGoalPercentage',
                  secondaryGoal1: '$secondaryGoal1Percentage',
                  secondaryGoal2: '$secondaryGoal2Percentage'
                }
              }
            }
          }
        }
      ];

      const results = await this.databaseService.aggregateReportData(pipeline);
      
      if (results.length === 0) {
        secureLogger.log(`❌ No cycle details found for player: ${playerId}, cycle: ${cycleNumber}`);
        return null;
      }

      const result = results[0];
      const cycleDetails: CycleHistoryData = {
        cycleNumber: result.cycleNumber,
        startDate: result.startDate,
        endDate: result.endDate,
        totalDays: result.totalDays || 21,
        completionStatus: result.completionStatus || 'completed',
        finalMetrics: result.finalMetrics || {
          primaryGoal: { name: 'Unknown', percentage: 0, target: 0, current: 0, unit: '', boostActive: false },
          secondaryGoal1: { name: 'Unknown', percentage: 0, target: 0, current: 0, unit: '', boostActive: false },
          secondaryGoal2: { name: 'Unknown', percentage: 0, target: 0, current: 0, unit: '', boostActive: false }
        },
        progressTimeline: result.progressTimeline || []
      };

      secureLogger.log(`✅ Found cycle details for player: ${playerId}, cycle: ${cycleNumber}`);
      return cycleDetails;

    } catch (error) {
      const apiError = errorHandlerService.handleDataProcessingError(
        error as Error,
        'getCycleDetails'
      );
      errorHandlerService.logError(apiError, 'HistoryService.getCycleDetails');
      throw apiError;
    }
  }

  /**
   * Get progress timeline for a specific cycle
   */
  async getCycleProgressTimeline(playerId: string, cycleNumber: number): Promise<ProgressDataPoint[]> {
    try {
      secureLogger.log(`🔍 Getting progress timeline for player: ${playerId}, cycle: ${cycleNumber}`);

      const pipeline = [
        {
          $match: {
            playerId: playerId,
            cycleNumber: cycleNumber
          }
        },
        {
          $project: {
            date: '$reportDate',
            dayInCycle: '$currentCycleDay',
            uploadSequence: '$uploadSequence',
            metrics: {
              primaryGoal: '$primaryGoalPercentage',
              secondaryGoal1: '$secondaryGoal1Percentage',
              secondaryGoal2: '$secondaryGoal2Percentage'
            }
          }
        },
        {
          $sort: { uploadSequence: 1 } // Chronological order
        }
      ];

      const results = await this.databaseService.aggregateReportData(pipeline);
      
      const timeline: ProgressDataPoint[] = results.map(result => ({
        date: result.date,
        dayInCycle: result.dayInCycle || 1,
        uploadSequence: result.uploadSequence || 1,
        metrics: result.metrics || {}
      }));

      secureLogger.log(`✅ Found ${timeline.length} progress points for player: ${playerId}, cycle: ${cycleNumber}`);
      return timeline;

    } catch (error) {
      const apiError = errorHandlerService.handleDataProcessingError(
        error as Error,
        'getCycleProgressTimeline'
      );
      errorHandlerService.logError(apiError, 'HistoryService.getCycleProgressTimeline');
      throw apiError;
    }
  }

  /**
   * Check if a player has historical data
   */
  async hasHistoricalData(playerId: string): Promise<boolean> {
    try {
      const cycles = await this.getPlayerCycles(playerId);
      // Allow access if there's any cycle data (including current cycle)
      return cycles.length > 0;
    } catch (error) {
      secureLogger.warn(`Error checking historical data for player: ${playerId}`, error);
      // If there's an error, allow access anyway - the history page will handle empty data gracefully
      return true;
    }
  }

  /**
   * Get all cycles for a player (including current)
   */
  async getPlayerCycles(playerId: string): Promise<CycleHistoryData[]> {
    try {
      const pipeline = [
        {
          $match: {
            playerId: playerId,
            cycleNumber: { $exists: true, $ne: null }
          }
        },
        {
          $group: {
            _id: '$cycleNumber',
            cycleNumber: { $first: '$cycleNumber' },
            startDate: { $min: '$cycleStartDate' },
            endDate: { $max: '$cycleEndDate' },
            totalDays: { $first: '$totalCycleDays' },
            completionStatus: { $first: '$completionStatus' },
            finalMetrics: {
              $last: {
                primaryGoal: {
                  name: '$primaryGoalName',
                  percentage: '$primaryGoalPercentage',
                  target: '$primaryGoalTarget',
                  current: '$primaryGoalCurrent',
                  unit: '$primaryGoalUnit',
                  boostActive: false
                },
                secondaryGoal1: {
                  name: '$secondaryGoal1Name',
                  percentage: '$secondaryGoal1Percentage',
                  target: '$secondaryGoal1Target',
                  current: '$secondaryGoal1Current',
                  unit: '$secondaryGoal1Unit',
                  boostActive: '$secondaryGoal1BoostActive'
                },
                secondaryGoal2: {
                  name: '$secondaryGoal2Name',
                  percentage: '$secondaryGoal2Percentage',
                  target: '$secondaryGoal2Target',
                  current: '$secondaryGoal2Current',
                  unit: '$secondaryGoal2Unit',
                  boostActive: '$secondaryGoal2BoostActive'
                }
              }
            },
            progressTimeline: {
              $push: {
                date: '$reportDate',
                dayInCycle: '$currentCycleDay',
                uploadSequence: '$uploadSequence',
                metrics: {
                  primaryGoal: '$primaryGoalPercentage',
                  secondaryGoal1: '$secondaryGoal1Percentage',
                  secondaryGoal2: '$secondaryGoal2Percentage'
                }
              }
            }
          }
        },
        {
          $sort: { cycleNumber: -1 }
        }
      ];

      const results = await this.databaseService.aggregateReportData(pipeline);
      
      return results.map(result => ({
        cycleNumber: result.cycleNumber,
        startDate: result.startDate,
        endDate: result.endDate,
        totalDays: result.totalDays || 21,
        completionStatus: result.completionStatus || 'in_progress',
        finalMetrics: result.finalMetrics || {
          primaryGoal: { name: 'Unknown', percentage: 0, target: 0, current: 0, unit: '', boostActive: false },
          secondaryGoal1: { name: 'Unknown', percentage: 0, target: 0, current: 0, unit: '', boostActive: false },
          secondaryGoal2: { name: 'Unknown', percentage: 0, target: 0, current: 0, unit: '', boostActive: false }
        },
        progressTimeline: result.progressTimeline || []
      }));

    } catch (error) {
      const apiError = errorHandlerService.handleDataProcessingError(
        error as Error,
        'getPlayerCycles'
      );
      errorHandlerService.logError(apiError, 'HistoryService.getPlayerCycles');
      throw apiError;
    }
  }

  /**
   * Get summary statistics for a player's cycle history
   */
  async getCycleSummaryStats(playerId: string): Promise<CycleSummaryStats> {
    try {
      const cycles = await this.getPlayerCycleHistory(playerId);
      
      if (cycles.length === 0) {
        return {
          totalCycles: 0,
          averagePerformance: 0,
          bestCycle: null,
          worstCycle: null,
          improvementTrend: 'stable'
        };
      }

      // Calculate average performance across all goals
      const performances = cycles.map(cycle => {
        const avg = (
          cycle.finalMetrics.primaryGoal.percentage +
          cycle.finalMetrics.secondaryGoal1.percentage +
          cycle.finalMetrics.secondaryGoal2.percentage
        ) / 3;
        return { cycleNumber: cycle.cycleNumber, performance: avg };
      });

      const averagePerformance = performances.reduce((sum, p) => sum + p.performance, 0) / performances.length;
      
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
        
        const firstHalfAvg = firstHalf.reduce((sum, p) => sum + p.performance, 0) / firstHalf.length;
        const secondHalfAvg = secondHalf.reduce((sum, p) => sum + p.performance, 0) / secondHalf.length;
        
        const difference = secondHalfAvg - firstHalfAvg;
        if (difference > 5) improvementTrend = 'improving';
        else if (difference < -5) improvementTrend = 'declining';
      }

      return {
        totalCycles: cycles.length,
        averagePerformance: Math.round(averagePerformance),
        bestCycle,
        worstCycle,
        improvementTrend
      };

    } catch (error) {
      const apiError = errorHandlerService.handleDataProcessingError(
        error as Error,
        'getCycleSummaryStats'
      );
      errorHandlerService.logError(apiError, 'HistoryService.getCycleSummaryStats');
      throw apiError;
    }
  }

  /**
   * Compare two cycles for a player
   */
  async compareCycles(playerId: string, cycle1Number: number, cycle2Number: number): Promise<CycleComparison> {
    try {
      const [cycle1Data, cycle2Data] = await Promise.all([
        this.getCycleDetails(playerId, cycle1Number),
        this.getCycleDetails(playerId, cycle2Number)
      ]);

      const improvements = {
        primaryGoal: 0,
        secondaryGoal1: 0,
        secondaryGoal2: 0
      };

      let summary = 'Não foi possível comparar os ciclos.';

      if (cycle1Data && cycle2Data) {
        improvements.primaryGoal = cycle2Data.finalMetrics.primaryGoal.percentage - cycle1Data.finalMetrics.primaryGoal.percentage;
        improvements.secondaryGoal1 = cycle2Data.finalMetrics.secondaryGoal1.percentage - cycle1Data.finalMetrics.secondaryGoal1.percentage;
        improvements.secondaryGoal2 = cycle2Data.finalMetrics.secondaryGoal2.percentage - cycle1Data.finalMetrics.secondaryGoal2.percentage;

        const totalImprovement = improvements.primaryGoal + improvements.secondaryGoal1 + improvements.secondaryGoal2;
        
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
        summary
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
   */
  async getPlayerCycleHistoryWithCompatibility(playerId: string): Promise<EssenciaReportRecord[]> {
    try {
      // Get all records for the player, including those without cycle information
      const filter = { playerId: playerId };
      const records = await this.databaseService.getReportData(filter);
      
      // Sort by report date to maintain chronological order
      records.sort((a, b) => new Date(a.reportDate).getTime() - new Date(b.reportDate).getTime());
      
      return records;
    } catch (error) {
      const apiError = errorHandlerService.handleDataProcessingError(
        error as Error,
        'getPlayerCycleHistoryWithCompatibility'
      );
      errorHandlerService.logError(apiError, 'HistoryService.getPlayerCycleHistoryWithCompatibility');
      throw apiError;
    }
  }
}

// Export singleton instance
export const historyService = HistoryService.getInstance();