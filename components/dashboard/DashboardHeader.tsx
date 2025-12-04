'use client';

import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface DashboardHeaderProps {
  playerName: string;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ playerName }) => {
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="bg-gradient-to-r from-boticario-pink to-boticario-purple text-white p-4 sm:p-6 shadow-lg">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-boticario-pink font-bold text-lg sm:text-xl">🌸</span>
            </div>
            <h1 className="text-lg sm:text-2xl font-bold">O Boticário Rewards</h1>
          </div>
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm opacity-90">Bem-vinda de volta!</p>
              <p className="font-semibold text-lg">Olá, {playerName}! ✨</p>
            </div>
            <div className="text-right sm:hidden">
              <p className="font-semibold text-sm">Olá, {playerName}!</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-1 sm:space-x-2 bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg transition-colors"
              title="Sair do sistema"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline text-sm font-medium">Sair</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};