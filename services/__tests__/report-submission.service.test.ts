import { ReportSubmissionService } from '../report-submission.service';
import { ParseResult } from '../report-processing.service';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('ReportSubmissionService', () => {
  let service: ReportSubmissionService;

  beforeEach(() => {
    service = ReportSubmissionService.getInstance();
    jest.clearAllMocks();
  });

  describe('submitReport', () => {
    it('should complete the full submission workflow', async () => {
      const mockParseResult: ParseResult = {
        data: [
          {
            playerId: 'player123',
            diaDociclo: 15,
            totalDiasCiclo: 21,
            faturamentoMeta: 100000,
            faturamentoAtual: 80000,
            faturamentoPercentual: 80,
            reaisPorAtivoMeta: 1000,
            reaisPorAtivoAtual: 900,
            reaisPorAtivoPercentual: 90,
            multimarcasPorAtivoMeta: 50,
            multimarcasPorAtivoAtual: 45,
            multimarcasPorAtivoPercentual: 90,
            atividadeMeta: 100,
            atividadeAtual: 95,
            atividadePercentual: 95,
            reportDate: '2024-01-15T10:00:00.000Z'
          }
        ],
        errors: [],
        isValid: true
      };

      const mockFile = new File(['test'], 'test.csv', { type: 'text/csv' });

      // Mock API responses
      mockedAxios.post
        // Step 1: Store report data (individual POST)
        .mockResolvedValueOnce({
          data: { 
            _id: 'record123',
            playerId: 'player123',
            diaDociclo: 15,
            totalDiasCiclo: 21,
            faturamentoPercentual: 80,
            reaisPorAtivoPercentual: 90,
            multimarcasPorAtivoPercentual: 90,
            atividadePercentual: 95,
            reportDate: '2024-01-15',
            time: 1695147234712, // Unix timestamp with milliseconds
            status: 'PENDING',
            createdAt: '2024-01-15T10:00:00.000Z',
            updatedAt: '2024-01-15T10:00:00.000Z'
          }
        })
        // Step 2: Create action logs
        .mockResolvedValueOnce({
          data: { total_registered: 4 }
        })
        // Step 3: Upload file
        .mockResolvedValueOnce({
          data: {
            uploads: [{ url: 'https://example.com/file.csv' }]
          }
        });

      // Mock GET for fetching previous data (no previous data)
      mockedAxios.get.mockResolvedValueOnce({
        data: [] // Empty array means no previous data
      });

      // Mock PUT for record updates
      mockedAxios.put.mockResolvedValueOnce({
        data: { 
          _id: 'record123',
          status: 'REGISTERED',
          time: 1695147234712,
          uploadUrl: 'https://example.com/file.csv'
        }
      });

      const result = await service.submitReport(mockParseResult, mockFile);

      expect(result.success).toBe(true);
      expect(result.recordsProcessed).toBe(1);
      expect(result.actionLogsCreated).toBe(4);
      expect(result.uploadUrl).toBe('https://example.com/file.csv');
      expect(result.differences).toHaveLength(4); // 4 metrics
      expect(result.errors).toHaveLength(0);

      // Verify API calls
      expect(mockedAxios.post).toHaveBeenCalledTimes(3); // Individual POST, action logs, upload
      expect(mockedAxios.get).toHaveBeenCalledTimes(1); // GET for previous data
      expect(mockedAxios.put).toHaveBeenCalledTimes(1); // Individual PUT for update
    });

    it('should handle errors gracefully', async () => {
      const mockParseResult: ParseResult = {
        data: [],
        errors: [],
        isValid: true
      };

      const mockFile = new File(['test'], 'test.csv', { type: 'text/csv' });

      // Mock API error
      mockedAxios.post.mockRejectedValueOnce(new Error('API Error'));

      const result = await service.submitReport(mockParseResult, mockFile);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('API Error');
    });
  });

  describe('getInstance', () => {
    it('should return the same instance (singleton)', () => {
      const instance1 = ReportSubmissionService.getInstance();
      const instance2 = ReportSubmissionService.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });
});