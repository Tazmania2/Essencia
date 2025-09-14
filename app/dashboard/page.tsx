'use client';

import { PlayerRoute } from '../../components/auth/ProtectedRoute';
import { PlayerDashboard } from '../../components/dashboard/PlayerDashboard';
import { RefreshButton } from '../../components/dashboard/RefreshButton';
import { useFreshDashboardData } from '../../hooks/useFreshDashboardData';
import { useAuth } from '../../contexts/AuthContext';

export default function DashboardPage() {
  return (
    <PlayerRoute>
      <DashboardContent />
    </PlayerRoute>
  );
}

function DashboardContent() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Carregando dados do usuário...</p>
        </div>
      </div>
    );
  }

  if (!user.userId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">ID do jogador não encontrado. Faça login novamente.</p>
        </div>
      </div>
    );
  }

  return <DashboardWithFreshData playerId={user.userId} />;
}

function DashboardWithFreshData({ playerId }: { playerId: string }) {
  const {
    dashboardData,
    rawPlayerData,
    loading,
    error,
    lastUpdated,
    refreshData
  } = useFreshDashboardData(playerId);

  if (loading && !dashboardData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-boticario-pink mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dados do Funifier...</p>
        </div>
      </div>
    );
  }

  if (error && !dashboardData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Erro ao carregar dados</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={refreshData}
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
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Nenhum dado encontrado</p>
        </div>
      </div>
    );
  }

  // Ensure the data matches the expected PlayerDashboard props
  const dashboardProps = {
    ...dashboardData,
    secondaryGoal1: {
      ...dashboardData.secondaryGoal1,
      hasBoost: true,
      isBoostActive: dashboardData.secondaryGoal1.isBoostActive ?? false
    },
    secondaryGoal2: {
      ...dashboardData.secondaryGoal2,
      hasBoost: true,
      isBoostActive: dashboardData.secondaryGoal2.isBoostActive ?? false
    }
  };

  return (
    <div>
      {/* Refresh Controls */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <RefreshButton
            onRefresh={refreshData}
            loading={loading}
            lastUpdated={lastUpdated}
          />
        </div>
      </div>

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
              <div>
                <h3 className="font-semibold text-sm text-gray-600 mb-2">Cache Status:</h3>
                <pre className="bg-white p-3 rounded text-xs overflow-auto max-h-20 border">
                  {JSON.stringify({
                    lastUpdated: lastUpdated?.toISOString(),
                    loading,
                    error
                  }, null, 2)}
                </pre>
                <div className="mt-2 flex space-x-2">
                  <button
                    onClick={() => {
                      localStorage.removeItem('funifier_dashboard_data');
                      window.location.reload();
                    }}
                    className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                  >
                    Clear Cache & Reload
                  </button>
                  <button
                    onClick={refreshData}
                    className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                  >
                    Force Refresh
                  </button>
                </div>
              </div>
            </div>
          </details>
        </div>
      )}
      
      {/* Main Dashboard */}
      <PlayerDashboard {...dashboardProps} />
    </div>
  );
}