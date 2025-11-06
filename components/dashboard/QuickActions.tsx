'use client';

import React, { useState } from 'react';
import { historyService } from '../../services/history.service';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { useNotificationHelpers } from '../ui/NotificationSystem';

interface QuickAction {
  icon: string;
  label: string;
  onClick: () => void | Promise<void>;
  gradient: string;
  disabled?: boolean;
  comingSoon?: boolean;
  loading?: boolean;
}

interface QuickActionsProps {
  playerId?: string;
  playerName?: string;
  actions?: QuickAction[];
  onHistoryClick?: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ 
  playerId, 
  playerName, 
  actions, 
  onHistoryClick 
}) => {
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const { notifyNoHistoryData, notifyError } = useNotificationHelpers();

  const handleHistoryClick = async () => {
    if (!playerId) {
      notifyError('ID do jogador não encontrado');
      return;
    }

    try {
      setIsHistoryLoading(true);
      
      // Check if player has historical data before navigating
      const hasHistory = await historyService.hasHistoricalData(playerId);
      
      if (!hasHistory) {
        notifyNoHistoryData();
        return;
      }
      
      // Call the provided callback or navigate to history page
      if (onHistoryClick) {
        onHistoryClick();
      } else if (typeof window !== 'undefined') {
        window.location.href = `/history?playerId=${playerId}&playerName=${encodeURIComponent(playerName || '')}`;
      }
    } catch (error) {
      console.error('Error checking historical data:', error);
      notifyError('Erro ao verificar dados históricos. Tente novamente.');
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const handleShopClick = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/store';
    }
  };

  const defaultActions: QuickAction[] = [
    {
      icon: '📈',
      label: 'Histórico',
      onClick: handleHistoryClick,
      gradient: 'bg-gradient-to-r from-green-400 to-green-500',
      disabled: !playerId,
      loading: isHistoryLoading
    },
    {
      icon: '🛒',
      label: 'Loja',
      onClick: handleShopClick,
      gradient: 'bg-gradient-to-r from-purple-400 to-purple-500',
      disabled: false
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
              onClick={action.disabled || action.loading ? undefined : action.onClick}
              disabled={action.disabled || action.loading}
              className={`
                p-4 ${action.gradient} text-white rounded-xl transition-all transform
                ${action.disabled || action.loading
                  ? 'opacity-60 cursor-not-allowed' 
                  : 'hover:shadow-lg hover:scale-105'
                }
                w-full relative
              `}
            >
              {action.loading ? (
                <div className="flex flex-col items-center">
                  <LoadingSpinner size="sm" color="white" className="mb-2" />
                  <div className="text-sm font-medium">Carregando...</div>
                </div>
              ) : (
                <>
                  <div className="text-2xl mb-2">{action.icon}</div>
                  <div className="text-sm font-medium">{action.label}</div>
                </>
              )}
            </button>
            
            {/* Coming Soon Tooltip */}
            {action.comingSoon && !action.loading && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                Em Breve
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
              </div>
            )}

            {/* Disabled Tooltip */}
            {action.disabled && !action.loading && !action.comingSoon && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                Dados do jogador necessários
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};