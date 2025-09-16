'use client';

import { ProtectedRoute } from '../../components/auth/ProtectedRoute';
import { ConnectedPlayerDashboard } from '../../components/dashboard/ConnectedPlayerDashboard';
import { PlayerDashboard } from '../../components/dashboard/PlayerDashboard';
import { DashboardService } from '../../services/dashboard.service';
import { useAuth } from '../../contexts/AuthContext';

export default function DashboardPage() {
  return (
    <ProtectedRoute requireAuth={true}>
      <DashboardContent />
    </ProtectedRoute>
  );
}

function DashboardContent() {
  const { user, selectedTeam, showTeamSelection } = useAuth();

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

  // Check if user has access to any player teams (not just admin)
  const hasPlayerTeamAccess = user.teamInfo.allTeamTypes && user.teamInfo.allTeamTypes.length > 0;
  if (!hasPlayerTeamAccess && !user.teamInfo.hasAdminAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Você não tem acesso a nenhuma equipe de jogador.</p>
          <button
            onClick={() => window.location.href = '/login'}
            className="mt-4 bg-boticario-pink text-white px-6 py-2 rounded-lg hover:bg-boticario-purple transition-colors"
          >
            Voltar ao Login
          </button>
        </div>
      </div>
    );
  }

  // Check if user has selected a valid team for dashboard access
  if (!selectedTeam || selectedTeam === 'ADMIN') {
    // If team selection modal is showing, show waiting message
    if (showTeamSelection) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-boticario-pink mx-auto mb-4"></div>
            <p className="text-gray-600 mb-2">Aguardando seleção de equipe...</p>
            <p className="text-sm text-gray-500">Por favor, selecione uma equipe no modal que apareceu.</p>
          </div>
        </div>
      );
    }
    
    // User doesn't have valid team access
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Acesso negado. Selecione uma equipe válida para acessar o dashboard.</p>
          <button
            onClick={() => window.location.href = '/login'}
            className="mt-4 bg-boticario-pink text-white px-6 py-2 rounded-lg hover:bg-boticario-purple transition-colors"
          >
            Voltar ao Login
          </button>
        </div>
      </div>
    );
  }

  return <DashboardWithAuthData user={user} selectedTeam={selectedTeam} />;
}

function DashboardWithAuthData({ user, selectedTeam }: { user: any; selectedTeam: any }) {
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
        selectedTeamType={selectedTeam !== 'ADMIN' ? selectedTeam : undefined}
      />
    </div>
  );
}