'use client';

import { PlayerRoute } from '../../components/auth/ProtectedRoute';
import { useAuth } from '../../contexts/AuthContext';

export default function DashboardPage() {
  return (
    <PlayerRoute>
      <DashboardContent />
    </PlayerRoute>
  );
}

function DashboardContent() {
  const { user, logout } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Carregando dados do usuário...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full mr-3"></div>
              <h1 className="text-xl font-semibold text-gray-900">
                Dashboard Essência
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user.userName}</p>
                <p className="text-xs text-gray-500">
                  {user.teamInfo.teamType ? user.teamInfo.teamType.replace('_', ' ') : 'Sem time'}
                </p>
              </div>
              
              <button
                onClick={logout}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Olá, {user.userName}!
            </h2>
            <p className="text-gray-600">
              Bem-vindo ao seu dashboard de gamificação
            </p>
          </div>

          {/* User Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Role Card */}
            <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-pink-100 text-sm">Tipo de Usuário</p>
                  <p className="text-xl font-bold">
                    {user.role.isAdmin ? 'Administrador' : 'Jogador'}
                  </p>
                </div>
                <svg className="w-8 h-8 text-pink-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>

            {/* Team Card */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Time</p>
                  <p className="text-xl font-bold">
                    {user.teamInfo.teamType ? user.teamInfo.teamType.replace('_', ' ') : 'Não definido'}
                  </p>
                </div>
                <svg className="w-8 h-8 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>

            {/* Status Card */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Status</p>
                  <p className="text-xl font-bold">Ativo</p>
                </div>
                <svg className="w-8 h-8 text-green-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Coming Soon Section */}
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full mx-auto mb-6 flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Dashboard em Desenvolvimento
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Seu dashboard personalizado com métricas de gamificação estará disponível em breve. 
              Aguarde as próximas atualizações!
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}