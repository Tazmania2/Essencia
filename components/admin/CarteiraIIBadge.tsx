'use client';

import React from 'react';

interface CarteiraIIBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  className?: string;
}

export const CarteiraIIBadge: React.FC<CarteiraIIBadgeProps> = ({
  size = 'md',
  showTooltip = true,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <div className={`
        inline-flex items-center bg-gradient-to-r from-orange-500 to-red-500 text-white 
        rounded-full font-medium shadow-lg border-2 border-orange-300
        ${sizeClasses[size]}
      `}>
        <svg className={`${iconSizes[size]} mr-1`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <span>Processamento Especial</span>
      </div>

      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
          <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap shadow-xl">
            <div className="font-semibold mb-1">Carteira II - Processamento Local</div>
            <div className="text-gray-300 text-xs">
              • Cálculos locais em vez de API Funifier<br/>
              • Boosts gerenciados localmente<br/>
              • Requer cuidado especial nas mudanças
            </div>
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      )}
    </div>
  );
};

interface CarteiraIIWarningBannerProps {
  onDismiss?: () => void;
  showDismiss?: boolean;
}

export const CarteiraIIWarningBanner: React.FC<CarteiraIIWarningBannerProps> = ({
  onDismiss,
  showDismiss = false
}) => {
  return (
    <div className="bg-gradient-to-r from-orange-100 to-red-100 border border-orange-300 rounded-lg p-4 mb-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-lg font-semibold text-orange-800">
            ⚙️ Carteira II - Processamento Especial Ativo
          </h3>
          <p className="text-orange-700 mt-1">
            Esta carteira utiliza processamento local customizado. Mudanças na configuração 
            podem afetar a lógica de cálculo e requerem testes cuidadosos.
          </p>
          <div className="mt-3 flex items-center space-x-4 text-sm">
            <div className="flex items-center text-orange-600">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Cálculos Locais
            </div>
            <div className="flex items-center text-orange-600">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Boosts Customizados
            </div>
            <div className="flex items-center text-orange-600">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Validação Especial
            </div>
          </div>
        </div>
        {showDismiss && onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 ml-4 text-orange-500 hover:text-orange-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};