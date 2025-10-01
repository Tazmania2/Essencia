'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CycleHistoryDashboard } from '../../components/dashboard/CycleHistoryDashboard';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

function HistoryContent() {
  const searchParams = useSearchParams();
  const playerId = searchParams.get('playerId');
  const playerName = searchParams.get('playerName');

  if (!playerId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">ID do Jogador Necessário</h1>
          <p className="text-gray-600">Por favor, acesse o histórico através do dashboard do jogador.</p>
          <a 
            href="/dashboard" 
            className="mt-4 inline-block px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Voltar ao Dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100">
      <CycleHistoryDashboard 
        playerId={playerId} 
        playerName={playerName || undefined}
      />
    </div>
  );
}

export default function HistoryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    }>
      <HistoryContent />
    </Suspense>
  );
}