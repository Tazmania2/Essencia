import {
  EssenciaReportRecord,
  CycleAwareReportRecord,
  CycleHistoryData,
  ProgressDataPoint,
  MetricSnapshot,
  TeamType
} from '../types';
import { secureLogger } from './logger';

export interface CompatibilityIndicator {
  hasCycleInfo: boolean;
  cycleNumber?: number;
  isLegacyData: boolean;
  migrationStatus: 'migrated' | 'pending' | 'not_applicable';
  dataQuality: 'complete' | 'partial' | 'minimal';
}

export interface MixedDataResult<T> {
  data: T;
  compatibility: CompatibilityIndicator;
  warnings: string[];
}

export interface LegacyDataFallback {
  useFallback: boolean;
  reason: string;
  fallbackData: any;
}

export class BackwardCompatibilityService {
  private static instance: BackwardCompatibilityService;

  private constructor() {}

  public static getInstance(): BackwardCompatibilityService {
    if (!BackwardCompatibilityService.instance) {
      BackwardCompatibilityService.instance = new BackwardCompatibilityService();
    }
    return BackwardCompatibilityService.instance;
  }

  /**
   * Check if a record has cycle information
   */
  public hasCycleInfo(record: EssenciaReportRecord): record is CycleAwareReportRecord {
    return (
      'cycleNumber' in record &&
      record.cycleNumber !== undefined &&
      record.cycleNumber !== null &&
      typeof record.cycleNumber === 'number' &&
      record.cycleNumber > 0
    );
  }

  /**
   * Create compatibility indicator for a record
   */
  public createCompatibilityIndicator(record: EssenciaReportRecord): CompatibilityIndicator {
    const hasCycleInfo = this.hasCycleInfo(record);
    
    let dataQuality: 'complete' | 'partial' | 'minimal' = 'minimal';
    
    if (hasCycleInfo) {
      const cycleRecord = record as CycleAwareReportRecord;
      const hasAllCycleFields = !!(
        cycleRecord.cycleStartDate &&
        cycleRecord.cycleEndDate &&
        cycleRecord.uploadSequence
      );
      
      dataQuality = hasAllCycleFields ? 'complete' : 'partial';
    } else {
      // Check if we have basic report data
      const hasBasicData = !!(
        record.reportDate &&
        record.createdAt &&
        (record.atividade !== undefined || 
         record.reaisPorAtivo !== undefined || 
         record.faturamento !== undefined)
      );
      
      dataQuality = hasBasicData ? 'partial' : 'minimal';
    }

    return {
      hasCycleInfo,
      cycleNumber: hasCycleInfo ? (record as CycleAwareReportRecord).cycleNumber : undefined,
      isLegacyData: !hasCycleInfo,
      migrationStatus: hasCycleInfo ? 'migrated' : 'pending',
      dataQuality
    };
  }

  /**
   * Safely extract cycle history from mixed data
   */
  public extractCycleHistoryFromMixedData(
    records: EssenciaReportRecord[]
  ): MixedDataResult<CycleHistoryData[]> {
    const warnings: string[] = [];
    const cycleHistoryMap = new Map<number, EssenciaReportRecord[]>();
    const legacyRecords: EssenciaReportRecord[] = [];

    // Separate cycle-aware and legacy records
    records.forEach(record => {
      if (this.hasCycleInfo(record)) {
        const cycleRecord = record as CycleAwareReportRecord;
        const cycleNumber = cycleRecord.cycleNumber;
        
        if (!cycleHistoryMap.has(cycleNumber)) {
          cycleHistoryMap.set(cycleNumber, []);
        }
        cycleHistoryMap.get(cycleNumber)!.push(record);
      } else {
        legacyRecords.push(record);
      }
    });

    // Handle legacy records
    if (legacyRecords.length > 0) {
      warnings.push(`Found ${legacyRecords.length} records without cycle information`);
      
      // Group legacy records as "Cycle 1" if they exist
      if (legacyRecords.length > 0) {
        cycleHistoryMap.set(1, [...(cycleHistoryMap.get(1) || []), ...legacyRecords]);
        warnings.push('Legacy records have been grouped as Cycle 1');
      }
    }

    // Convert to cycle history data
    const cycleHistoryData: CycleHistoryData[] = [];
    
    for (const [cycleNumber, cycleRecords] of cycleHistoryMap.entries()) {
      try {
        const historyData = this.createCycleHistoryFromRecords(cycleNumber, cycleRecords);
        cycleHistoryData.push(historyData);
      } catch (error) {
        warnings.push(`Failed to process cycle ${cycleNumber}: ${error instanceof Error ? error.message : String(error)}`);
        secureLogger.error(`Failed to process cycle ${cycleNumber}:`, error);
      }
    }

    // Sort by cycle number (most recent first)
    cycleHistoryData.sort((a, b) => b.cycleNumber - a.cycleNumber);

    const compatibility: CompatibilityIndicator = {
      hasCycleInfo: cycleHistoryMap.size > (legacyRecords.length > 0 ? 1 : 0),
      isLegacyData: legacyRecords.length > 0,
      migrationStatus: legacyRecords.length > 0 ? 'pending' : 'migrated',
      dataQuality: this.assessOverallDataQuality(records)
    };

    return {
      data: cycleHistoryData,
      compatibility,
      warnings
    };
  }

  /**
   * Create cycle history from a group of records
   */
  private createCycleHistoryFromRecords(
    cycleNumber: number,
    records: EssenciaReportRecord[]
  ): CycleHistoryData {
    if (records.length === 0) {
      throw new Error(`No records provided for cycle ${cycleNumber}`);
    }

    // Sort records by date/sequence
    const sortedRecords = records.sort((a, b) => {
      // If both have upload sequence, use that
      if (this.hasCycleInfo(a) && this.hasCycleInfo(b)) {
        const aSeq = (a as CycleAwareReportRecord).uploadSequence || 0;
        const bSeq = (b as CycleAwareReportRecord).uploadSequence || 0;
        return aSeq - bSeq;
      }
      
      // Otherwise sort by date
      return new Date(a.reportDate || a.createdAt).getTime() - 
             new Date(b.reportDate || b.createdAt).getTime();
    });

    const firstRecord = sortedRecords[0];
    const lastRecord = sortedRecords[sortedRecords.length - 1];

    // Determine cycle dates
    let startDate: string;
    let endDate: string;
    let totalDays: number;

    if (this.hasCycleInfo(firstRecord)) {
      const cycleRecord = firstRecord as CycleAwareReportRecord;
      startDate = cycleRecord.cycleStartDate || firstRecord.createdAt;
      endDate = cycleRecord.cycleEndDate || this.calculateEndDate(startDate, cycleRecord.totalCycleDays || 21);
      totalDays = cycleRecord.totalCycleDays || 21;
    } else {
      // Legacy record - estimate cycle dates
      startDate = firstRecord.createdAt;
      totalDays = firstRecord.totalCycleDays || 21;
      endDate = this.calculateEndDate(startDate, totalDays);
    }

    // Create final metrics from last record
    const finalMetrics = this.createMetricSnapshot(lastRecord);

    // Create progress timeline
    const progressTimeline = this.createProgressTimeline(sortedRecords);

    return {
      cycleNumber,
      startDate,
      endDate,
      totalDays,
      completionStatus: this.determineCycleStatus(endDate),
      finalMetrics,
      progressTimeline
    };
  }

  /**
   * Create metric snapshot from a record
   */
  private createMetricSnapshot(record: EssenciaReportRecord): {
    primaryGoal: MetricSnapshot;
    secondaryGoal1: MetricSnapshot;
    secondaryGoal2: MetricSnapshot;
  } {
    // This is a simplified version - in practice, you'd need team-specific logic
    // and configuration to determine which metrics are primary/secondary
    
    return {
      primaryGoal: {
        name: 'Atividade',
        percentage: record.atividade || 0,
        target: 100, // Default target
        current: record.atividade || 0,
        unit: 'pontos',
        boostActive: false
      },
      secondaryGoal1: {
        name: 'Reais por Ativo',
        percentage: record.reaisPorAtivo || 0,
        target: 100,
        current: record.reaisPorAtivo || 0,
        unit: 'R$',
        boostActive: false
      },
      secondaryGoal2: {
        name: 'Faturamento',
        percentage: record.faturamento || 0,
        target: 100,
        current: record.faturamento || 0,
        unit: 'R$',
        boostActive: false
      }
    };
  }

  /**
   * Create progress timeline from records
   */
  private createProgressTimeline(records: EssenciaReportRecord[]): ProgressDataPoint[] {
    return records.map((record, index) => {
      const uploadSequence = this.hasCycleInfo(record) 
        ? (record as CycleAwareReportRecord).uploadSequence || (index + 1)
        : (index + 1);

      return {
        date: record.reportDate || record.createdAt,
        dayInCycle: record.currentCycleDay || (index + 1),
        uploadSequence,
        metrics: {
          atividade: record.atividade || 0,
          reaisPorAtivo: record.reaisPorAtivo || 0,
          faturamento: record.faturamento || 0,
          multimarcasPorAtivo: record.multimarcasPorAtivo || 0,
          conversoes: record.conversoes || 0,
          upa: record.upa || 0
        }
      };
    });
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
   * Calculate end date from start date and duration
   */
  private calculateEndDate(startDate: string, totalDays: number): string {
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(start.getDate() + totalDays - 1);
    return end.toISOString();
  }

  /**
   * Assess overall data quality across records
   */
  private assessOverallDataQuality(records: EssenciaReportRecord[]): 'complete' | 'partial' | 'minimal' {
    if (records.length === 0) return 'minimal';

    const cycleAwareCount = records.filter(r => this.hasCycleInfo(r)).length;
    const cycleAwarePercentage = cycleAwareCount / records.length;

    if (cycleAwarePercentage >= 0.8) return 'complete';
    if (cycleAwarePercentage >= 0.3) return 'partial';
    return 'minimal';
  }

  /**
   * Create fallback data for missing cycle information
   */
  public createLegacyDataFallback(
    records: EssenciaReportRecord[],
    context: 'history' | 'dashboard' | 'analytics'
  ): LegacyDataFallback {
    if (records.length === 0) {
      return {
        useFallback: true,
        reason: 'No data available',
        fallbackData: null
      };
    }

    const legacyRecords = records.filter(r => !this.hasCycleInfo(r));
    
    if (legacyRecords.length === 0) {
      return {
        useFallback: false,
        reason: 'All data has cycle information',
        fallbackData: null
      };
    }

    switch (context) {
      case 'history':
        return {
          useFallback: true,
          reason: `${legacyRecords.length} records lack cycle information`,
          fallbackData: {
            message: 'Some historical data is from before cycle tracking was implemented',
            legacyRecordCount: legacyRecords.length,
            totalRecordCount: records.length,
            suggestedAction: 'Run data migration to enable full cycle history'
          }
        };

      case 'dashboard':
        return {
          useFallback: true,
          reason: 'Current data lacks cycle information',
          fallbackData: {
            showLegacyIndicator: true,
            message: 'Data from before cycle tracking',
            limitedFeatures: ['history_navigation', 'cycle_comparison']
          }
        };

      case 'analytics':
        return {
          useFallback: true,
          reason: 'Mixed data quality affects analytics',
          fallbackData: {
            dataQualityWarning: true,
            affectedMetrics: ['cycle_trends', 'progress_timeline'],
            recommendMigration: true
          }
        };

      default:
        return {
          useFallback: true,
          reason: 'Unknown context',
          fallbackData: null
        };
    }
  }

  /**
   * Generate user-friendly messages for compatibility issues
   */
  public generateCompatibilityMessages(
    compatibility: CompatibilityIndicator,
    context: 'history' | 'dashboard' | 'admin'
  ): {
    infoMessages: string[];
    warningMessages: string[];
    actionMessages: string[];
  } {
    const infoMessages: string[] = [];
    const warningMessages: string[] = [];
    const actionMessages: string[] = [];

    if (compatibility.isLegacyData) {
      switch (context) {
        case 'history':
          infoMessages.push('Some of your data is from before cycle tracking was implemented.');
          if (compatibility.dataQuality === 'minimal') {
            warningMessages.push('Limited historical data available for detailed analysis.');
          }
          actionMessages.push('Contact your administrator to migrate historical data for full cycle history.');
          break;

        case 'dashboard':
          if (compatibility.dataQuality === 'partial') {
            infoMessages.push('Your current data includes both legacy and cycle-aware information.');
          } else {
            warningMessages.push('Your data is from before cycle tracking. Some features may be limited.');
          }
          break;

        case 'admin':
          warningMessages.push(`Found data requiring migration (${compatibility.migrationStatus}).`);
          actionMessages.push('Run the data migration tool to enable full cycle functionality.');
          if (compatibility.dataQuality === 'minimal') {
            warningMessages.push('Data quality is minimal - some features may not work correctly.');
          }
          break;
      }
    } else {
      infoMessages.push('All data includes cycle information - full functionality available.');
    }

    return {
      infoMessages,
      warningMessages,
      actionMessages
    };
  }

  /**
   * Check if migration is recommended for a dataset
   */
  public shouldRecommendMigration(records: EssenciaReportRecord[]): {
    recommend: boolean;
    reason: string;
    urgency: 'low' | 'medium' | 'high';
    affectedFeatures: string[];
  } {
    const legacyCount = records.filter(r => !this.hasCycleInfo(r)).length;
    const totalCount = records.length;
    const legacyPercentage = totalCount > 0 ? legacyCount / totalCount : 0;

    if (legacyCount === 0) {
      return {
        recommend: false,
        reason: 'All data already has cycle information',
        urgency: 'low',
        affectedFeatures: []
      };
    }

    const affectedFeatures = [
      'Cycle History Navigation',
      'Progress Timeline Charts',
      'Cycle Comparison Analytics',
      'Historical Performance Trends'
    ];

    if (legacyPercentage >= 0.7) {
      return {
        recommend: true,
        reason: `${Math.round(legacyPercentage * 100)}% of data lacks cycle information`,
        urgency: 'high',
        affectedFeatures
      };
    } else if (legacyPercentage >= 0.3) {
      return {
        recommend: true,
        reason: `${Math.round(legacyPercentage * 100)}% of data lacks cycle information`,
        urgency: 'medium',
        affectedFeatures: affectedFeatures.slice(0, 2) // Partial feature impact
      };
    } else {
      return {
        recommend: true,
        reason: `${legacyCount} records lack cycle information`,
        urgency: 'low',
        affectedFeatures: ['Historical Data Completeness']
      };
    }
  }
}

// Export singleton instance
export const backwardCompatibilityService = BackwardCompatibilityService.getInstance();