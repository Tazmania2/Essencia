import { useCallback } from 'react';

export const useNotificationHelpers = () => {
  const notifyConfigurationSaved = useCallback(() => {
    console.log('✅ Configuration saved successfully');
    // In a real implementation, this would show a toast notification
  }, []);

  const notifyConfigurationError = useCallback((error: string) => {
    console.error('❌ Configuration error:', error);
    // In a real implementation, this would show an error notification
  }, []);

  const notifyWarning = useCallback((warning: string) => {
    console.warn('⚠️ Configuration warning:', warning);
    // In a real implementation, this would show a warning notification
  }, []);

  const notifyHistoryLoaded = useCallback((cycleCount: number) => {
    console.log(`✅ History loaded successfully: ${cycleCount} cycles found`);
    // In a real implementation, this would show a success notification
  }, []);

  const notifyNoHistoryData = useCallback(() => {
    console.log('ℹ️ No historical data found for this player');
    // In a real implementation, this would show an info notification
  }, []);

  return {
    notifyConfigurationSaved,
    notifyConfigurationError,
    notifyWarning,
    notifyHistoryLoaded,
    notifyNoHistoryData
  };
};