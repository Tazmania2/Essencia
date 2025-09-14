'use client';

import React, { useState, useEffect } from 'react';
import { PlayerDashboard } from './PlayerDashboard';
import { DashboardService } from '../../services/dashboard.service';
import { FunifierPlayerService } from '../../services/funifier-player.service';
import { FunifierPlayerStatus, DashboardData } from '../../types';

interface DebugDashboardProps {
  playerId: string;
  token: string;
}

export const DebugDashboard: React.FC<DebugDashboardProps> = ({ playerId, token }) => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rawPlayerData, setRawPlayerData] = useState<FunifierPlayerStatus | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get raw player data from Funifier
        const playerService = FunifierPlayerService.getInstance();
        const playerStatus = await playerService.getPlayerStatus(playerId);
        
        console.log('Raw Funifier Player Data:', playerStatus);
        setRawPlayerData(playerStatus);

        // Extract dashboard data directly
        const dashboardData = DashboardService.extractDirectDashboardData(playerStatus);
        
        console.log('Extracted Dashboard Data:', dashboardData);
        setDashboardData(dashboardData);

      } catch (err) {
        console.error('Debug Dashboard Error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (playerId && token) {
      fetchData();
    }
  }, [playerId, token]);

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-boticario-light to-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-boticario-pink mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dados do Funifier...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-boticario-light to-white min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Erro ao carregar dados</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
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
    <div>
      {/* Debug Info Panel (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-gray-100 p-4 border-b">
          <details className="max-w-7xl mx-auto">
            <summary className="cursor-pointer font-semibold text-gray-700 hover:text-gray-900">
              🐛 Debug Info (Click to expand)
            </summary>
            <div className="mt-4 space-y-4">
              <div>
                <h3 className="font-semibold text-sm text-gray-600 mb-2">Raw Funifier Data:</h3>
                <pre className="bg-white p-3 rounded text-xs overflow-auto max-h-40 border">
                  {JSON.stringify(rawPlayerData, null, 2)}
                </pre>
              </div>
              <div>
                <h3 className="font-semibold text-sm text-gray-600 mb-2">Extracted Dashboard Data:</h3>
                <pre className="bg-white p-3 rounded text-xs overflow-auto max-h-40 border">
                  {JSON.stringify(dashboardData, null, 2)}
                </pre>
              </div>
            </div>
          </details>
        </div>
      )}
      
      {/* Main Dashboard */}
      <PlayerDashboard 
        {...dashboardData}
        secondaryGoal1={{
          ...dashboardData.secondaryGoal1,
          hasBoost: true,
          isBoostActive: dashboardData.secondaryGoal1.isBoostActive ?? false
        }}
        secondaryGoal2={{
          ...dashboardData.secondaryGoal2,
          hasBoost: true,
          isBoostActive: dashboardData.secondaryGoal2.isBoostActive ?? false
        }}
      />
    </div>
  );
};