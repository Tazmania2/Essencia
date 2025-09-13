'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';

export default function UnauthorizedPage() {
  const router = useRouter();
  const { logout, user } = useAuth();

  const handleGoBack = () => {
    router.back();
  };

  const handleGoHome = () => {
    if (user?.role.isAdmin) {
      router.push('/admin');
    } else if (user?.role.isPlayer) {
      router.push('/dashboard');
    } else {
      router.push('/');
    }
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {/* Icon */}
          <div className="w-16 h-16 bg-red-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Acesso Negado
          </h1>

          {/* Message */}
          <p className="text-gray-600 mb-6">
            Você não tem permissão para acessar esta página. Verifique se você está logado com a conta correta ou se possui as permissões necessárias.
          </p>

          {/* User Info */}
          {user && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-medium text-gray-900 mb-2">Informações da Conta:</h3>
              <p className="text-sm text-gray-600">
                <strong>Nome:</strong> {user.userName}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Tipo:</strong> {user.role.isAdmin ? 'Administrador' : 'Jogador'}
              </p>
              {user.teamInfo.teamType && (
                <p className="text-sm text-gray-600">
                  <strong>Time:</strong> {user.teamInfo.teamType.replace('_', ' ')}
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleGoHome}
              className="w-full py-3 px-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg font-medium hover:from-pink-600 hover:to-purple-700 transition-all duration-200"
            >
              Ir para Página Inicial
            </button>
            
            <button
              onClick={handleGoBack}
              className="w-full py-3 px-4 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all duration-200"
            >
              Voltar
            </button>

            <button
              onClick={handleLogout}
              className="w-full py-3 px-4 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 transition-all duration-200"
            >
              Fazer Logout
            </button>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500">
              Se você acredita que isso é um erro, entre em contato com o administrador do sistema.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}