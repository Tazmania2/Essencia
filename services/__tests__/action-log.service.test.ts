import axios from 'axios';
import { ActionLogService, ActionLog } from '../action-log.service';
import { MetricDifference, ComparisonResult } from '../report-comparison.service';

// Mock axios
jest.mock('axios');
const mockAxios = axios as jest.Mocked<typeof axios>;

describe('ActionLogService', () => {
  const mockToken = 'test-token';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateActionLogs', () => {
    it('should generate action logs from comparison results', () => {
      const comparisonResults: ComparisonResult[] = [
        {
          playerId: 'P001',
          playerName: 'João Silva',
          team: 'CARTEIRA_I',
          hasChanges: true,
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
          summary: 'Test summary'
        }
      ];

      const actionLogs = ActionLogService.generateActionLogs(comparisonResults);

      expect(actionLogs).toHaveLength(2);
      expect(actionLogs[0]).toMatchObject({
        playerId: 'P001',
        challengeType: 'atividade_challenge',
        attribute: 'atividade',
        value: 5
      });
      expect(actionLogs[1]).toMatchObject({
        playerId: 'P001',
        challengeType: 'reais_por_ativo_challenge',
        attribute: 'reaisPorAtivo',
        value: 10
      });
    });

    it('should skip players with no changes', () => {
      const comparisonResults: ComparisonResult[] = [
        {
          playerId: 'P001',
          playerName: 'João Silva',
          team: 'CARTEIRA_I',
          hasChanges: false,
          differences: [],
          summary: 'No changes'
        }
      ];

      const actionLogs = ActionLogService.generateActionLogs(comparisonResults);

      expect(actionLogs).toHaveLength(0);
    });

    it('should skip differences that do not require update', () => {
      const comparisonResults: ComparisonResult[] = [
        {
          playerId: 'P001',
          playerName: 'João Silva',
          team: 'CARTEIRA_I',
          hasChanges: true,
          differences: [
            {
              playerId: 'P001',
              playerName: 'João Silva',
              metric: 'atividade',
              funifierValue: 80,
              reportValue: 85,
              difference: 5,
              percentageChange: 6.25,
              requiresUpdate: false // Should be skipped
            }
          ],
          summary: 'Test summary'
        }
      ];

      const actionLogs = ActionLogService.generateActionLogs(comparisonResults);

      expect(actionLogs).toHaveLength(0);
    });

    it('should handle unknown metric types', () => {
      const comparisonResults: ComparisonResult[] = [
        {
          playerId: 'P001',
          playerName: 'João Silva',
          team: 'CARTEIRA_I',
          hasChanges: true,
          differences: [
            {
              playerId: 'P001',
              playerName: 'João Silva',
              metric: 'unknownMetric',
              funifierValue: 80,
              reportValue: 85,
              difference: 5,
              percentageChange: 6.25,
              requiresUpdate: true
            }
          ],
          summary: 'Test summary'
        }
      ];

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const actionLogs = ActionLogService.generateActionLogs(comparisonResults);

      expect(actionLogs).toHaveLength(0);
      expect(consoleSpy).toHaveBeenCalledWith('Unknown metric type: unknownMetric');
      
      consoleSpy.mockRestore();
    });
  });

  describe('submitActionLog', () => {
    it('should submit action log successfully', async () => {
      const actionLog: ActionLog = {
        playerId: 'P001',
        challengeType: 'atividade_challenge',
        attribute: 'atividade',
        value: 5,
        timestamp: '2024-01-01T00:00:00.000Z'
      };

      mockAxios.post.mockResolvedValue({ status: 200, statusText: 'OK' });

      const result = await ActionLogService.submitActionLog(actionLog, mockToken);

      expect(result.success).toBe(true);
      expect(result.actionLog).toBe(actionLog);
      expect(result.error).toBeUndefined();
      expect(mockAxios.post).toHaveBeenCalledWith(
        'https://service2.funifier.com/v3/action-logs',
        {
          player_id: 'P001',
          challenge_type: 'atividade_challenge',
          attribute: 'atividade',
          value: 5,
          timestamp: '2024-01-01T00:00:00.000Z',
          metadata: undefined
        },
        {
          headers: {
            'Authorization': 'Bearer test-token',
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );
    });

    it('should handle submission errors with retries', async () => {
      const actionLog: ActionLog = {
        playerId: 'P001',
        challengeType: 'atividade_challenge',
        attribute: 'atividade',
        value: 5,
        timestamp: '2024-01-01T00:00:00.000Z'
      };

      mockAxios.post.mockRejectedValue(new Error('Network error'));

      const result = await ActionLogService.submitActionLog(actionLog, mockToken);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
      expect(mockAxios.post).toHaveBeenCalledTimes(3); // Should retry 3 times
    });

    it('should handle HTTP error responses', async () => {
      const actionLog: ActionLog = {
        playerId: 'P001',
        challengeType: 'atividade_challenge',
        attribute: 'atividade',
        value: 5,
        timestamp: '2024-01-01T00:00:00.000Z'
      };

      mockAxios.post.mockResolvedValue({ status: 400, statusText: 'Bad Request' });

      const result = await ActionLogService.submitActionLog(actionLog, mockToken);

      expect(result.success).toBe(false);
      expect(result.error).toBe('HTTP 400: Bad Request');
    });
  });

  describe('submitActionLogsBatch', () => {
    it('should submit multiple action logs successfully', async () => {
      const actionLogs: ActionLog[] = [
        {
          playerId: 'P001',
          challengeType: 'atividade_challenge',
          attribute: 'atividade',
          value: 5,
          timestamp: '2024-01-01T00:00:00.000Z'
        },
        {
          playerId: 'P002',
          challengeType: 'faturamento_challenge',
          attribute: 'faturamento',
          value: 10,
          timestamp: '2024-01-01T00:00:00.000Z'
        }
      ];

      mockAxios.post.mockResolvedValue({ status: 200, statusText: 'OK' });

      const mockProgress = jest.fn();
      const result = await ActionLogService.submitActionLogsBatch(actionLogs, mockToken, mockProgress);

      expect(result.totalLogs).toBe(2);
      expect(result.successfulSubmissions).toBe(2);
      expect(result.failedSubmissions).toBe(0);
      expect(result.results).toHaveLength(2);
      expect(mockProgress).toHaveBeenCalledWith(1, 2);
      expect(mockProgress).toHaveBeenCalledWith(2, 2);
    });

    it('should handle mixed success and failure results', async () => {
      const actionLogs: ActionLog[] = [
        {
          playerId: 'P001',
          challengeType: 'atividade_challenge',
          attribute: 'atividade',
          value: 5,
          timestamp: '2024-01-01T00:00:00.000Z'
        },
        {
          playerId: 'P002',
          challengeType: 'faturamento_challenge',
          attribute: 'faturamento',
          value: 10,
          timestamp: '2024-01-01T00:00:00.000Z'
        }
      ];

      // First call succeeds, next 3 calls fail (for retries)
      mockAxios.post
        .mockResolvedValueOnce({ status: 200, statusText: 'OK' })
        .mockRejectedValue(new Error('Network error'));

      const result = await ActionLogService.submitActionLogsBatch(actionLogs, mockToken);

      expect(result.totalLogs).toBe(2);
      expect(result.successfulSubmissions).toBe(1);
      expect(result.failedSubmissions).toBe(1);
      expect(result.results[0].success).toBe(true);
      expect(result.results[1].success).toBe(false);
    });
  });

  describe('validateActionLogs', () => {
    it('should validate valid action logs', () => {
      const actionLogs: ActionLog[] = [
        {
          playerId: 'P001',
          challengeType: 'atividade_challenge',
          attribute: 'atividade',
          value: 5,
          timestamp: '2024-01-01T00:00:00.000Z'
        }
      ];

      const validation = ActionLogService.validateActionLogs(actionLogs);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect missing required fields', () => {
      const actionLogs: ActionLog[] = [
        {
          playerId: '',
          challengeType: '',
          attribute: '',
          value: NaN,
          timestamp: ''
        }
      ];

      const validation = ActionLogService.validateActionLogs(actionLogs);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Action log 1: playerId é obrigatório');
      expect(validation.errors).toContain('Action log 1: challengeType é obrigatório');
      expect(validation.errors).toContain('Action log 1: attribute é obrigatório');
      expect(validation.errors).toContain('Action log 1: value deve ser um número válido');
      expect(validation.errors).toContain('Action log 1: timestamp é obrigatório');
    });

    it('should detect invalid timestamp format', () => {
      const actionLogs: ActionLog[] = [
        {
          playerId: 'P001',
          challengeType: 'atividade_challenge',
          attribute: 'atividade',
          value: 5,
          timestamp: 'invalid-date'
        }
      ];

      const validation = ActionLogService.validateActionLogs(actionLogs);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Action log 1: timestamp deve ser uma data válida');
    });

    it('should detect empty action logs array', () => {
      const validation = ActionLogService.validateActionLogs([]);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Nenhum action log para enviar');
    });
  });

  describe('getFailedActionLogs', () => {
    it('should return only failed action logs', () => {
      const batchResult = {
        totalLogs: 2,
        successfulSubmissions: 1,
        failedSubmissions: 1,
        results: [
          {
            success: true,
            actionLog: {
              playerId: 'P001',
              challengeType: 'atividade_challenge',
              attribute: 'atividade',
              value: 5,
              timestamp: '2024-01-01T00:00:00.000Z'
            }
          },
          {
            success: false,
            actionLog: {
              playerId: 'P002',
              challengeType: 'faturamento_challenge',
              attribute: 'faturamento',
              value: 10,
              timestamp: '2024-01-01T00:00:00.000Z'
            },
            error: 'Network error'
          }
        ],
        summary: 'Test summary'
      };

      const failedLogs = ActionLogService.getFailedActionLogs(batchResult);

      expect(failedLogs).toHaveLength(1);
      expect(failedLogs[0].playerId).toBe('P002');
    });
  });

  describe('groupActionLogsByPlayer', () => {
    it('should group action logs by player ID', () => {
      const actionLogs: ActionLog[] = [
        {
          playerId: 'P001',
          challengeType: 'atividade_challenge',
          attribute: 'atividade',
          value: 5,
          timestamp: '2024-01-01T00:00:00.000Z'
        },
        {
          playerId: 'P001',
          challengeType: 'faturamento_challenge',
          attribute: 'faturamento',
          value: 10,
          timestamp: '2024-01-01T00:00:00.000Z'
        },
        {
          playerId: 'P002',
          challengeType: 'atividade_challenge',
          attribute: 'atividade',
          value: 15,
          timestamp: '2024-01-01T00:00:00.000Z'
        }
      ];

      const grouped = ActionLogService.groupActionLogsByPlayer(actionLogs);

      expect(grouped['P001']).toHaveLength(2);
      expect(grouped['P002']).toHaveLength(1);
    });
  });

  describe('groupActionLogsByMetric', () => {
    it('should group action logs by metric type', () => {
      const actionLogs: ActionLog[] = [
        {
          playerId: 'P001',
          challengeType: 'atividade_challenge',
          attribute: 'atividade',
          value: 5,
          timestamp: '2024-01-01T00:00:00.000Z'
        },
        {
          playerId: 'P002',
          challengeType: 'atividade_challenge',
          attribute: 'atividade',
          value: 10,
          timestamp: '2024-01-01T00:00:00.000Z'
        },
        {
          playerId: 'P001',
          challengeType: 'faturamento_challenge',
          attribute: 'faturamento',
          value: 15,
          timestamp: '2024-01-01T00:00:00.000Z'
        }
      ];

      const grouped = ActionLogService.groupActionLogsByMetric(actionLogs);

      expect(grouped['atividade']).toHaveLength(2);
      expect(grouped['faturamento']).toHaveLength(1);
    });
  });

  describe('exportActionLogsToJSON', () => {
    it('should export action logs to JSON format', () => {
      const actionLogs: ActionLog[] = [
        {
          playerId: 'P001',
          challengeType: 'atividade_challenge',
          attribute: 'atividade',
          value: 5,
          timestamp: '2024-01-01T00:00:00.000Z'
        }
      ];

      const json = ActionLogService.exportActionLogsToJSON(actionLogs);
      const parsed = JSON.parse(json);

      expect(parsed).toHaveLength(1);
      expect(parsed[0].playerId).toBe('P001');
    });
  });

  describe('exportBatchResultsToCSV', () => {
    it('should export batch results to CSV format', () => {
      const batchResult = {
        totalLogs: 1,
        successfulSubmissions: 1,
        failedSubmissions: 0,
        results: [
          {
            success: true,
            actionLog: {
              playerId: 'P001',
              challengeType: 'atividade_challenge',
              attribute: 'atividade',
              value: 5,
              timestamp: '2024-01-01T00:00:00.000Z'
            }
          }
        ],
        summary: 'Test summary'
      };

      const csv = ActionLogService.exportBatchResultsToCSV(batchResult);

      expect(csv).toContain('Player ID,Challenge Type,Attribute,Value,Timestamp,Success,Error');
      expect(csv).toContain('P001,atividade_challenge,atividade,5,2024-01-01T00:00:00.000Z,true,');
    });
  });
});