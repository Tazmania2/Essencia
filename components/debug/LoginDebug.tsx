'use client';

import { useAuth } from '../../contexts/AuthContext';

export function LoginDebug() {
  const { isAuthenticated, isLoading, error, user } = useAuth();

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg text-xs max-w-sm z-50">
      <h3 className="font-bold mb-2">Debug Info</h3>
      <div>
        <strong>isAuthenticated:</strong> {isAuthenticated ? 'true' : 'false'}
      </div>
      <div>
        <strong>isLoading:</strong> {isLoading ? 'true' : 'false'}
      </div>
      <div>
        <strong>error:</strong> {error || 'none'}
      </div>
      <div>
        <strong>user:</strong> {user ? user.userName : 'none'}
      </div>
      <div>
        <strong>role:</strong> {user ? (user.role.isAdmin ? 'admin' : 'player') : 'none'}
      </div>
    </div>
  );
}