'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoginForm } from '../../components/auth/LoginForm';
import { useAuth } from '../../contexts/AuthContext';
import { LoginCredentials } from '../../types';

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { login, isLoading, isAuthenticated, user, error: authError } = useAuth();

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
      await login(credentials);
      // Redirect will be handled by the useEffect above
    } catch (err) {
      // Error handling is done in the AuthContext
      // We can get the error from the context if needed
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FCE4EC] via-[#F8BBD9] to-[#E1BEE7] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-pink-100" style={{ boxShadow: '0 10px 25px rgba(233, 30, 99, 0.1)' }}>
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-[#E91E63] to-[#9C27B0] rounded-full mx-auto mb-6 flex items-center justify-center shadow-lg">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-[#880E4F] mb-3 font-poppins">
              Dashboard Essência
            </h1>
            <p className="text-[#9C27B0] font-medium">
              Faça login para acessar seu dashboard de gamificação
            </p>
            <div className="w-16 h-1 bg-gradient-to-r from-[#E91E63] to-[#9C27B0] mx-auto mt-4 rounded-full"></div>
          </div>

          {/* Error Message */}
          {(error || authError) && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg shadow-sm">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-700 text-sm font-medium">{error || authError}</p>
              </div>
            </div>
          )}

          {/* Login Form */}
          <LoginForm onSubmit={handleLogin} isLoading={isLoading} />

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-xs text-[#9C27B0] font-medium">
              © 2024 Grupo Essência - O Boticário
            </p>
            <div className="mt-2 flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-[#E91E63] rounded-full"></div>
              <div className="w-2 h-2 bg-[#9C27B0] rounded-full"></div>
              <div className="w-2 h-2 bg-[#FFD700] rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}