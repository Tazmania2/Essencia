import { ParseResult } from './report-processing.service';

export interface SubmissionResult {
  success: boolean;
  recordsProcessed: number;
  actionLogsCreated: number;
  differences: DifferenceRecord[];
  errors: string[];
  summary: string;
}

export interface DifferenceRecord {
  playerId: string;
  metric: string;
  difference: number;
  isFirstEntry: boolean;
}

export class ReportSubmissionService {
  private static instance: ReportSubmissionService;

  public static getInstance(): ReportSubmissionService {
    if (!ReportSubmissionService.instance) {
      ReportSubmissionService.instance = new ReportSubmissionService();
    }
    return ReportSubmissionService.instance;
  }

  async submitReport(parseResult: ParseResult, file: File): Promise<SubmissionResult> {
    throw new Error('Report submission service not implemented. Please configure Funifier API integration.');
  }
}

export const reportSubmissionService = ReportSubmissionService.getInstance();