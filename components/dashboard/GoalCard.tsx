'use client';

import React from 'react';
import { ProgressBar } from './ProgressBar';
import { BoostIndicator } from './BoostIndicator';

interface GoalCardProps {
  title: string;
  percentage: number;
  description: string;
  emoji: string;
  isPrimary?: boolean;
  hasBoost?: boolean;
  isBoostActive?: boolean;
  // Enhanced fields for detailed information
  target?: number;
  current?: number;
  unit?: string;
  daysRemaining?: number;
}

export const GoalCard: React.FC<GoalCardProps> = ({
  title,
  percentage,
  description,
  emoji,
  isPrimary = false,
  hasBoost = false,
  isBoostActive = false,
  target,
  current,
  unit,
  daysRemaining
}) => {
  const cardClasses = isPrimary 
    ? 'bg-white rounded-2xl p-6 shadow-lg'
    : 'bg-white rounded-2xl p-6 shadow-lg';

  const titleClasses = isPrimary
    ? 'text-xl font-semibold text-gray-800'
    : 'text-lg font-semibold text-gray-800';

  const percentageClasses = isPrimary
    ? 'text-2xl font-bold text-boticario-pink'
    : 'font-bold text-boticario-purple';

  const progressHeight = isPrimary ? 'lg' : 'md';

  // Helper function to format values
  const formatValue = (value: number): string => {
    if (unit === 'R$') {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value);
    }
    
    if (unit === 'marcas') {
      return value.toFixed(1);
    }
    
    return Math.round(value).toString();
  };

  const hasDetailedData = target !== undefined && current !== undefined;

  return (
    <div className={cardClasses}>
      <div className="flex items-center justify-between mb-4">
        <h2 className={titleClasses}>
          {emoji} {title}
        </h2>
        <div className="flex items-center space-x-2">
          {hasBoost && (
            <BoostIndicator 
              isActive={isBoostActive}
            />
          )}
          <span className={percentageClasses}>{percentage.toFixed(0)}%</span>
        </div>
      </div>
      <ProgressBar 
        percentage={percentage} 
        height={progressHeight}
        className="mb-2"
      />
      
      {/* Enhanced detailed information */}
      {hasDetailedData && (
        <div className="mb-3 p-3 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-500">Meta:</span>
              <span className="ml-1 font-semibold text-gray-800">
                {formatValue(target!)} {unit && !unit.startsWith('R$') && unit}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Atual:</span>
              <span className="ml-1 font-semibold text-gray-800">
                {formatValue(current!)} {unit && !unit.startsWith('R$') && unit}
              </span>
            </div>
          </div>
          {daysRemaining !== undefined && (
            <div className="mt-2 text-xs text-gray-600">
              <span className="font-medium">Prazo:</span> {daysRemaining} dias restantes
            </div>
          )}
        </div>
      )}
      
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  );
};