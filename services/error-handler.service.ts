import axios, { AxiosError } from 'axios';
import { ApiError, ErrorType } from '../types';

export interface ErrorLogData {
  message: string;
  stack?: string;
  errorType: ErrorType;
  context?: string;
  userId?: string;
  timestamp: string;
  userAgent?: string;
  url?: string;
  additionalData?: Record<string, any>;
}

export class ErrorHandlerService {
  private static instance: ErrorHandlerService;

  private constructor() {}

  public static getInstance(): ErrorHandlerService {
    if (!ErrorHandlerService.instance) {
      ErrorHandlerService.instance = new ErrorHandlerService();
    }
    return ErrorHandlerService.instance;
  }

  /**
   * Handle Funifier API errors and convert to ApiError
   */
  public handleFunifierError(error: unknown, context?: string): ApiError {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      
      // Handle timeout errors
      if (axiosError.code === 'ECONNABORTED') {
        return new ApiError({
          type: ErrorType.NETWORK_ERROR,
          message: 'Tempo limite de conexão excedido',
          details: { context, originalError: axiosError.message },
          timestamp: new Date()
        });
      }

      // Handle response errors
      if (axiosError.response) {
        const status = axiosError.response.status;
        const data = axiosError.response.data as any;

        switch (status) {
          case 400:
            return new ApiError({
              type: ErrorType.VALIDATION_ERROR,
              message: 'Dados inválidos enviados para a API',
              details: { context, status, data },
              timestamp: new Date()
            });
          case 401:
            return new ApiError({
              type: ErrorType.AUTHENTICATION_ERROR,
              message: 'Credenciais inválidas ou sessão expirada',
              details: { context, status, data },
              timestamp: new Date()
            });
          case 403:
            return new ApiError({
              type: ErrorType.AUTHENTICATION_ERROR,
              message: 'Acesso negado',
              details: { context, status, data },
              timestamp: new Date()
            });
          case 404:
            return new ApiError({
              type: ErrorType.FUNIFIER_API_ERROR,
              message: 'Recurso não encontrado na API',
              details: { context, status, data },
              timestamp: new Date()
            });
          case 429:
            return new ApiError({
              type: ErrorType.FUNIFIER_API_ERROR,
              message: 'Muitas requisições. Tente novamente em alguns instantes',
              details: { context, status, data },
              timestamp: new Date()
            });
          case 500:
          case 502:
          case 503:
          case 504:
            return new ApiError({
              type: ErrorType.FUNIFIER_API_ERROR,
              message: 'Erro interno do servidor Funifier',
              details: { context, status, data },
              timestamp: new Date()
            });
          default:
            return new ApiError({
              type: ErrorType.FUNIFIER_API_ERROR,
              message: `Erro da API Funifier (${status})`,
              details: { context, status, data },
              timestamp: new Date()
            });
        }
      }

      // Handle request errors (no response)
      if (axiosError.request) {
        return new ApiError({
          type: ErrorType.NETWORK_ERROR,
          message: 'Erro de rede - sem resposta do servidor',
          details: { context, originalError: axiosError.message },
          timestamp: new Date()
        });
      }
    }

    // Handle non-axios errors
    if (error instanceof ApiError) {
      return error;
    }

    return new ApiError({
      type: ErrorType.FUNIFIER_API_ERROR,
      message: 'Erro desconhecido na API Funifier',
      details: { 
        context, 
        originalError: error instanceof Error ? error.message : String(error) 
      },
      timestamp: new Date()
    });
  }

  /**
   * Handle validation errors
   */
  public handleValidationError(error: unknown, context?: string): ApiError {
    const message = error instanceof Error ? error.message : String(error);
    
    return new ApiError({
      type: ErrorType.VALIDATION_ERROR,
      message: `Erro de validação: ${message}`,
      details: { context },
      timestamp: new Date()
    });
  }

  /**
   * Handle data processing errors
   */
  public handleDataProcessingError(error: unknown, context?: string): ApiError {
    const message = error instanceof Error ? error.message : String(error);
    
    return new ApiError({
      type: ErrorType.DATA_PROCESSING_ERROR,
      message: `Erro ao processar dados: ${message}`,
      details: { context },
      timestamp: new Date()
    });
  }

  /**
   * Handle network errors
   */
  public handleNetworkError(error: unknown, context?: string): ApiError {
    const message = error instanceof Error ? error.message : String(error);
    
    return new ApiError({
      type: ErrorType.NETWORK_ERROR,
      message: `Erro de rede: ${message}`,
      details: { context },
      timestamp: new Date()
    });
  }

  /**
   * Log error to monitoring service
   */
  public async logError(error: Error | ApiError, context?: string, userId?: string): Promise<void> {
    try {
      const errorData: ErrorLogData = {
        message: error.message,
        stack: error.stack,
        errorType: error instanceof ApiError ? error.type : ErrorType.DATA_PROCESSING_ERROR,
        context,
        userId,
        timestamp: new Date().toISOString(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        additionalData: error instanceof ApiError ? error.details : undefined,
      };

      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Error logged:', errorData);
      }

      // In production, send to monitoring service
      if (process.env.NODE_ENV === 'production') {
        // TODO: Implement actual logging service integration
        // Examples: Sentry, LogRocket, DataDog, etc.
        // await this.sendToMonitoringService(errorData);
      }

      // Store in local storage for debugging (development only)
      if (process.env.NODE_ENV === 'development' && typeof localStorage !== 'undefined') {
        const existingLogs = JSON.parse(localStorage.getItem('errorLogs') || '[]');
        existingLogs.push(errorData);
        
        // Keep only last 50 errors
        if (existingLogs.length > 50) {
          existingLogs.splice(0, existingLogs.length - 50);
        }
        
        localStorage.setItem('errorLogs', JSON.stringify(existingLogs));
      }
    } catch (loggingError) {
      console.error('Failed to log error:', loggingError);
    }
  }

  /**
   * Get user-friendly error message
   */
  public getUserFriendlyMessage(error: Error | ApiError): string {
    if (error instanceof ApiError) {
      switch (error.type) {
        case ErrorType.AUTHENTICATION_ERROR:
          return 'Erro de autenticação. Por favor, faça login novamente.';
        case ErrorType.FUNIFIER_API_ERROR:
          return 'Erro na comunicação com o servidor. Tente novamente em alguns instantes.';
        case ErrorType.NETWORK_ERROR:
          return 'Problema de conexão. Verifique sua internet e tente novamente.';
        case ErrorType.DATA_PROCESSING_ERROR:
          return 'Erro ao processar dados. Nossa equipe foi notificada.';
        case ErrorType.VALIDATION_ERROR:
          return 'Dados inválidos. Verifique as informações e tente novamente.';
        default:
          return 'Ocorreu um erro inesperado. Tente novamente.';
      }
    }

    return 'Ocorreu um erro inesperado. Tente novamente.';
  }

  /**
   * Check if error is recoverable (user can retry)
   */
  public isRecoverableError(error: Error | ApiError): boolean {
    if (error instanceof ApiError) {
      switch (error.type) {
        case ErrorType.NETWORK_ERROR:
        case ErrorType.FUNIFIER_API_ERROR:
          return true;
        case ErrorType.AUTHENTICATION_ERROR:
        case ErrorType.VALIDATION_ERROR:
        case ErrorType.DATA_PROCESSING_ERROR:
          return false;
        default:
          return true;
      }
    }
    return true;
  }

  /**
   * Get error severity level
   */
  public getErrorSeverity(error: Error | ApiError): 'low' | 'medium' | 'high' | 'critical' {
    if (error instanceof ApiError) {
      switch (error.type) {
        case ErrorType.VALIDATION_ERROR:
          return 'low';
        case ErrorType.NETWORK_ERROR:
          return 'medium';
        case ErrorType.FUNIFIER_API_ERROR:
          return 'high';
        case ErrorType.AUTHENTICATION_ERROR:
        case ErrorType.DATA_PROCESSING_ERROR:
          return 'critical';
        default:
          return 'medium';
      }
    }
    return 'medium';
  }

  /**
   * Clear error logs (development only)
   */
  public clearErrorLogs(): void {
    if (process.env.NODE_ENV === 'development' && typeof localStorage !== 'undefined') {
      localStorage.removeItem('errorLogs');
    }
  }

  /**
   * Get stored error logs (development only)
   */
  public getErrorLogs(): ErrorLogData[] {
    if (process.env.NODE_ENV === 'development' && typeof localStorage !== 'undefined') {
      return JSON.parse(localStorage.getItem('errorLogs') || '[]');
    }
    return [];
  }
}

// Export singleton instance
export const errorHandlerService = ErrorHandlerService.getInstance();