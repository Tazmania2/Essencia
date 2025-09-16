import { useState, useEffect } from 'react';
import { DashboardService } from '../services/dashboard.service';
import { FunifierPlayerService } from '../services/funifier-player.service';
import { FunifierDatabaseService } from '../services/funifier-database.service';
import { TeamProcessorFactory } from '../services/team-processor-factory.service';
import { UserIdentificationService } from '../services/user-identification.service';
import { funifierAuthService } from '../services/funifier-auth.service';
import { DashboardData, ApiError, ErrorType, TeamType } from '../types';

interface UseDashboardResult {
  dashboardData: DashboardData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useDashboard = (playerId: string, token: string, selectedTeamType?: TeamType): UseDashboardResult => {
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
      // Starting dashboard fetch for player
      setLoading(true);
      setError(null);
      
      // Use the passed token directly (it comes from localStorage via AuthContext)
      if (!token) {
        throw new ApiError({
          type: ErrorType.AUTHENTICATION_ERROR,
          message: 'No authentication token available',
          timestamp: new Date()
        });
      }
      
      const authToken = token;
      
      // Got auth token, calling dashboard service with selected team type
      const data = await dashboardService.getDashboardData(playerId, authToken, selectedTeamType);
      // Dashboard data received successfully
      setDashboardData(data);
    } catch (err) {
      // Dashboard fetch error - handled by error boundary
      
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
    if (playerId) {
      console.log('🔄 useDashboard: useEffect triggered for player:', playerId, 'team:', selectedTeamType);
      fetchDashboardData();
    }
  }, [playerId, selectedTeamType]);

  return {
    dashboardData,
    loading,
    error,
    refetch: fetchDashboardData
  };
};