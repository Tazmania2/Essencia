import axios, { AxiosError } from 'axios';
import {
  EssenciaReportRecord,
  EnhancedReportRecord,
  CSVGoalData,
  CycleCSVData,
  CycleAwareReportRecord,
  CycleHistoryData,
  ProgressDataPoint,
  CycleInfo,
  CycleMigrationStatus,
  ApiError,
  ErrorType,
  FUNIFIER_CONFIG
} from '../types';
import { funifierAuthService } from './funifier-auth.service';
import { csvProcessingService } from './csv-processing.service';
import { enhancedReportCache, csvDataCache, CacheKeys } from './cache.service';
import { secureLogger } from '../utils/logger';

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
        { 
          $match: { 
            playerId: playerId,
            time: { $exists: true }
          } 
        },
        { $sort: { time: -1 } },
        { $limit: 1 }
      ];

      const results = await this.aggregateReportData(pipeline);
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      throw this.handleDatabaseError(error, 'get latest player report');
    }
  }

  /**
   * Get enhanced report data for a specific player using Basic auth
   * This method uses the special Basic auth token for enhanced database access
   */
  public async getEnhancedPlayerReport(playerId: string): Promise<EnhancedReportRecord | null> {
    try {
      console.log('🔍 Getting enhanced player report for:', playerId);
      
      // Check cache first
      const cacheKey = CacheKeys.enhancedReport(playerId);
      const cachedData = enhancedReportCache.get<EnhancedReportRecord>(cacheKey);
      
      if (cachedData) {
        console.log('📋 Found cached enhanced report for:', playerId);
        return cachedData;
      }

      const pipeline: AggregationPipeline[] = [
        { 
          $match: { 
            playerId: playerId,
            status: "REGISTERED",
            time: { $exists: true }
          } 
        },
        { $sort: { time: -1 } },
        { $limit: 1 }
      ];

      console.log('🚀 Making enhanced database request with pipeline:', JSON.stringify(pipeline));

      const response = await axios.post(
        `${FUNIFIER_CONFIG.BASE_URL}/database/${FUNIFIER_CONFIG.CUSTOM_COLLECTION}/aggregate?strict=true`,
        pipeline,
        {
          headers: {
            'Authorization': process.env.FUNIFIER_BASIC_TOKEN || '',
            'Content-Type': 'application/json',
          },
          timeout: 25000,
        }
      );

      console.log('📊 Enhanced database response status:', response.status);
      console.log('📊 Enhanced database response data length:', response.data?.length || 0);

      const results = response.data || [];
      const result = results.length > 0 ? results[0] : null;
      
      if (result) {
        console.log('✅ Found enhanced report record:', {
          playerId: result.playerId,
          hasUploadUrl: !!result.uploadUrl,
          uploadUrl: result.uploadUrl,
          createdAt: result.createdAt,
          updatedAt: result.updatedAt,
          reportDate: result.reportDate,
          percentages: {
            atividade: result.atividadePercentual,
            reaisPorAtivo: result.reaisPorAtivoPercentual,
            faturamento: result.faturamentoPercentual,
            multimarcas: result.multimarcasPorAtivoPercentual
          }
        });
      } else {
        console.log('❌ No enhanced report record found for player:', playerId);
      }
      
      // Cache the result
      if (result) {
        enhancedReportCache.set(cacheKey, result, 5 * 60 * 1000); // 5 minutes TTL
      }
      
      return result;
    } catch (error) {
      console.error('❌ Enhanced database access failed:', error);
      if (axios.isAxiosError(error)) {
        console.error('Response status:', error.response?.status);
        console.error('Response data:', error.response?.data);
      }
      return null;
    }
  }

  /**
   * Get CSV goal data from report record
   */
  public async getCSVGoalData(reportRecord: EnhancedReportRecord): Promise<CSVGoalData | null> {
    if (!reportRecord.uploadUrl) {
      console.log('❌ No CSV URL available in report record for player:', reportRecord.playerId);
      return null;
    }

    try {
      console.log('📄 Processing CSV from URL:', reportRecord.uploadUrl);
      
      // Check cache first
      const cacheKey = CacheKeys.csvData(reportRecord.uploadUrl);
      const cachedData = csvDataCache.get<CSVGoalData>(cacheKey);
      
      if (cachedData) {
        console.log('📋 Found cached CSV data');
        return cachedData;
      }

      const csvData = await csvProcessingService.downloadAndParseCSV(reportRecord.uploadUrl);
      
      if (csvData) {
        console.log('✅ Successfully processed CSV data:', {
          playerId: csvData.playerId,
          cycleDay: csvData.cycleDay,
          totalCycleDays: csvData.totalCycleDays,
          hasGoalData: !!(csvData.faturamento && csvData.reaisPorAtivo && csvData.atividade)
        });
      } else {
        console.log('❌ Failed to process CSV data');
      }
      
      // Cache the result
      if (csvData) {
        csvDataCache.set(cacheKey, csvData, 15 * 60 * 1000); // 15 minutes TTL
      }
      
      return csvData;
    } catch (error) {
      console.error('❌ Failed to process CSV goal data:', error);
      return null;
    }
  }

  /**
   * Get complete enhanced player data (database + CSV)
   */
  public async getCompletePlayerData(playerId: string): Promise<{
    reportRecord: EnhancedReportRecord | null;
    csvData: CSVGoalData | null;
  }> {
    try {
      // Check cache for complete data first
      const cacheKey = CacheKeys.completePlayerData(playerId);
      const cachedData = enhancedReportCache.get<{
        reportRecord: EnhancedReportRecord | null;
        csvData: CSVGoalData | null;
      }>(cacheKey);
      
      if (cachedData) {
        return cachedData;
      }

      const reportRecord = await this.getEnhancedPlayerReport(playerId);
      
      if (!reportRecord) {
        const result = { reportRecord: null, csvData: null };
        // Cache negative results for shorter time
        enhancedReportCache.set(cacheKey, result, 1 * 60 * 1000); // 1 minute TTL
        return result;
      }

      const csvData = await this.getCSVGoalData(reportRecord);
      const result = { reportRecord, csvData };
      
      // Cache complete result
      enhancedReportCache.set(cacheKey, result, 5 * 60 * 1000); // 5 minutes TTL
      
      return result;
    } catch (error) {
      console.error('Failed to get complete player data:', error);
      return { reportRecord: null, csvData: null };
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
   * Get cycle history for a specific player
   */
  public async getPlayerCycleHistory(playerId: string): Promise<CycleHistoryData[]> {
    try {
      const pipeline: AggregationPipeline[] = [
        {
          $match: {
            playerId: playerId,
            cycleNumber: { $exists: true }
          }
        },
        {
          $group: {
            _id: '$cycleNumber',
            cycleNumber: { $first: '$cycleNumber' },
            startDate: { $min: '$cycleStartDate' },
            endDate: { $max: '$cycleEndDate' },
            totalDays: { $first: '$totalCycleDays' },
            latestUpload: { $max: '$uploadSequence' },
            finalMetrics: { $last: '$$ROOT' },
            progressData: { $push: '$$ROOT' }
          }
        },
        {
          $sort: { cycleNumber: -1 }
        }
      ];

      const results = await this.aggregateReportData(pipeline);
      
      return results.map(result => ({
        cycleNumber: result.cycleNumber,
        startDate: result.startDate || result.finalMetrics.cycleStartDate,
        endDate: result.endDate || result.finalMetrics.cycleEndDate,
        totalDays: result.totalDays || result.finalMetrics.totalCycleDays || 21,
        completionStatus: this.determineCycleStatus(result.endDate),
        finalMetrics: this.extractFinalMetrics(result.finalMetrics),
        progressTimeline: this.buildProgressTimeline(result.progressData)
      }));
    } catch (error) {
      throw this.handleDatabaseError(error, 'get player cycle history');
    }
  }

  /**
   * Get cycle details for a specific player and cycle
   */
  public async getCycleDetails(playerId: string, cycleNumber: number): Promise<CycleHistoryData | null> {
    try {
      const pipeline: AggregationPipeline[] = [
        {
          $match: {
            playerId: playerId,
            cycleNumber: cycleNumber
          }
        },
        {
          $sort: { uploadSequence: 1 }
        }
      ];

      const results = await this.aggregateReportData(pipeline);
      
      if (results.length === 0) {
        return null;
      }

      const firstRecord = results[0];
      const lastRecord = results[results.length - 1];

      return {
        cycleNumber,
        startDate: firstRecord.cycleStartDate,
        endDate: firstRecord.cycleEndDate,
        totalDays: firstRecord.totalCycleDays || 21,
        completionStatus: this.determineCycleStatus(firstRecord.cycleEndDate),
        finalMetrics: this.extractFinalMetrics(lastRecord),
        progressTimeline: this.buildProgressTimeline(results)
      };
    } catch (error) {
      throw this.handleDatabaseError(error, 'get cycle details');
    }
  }

  /**
   * Get progress timeline for a specific cycle
   */
  public async getCycleProgressTimeline(playerId: string, cycleNumber: number): Promise<ProgressDataPoint[]> {
    try {
      const pipeline: AggregationPipeline[] = [
        {
          $match: {
            playerId: playerId,
            cycleNumber: cycleNumber
          }
        },
        {
          $sort: { uploadSequence: 1 }
        },
        {
          $project: {
            date: '$reportDate',
            dayInCycle: '$currentCycleDay',
            uploadSequence: '$uploadSequence',
            atividade: 1,
            reaisPorAtivo: 1,
            faturamento: 1,
            multimarcasPorAtivo: 1,
            conversoes: 1,
            upa: 1
          }
        }
      ];

      const results = await this.aggregateReportData(pipeline);
      
      return results.map(result => ({
        date: result.date,
        dayInCycle: result.dayInCycle || 1,
        uploadSequence: result.uploadSequence,
        metrics: {
          atividade: result.atividade || 0,
          reaisPorAtivo: result.reaisPorAtivo || 0,
          faturamento: result.faturamento || 0,
          multimarcasPorAtivo: result.multimarcasPorAtivo || 0,
          conversoes: result.conversoes || 0,
          upa: result.upa || 0
        }
      }));
    } catch (error) {
      throw this.handleDatabaseError(error, 'get cycle progress timeline');
    }
  }

  /**
   * Get all available cycles for a player
   */
  public async getPlayerCycles(playerId: string): Promise<CycleInfo[]> {
    try {
      const pipeline: AggregationPipeline[] = [
        {
          $match: {
            playerId: playerId,
            cycleNumber: { $exists: true }
          }
        },
        {
          $group: {
            _id: '$cycleNumber',
            cycleNumber: { $first: '$cycleNumber' },
            startDate: { $min: '$cycleStartDate' },
            endDate: { $max: '$cycleEndDate' },
            totalDays: { $first: '$totalCycleDays' },
            recordCount: { $sum: 1 }
          }
        },
        {
          $sort: { cycleNumber: -1 }
        }
      ];

      const results = await this.aggregateReportData(pipeline);
      
      return results.map(result => ({
        cycleNumber: result.cycleNumber,
        startDate: result.startDate,
        endDate: result.endDate,
        totalDays: result.totalDays || 21,
        isActive: this.isCycleActive(result.endDate),
        isCompleted: this.isCycleCompleted(result.endDate)
      }));
    } catch (error) {
      throw this.handleDatabaseError(error, 'get player cycles');
    }
  }

  /**
   * Insert cycle-aware report record
   */
  public async insertCycleAwareRecord(record: CycleAwareReportRecord): Promise<CycleAwareReportRecord> {
    try {
      // Validate cycle-specific fields
      this.validateCycleAwareRecord(record);

      // Determine upload sequence for this cycle
      const uploadSequence = await this.getNextUploadSequence(record.playerId, record.cycleNumber);
      
      const enhancedRecord = {
        ...record,
        uploadSequence,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      return await this.insertReportRecord(enhancedRecord);
    } catch (error) {
      throw this.handleDatabaseError(error, 'insert cycle-aware record');
    }
  }

  /**
   * Bulk insert cycle-aware records
   */
  public async bulkInsertCycleAwareRecords(records: CycleAwareReportRecord[]): Promise<BulkInsertResult> {
    try {
      // Validate all records
      records.forEach(record => this.validateCycleAwareRecord(record));

      // Enhance records with upload sequences
      const enhancedRecords = await Promise.all(
        records.map(async record => {
          const uploadSequence = await this.getNextUploadSequence(record.playerId, record.cycleNumber);
          return {
            ...record,
            uploadSequence,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
        })
      );

      return await this.bulkInsertReportData(enhancedRecords);
    } catch (error) {
      throw this.handleDatabaseError(error, 'bulk insert cycle-aware records');
    }
  }

  /**
   * Get next upload sequence number for a player's cycle
   */
  public async getNextUploadSequence(playerId: string, cycleNumber: number): Promise<number> {
    try {
      const pipeline: AggregationPipeline[] = [
        {
          $match: {
            playerId: playerId,
            cycleNumber: cycleNumber
          }
        },
        {
          $group: {
            _id: null,
            maxSequence: { $max: '$uploadSequence' }
          }
        }
      ];

      const results = await this.aggregateReportData(pipeline);
      const maxSequence = results.length > 0 ? results[0].maxSequence : 0;
      
      return (maxSequence || 0) + 1;
    } catch (error) {
      console.warn('Failed to get next upload sequence, defaulting to 1:', error);
      return 1;
    }
  }

  /**
   * Migrate existing records to cycle-aware format
   */
  public async migrateExistingRecords(): Promise<CycleMigrationStatus> {
    try {
      // Get all records without cycle information
      const existingRecords = await this.getReportData({
        cycleNumber: { $exists: false }
      });

      const migrationStatus: CycleMigrationStatus = {
        totalRecords: existingRecords.length,
        migratedRecords: 0,
        failedRecords: 0,
        errors: [],
        isComplete: false
      };

      if (existingRecords.length === 0) {
        migrationStatus.isComplete = true;
        return migrationStatus;
      }

      // Process records in batches
      const batchSize = 50;
      for (let i = 0; i < existingRecords.length; i += batchSize) {
        const batch = existingRecords.slice(i, i + batchSize);
        
        try {
          const updates = batch.map(record => ({
            ...record,
            cycleNumber: 1, // Default to cycle 1
            uploadSequence: 1,
            cycleStartDate: record.createdAt,
            cycleEndDate: this.calculateCycleEndDate(record.createdAt, record.totalCycleDays || 21),
            updatedAt: new Date().toISOString()
          }));

          await this.bulkInsertReportData(updates);
          migrationStatus.migratedRecords += batch.length;
        } catch (error) {
          migrationStatus.failedRecords += batch.length;
          migrationStatus.errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      migrationStatus.isComplete = migrationStatus.failedRecords === 0;
      return migrationStatus;
    } catch (error) {
      throw this.handleDatabaseError(error, 'migrate existing records');
    }
  }

  /**
   * Get records without cycle information
   */
  public async getRecordsWithoutCycleInfo(): Promise<EssenciaReportRecord[]> {
    try {
      return await this.getReportData({
        cycleNumber: { $exists: false }
      });
    } catch (error) {
      throw this.handleDatabaseError(error, 'get records without cycle info');
    }
  }

  /**
   * Update record with cycle information
   */
  public async updateRecordWithCycleInfo(
    recordId: string, 
    cycleInfo: {
      cycleNumber: number;
      uploadSequence: number;
      cycleStartDate: string;
      cycleEndDate: string;
    }
  ): Promise<void> {
    try {
      const token = await funifierAuthService.getAccessToken();
      if (!token) {
        throw new ApiError({
          type: ErrorType.AUTHENTICATION_ERROR,
          message: 'No valid authentication token available',
          timestamp: new Date()
        });
      }

      await axios.put(
        `${FUNIFIER_CONFIG.BASE_URL}/database/${FUNIFIER_CONFIG.CUSTOM_COLLECTION}/${recordId}`,
        {
          ...cycleInfo,
          updatedAt: new Date().toISOString()
        },
        {
          headers: {
            ...funifierAuthService.getAuthHeader(),
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        }
      );
    } catch (error) {
      throw this.handleDatabaseError(error, 'update record with cycle info');
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
   * Validate cycle-aware record structure
   */
  private validateCycleAwareRecord(record: CycleAwareReportRecord): void {
    // First validate as regular report record
    this.validateReportData([record]);

    // Then validate cycle-specific fields
    if (typeof record.cycleNumber !== 'number' || record.cycleNumber < 1 || !Number.isInteger(record.cycleNumber)) {
      throw new ApiError({
        type: ErrorType.VALIDATION_ERROR,
        message: `Invalid cycle number: ${record.cycleNumber}. Must be a positive integer.`,
        details: { record },
        timestamp: new Date()
      });
    }

    if (record.uploadSequence !== undefined && (typeof record.uploadSequence !== 'number' || record.uploadSequence < 1 || !Number.isInteger(record.uploadSequence))) {
      throw new ApiError({
        type: ErrorType.VALIDATION_ERROR,
        message: `Invalid upload sequence: ${record.uploadSequence}. Must be a positive integer.`,
        details: { record },
        timestamp: new Date()
      });
    }

    if (!record.cycleStartDate || !this.isValidDateString(record.cycleStartDate)) {
      throw new ApiError({
        type: ErrorType.VALIDATION_ERROR,
        message: `Invalid cycle start date: ${record.cycleStartDate}`,
        details: { record },
        timestamp: new Date()
      });
    }

    if (!record.cycleEndDate || !this.isValidDateString(record.cycleEndDate)) {
      throw new ApiError({
        type: ErrorType.VALIDATION_ERROR,
        message: `Invalid cycle end date: ${record.cycleEndDate}`,
        details: { record },
        timestamp: new Date()
      });
    }

    // Validate cycle dates are logical
    const startDate = new Date(record.cycleStartDate);
    const endDate = new Date(record.cycleEndDate);
    
    if (endDate <= startDate) {
      throw new ApiError({
        type: ErrorType.VALIDATION_ERROR,
        message: 'Cycle end date must be after start date',
        details: { record, startDate: record.cycleStartDate, endDate: record.cycleEndDate },
        timestamp: new Date()
      });
    }
  }

  /**
   * Determine cycle completion status
   */
  private determineCycleStatus(endDate: string): 'completed' | 'in_progress' {
    const now = new Date();
    const cycleEnd = new Date(endDate);
    return now > cycleEnd ? 'completed' : 'in_progress';
  }

  /**
   * Check if cycle is currently active
   */
  private isCycleActive(endDate: string): boolean {
    const now = new Date();
    const cycleEnd = new Date(endDate);
    return now <= cycleEnd;
  }

  /**
   * Check if cycle is completed
   */
  private isCycleCompleted(endDate: string): boolean {
    const now = new Date();
    const cycleEnd = new Date(endDate);
    return now > cycleEnd;
  }

  /**
   * Extract final metrics from a record
   */
  private extractFinalMetrics(record: any): any {
    return {
      primaryGoal: {
        name: 'atividade',
        percentage: record.atividade || 0,
        target: 100, // This would come from configuration
        current: record.atividade || 0,
        unit: 'pontos',
        boostActive: false
      },
      secondaryGoal1: {
        name: 'reaisPorAtivo',
        percentage: record.reaisPorAtivo || 0,
        target: 100,
        current: record.reaisPorAtivo || 0,
        unit: 'R$',
        boostActive: false // This would be determined by boost logic
      },
      secondaryGoal2: {
        name: 'faturamento',
        percentage: record.faturamento || 0,
        target: 100,
        current: record.faturamento || 0,
        unit: 'R$',
        boostActive: false
      }
    };
  }

  /**
   * Build progress timeline from records
   */
  private buildProgressTimeline(records: any[]): ProgressDataPoint[] {
    return records
      .sort((a, b) => a.uploadSequence - b.uploadSequence)
      .map(record => ({
        date: record.reportDate,
        dayInCycle: record.currentCycleDay || 1,
        uploadSequence: record.uploadSequence,
        metrics: {
          atividade: record.atividade || 0,
          reaisPorAtivo: record.reaisPorAtivo || 0,
          faturamento: record.faturamento || 0,
          multimarcasPorAtivo: record.multimarcasPorAtivo || 0,
          conversoes: record.conversoes || 0,
          upa: record.upa || 0
        }
      }));
  }

  /**
   * Calculate cycle end date based on start date and duration
   */
  private calculateCycleEndDate(startDate: string, totalDays: number): string {
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(start.getDate() + totalDays - 1);
    end.setHours(23, 59, 59, 999);
    return end.toISOString();
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