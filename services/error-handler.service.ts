import { ApiError, ErrorType } from '../types';

export class ErrorHandlerService {
  private static instance: ErrorHandlerService;

  public static getInstance(): ErrorHandlerService {
    if (!ErrorHandlerService.instance) {
      ErrorHandlerService.instance = new ErrorHandlerService();
    }
    return ErrorHandlerService.instance;
  }

  handleValidationError(error: unknown, context: string): ApiError {
    if (error instanceof ApiError) {
      return error;
    }

    return new ApiError({
      type: ErrorType.VALIDATION_ERROR,
      message: error instanceof Error ? error.message : 'Unknown validation error',
      details: { context, originalError: error },
      timestamp: new Date()
    });
  }

  handleDataProcessingError(error: Error, context: string): ApiError {
    return new ApiError({
      type: ErrorType.DATA_PROCESSING_ERROR,
      message: error.message,
      details: { context },
      timestamp: new Date()
    });
  }

  logError(error: ApiError, context: string): void {
    console.error(`[${context}] ${error.type}: ${error.message}`, error.details);
  }

  getUserFriendlyMessage(error: ApiError): string {
    switch (error.type) {
      case ErrorType.AUTHENTICATION_ERROR:
        return 'Erro de autenticação. Verifique suas credenciais.';
      case ErrorType.VALIDATION_ERROR:
        return 'Dados inválidos. Verifique as informações fornecidas.';
      case ErrorType.NETWORK_ERROR:
        return 'Erro de conexão. Verifique sua internet.';
      default:
        return 'Ocorreu um erro inesperado. Tente novamente.';
    }
  }

  handleFunifierError(error: unknown, context?: string): ApiError {
    if (error instanceof ApiError) {
      return error;
    }

    return new ApiError({
      type: ErrorType.FUNIFIER_API_ERROR,
      message: error instanceof Error ? error.message : 'Unknown Funifier API error',
      details: { context: context || 'funifier', originalError: error },
      timestamp: new Date()
    });
  }

  handleNetworkError(error: unknown, context?: string): ApiError {
    if (error instanceof ApiError) {
      return error;
    }

    return new ApiError({
      type: ErrorType.NETWORK_ERROR,
      message: error instanceof Error ? error.message : 'Network connection error',
      details: { context: context || 'network', originalError: error },
      timestamp: new Date()
    });
  }

  getErrorSeverity(error: Error | ApiError): 'low' | 'medium' | 'high' | 'critical' {
    if (error instanceof ApiError) {
      switch (error.type) {
        case ErrorType.AUTHENTICATION_ERROR:
          return 'high';
        case ErrorType.VALIDATION_ERROR:
          return 'medium';
        case ErrorType.NETWORK_ERROR:
          return 'medium';
        case ErrorType.DATA_PROCESSING_ERROR:
          return 'high';
        default:
          return 'medium';
      }
    }
    return 'medium'; // Regular errors are medium severity by default
  }

  isRecoverableError(error: Error | ApiError): boolean {
    if (error instanceof ApiError) {
      return error.type === ErrorType.NETWORK_ERROR || 
             error.type === ErrorType.VALIDATION_ERROR;
    }
    return true; // Regular errors are generally recoverable
  }
}

export const errorHandlerService = ErrorHandlerService.getInstance();