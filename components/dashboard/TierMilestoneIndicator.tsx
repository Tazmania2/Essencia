'use client';

import React from 'react';
import { CURRENCY_TIERS } from '../../types';

interface TierMilestoneIndicatorProps {
  percentage: number;
  className?: string;
}

/**
 * TierMilestoneIndicator - Shows tier unlock progress based on primary goal percentage
 * 
 * Tiers:
 * - 50%: Margaridas tier unlocked 🌼
 * - 75%: Orquídeas tier unlocked 🌸
 * - 100%: Lótus tier unlocked 🪷
 */
export const TierMilestoneIndicator: React.FC<TierMilestoneIndicatorProps> = ({
  percentage,
  className = ''
}) => {
  const tiers = [
    { ...CURRENCY_TIERS.MARGARIDAS, unlocked: percentage >= 50 },
    { ...CURRENCY_TIERS.ORQUIDEAS, unlocked: percentage >= 75 },
    { ...CURRENCY_TIERS.LOTUS, unlocked: percentage >= 100 },
  ];

  // Find the current tier (highest unlocked)
  const currentTierIndex = tiers.findIndex(t => !t.unlocked) - 1;
  const currentTier = currentTierIndex >= 0 ? tiers[currentTierIndex] : null;
  const nextTier = tiers.find(t => !t.unlocked);

  return (
    <div className={`bg-white rounded-xl p-4 shadow-md ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">🏆 Tier da Temporada</h3>
        {currentTier && (
          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
            {currentTier.emoji} {currentTier.name}
          </span>
        )}
      </div>

      {/* Tier Progress Bar */}
      <div className="relative">
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-500 transition-all duration-700"
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>

        {/* Milestone Markers */}
        <div className="absolute top-0 left-0 w-full h-3 flex items-center">
          {tiers.map((tier, index) => (
            <div
              key={tier.id}
              className="absolute transform -translate-x-1/2"
              style={{ left: `${tier.threshold}%` }}
            >
              <div 
                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center text-xs
                  ${tier.unlocked 
                    ? 'bg-white border-green-500 shadow-md' 
                    : 'bg-gray-100 border-gray-300'
                  }`}
                title={`${tier.name} - ${tier.threshold}%`}
              >
                {tier.unlocked ? '✓' : ''}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tier Labels */}
      <div className="flex justify-between mt-4 text-xs">
        {tiers.map((tier) => (
          <div 
            key={tier.id}
            className={`flex flex-col items-center transition-all duration-300 ${
              tier.unlocked ? 'opacity-100' : 'opacity-50'
            }`}
          >
            <span className={`text-lg ${tier.unlocked ? 'animate-bounce' : ''}`}>
              {tier.emoji}
            </span>
            <span className={`font-medium ${tier.unlocked ? 'text-gray-800' : 'text-gray-400'}`}>
              {tier.name}
            </span>
            <span className="text-gray-400">{tier.threshold}%</span>
            {tier.unlocked && (
              <span className="text-green-600 text-[10px] font-semibold">LIBERADO</span>
            )}
          </div>
        ))}
      </div>

      {/* Next Tier Info */}
      {nextTier && (
        <div className="mt-3 pt-3 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-500">
            Próximo tier: <span className="font-semibold">{nextTier.emoji} {nextTier.name}</span> em{' '}
            <span className="text-boticario-pink font-bold">{nextTier.threshold - Math.floor(percentage)}%</span>
          </p>
        </div>
      )}

      {percentage >= 100 && (
        <div className="mt-3 pt-3 border-t border-gray-100 text-center">
          <p className="text-xs text-green-600 font-semibold">
            🎉 Parabéns! Todos os tiers liberados!
          </p>
        </div>
      )}
    </div>
  );
};
