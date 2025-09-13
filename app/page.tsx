'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated && user) {
        // Redirect authenticated users to their appropriate dashboard
        if (user.role.isAdmin) {
          router.push('/admin');
        } else {
          router.push('/dashboard');
        }
      } else {
        // Redirect unauthenticated users to login
        router.push('/login');
      }
    }
  }, [isAuthenticated, user, isLoading, router]);

  // Show loading while determining where to redirect
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center animate-pulse">
          <span className="text-white font-bold text-2xl">🌸</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Dashboard Essência
        </h1>
        <p className="text-gray-600">
          Carregando...
        </p>
      </div>
    </main>
  );
}