'use client';

import React from 'react';
import { SkipLink } from '../accessibility/SkipLink';
import { ScreenReaderOnly } from '../accessibility/ScreenReaderOnly';
import { useResponsive, useLiveRegion } from '../../hooks/useAccessibility';

interface AccessibleLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
}

export const AccessibleLayout: React.FC<AccessibleLayoutProps> = ({
  children,
  title = 'Dashboard Funifier',
  description = 'Dashboard de gamificação para acompanhamento de metas e pontuação',
  className = '',
}) => {
  const { isMobile, isTablet } = useResponsive();
  const { announce } = useLiveRegion();

  // Announce layout changes for screen readers
  React.useEffect(() => {
    if (isMobile) {
      announce('Layout mobile ativado', 'polite');
    } else if (isTablet) {
      announce('Layout tablet ativado', 'polite');
    } else {
      announce('Layout desktop ativado', 'polite');
    }
  }, [isMobile, isTablet, announce]);

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {/* Skip Links */}
      <SkipLink href="#main-content">
        Pular para o conteúdo principal
      </SkipLink>
      <SkipLink href="#navigation">
        Pular para a navegação
      </SkipLink>

      {/* Page Title for Screen Readers */}
      <ScreenReaderOnly as="h1">
        {title}
      </ScreenReaderOnly>

      {/* Page Description for Screen Readers */}
      <ScreenReaderOnly>
        {description}
      </ScreenReaderOnly>

      {/* Landmark Navigation */}
      <nav id="navigation" aria-label="Navegação principal" className="sr-only focus-within:not-sr-only">
        <ScreenReaderOnly as="h2">
          Menu de Navegação
        </ScreenReaderOnly>
        <ul className="flex space-x-4 p-4 bg-white shadow">
          <li>
            <a 
              href="#main-content" 
              className="text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
            >
              Conteúdo Principal
            </a>
          </li>
          <li>
            <a 
              href="#dashboard-metrics" 
              className="text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
            >
              Métricas do Dashboard
            </a>
          </li>
          <li>
            <a 
              href="#goals-section" 
              className="text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
            >
              Seção de Metas
            </a>
          </li>
        </ul>
      </nav>

      {/* Main Content */}
      <main 
        id="main-content" 
        className="container mx-auto px-4 py-6"
        role="main"
        aria-label="Conteúdo principal do dashboard"
      >
        <ScreenReaderOnly as="h2">
          Conteúdo Principal
        </ScreenReaderOnly>
        
        {/* Responsive Layout Container */}
        <div 
          className={`
            ${isMobile ? 'space-y-4' : 'space-y-6'}
            ${isTablet ? 'max-w-4xl mx-auto' : ''}
          `}
        >
          {children}
        </div>
      </main>

      {/* Live Region for Announcements */}
      <div 
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only"
        id="live-region"
      />

      {/* Status Region for Important Updates */}
      <div 
        aria-live="assertive" 
        aria-atomic="true" 
        className="sr-only"
        id="status-region"
      />

      {/* Footer with Accessibility Info */}
      <footer 
        className="mt-12 py-6 border-t border-gray-200 bg-white"
        role="contentinfo"
        aria-label="Informações do rodapé"
      >
        <div className="container mx-auto px-4">
          <ScreenReaderOnly as="h2">
            Informações de Acessibilidade
          </ScreenReaderOnly>
          
          <div className="text-center text-sm text-gray-600">
            <p>
              Este dashboard foi desenvolvido seguindo as diretrizes de acessibilidade WCAG 2.1 AA.
            </p>
            <p className="mt-2">
              Para suporte ou feedback sobre acessibilidade, entre em contato conosco.
            </p>
          </div>

          {/* Keyboard Shortcuts Help */}
          <details className="mt-4 max-w-2xl mx-auto">
            <summary className="cursor-pointer text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1">
              Atalhos de Teclado
            </summary>
            <div className="mt-2 p-4 bg-gray-50 rounded-lg">
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="font-medium">Tab / Shift+Tab:</dt>
                  <dd>Navegar entre elementos</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="font-medium">Enter / Espaço:</dt>
                  <dd>Ativar botões e links</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="font-medium">Escape:</dt>
                  <dd>Fechar modais e menus</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="font-medium">Setas:</dt>
                  <dd>Navegar em menus e listas</dd>
                </div>
              </dl>
            </div>
          </details>
        </div>
      </footer>
    </div>
  );
};