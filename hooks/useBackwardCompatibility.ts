import { useMemo } from 'react';
import { 
  backwardCompatibilityService, 
  CompatibilityIndicator, 
  MixedDataResult 
} from '../utils/backward-compatibility';
import { EssenciaReportRecord, CycleHistoryData } from '../types';

export interface UseBackwardCompatibilityOptions {
  context: 'history' | 'dashboard' | 'admin';
  showWarnings?: boolean;
  autoMigrationCheck?: boolean;
}

export interface BackwardCompatibilityHookResult {
  // Data processing
  processedData: MixedDataResult<CycleHistoryData[]> | null;
  compatibility: CompatibilityIndicator | null;
  
  // Status checks
  hasLegacyData: boolean;
  needsMigration: boolean;
  dataQuality: 'complete' | 'partial' | 'minimal';
  
  // User messages
  infoMessages: string[];
  warningMessages: string[];
  actionMessages: string[];
  
  // Migration recommendations
  migrationRecommendation: {
    recommend: boolean;
    reason: string;
    urgency: 'low' | 'medium' | 'high';
    affectedFeatures: string[];
  } | null;
  
  // Utility functions
  checkRecordCompatibility: (record: EssenciaReportRecord) => CompatibilityIndicator;
  shouldShowLegacyNotice: boolean;
  shouldShowMigrationWarning: boolean;
}

export function useBackwardCompatibility(
  records: EssenciaReportRecord[],
  options: UseBackwardCompatibilityOptions
): BackwardCompatibilityHookResult {
  const { context, showWarnings = true, autoMigrationCheck = true } = options;

  // Process data and extract compatibility information
  const processedData = useMemo(() => {
    if (!records || records.length === 0) {
      return null;
    }
    
    return backwardCompatibilityService.extractCycleHistoryFromMixedData(records);
  }, [records]);

  // Overall compatibility assessment
  const compatibility = useMemo(() => {
    if (!records || records.length === 0) {
      return null;
    }

    // Create an overall compatibility indicator based on all records
    const legacyCount = records.filter(r => !backwardCompatibilityService.hasCycleInfo(r)).length;
    const cycleAwareCount = records.length - legacyCount;
    
    const hasLegacyData = legacyCount > 0;
    const hasCycleInfo = cycleAwareCount > 0;
    
    let dataQuality: 'complete' | 'partial' | 'minimal';
    if (legacyCount === 0) {
      dataQuality = 'complete';
    } else if (cycleAwareCount >= legacyCount) {
      dataQuality = 'partial';
    } else {
      dataQuality = 'minimal';
    }

    return {
      hasCycleInfo,
      isLegacyData: hasLegacyData,
      migrationStatus: hasLegacyData ? 'pending' as const : 'migrated' as const,
      dataQuality
    };
  }, [records]);

  // Migration recommendation
  const migrationRecommendation = useMemo(() => {
    if (!autoMigrationCheck || !records || records.length === 0) {
      return null;
    }
    
    return backwardCompatibilityService.shouldRecommendMigration(records);
  }, [records, autoMigrationCheck]);

  // User messages
  const messages = useMemo(() => {
    if (!compatibility) {
      return {
        infoMessages: [],
        warningMessages: [],
        actionMessages: []
      };
    }
    
    return backwardCompatibilityService.generateCompatibilityMessages(compatibility, context);
  }, [compatibility, context]);

  // Status flags
  const hasLegacyData = useMemo(() => {
    return compatibility?.isLegacyData ?? false;
  }, [compatibility]);

  const needsMigration = useMemo(() => {
    return migrationRecommendation?.recommend ?? false;
  }, [migrationRecommendation]);

  const dataQuality = useMemo(() => {
    return compatibility?.dataQuality ?? 'minimal';
  }, [compatibility]);

  // Display logic
  const shouldShowLegacyNotice = useMemo(() => {
    return showWarnings && hasLegacyData && context !== 'admin';
  }, [showWarnings, hasLegacyData, context]);

  const shouldShowMigrationWarning = useMemo(() => {
    return showWarnings && needsMigration && (
      migrationRecommendation?.urgency === 'high' || 
      context === 'admin'
    );
  }, [showWarnings, needsMigration, migrationRecommendation, context]);

  // Utility function to check individual record compatibility
  const checkRecordCompatibility = useMemo(() => {
    return (record: EssenciaReportRecord) => {
      return backwardCompatibilityService.createCompatibilityIndicator(record);
    };
  }, []);

  return {
    processedData,
    compatibility,
    hasLegacyData,
    needsMigration,
    dataQuality,
    infoMessages: messages.infoMessages,
    warningMessages: messages.warningMessages,
    actionMessages: messages.actionMessages,
    migrationRecommendation,
    checkRecordCompatibility,
    shouldShowLegacyNotice,
    shouldShowMigrationWarning
  };
}

// Specialized hook for history components
export function useHistoryCompatibility(records: EssenciaReportRecord[]) {
  return useBackwardCompatibility(records, {
    context: 'history',
    showWarnings: true,
    autoMigrationCheck: true
  });
}

// Specialized hook for dashboard components
export function useDashboardCompatibility(records: EssenciaReportRecord[]) {
  return useBackwardCompatibility(records, {
    context: 'dashboard',
    showWarnings: true,
    autoMigrationCheck: false // Less aggressive for dashboard
  });
}

// Specialized hook for admin components
export function useAdminCompatibility(records: EssenciaReportRecord[]) {
  return useBackwardCompatibility(records, {
    context: 'admin',
    showWarnings: true,
    autoMigrationCheck: true
  });
}

// Hook for checking if a single record needs migration
export function useRecordCompatibility(record: EssenciaReportRecord | null) {
  return useMemo(() => {
    if (!record) {
      return null;
    }
    
    return backwardCompatibilityService.createCompatibilityIndicator(record);
  }, [record]);
}