'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentSection: string;
}

interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  description: string;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  isOpen,
  onClose,
  currentSection
}) => {
  const { user, logout } = useAuth();

  const navigationItems: NavigationItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      href: '/admin',
      description: 'Visão geral do sistema',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
        </svg>
      )
    },
    {
      id: 'players',
      label: 'Gerenciar Jogadores',
      href: '/admin/players',
      description: 'Visualizar e gerenciar dados dos jogadores',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      )
    },
    {
      id: 'reports',
      label: 'Upload de Relatórios',
      href: '/admin/reports',
      description: 'Fazer upload e sincronizar dados',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      )
    },
    {
      id: 'export',
      label: 'Exportar Dados',
      href: '/admin/export',
      description: 'Gerar e exportar relatórios',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    }
  ];

  const sidebarClasses = `
    fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out
    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    lg:translate-x-0 lg:static lg:inset-0
  `;

  return (
    <div className={sidebarClasses}>
      {/* Sidebar Header */}
      <div className="flex items-center justify-between h-16 px-6 bg-gradient-to-r from-boticario-pink to-boticario-purple">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
            <span className="text-boticario-pink font-bold text-lg">🌸</span>
          </div>
          <div className="text-white">
            <h1 className="text-lg font-semibold">Admin Panel</h1>
            <p className="text-xs text-pink-100">O Boticário</p>
          </div>
        </div>
        
        {/* Close button for mobile */}
        <button
          onClick={onClose}
          className="lg:hidden text-white hover:text-pink-200 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* User Info */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-boticario-pink to-boticario-purple rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-sm">
              {user?.userName?.charAt(0).toUpperCase() || 'A'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.userName || 'Administrador'}
            </p>
            <p className="text-xs text-gray-500">Administrador</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        <div className="mb-6">
          <h2 className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Navegação Principal
          </h2>
        </div>
        
        {navigationItems.map((item) => {
          const isActive = currentSection === item.id;
          
          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={onClose}
              className={`
                group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200
                ${isActive 
                  ? 'bg-gradient-to-r from-boticario-pink to-boticario-purple text-white shadow-lg' 
                  : 'text-gray-700 hover:bg-boticario-light hover:text-boticario-dark'
                }
              `}
            >
              <div className={`
                mr-3 flex-shrink-0 transition-colors
                ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-boticario-pink'}
              `}>
                {item.icon}
              </div>
              <div className="flex-1">
                <div className="font-medium">{item.label}</div>
                <div className={`
                  text-xs mt-0.5
                  ${isActive ? 'text-pink-100' : 'text-gray-500 group-hover:text-boticario-dark'}
                `}>
                  {item.description}
                </div>
              </div>
              
              {isActive && (
                <div className="ml-2">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="px-4 py-4 border-t border-gray-200">
        <button
          onClick={logout}
          className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors group"
        >
          <svg className="w-5 h-5 mr-3 text-gray-400 group-hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sair do Sistema
        </button>
      </div>
    </div>
  );
};