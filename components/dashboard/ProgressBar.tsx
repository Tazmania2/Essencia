'use client';

import React from 'react';

interface ProgressBarProps {
  percentage: number;
  className?: string;
  height?: 'sm' | 'md' | 'lg';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ 
  percentage, 
  className = '',
  height = 'md'
}) => {
  // Special progress bar logic from design:
  // 0-50%: red color, fills 0-33.33% of visual bar
  // 50-100%: yellow color, fills 33.33-66.66% of visual bar  
  // 100-150%: green color, fills 66.66-100% of visual bar
  
  let color: string;
  let visualFill: number;
  
  if (percentage <= 50) {
    color = 'bg-red-500';
    visualFill = (percentage / 50) * 33.33;
  } else if (percentage < 100) {
    color = 'bg-yellow-500';
    visualFill = 33.33 + ((percentage - 50) / 50) * 33.33;
  } else {
    color = 'bg-green-500';
    visualFill = 66.66 + ((Math.min(percentage, 150) - 100) / 50) * 33.34;
  }
  
  const heightClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  };

  return (
    <div className={`bg-gray-200 rounded-full ${heightClasses[height]} ${className}`}>
      <div 
        className={`${color} ${heightClasses[height]} rounded-full transition-all duration-700 ease-in-out`}
        style={{ width: `${Math.min(visualFill, 100)}%` }}
      ></div>
    </div>
  );
};