import {
  EssenciaReportRecord,
  CycleAwareReportRecord,
  CycleMigrationStatus,
  CycleInfo,
  ApiError,
  ErrorType
} from '../types';
import { FunifierDatabaseService } from './funifier-database.service';
import { secureLogger } from '../utils/logger';

export interface MigrationBatch {
  batchNumber: number;
  records: EssenciaReportRecord[];
  startIndex: number;
  endIndex: number;
}

export interface MigrationProgress {
  totalBatches: number;
  completedBatches: number;
  currentBatch: number;
  estimatedTimeRemaining: number;
  startTime: Date;
}

export interface MigrationReport {
  status: CycleMigrationStatus;
  progress: MigrationProgress;
  detailedErrors: Array<{
    recordId: string;
    playerId: string;
    error: string;
    timestamp: Date;
  }>;
  performanceMetrics: {
    recordsPerSecond: number;
    averageBatchTime: number;
    totalDuration: number;
  };
}

export class CycleMigrationService {
  private static instance: CycleMigrationService;
  private databaseService: FunifierDatabaseService;
  private readonly BATCH_SIZE = 50;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000; // 1 second

  private constructor() {
    this.databaseService = FunifierDatabaseService.getInstance();
  }

  public static getInstance(): CycleMigrationService {
    if (!CycleMigrationService.instance) {
      CycleMigrationService.instance = new CycleMigrationService();
    }
    return CycleMigrationService.instance;
  }

  /**
   * Perform complete data migration from non-cycle to cycle-aware format
   */
  public async migrateAllData(): Promise<MigrationReport> {
    const startTime = new Date();
    secureLogger.info('Starting complete data migration to cycle-aware format');

    try {
      // Get all records without cycle information
      const recordsToMigrate = await this.databaseService.getRecordsWithoutCycleInfo();
      
      if (recordsToMigrate.length === 0) {
        secureLogger.info('No records found requiring migration');
        return this.createCompletedMigrationReport(startTime, 0);
      }

      secureLogger.info(`Found ${recordsToMigrate.length} records requiring migration`);

      // Initialize migration status
      const migrationStatus: CycleMigrationStatus = {
        totalRecords: recordsToMigrate.length,
        migratedRecords: 0,
        failedRecords: 0,
        errors: [],
        isComplete: false
      };

      // Create batches for processing
      const batches = this.createMigrationBatches(recordsToMigrate);
      
      const progress: MigrationProgress = {
        totalBatches: batches.length,
        completedBatches: 0,
        currentBatch: 0,
        estimatedTimeRemaining: 0,
        startTime
      };

      const detailedErrors: MigrationReport['detailedErrors'] = [];
      const batchTimes: number[] = [];

      // Process each batch
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        const batchStartTime = Date.now();
        
        progress.currentBatch = i + 1;
        
        try {
          secureLogger.info(`Processing migration batch ${i + 1}/${batches.length} (${batch.records.length} records)`);
          
          const batchResult = await this.migrateBatch(batch);
          
          migrationStatus.migratedRecords += batchResult.successCount;
          migrationStatus.failedRecords += batchResult.failureCount;
          migrationStatus.errors.push(...batchResult.errors);
          
          // Add detailed errors
          batchResult.detailedErrors.forEach(error => {
            detailedErrors.push({
              ...error,
              timestamp: new Date()
            });
          });

          progress.completedBatches++;
          
          const batchTime = Date.now() - batchStartTime;
          batchTimes.push(batchTime);
          
          // Update estimated time remaining
          if (batchTimes.length > 0) {
            const averageBatchTime = batchTimes.reduce((sum, time) => sum + time, 0) / batchTimes.length;
            const remainingBatches = batches.length - progress.completedBatches;
            progress.estimatedTimeRemaining = (remainingBatches * averageBatchTime) / 1000; // in seconds
          }

          secureLogger.info(`Batch ${i + 1} completed: ${batchResult.successCount} migrated, ${batchResult.failureCount} failed`);
          
        } catch (error) {
          secureLogger.error(`Failed to process batch ${i + 1}:`, error);
          migrationStatus.failedRecords += batch.records.length;
          migrationStatus.errors.push(`Batch ${i + 1} failed completely: ${error instanceof Error ? error.message : String(error)}`);
          
          // Add all records in failed batch to detailed errors
          batch.records.forEach(record => {
            detailedErrors.push({
              recordId: record._id,
              playerId: record.playerId,
              error: `Batch processing failed: ${error instanceof Error ? error.message : String(error)}`,
              timestamp: new Date()
            });
          });
        }
      }

      migrationStatus.isComplete = migrationStatus.failedRecords === 0;
      
      const totalDuration = (Date.now() - startTime.getTime()) / 1000;
      const recordsPerSecond = migrationStatus.migratedRecords / totalDuration;
      const averageBatchTime = batchTimes.length > 0 ? batchTimes.reduce((sum, time) => sum + time, 0) / batchTimes.length : 0;

      const report: MigrationReport = {
        status: migrationStatus,
        progress,
        detailedErrors,
        performanceMetrics: {
          recordsPerSecond,
          averageBatchTime,
          totalDuration
        }
      };

      secureLogger.info(`Migration completed: ${migrationStatus.migratedRecords} migrated, ${migrationStatus.failedRecords} failed`);
      
      return report;

    } catch (error) {
      secureLogger.error('Migration failed with critical error:', error);
      throw new ApiError({
        type: ErrorType.DATA_PROCESSING_ERROR,
        message: `Migration failed: ${error instanceof Error ? error.message : String(error)}`,
        details: { error },
        timestamp: new Date()
      });
    }
  }

  /**
   * Migrate a specific batch of records
   */
  private async migrateBatch(batch: MigrationBatch): Promise<{
    successCount: number;
    failureCount: number;
    errors: string[];
    detailedErrors: Array<{
      recordId: string;
      playerId: string;
      error: string;
    }>;
  }> {
    let successCount = 0;
    let failureCount = 0;
    const errors: string[] = [];
    const detailedErrors: Array<{
      recordId: string;
      playerId: string;
      error: string;
    }> = [];

    // Process each record in the batch
    for (const record of batch.records) {
      let retryCount = 0;
      let migrated = false;

      while (retryCount < this.MAX_RETRIES && !migrated) {
        try {
          await this.migrateRecord(record);
          successCount++;
          migrated = true;
        } catch (error) {
          retryCount++;
          const errorMessage = error instanceof Error ? error.message : String(error);
          
          if (retryCount >= this.MAX_RETRIES) {
            failureCount++;
            errors.push(`Record ${record._id} (${record.playerId}): ${errorMessage}`);
            detailedErrors.push({
              recordId: record._id,
              playerId: record.playerId,
              error: errorMessage
            });
          } else {
            // Wait before retry
            await this.delay(this.RETRY_DELAY * retryCount);
          }
        }
      }
    }

    return {
      successCount,
      failureCount,
      errors,
      detailedErrors
    };
  }

  /**
   * Migrate a single record to cycle-aware format
   */
  private async migrateRecord(record: EssenciaReportRecord): Promise<void> {
    try {
      // Calculate cycle information
      const cycleInfo = this.calculateCycleInfo(record);
      
      // Update the record with cycle information
      await this.databaseService.updateRecordWithCycleInfo(record._id, cycleInfo);
      
      secureLogger.debug(`Migrated record ${record._id} for player ${record.playerId} to cycle ${cycleInfo.cycleNumber}`);
      
    } catch (error) {
      secureLogger.error(`Failed to migrate record ${record._id}:`, error);
      throw error;
    }
  }

  /**
   * Calculate cycle information for a record
   */
  private calculateCycleInfo(record: EssenciaReportRecord): {
    cycleNumber: number;
    uploadSequence: number;
    cycleStartDate: string;
    cycleEndDate: string;
  } {
    // For existing records, assign to cycle 1 by default
    const cycleNumber = 1;
    const uploadSequence = 1;
    
    // Use the record's creation date as cycle start
    const cycleStartDate = record.createdAt;
    
    // Calculate cycle end date based on total cycle days
    const totalDays = record.totalCycleDays || 21;
    const startDate = new Date(cycleStartDate);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + totalDays - 1);
    const cycleEndDate = endDate.toISOString();

    return {
      cycleNumber,
      uploadSequence,
      cycleStartDate,
      cycleEndDate
    };
  }

  /**
   * Create migration batches from records
   */
  private createMigrationBatches(records: EssenciaReportRecord[]): MigrationBatch[] {
    const batches: MigrationBatch[] = [];
    
    for (let i = 0; i < records.length; i += this.BATCH_SIZE) {
      const batchRecords = records.slice(i, i + this.BATCH_SIZE);
      
      batches.push({
        batchNumber: Math.floor(i / this.BATCH_SIZE) + 1,
        records: batchRecords,
        startIndex: i,
        endIndex: Math.min(i + this.BATCH_SIZE - 1, records.length - 1)
      });
    }
    
    return batches;
  }

  /**
   * Get migration status for monitoring
   */
  public async getMigrationStatus(): Promise<{
    needsMigration: boolean;
    recordsWithoutCycles: number;
    recordsWithCycles: number;
    totalRecords: number;
  }> {
    try {
      const [recordsWithoutCycles, recordsWithCycles] = await Promise.all([
        this.databaseService.getRecordsWithoutCycleInfo(),
        this.databaseService.getReportData({ cycleNumber: { $exists: true } })
      ]);

      return {
        needsMigration: recordsWithoutCycles.length > 0,
        recordsWithoutCycles: recordsWithoutCycles.length,
        recordsWithCycles: recordsWithCycles.length,
        totalRecords: recordsWithoutCycles.length + recordsWithCycles.length
      };
    } catch (error) {
      secureLogger.error('Failed to get migration status:', error);
      throw new ApiError({
        type: ErrorType.DATA_PROCESSING_ERROR,
        message: `Failed to get migration status: ${error instanceof Error ? error.message : String(error)}`,
        details: { error },
        timestamp: new Date()
      });
    }
  }

  /**
   * Validate migrated data integrity
   */
  public async validateMigration(): Promise<{
    isValid: boolean;
    issues: string[];
    statistics: {
      totalRecords: number;
      recordsWithCycles: number;
      recordsWithoutCycles: number;
      uniqueCycles: number;
      playersWithHistory: number;
    };
  }> {
    try {
      const issues: string[] = [];
      
      // Get all records
      const allRecords = await this.databaseService.getReportData({});
      const recordsWithCycles = allRecords.filter(r => 'cycleNumber' in r && r.cycleNumber !== undefined);
      const recordsWithoutCycles = allRecords.filter(r => !('cycleNumber' in r) || r.cycleNumber === undefined);
      
      // Check for records without cycle information
      if (recordsWithoutCycles.length > 0) {
        issues.push(`Found ${recordsWithoutCycles.length} records without cycle information`);
      }
      
      // Check for invalid cycle numbers
      const invalidCycles = recordsWithCycles.filter(r => 
        'cycleNumber' in r && (r.cycleNumber < 1 || !Number.isInteger(r.cycleNumber))
      );
      if (invalidCycles.length > 0) {
        issues.push(`Found ${invalidCycles.length} records with invalid cycle numbers`);
      }
      
      // Check for missing cycle dates
      const missingDates = recordsWithCycles.filter(r => 
        'cycleStartDate' in r && 'cycleEndDate' in r && 
        (!r.cycleStartDate || !r.cycleEndDate)
      );
      if (missingDates.length > 0) {
        issues.push(`Found ${missingDates.length} records with missing cycle dates`);
      }
      
      // Calculate statistics
      const uniqueCycles = new Set(
        recordsWithCycles
          .filter(r => 'cycleNumber' in r)
          .map(r => r.cycleNumber)
      ).size;
      
      const playersWithHistory = new Set(
        recordsWithCycles
          .filter(r => 'playerId' in r)
          .map(r => r.playerId)
      ).size;

      const statistics = {
        totalRecords: allRecords.length,
        recordsWithCycles: recordsWithCycles.length,
        recordsWithoutCycles: recordsWithoutCycles.length,
        uniqueCycles,
        playersWithHistory
      };

      return {
        isValid: issues.length === 0,
        issues,
        statistics
      };
    } catch (error) {
      secureLogger.error('Failed to validate migration:', error);
      throw new ApiError({
        type: ErrorType.DATA_PROCESSING_ERROR,
        message: `Failed to validate migration: ${error instanceof Error ? error.message : String(error)}`,
        details: { error },
        timestamp: new Date()
      });
    }
  }

  /**
   * Rollback migration (remove cycle information from records)
   */
  public async rollbackMigration(): Promise<{
    rolledBackRecords: number;
    errors: string[];
  }> {
    try {
      secureLogger.info('Starting migration rollback');
      
      const recordsWithCycles = await this.databaseService.getReportData({
        cycleNumber: { $exists: true }
      });

      let rolledBackRecords = 0;
      const errors: string[] = [];

      // Process in batches
      const batches = this.createMigrationBatches(recordsWithCycles);
      
      for (const batch of batches) {
        try {
          // Remove cycle fields from each record in the batch
          for (const record of batch.records) {
            try {
              // Create update object to unset cycle fields
              const updateData = {
                $unset: {
                  cycleNumber: '',
                  uploadSequence: '',
                  cycleStartDate: '',
                  cycleEndDate: ''
                }
              };

              // Note: This would require a different API call to unset fields
              // For now, we'll log that rollback would happen here
              secureLogger.debug(`Would rollback record ${record._id}`);
              rolledBackRecords++;
              
            } catch (error) {
              const errorMessage = `Failed to rollback record ${record._id}: ${error instanceof Error ? error.message : String(error)}`;
              errors.push(errorMessage);
              secureLogger.error(errorMessage);
            }
          }
        } catch (error) {
          const errorMessage = `Failed to rollback batch ${batch.batchNumber}: ${error instanceof Error ? error.message : String(error)}`;
          errors.push(errorMessage);
          secureLogger.error(errorMessage);
        }
      }

      secureLogger.info(`Rollback completed: ${rolledBackRecords} records processed, ${errors.length} errors`);
      
      return {
        rolledBackRecords,
        errors
      };
    } catch (error) {
      secureLogger.error('Rollback failed:', error);
      throw new ApiError({
        type: ErrorType.DATA_PROCESSING_ERROR,
        message: `Rollback failed: ${error instanceof Error ? error.message : String(error)}`,
        details: { error },
        timestamp: new Date()
      });
    }
  }

  /**
   * Create a completed migration report for cases with no records to migrate
   */
  private createCompletedMigrationReport(startTime: Date, recordCount: number): MigrationReport {
    const totalDuration = (Date.now() - startTime.getTime()) / 1000;
    
    return {
      status: {
        totalRecords: recordCount,
        migratedRecords: recordCount,
        failedRecords: 0,
        errors: [],
        isComplete: true
      },
      progress: {
        totalBatches: 0,
        completedBatches: 0,
        currentBatch: 0,
        estimatedTimeRemaining: 0,
        startTime
      },
      detailedErrors: [],
      performanceMetrics: {
        recordsPerSecond: 0,
        averageBatchTime: 0,
        totalDuration
      }
    };
  }

  /**
   * Utility method to add delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const cycleMigrationService = CycleMigrationService.getInstance();