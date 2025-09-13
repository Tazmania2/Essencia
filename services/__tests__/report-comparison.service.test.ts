import { ReportComparisonService, MetricDifference, ComparisonResult } from '../report-comparison.service';
import { FunifierDatabaseService } from '../funifier-database.service';
import { ReportData } from '../report-processing.service';

// Mock FunifierDatabaseService
jest.mock('../funifier-database.service', () => ({
  FunifierDatabaseService: {
    getCollectionData: jest.fn()
  }
}));

const mockGetCollectionData = FunifierDatabaseService.getCollectionData as jest.Mock;

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
          playerName: 'João Silva',
          team: 'CARTEIRA_I',
          atividade: 85.5,
          reaisPorAtivo: 120.0,
          reportDate: '2024-01-01'
        }
      ];

      const storedData = [
        {
          playerId: 'P001',
          playerName: 'João Silva',
          team: 'CARTEIRA_I',
          atividade: 80.0,
          reaisPorAtivo: 115.0
        }
      ];

      mockGetCollectionData.mockResolvedValue(storedData);

      const result = await ReportComparisonService.compareReportData(reportData, mockToken);

      expect(result.totalPlayers).toBe(1);
      expect(result.playersWithChanges).toBe(1);
      expect(result.totalDifferences).toBe(2);
      expect(result.results).toHaveLength(1);
      expect(result.results[0].hasChanges).toBe(true);
      expect(result.results[0].differences).toHaveLength(2);
    });

    it('should handle new players with no stored data', async () => {
      const reportData: ReportData[] = [
        {
          playerId: 'P002',
          playerName: 'Maria Santos',
          team: 'CARTEIRA_II',
          atividade: 90.0,
          reportDate: '2024-01-01'
        }
      ];

      mockGetCollectionData.mockResolvedValue([]);

      const result = await ReportComparisonService.compareReportData(reportData, mockToken);

      expect(result.totalPlayers).toBe(1);
      expect(result.playersWithChanges).toBe(1);
      expect(result.results[0].differences).toHaveLength(1);
      expect(result.results[0].differences[0].funifierValue).toBe(0);
      expect(result.results[0].differences[0].reportValue).toBe(90.0);
    });

    it('should handle players with no changes', async () => {
      const reportData: ReportData[] = [
        {
          playerId: 'P001',
          playerName: 'João Silva',
          team: 'CARTEIRA_I',
          atividade: 85.0,
          reportDate: '2024-01-01'
        }
      ];

      const storedData = [
        {
          playerId: 'P001',
          atividade: 85.0
        }
      ];

      mockGetCollectionData.mockResolvedValue(storedData);

      const result = await ReportComparisonService.compareReportData(reportData, mockToken);

      expect(result.playersWithChanges).toBe(0);
      expect(result.results[0].hasChanges).toBe(false);
      expect(result.results[0].differences).toHaveLength(0);
    });

    it('should ignore small differences within tolerance', async () => {
      const reportData: ReportData[] = [
        {
          playerId: 'P001',
          playerName: 'João Silva',
          team: 'CARTEIRA_I',
          atividade: 85.005, // Very small difference
          reportDate: '2024-01-01'
        }
      ];

      const storedData = [
        {
          playerId: 'P001',
          atividade: 85.0
        }
      ];

      mockGetCollectionData.mockResolvedValue(storedData);

      const result = await ReportComparisonService.compareReportData(reportData, mockToken);

      expect(result.playersWithChanges).toBe(0);
      expect(result.results[0].hasChanges).toBe(false);
    });

    it('should handle database errors gracefully', async () => {
      const reportData: ReportData[] = [
        {
          playerId: 'P001',
          playerName: 'João Silva',
          team: 'CARTEIRA_I',
          atividade: 85.0,
          reportDate: '2024-01-01'
        }
      ];

      mockGetCollectionData.mockRejectedValue(new Error('Database error'));

      // Should not throw, but treat as new player with no stored data
      const result = await ReportComparisonService.compareReportData(reportData, mockToken);
      
      expect(result.totalPlayers).toBe(1);
      expect(result.playersWithChanges).toBe(1);
      expect(result.results[0].differences[0].funifierValue).toBe(0); // No stored data
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
            playerName: 'João Silva',
            team: 'CARTEIRA_I',
            differences: [
              {
                playerId: 'P001',
                playerName: 'João Silva',
                metric: 'atividade',
                funifierValue: 80,
                reportValue: 85,
                difference: 5,
                percentageChange: 6.25,
                requiresUpdate: true
              }
            ],
            hasChanges: true,
            summary: 'João Silva: 1 alteração detectada'
          },
          {
            playerId: 'P002',
            playerName: 'Maria Santos',
            team: 'CARTEIRA_II',
            differences: [],
            hasChanges: false,
            summary: 'Maria Santos: Nenhuma alteração detectada'
          }
        ],
        summary: 'Test summary'
      };

      const filtered = ReportComparisonService.filterChangesOnly(comparisonReport);

      expect(filtered.results).toHaveLength(1);
      expect(filtered.results[0].playerId).toBe('P001');
    });
  });

  describe('getDifferencesByMetric', () => {
    it('should group differences by metric type', () => {
      const comparisonReport = {
        totalPlayers: 1,
        playersWithChanges: 1,
        totalDifferences: 2,
        results: [
          {
            playerId: 'P001',
            playerName: 'João Silva',
            team: 'CARTEIRA_I',
            differences: [
              {
                playerId: 'P001',
                playerName: 'João Silva',
                metric: 'atividade',
                funifierValue: 80,
                reportValue: 85,
                difference: 5,
                percentageChange: 6.25,
                requiresUpdate: true
              },
              {
                playerId: 'P001',
                playerName: 'João Silva',
                metric: 'reaisPorAtivo',
                funifierValue: 100,
                reportValue: 110,
                difference: 10,
                percentageChange: 10,
                requiresUpdate: true
              }
            ],
            hasChanges: true,
            summary: 'Test summary'
          }
        ],
        summary: 'Test summary'
      };

      const byMetric = ReportComparisonService.getDifferencesByMetric(comparisonReport);

      expect(byMetric.atividade).toHaveLength(1);
      expect(byMetric.reaisPorAtivo).toHaveLength(1);
      expect(byMetric.atividade[0].reportValue).toBe(85);
      expect(byMetric.reaisPorAtivo[0].reportValue).toBe(110);
    });
  });

  describe('getSignificantChanges', () => {
    it('should return only players with changes above threshold', () => {
      const comparisonReport = {
        totalPlayers: 2,
        playersWithChanges: 2,
        totalDifferences: 2,
        results: [
          {
            playerId: 'P001',
            playerName: 'João Silva',
            team: 'CARTEIRA_I',
            differences: [
              {
                playerId: 'P001',
                playerName: 'João Silva',
                metric: 'atividade',
                funifierValue: 80,
                reportValue: 85,
                difference: 5,
                percentageChange: 6.25, // Below 10% threshold
                requiresUpdate: true
              }
            ],
            hasChanges: true,
            summary: 'Test summary'
          },
          {
            playerId: 'P002',
            playerName: 'Maria Santos',
            team: 'CARTEIRA_II',
            differences: [
              {
                playerId: 'P002',
                playerName: 'Maria Santos',
                metric: 'atividade',
                funifierValue: 80,
                reportValue: 100,
                difference: 20,
                percentageChange: 25, // Above 10% threshold
                requiresUpdate: true
              }
            ],
            hasChanges: true,
            summary: 'Test summary'
          }
        ],
        summary: 'Test summary'
      };

      const significant = ReportComparisonService.getSignificantChanges(comparisonReport, 10);

      expect(significant).toHaveLength(1);
      expect(significant[0].playerId).toBe('P002');
    });
  });

  describe('exportToCSV', () => {
    it('should export comparison results to CSV format', () => {
      const comparisonReport = {
        totalPlayers: 1,
        playersWithChanges: 1,
        totalDifferences: 1,
        results: [
          {
            playerId: 'P001',
            playerName: 'João Silva',
            team: 'CARTEIRA_I',
            differences: [
              {
                playerId: 'P001',
                playerName: 'João Silva',
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

      const csv = ReportComparisonService.exportToCSV(comparisonReport);

      expect(csv).toContain('Player ID,Player Name,Team,Metric');
      expect(csv).toContain('P001,"João Silva",CARTEIRA_I,atividade');
      expect(csv).toContain('80.00,85.00,5.00,6.25,true');
    });

    it('should handle players with no changes in CSV export', () => {
      const comparisonReport = {
        totalPlayers: 1,
        playersWithChanges: 0,
        totalDifferences: 0,
        results: [
          {
            playerId: 'P001',
            playerName: 'João Silva',
            team: 'CARTEIRA_I',
            differences: [],
            hasChanges: false,
            summary: 'No changes'
          }
        ],
        summary: 'Test summary'
      };

      const csv = ReportComparisonService.exportToCSV(comparisonReport);

      expect(csv).toContain('P001,"João Silva",CARTEIRA_I,No changes');
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
            playerName: 'João Silva',
            team: 'CARTEIRA_I',
            differences: [
              {
                playerId: 'P001',
                playerName: 'João Silva',
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

    it('should detect invalid values', () => {
      const comparisonReport = {
        totalPlayers: 1,
        playersWithChanges: 1,
        totalDifferences: 1,
        results: [
          {
            playerId: 'P001',
            playerName: 'João Silva',
            team: 'CARTEIRA_I',
            differences: [
              {
                playerId: 'P001',
                playerName: 'João Silva',
                metric: 'atividade',
                funifierValue: NaN,
                reportValue: -10,
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

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Valores inválidos para João Silva - atividade');
      expect(validation.errors).toContain('Valores negativos detectados para João Silva - atividade');
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