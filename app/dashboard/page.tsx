'use client';

import { PlayerRoute } from '../../components/auth/ProtectedRoute';
import { ConnectedPlayerDashboard } from '../../components/dashboard/ConnectedPlayerDashboard';
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
  const { isAuthenticated } = useAuth();
  
  // Get token from localStorage (restored by AuthContext)
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') || '' : '';
  
  if (!isAuthenticated || !token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Token de autenticação não encontrado. Faça login novamente.</p>
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
                  {JSON.stringify(user.playerData, null, 2)}
                </pre>
              </div>
              <div>
                <h3 className="font-semibold text-sm text-gray-600 mb-2">Enhanced Dashboard Integration:</h3>
                <pre className="bg-white p-3 rounded text-xs overflow-auto max-h-20 border">
                  {JSON.stringify({
                    dataSource: 'Enhanced Dashboard Service (Funifier + Database + CSV)',
                    playerId: user.userId,
                    fallbackLogic: 'Funifier primary, Database fallback, CSV details',
                    tokenSource: 'funifierAuthService (not user object)'
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
      
      {/* Enhanced Dashboard with Database Integration */}
      <ConnectedPlayerDashboard 
        playerId={user.userId}
        token={token}
      />
    </div>
  );
}