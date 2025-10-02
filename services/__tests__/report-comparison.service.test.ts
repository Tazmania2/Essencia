import { ReportComparisonService } from '../report-comparison.service';
import { ReportData } from '../report-processing.service';

// Mock the database service instance
const mockDatabaseService = {
  getCollectionData: jest.fn(),
  getReportData: jest.fn()
};

jest.mock('../funifier-database.service', () => ({
  FunifierDatabaseService: {
    getInstance: () => mockDatabaseService
  }
}));

describe('ReportComparisonService', () => {
  const mockToken = 'test-token';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('compareReportData', () => {
    it('should compare report data with stored data successfully', async () => {
      const reportData: ReportData[] = [
        {
          playerId: 'P001',
          diaDociclo: 15,
          totalDiasCiclo: 21,
          atividadePercentual: 85.5,
          reaisPorAtivoPercentual: 120.0,
          faturamentoPercentual: 75.0,
          multimarcasPorAtivoPercentual: 60.0,
          reportDate: '2024-01-01'
        }
      ];

      const storedData = [
        {
          playerId: 'P001',
          atividadePercentual: 80.0,
          reaisPorAtivoPercentual: 115.0,
          faturamentoPercentual: 70.0,
          multimarcasPorAtivoPercentual: 55.0
        }
      ];

      mockDatabaseService.getReportData.mockResolvedValue(storedData);

      const result = await ReportComparisonService.compareReportData(reportData, mockToken, 1, false);

      expect(result.totalPlayers).toBe(1);
      expect(result.playersWithChanges).toBe(1);
      expect(result.totalDifferences).toBe(4);
      expect(result.results).toHaveLength(1);
      expect(result.results[0].hasChanges).toBe(true);
      expect(result.results[0].differences).toHaveLength(4);
    });

    it('should handle new cycle with all data as new', async () => {
      const reportData: ReportData[] = [
        {
          playerId: 'P002',
          diaDociclo: 1,
          totalDiasCiclo: 21,
          atividadePercentual: 90.0,
          reaisPorAtivoPercentual: 100.0,
          faturamentoPercentual: 80.0,
          multimarcasPorAtivoPercentual: 70.0,
          reportDate: '2024-01-01'
        }
      ];

      // For new cycle, we don't even call the database
      const result = await ReportComparisonService.compareReportData(reportData, mockToken, 2, true);

      expect(result.totalPlayers).toBe(1);
      expect(result.playersWithChanges).toBe(1);
      expect(result.results[0].differences).toHaveLength(4);
      expect(result.results[0].differences[0].funifierValue).toBe(0);
      expect(result.summary).toContain('Novo ciclo 2');
    });

    it('should handle new players with no stored data', async () => {
      const reportData: ReportData[] = [
        {
          playerId: 'P002',
          diaDociclo: 10,
          totalDiasCiclo: 21,
          atividadePercentual: 90.0,
          reaisPorAtivoPercentual: 100.0,
          faturamentoPercentual: 80.0,
          multimarcasPorAtivoPercentual: 70.0,
          reportDate: '2024-01-01'
        }
      ];

      mockDatabaseService.getReportData.mockResolvedValue([]);

      const result = await ReportComparisonService.compareReportData(reportData, mockToken, 1, false);

      expect(result.totalPlayers).toBe(1);
      expect(result.playersWithChanges).toBe(1);
      expect(result.results[0].differences).toHaveLength(4);
      expect(result.results[0].differences[0].funifierValue).toBe(0);
    });

    it('should handle players with no changes', async () => {
      const reportData: ReportData[] = [
        {
          playerId: 'P001',
          diaDociclo: 15,
          totalDiasCiclo: 21,
          atividadePercentual: 85.0,
          reaisPorAtivoPercentual: 100.0,
          faturamentoPercentual: 75.0,
          multimarcasPorAtivoPercentual: 60.0,
          reportDate: '2024-01-01'
        }
      ];

      const storedData = [
        {
          playerId: 'P001',
          atividadePercentual: 85.0,
          reaisPorAtivoPercentual: 100.0,
          faturamentoPercentual: 75.0,
          multimarcasPorAtivoPercentual: 60.0
        }
      ];

      mockDatabaseService.getReportData.mockResolvedValue(storedData);

      const result = await ReportComparisonService.compareReportData(reportData, mockToken, 1, false);

      expect(result.playersWithChanges).toBe(0);
      expect(result.results[0].hasChanges).toBe(false);
      expect(result.results[0].differences).toHaveLength(0);
    });

    it('should ignore small differences within tolerance', async () => {
      const reportData: ReportData[] = [
        {
          playerId: 'P001',
          diaDociclo: 15,
          totalDiasCiclo: 21,
          atividadePercentual: 85.005, // Very small difference
          reaisPorAtivoPercentual: 100.0,
          faturamentoPercentual: 75.0,
          multimarcasPorAtivoPercentual: 60.0,
          reportDate: '2024-01-01'
        }
      ];

      const storedData = [
        {
          playerId: 'P001',
          atividadePercentual: 85.0,
          reaisPorAtivoPercentual: 100.0,
          faturamentoPercentual: 75.0,
          multimarcasPorAtivoPercentual: 60.0
        }
      ];

      mockDatabaseService.getReportData.mockResolvedValue(storedData);

      const result = await ReportComparisonService.compareReportData(reportData, mockToken, 1, false);

      expect(result.playersWithChanges).toBe(0);
      expect(result.results[0].hasChanges).toBe(false);
    });

    it('should handle database errors gracefully', async () => {
      const reportData: ReportData[] = [
        {
          playerId: 'P001',
          diaDociclo: 15,
          totalDiasCiclo: 21,
          atividadePercentual: 85.0,
          reaisPorAtivoPercentual: 100.0,
          faturamentoPercentual: 75.0,
          multimarcasPorAtivoPercentual: 60.0,
          reportDate: '2024-01-01'
        }
      ];

      mockDatabaseService.getReportData.mockRejectedValue(new Error('Database error'));

      // Should not throw, but treat as new player with no stored data (graceful degradation)
      const result = await ReportComparisonService.compareReportData(reportData, mockToken, 1, false);
      
      expect(result.totalPlayers).toBe(1);
      expect(result.playersWithChanges).toBe(1);
      expect(result.results[0].differences[0].funifierValue).toBe(0); // No stored data due to error
    });
  });

  describe('filterChangesOnly', () => {
    it('should filter to show only players with changes', () => {
      const comparisonReport = {
        totalPlayers: 2,
        playersWithChanges: 1,
        totalDifferences: 1,
        results: [
          {
            playerId: 'P001',
            playerName: 'P001',
            team: 'UNKNOWN',
            differences: [
              {
                playerId: 'P001',
                playerName: 'P001',
                metric: 'atividade',
                funifierValue: 80,
                reportValue: 85,
                difference: 5,
                percentageChange: 6.25,
                requiresUpdate: true
              }
            ],
            hasChanges: true,
            summary: 'P001: 1 alteração detectada'
          },
          {
            playerId: 'P002',
            playerName: 'P002',
            team: 'UNKNOWN',
            differences: [],
            hasChanges: false,
            summary: 'P002: Nenhuma alteração detectada'
          }
        ],
        summary: 'Test summary'
      };

      const filtered = ReportComparisonService.filterChangesOnly(comparisonReport);

      expect(filtered.results).toHaveLength(1);
      expect(filtered.results[0].playerId).toBe('P001');
    });
  });

  describe('validateComparisonResults', () => {
    it('should validate valid comparison results', () => {
      const comparisonReport = {
        totalPlayers: 1,
        playersWithChanges: 1,
        totalDifferences: 1,
        results: [
          {
            playerId: 'P001',
            playerName: 'P001',
            team: 'UNKNOWN',
            differences: [
              {
                playerId: 'P001',
                playerName: 'P001',
                metric: 'atividade',
                funifierValue: 80,
                reportValue: 85,
                difference: 5,
                percentageChange: 6.25,
                requiresUpdate: true
              }
            ],
            hasChanges: true,
            summary: 'Test summary'
          }
        ],
        summary: 'Test summary'
      };

      const validation = ReportComparisonService.validateComparisonResults(comparisonReport);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect empty results', () => {
      const comparisonReport = {
        totalPlayers: 0,
        playersWithChanges: 0,
        totalDifferences: 0,
        results: [],
        summary: 'Empty'
      };

      const validation = ReportComparisonService.validateComparisonResults(comparisonReport);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Nenhum resultado de comparação encontrado');
    });
  });
});