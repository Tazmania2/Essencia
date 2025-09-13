'use client';

import React, { memo } from 'react';
import { useMemoizedCalculation } from '../../hooks/usePerformance';

interface OptimizedProgressBarProps {
  percentage: number;
  className?: string;
  showPercentage?: boolean;
  animated?: boolean;
}

export const OptimizedProgressBar = memo<OptimizedProgressBarProps>(({
  percentage,
  className = '',
  showPercentage = true,
  animated = true,
}) => {
  // Memoize expensive calculations
  const progressConfig = useMemoizedCalculation(() => {
    // Special progress bar logic from design:
    // 0-50%: red, fills 0-33.33% of visual bar
    // 50-100%: yellow, fills 33.33-66.66% of visual bar  
    // 100-150%: green, fills 66.66-100% of visual bar
    
    let color: string;
    let fillPercentage: number;
    let gradient: string;

    if (percentage <= 50) {
      color = 'red';
      fillPercentage = (percentage / 50) * 33.33;
      gradient = 'from-red-500 to-red-600';
    } else if (percentage <= 100) {
      color = 'yellow';
      fillPercentage = 33.33 + ((percentage - 50) / 50) * 33.33;
      gradient = 'from-yellow-400 to-yellow-500';
    } else {
      color = 'green';
      fillPercentage = 66.66 + ((Math.min(percentage, 150) - 100) / 50) * 33.34;
      gradient = 'from-green-500 to-green-600';
    }

    return {
      color,
      fillPercentage: Math.min(fillPercentage, 100),
      gradient,
      displayPercentage: Math.round(percentage),
    };
  }, [percentage]);

  return (
    <div className={`w-full ${className}`}>
      <div className="flex justify-between items-center mb-2">
        {showPercentage && (
          <span className="text-sm font-medium text-gray-700">
            {progressConfig.displayPercentage}%
          </span>
        )}
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className={`
            h-full bg-gradient-to-r ${progressConfig.gradient} rounded-full
            ${animated ? 'transition-all duration-500 ease-out' : ''}
          `}
          style={{
            width: `${progressConfig.fillPercentage}%`,
          }}
        />
      </div>
      
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-gray-500 mt-1">
          Color: {progressConfig.color}, Fill: {progressConfig.fillPercentage.toFixed(1)}%
        </div>
      )}
    </div>
  );
});

OptimizedProgressBar.displayName = 'OptimizedProgressBar';