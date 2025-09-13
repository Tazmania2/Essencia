import axios, { AxiosError } from 'axios';
import { ErrorHandlerService, errorHandlerService } from '../error-handler.service';
import { ApiError, ErrorType } from '../../types';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock navigator
Object.defineProperty(window, 'navigator', {
  value: { userAgent: 'test-agent' },
  writable: true,
});

// Mock window.location
Object.defineProperty(window, 'location', {
  value: { href: 'http://localhost:3000/test' },
  writable: true,
});

describe('ErrorHandlerService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('[]');
  });

  describe('handleFunifierError', () => {
    it('handles timeout errors correctly', () => {
      const timeoutError: Partial<AxiosError> = {
        code: 'ECONNABORTED',
        message: 'timeout of 10000ms exceeded',
        isAxiosError: true,
      };

      mockedAxios.isAxiosError.mockReturnValue(true);

      const result = errorHandlerService.handleFunifierError(timeoutError, 'test-context');

      expect(result).toBeInstanceOf(ApiError);
      expect(result.type).toBe(ErrorType.NETWORK_ERROR);
      expect(result.message).toBe('Tempo limite de conexão excedido');
      expect(result.details).toEqual({
        context: 'test-context',
        originalError: 'timeout of 10000ms exceeded',
      });
    });

    it('handles 401 authentication errors', () => {
      const authError: Partial<AxiosError> = {
        isAxiosError: true,
        response: {
          status: 401,
          data: { error: 'Invalid credentials' },
        } as any,
      };

      mockedAxios.isAxiosError.mockReturnValue(true);

      const result = errorHandlerService.handleFunifierError(authError, 'auth-test');

      expect(result.type).toBe(ErrorType.AUTHENTICATION_ERROR);
      expect(result.message).toBe('Credenciais inválidas ou sessão expirada');
      expect(result.details).toEqual({
        context: 'auth-test',
        status: 401,
        data: { error: 'Invalid credentials' },
      });
    });

    it('handles 429 rate limit errors', () => {
      const rateLimitError: Partial<AxiosError> = {
        isAxiosError: true,
        response: {
          status: 429,
          data: { error: 'Rate limit exceeded' },
        } as any,
      };

      mockedAxios.isAxiosError.mockReturnValue(true);

      const result = errorHandlerService.handleFunifierError(rateLimitError);

      expect(result.type).toBe(ErrorType.FUNIFIER_API_ERROR);
      expect(result.message).toBe('Muitas requisições. Tente novamente em alguns instantes');
    });

    it('handles 500 server errors', () => {
      const serverError: Partial<AxiosError> = {
        isAxiosError: true,
        response: {
          status: 500,
          data: { error: 'Internal server error' },
        } as any,
      };

      mockedAxios.isAxiosError.mockReturnValue(true);

      const result = errorHandlerService.handleFunifierError(serverError);

      expect(result.type).toBe(ErrorType.FUNIFIER_API_ERROR);
      expect(result.message).toBe('Erro interno do servidor Funifier');
    });

    it('handles network errors without response', () => {
      const networkError: Partial<AxiosError> = {
        isAxiosError: true,
        request: {},
        message: 'Network Error',
      };

      mockedAxios.isAxiosError.mockReturnValue(true);

      const result = errorHandlerService.handleFunifierError(networkError);

      expect(result.type).toBe(ErrorType.NETWORK_ERROR);
      expect(result.message).toBe('Erro de rede - sem resposta do servidor');
    });

    it('handles existing ApiError instances', () => {
      const existingError = new ApiError({
        type: ErrorType.VALIDATION_ERROR,
        message: 'Existing error',
        timestamp: new Date(),
      });

      const result = errorHandlerService.handleFunifierError(existingError);

      expect(result).toBe(existingError);
    });

    it('handles unknown errors', () => {
      const unknownError = new Error('Unknown error');

      mockedAxios.isAxiosError.mockReturnValue(false);

      const result = errorHandlerService.handleFunifierError(unknownError);

      expect(result.type).toBe(ErrorType.FUNIFIER_API_ERROR);
      expect(result.message).toBe('Erro desconhecido na API Funifier');
    });
  });

  describe('handleValidationError', () => {
    it('creates validation error from Error instance', () => {
      const validationError = new Error('Field is required');

      const result = errorHandlerService.handleValidationError(validationError, 'form-validation');

      expect(result.type).toBe(ErrorType.VALIDATION_ERROR);
      expect(result.message).toBe('Erro de validação: Field is required');
      expect(result.details).toEqual({ context: 'form-validation' });
    });

    it('creates validation error from string', () => {
      const result = errorHandlerService.handleValidationError('Invalid input', 'input-validation');

      expect(result.type).toBe(ErrorType.VALIDATION_ERROR);
      expect(result.message).toBe('Erro de validação: Invalid input');
    });
  });

  describe('getUserFriendlyMessage', () => {
    it('returns appropriate message for authentication errors', () => {
      const authError = new ApiError({
        type: ErrorType.AUTHENTICATION_ERROR,
        message: 'Auth failed',
        timestamp: new Date(),
      });

      const message = errorHandlerService.getUserFriendlyMessage(authError);

      expect(message).toBe('Erro de autenticação. Por favor, faça login novamente.');
    });

    it('returns appropriate message for network errors', () => {
      const networkError = new ApiError({
        type: ErrorType.NETWORK_ERROR,
        message: 'Network failed',
        timestamp: new Date(),
      });

      const message = errorHandlerService.getUserFriendlyMessage(networkError);

      expect(message).toBe('Problema de conexão. Verifique sua internet e tente novamente.');
    });

    it('returns generic message for regular errors', () => {
      const regularError = new Error('Regular error');

      const message = errorHandlerService.getUserFriendlyMessage(regularError);

      expect(message).toBe('Ocorreu um erro inesperado. Tente novamente.');
    });
  });

  describe('isRecoverableError', () => {
    it('returns true for network errors', () => {
      const networkError = new ApiError({
        type: ErrorType.NETWORK_ERROR,
        message: 'Network error',
        timestamp: new Date(),
      });

      expect(errorHandlerService.isRecoverableError(networkError)).toBe(true);
    });

    it('returns false for authentication errors', () => {
      const authError = new ApiError({
        type: ErrorType.AUTHENTICATION_ERROR,
        message: 'Auth error',
        timestamp: new Date(),
      });

      expect(errorHandlerService.isRecoverableError(authError)).toBe(false);
    });

    it('returns true for regular errors', () => {
      const regularError = new Error('Regular error');

      expect(errorHandlerService.isRecoverableError(regularError)).toBe(true);
    });
  });

  describe('getErrorSeverity', () => {
    it('returns correct severity for different error types', () => {
      const validationError = new ApiError({
        type: ErrorType.VALIDATION_ERROR,
        message: 'Validation error',
        timestamp: new Date(),
      });

      const networkError = new ApiError({
        type: ErrorType.NETWORK_ERROR,
        message: 'Network error',
        timestamp: new Date(),
      });

      const authError = new ApiError({
        type: ErrorType.AUTHENTICATION_ERROR,
        message: 'Auth error',
        timestamp: new Date(),
      });

      expect(errorHandlerService.getErrorSeverity(validationError)).toBe('low');
      expect(errorHandlerService.getErrorSeverity(networkError)).toBe('medium');
      expect(errorHandlerService.getErrorSeverity(authError)).toBe('critical');
    });
  });

  describe('logError', () => {
    it('logs error to localStorage in development', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error = new Error('Test error');

      await errorHandlerService.logError(error, 'test-context', 'user123');

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'errorLogs',
        expect.stringContaining('Test error')
      );

      process.env.NODE_ENV = originalEnv;
    });

    it('handles logging errors gracefully', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const error = new Error('Test error');

      await errorHandlerService.logError(error);

      expect(consoleSpy).toHaveBeenCalledWith('Failed to log error:', expect.any(Error));

      consoleSpy.mockRestore();
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('clearErrorLogs', () => {
    it('clears error logs in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      errorHandlerService.clearErrorLogs();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('errorLogs');

      process.env.NODE_ENV = originalEnv;
    });

    it('does nothing in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      errorHandlerService.clearErrorLogs();

      expect(localStorageMock.removeItem).not.toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('getErrorLogs', () => {
    it('returns parsed error logs in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const mockLogs = [
        { message: 'Error 1', timestamp: '2023-01-01' },
        { message: 'Error 2', timestamp: '2023-01-02' },
      ];

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockLogs));

      const logs = errorHandlerService.getErrorLogs();

      expect(logs).toEqual(mockLogs);
      expect(localStorageMock.getItem).toHaveBeenCalledWith('errorLogs');

      process.env.NODE_ENV = originalEnv;
    });

    it('returns empty array in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const logs = errorHandlerService.getErrorLogs();

      expect(logs).toEqual([]);
      expect(localStorageMock.getItem).not.toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });
  });
});