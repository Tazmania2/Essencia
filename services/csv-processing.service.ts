import axios from 'axios';
import { CSVGoalData } from '../types';

export class CSVProcessingService {
  private static instance: CSVProcessingService;

  private constructor() {}

  public static getInstance(): CSVProcessingService {
    if (!CSVProcessingService.instance) {
      CSVProcessingService.instance = new CSVProcessingService();
    }
    return CSVProcessingService.instance;
  }

  /**
   * Download and parse CSV from S3 URL
   */
  public async downloadAndParseCSV(url: string): Promise<CSVGoalData | null> {
    try {
      // Validate URL format
      if (!url || typeof url !== 'string' || !url.startsWith('http')) {
        console.warn('Invalid CSV URL provided:', url);
        return null;
      }

      console.log('Downloading CSV from:', url);
      
      const response = await axios.get(url, {
        timeout: 10000, // 10 second timeout
        headers: {
          'Accept': 'text/csv,text/plain,*/*'
        },
        maxContentLength: 1024 * 1024, // 1MB max file size
        validateStatus: (status) => status >= 200 && status < 300
      });

      if (!response.data) {
        console.warn('Empty CSV response from URL:', url);
        return null;
      }

      return this.parseGoalCSV(response.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          console.error('CSV download timeout for URL:', url);
        } else if (error.response?.status === 404) {
          console.error('CSV file not found (404) for URL:', url);
        } else if (error.response?.status === 403) {
          console.error('CSV access forbidden (403) for URL:', url);
        } else {
          console.error('CSV download failed with status:', error.response?.status, 'for URL:', url);
        }
      } else {
        console.error('Unexpected error downloading CSV:', error);
      }
      return null;
    }
  }

  /**
   * Parse CSV content into goal data structure
   */
  public parseGoalCSV(csvContent: string): CSVGoalData | null {
    try {
      // Validate input
      if (!csvContent || typeof csvContent !== 'string') {
        console.warn('Invalid CSV content provided');
        return null;
      }

      const lines = csvContent.trim().split('\n');
      
      if (lines.length < 2) {
        console.warn('CSV has insufficient data - needs at least header and one data row');
        return null;
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const dataRow = lines[1].split(',').map(d => d.trim().replace(/"/g, ''));

      if (headers.length !== dataRow.length) {
        console.warn(`CSV header/data mismatch: ${headers.length} headers vs ${dataRow.length} data fields`);
        return null;
      }

      // Create data object from CSV
      const csvData: Record<string, string> = {};
      headers.forEach((header, index) => {
        csvData[header] = dataRow[index];
      });

      // Validate required fields
      const requiredFields = ['Player ID', 'Dia do Ciclo', 'Total Dias Ciclo'];
      for (const field of requiredFields) {
        if (!csvData[field]) {
          console.warn(`Missing required field '${field}' in CSV`);
          return null;
        }
      }

      // Helper function to safely parse numbers
      const safeParseFloat = (value: string, fieldName: string): number => {
        const parsed = parseFloat(value);
        if (isNaN(parsed)) {
          console.warn(`Invalid numeric value for ${fieldName}: '${value}', using 0`);
          return 0;
        }
        return parsed;
      };

      const safeParseInt = (value: string, fieldName: string): number => {
        const parsed = parseInt(value);
        if (isNaN(parsed)) {
          console.warn(`Invalid integer value for ${fieldName}: '${value}', using 0`);
          return 0;
        }
        return parsed;
      };

      // Parse the data according to expected structure with validation
      const goalData: CSVGoalData = {
        playerId: csvData['Player ID'],
        cycleDay: safeParseInt(csvData['Dia do Ciclo'], 'Dia do Ciclo'),
        totalCycleDays: safeParseInt(csvData['Total Dias Ciclo'], 'Total Dias Ciclo') || 21,
        faturamento: {
          target: safeParseFloat(csvData['Faturamento Meta'], 'Faturamento Meta'),
          current: safeParseFloat(csvData['Faturamento Atual'], 'Faturamento Atual'),
          percentage: safeParseFloat(csvData['Faturamento %'], 'Faturamento %')
        },
        reaisPorAtivo: {
          target: safeParseFloat(csvData['Reais por Ativo Meta'], 'Reais por Ativo Meta'),
          current: safeParseFloat(csvData['Reais por Ativo Atual'], 'Reais por Ativo Atual'),
          percentage: safeParseFloat(csvData['Reais por Ativo %'], 'Reais por Ativo %')
        },
        multimarcasPorAtivo: {
          target: safeParseFloat(csvData['Multimarcas por Ativo Meta'], 'Multimarcas por Ativo Meta'),
          current: safeParseFloat(csvData['Multimarcas por Ativo Atual'], 'Multimarcas por Ativo Atual'),
          percentage: safeParseFloat(csvData['Multimarcas por Ativo %'], 'Multimarcas por Ativo %')
        },
        atividade: {
          target: safeParseFloat(csvData['Atividade Meta'], 'Atividade Meta'),
          current: safeParseFloat(csvData['Atividade Atual'], 'Atividade Atual'),
          percentage: safeParseFloat(csvData['Atividade %'], 'Atividade %')
        }
      };

      // Final validation
      if (goalData.cycleDay < 0 || goalData.cycleDay > goalData.totalCycleDays) {
        console.warn(`Invalid cycle day: ${goalData.cycleDay} (total: ${goalData.totalCycleDays})`);
      }

      console.log('Successfully parsed CSV goal data for player:', goalData.playerId);
      return goalData;
    } catch (error) {
      console.error('Unexpected error parsing CSV:', error);
      return null;
    }
  }

  /**
   * Validate CSV structure matches expected format
   */
  public validateCSVStructure(csvContent: string): boolean {
    try {
      const lines = csvContent.trim().split('\n');
      
      if (lines.length < 2) {
        return false;
      }

      const headers = lines[0].split(',').map(h => h.trim());
      
      // Check for required headers
      const requiredHeaders = [
        'Player ID',
        'Dia do Ciclo',
        'Total Dias Ciclo',
        'Faturamento Meta',
        'Faturamento Atual',
        'Faturamento %',
        'Reais por Ativo Meta',
        'Reais por Ativo Atual',
        'Reais por Ativo %',
        'Atividade Meta',
        'Atividade Atual',
        'Atividade %'
      ];

      return requiredHeaders.every(header => headers.includes(header));
    } catch (error) {
      return false;
    }
  }

  /**
   * Get unit for a specific goal type
   */
  public getGoalUnit(goalType: 'faturamento' | 'reaisPorAtivo' | 'multimarcasPorAtivo' | 'atividade'): string {
    const units = {
      faturamento: 'R$',
      reaisPorAtivo: 'R$',
      multimarcasPorAtivo: 'marcas',
      atividade: 'pontos'
    };

    return units[goalType] || '';
  }

  /**
   * Format goal value for display
   */
  public formatGoalValue(value: number, goalType: 'faturamento' | 'reaisPorAtivo' | 'multimarcasPorAtivo' | 'atividade'): string {
    if (goalType === 'faturamento' || goalType === 'reaisPorAtivo') {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value);
    }

    if (goalType === 'multimarcasPorAtivo') {
      return value.toFixed(1);
    }

    return Math.round(value).toString();
  }
}

// Export singleton instance
export const csvProcessingService = CSVProcessingService.getInstance();