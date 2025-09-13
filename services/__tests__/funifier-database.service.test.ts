import axios from 'axios';
import { FunifierDatabaseService, funifierDatabaseService } from '../funifier-database.service';
import { funifierAuthService } from '../funifier-auth.service';
import { ErrorType, FUNIFIER_CONFIG, EssenciaReportRecord, TeamType } from '../../types';

// Mock axios and auth service
jest.mock('axios');
jest.mock('../funifier-auth.service');

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedAuthService = funifierAuthService as jest.Mocked<typeof funifierAuthService>;

describe('FunifierDatabaseService', () => {
  let databaseService: FunifierDatabaseService;

  const mockReportRecord: EssenciaReportRecord = {
    _id: 'player123_2024-01-15',
    playerId: 'player123',
    playerName: 'Test Player',
    team: TeamType.CARTEIRA_I,
    atividade: 85.5,
    reaisPorAtivo: 92.3,
    faturamento: 78.9,
    multimarcasPorAtivo: 65.2,
    currentCycleDay: 15,
    totalCycleDays: 21,
    reportDate: '2024-01-15T00:00:00.000Z',
    createdAt: '2024-01-15T10:00:00.000Z',
    updatedAt: '2024-01-15T10:00:00.000Z'
  };

  beforeEach(() => {
    databaseService = FunifierDatabaseService.getInstance();
    jest.clearAllMocks();
    
    // Mock auth service default behavior
    mockedAuthService.getAccessToken.mockResolvedValue('mock_token');
    mockedAuthService.getAuthHeader.mockReturnValue({
      'Authorization': 'Bearer mock_token'
    });
  });

  describe('bulkInsertReportData', () => {
    it('should perform bulk insert successfully', async () => {
      const mockResponse = {
        data: {
          insertedCount: 2,
          updatedCount: 1,
          errors: []
        }
      };
      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const data = [mockReportRecord, { ...mockReportRecord, _id: 'player456_2024-01-15', playerId: 'player456' }];
      const result = await databaseService.bulkInsertReportData(data);

      expect(result).toEqual({
        insertedCount: 2,
        updatedCount: 1,
        errors: []
      });

      expect(mockedAxios.post).toHaveBeenCalledWith(
        `${FUNIFIER_CONFIG.BASE_URL}/database/${FUNIFIER_CONFIG.CUSTOM_COLLECTION}/bulk`,
        data,
        {
          headers: {
            'Authorization': 'Bearer mock_token',
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );
    });

    it('should throw error when no authentication token available', async () => {
      mockedAuthService.getAccessToken.mockResolvedValueOnce(null);

      await expect(databaseService.bulkInsertReportData([mockReportRecord])).rejects.toMatchObject({
        type: ErrorType.AUTHENTICATION_ERROR,
        message: 'No valid authentication token available'
      });
    });

    it('should validate data before sending', async () => {
      const invalidData = [{ ...mockReportRecord, _id: '' }]; // missing required field

      await expect(databaseService.bulkInsertReportData(invalidData)).rejects.toMatchObject({
        type: ErrorType.VALIDATION_ERROR,
        message: 'Missing required fields in record 0'
      });
    });

    it('should handle network timeout error', async () => {
      const mockError = {
        isAxiosError: true,
        code: 'ECONNABORTED',
        message: 'timeout of 30000ms exceeded'
      };
      mockedAxios.post.mockRejectedValueOnce(mockError);
      mockedAxios.isAxiosError.mockReturnValue(true);

      await expect(databaseService.bulkInsertReportData([mockReportRecord])).rejects.toMatchObject({
        type: ErrorType.NETWORK_ERROR,
        message: 'Database bulk insert request timed out'
      });
    });
  });

  describe('insertReportRecord', () => {
    it('should insert single record successfully', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: mockReportRecord });

      const result = await databaseService.insertReportRecord(mockReportRecord);

      expect(result).toEqual(mockReportRecord);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        `${FUNIFIER_CONFIG.BASE_URL}/database/${FUNIFIER_CONFIG.CUSTOM_COLLECTION}`,
        mockReportRecord,
        {
          headers: {
            'Authorization': 'Bearer mock_token',
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        }
      );
    });

    it('should validate single record before sending', async () => {
      const invalidRecord = { ...mockReportRecord, playerId: '' };

      await expect(databaseService.insertReportRecord(invalidRecord)).rejects.toMatchObject({
        type: ErrorType.VALIDATION_ERROR,
        message: 'Missing required fields in record 0'
      });
    });
  });

  describe('getReportData', () => {
    it('should retrieve report data without filter', async () => {
      const mockData = [mockReportRecord];
      mockedAxios.get.mockResolvedValueOnce({ data: mockData });

      const result = await databaseService.getReportData();

      expect(result).toEqual(mockData);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        `${FUNIFIER_CONFIG.BASE_URL}/database/${FUNIFIER_CONFIG.CUSTOM_COLLECTION}`,
        {
          headers: {
            'Authorization': 'Bearer mock_token',
            'Content-Type': 'application/json',
          },
          timeout: 20000,
          params: undefined
        }
      );
    });

    it('should retrieve report data with filter', async () => {
      const mockData = [mockReportRecord];
      const filter = { playerId: 'player123' };
      mockedAxios.get.mockResolvedValueOnce({ data: mockData });

      const result = await databaseService.getReportData(filter);

      expect(result).toEqual(mockData);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        `${FUNIFIER_CONFIG.BASE_URL}/database/${FUNIFIER_CONFIG.CUSTOM_COLLECTION}`,
        {
          headers: {
            'Authorization': 'Bearer mock_token',
            'Content-Type': 'application/json',
          },
          timeout: 20000,
          params: { filter: JSON.stringify(filter) }
        }
      );
    });

    it('should handle empty response', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: null });

      const result = await databaseService.getReportData();

      expect(result).toEqual([]);
    });
  });

  describe('getLatestPlayerReport', () => {
    it('should get latest report for player', async () => {
      const mockAggregationResponse = [mockReportRecord];
      mockedAxios.post.mockResolvedValueOnce({ data: mockAggregationResponse });

      const result = await databaseService.getLatestPlayerReport('player123');

      expect(result).toEqual(mockReportRecord);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        `${FUNIFIER_CONFIG.BASE_URL}/database/${FUNIFIER_CONFIG.CUSTOM_COLLECTION}/aggregate?strict=true`,
        [
          { $match: { playerId: 'player123' } },
          { $sort: { reportDate: -1 } },
          { $limit: 1 }
        ],
        expect.any(Object)
      );
    });

    it('should return null when no reports found', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: [] });

      const result = await databaseService.getLatestPlayerReport('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getReportsByDate', () => {
    it('should get reports by specific date', async () => {
      const mockData = [mockReportRecord];
      mockedAxios.get.mockResolvedValueOnce({ data: mockData });

      const result = await databaseService.getReportsByDate('2024-01-15T00:00:00.000Z');

      expect(result).toEqual(mockData);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: { filter: JSON.stringify({ reportDate: '2024-01-15T00:00:00.000Z' }) }
        })
      );
    });
  });

  describe('aggregateReportData', () => {
    it('should perform aggregation query successfully', async () => {
      const pipeline = [
        { $match: { team: TeamType.CARTEIRA_I } },
        { $group: { _id: '$team', avgAtividade: { $avg: '$atividade' } } }
      ];
      const mockResult = [{ _id: TeamType.CARTEIRA_I, avgAtividade: 85.5 }];
      mockedAxios.post.mockResolvedValueOnce({ data: mockResult });

      const result = await databaseService.aggregateReportData(pipeline);

      expect(result).toEqual(mockResult);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        `${FUNIFIER_CONFIG.BASE_URL}/database/${FUNIFIER_CONFIG.CUSTOM_COLLECTION}/aggregate?strict=true`,
        pipeline,
        {
          headers: {
            'Authorization': 'Bearer mock_token',
            'Content-Type': 'application/json',
          },
          timeout: 25000,
        }
      );
    });

    it('should validate aggregation pipeline', async () => {
      const invalidPipeline = [{}]; // empty stage

      await expect(databaseService.aggregateReportData(invalidPipeline)).rejects.toMatchObject({
        type: ErrorType.VALIDATION_ERROR,
        message: 'Empty stage at index 0'
      });
    });

    it('should reject invalid pipeline stages', async () => {
      const invalidPipeline = [{ $invalidStage: {} }];

      await expect(databaseService.aggregateReportData(invalidPipeline)).rejects.toMatchObject({
        type: ErrorType.VALIDATION_ERROR,
        message: 'Invalid aggregation stage at index 0'
      });
    });

    it('should handle empty response', async () => {
      const pipeline = [{ $match: { team: TeamType.CARTEIRA_I } }];
      mockedAxios.post.mockResolvedValueOnce({ data: null });

      const result = await databaseService.aggregateReportData(pipeline);

      expect(result).toEqual([]);
    });
  });

  describe('comparePlayerData', () => {
    it('should detect changes in player data', async () => {
      const storedData = mockReportRecord;
      const newData = { ...mockReportRecord, atividade: 90.0, reaisPorAtivo: 95.0 };
      
      mockedAxios.post.mockResolvedValueOnce({ data: [storedData] });

      const result = await databaseService.comparePlayerData('player123', newData);

      expect(result).toEqual({
        hasChanges: true,
        differences: {
          atividade: { old: 85.5, new: 90.0 },
          reaisPorAtivo: { old: 92.3, new: 95.0 }
        },
        storedData
      });
    });

    it('should handle no stored data', async () => {
      const newData = { atividade: 90.0 };
      mockedAxios.post.mockResolvedValueOnce({ data: [] });

      const result = await databaseService.comparePlayerData('newplayer', newData);

      expect(result).toEqual({
        hasChanges: true,
        differences: { all: { old: null, new: newData } },
        storedData: null
      });
    });

    it('should detect no changes', async () => {
      const storedData = mockReportRecord;
      const newData = { atividade: 85.5, reaisPorAtivo: 92.3 };
      
      mockedAxios.post.mockResolvedValueOnce({ data: [storedData] });

      const result = await databaseService.comparePlayerData('player123', newData);

      expect(result).toEqual({
        hasChanges: false,
        differences: {},
        storedData
      });
    });
  });

  describe('getPlayerStatistics', () => {
    it('should calculate player statistics', async () => {
      const mockStatsResult = [{
        _id: null,
        totalPlayers: 10,
        avgAtividade: 85.0,
        avgReaisPorAtivo: 90.0,
        avgFaturamento: 80.0,
        avgMultimarcas: 75.0,
        latestDate: '2024-01-15T00:00:00.000Z'
      }];
      
      const mockTeamResult = [
        { _id: TeamType.CARTEIRA_I, count: 4 },
        { _id: TeamType.CARTEIRA_II, count: 3 },
        { _id: TeamType.CARTEIRA_III, count: 2 },
        { _id: TeamType.CARTEIRA_IV, count: 1 }
      ];

      mockedAxios.post
        .mockResolvedValueOnce({ data: mockStatsResult })
        .mockResolvedValueOnce({ data: mockTeamResult });

      const result = await databaseService.getPlayerStatistics();

      expect(result).toEqual({
        totalPlayers: 10,
        averagePoints: 83, // rounded average of the four metrics
        teamDistribution: {
          [TeamType.CARTEIRA_I]: 4,
          [TeamType.CARTEIRA_II]: 3,
          [TeamType.CARTEIRA_III]: 2,
          [TeamType.CARTEIRA_IV]: 1
        },
        latestReportDate: '2024-01-15T00:00:00.000Z'
      });
    });

    it('should handle empty statistics', async () => {
      mockedAxios.post
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({ data: [] });

      const result = await databaseService.getPlayerStatistics();

      expect(result).toEqual({
        totalPlayers: 0,
        averagePoints: 0,
        teamDistribution: {},
        latestReportDate: null
      });
    });
  });

  describe('deleteReportData', () => {
    it('should delete records successfully', async () => {
      const mockResponse = { data: { deletedCount: 5 } };
      mockedAxios.delete.mockResolvedValueOnce(mockResponse);

      const filter = { playerId: 'player123' };
      const result = await databaseService.deleteReportData(filter);

      expect(result).toEqual({ deletedCount: 5 });
      expect(mockedAxios.delete).toHaveBeenCalledWith(
        `${FUNIFIER_CONFIG.BASE_URL}/database/${FUNIFIER_CONFIG.CUSTOM_COLLECTION}`,
        {
          headers: {
            'Authorization': 'Bearer mock_token',
            'Content-Type': 'application/json',
          },
          data: filter,
          timeout: 15000,
        }
      );
    });
  });

  describe('data validation', () => {
    it('should reject non-array data', async () => {
      const invalidData = mockReportRecord as any; // not an array

      await expect(databaseService.bulkInsertReportData(invalidData)).rejects.toMatchObject({
        type: ErrorType.VALIDATION_ERROR,
        message: 'Report data must be an array'
      });
    });

    it('should reject empty array', async () => {
      await expect(databaseService.bulkInsertReportData([])).rejects.toMatchObject({
        type: ErrorType.VALIDATION_ERROR,
        message: 'Report data array cannot be empty'
      });
    });

    it('should validate date format', async () => {
      const invalidData = [{ ...mockReportRecord, reportDate: 'invalid-date' }];

      await expect(databaseService.bulkInsertReportData(invalidData)).rejects.toMatchObject({
        type: ErrorType.VALIDATION_ERROR,
        message: 'Invalid date format in record 0: invalid-date'
      });
    });

    it('should validate numeric fields', async () => {
      const invalidData = [{ ...mockReportRecord, atividade: 'not-a-number' as any }];

      await expect(databaseService.bulkInsertReportData(invalidData)).rejects.toMatchObject({
        type: ErrorType.VALIDATION_ERROR,
        message: 'Invalid numeric value for atividade in record 0: not-a-number'
      });
    });

    it('should validate aggregation pipeline is array', async () => {
      const invalidPipeline = {} as any;

      await expect(databaseService.aggregateReportData(invalidPipeline)).rejects.toMatchObject({
        type: ErrorType.VALIDATION_ERROR,
        message: 'Aggregation pipeline must be an array'
      });
    });

    it('should validate aggregation pipeline is not empty', async () => {
      await expect(databaseService.aggregateReportData([])).rejects.toMatchObject({
        type: ErrorType.VALIDATION_ERROR,
        message: 'Aggregation pipeline cannot be empty'
      });
    });
  });

  describe('error handling', () => {
    it('should handle 400 bad request error', async () => {
      const mockError = {
        isAxiosError: true,
        response: {
          status: 400,
          data: { error: 'Invalid request format' }
        }
      };
      mockedAxios.post.mockRejectedValueOnce(mockError);
      mockedAxios.isAxiosError.mockReturnValue(true);

      await expect(databaseService.bulkInsertReportData([mockReportRecord])).rejects.toMatchObject({
        type: ErrorType.VALIDATION_ERROR,
        message: 'Invalid request for bulk insert'
      });
    });

    it('should handle 404 collection not found error', async () => {
      const mockError = {
        isAxiosError: true,
        response: {
          status: 404,
          data: { error: 'Collection not found' }
        }
      };
      mockedAxios.get.mockRejectedValueOnce(mockError);
      mockedAxios.isAxiosError.mockReturnValue(true);

      await expect(databaseService.getReportData()).rejects.toMatchObject({
        type: ErrorType.FUNIFIER_API_ERROR,
        message: 'Collection not found for get report data'
      });
    });

    it('should handle 500 server error', async () => {
      const mockError = {
        isAxiosError: true,
        response: {
          status: 500,
          data: { error: 'Internal server error' }
        }
      };
      mockedAxios.post.mockRejectedValueOnce(mockError);
      mockedAxios.isAxiosError.mockReturnValue(true);

      await expect(databaseService.aggregateReportData([{ $match: {} }])).rejects.toMatchObject({
        type: ErrorType.FUNIFIER_API_ERROR,
        message: 'Funifier server error during aggregation query'
      });
    });
  });

  describe('singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = FunifierDatabaseService.getInstance();
      const instance2 = FunifierDatabaseService.getInstance();
      
      expect(instance1).toBe(instance2);
      expect(instance1).toBe(funifierDatabaseService);
    });
  });
});