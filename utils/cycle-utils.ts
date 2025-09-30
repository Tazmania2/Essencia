import { CycleInfo, CycleAwareReportRecord } from '../types';

/**
 * Utility functions for cycle management and data processing
 */
export class CycleUtils {
  /**
   * Generate cycle information from start date and duration
   */
  static generateCycleInfo(cycleNumber: number, startDate: string, totalDays: number): CycleInfo {
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(start.getDate() + totalDays - 1); // -1 because we include the start day
    
    const now = new Date();
    const isActive = now >= start && now <= end;
    const isCompleted = now > end;
    
    return {
      cycleNumber,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      totalDays,
      isActive,
      isCompleted
    };
  }

  /**
   * Calculate cycle end date from start date and duration
   */
  static calculateCycleEndDate(startDate: string, totalDays: number): string {
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(start.getDate() + totalDays - 1);
    return end.toISOString();
  }

  /**
   * Determine if a cycle is currently active
   */
  static isCycleActive(startDate: string, endDate: string): boolean {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return now >= start && now <= end;
  }

  /**
   * Calculate current day within a cycle
   */
  static getCurrentCycleDay(startDate: string, currentDate?: string): number {
    const start = new Date(startDate);
    const current = currentDate ? new Date(currentDate) : new Date();
    
    const diffTime = current.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(1, diffDays); // Minimum day 1
  }

  /**
   * Get days remaining in cycle
   */
  static getDaysRemaining(endDate: string, currentDate?: string): number {
    const end = new Date(endDate);
    const current = currentDate ? new Date(currentDate) : new Date();
    
    const diffTime = end.getTime() - current.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  }

  /**
   * Validate cycle dates
   */
  static validateCycleDates(startDate: string, endDate: string): boolean {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      // Check if dates are valid
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return false;
      }
      
      // End date must be after start date
      return end > start;
    } catch {
      return false;
    }
  }

  /**
   * Sort cycles by number (descending - most recent first)
   */
  static sortCyclesByNumber(cycles: CycleInfo[]): CycleInfo[] {
    return [...cycles].sort((a, b) => b.cycleNumber - a.cycleNumber);
  }

  /**
   * Group records by cycle
   */
  static groupRecordsByCycle(records: CycleAwareReportRecord[]): Map<number, CycleAwareReportRecord[]> {
    const grouped = new Map<number, CycleAwareReportRecord[]>();
    
    for (const record of records) {
      const cycleNumber = record.cycleNumber || 1; // Default to cycle 1 for legacy data
      
      if (!grouped.has(cycleNumber)) {
        grouped.set(cycleNumber, []);
      }
      
      grouped.get(cycleNumber)!.push(record);
    }
    
    return grouped;
  }

  /**
   * Get latest record for each cycle
   */
  static getLatestRecordPerCycle(records: CycleAwareReportRecord[]): Map<number, CycleAwareReportRecord> {
    const grouped = this.groupRecordsByCycle(records);
    const latest = new Map<number, CycleAwareReportRecord>();
    
    for (const [cycleNumber, cycleRecords] of grouped) {
      // Sort by upload sequence (descending) and then by updatedAt
      const sortedRecords = cycleRecords.sort((a, b) => {
        if (a.uploadSequence !== b.uploadSequence) {
          return b.uploadSequence - a.uploadSequence;
        }
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
      
      if (sortedRecords.length > 0) {
        latest.set(cycleNumber, sortedRecords[0]);
      }
    }
    
    return latest;
  }

  /**
   * Extract unique cycles from records
   */
  static extractCyclesFromRecords(records: CycleAwareReportRecord[]): CycleInfo[] {
    const cycleMap = new Map<number, CycleInfo>();
    
    for (const record of records) {
      const cycleNumber = record.cycleNumber || 1;
      
      if (!cycleMap.has(cycleNumber)) {
        const cycleInfo: CycleInfo = {
          cycleNumber,
          startDate: record.cycleStartDate || record.createdAt,
          endDate: record.cycleEndDate || this.calculateCycleEndDate(
            record.cycleStartDate || record.createdAt, 
            record.totalCycleDays || 21
          ),
          totalDays: record.totalCycleDays || 21,
          isActive: false,
          isCompleted: false
        };
        
        // Update active/completed status
        cycleInfo.isActive = this.isCycleActive(cycleInfo.startDate, cycleInfo.endDate);
        cycleInfo.isCompleted = !cycleInfo.isActive && new Date() > new Date(cycleInfo.endDate);
        
        cycleMap.set(cycleNumber, cycleInfo);
      }
    }
    
    return Array.from(cycleMap.values());
  }

  /**
   * Format cycle display name
   */
  static formatCycleName(cycleNumber: number): string {
    return `Ciclo ${cycleNumber}`;
  }

  /**
   * Format cycle date range for display
   */
  static formatCycleDateRange(startDate: string, endDate: string, locale: string = 'pt-BR'): string {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      const formatter = new Intl.DateTimeFormat(locale, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      
      return `${formatter.format(start)} - ${formatter.format(end)}`;
    } catch {
      return 'Data inválida';
    }
  }

  /**
   * Calculate cycle progress percentage
   */
  static calculateCycleProgress(startDate: string, endDate: string, currentDate?: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const current = currentDate ? new Date(currentDate) : new Date();
    
    const totalDuration = end.getTime() - start.getTime();
    const elapsed = current.getTime() - start.getTime();
    
    if (elapsed <= 0) return 0;
    if (elapsed >= totalDuration) return 100;
    
    return Math.round((elapsed / totalDuration) * 100);
  }

  /**
   * Generate default cycle assignment for legacy data
   */
  static assignDefaultCycle(createdAt: string, totalDays: number = 21): {
    cycleNumber: number;
    cycleStartDate: string;
    cycleEndDate: string;
    uploadSequence: number;
  } {
    return {
      cycleNumber: 1,
      cycleStartDate: createdAt,
      cycleEndDate: this.calculateCycleEndDate(createdAt, totalDays),
      uploadSequence: 1
    };
  }
}