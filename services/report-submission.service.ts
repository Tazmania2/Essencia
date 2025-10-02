import { ParseResult } from './report-processing.service';

export interface SubmissionResult {
  success: boolean;
  message: string;
  submissionId: string | null;
  recordsProcessed: number;
  cycleNumber: number;
  submittedAt: string;
  actionLogsCreated?: number;
  differences?: DifferenceRecord[];
  errors?: string[];
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

  async submitReport(parseResult: ParseResult, file: File, cycleNumber?: number): Promise<SubmissionResult> {
    try {
      // For now, simulate successful submission
      // In a real implementation, this would send data to Funifier API
      
      const submissionData = {
        cycleNumber: cycleNumber || 1,
        fileName: file.name,
        uploadDate: new Date().toISOString(),
        records: parseResult.data,
        summary: parseResult.summary
      };

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      return {
        success: true,
        message: `Relatório enviado com sucesso! ${parseResult.data.length} registros processados para o Ciclo ${cycleNumber || 1}.`,
        submissionId: `sub_${Date.now()}`,
        recordsProcessed: parseResult.data.length,
        cycleNumber: cycleNumber || 1,
        submittedAt: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        message: `Erro ao enviar relatório: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        submissionId: null,
        recordsProcessed: 0,
        cycleNumber: cycleNumber || 1,
        submittedAt: new Date().toISOString()
      };
    }
  }
}

export const reportSubmissionService = ReportSubmissionService.getInstance();