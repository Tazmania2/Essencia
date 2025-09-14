'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoginForm } from '../../components/auth/LoginForm';
import { useAuth } from '../../contexts/AuthContext';
import { LoginCredentials } from '../../types';
import { LoginDebug } from '../../components/debug/LoginDebug';

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const {
    login,
    isLoading,
    isAuthenticated,
    user,
    error: authError,
  } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role.isAdmin) {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    }
  }, [isAuthenticated, user, router]);

  const handleLogin = async (credentials: LoginCredentials) => {
    setError(null);

    try {
      // Login process started for user
      await login(credentials);
      // Login successful
      // Redirect will be handled by the useEffect above
    } catch (err) {
      // Login failed - error handled by AuthContext
      // Error handling is done in the AuthContext
      // But let's also set a local error as backup
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Erro inesperado. Tente novamente.');
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#FCE4EC] via-[#F8BBD9] to-[#E1BEE7] p-4">
      <div className="w-full max-w-md">
        <div
          className="rounded-2xl border border-pink-100 bg-white p-8 shadow-2xl"
          style={{ boxShadow: '0 10px 25px rgba(233, 30, 99, 0.1)' }}
        >
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-[#E91E63] to-[#9C27B0] shadow-lg">
              <svg
                className="h-10 w-10 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h1 className="font-poppins mb-3 text-3xl font-bold text-[#880E4F]">
              Dashboard Essência
            </h1>
            <p className="font-medium text-[#9C27B0]">
              Faça login para acessar seu dashboard de gamificação
            </p>
            <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-gradient-to-r from-[#E91E63] to-[#9C27B0]"></div>
          </div>

          {/* Error Message */}
          {(error || authError) && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 shadow-sm">
              <div className="flex items-center">
                <svg
                  className="mr-3 h-5 w-5 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-sm font-medium text-red-700">
                  {error || authError}
                </p>
              </div>
            </div>
          )}

          {/* Login Form */}
          <LoginForm onSubmit={handleLogin} isLoading={isLoading} />

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-xs font-medium text-[#9C27B0]">
              © 2024 Grupo Essência - O Boticário
            </p>
            <div className="mt-2 flex items-center justify-center space-x-2">
              <div className="h-2 w-2 rounded-full bg-[#E91E63]"></div>
              <div className="h-2 w-2 rounded-full bg-[#9C27B0]"></div>
              <div className="h-2 w-2 rounded-full bg-[#FFD700]"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Debug component for development */}
      <LoginDebug />
    </div>
  );
}
