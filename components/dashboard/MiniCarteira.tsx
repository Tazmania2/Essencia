'use client';

import React, { useState, useEffect } from 'react';
import { pointsService } from '../../services/points.service';
import { storeService } from '../../services/store.service';
import { CURRENCY_TIERS, StoreConfiguration } from '../../types';

interface MiniCarteiraProps {
  playerId: string;
  className?: string;
}

/**
 * MiniCarteira - Compact wallet display for the main dashboard
 * Shows player's currency balances in a discrete, smaller format
 */
export const MiniCarteira: React.FC<MiniCarteiraProps> = ({
  playerId,
  className = ''
}) => {
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [storeConfig, setStoreConfig] = useState<StoreConfiguration | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBalances = async () => {
      if (!playerId) return;

      try {
        setLoading(true);
        
        // Fetch store configuration
        const config = await storeService.getStoreConfiguration();
        setStoreConfig(config);

        // Fetch balances for all visible currencies
        const newBalances: Record<string, number> = {};
        const visibleLevels = config.levels.filter(level => level.visible);

        for (const level of visibleLevels) {
          try {
            const balance = await pointsService.getPlayerBalance(playerId, level.currencyId);
            newBalances[level.currencyId] = balance;
          } catch (error) {
            console.warn(`Failed to fetch balance for ${level.currencyId}:`, error);
            newBalances[level.currencyId] = 0;
          }
        }

        setBalances(newBalances);
      } catch (error) {
        console.error('Error fetching wallet data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBalances();
  }, [playerId]);

  // Get emoji for currency based on level number
  const getCurrencyEmoji = (levelNumber: number): string => {
    switch (levelNumber) {
      case 1: return CURRENCY_TIERS.MARGARIDAS.emoji;
      case 2: return CURRENCY_TIERS.ORQUIDEAS.emoji;
      case 3: return CURRENCY_TIERS.LOTUS.emoji;
      default: return '💰';
    }
  };

  if (loading) {
    return (
      <div className={`bg-white/80 backdrop-blur-sm rounded-lg p-2 shadow-sm ${className}`}>
        <div className="flex items-center space-x-2">
          <div className="animate-pulse flex space-x-2">
            <div className="h-6 w-16 bg-gray-200 rounded"></div>
            <div className="h-6 w-16 bg-gray-200 rounded"></div>
            <div className="h-6 w-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!storeConfig) return null;

  const visibleLevels = storeConfig.levels
    .filter(level => level.visible)
    .sort((a, b) => a.levelNumber - b.levelNumber);

  return (
    <div className={`bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-sm border border-gray-100 ${className}`}>
      <div className="flex items-center space-x-3">
        <span className="text-xs text-gray-500 font-medium hidden sm:inline">Carteira:</span>
        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
          {visibleLevels.map((level) => {
            const balance = balances[level.currencyId] || 0;
            const emoji = getCurrencyEmoji(level.levelNumber);
            
            return (
              <div
                key={level.currencyId}
                className="flex items-center space-x-1 bg-gradient-to-r from-gray-50 to-gray-100 px-2 py-1 rounded-full text-xs"
                title={`${level.currencyName}: ${balance.toLocaleString('pt-BR')}`}
              >
                <span>{emoji}</span>
                <span className="font-semibold text-gray-700">
                  {balance.toLocaleString('pt-BR')}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
