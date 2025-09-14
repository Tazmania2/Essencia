'use client';

import { PlayerRoute } from '../../components/auth/ProtectedRoute';
import { PlayerDashboard } from '../../components/dashboard/PlayerDashboard';
import { DashboardService } from '../../services/dashboard.service';
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

  if (!user.playerData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Dados do jogador não encontrados. Faça login novamente.</p>
        </div>
      </div>
    );
  }

  return <DashboardWithAuthData user={user} />;
}

function DashboardWithAuthData({ user }: { user: any }) {
  // Extract dashboard data directly from existing player data
  const dashboardData = DashboardService.extractDirectDashboardData(user.playerData);

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
                  {JSON.stringify(user.playerData, null, 2)}
                </pre>
              </div>
              <div>
                <h3 className="font-semibold text-sm text-gray-600 mb-2">Extracted Dashboard Data:</h3>
                <pre className="bg-white p-3 rounded text-xs overflow-auto max-h-40 border">
                  {JSON.stringify(dashboardData, null, 2)}
                </pre>
              </div>
              <div>
                <h3 className="font-semibold text-sm text-gray-600 mb-2">Page Refresh Info:</h3>
                <pre className="bg-white p-3 rounded text-xs overflow-auto max-h-20 border">
                  {JSON.stringify({
                    refreshDetected: 'F5 refresh will fetch fresh data on next login',
                    currentDataSource: 'AuthContext (cached from login)'
                  }, null, 2)}
                </pre>
                <div className="mt-2 flex space-x-2">
                  <button
                    onClick={() => {
                      localStorage.clear();
                      window.location.reload();
                    }}
                    className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                  >
                    Clear All Cache & Reload
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