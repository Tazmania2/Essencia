'use client';

import React from 'react';

interface QuickAction {
  icon: string;
  label: string;
  onClick: () => void;
  gradient: string;
}

interface QuickActionsProps {
  actions?: QuickAction[];
}

const defaultActions: QuickAction[] = [
  {
    icon: '📈',
    label: 'Histórico',
    onClick: () => console.log('Histórico clicked'),
    gradient: 'bg-gradient-to-r from-green-400 to-green-500'
  },
  {
    icon: '🏆',
    label: 'Ranking',
    onClick: () => console.log('Ranking clicked'),
    gradient: 'bg-gradient-to-r from-purple-400 to-purple-500'
  }
];

export const QuickActions: React.FC<QuickActionsProps> = ({ actions = defaultActions }) => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">🚀 Ações Rápidas</h2>
      <div className="grid grid-cols-2 gap-4">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={action.onClick}
            className={`p-4 ${action.gradient} text-white rounded-xl hover:shadow-lg transition-all transform hover:scale-105`}
          >
            <div className="text-2xl mb-2">{action.icon}</div>
            <div className="text-sm font-medium">{action.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
};