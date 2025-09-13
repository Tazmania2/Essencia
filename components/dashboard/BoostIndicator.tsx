'use client';

import React from 'react';

interface BoostIndicatorProps {
  isActive: boolean;
  onClick?: () => void;
  className?: string;
}

export const BoostIndicator: React.FC<BoostIndicatorProps> = ({ 
  isActive, 
  onClick,
  className = ''
}) => {
  const baseClasses = 'w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all';
  const activeClasses = isActive 
    ? 'bg-boticario-gold animate-pulse shadow-lg shadow-boticario-gold/50'
    : 'bg-gray-300';
    
  const iconClasses = isActive
    ? 'text-white font-bold text-sm'
    : 'text-gray-500 font-bold text-sm';

  return (
    <div 
      className={`${baseClasses} ${activeClasses} ${className}`}
      onClick={onClick}
      style={isActive ? {
        animation: 'glow 1.5s ease-in-out infinite alternate',
        boxShadow: isActive ? '0 0 10px #FFD700, 0 0 20px #FFD700' : undefined
      } : undefined}
    >
      <span className={iconClasses}>⚡</span>
    </div>
  );
};