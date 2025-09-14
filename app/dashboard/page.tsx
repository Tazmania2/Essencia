'use client';

import { PlayerRoute } from '../../components/auth/ProtectedRoute';
import { PlayerDashboard } from '../../components/dashboard/PlayerDashboard';
import { useAuth } from '../../contexts/AuthContext';
import { useState, useEffect, useMemo } from 'react';
import { DashboardService } from '../../services/dashboard.service';
import { FunifierPlayerService } from '../../services/funifier-player.service';
import { FunifierDatabaseService } from '../../services/funifier-database.service';
import { TeamProcessorFactory } from '../../services/team-processor-factory.service';
import { UserIdentificationService } from '../../services/user-identification.service';
import { DashboardData } from '../../types';

export default function DashboardPage() {
  return (
    <PlayerRoute>
      <DashboardContent />
    </PlayerRoute>
  );
}

function DashboardContent() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize dashboard service
  const dashboardService = useMemo(() => new DashboardService(
    FunifierPlayerService.getInstance(),
    FunifierDatabaseService.getInstance(),
    TeamProcessorFactory.getInstance(),
    UserIdentificationService.getInstance()
  ), []);

  // Process player data when user data is available
  useEffect(() => {
    const processData = async () => {
      if (!user?.playerData || !user?.teamInfo?.teamType) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const data = await dashboardService.processPlayerDataToDashboard(
          user.playerData, 
          user.teamInfo.teamType
        );
        
        setDashboardData(data);
      } catch (err) {
        console.error('Error processing dashboard data:', err);
        setError('Erro ao processar dados do dashboard. Tente fazer login novamente.');
      } finally {
        setLoading(false);
      }
    };

    processData();
  }, [user?.playerData, user?.teamInfo?.teamType, dashboardService]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Carregando dados do usuário...</p>
        </div>
      </div>
    );
  }

  if (!user.playerData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Dados do jogador não encontrados. Faça login novamente.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Processando dados do dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Erro ao processar dados do dashboard. Tente fazer login novamente.</p>
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
}