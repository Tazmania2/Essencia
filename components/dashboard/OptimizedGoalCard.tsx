'use client';

import React, { memo, useState } from 'react';
import { OptimizedProgressBar } from './OptimizedProgressBar';
import { useMemoizedCalculation, useStableCallback } from '../../hooks/usePerformance';

interface OptimizedGoalCardProps {
  name: string;
  percentage: number;
  description: string;
  emoji: string;
  hasBoost?: boolean;
  isBoostActive?: boolean;
  details?: {
    title: string;
    items: string[];
    bgColor: string;
    textColor: string;
  };
  className?: string;
}

export const OptimizedGoalCard = memo<OptimizedGoalCardProps>(({
  name,
  percentage,
  description,
  emoji,
  hasBoost = false,
  isBoostActive = false,
  details,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Memoize card styling calculations
  const cardStyles = useMemoizedCalculation(() => {
    const baseClasses = 'bg-white rounded-xl shadow-lg p-6 transition-all duration-300';
    const hoverClasses = 'hover:shadow-xl hover:scale-[1.02]';
    const boostClasses = isBoostActive ? 'ring-2 ring-yellow-400 shadow-yellow-200/50' : '';
    
    return `${baseClasses} ${hoverClasses} ${boostClasses} ${className}`;
  }, [isBoostActive, className]);

  // Memoize boost indicator styling
  const boostIndicatorStyles = useMemoizedCalculation(() => {
    if (!hasBoost) return null;
    
    return {
      baseClasses: 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ml-2',
      activeClasses: isBoostActive 
        ? 'bg-yellow-100 text-yellow-800 animate-pulse' 
        : 'bg-gray-100 text-gray-600',
      icon: isBoostActive ? '⚡' : '💤',
      text: isBoostActive ? 'Boost Ativo' : 'Boost Inativo',
    };
  }, [hasBoost, isBoostActive]);

  // Stable callback to prevent unnecessary re-renders
  const handleToggleExpanded = useStableCallback(() => {
    setIsExpanded(prev => !prev);
  });

  return (
    <div className={cardStyles}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <span className="text-2xl mr-3" role="img" aria-label={name}>
            {emoji}
          </span>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
            <p className="text-sm text-gray-600">{description}</p>
          </div>
        </div>
        
        {boostIndicatorStyles && (
          <div className={`${boostIndicatorStyles.baseClasses} ${boostIndicatorStyles.activeClasses}`}>
            <span className="mr-1">{boostIndicatorStyles.icon}</span>
            {boostIndicatorStyles.text}
          </div>
        )}
      </div>

      <OptimizedProgressBar
        percentage={percentage}
        className="mb-4"
        animated={true}
      />

      {details && (
        <div className="mt-4">
          <button
            onClick={handleToggleExpanded}
            className="flex items-center justify-between w-full text-left text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
          >
            <span>Ver detalhes</span>
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${
                isExpanded ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {isExpanded && (
            <div
              className={`mt-3 p-4 rounded-lg ${details.bgColor} transition-all duration-300 ease-in-out`}
            >
              <h4 className={`font-medium mb-2 ${details.textColor}`}>
                {details.title}
              </h4>
              <ul className={`space-y-1 ${details.textColor}`}>
                {details.items.map((item, index) => (
                  <li key={index} className="text-sm flex items-start">
                    <span className="mr-2">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

OptimizedGoalCard.displayName = 'OptimizedGoalCard';