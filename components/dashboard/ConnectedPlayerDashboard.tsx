'use client';

import React from 'react';
import { PlayerDashboard } from './PlayerDashboard';
import { useDashboard } from '../../hooks/useDashboard';
import { TeamType } from '../../types';

interface ConnectedPlayerDashboardProps {
  playerId: string;
  token: string;
  selectedTeamType?: TeamType;
}

export const ConnectedPlayerDashboard: React.FC<ConnectedPlayerDashboardProps> = ({
  playerId,
  token,
  selectedTeamType
}) => {
  const { dashboardData, loading, error, refetch } = useDashboard(playerId, token, selectedTeamType);

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-boticario-light to-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-boticario-pink mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando seu dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-boticario-light to-white min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Ops! Algo deu errado</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={refetch}
            className="bg-boticario-pink text-white px-6 py-2 rounded-lg hover:bg-boticario-purple transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="bg-gradient-to-br from-boticario-light to-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Nenhum dado encontrado</p>
        </div>
      </div>
    );
  }

  return (
    <PlayerDashboard 
      {...dashboardData}
      secondaryGoal1={{
        ...dashboardData.secondaryGoal1,
        isBoostActive: dashboardData.secondaryGoal1.isBoostActive ?? false
      }}
      secondaryGoal2={{
        ...dashboardData.secondaryGoal2,
        isBoostActive: dashboardData.secondaryGoal2.isBoostActive ?? false
      }}
    />
  );
};