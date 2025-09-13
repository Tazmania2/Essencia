'use client';

import React, { memo } from 'react';
import { useMemoizedCalculation, useReducedMotion } from '../../hooks/usePerformance';
import { ScreenReaderOnly } from '../accessibility/ScreenReaderOnly';

interface AccessibleProgressBarProps {
  percentage: number;
  label: string;
  className?: string;
  showPercentage?: boolean;
  animated?: boolean;
  id?: string;
}

export const AccessibleProgressBar = memo<AccessibleProgressBarProps>(({
  percentage,
  label,
  className = '',
  showPercentage = true,
  animated = true,
  id,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const shouldAnimate = animated && !prefersReducedMotion;

  // Memoize expensive calculations
  const progressConfig = useMemoizedCalculation(() => {
    // Special progress bar logic from design:
    // 0-50%: red, fills 0-33.33% of visual bar
    // 50-100%: yellow, fills 33.33-66.66% of visual bar  
    // 100-150%: green, fills 66.66-100% of visual bar
    
    let color: string;
    let fillPercentage: number;
    let gradient: string;
    let status: string;

    if (percentage <= 50) {
      color = 'red';
      fillPercentage = (percentage / 50) * 33.33;
      gradient = 'from-red-500 to-red-600';
      status = 'Baixo desempenho';
    } else if (percentage <= 100) {
      color = 'yellow';
      fillPercentage = 33.33 + ((percentage - 50) / 50) * 33.33;
      gradient = 'from-yellow-400 to-yellow-500';
      status = 'Desempenho moderado';
    } else {
      color = 'green';
      fillPercentage = 66.66 + ((Math.min(percentage, 150) - 100) / 50) * 33.34;
      gradient = 'from-green-500 to-green-600';
      status = 'Alto desempenho';
    }

    return {
      color,
      fillPercentage: Math.min(fillPercentage, 100),
      gradient,
      displayPercentage: Math.round(percentage),
      status,
    };
  }, [percentage]);

  const progressId = id || `progress-${label.toLowerCase().replace(/\s+/g, '-')}`;
  const labelId = `${progressId}-label`;
  const statusId = `${progressId}-status`;

  return (
    <div className={`w-full ${className}`} role="group" aria-labelledby={labelId}>
      <div className="flex justify-between items-center mb-2">
        <label id={labelId} className="text-sm font-medium text-gray-700">
          {label}
        </label>
        {showPercentage && (
          <span 
            className="text-sm font-medium text-gray-700"
            aria-label={`${progressConfig.displayPercentage} por cento`}
          >
            {progressConfig.displayPercentage}%
          </span>
        )}
      </div>
      
      <div className="relative">
        <div 
          className="w-full bg-gray-200 rounded-full h-3 overflow-hidden"
          role="progressbar"
          aria-valuenow={progressConfig.displayPercentage}
          aria-valuemin={0}
          aria-valuemax={150}
          aria-labelledby={labelId}
          aria-describedby={statusId}
          id={progressId}
        >
          <div
            className={`
              h-full bg-gradient-to-r ${progressConfig.gradient} rounded-full
              ${shouldAnimate ? 'transition-all duration-500 ease-out' : ''}
            `}
            style={{
              width: `${progressConfig.fillPercentage}%`,
            }}
            aria-hidden="true"
          />
        </div>

        {/* Screen reader only status */}
        <ScreenReaderOnly id={statusId}>
          {progressConfig.status}. {label} está em {progressConfig.displayPercentage}% da meta.
        </ScreenReaderOnly>
      </div>

      {/* Additional context for screen readers */}
      <ScreenReaderOnly>
        Barra de progresso para {label}. 
        Valor atual: {progressConfig.displayPercentage}%. 
        Status: {progressConfig.status}.
        {percentage <= 50 && 'Abaixo de 50% é considerado baixo desempenho.'}
        {percentage > 50 && percentage <= 100 && 'Entre 50% e 100% é considerado desempenho moderado.'}
        {percentage > 100 && 'Acima de 100% é considerado alto desempenho.'}
      </ScreenReaderOnly>
      
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-gray-500 mt-1" aria-hidden="true">
          Debug: Color: {progressConfig.color}, Fill: {progressConfig.fillPercentage.toFixed(1)}%
        </div>
      )}
    </div>
  );
});

AccessibleProgressBar.displayName = 'AccessibleProgressBar';