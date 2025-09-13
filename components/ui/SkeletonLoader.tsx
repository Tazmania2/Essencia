'use client';

import React from 'react';

interface SkeletonLoaderProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: boolean;
  animate?: boolean;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  className = '',
  width = '100%',
  height = '1rem',
  rounded = false,
  animate = true,
}) => {
  const widthStyle = typeof width === 'number' ? `${width}px` : width;
  const heightStyle = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={`
        bg-gray-200 
        ${rounded ? 'rounded-full' : 'rounded'}
        ${animate ? 'animate-pulse' : ''}
        ${className}
      `}
      style={{
        width: widthStyle,
        height: heightStyle,
      }}
    />
  );
};

interface SkeletonCardProps {
  className?: string;
  showAvatar?: boolean;
  lines?: number;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  className = '',
  showAvatar = false,
  lines = 3,
}) => {
  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="animate-pulse">
        {showAvatar && (
          <div className="flex items-center mb-4">
            <SkeletonLoader width={40} height={40} rounded className="mr-3" />
            <div className="flex-1">
              <SkeletonLoader height="1rem" width="60%" className="mb-2" />
              <SkeletonLoader height="0.75rem" width="40%" />
            </div>
          </div>
        )}
        
        <div className="space-y-3">
          {Array.from({ length: lines }).map((_, index) => (
            <SkeletonLoader
              key={index}
              height="0.875rem"
              width={index === lines - 1 ? '75%' : '100%'}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

interface SkeletonDashboardProps {
  className?: string;
}

export const SkeletonDashboard: React.FC<SkeletonDashboardProps> = ({
  className = '',
}) => {
  return (
    <div className={`space-y-6 ${className}`} data-testid="skeleton-dashboard">
      {/* Header skeleton */}
      <div className="bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl p-6">
        <div className="animate-pulse">
          <SkeletonLoader height="2rem" width="50%" className="mb-2 bg-white/20" />
          <SkeletonLoader height="1rem" width="30%" className="bg-white/20" />
        </div>
      </div>

      {/* Points card skeleton */}
      <div className="bg-white rounded-lg shadow-lg p-6 text-center">
        <div className="animate-pulse">
          <SkeletonLoader height="3rem" width="60%" className="mx-auto mb-2" />
          <SkeletonLoader height="1rem" width="40%" className="mx-auto" />
        </div>
      </div>

      {/* Cycle info skeleton */}
      <div className="grid grid-cols-2 gap-4">
        <SkeletonCard lines={2} />
        <SkeletonCard lines={2} />
      </div>

      {/* Goals skeleton */}
      <div className="space-y-4">
        <SkeletonCard lines={3} />
        <SkeletonCard lines={3} />
        <SkeletonCard lines={3} />
      </div>
    </div>
  );
};