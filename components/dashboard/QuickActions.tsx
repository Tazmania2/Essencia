'use client';

import React, { useState, useEffect } from 'react';
import { historyService } from '../../services';

interface QuickAction {
  icon: string;
  label: string;
  onClick: () => void;
  gradient: string;
  disabled?: boolean;
  comingSoon?: boolean;
  loading?: boolean;
}

interface QuickActionsProps {
  playerId?: string;
  onHistoryClick?: () => void;
  actions?: QuickAction[];
}

export const QuickActions: React.FC<QuickActionsProps> = ({ 
  playerId,
  onHistoryClick,
  actions 
}) => {
  const [hasHistoricalData, setHasHistoricalData] = useState<boolean>(false);
  const [checkingHistory, setCheckingHistory] = useState<boolean>(false);

  useEffect(() => {
    if (playerId) {
      checkHistoricalData();
    }
  }, [playerId]);

  const checkHistoricalData = async () => {
    if (!playerId) return;
    
    try {
      setCheckingHistory(true);
      const hasData = await historyService.hasHistoricalData(playerId);
      setHasHistoricalData(hasData);
    } catch (error) {
      console.error('Failed to check historical data:', error);
      setHasHistoricalData(false);
    } finally {
      setCheckingHistory(false);
    }
  };

  const handleHistoryClick = () => {
    if (!playerId) {
      console.warn('No player ID provided for history navigation');
      return;
    }

    if (!hasHistoricalData) {
      // Show a brief message that no historical data is available
      alert('Nenhum histórico de ciclos disponível para este jogador.');
      return;
    }

    if (onHistoryClick) {
      onHistoryClick();
    }
  };

  const defaultActions: QuickAction[] = [
    {
      icon: '📈',
      label: 'Histórico',
      onClick: handleHistoryClick,
      gradient: 'bg-gradient-to-r from-green-400 to-green-500',
      disabled: checkingHistory || (!hasHistoricalData && !checkingHistory),
      loading: checkingHistory
    },
    {
      icon: '🏆',
      label: 'Ranking',
      onClick: () => {}, // No action for now
      gradient: 'bg-gradient-to-r from-purple-400 to-purple-500',
      disabled: true,
      comingSoon: true
    }
  ];

  const actionsToRender = actions || defaultActions;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">🚀 Ações Rápidas</h2>
      <div className="grid grid-cols-2 gap-4">
        {actionsToRender.map((action, index) => (
          <div key={index} className="relative group">
            <button
              onClick={action.disabled ? undefined : action.onClick}
              disabled={action.disabled}
              className={`
                p-4 ${action.gradient} text-white rounded-xl transition-all transform
                ${action.disabled 
                  ? 'opacity-60 cursor-not-allowed' 
                  : 'hover:shadow-lg hover:scale-105'
                }
                w-full relative
              `}
            >
              {action.loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                </div>
              ) : (
                <>
                  <div className="text-2xl mb-2">{action.icon}</div>
                  <div className="text-sm font-medium">{action.label}</div>
                </>
              )}
            </button>
            
            {/* Coming Soon Tooltip */}
            {action.comingSoon && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                Em Breve
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
              </div>
            )}
            
            {/* No History Data Tooltip */}
            {action.label === 'Histórico' && !hasHistoricalData && !checkingHistory && !action.loading && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                Nenhum histórico disponível
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
              </div>
            )}
            
            {/* History Available Tooltip */}
            {action.label === 'Histórico' && hasHistoricalData && !action.loading && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-green-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                Clique para ver o histórico
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-green-800"></div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};