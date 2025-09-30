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
    // Mock implementation - replace with actual submission logic
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing time

    const mockDifferences: DifferenceRecord[] = [
      {
        playerId: 'player1',
        metric: 'faturamento',
        difference: 5.2,
        isFirstEntry: false
      }
    ];

    return {
      success: true,
      recordsProcessed: parseResult.data.length,
      actionLogsCreated: mockDifferences.length,
      differences: mockDifferences,
      errors: [],
      summary: `Relatório ${file.name} processado com sucesso!\n${parseResult.data.length} registros processados\n${mockDifferences.length} action logs criados`
    };
  }
}

export const reportSubmissionService = ReportSubmissionService.getInstance();