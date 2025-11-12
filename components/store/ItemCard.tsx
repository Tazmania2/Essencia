'use client';

import React from 'react';
import { VirtualGoodItem } from '../../types';

interface ItemCardProps {
  item: VirtualGoodItem;
  levelName: string;
  currencyName: string;
  isLocked?: boolean;
  grayedOut?: boolean;
  onClick: () => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({
  item,
  levelName,
  currencyName,
  isLocked = false,
  grayedOut = false,
  onClick,
}) => {
  // Extract price from requires array (type 0 is currency requirement)
  const getPrice = (): number => {
    const currencyRequirement = item.requires.find(req => req.type === 0);
    return currencyRequirement?.total || 0;
  };

  // Get the best available image (prefer small for cards, fallback to medium, then original)
  const getImageUrl = () => {
    if (item.image?.small?.url) return item.image.small.url;
    if (item.image?.medium?.url) return item.image.medium.url;
    if (item.image?.original?.url) return item.image.original.url;
    return null;
  };

  const price = getPrice();
  const imageUrl = getImageUrl();

  return (
    <div
      onClick={onClick}
      className={`
        bg-white rounded-xl shadow-md hover:shadow-xl 
        transition-all duration-300 cursor-pointer
        border-2 border-transparent hover:border-boticario-pink
        overflow-hidden group
        ${grayedOut ? 'opacity-60 grayscale' : ''}
      `}
      role="button"
      tabIndex={0}
      aria-label={`${item.name} - ${price} ${currencyName}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {/* Image Container */}
      <div className="relative w-full aspect-square bg-gradient-to-br from-purple-50 to-pink-50 overflow-hidden flex items-center justify-center p-2">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={item.name}
            className={`
              max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-300
              ${grayedOut ? 'grayscale' : ''}
            `}
          />
        ) : (
          <div className="text-4xl md:text-5xl">🎁</div>
        )}
        
        {/* Locked Badge */}
        {grayedOut && (
          <div className="absolute top-2 right-2 bg-gray-800 bg-opacity-75 text-white text-xs px-2 py-1 rounded-full flex items-center space-x-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            <span>Bloqueado</span>
          </div>
        )}
      </div>

      {/* Content Container */}
      <div className="p-3 md:p-4">
        {/* Item Name */}
        <h3 className={`
          font-semibold text-sm md:text-base text-gray-800 
          line-clamp-2 min-h-[2.5rem] md:min-h-[3rem]
          group-hover:text-boticario-purple transition-colors
          ${grayedOut ? 'text-gray-500' : ''}
        `}>
          {item.name}
        </h3>

        {/* Level Name */}
        <p className="text-xs text-gray-500 mt-1 mb-2">
          {levelName}
        </p>

        {/* Price */}
        <div className={`
          flex items-center justify-between 
          pt-2 border-t border-gray-100
        `}>
          <div className="flex items-center space-x-1">
            <span className="text-xl md:text-2xl">💰</span>
            <div>
              <div className={`
                font-bold text-base md:text-lg
                ${grayedOut ? 'text-gray-500' : 'text-boticario-purple'}
              `}>
                {price.toLocaleString('pt-BR')}
              </div>
              <div className="text-xs text-gray-500">
                {currencyName}
              </div>
            </div>
          </div>

          {/* View Details Arrow */}
          <div className={`
            text-gray-400 group-hover:text-boticario-pink 
            group-hover:translate-x-1 transition-all duration-200
          `}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};
