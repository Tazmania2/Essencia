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
  onBoostToggle?: () => void;
}

export const GoalCard: React.FC<GoalCardProps> = ({
  title,
  percentage,
  description,
  emoji,
  isPrimary = false,
  hasBoost = false,
  isBoostActive = false,
  onBoostToggle
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
              onClick={onBoostToggle}
            />
          )}
          <span className={percentageClasses}>{percentage}%</span>
        </div>
      </div>
      <ProgressBar 
        percentage={percentage} 
        height={progressHeight}
        className="mb-2"
      />
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  );
};