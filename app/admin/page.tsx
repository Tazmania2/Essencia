'use client';

import { AdminRoute } from '../../components/auth/ProtectedRoute';
import { useAuth } from '../../contexts/AuthContext';

export default function AdminPage() {
  return (
    <AdminRoute>
      <AdminContent />
    </AdminRoute>
  );
}

function AdminContent() {
  const { user, logout } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Carregando dados do administrador...</p>
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
                Painel Administrativo
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user.userName}</p>
                <p className="text-xs text-gray-500">Administrador</p>
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
              Bem-vindo, {user.userName}!
            </h2>
            <p className="text-gray-600">
              Painel de administração do sistema de gamificação
            </p>
          </div>

          {/* Admin Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Players Card */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Jogadores</p>
                  <p className="text-2xl font-bold">-</p>
                </div>
                <svg className="w-8 h-8 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
            </div>

            {/* Teams Card */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Times</p>
                  <p className="text-2xl font-bold">4</p>
                </div>
                <svg className="w-8 h-8 text-green-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>

            {/* Reports Card */}
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Relatórios</p>
                  <p className="text-2xl font-bold">-</p>
                </div>
                <svg className="w-8 h-8 text-purple-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>

            {/* System Status Card */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Sistema</p>
                  <p className="text-2xl font-bold">Online</p>
                </div>
                <svg className="w-8 h-8 text-orange-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-50 rounded-xl p-6 hover:bg-gray-100 transition-colors cursor-pointer">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Gerenciar Jogadores</h3>
                  <p className="text-sm text-gray-600">Visualizar e gerenciar dados dos jogadores</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-6 hover:bg-gray-100 transition-colors cursor-pointer">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Upload de Relatórios</h3>
                  <p className="text-sm text-gray-600">Fazer upload e sincronizar dados</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-6 hover:bg-gray-100 transition-colors cursor-pointer">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Relatórios</h3>
                  <p className="text-sm text-gray-600">Gerar e exportar relatórios</p>
                </div>
              </div>
            </div>
          </div>

          {/* Coming Soon Section */}
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full mx-auto mb-6 flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Painel Administrativo em Desenvolvimento
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              As funcionalidades administrativas completas estarão disponíveis em breve. 
              Aguarde as próximas atualizações!
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}