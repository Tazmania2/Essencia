'use client';

import React from 'react';
import { VirtualGoodItem, LevelConfiguration } from '../../types';
import { ItemCard } from './ItemCard';

interface ItemGridProps {
  itemsByLevel: Map<string, VirtualGoodItem[]>;
  levelConfig: LevelConfiguration[];
  onItemClick: (item: VirtualGoodItem) => void;
  grayOutLocked: boolean;
  playerCatalogItems: Record<string, number>;
}

export const ItemGrid: React.FC<ItemGridProps> = ({
  itemsByLevel,
  levelConfig,
  onItemClick,
  grayOutLocked,
  playerCatalogItems,
}) => {
  
  // Helper function to check if player has access to a level
  const hasLevelAccess = (level: LevelConfiguration): boolean => {
    // If no unlock item is configured, level is always accessible
    if (!level.unlockItemId) {
      return true;
    }
    // Check if player owns the unlock item
    return (playerCatalogItems[level.unlockItemId] || 0) > 0;
  };
  // Sort level configurations by levelNumber
  const sortedLevels = [...levelConfig]
    .filter(level => level.visible)
    .sort((a, b) => a.levelNumber - b.levelNumber);

  // If no items to display
  if (sortedLevels.length === 0 || itemsByLevel.size === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🏪</div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          Nenhum item disponível
        </h3>
        <p className="text-gray-500">
          Não há itens para exibir no momento.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {sortedLevels.map((level) => {
        const items = itemsByLevel.get(level.catalogId) || [];
        
        // Skip levels with no items
        if (items.length === 0) {
          return null;
        }

        const isLevelLocked = !hasLevelAccess(level);
        const shouldGrayOut = grayOutLocked && isLevelLocked;

        return (
          <div key={level.catalogId} className="space-y-4">
            {/* Level Header */}
            <div className="flex items-center space-x-3">
              <div className={`flex-shrink-0 w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg md:text-xl shadow-lg ${shouldGrayOut ? 'opacity-50' : ''}`}>
                {level.levelNumber}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className={`text-xl md:text-2xl font-bold text-gray-800 truncate ${shouldGrayOut ? 'opacity-50' : ''}`}>
                  {level.levelName}
                  {isLevelLocked && ' 🔒'}
                </h2>
                <p className={`text-sm text-gray-500 ${shouldGrayOut ? 'opacity-50' : ''}`}>
                  {items.length} {items.length === 1 ? 'item' : 'itens'}
                </p>
              </div>
            </div>

            {/* Items Grid - Responsive */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {items.map((item) => (
                <ItemCard
                  key={item._id}
                  item={item}
                  levelName={level.levelName}
                  currencyName={level.currencyName}
                  grayedOut={shouldGrayOut}
                  onClick={() => onItemClick(item)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
