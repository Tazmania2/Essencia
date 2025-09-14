'use client';

import React from 'react';

interface RefreshButtonProps {
  onRefresh: () => Promise<void>;
  loading: boolean;
  lastUpdated: Date | null;
  className?: string;
}

export const RefreshButton: React.FC<RefreshButtonProps> = ({
  onRefresh,
  loading,
  lastUpdated,
  className = ''
}) => {
  const formatLastUpdated = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours > 0) {
      return `há ${diffHours}h${diffMinutes > 0 ? ` ${diffMinutes}m` : ''}`;
    } else if (diffMinutes > 0) {
      return `há ${diffMinutes}m`;
    } else {
      return 'agora mesmo';
    }
  };

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Status Indicator */}
      <div className="flex items-center space-x-2">
        <span className="text-lg">{loading ? '🔄' : '✅'}</span>
        <div className="text-sm">
          <div className={`font-medium ${loading ? 'text-blue-600' : 'text-green-600'}`}>
            {loading ? 'Atualizando...' : 'Dados atualizados'}
          </div>
          {lastUpdated && !loading && (
            <div className="text-gray-500 text-xs">
              Última atualização: {formatLastUpdated(lastUpdated)}
            </div>
          )}
        </div>
      </div>

      {/* Refresh Button */}
      <button
        onClick={onRefresh}
        disabled={loading}
        className={`
          inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium
          transition-all duration-200
          ${loading 
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
            : 'bg-white text-gray-700 hover:bg-gray-50'
          }
          focus:outline-none focus:ring-2 focus:ring-boticario-pink focus:border-transparent
        `}
        title={loading ? 'Atualizando dados...' : 'Atualizar dados do Funifier'}
      >
        <svg
          className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        {loading ? 'Atualizando...' : 'Atualizar'}
      </button>

      {/* Auto-refresh info */}
      {!loading && (
        <div className="text-xs text-gray-400 max-w-xs">
          <div>Atualização automática: diária</div>
        </div>
      )}
    </div>
  );
};