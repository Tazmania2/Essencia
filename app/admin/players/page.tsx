'use client';

import { AdminRoute } from '../../../components/auth/ProtectedRoute';
import { AdminLayout } from '../../../components/admin/AdminLayout';
import { PlayerSelector } from '../../../components/admin/PlayerSelector';
import { useState } from 'react';

interface Player {
  id: string;
  name: string;
  team: any;
  totalPoints: number;
  isActive: boolean;
}

export default function AdminPlayersPage() {
  return (
    <AdminRoute>
      <AdminPlayersContent />
    </AdminRoute>
  );
}

function AdminPlayersContent() {
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  const breadcrumbItems = [
    { label: 'Dashboard', href: '/admin' },
    { label: 'Gerenciar Jogadores', isActive: true }
  ];

  return (
    <AdminLayout currentSection="players" breadcrumbItems={breadcrumbItems}>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gerenciar Jogadores</h1>
              <p className="text-gray-600">Visualize e gerencie informações dos jogadores</p>
            </div>
          </div>
        </div>

        {/* Player Selector Component */}
        <PlayerSelector
          onPlayerSelect={setSelectedPlayer}
          selectedPlayer={selectedPlayer}
        />
      </div>
    </AdminLayout>
  );
}