'use client';

import React from 'react';

interface DashboardHeaderProps {
  playerName: string;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ playerName }) => {
  return (
    <header className="bg-gradient-to-r from-boticario-pink to-boticario-purple text-white p-6 shadow-lg">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
              <span className="text-boticario-pink font-bold text-xl">🌸</span>
            </div>
            <h1 className="text-2xl font-bold">O Boticário Rewards</h1>
          </div>
          <div className="text-right">
            <p className="text-sm opacity-90">Bem-vinda de volta!</p>
            <p className="font-semibold text-lg">Olá, {playerName}! ✨</p>
          </div>
        </div>
      </div>
    </header>
  );
};