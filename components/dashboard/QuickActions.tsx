'use client';

import React from 'react';

interface QuickAction {
  icon: string;
  label: string;
  onClick: () => void;
  gradient: string;
  disabled?: boolean;
  comingSoon?: boolean;
}

interface QuickActionsProps {
  actions?: QuickAction[];
}

const defaultActions: QuickAction[] = [
  {
    icon: '📈',
    label: 'Histórico',
    onClick: () => {}, // No action for now
    gradient: 'bg-gradient-to-r from-green-400 to-green-500',
    disabled: true,
    comingSoon: true
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

export const QuickActions: React.FC<QuickActionsProps> = ({ actions = defaultActions }) => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">🚀 Ações Rápidas</h2>
      <div className="grid grid-cols-2 gap-4">
        {actions.map((action, index) => (
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
                w-full
              `}
            >
              <div className="text-2xl mb-2">{action.icon}</div>
              <div className="text-sm font-medium">{action.label}</div>
            </button>
            
            {/* Coming Soon Tooltip */}
            {action.comingSoon && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                Em Breve
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};