'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { TeamType } from '../types';

interface RouteGuardOptions {
  requireAuth?: boolean;
  requireRole?: 'player' | 'admin';
  requireTeam?: TeamType;
  redirectTo?: string;
  onUnauthorized?: () => void;
}

export function useRouteGuard(options: RouteGuardOptions = {}) {
  const {
    requireAuth = true,
    requireRole,
    requireTeam,
    redirectTo = '/login',
    onUnauthorized
  } = options;

  const { isAuthenticated, isLoading, user, isPlayer, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return; // Wait for auth to initialize

    let shouldRedirect = false;
    let redirectPath = redirectTo;

    // Check authentication requirement
    if (requireAuth && !isAuthenticated) {
      shouldRedirect = true;
      redirectPath = redirectTo;
    }

    // Check role requirement
    if (requireRole && user && isAuthenticated) {
      if (requireRole === 'player' && !isPlayer) {
        shouldRedirect = true;
        redirectPath = '/unauthorized';
      }
      if (requireRole === 'admin' && !isAdmin) {
        shouldRedirect = true;
        redirectPath = '/unauthorized';
      }
    }

    // Check team requirement
    if (requireTeam && user && isAuthenticated) {
      if (user.teamInfo.teamType !== requireTeam) {
        shouldRedirect = true;
        redirectPath = '/unauthorized';
      }
    }

    if (shouldRedirect) {
      if (onUnauthorized) {
        onUnauthorized();
      } else {
        router.push(redirectPath);
      }
    }
  }, [
    isAuthenticated,
    isLoading,
    user,
    isPlayer,
    isAdmin,
    requireAuth,
    requireRole,
    requireTeam,
    redirectTo,
    router,
    onUnauthorized
  ]);

  return {
    isAuthenticated,
    isLoading,
    user,
    isPlayer,
    isAdmin,
    canAccess: !isLoading && (
      (!requireAuth || isAuthenticated) &&
      (!requireRole || (requireRole === 'player' ? isPlayer : isAdmin)) &&
      (!requireTeam || (user?.teamInfo.teamType === requireTeam))
    )
  };
}

// Convenience hooks for specific route guards
export function usePlayerRouteGuard(requireTeam?: TeamType, redirectTo?: string) {
  return useRouteGuard({
    requireAuth: true,
    requireRole: 'player',
    requireTeam,
    redirectTo
  });
}

export function useAdminRouteGuard(redirectTo?: string) {
  return useRouteGuard({
    requireAuth: true,
    requireRole: 'admin',
    redirectTo
  });
}