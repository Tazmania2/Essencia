import { useState, useEffect } from 'react';
import { DashboardService } from '../services/dashboard.service';
import { FunifierPlayerService } from '../services/funifier-player.service';
import { FunifierDatabaseService } from '../services/funifier-database.service';
import { TeamProcessorFactory } from '../services/team-processor-factory.service';
import { UserIdentificationService } from '../services/user-identification.service';
import { DashboardData, ApiError, ErrorType } from '../types';

interface UseDashboardResult {
  dashboardData: DashboardData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useDashboard = (playerId: string, token: string): UseDashboardResult => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize services
  const dashboardService = new DashboardService(
    FunifierPlayerService.getInstance(),
    FunifierDatabaseService.getInstance(),
    TeamProcessorFactory.getInstance(),
    UserIdentificationService.getInstance()
  );

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await dashboardService.getDashboardData(playerId, token);
      setDashboardData(data);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      
      if (err instanceof ApiError) {
        switch (err.type) {
          case ErrorType.AUTHENTICATION_ERROR:
            setError('Erro de autenticação. Faça login novamente.');
            break;
          case ErrorType.FUNIFIER_API_ERROR:
            setError('Erro ao conectar com o servidor. Tente novamente.');
            break;
          case ErrorType.DATA_PROCESSING_ERROR:
            setError('Erro ao processar dados. Contate o suporte.');
            break;
          default:
            setError('Erro inesperado. Tente novamente.');
        }
      } else {
        setError('Erro ao carregar dashboard. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (playerId && token) {
      fetchDashboardData();
    }
  }, [playerId, token]);

  return {
    dashboardData,
    loading,
    error,
    refetch: fetchDashboardData
  };
};