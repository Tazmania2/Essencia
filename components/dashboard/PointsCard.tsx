'use client';

import React from 'react';

interface PointsCardProps {
  points: number;
  isUnlocked: boolean;
  teamType?: string;
  hasSpecialProcessing?: boolean;
  specialProcessingNote?: string;
}

export const PointsCard: React.FC<PointsCardProps> = ({ 
  points, 
  isUnlocked, 
  teamType, 
  hasSpecialProcessing = false,
  specialProcessingNote = "Pontos calculados localmente"
}) => {
  // Dynamic styling based on unlock status as per requirements:
  // Blue background + green text for unlocked
  // White background + red text for locked
  const cardClasses = isUnlocked 
    ? 'bg-blue-50 rounded-2xl p-6 shadow-lg transition-all duration-300'
    : 'bg-white rounded-2xl p-6 shadow-lg transition-all duration-300';
    
  const pointsClasses = isUnlocked
    ? 'text-4xl font-bold text-green-600 mb-2 transition-colors duration-300'
    : 'text-4xl font-bold text-red-600 mb-2 transition-colors duration-300';
    
  const statusClasses = isUnlocked
    ? 'text-sm font-medium text-green-600'
    : 'text-sm font-medium text-red-600';
    
  const dotClasses = isUnlocked
    ? 'w-3 h-3 bg-green-500 rounded-full animate-pulse'
    : 'w-3 h-3 bg-red-500 rounded-full';

  // Add pulse animation for unlocked state
  const pulseClasses = isUnlocked ? 'animate-pulse' : '';

  return (
    <div className={`${cardClasses} ${pulseClasses}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Seus Pontos</h2>
        <div className="flex items-center space-x-2">
          <div className={dotClasses}></div>
          <span className={statusClasses}>
            {isUnlocked ? 'Desbloqueados' : 'Bloqueados'}
          </span>
        </div>
      </div>
      <div className="text-center">
        <div className={pointsClasses}>
          {points.toLocaleString('pt-BR')}
        </div>
        <p className="text-gray-600">
          {isUnlocked ? 'pontos disponíveis' : 'pontos bloqueados'}
        </p>
        {hasSpecialProcessing && (
          <p className="text-xs text-gray-500 mt-1">
            * {specialProcessingNote}
          </p>
        )}
      </div>
    </div>
  );
};