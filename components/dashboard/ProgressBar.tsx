'use client';

import React from 'react';

interface TierMarker {
  threshold: number;
  emoji: string;
  name: string;
}

interface ProgressBarProps {
  percentage: number;
  className?: string;
  height?: 'sm' | 'md' | 'lg';
  showMilestoneMarker?: boolean;
  showTierMarkers?: boolean;
  isPrimary?: boolean;
}

// Tier thresholds for the primary goal
const TIER_MARKERS: TierMarker[] = [
  { threshold: 50, emoji: '🌼', name: 'Margaridas' },
  { threshold: 75, emoji: '🌸', name: 'Orquídeas' },
  { threshold: 100, emoji: '🪷', name: 'Lótus' },
];

export const ProgressBar: React.FC<ProgressBarProps> = ({
  percentage,
  className = '',
  height = 'md',
  showMilestoneMarker = true,
  showTierMarkers = false,
  isPrimary = false,
}) => {
  // Updated progress bar logic:
  // 0-50%: red color, fills 0-37.5% of visual bar (half of 75%)
  // 50-100%: yellow color, fills 37.5-75% of visual bar
  // 100-133%: green color, fills 75-100% of visual bar
  // This makes 100% appear at 3/4 (75%) of the bar

  let color: string;
  let visualFill: number;

  if (percentage <= 50) {
    color = 'bg-red-500';
    visualFill = (percentage / 50) * 37.5;
  } else if (percentage < 100) {
    color = 'bg-yellow-500';
    visualFill = 37.5 + ((percentage - 50) / 50) * 37.5;
  } else {
    color = 'bg-green-500';
    // From 100% to ~133% fills the remaining 25% of the bar
    visualFill = 75 + ((Math.min(percentage, 133) - 100) / 33) * 25;
  }

  // Calculate visual position for a given percentage threshold
  const getVisualPosition = (threshold: number): number => {
    return (threshold / 100) * 75;
  };

  const heightClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  };

  const markerHeightClasses = {
    sm: 'h-4',
    md: 'h-5',
    lg: 'h-6',
  };

  // Use larger height for primary goal with tier markers
  const effectiveHeight = isPrimary && showTierMarkers ? 'lg' : height;

  return (
    <div className={`relative ${className}`}>
      {/* Progress bar container */}
      <div
        className={`bg-gray-200 rounded-full ${heightClasses[effectiveHeight]} relative overflow-visible`}
      >
        {/* Progress fill */}
        <div
          className={`${color} ${heightClasses[effectiveHeight]} rounded-full transition-all duration-700 ease-in-out`}
          style={{ width: `${Math.min(visualFill, 100)}%` }}
        ></div>

        {/* Tier Markers for primary goal */}
        {showTierMarkers &&
          TIER_MARKERS.map((tier) => {
            const isUnlocked = percentage >= tier.threshold;
            const visualPos = getVisualPosition(tier.threshold);

            return (
              <div
                key={tier.threshold}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10"
                style={{ left: `${visualPos}%` }}
                title={`${tier.name} - ${tier.threshold}%`}
              >
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs shadow-sm transition-all duration-300
                    ${
                      isUnlocked
                        ? 'bg-white border-green-500 scale-110'
                        : 'bg-gray-100 border-gray-300 opacity-70'
                    }`}
                >
                  {tier.emoji}
                </div>
              </div>
            );
          })}

        {/* 100% Milestone Marker (for non-tier bars) */}
        {showMilestoneMarker && !showTierMarkers && (
          <div
            className="absolute top-1/2 -translate-y-1/2"
            style={{ left: '75%' }}
            title="Meta 100%"
          >
            <div
              className={`w-1 ${markerHeightClasses[effectiveHeight]} bg-gray-600 rounded-full shadow-sm`}
            ></div>
          </div>
        )}
      </div>

      {/* Tier Labels below markers */}
      {showTierMarkers && (
        <div className="flex justify-between mt-3 text-[10px] px-1">
          {TIER_MARKERS.map((tier) => {
            const isUnlocked = percentage >= tier.threshold;
            const visualPos = getVisualPosition(tier.threshold);

            return (
              <div
                key={tier.threshold}
                className="flex flex-col items-center"
                style={{
                  position: 'absolute',
                  left: `${visualPos}%`,
                  transform: 'translateX(-50%)',
                }}
              >
                <span
                  className={`font-medium ${isUnlocked ? 'text-green-600' : 'text-gray-400'}`}
                >
                  {tier.name}
                </span>
                {isUnlocked && (
                  <span className="text-green-500 text-[8px] font-bold">✓</span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 100% Label below the marker (for non-tier bars) */}
      {showMilestoneMarker && !showTierMarkers && (
        <div
          className="absolute text-[10px] text-gray-500 font-medium -translate-x-1/2"
          style={{ left: '75%', top: '100%', marginTop: '2px' }}
        >
          100%
        </div>
      )}
    </div>
  );
};