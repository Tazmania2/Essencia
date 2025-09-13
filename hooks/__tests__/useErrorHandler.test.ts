import { renderHook, act } from '@testing-library/react';
import { useErrorHandler } from '../useErrorHandler';
import { ApiError, ErrorType } from '../../types';

// Mock the error handler service
jest.mock('../../services/error-handler.service', () => ({
  errorHandlerService: {
    logError: jest.fn(),
    handleFunifierError: jest.fn((error) => new ApiError({
      type: ErrorType.FUNIFIER_API_ERROR,
      message: 'Mocked Funifier error',
      timestamp: new Date()
    })),
    handleValidationError: jest.fn((error) => new ApiError({
      type: ErrorType.VALIDATION_ERROR,
      message: 'Mocked validation error',
      timestamp: new Date()
    })),
    handleNetworkError: jest.fn((error) => new ApiError({
      type: ErrorType.NETWORK_ERROR,
      message: 'Mocked network error',
      timestamp: new Date()
    })),
    handleDataProcessingError: jest.fn((error) => new ApiError({
      type: ErrorType.DATA_PROCESSING_ERROR,
      message: 'Mocked data processing error',
      timestamp: new Date()
    })),
    getUserFriendlyMessage: jest.fn((error) => {
      if (error instanceof ApiError) {
        switch (error.type) {
          case ErrorType.AUTHENTICATION_ERROR:
            return 'Authentication error message';
          case ErrorType.NETWORK_ERROR:
            return 'Network error message';
          default:
            return 'Generic error message';
        }
      }
      return 'Unknown error message';
    }),
    isRecoverableError: jest.fn((error) => {
      if (error instanceof ApiError) {
        return error.type === ErrorType.NETWORK_ERROR || error.type === ErrorType.FUNIFIER_API_ERROR;
      }
      return true;
    }),
    getErrorSeverity: jest.fn((error) => {
      if (error instanceof ApiError) {
        switch (error.type) {
          case ErrorType.VALIDATION_ERROR:
            return 'low';
          case ErrorType.NETWORK_ERROR:
            return 'medium';
          case ErrorType.AUTHENTICATION_ERROR:
            return 'critical';
          default:
            return 'medium';
        }
      }
      return 'medium';
    }),
  },
}));

describe('useErrorHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes with no error', () => {
    const { result } = renderHook(() => useErrorHandler());

    expect(result.current.error).toBeNull();
    expect(result.current.hasError).toBe(false);
    expect(result.current.isRecoverable).toBe(false);
    expect(result.current.userMessage).toBe('');
    expect(result.current.errorSeverity).toBe('medium');
  });

  it('sets error correctly', () => {
    const { result } = renderHook(() => useErrorHandler());

    const testError = new Error('Test error');

    act(() => {
      result.current.setError(testError);
    });

    expect(result.current.error).toBeInstanceOf(ApiError);
    expect(result.current.hasError).toBe(true);
    expect(result.current.error?.message).toBe('Test error');
    expect(result.current.error?.type).toBe(ErrorType.DATA_PROCESSING_ERROR);
  });

  it('sets ApiError directly', () => {
    const { result } = renderHook(() => useErrorHandler());

    const apiError = new ApiError({
      type: ErrorType.AUTHENTICATION_ERROR,
      message: 'Auth error',
      timestamp: new Date()
    });

    act(() => {
      result.current.setError(apiError);
    });

    expect(result.current.error).toBe(apiError);
    expect(result.current.hasError).toBe(true);
    expect(result.current.error?.type).toBe(ErrorType.AUTHENTICATION_ERROR);
  });

  it('clears error correctly', () => {
    const { result } = renderHook(() => useErrorHandler());

    const testError = new Error('Test error');

    act(() => {
      result.current.setError(testError);
    });

    expect(result.current.hasError).toBe(true);

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
    expect(result.current.hasError).toBe(false);
  });

  it('sets error to null when passed null', () => {
    const { result } = renderHook(() => useErrorHandler());

    const testError = new Error('Test error');

    act(() => {
      result.current.setError(testError);
    });

    expect(result.current.hasError).toBe(true);

    act(() => {
      result.current.setError(null);
    });

    expect(result.current.error).toBeNull();
    expect(result.current.hasError).toBe(false);
  });

  it('handles generic errors', () => {
    const { result } = renderHook(() => useErrorHandler());

    act(() => {
      result.current.handleError('String error', 'test-context');
    });

    expect(result.current.error).toBeInstanceOf(ApiError);
    expect(result.current.error?.message).toBe('String error');
    expect(result.current.error?.type).toBe(ErrorType.DATA_PROCESSING_ERROR);
  });

  it('handles Funifier errors', () => {
    const { result } = renderHook(() => useErrorHandler());
    const { errorHandlerService } = require('../../services/error-handler.service');

    act(() => {
      result.current.handleFunifierError(new Error('Funifier error'), 'api-call');
    });

    expect(errorHandlerService.handleFunifierError).toHaveBeenCalledWith(
      expect.any(Error),
      'api-call'
    );
    expect(result.current.error?.type).toBe(ErrorType.FUNIFIER_API_ERROR);
  });

  it('handles validation errors', () => {
    const { result } = renderHook(() => useErrorHandler());
    const { errorHandlerService } = require('../../services/error-handler.service');

    act(() => {
      result.current.handleValidationError(new Error('Validation error'), 'form-validation');
    });

    expect(errorHandlerService.handleValidationError).toHaveBeenCalledWith(
      expect.any(Error),
      'form-validation'
    );
    expect(result.current.error?.type).toBe(ErrorType.VALIDATION_ERROR);
  });

  it('handles network errors', () => {
    const { result } = renderHook(() => useErrorHandler());
    const { errorHandlerService } = require('../../services/error-handler.service');

    act(() => {
      result.current.handleNetworkError(new Error('Network error'), 'network-request');
    });

    expect(errorHandlerService.handleNetworkError).toHaveBeenCalledWith(
      expect.any(Error),
      'network-request'
    );
    expect(result.current.error?.type).toBe(ErrorType.NETWORK_ERROR);
  });

  it('handles data processing errors', () => {
    const { result } = renderHook(() => useErrorHandler());
    const { errorHandlerService } = require('../../services/error-handler.service');

    act(() => {
      result.current.handleDataProcessingError(new Error('Processing error'), 'data-processing');
    });

    expect(errorHandlerService.handleDataProcessingError).toHaveBeenCalledWith(
      expect.any(Error),
      'data-processing'
    );
    expect(result.current.error?.type).toBe(ErrorType.DATA_PROCESSING_ERROR);
  });

  it('provides correct user message', () => {
    const { result } = renderHook(() => useErrorHandler());

    const authError = new ApiError({
      type: ErrorType.AUTHENTICATION_ERROR,
      message: 'Auth failed',
      timestamp: new Date()
    });

    act(() => {
      result.current.setError(authError);
    });

    expect(result.current.userMessage).toBe('Authentication error message');
  });

  it('provides correct recoverable status', () => {
    const { result } = renderHook(() => useErrorHandler());

    const networkError = new ApiError({
      type: ErrorType.NETWORK_ERROR,
      message: 'Network failed',
      timestamp: new Date()
    });

    act(() => {
      result.current.setError(networkError);
    });

    expect(result.current.isRecoverable).toBe(true);

    const authError = new ApiError({
      type: ErrorType.AUTHENTICATION_ERROR,
      message: 'Auth failed',
      timestamp: new Date()
    });

    act(() => {
      result.current.setError(authError);
    });

    expect(result.current.isRecoverable).toBe(false);
  });

  it('provides correct error severity', () => {
    const { result } = renderHook(() => useErrorHandler());

    const validationError = new ApiError({
      type: ErrorType.VALIDATION_ERROR,
      message: 'Validation failed',
      timestamp: new Date()
    });

    act(() => {
      result.current.setError(validationError);
    });

    expect(result.current.errorSeverity).toBe('low');

    const authError = new ApiError({
      type: ErrorType.AUTHENTICATION_ERROR,
      message: 'Auth failed',
      timestamp: new Date()
    });

    act(() => {
      result.current.setError(authError);
    });

    expect(result.current.errorSeverity).toBe('critical');
  });

  it('logs errors when set', () => {
    const { result } = renderHook(() => useErrorHandler());
    const { errorHandlerService } = require('../../services/error-handler.service');

    const testError = new Error('Test error');

    act(() => {
      result.current.setError(testError);
    });

    expect(errorHandlerService.logError).toHaveBeenCalledWith(
      expect.any(ApiError)
    );
  });

  it('logs errors with context when using handle methods', () => {
    const { result } = renderHook(() => useErrorHandler());
    const { errorHandlerService } = require('../../services/error-handler.service');

    act(() => {
      result.current.handleError(new Error('Test error'), 'test-context');
    });

    expect(errorHandlerService.logError).toHaveBeenCalledWith(
      expect.any(ApiError),
      'test-context'
    );
  });
});