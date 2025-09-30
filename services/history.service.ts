import {
  CycleHistoryData,
  ProgressDataPoint,
  CycleInfo,
  EssenciaReportRecord,
  ApiError,
  ErrorType
} from '../types';
import { FunifierDatabaseService } from './funifier-database.service';
import { backwardCompatibilityService, MixedDataResult } from '../utils/backward-compatibility';
import { secureLogger } from '../utils/logger';
import { errorHandlerService } from './error-handler.service';

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
   * Get cycle history for a specific player with backward compatibility
   * Requirements: 2.1, 2.2, 2.3, 10.2, 10.3, 10.4
   */
  public async getPlayerCycleHistory(playerId: string): Promise<CycleHistoryData[]> {
    try {
      // Input validation
      if (!playerId || typeof playerId !== 'string' || playerId.trim().length === 0) {
        throw new ApiError({
          type: ErrorType.VALIDATION_ERROR,
          message: 'Player ID is required and must be a non-empty string',
          details: { playerId },
          timestamp: new Date()
        });
      }

      secureLogger.info('Getting cycle history for player', { playerId });

      const cycleHistory = await this.databaseService.getPlayerCycleHistory(playerId);
      
      if (!Array.isArray(cycleHistory)) {
        secureLogger.warn('Database returned non-array cycle history', { playerId, type: typeof cycleHistory });
        return [];
      }

      // Filter out current cycle (in progress) with error handling
      const completedCycles = cycleHistory.filter(cycle => {
        try {
          return cycle && cycle.completionStatus === 'completed';
        } catch (filterError) {
          secureLogger.warn('Invalid cycle data encountered during filtering', { 
            playerId, 
            cycle: cycle,
            error: filterError 
          });
          return false;
        }
      });

      // Sort by cycle number descending (most recent first) with error handling
      completedCycles.sort((a, b) => {
        try {
          const cycleA = typeof a.cycleNumber === 'number' ? a.cycleNumber : 0;
          const cycleB = typeof b.cycleNumber === 'number' ? b.cycleNumber : 0;
          return cycleB - cycleA;
        } catch (sortError) {
          secureLogger.warn('Error sorting cycles', { playerId, error: sortError });
          return 0;
        }
      });

      secureLogger.info('Retrieved cycle history', { 
        playerId, 
        totalCycles: completedCycles.length,
        cycleNumbers: completedCycles.map(c => c.cycleNumber).slice(0, 5) // Log first 5 for debugging
      });

      return completedCycles;
    } catch (error) {
      const handledError = errorHandlerService.handleDataProcessingError(error, 'getPlayerCycleHistory');
      await errorHandlerService.logError(handledError, `getPlayerCycleHistory:${playerId}`);
      
      secureLogger.error('Failed to get player cycle history', { 
        playerId, 
        error: handledError.message,
        errorType: handledError.type 
      });
      
      throw handledError;
    }
  }

  /**
   * Get cycle history with backward compatibility handling for mixed data
   * Requirements: 10.2, 10.3, 10.4
   */
  public async getPlayerCycleHistoryWithCompatibility(playerId: string): Promise<MixedDataResult<CycleHistoryData[]>> {
    try {
      // Input validation
      if (!playerId || typeof playerId !== 'string' || playerId.trim().length === 0) {
        throw new ApiError({
          type: ErrorType.VALIDATION_ERROR,
          message: 'Player ID is required and must be a non-empty string',
          details: { playerId },
          timestamp: new Date()
        });
      }

      secureLogger.info('Getting cycle history with compatibility handling', { playerId });

      // Get all records for the player (both cycle-aware and legacy)
      const allRecords = await this.databaseService.getReportData({ playerId });
      
      if (!Array.isArray(allRecords)) {
        secureLogger.warn('Database returned non-array records', { playerId, type: typeof allRecords });
        return {
          data: [],
          compatibility: {
            hasCycleInfo: false,
            isLegacyData: false,
            migrationStatus: 'error',
            dataQuality: 'corrupted'
          },
          warnings: ['Database returned invalid data format']
        };
      }

      if (allRecords.length === 0) {
        secureLogger.info('No records found for player', { playerId });
        return {
          data: [],
          compatibility: {
            hasCycleInfo: false,
            isLegacyData: false,
            migrationStatus: 'not_applicable',
            dataQuality: 'minimal'
          },
          warnings: ['No historical data available for this player']
        };
      }

      // Use backward compatibility service to process mixed data with error handling
      let result: MixedDataResult<CycleHistoryData[]>;
      try {
        result = backwardCompatibilityService.extractCycleHistoryFromMixedData(allRecords);
      } catch (compatibilityError) {
        secureLogger.error('Backward compatibility processing failed', { 
          playerId, 
          recordCount: allRecords.length,
          error: compatibilityError 
        });
        
        // Return safe fallback result
        return {
          data: [],
          compatibility: {
            hasCycleInfo: false,
            isLegacyData: true,
            migrationStatus: 'failed',
            dataQuality: 'corrupted'
          },
          warnings: [
            'Failed to process historical data due to compatibility issues',
            'Some data may be corrupted or in an unexpected format'
          ]
        };
      }

      // Filter out current cycle (in progress) from the processed data with error handling
      const completedCycles = result.data.filter(cycle => {
        try {
          return cycle && cycle.completionStatus === 'completed';
        } catch (filterError) {
          secureLogger.warn('Invalid cycle data during compatibility filtering', { 
            playerId, 
            cycle: cycle,
            error: filterError 
          });
          return false;
        }
      });

      secureLogger.info('Retrieved cycle history with compatibility', { 
        playerId, 
        totalRecords: allRecords.length,
        totalCycles: completedCycles.length,
        warnings: result.warnings.length,
        dataQuality: result.compatibility.dataQuality,
        migrationStatus: result.compatibility.migrationStatus
      });

      return {
        ...result,
        data: completedCycles
      };
    } catch (error) {
      const handledError = errorHandlerService.handleDataProcessingError(error, 'getPlayerCycleHistoryWithCompatibility');
      await errorHandlerService.logError(handledError, `getPlayerCycleHistoryWithCompatibility:${playerId}`);
      
      secureLogger.error('Failed to get player cycle history with compatibility', { 
        playerId, 
        error: handledError.message,
        errorType: handledError.type 
      });
      
      throw handledError;
    }
  }

  /**
   * Get detailed information for a specific cycle
   * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
   */
  public async getCycleDetails(playerId: string, cycleNumber: number): Promise<CycleHistoryData | null> {
    try {
      // Input validation
      if (!playerId || typeof playerId !== 'string' || playerId.trim().length === 0) {
        throw new ApiError({
          type: ErrorType.VALIDATION_ERROR,
          message: 'Player ID is required and must be a non-empty string',
          details: { playerId, cycleNumber },
          timestamp: new Date()
        });
      }

      if (!Number.isInteger(cycleNumber) || cycleNumber < 1) {
        throw new ApiError({
          type: ErrorType.VALIDATION_ERROR,
          message: 'Cycle number must be a positive integer',
          details: { playerId, cycleNumber },
          timestamp: new Date()
        });
      }

      secureLogger.info('Getting cycle details', { playerId, cycleNumber });

      const cycleDetails = await this.databaseService.getCycleDetails(playerId, cycleNumber);
      
      if (!cycleDetails) {
        secureLogger.info('No cycle details found', { playerId, cycleNumber });
        return null;
      }

      // Validate cycle details structure
      if (!this.isValidCycleHistoryData(cycleDetails)) {
        secureLogger.warn('Invalid cycle details structure returned from database', { 
          playerId, 
          cycleNumber,
          hasProgressTimeline: !!cycleDetails.progressTimeline,
          hasFinalMetrics: !!cycleDetails.finalMetrics
        });
        
        throw new ApiError({
          type: ErrorType.DATA_PROCESSING_ERROR,
          message: 'Cycle details have invalid structure',
          details: { playerId, cycleNumber },
          timestamp: new Date()
        });
      }

      secureLogger.info('Retrieved cycle details', { 
        playerId, 
        cycleNumber,
        totalDays: cycleDetails.totalDays,
        progressPoints: cycleDetails.progressTimeline?.length || 0,
        completionStatus: cycleDetails.completionStatus
      });

      return cycleDetails;
    } catch (error) {
      const handledError = errorHandlerService.handleDataProcessingError(error, 'getCycleDetails');
      await errorHandlerService.logError(handledError, `getCycleDetails:${playerId}:${cycleNumber}`);
      
      secureLogger.error('Failed to get cycle details', { 
        playerId, 
        cycleNumber, 
        error: handledError.message,
        errorType: handledError.type 
      });
      
      throw handledError;
    }
  }

  /**
   * Get progress timeline for a specific cycle
   * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6
   */
  public async getCycleProgressTimeline(playerId: string, cycleNumber: number): Promise<ProgressDataPoint[]> {
    try {
      secureLogger.info('Getting cycle progress timeline', { playerId, cycleNumber });

      const timeline = await this.databaseService.getCycleProgressTimeline(playerId, cycleNumber);
      
      // Sort by upload sequence to ensure chronological order
      timeline.sort((a, b) => a.uploadSequence - b.uploadSequence);

      secureLogger.info('Retrieved progress timeline', { 
        playerId, 
        cycleNumber,
        dataPoints: timeline.length
      });

      return timeline;
    } catch (error) {
      secureLogger.error('Failed to get cycle progress timeline', { playerId, cycleNumber, error });
      throw new ApiError({
        type: ErrorType.DATA_PROCESSING_ERROR,
        message: `Failed to retrieve progress timeline for player ${playerId}, cycle ${cycleNumber}`,
        details: error,
        timestamp: new Date()
      });
    }
  }

  /**
   * Get all available cycles for a player (including active ones for admin purposes)
   */
  public async getPlayerCycles(playerId: string): Promise<CycleInfo[]> {
    try {
      secureLogger.info('Getting player cycles', { playerId });

      const cycles = await this.databaseService.getPlayerCycles(playerId);
      
      secureLogger.info('Retrieved player cycles', { 
        playerId, 
        totalCycles: cycles.length 
      });

      return cycles;
    } catch (error) {
      secureLogger.error('Failed to get player cycles', { playerId, error });
      throw new ApiError({
        type: ErrorType.DATA_PROCESSING_ERROR,
        message: `Failed to retrieve cycles for player ${playerId}`,
        details: error,
        timestamp: new Date()
      });
    }
  }

  /**
   * Check if a player has any historical data
   * Requirements: 2.4
   */
  public async hasHistoricalData(playerId: string): Promise<boolean> {
    try {
      // Input validation with graceful handling
      if (!playerId || typeof playerId !== 'string' || playerId.trim().length === 0) {
        secureLogger.warn('Invalid player ID provided to hasHistoricalData', { playerId });
        return false;
      }

      const cycles = await this.getPlayerCycles(playerId);
      
      if (!Array.isArray(cycles)) {
        secureLogger.warn('getPlayerCycles returned non-array', { playerId, type: typeof cycles });
        return false;
      }

      // Check for completed cycles (excluding current/active cycle) with error handling
      const completedCycles = cycles.filter(cycle => {
        try {
          return cycle && typeof cycle.isCompleted === 'boolean' && cycle.isCompleted;
        } catch (filterError) {
          secureLogger.warn('Invalid cycle data during historical check', { 
            playerId, 
            cycle: cycle,
            error: filterError 
          });
          return false;
        }
      });
      
      const hasHistory = completedCycles.length > 0;
      secureLogger.debug('Historical data check completed', { 
        playerId, 
        totalCycles: cycles.length,
        completedCycles: completedCycles.length,
        hasHistory 
      });
      
      return hasHistory;
    } catch (error) {
      // Log error but don't throw - this is a check function
      const handledError = errorHandlerService.handleDataProcessingError(error, 'hasHistoricalData');
      await errorHandlerService.logError(handledError, `hasHistoricalData:${playerId}`);
      
      secureLogger.error('Failed to check historical data', { 
        playerId, 
        error: handledError.message,
        errorType: handledError.type 
      });
      
      // Return false on error to prevent UI issues
      return false;
    }
  }

  /**
   * Get cycle summary statistics for a player
   */
  public async getCycleSummaryStats(playerId: string): Promise<{
    totalCycles: number;
    completedCycles: number;
    averagePerformance: Record<string, number>;
    bestCycle: number | null;
    latestCycle: number | null;
  }> {
    try {
      const cycles = await this.getPlayerCycleHistory(playerId);
      
      if (cycles.length === 0) {
        return {
          totalCycles: 0,
          completedCycles: 0,
          averagePerformance: {},
          bestCycle: null,
          latestCycle: null
        };
      }

      // Calculate average performance across all metrics
      const metricTotals: Record<string, number> = {};
      const metricCounts: Record<string, number> = {};
      let bestCycleNumber: number | null = null;
      let bestOverallPerformance = 0;

      cycles.forEach(cycle => {
        const metrics = [
          cycle.finalMetrics.primaryGoal,
          cycle.finalMetrics.secondaryGoal1,
          cycle.finalMetrics.secondaryGoal2
        ];

        let cycleTotal = 0;
        let cycleCount = 0;

        metrics.forEach(metric => {
          if (metric.percentage > 0) {
            metricTotals[metric.name] = (metricTotals[metric.name] || 0) + metric.percentage;
            metricCounts[metric.name] = (metricCounts[metric.name] || 0) + 1;
            cycleTotal += metric.percentage;
            cycleCount++;
          }
        });

        const cycleAverage = cycleCount > 0 ? cycleTotal / cycleCount : 0;
        if (cycleAverage > bestOverallPerformance) {
          bestOverallPerformance = cycleAverage;
          bestCycleNumber = cycle.cycleNumber;
        }
      });

      const averagePerformance: Record<string, number> = {};
      Object.keys(metricTotals).forEach(metric => {
        averagePerformance[metric] = metricTotals[metric] / metricCounts[metric];
      });

      return {
        totalCycles: cycles.length,
        completedCycles: cycles.length,
        averagePerformance,
        bestCycle: bestCycleNumber,
        latestCycle: cycles.length > 0 ? cycles[0].cycleNumber : null
      };
    } catch (error) {
      secureLogger.error('Failed to get cycle summary stats', { playerId, error });
      throw new ApiError({
        type: ErrorType.DATA_PROCESSING_ERROR,
        message: `Failed to calculate cycle summary statistics for player ${playerId}`,
        details: error,
        timestamp: new Date()
      });
    }
  }

  /**
   * Get performance comparison between two cycles
   */
  public async compareCycles(
    playerId: string, 
    cycle1: number, 
    cycle2: number
  ): Promise<{
    cycle1Data: CycleHistoryData | null;
    cycle2Data: CycleHistoryData | null;
    comparison: {
      primaryGoal: { cycle1: number; cycle2: number; difference: number };
      secondaryGoal1: { cycle1: number; cycle2: number; difference: number };
      secondaryGoal2: { cycle1: number; cycle2: number; difference: number };
      overall: { cycle1: number; cycle2: number; difference: number };
    };
  }> {
    try {
      // Input validation
      if (!playerId || typeof playerId !== 'string' || playerId.trim().length === 0) {
        throw new ApiError({
          type: ErrorType.VALIDATION_ERROR,
          message: 'Player ID is required and must be a non-empty string',
          details: { playerId, cycle1, cycle2 },
          timestamp: new Date()
        });
      }

      if (!Number.isInteger(cycle1) || cycle1 < 1 || !Number.isInteger(cycle2) || cycle2 < 1) {
        throw new ApiError({
          type: ErrorType.VALIDATION_ERROR,
          message: 'Cycle numbers must be positive integers',
          details: { playerId, cycle1, cycle2 },
          timestamp: new Date()
        });
      }

      if (cycle1 === cycle2) {
        throw new ApiError({
          type: ErrorType.VALIDATION_ERROR,
          message: 'Cannot compare a cycle with itself',
          details: { playerId, cycle1, cycle2 },
          timestamp: new Date()
        });
      }

      secureLogger.info('Comparing cycles', { playerId, cycle1, cycle2 });

      const [cycle1Data, cycle2Data] = await Promise.all([
        this.getCycleDetails(playerId, cycle1),
        this.getCycleDetails(playerId, cycle2)
      ]);

      // Create safe default comparison structure
      const defaultComparison = {
        primaryGoal: { cycle1: 0, cycle2: 0, difference: 0 },
        secondaryGoal1: { cycle1: 0, cycle2: 0, difference: 0 },
        secondaryGoal2: { cycle1: 0, cycle2: 0, difference: 0 },
        overall: { cycle1: 0, cycle2: 0, difference: 0 }
      };

      if (!cycle1Data || !cycle2Data) {
        secureLogger.warn('One or both cycles not found for comparison', { 
          playerId, 
          cycle1, 
          cycle2,
          cycle1Found: !!cycle1Data,
          cycle2Found: !!cycle2Data
        });
        
        return {
          cycle1Data,
          cycle2Data,
          comparison: defaultComparison
        };
      }

      // Safely extract percentages with fallbacks
      const safeGetPercentage = (metric: any): number => {
        try {
          return typeof metric?.percentage === 'number' ? metric.percentage : 0;
        } catch {
          return 0;
        }
      };

      const cycle1Primary = safeGetPercentage(cycle1Data.finalMetrics?.primaryGoal);
      const cycle1Secondary1 = safeGetPercentage(cycle1Data.finalMetrics?.secondaryGoal1);
      const cycle1Secondary2 = safeGetPercentage(cycle1Data.finalMetrics?.secondaryGoal2);

      const cycle2Primary = safeGetPercentage(cycle2Data.finalMetrics?.primaryGoal);
      const cycle2Secondary1 = safeGetPercentage(cycle2Data.finalMetrics?.secondaryGoal1);
      const cycle2Secondary2 = safeGetPercentage(cycle2Data.finalMetrics?.secondaryGoal2);

      const comparison = {
        primaryGoal: {
          cycle1: cycle1Primary,
          cycle2: cycle2Primary,
          difference: cycle2Primary - cycle1Primary
        },
        secondaryGoal1: {
          cycle1: cycle1Secondary1,
          cycle2: cycle2Secondary1,
          difference: cycle2Secondary1 - cycle1Secondary1
        },
        secondaryGoal2: {
          cycle1: cycle1Secondary2,
          cycle2: cycle2Secondary2,
          difference: cycle2Secondary2 - cycle1Secondary2
        },
        overall: {
          cycle1: (cycle1Primary + cycle1Secondary1 + cycle1Secondary2) / 3,
          cycle2: (cycle2Primary + cycle2Secondary1 + cycle2Secondary2) / 3,
          difference: 0
        }
      };

      comparison.overall.difference = comparison.overall.cycle2 - comparison.overall.cycle1;

      secureLogger.info('Cycle comparison completed', { 
        playerId, 
        cycle1, 
        cycle2,
        overallDifference: comparison.overall.difference
      });

      return {
        cycle1Data,
        cycle2Data,
        comparison
      };
    } catch (error) {
      const handledError = errorHandlerService.handleDataProcessingError(error, 'compareCycles');
      await errorHandlerService.logError(handledError, `compareCycles:${playerId}:${cycle1}:${cycle2}`);
      
      secureLogger.error('Failed to compare cycles', { 
        playerId, 
        cycle1, 
        cycle2, 
        error: handledError.message,
        errorType: handledError.type 
      });
      
      throw handledError;
    }
  }

  /**
   * Validate cycle history data structure
   */
  private isValidCycleHistoryData(data: any): data is CycleHistoryData {
    try {
      return !!(
        data &&
        typeof data.cycleNumber === 'number' &&
        typeof data.startDate === 'string' &&
        typeof data.endDate === 'string' &&
        typeof data.totalDays === 'number' &&
        typeof data.completionStatus === 'string' &&
        data.finalMetrics &&
        data.finalMetrics.primaryGoal &&
        data.finalMetrics.secondaryGoal1 &&
        data.finalMetrics.secondaryGoal2 &&
        Array.isArray(data.progressTimeline)
      );
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const historyService = HistoryService.getInstance();