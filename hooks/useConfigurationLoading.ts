import { useState } from 'react';

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
  progress?: number;
  message?: string;
}

export const useConfigurationLoading = () => {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    error: null
  });

  const setProgress = (progress: number, message?: string) => {
    setLoadingState(prev => ({
      ...prev,
      progress,
      message
    }));
  };

  const executeWithLoading = async <T>(
    operation: () => Promise<T>,
    loadingMessage?: string
  ): Promise<T | null> => {
    try {
      setLoadingState({
        isLoading: true,
        error: null,
        message: loadingMessage
      });

      const result = await operation();

      setLoadingState({
        isLoading: false,
        error: null
      });

      return result;
    } catch (error) {
      setLoadingState({
        isLoading: false,
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  };

  return {
    loadingState,
    setProgress,
    executeWithLoading
  };
};