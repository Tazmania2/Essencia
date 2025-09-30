'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { ApiError } from '../types';
import { errorHandlerService } from '../services/error-handler.service';
import { useNotifications } from '../components/ui/NotificationSystem';

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
  progress?: number;
  message?: string;
}

export interface UseLoadingStateOptions {
  initialLoading?: boolean;
  showNotifications?: boolean;
  autoRetry?: boolean;
  retryAttempts?: number;
  retryDelay?: number;
}

export interface UseLoadingStateReturn {
  loadingState: LoadingState;
  setLoading: (loading: boolean, message?: string) => void;
  setError: (error: string | Error | ApiError | null) => void;
  setProgress: (progress: number, message?: string) => void;
  clearError: () => void;
  reset: () => void;
  executeWithLoading: <T>(
    operation: () => Promise<T>,
    loadingMessage?: string,
    successMessage?: string
  ) => Promise<T | null>;
  retry: () => Promise<void>;
  isRetrying: boolean;
}

export const useLoadingState = (options: UseLoadingStateOptions = {}): UseLoadingStateReturn => {
  const {
    initialLoading = false,
    showNotifications = true,
    autoRetry = false,
    retryAttempts = 3,
    retryDelay = 1000
  } = options;

  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: initialLoading,
    error: null,
    progress: undefined,
    message: undefined
  });

  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const lastOperation = useRef<(() => Promise<any>) | null>(null);
  const retryTimeoutRef = useRef<number | null>(null);

  const notifications = showNotifications ? useNotifications() : null;

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  const setLoading = useCallback((loading: boolean, message?: string) => {
    setLoadingState((prev: LoadingState) => ({
      ...prev,
      isLoading: loading,
      message: loading ? message : undefined,
      progress: loading ? prev.progress : undefined
    }));
  }, []);

  const setError = useCallback((error: string | Error | ApiError | null) => {
    let errorMessage: string | null = null;

    if (error) {
      if (typeof error === 'string') {
        errorMessage = error;
      } else if (error instanceof ApiError) {
        errorMessage = error.message;
        
        // Log the error
        errorHandlerService.logError(error, 'useLoadingState');
        
        // Show notification if enabled
        if (showNotifications && notifications) {
          const userFriendlyMessage = errorHandlerService.getUserFriendlyMessage(error);
          notifications.showError('Erro', userFriendlyMessage);
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
        
        // Convert to ApiError and log
        const apiError = errorHandlerService.handleDataProcessingError(error, 'useLoadingState');
        errorHandlerService.logError(apiError, 'useLoadingState');
        
        // Show notification if enabled
        if (showNotifications && notifications) {
          const userFriendlyMessage = errorHandlerService.getUserFriendlyMessage(apiError);
          notifications.showError('Erro', userFriendlyMessage);
        }
      }
    }

    setLoadingState((prev: LoadingState) => ({
      ...prev,
      isLoading: false,
      error: errorMessage,
      progress: undefined,
      message: undefined
    }));

    // Auto-retry logic
    if (error && autoRetry && retryCount < retryAttempts && lastOperation.current) {
      setIsRetrying(true);
      retryTimeoutRef.current = setTimeout(() => {
        retry();
      }, retryDelay * Math.pow(2, retryCount)); // Exponential backoff
    }
  }, [showNotifications, notifications, autoRetry, retryCount, retryAttempts, retryDelay]);

  const setProgress = useCallback((progress: number, message?: string) => {
    setLoadingState((prev: LoadingState) => ({
      ...prev,
      progress: Math.max(0, Math.min(100, progress)),
      message: message || prev.message
    }));
  }, []);

  const clearError = useCallback(() => {
    setLoadingState((prev: LoadingState) => ({
      ...prev,
      error: null
    }));
    setRetryCount(0);
    setIsRetrying(false);
  }, []);

  const reset = useCallback(() => {
    setLoadingState({
      isLoading: false,
      error: null,
      progress: undefined,
      message: undefined
    });
    setRetryCount(0);
    setIsRetrying(false);
    lastOperation.current = null;
    
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  const executeWithLoading = useCallback(async <T>(
    operation: () => Promise<T>,
    loadingMessage?: string,
    successMessage?: string
  ): Promise<T | null> => {
    try {
      // Store operation for potential retry
      lastOperation.current = operation;
      
      // Clear any previous errors
      clearError();
      
      // Set loading state
      setLoading(true, loadingMessage);
      
      // Execute operation
      const result = await operation();
      
      // Success
      setLoading(false);
      
      if (successMessage && showNotifications && notifications) {
        notifications.showSuccess('Sucesso', successMessage);
      }
      
      // Reset retry count on success
      setRetryCount(0);
      setIsRetrying(false);
      
      return result;
    } catch (error) {
      setError(error as Error);
      return null;
    }
  }, [setLoading, setError, clearError, showNotifications, notifications]);

  const retry = useCallback(async () => {
    if (!lastOperation.current) {
      return;
    }

    try {
      setIsRetrying(true);
      setRetryCount(prev => prev + 1);
      
      // Clear error and set loading
      setLoadingState((prev: LoadingState) => ({
        ...prev,
        error: null,
        isLoading: true,
        message: `Tentativa ${retryCount + 1} de ${retryAttempts}...`
      }));

      // Execute the last operation
      const result = await lastOperation.current();
      
      // Success
      setLoadingState((prev: LoadingState) => ({
        ...prev,
        isLoading: false,
        message: undefined
      }));
      
      setRetryCount(0);
      setIsRetrying(false);
      
      if (showNotifications && notifications) {
        notifications.showSuccess('Sucesso', 'Operação realizada com sucesso após nova tentativa');
      }
      
      return result;
    } catch (error) {
      setIsRetrying(false);
      
      if (retryCount + 1 >= retryAttempts) {
        // Max retries reached
        setError(error as Error);
        
        if (showNotifications && notifications) {
          notifications.showError(
            'Falha após múltiplas tentativas',
            'A operação falhou mesmo após várias tentativas. Verifique sua conexão e tente novamente.'
          );
        }
      } else {
        // Schedule next retry
        retryTimeoutRef.current = setTimeout(() => {
          retry();
        }, retryDelay * Math.pow(2, retryCount + 1));
      }
    }
  }, [retryCount, retryAttempts, retryDelay, showNotifications, notifications, setError]);

  return {
    loadingState,
    setLoading,
    setError,
    setProgress,
    clearError,
    reset,
    executeWithLoading,
    retry,
    isRetrying
  };
};

// Specialized hooks for common use cases

export const useHistoryLoading = () => {
  return useLoadingState({
    showNotifications: true,
    autoRetry: true,
    retryAttempts: 2,
    retryDelay: 2000
  });
};

export const useConfigurationLoading = () => {
  return useLoadingState({
    showNotifications: true,
    autoRetry: false // Don't auto-retry configuration saves
  });
};

export const useDashboardLoading = () => {
  return useLoadingState({
    showNotifications: false, // Dashboard loading is usually silent
    autoRetry: true,
    retryAttempts: 3,
    retryDelay: 1000
  });
};

// Hook for managing multiple loading states
export interface MultiLoadingState {
  [key: string]: LoadingState;
}

export const useMultiLoadingState = (keys: string[]) => {
  const [states, setStates] = useState<MultiLoadingState>(() => {
    const initialStates: MultiLoadingState = {};
    keys.forEach(key => {
      initialStates[key] = {
        isLoading: false,
        error: null
      };
    });
    return initialStates;
  });

  const setLoading = useCallback((key: string, loading: boolean, message?: string) => {
    setStates((prev: MultiLoadingState) => ({
      ...prev,
      [key]: {
        ...prev[key],
        isLoading: loading,
        message: loading ? message : undefined,
        progress: loading ? prev[key]?.progress : undefined
      }
    }));
  }, []);

  const setError = useCallback((key: string, error: string | null) => {
    setStates((prev: MultiLoadingState) => ({
      ...prev,
      [key]: {
        ...prev[key],
        isLoading: false,
        error,
        progress: undefined,
        message: undefined
      }
    }));
  }, []);

  const setProgress = useCallback((key: string, progress: number, message?: string) => {
    setStates((prev: MultiLoadingState) => ({
      ...prev,
      [key]: {
        ...prev[key],
        progress: Math.max(0, Math.min(100, progress)),
        message: message || prev[key]?.message
      }
    }));
  }, []);

  const clearError = useCallback((key: string) => {
    setStates((prev: MultiLoadingState) => ({
      ...prev,
      [key]: {
        ...prev[key],
        error: null
      }
    }));
  }, []);

  const reset = useCallback((key?: string) => {
    if (key) {
      setStates((prev: MultiLoadingState) => ({
        ...prev,
        [key]: {
          isLoading: false,
          error: null,
          progress: undefined,
          message: undefined
        }
      }));
    } else {
      // Reset all states
      setStates((prev: MultiLoadingState) => {
        const resetStates: MultiLoadingState = {};
        Object.keys(prev).forEach(k => {
          resetStates[k] = {
            isLoading: false,
            error: null,
            progress: undefined,
            message: undefined
          };
        });
        return resetStates;
      });
    }
  }, []);

  const isAnyLoading = Object.values(states).some((state: LoadingState) => state.isLoading);
  const hasAnyError = Object.values(states).some((state: LoadingState) => state.error);

  return {
    states,
    setLoading,
    setError,
    setProgress,
    clearError,
    reset,
    isAnyLoading,
    hasAnyError
  };
};