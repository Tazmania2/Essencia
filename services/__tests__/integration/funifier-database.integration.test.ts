import { FunifierDatabaseService } from '../../funifier-database.service';
import { funifierAuthService } from '../../funifier-auth.service';
import { EssenciaReportRecord, TeamType } from '../../../types';
import axios from 'axios';

// Mock axios and auth service for integration tests
jest.mock('axios');
jest.mock('../../funifier-auth.service');
const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedAuthService = funifierAuthService as jest.Mocked<typeof funifierAuthService>;

describe('FunifierDatabaseService Integration Tests', () => {
  let databaseService: FunifierDatabaseService;
  const mockToken = 'mock-access-token-12345';

  beforeEach(() => {
    databaseService = FunifierDatabaseService.getInstance();
    jest.clearAllMocks();
    
    // Mock auth service methods
    mockedAuthService.getAccessToken.mockResolvedValue(mockToken);
    mockedAuthService.getAuthHeader.mockReturnValue({
      'Authorization': `Bearer ${mockToken}`
    });
  });

  describe('Collection Creation and Data Insertion', () => {
    it('should successfully create collection and insert bulk data', async () => {
      const mockReportData: EssenciaReportRecord[] = [
        {
          _id: 'player_123_2024-01-15',
          playerId: 'player_123',
          playerName: 'João Silva',
          team: TeamType.CARTEIRA_I,
          atividade: 85,
          reaisPorAtivo: 120,
          faturamento: 95,
          currentCycleDay: 15,
          totalCycleDays: 21,
          reportDate: '2024-01-15T00:00:00.000Z',
          createdAt: '2024-01-15T10:30:00.000Z',
          updatedAt: '2024-01-15T10:30:00.000Z'
        },
        {
          _id: 'player_456_2024-01-15',
          playerId: 'player_456',
          playerName: 'Maria Santos',
          team: TeamType.CARTEIRA_II,
          atividade: 75,
          reaisPorAtivo: 110,
          multimarcasPorAtivo: 88,
          currentCycleDay: 15,
          totalCycleDays: 21,
          reportDate: '2024-01-15T00:00:00.000Z',
          createdAt: '2024-01-15T10:30:00.000Z',
          updatedAt: '2024-01-15T10:30:00.000Z'
        }
      ];

      const mockResponse = {
        data: {
          insertedCount: 2,
          updatedCount: 0,
          errors: []
        },
        status: 200
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await databaseService.bulkInsertReportData(mockReportData);

      expect(result.insertedCount).toBe(2);
      expect(result.errors).toHaveLength(0);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://service2.funifier.com/v3/database/essencia_reports__c/bulk',
        mockReportData,
        {
          headers: { 
            Authorization: `Bearer ${mockToken}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );
    });

    it('should handle partial insertion with errors', async () => {
      const mockReportData: EssenciaReportRecord[] = [
        {
          _id: 'player_123_2024-01-15',
          playerId: 'player_123',
          playerName: 'João Silva',
          team: TeamType.CARTEIRA_I,
          atividade: 85,
          reaisPorAtivo: 120,
          faturamento: 95,
          currentCycleDay: 15,
          totalCycleDays: 21,
          reportDate: '2024-01-15T00:00:00.000Z',
          createdAt: '2024-01-15T10:30:00.000Z',
          updatedAt: '2024-01-15T10:30:00.000Z'
        },
        {
          _id: 'invalid_record',
          playerId: '', // Invalid empty playerId
          playerName: '',
          team: TeamType.CARTEIRA_I, // Use valid enum value
          reportDate: 'invalid-date',
          createdAt: '2024-01-15T10:30:00.000Z',
          updatedAt: '2024-01-15T10:30:00.000Z'
        }
      ];

      // Mock validation error response
      const mockResponse = {
        data: {
          insertedCount: 1,
          updatedCount: 0,
          errors: [
            {
              index: 1,
              error: 'Validation failed: playerId is required'
            }
          ]
        },
        status: 200
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await databaseService.bulkInsertReportData(mockReportData);

      expect(result.insertedCount).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toContain('Validation failed');
    });

    it('should handle collection creation errors', async () => {
      const mockError = {
        response: {
          status: 400,
          data: {
            error: 'invalid_collection_name',
            error_description: 'Collection name must end with __c'
          }
        }
      };

      mockedAxios.post.mockRejectedValueOnce(mockError);

      await expect(
        databaseService.bulkInsertReportData([{
          _id: 'test',
          playerId: 'test',
          playerName: 'test',
          team: TeamType.CARTEIRA_I,
          reportDate: '2024-01-15T00:00:00.000Z',
          createdAt: '2024-01-15T10:30:00.000Z',
          updatedAt: '2024-01-15T10:30:00.000Z'
        }])
      ).rejects.toThrow();
    });
  });

  describe('Data Retrieval', () => {
    it('should successfully retrieve collection data', async () => {
      const mockStoredData: EssenciaReportRecord[] = [
        {
          _id: 'player_123_2024-01-15',
          playerId: 'player_123',
          playerName: 'João Silva',
          team: TeamType.CARTEIRA_I,
          atividade: 85,
          reaisPorAtivo: 120,
          faturamento: 95,
          currentCycleDay: 15,
          totalCycleDays: 21,
          reportDate: '2024-01-15T00:00:00.000Z',
          createdAt: '2024-01-15T10:30:00.000Z',
          updatedAt: '2024-01-15T10:30:00.000Z'
        }
      ];

      const mockResponse = {
        data: mockStoredData,
        status: 200
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await databaseService.getReportData();

      expect(result).toEqual(mockStoredData);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://service2.funifier.com/v3/database/essencia_reports__c',
        {
          headers: { 
            Authorization: `Bearer ${mockToken}`,
            'Content-Type': 'application/json',
          },
          timeout: 20000,
          params: undefined
        }
      );
    });

    it('should handle empty collection gracefully', async () => {
      const mockResponse = {
        data: [],
        status: 200
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await databaseService.getReportData();

      expect(result).toEqual([]);
    });

    it('should handle collection not found error', async () => {
      const mockError = {
        response: {
          status: 404,
          data: {
            error: 'collection_not_found',
            error_description: 'Collection does not exist'
          }
        }
      };

      mockedAxios.get.mockRejectedValueOnce(mockError);

      await expect(
        databaseService.getReportData({ nonexistent: true })
      ).rejects.toThrow();
    });
  });

  describe('Aggregation Queries', () => {
    it('should successfully execute aggregation pipeline', async () => {
      const pipeline = [
        { $match: { playerId: 'player_123' } },
        { $sort: { reportDate: -1 } },
        { $limit: 1 }
      ];

      const mockAggregationResult = [
        {
          _id: 'player_123_2024-01-15',
          playerId: 'player_123',
          playerName: 'João Silva',
          team: TeamType.CARTEIRA_I,
          atividade: 85,
          reaisPorAtivo: 120,
          faturamento: 95,
          reportDate: '2024-01-15T00:00:00.000Z'
        }
      ];

      const mockResponse = {
        data: mockAggregationResult,
        status: 200
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await databaseService.aggregateReportData(pipeline);

      expect(result).toEqual(mockAggregationResult);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://service2.funifier.com/v3/database/essencia_reports__c/aggregate?strict=true',
        pipeline,
        {
          headers: { 
            Authorization: `Bearer ${mockToken}`,
            'Content-Type': 'application/json',
          },
          timeout: 25000,
        }
      );
    });

    it('should handle complex aggregation with grouping', async () => {
      const pipeline = [
        { $match: { team: TeamType.CARTEIRA_I } },
        {
          $group: {
            _id: '$team',
            avgAtividade: { $avg: '$atividade' },
            avgReaisPorAtivo: { $avg: '$reaisPorAtivo' },
            count: { $sum: 1 }
          }
        }
      ];

      const mockAggregationResult = [
        {
          _id: TeamType.CARTEIRA_I,
          avgAtividade: 87.5,
          avgReaisPorAtivo: 115.2,
          count: 4
        }
      ];

      const mockResponse = {
        data: mockAggregationResult,
        status: 200
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await databaseService.aggregateReportData(pipeline);

      expect(result).toEqual(mockAggregationResult);
      expect(result[0]._id).toBe(TeamType.CARTEIRA_I);
      expect(result[0].avgAtividade).toBe(87.5);
      expect(result[0].count).toBe(4);
    });

    it('should handle invalid aggregation pipeline', async () => {
      const invalidPipeline = [
        { $invalidStage: { field: 'value' } }
      ];

      const mockError = {
        response: {
          status: 400,
          data: {
            error: 'invalid_pipeline',
            error_description: 'Unknown aggregation stage: $invalidStage'
          }
        }
      };

      mockedAxios.post.mockRejectedValueOnce(mockError);

      await expect(
        databaseService.aggregateReportData(invalidPipeline)
      ).rejects.toThrow();
    });
  });

  describe('Data Comparison and Synchronization', () => {
    it('should compare report data with stored data', async () => {
      // Mock getting current stored data
      const storedData = [
        {
          _id: 'player_123_2024-01-14',
          playerId: 'player_123',
          atividade: 80,
          reaisPorAtivo: 115,
          faturamento: 90,
          reportDate: '2024-01-14T00:00:00.000Z'
        }
      ];

      const newReportData = {
        playerId: 'player_123',
        atividade: 85, // Increased by 5
        reaisPorAtivo: 120, // Increased by 5
        faturamento: 95, // Increased by 5
        reportDate: '2024-01-15T00:00:00.000Z'
      };

      // Mock aggregation call to get latest data
      const aggregationPipeline = [
        { $match: { playerId: 'player_123' } },
        { $sort: { reportDate: -1 } },
        { $limit: 1 }
      ];

      const mockResponse = {
        data: storedData,
        status: 200
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const comparison = await databaseService.comparePlayerData(
        'player_123',
        newReportData
      );

      expect(comparison.hasChanges).toBe(true);
      expect(Object.keys(comparison.differences)).toContain('atividade');
      expect(Object.keys(comparison.differences)).toContain('reaisPorAtivo');
      expect(Object.keys(comparison.differences)).toContain('faturamento');
    });

    it('should handle first-time data insertion', async () => {
      // Mock empty result for new player
      const mockResponse = {
        data: [],
        status: 200
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const newReportData = {
        playerId: 'new_player_789',
        atividade: 75,
        reaisPorAtivo: 100,
        faturamento: 80,
        reportDate: '2024-01-15T00:00:00.000Z'
      };

      const comparison = await databaseService.comparePlayerData(
        'new_player_789',
        newReportData
      );

      expect(comparison.hasChanges).toBe(true);
      expect(comparison.storedData).toBeNull();
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle network timeouts gracefully', async () => {
      const timeoutError = {
        code: 'ECONNABORTED',
        message: 'timeout of 10000ms exceeded'
      };

      mockedAxios.post.mockRejectedValueOnce(timeoutError);

      await expect(
        databaseService.bulkInsertReportData([])
      ).rejects.toThrow();
    });

    it('should handle rate limiting with retry logic', async () => {
      const rateLimitError = {
        response: {
          status: 429,
          data: {
            error: 'rate_limit_exceeded',
            error_description: 'Too many requests'
          }
        }
      };

      const successResponse = {
        data: { inserted: 1, modified: 0, errors: [] },
        status: 200
      };

      // First call fails with rate limit, second succeeds
      mockedAxios.post
        .mockRejectedValueOnce(rateLimitError)
        .mockResolvedValueOnce(successResponse);

      const result = await databaseService.bulkInsertReportData([
        {
          _id: 'test_record',
          playerId: 'test_player',
          playerName: 'Test Player',
          team: TeamType.CARTEIRA_I,
          reportDate: '2024-01-15T00:00:00.000Z',
          createdAt: '2024-01-15T10:30:00.000Z',
          updatedAt: '2024-01-15T10:30:00.000Z'
        }
      ]);

      expect(result.insertedCount).toBe(1);
      expect(mockedAxios.post).toHaveBeenCalledTimes(2);
    });
  });
});