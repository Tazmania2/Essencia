'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { TeamType } from '../../types';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
  requireRole?: 'player' | 'admin';
  requireTeam?: TeamType;
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  requireAuth = true,
  requireRole,
  requireTeam,
  redirectTo = '/login'
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user, isPlayer, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return; // Wait for auth to initialize

    // Check authentication requirement
    if (requireAuth && !isAuthenticated) {
      router.push(redirectTo);
      return;
    }

    // Check role requirement
    if (requireRole && user) {
      if (requireRole === 'player' && !isPlayer) {
        router.push('/unauthorized');
        return;
      }
      if (requireRole === 'admin' && !isAdmin) {
        router.push('/unauthorized');
        return;
      }
    }

    // Check team requirement - validate that user has access to the required team
    if (requireTeam && user) {
      // Check if user has access to the required team (not just primary team)
      const hasTeamAccess = user.teamInfo.allTeamTypes.includes(requireTeam);
      if (!hasTeamAccess) {
        router.push('/unauthorized');
        return;
      }
    }
  }, [isAuthenticated, isLoading, user, isPlayer, isAdmin, requireAuth, requireRole, requireTeam, router, redirectTo]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center animate-pulse">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <p className="text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Don't render children if requirements are not met
  if (requireAuth && !isAuthenticated) {
    return null;
  }

  if (requireRole && user) {
    if (requireRole === 'player' && !isPlayer) return null;
    if (requireRole === 'admin' && !isAdmin) return null;
  }

  if (requireTeam && user && user.teamInfo.teamType !== requireTeam) {
    return null;
  }

  return <>{children}</>;
}

// Convenience components for specific protection levels
export function PlayerRoute({ children, requireTeam, redirectTo }: {
  children: ReactNode;
  requireTeam?: TeamType;
  redirectTo?: string;
}) {
  return (
    <ProtectedRoute
      requireAuth={true}
      requireRole="player"
      requireTeam={requireTeam}
      redirectTo={redirectTo}
    >
      {children}
    </ProtectedRoute>
  );
}

export function AdminRoute({ children, redirectTo }: {
  children: ReactNode;
  redirectTo?: string;
}) {
  return (
    <ProtectedRoute
      requireAuth={true}
      requireRole="admin"
      redirectTo={redirectTo}
    >
      {children}
    </ProtectedRoute>
  );
}