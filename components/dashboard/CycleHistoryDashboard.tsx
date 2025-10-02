'use client';

import React, { useState, useEffect } from 'react';
import { CycleHistoryData } from '../../types';
import { historyService } from '../../services/history.service';
import { LoadingState, Skeleton } from '../ui/LoadingSpinner';
import { CycleDetailsView } from './CycleDetailsView';
import { useHistoryLoading } from '../../hooks/useLoadingState';
import { useNotificationHelpers } from '../ui/NotificationSystem';

interface CycleHistoryDashboardProps {
  playerId: string;
  playerName?: string;
  onBack?: () => void;
}

export const CycleHistoryDashboard: React.FC<CycleHistoryDashboardProps> = ({
  playerId,
  playerName,
  onBack
}) => {
  const [cycles, setCycles] = useState<CycleHistoryData[]>([]);
  const [selectedCycle, setSelectedCycle] = useState<CycleHistoryData | null>(null);
  const { loadingState, executeWithLoading, retry } = useHistoryLoading();
  const { notifyHistoryLoaded, notifyNoHistoryData } = useNotificationHelpers();

  useEffect(() => {
    let isMounted = true; // Prevent state updates if component unmounts
    
    const loadCycleHistory = async () => {
      if (!playerId || !isMounted) return;

      const result = await executeWithLoading(
        async () => {
          const cycleHistory = await historyService.getPlayerCycleHistory(playerId);
          return cycleHistory;
        },
        'Carregando histórico de ciclos...'
      );

      if (result && isMounted) {
        setCycles(result);
        
        if (result.length === 0) {
          notifyNoHistoryData();
        } else {
          notifyHistoryLoaded(result.length);
        }
      }
    };

    loadCycleHistory();
    
    // Cleanup function to prevent memory leaks
    return () => {
      isMounted = false;
    };
  }, [playerId]); // ✅ Removed executeWithLoading from dependencies to prevent re-renders

  const handleCycleSelect = (cycle: CycleHistoryData) => {
    setSelectedCycle(cycle);
  };

  const handleBackToList = () => {
    setSelectedCycle(null);
  };

  const handleRetry = async () => {
    await retry();
  };

  if (selectedCycle) {
    return (
      <CycleDetailsView
        cycle={selectedCycle}
        playerId={playerId}
        onBack={handleBackToList}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">📈 Histórico de Ciclos</h1>
              {playerName && (
                <p className="text-gray-600 mt-1">Jogador: {playerName}</p>
              )}
            </div>
            {onBack && (
              <button
                onClick={onBack}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                ← Voltar ao Dashboard
              </button>
            )}
          </div>
          
          {!loadingState.isLoading && !loadingState.error && cycles.length > 0 && (
            <div className="mt-4 text-sm text-gray-500">
              {cycles.length} ciclo{cycles.length !== 1 ? 's' : ''} encontrado{cycles.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        <LoadingState
          isLoading={loadingState.isLoading}
          error={loadingState.error}
          isEmpty={cycles.length === 0}
          emptyMessage="Nenhum histórico de ciclos encontrado para este jogador"
          loadingMessage={loadingState.message || 'Carregando histórico...'}
          onRetry={handleRetry}
          className="min-h-[400px]"
        >
          <div className="space-y-4">
            {cycles.map((cycle) => (
              <CycleHistoryCard
                key={cycle.cycleNumber}
                cycle={cycle}
                onClick={() => handleCycleSelect(cycle)}
              />
            ))}
          </div>
        </LoadingState>

        {/* Loading skeleton */}
        {loadingState.isLoading && (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <CycleHistoryCardSkeleton key={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface CycleHistoryCardProps {
  cycle: CycleHistoryData;
  onClick: () => void;
}

const CycleHistoryCard: React.FC<CycleHistoryCardProps> = ({ cycle, onClick }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getOverallPerformance = () => {
    const total = cycle.finalMetrics.primaryGoal.percentage +
                  cycle.finalMetrics.secondaryGoal1.percentage +
                  cycle.finalMetrics.secondaryGoal2.percentage;
    return Math.round(total / 3);
  };

  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600 bg-green-100';
    if (percentage >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const overallPerformance = getOverallPerformance();
  const performanceColorClass = getPerformanceColor(overallPerformance);

  return (
    <div
      className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer border border-gray-200 hover:border-blue-300"
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                Ciclo {cycle.cycleNumber}
              </div>
              <div className="text-sm text-gray-500">
                {cycle.totalDays} dias
              </div>
            </div>
            
            <div className="flex-1">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Início:</span>
                  <span className="ml-1 font-medium">
                    {formatDate(cycle.startDate)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Fim:</span>
                  <span className="ml-1 font-medium">
                    {formatDate(cycle.endDate)}
                  </span>
                </div>
              </div>
              
              <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Meta Principal:</span>
                  <div className="font-semibold text-purple-600">
                    {cycle.finalMetrics.primaryGoal.percentage.toFixed(1)}%
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Meta Secundária 1:</span>
                  <div className="font-semibold text-green-600">
                    {cycle.finalMetrics.secondaryGoal1.percentage.toFixed(1)}%
                    {cycle.finalMetrics.secondaryGoal1.boostActive && (
                      <span className="ml-1 text-green-600">🚀</span>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Meta Secundária 2:</span>
                  <div className="font-semibold text-purple-600">
                    {cycle.finalMetrics.secondaryGoal2.percentage.toFixed(1)}%
                    {cycle.finalMetrics.secondaryGoal2.boostActive && (
                      <span className="ml-1 text-purple-600">🚀</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-center">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${performanceColorClass}`}>
              {overallPerformance}%
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Performance Geral
            </div>
          </div>
          
          <div className="text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
      
      {/* Progress Timeline Preview */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="text-xs text-gray-500 mb-2">
          Evolução do ciclo ({cycle.progressTimeline.length} pontos de dados)
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(overallPerformance, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
};

const CycleHistoryCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
      <div className="animate-pulse">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-4 w-12" />
              </div>
              
              <div className="flex-1">
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <Skeleton className="h-4 w-20 mb-1" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <div>
                    <Skeleton className="h-4 w-16 mb-1" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Skeleton className="h-4 w-20 mb-1" />
                    <Skeleton className="h-5 w-12" />
                  </div>
                  <div>
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-5 w-12" />
                  </div>
                  <div>
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-5 w-12" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <Skeleton className="h-6 w-12 rounded-full mb-1" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-5 w-5" />
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-100">
          <Skeleton className="h-3 w-32 mb-2" />
          <Skeleton className="h-2 w-full rounded-full" />
        </div>
      </div>
    </div>
  );
};