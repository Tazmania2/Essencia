import axios, { AxiosError } from 'axios';
import {
  EssenciaReportRecord,
  ApiError,
  ErrorType,
  FUNIFIER_CONFIG
} from '../types';
import { funifierAuthService } from './funifier-auth.service';

export interface BulkInsertResult {
  insertedCount: number;
  updatedCount: number;
  errors: any[];
}

export interface AggregationPipeline {
  $match?: any;
  $group?: any;
  $sort?: any;
  $limit?: number;
  $skip?: number;
  $project?: any;
  $unwind?: any;
  $lookup?: any;
  [key: string]: any;
}

export class FunifierDatabaseService {
  private static instance: FunifierDatabaseService;

  private constructor() {}

  public static getInstance(): FunifierDatabaseService {
    if (!FunifierDatabaseService.instance) {
      FunifierDatabaseService.instance = new FunifierDatabaseService();
    }
    return FunifierDatabaseService.instance;
  }

  /**
   * Create or update custom collection with bulk data insertion
   */
  public async bulkInsertReportData(data: EssenciaReportRecord[]): Promise<BulkInsertResult> {
    try {
      const token = await funifierAuthService.getAccessToken();
      if (!token) {
        throw new ApiError({
          type: ErrorType.AUTHENTICATION_ERROR,
          message: 'No valid authentication token available',
          timestamp: new Date()
        });
      }

      // Validate data before sending
      this.validateReportData(data);

      const response = await axios.post(
        `${FUNIFIER_CONFIG.BASE_URL}/database/${FUNIFIER_CONFIG.CUSTOM_COLLECTION}/bulk`,
        data,
        {
          headers: {
            ...funifierAuthService.getAuthHeader(),
            'Content-Type': 'application/json',
          },
          timeout: 30000, // 30 second timeout for bulk operations
        }
      );

      return {
        insertedCount: response.data.insertedCount || 0,
        updatedCount: response.data.updatedCount || 0,
        errors: response.data.errors || []
      };
    } catch (error) {
      throw this.handleDatabaseError(error, 'bulk insert');
    }
  }

  /**
   * Insert or update a single record in the custom collection
   */
  public async insertReportRecord(record: EssenciaReportRecord): Promise<EssenciaReportRecord> {
    try {
      const token = await funifierAuthService.getAccessToken();
      if (!token) {
        throw new ApiError({
          type: ErrorType.AUTHENTICATION_ERROR,
          message: 'No valid authentication token available',
          timestamp: new Date()
        });
      }

      // Validate single record
      this.validateReportData([record]);

      const response = await axios.post(
        `${FUNIFIER_CONFIG.BASE_URL}/database/${FUNIFIER_CONFIG.CUSTOM_COLLECTION}`,
        record,
        {
          headers: {
            ...funifierAuthService.getAuthHeader(),
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        }
      );

      return response.data;
    } catch (error) {
      throw this.handleDatabaseError(error, 'insert record');
    }
  }

  /**
   * Retrieve data from custom collection with optional filtering
   */
  public async getReportData(filter?: any): Promise<EssenciaReportRecord[]> {
    try {
      const token = await funifierAuthService.getAccessToken();
      if (!token) {
        throw new ApiError({
          type: ErrorType.AUTHENTICATION_ERROR,
          message: 'No valid authentication token available',
          timestamp: new Date()
        });
      }

      const url = `${FUNIFIER_CONFIG.BASE_URL}/database/${FUNIFIER_CONFIG.CUSTOM_COLLECTION}`;
      const config = {
        headers: {
          ...funifierAuthService.getAuthHeader(),
          'Content-Type': 'application/json',
        },
        timeout: 20000,
        params: filter ? { filter: JSON.stringify(filter) } : undefined
      };

      const response = await axios.get(url, config);

      return response.data || [];
    } catch (error) {
      throw this.handleDatabaseError(error, 'get report data');
    }
  }

  /**
   * Get the latest report data for a specific player
   */
  public async getLatestPlayerReport(playerId: string): Promise<EssenciaReportRecord | null> {
    try {
      const pipeline: AggregationPipeline[] = [
        { $match: { playerId: playerId } },
        { $sort: { reportDate: -1 } },
        { $limit: 1 }
      ];

      const results = await this.aggregateReportData(pipeline);
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      throw this.handleDatabaseError(error, 'get latest player report');
    }
  }

  /**
   * Get report data for all players from a specific date
   */
  public async getReportsByDate(reportDate: string): Promise<EssenciaReportRecord[]> {
    try {
      const filter = { reportDate: reportDate };
      return await this.getReportData(filter);
    } catch (error) {
      throw this.handleDatabaseError(error, 'get reports by date');
    }
  }

  // Static methods removed - use instance methods instead

  /**
   * Perform aggregation queries on the custom collection
   */
  public async aggregateReportData(pipeline: AggregationPipeline[]): Promise<any[]> {
    try {
      const token = await funifierAuthService.getAccessToken();
      if (!token) {
        throw new ApiError({
          type: ErrorType.AUTHENTICATION_ERROR,
          message: 'No valid authentication token available',
          timestamp: new Date()
        });
      }

      // Validate aggregation pipeline
      this.validateAggregationPipeline(pipeline);

      const response = await axios.post(
        `${FUNIFIER_CONFIG.BASE_URL}/database/${FUNIFIER_CONFIG.CUSTOM_COLLECTION}/aggregate?strict=true`,
        pipeline,
        {
          headers: {
            ...funifierAuthService.getAuthHeader(),
            'Content-Type': 'application/json',
          },
          timeout: 25000, // 25 second timeout for aggregation
        }
      );

      return response.data || [];
    } catch (error) {
      throw this.handleDatabaseError(error, 'aggregation query');
    }
  }

  /**
   * Compare current report data with stored data for a player
   */
  public async comparePlayerData(playerId: string, newData: Partial<EssenciaReportRecord>): Promise<{
    hasChanges: boolean;
    differences: Record<string, { old: any; new: any }>;
    storedData: EssenciaReportRecord | null;
  }> {
    try {
      const storedData = await this.getLatestPlayerReport(playerId);
      
      if (!storedData) {
        return {
          hasChanges: true,
          differences: { all: { old: null, new: newData } },
          storedData: null
        };
      }

      const differences: Record<string, { old: any; new: any }> = {};
      let hasChanges = false;

      // Compare relevant fields
      const fieldsToCompare = ['atividade', 'reaisPorAtivo', 'faturamento', 'multimarcasPorAtivo', 'currentCycleDay', 'totalCycleDays'];
      
      for (const field of fieldsToCompare) {
        const oldValue = storedData[field as keyof EssenciaReportRecord];
        const newValue = newData[field as keyof EssenciaReportRecord];
        
        if (oldValue !== newValue && newValue !== undefined) {
          differences[field] = { old: oldValue, new: newValue };
          hasChanges = true;
        }
      }

      return {
        hasChanges,
        differences,
        storedData
      };
    } catch (error) {
      throw this.handleDatabaseError(error, 'compare player data');
    }
  }

  /**
   * Get collection data with optional filtering
   */
  public async getCollectionData(filter?: any): Promise<any[]> {
    try {
      const token = await funifierAuthService.getAccessToken();
      if (!token) {
        throw new ApiError({
          type: ErrorType.AUTHENTICATION_ERROR,
          message: 'No valid authentication token available',
          timestamp: new Date()
        });
      }

      const url = `${FUNIFIER_CONFIG.BASE_URL}/database/${FUNIFIER_CONFIG.CUSTOM_COLLECTION}`;
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: 20000,
        params: filter ? { filter: JSON.stringify(filter) } : undefined
      };

      const response = await axios.get(url, config);
      return response.data || [];
    } catch (error) {
      throw this.handleDatabaseError(error, 'get collection data');
    }
  }

  /**
   * Aggregate collection data
   */
  public async aggregateCollectionData(pipeline: AggregationPipeline[]): Promise<any[]> {
    try {
      const token = await funifierAuthService.getAccessToken();
      if (!token) {
        throw new ApiError({
          type: ErrorType.AUTHENTICATION_ERROR,
          message: 'No valid authentication token available',
          timestamp: new Date()
        });
      }

      const response = await axios.post(
        `${FUNIFIER_CONFIG.BASE_URL}/database/${FUNIFIER_CONFIG.CUSTOM_COLLECTION}/aggregate?strict=true`,
        pipeline,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          timeout: 25000,
        }
      );

      return response.data || [];
    } catch (error) {
      throw this.handleDatabaseError(error, 'aggregate collection data');
    }
  }

  /**
   * Get aggregated statistics for all players
   */
  public async getPlayerStatistics(): Promise<{
    totalPlayers: number;
    averagePoints: number;
    teamDistribution: Record<string, number>;
    latestReportDate: string | null;
  }> {
    try {
      const pipeline: AggregationPipeline[] = [
        {
          $group: {
            _id: null,
            totalPlayers: { $sum: 1 },
            avgAtividade: { $avg: '$atividade' },
            avgReaisPorAtivo: { $avg: '$reaisPorAtivo' },
            avgFaturamento: { $avg: '$faturamento' },
            avgMultimarcas: { $avg: '$multimarcasPorAtivo' },
            latestDate: { $max: '$reportDate' },
            teams: { $push: '$team' }
          }
        }
      ];

      const teamPipeline: AggregationPipeline[] = [
        {
          $group: {
            _id: '$team',
            count: { $sum: 1 }
          }
        }
      ];

      const [statsResult, teamResult] = await Promise.all([
        this.aggregateReportData(pipeline),
        this.aggregateReportData(teamPipeline)
      ]);

      const stats = statsResult[0] || {};
      const teamDistribution: Record<string, number> = {};
      
      teamResult.forEach(team => {
        if (team._id) {
          teamDistribution[team._id] = team.count;
        }
      });

      return {
        totalPlayers: stats.totalPlayers || 0,
        averagePoints: Math.round((stats.avgAtividade + stats.avgReaisPorAtivo + stats.avgFaturamento + stats.avgMultimarcas) / 4) || 0,
        teamDistribution,
        latestReportDate: stats.latestDate || null
      };
    } catch (error) {
      throw this.handleDatabaseError(error, 'get player statistics');
    }
  }

  /**
   * Delete records from the custom collection
   */
  public async deleteReportData(filter: any): Promise<{ deletedCount: number }> {
    try {
      const token = await funifierAuthService.getAccessToken();
      if (!token) {
        throw new ApiError({
          type: ErrorType.AUTHENTICATION_ERROR,
          message: 'No valid authentication token available',
          timestamp: new Date()
        });
      }

      const response = await axios.delete(
        `${FUNIFIER_CONFIG.BASE_URL}/database/${FUNIFIER_CONFIG.CUSTOM_COLLECTION}`,
        {
          headers: {
            ...funifierAuthService.getAuthHeader(),
            'Content-Type': 'application/json',
          },
          data: filter,
          timeout: 15000,
        }
      );

      return {
        deletedCount: response.data.deletedCount || 0
      };
    } catch (error) {
      throw this.handleDatabaseError(error, 'delete report data');
    }
  }

  /**
   * Validate report data structure
   */
  private validateReportData(data: EssenciaReportRecord[]): void {
    if (!Array.isArray(data)) {
      throw new ApiError({
        type: ErrorType.VALIDATION_ERROR,
        message: 'Report data must be an array',
        timestamp: new Date()
      });
    }

    if (data.length === 0) {
      throw new ApiError({
        type: ErrorType.VALIDATION_ERROR,
        message: 'Report data array cannot be empty',
        timestamp: new Date()
      });
    }

    for (let i = 0; i < data.length; i++) {
      const record = data[i];
      
      // Check required fields
      if (!record._id || !record.playerId || !record.playerName || !record.team || !record.reportDate) {
        throw new ApiError({
          type: ErrorType.VALIDATION_ERROR,
          message: `Missing required fields in record ${i}`,
          details: { record, missingFields: this.getMissingFields(record) },
          timestamp: new Date()
        });
      }

      // Validate date format
      if (!this.isValidDateString(record.reportDate)) {
        throw new ApiError({
          type: ErrorType.VALIDATION_ERROR,
          message: `Invalid date format in record ${i}: ${record.reportDate}`,
          details: { record },
          timestamp: new Date()
        });
      }

      // Validate numeric fields
      const numericFields = ['atividade', 'reaisPorAtivo', 'faturamento', 'multimarcasPorAtivo', 'currentCycleDay', 'totalCycleDays'];
      for (const field of numericFields) {
        const value = record[field as keyof EssenciaReportRecord];
        if (value !== undefined && (typeof value !== 'number' || isNaN(value))) {
          throw new ApiError({
            type: ErrorType.VALIDATION_ERROR,
            message: `Invalid numeric value for ${field} in record ${i}: ${value}`,
            details: { record },
            timestamp: new Date()
          });
        }
      }
    }
  }

  /**
   * Validate aggregation pipeline
   */
  private validateAggregationPipeline(pipeline: AggregationPipeline[]): void {
    if (!Array.isArray(pipeline)) {
      throw new ApiError({
        type: ErrorType.VALIDATION_ERROR,
        message: 'Aggregation pipeline must be an array',
        timestamp: new Date()
      });
    }

    if (pipeline.length === 0) {
      throw new ApiError({
        type: ErrorType.VALIDATION_ERROR,
        message: 'Aggregation pipeline cannot be empty',
        timestamp: new Date()
      });
    }

    // Basic validation of pipeline stages
    const validStages = ['$match', '$group', '$sort', '$limit', '$skip', '$project', '$unwind', '$lookup'];
    
    for (let i = 0; i < pipeline.length; i++) {
      const stage = pipeline[i];
      const stageKeys = Object.keys(stage);
      
      if (stageKeys.length === 0) {
        throw new ApiError({
          type: ErrorType.VALIDATION_ERROR,
          message: `Empty stage at index ${i}`,
          timestamp: new Date()
        });
      }

      // Check if at least one key is a valid stage
      const hasValidStage = stageKeys.some(key => validStages.includes(key));
      if (!hasValidStage) {
        throw new ApiError({
          type: ErrorType.VALIDATION_ERROR,
          message: `Invalid aggregation stage at index ${i}`,
          details: { stage, validStages },
          timestamp: new Date()
        });
      }
    }
  }

  /**
   * Get missing required fields from a record
   */
  private getMissingFields(record: Partial<EssenciaReportRecord>): string[] {
    const requiredFields = ['_id', 'playerId', 'playerName', 'team', 'reportDate'];
    return requiredFields.filter(field => !record[field as keyof EssenciaReportRecord]);
  }

  /**
   * Validate date string format
   */
  private isValidDateString(dateString: string): boolean {
    if (typeof dateString !== 'string') return false;
    const date = new Date(dateString);
    return !isNaN(date.getTime()) && dateString === date.toISOString();
  }

  /**
   * Handle database operation errors
   */
  private handleDatabaseError(error: unknown, operation: string): ApiError {
    if (error instanceof ApiError) {
      return error;
    }

    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      
      if (axiosError.code === 'ECONNABORTED') {
        return new ApiError({
          type: ErrorType.NETWORK_ERROR,
          message: `Database ${operation} request timed out`,
          details: { operation },
          timestamp: new Date()
        });
      }

      if (axiosError.response) {
        const status = axiosError.response.status;
        const data = axiosError.response.data as any;

        switch (status) {
          case 401:
            return new ApiError({
              type: ErrorType.AUTHENTICATION_ERROR,
              message: `Authentication failed during ${operation}`,
              details: { operation, error: data?.error },
              timestamp: new Date()
            });
          case 403:
            return new ApiError({
              type: ErrorType.AUTHENTICATION_ERROR,
              message: `Access forbidden for ${operation}`,
              details: { operation, error: data?.error },
              timestamp: new Date()
            });
          case 400:
            return new ApiError({
              type: ErrorType.VALIDATION_ERROR,
              message: `Invalid request for ${operation}`,
              details: { operation, error: data?.error },
              timestamp: new Date()
            });
          case 404:
            return new ApiError({
              type: ErrorType.FUNIFIER_API_ERROR,
              message: `Collection not found for ${operation}`,
              details: { operation, collection: FUNIFIER_CONFIG.CUSTOM_COLLECTION },
              timestamp: new Date()
            });
          case 429:
            return new ApiError({
              type: ErrorType.FUNIFIER_API_ERROR,
              message: `Rate limit exceeded for ${operation}`,
              details: { operation, error: data?.error },
              timestamp: new Date()
            });
          case 500:
            return new ApiError({
              type: ErrorType.FUNIFIER_API_ERROR,
              message: `Funifier server error during ${operation}`,
              details: { operation, error: data?.error },
              timestamp: new Date()
            });
          default:
            return new ApiError({
              type: ErrorType.FUNIFIER_API_ERROR,
              message: `Database ${operation} failed with status ${status}`,
              details: { operation, status, error: data?.error || axiosError.message },
              timestamp: new Date()
            });
        }
      }

      if (axiosError.request) {
        return new ApiError({
          type: ErrorType.NETWORK_ERROR,
          message: `Network error during ${operation}`,
          details: { operation, error: 'No response received from server' },
          timestamp: new Date()
        });
      }
    }

    return new ApiError({
      type: ErrorType.DATA_PROCESSING_ERROR,
      message: `Unknown error during ${operation}`,
      details: { 
        operation, 
        error: error instanceof Error ? error.message : String(error) 
      },
      timestamp: new Date()
    });
  }
}

// Export singleton instance
export const funifierDatabaseService = FunifierDatabaseService.getInstance();