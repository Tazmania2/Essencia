'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { CycleHistoryDashboard } from '../../components/dashboard/CycleHistoryDashboard';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ErrorNotification } from '../../components/error/ErrorNotification';
import { CompatibilityWarning } from '../../components/compatibility/CompatibilityWarning';
import { LegacyDataNotice } from '../../components/compatibility/CompatibilityWarning';
import { useHistoryCompatibility } from '../../hooks/useBackwardCompatibility';
import { historyService } from '../../services';
import { EssenciaReportRecord } from '../../types';

export default function HistoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [playerRecords, setPlayerRecords] = useState<EssenciaReportRecord[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(true);

  // Get player ID from URL params or use current user
  const playerIdParam = searchParams.get('playerId');
  const playerId = playerIdParam || user?.id;
  const playerName = user?.name || 'Jogador';

  // Use backward compatibility hook
  const compatibility = useHistoryCompatibility(playerRecords);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    // Validate player ID
    if (!isLoading && isAuthenticated && !playerId) {
      setError('ID do jogador não encontrado. Redirecionando para o dashboard...');
      setTimeout(() => {
        router.push('/dashboard');
      }, 3000);
    }
  }, [isAuthenticated, isLoading, playerId, router]);

  // Load player records for compatibility checking
  useEffect(() => {
    const loadPlayerRecords = async () => {
      if (!playerId || !isAuthenticated) return;

      try {
        setRecordsLoading(true);
        // Get all records for compatibility analysis
        const records = await historyService.getPlayerCycleHistoryWithCompatibility(playerId);
        // Extract the raw records from the result for compatibility analysis
        // Note: This is a simplified approach - in practice you might want to store the full result
        setPlayerRecords([]); // We'll need to modify the service to return raw records too
      } catch (error) {
        console.error('Failed to load player records for compatibility:', error);
        setPlayerRecords([]);
      } finally {
        setRecordsLoading(false);
      }
    };

    loadPlayerRecords();
  }, [playerId, isAuthenticated]);

  const handleBackToDashboard = () => {
    router.push('/dashboard');
  };

  // Show loading while authentication is being checked
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <div className="flex items-center justify-center">
            <LoadingSpinner size="lg" />
            <span className="ml-3 text-lg text-gray-600">Carregando...</span>
          </div>
        </div>
      </div>
    );
  }

  // Show error if no player ID
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
        <div className="max-w-4xl mx-auto">
          <ErrorNotification
            message={error}
            onDismiss={() => setError(null)}
          />
        </div>
      </div>
    );
  }

  // Render history dashboard if authenticated and player ID is available
  if (isAuthenticated && playerId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="max-w-7xl mx-auto p-4 space-y-4">
          {/* Compatibility warnings */}
          {!recordsLoading && compatibility.shouldShowMigrationWarning && (
            <CompatibilityWarning
              records={playerRecords}
              context="history"
              className="mb-4"
            />
          )}
          
          {!recordsLoading && compatibility.shouldShowLegacyNotice && (
            <LegacyDataNotice
              message="Some of your historical data is from before cycle tracking was implemented."
              showMigrationHint={true}
              className="mb-4"
            />
          )}
          
          {/* Main history dashboard */}
          <CycleHistoryDashboard
            playerId={playerId}
            playerName={playerName}
            onBack={handleBackToDashboard}
          />
        </div>
      </div>
    );
  }

  // Fallback loading state
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-8 shadow-lg">
        <div className="flex items-center justify-center">
          <LoadingSpinner size="lg" />
          <span className="ml-3 text-lg text-gray-600">Preparando histórico...</span>
        </div>
      </div>
    </div>
  );
}