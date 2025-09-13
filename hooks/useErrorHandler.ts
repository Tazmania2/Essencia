import { useState, useCallback } from 'react';
import { ApiError, ErrorType } from '../types';
import { errorHandlerService } from '../services/error-handler.service';

interface UseErrorHandlerReturn {
  error: ApiError | null;
  hasError: boolean;
  setError: (error: Error | ApiError | null) => void;
  clearError: () => void;
  handleError: (error: unknown, context?: string) => void;
  handleFunifierError: (error: unknown, context?: string) => void;
  handleValidationError: (error: unknown, context?: string) => void;
  handleNetworkError: (error: unknown, context?: string) => void;
  handleDataProcessingError: (error: unknown, context?: string) => void;
  isRecoverable: boolean;
  userMessage: string;
  errorSeverity: 'low' | 'medium' | 'high' | 'critical';
}

export const useErrorHandler = (): UseErrorHandlerReturn => {
  const [error, setErrorState] = useState<ApiError | null>(null);

  const setError = useCallback((error: Error | ApiError | null) => {
    if (error === null) {
      setErrorState(null);
      return;
    }

    let apiError: ApiError;
    
    if (error instanceof ApiError) {
      apiError = error;
    } else {
      apiError = new ApiError({
        type: ErrorType.DATA_PROCESSING_ERROR,
        message: error.message,
        timestamp: new Date()
      });
    }

    setErrorState(apiError);
    
    // Log the error
    errorHandlerService.logError(apiError);
  }, []);

  const clearError = useCallback(() => {
    setErrorState(null);
  }, []);

  const handleError = useCallback((error: unknown, context?: string) => {
    let apiError: ApiError;

    if (error instanceof ApiError) {
      apiError = error;
    } else if (error instanceof Error) {
      apiError = new ApiError({
        type: ErrorType.DATA_PROCESSING_ERROR,
        message: error.message,
        details: { context },
        timestamp: new Date()
      });
    } else {
      apiError = new ApiError({
        type: ErrorType.DATA_PROCESSING_ERROR,
        message: String(error),
        details: { context },
        timestamp: new Date()
      });
    }

    setErrorState(apiError);
    errorHandlerService.logError(apiError, context);
  }, []);

  const handleFunifierError = useCallback((error: unknown, context?: string) => {
    const apiError = errorHandlerService.handleFunifierError(error, context);
    setErrorState(apiError);
  }, []);

  const handleValidationError = useCallback((error: unknown, context?: string) => {
    const apiError = errorHandlerService.handleValidationError(error, context);
    setErrorState(apiError);
  }, []);

  const handleNetworkError = useCallback((error: unknown, context?: string) => {
    const apiError = errorHandlerService.handleNetworkError(error, context);
    setErrorState(apiError);
  }, []);

  const handleDataProcessingError = useCallback((error: unknown, context?: string) => {
    const apiError = errorHandlerService.handleDataProcessingError(error, context);
    setErrorState(apiError);
  }, []);

  const hasError = error !== null;
  const isRecoverable = error ? errorHandlerService.isRecoverableError(error) : false;
  const userMessage = error ? errorHandlerService.getUserFriendlyMessage(error) : '';
  const errorSeverity = error ? errorHandlerService.getErrorSeverity(error) : 'medium';

  return {
    error,
    hasError,
    setError,
    clearError,
    handleError,
    handleFunifierError,
    handleValidationError,
    handleNetworkError,
    handleDataProcessingError,
    isRecoverable,
    userMessage,
    errorSeverity,
  };
};