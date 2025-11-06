'use client';

import { VirtualGoodItem } from '../../types';

interface ItemModalProps {
  item: VirtualGoodItem | null;
  levelName: string;
  currencyName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ItemModal({
  item,
  levelName,
  currencyName,
  isOpen,
  onClose
}: ItemModalProps) {
  // Don't render if not open or no item
  if (!isOpen || !item) {
    return null;
  }

  // Additional safety check - don't render if modal shouldn't be visible
  if (typeof window === 'undefined') {
    return null;
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Get the best available image (prefer medium, fallback to original, then small)
  const getImageUrl = () => {
    if (item.image?.medium?.url) return item.image.medium.url;
    if (item.image?.original?.url) return item.image.original.url;
    if (item.image?.small?.url) return item.image.small.url;
    return null;
  };

  const imageUrl = getImageUrl();

  // Extract price from requires array (type 0 is currency requirement)
  const getPrice = () => {
    const currencyRequirement = item.requires.find(req => req.type === 0);
    return currencyRequirement?.total || 0;
  };

  const price = getPrice();

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn"
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-h-[90vh] overflow-y-auto animate-slideUp md:max-w-2xl"
        role="dialog"
        aria-labelledby="item-modal-title"
        aria-describedby="item-modal-description"
      >
        {/* Header with Close Button */}
        <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex justify-end z-10">
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100"
            aria-label="Fechar modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8">
          {/* Image */}
          {imageUrl ? (
            <div className="flex justify-center mb-6">
              <img 
                src={imageUrl} 
                alt={item.name}
                className="max-w-full h-auto max-h-80 object-contain rounded-lg"
              />
            </div>
          ) : (
            <div className="flex justify-center mb-6">
              <div className="w-64 h-64 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                <svg className="w-24 h-24 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          )}

          {/* Item Details */}
          <div className="text-center mb-6">
            <h2 
              id="item-modal-title" 
              className="text-2xl md:text-3xl font-bold text-gray-900 mb-2"
            >
              {item.name}
            </h2>
            
            <p className="text-sm text-gray-500 mb-3">
              {levelName}
            </p>

            <div className="inline-flex items-center bg-gradient-to-r from-[#E91E63] to-[#9C27B0] text-white px-6 py-3 rounded-full font-semibold text-lg shadow-lg">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {price.toLocaleString('pt-BR')} {currencyName}
            </div>
          </div>

          {/* Description */}
          {item.description && (
            <div className="border-t border-gray-100 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Descrição
              </h3>
              <p 
                id="item-modal-description" 
                className="text-gray-700 leading-relaxed whitespace-pre-wrap"
              >
                {item.description}
              </p>
            </div>
          )}

          {!item.description && (
            <div className="border-t border-gray-100 pt-6">
              <p className="text-gray-500 text-center italic">
                Nenhuma descrição disponível para este item.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
