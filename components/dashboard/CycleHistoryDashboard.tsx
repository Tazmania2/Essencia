'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { CycleHistoryData, FunifierPlayerStatus } from '../../types';
import { historyService } from '../../services/history.service';
import { funifierPlayerService } from '../../services/funifier-player.service';
import { LoadingState, Skeleton } from '../ui/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';

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
  const { logout } = useAuth();
  const [cycles, setCycles] = useState<CycleHistoryData[]>([]);
  const [expandedCycle, setExpandedCycle] = useState<number | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playerData, setPlayerData] = useState<FunifierPlayerStatus | null>(null);
  const [playerDataLoading, setPlayerDataLoading] = useState(false);

  // ✅ Load cycle history data only once when component mounts or playerId changes
  useEffect(() => {
    if (!playerId || hasLoaded || isLoading) return;

    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const cycleHistory = await historyService.getPlayerCycleHistory(playerId);
        
        setCycles(cycleHistory);
        setHasLoaded(true);
        
        if (cycleHistory.length === 0) {
          console.log('ℹ️ No historical data found for this player');
        } else {
          console.log(`✅ History loaded successfully: ${cycleHistory.length} cycles found`);
        }
      } catch (error) {
        console.error('❌ Error loading cycle history:', error);
        setError(error instanceof Error ? error.message : 'Failed to load history');
        setHasLoaded(true); // Mark as loaded even on error to prevent infinite retries
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [playerId, hasLoaded, isLoading]); // Only depend on primitive values

  // ✅ Load current player data to show pontos_da_temporada
  useEffect(() => {
    if (!playerId || playerData || playerDataLoading) return;

    const loadPlayerData = async () => {
      try {
        setPlayerDataLoading(true);
        const currentPlayerData = await funifierPlayerService.getPlayerStatus(playerId);
        setPlayerData(currentPlayerData);
        console.log('✅ Current player data loaded for history view');
      } catch (error) {
        console.error('❌ Error loading current player data:', error);
        // Don't set error state for player data - it's supplementary information
      } finally {
        setPlayerDataLoading(false);
      }
    };

    loadPlayerData();
  }, [playerId, playerData, playerDataLoading]);

  // ✅ Reset when playerId changes
  useEffect(() => {
    setHasLoaded(false);
    setCycles([]);
    setExpandedCycle(null);
    setPlayerData(null);
    setPlayerDataLoading(false);
  }, [playerId]);

  const handleCycleToggle = (cycleNumber: number) => {
    setExpandedCycle(expandedCycle === cycleNumber ? null : cycleNumber);
  };

  const handleRetry = useCallback(async () => {
    setHasLoaded(false);
    setError(null);
    setPlayerData(null);
    setPlayerDataLoading(false);
    // The useEffect will automatically trigger when hasLoaded becomes false
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl p-4 md:p-6 shadow-lg mb-6">
          {/* Mobile-first layout: Stack vertically on small screens */}
          <div className="space-y-4">
            {/* Back Button and Title Row */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-3">
                {/* Back Button - Responsive sizing */}
                <button
                  onClick={() => {
                    if (onBack) {
                      onBack();
                    } else {
                      // Default back behavior - go to dashboard
                      window.location.href = '/dashboard';
                    }
                  }}
                  className="flex items-center px-3 py-2 md:px-4 md:py-2 bg-boticario-pink hover:bg-boticario-purple text-white rounded-lg transition-colors shadow-md hover:shadow-lg text-sm md:text-base"
                >
                  <svg className="w-4 h-4 mr-1 md:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span className="hidden sm:inline">Voltar ao Dashboard</span>
                  <span className="sm:hidden">Voltar</span>
                </button>
                
                <div className="min-w-0 flex-1">
                  <h1 className="text-lg md:text-2xl font-bold text-gray-800 truncate">📈 Histórico de Ciclos</h1>
                  {playerName && (
                    <p className="text-gray-600 mt-1 text-sm md:text-base truncate">Jogador: {playerName}</p>
                  )}
                </div>
              </div>
              
              {/* Logout Button */}
              <button
                onClick={logout}
                className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Sair do sistema"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="font-medium hidden sm:inline">Sair</span>
              </button>
            </div>
            
            {/* Current Player Points Information - Mobile Responsive */}
            {playerData && (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-3 md:p-4 border border-purple-200 w-full">
                <h3 className="text-xs md:text-sm font-semibold text-gray-700 mb-3">💰 Pontuação Atual</h3>
                
                {/* Mobile: Stack vertically, Desktop: Grid */}
                <div className="space-y-3 md:space-y-0 md:grid md:grid-cols-2 md:gap-4">
                  <div className="min-w-0">
                    <div className="text-gray-600 text-xs md:text-sm mb-1">Pontos da Temporada:</div>
                    <div className="font-bold text-purple-600 text-sm md:text-lg break-all">
                      {playerData.point_categories?.pontos_da_temporada?.toLocaleString('pt-BR') || '0'}
                    </div>
                  </div>
                  <div className="min-w-0">
                    <div className="text-gray-600 text-xs md:text-sm mb-1">Pontos Bloqueados:</div>
                    <div className="font-bold text-orange-600 text-sm md:text-lg break-all">
                      {playerData.point_categories?.locked_points?.toLocaleString('pt-BR') || '0'}
                    </div>
                  </div>
                </div>
                
                <div className="mt-3 pt-2 border-t border-purple-200">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                    <span className="text-gray-600 text-xs md:text-sm">Total Acumulado:</span>
                    <span className="font-semibold text-gray-800 text-sm md:text-base break-all">
                      {playerData.total_points?.toLocaleString('pt-BR') || '0'}
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Loading state for player data - Mobile Responsive */}
            {playerDataLoading && (
              <div className="bg-gray-50 rounded-lg p-3 md:p-4 border border-gray-200 w-full">
                <div className="animate-pulse">
                  <div className="h-3 md:h-4 bg-gray-200 rounded w-24 md:w-32 mb-3"></div>
                  <div className="space-y-3 md:space-y-0 md:grid md:grid-cols-2 md:gap-4">
                    <div>
                      <div className="h-3 bg-gray-200 rounded w-20 md:w-24 mb-1"></div>
                      <div className="h-4 md:h-6 bg-gray-200 rounded w-16 md:w-20"></div>
                    </div>
                    <div>
                      <div className="h-3 bg-gray-200 rounded w-20 md:w-24 mb-1"></div>
                      <div className="h-4 md:h-6 bg-gray-200 rounded w-16 md:w-20"></div>
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-gray-200">
                    <div className="h-3 bg-gray-200 rounded w-32 md:w-40"></div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {!isLoading && !error && cycles.length > 0 && (
            <div className="mt-4 text-sm text-gray-500">
              {cycles.length} ciclo{cycles.length !== 1 ? 's' : ''} encontrado{cycles.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        <LoadingState
          isLoading={isLoading}
          error={error}
          isEmpty={cycles.length === 0 && hasLoaded}
          emptyMessage="Nenhum histórico de ciclos encontrado para este jogador"
          loadingMessage="Carregando histórico..."
          onRetry={handleRetry}
          className="min-h-[400px]"
        >
          <div className="space-y-4">
            {cycles.map((cycle) => (
              <CycleHistoryCard
                key={cycle.cycleNumber}
                cycle={cycle}
                isExpanded={expandedCycle === cycle.cycleNumber}
                onClick={() => handleCycleToggle(cycle.cycleNumber)}
                playerId={playerId}
              />
            ))}
          </div>
        </LoadingState>

        {/* Loading skeleton */}
        {isLoading && (
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
  isExpanded: boolean;
  onClick: () => void;
  playerId: string;
}

const CycleHistoryCard: React.FC<CycleHistoryCardProps> = ({ cycle, isExpanded, onClick, playerId }) => {
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
    <div className="bg-white rounded-2xl p-4 md:p-6 shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-200 hover:border-blue-300">
      {/* Main Card Content - Clickable */}
      <div
        className="cursor-pointer"
        onClick={onClick}
      >
        {/* Mobile: Stack vertically, Desktop: Horizontal layout */}
        <div className="space-y-4 md:space-y-0 md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            {/* Mobile: Stack cycle info and dates, Desktop: Side by side */}
            <div className="space-y-3 md:space-y-0 md:flex md:items-start md:space-x-4">
              {/* Cycle Number and Days */}
              <div className="text-center md:text-left flex-shrink-0">
                <div className="text-xl md:text-2xl font-bold text-purple-600">
                  Ciclo {cycle.cycleNumber}
                </div>
                <div className="text-xs md:text-sm text-gray-500">
                  {cycle.totalDays} dias
                </div>
              </div>
              
              {/* Dates and Goals */}
              <div className="flex-1 min-w-0 space-y-3">
                {/* Dates - Mobile: Stack, Desktop: Grid */}
                <div className="space-y-1 md:space-y-0 md:grid md:grid-cols-2 md:gap-4 text-xs md:text-sm">
                  <div className="truncate">
                    <span className="text-gray-500">Início:</span>
                    <span className="ml-1 font-medium">
                      {formatDate(cycle.startDate)}
                    </span>
                  </div>
                  <div className="truncate">
                    <span className="text-gray-500">Fim:</span>
                    <span className="ml-1 font-medium">
                      {formatDate(cycle.endDate)}
                    </span>
                  </div>
                </div>
                
                {/* Goals - Mobile: Stack, Desktop: Grid */}
                <div className="space-y-2 md:space-y-0 md:grid md:grid-cols-3 md:gap-4 text-xs md:text-sm">
                  <div className="min-w-0">
                    <div className="text-gray-500 truncate">Meta Principal:</div>
                    <div className="font-semibold text-purple-600">
                      {cycle.finalMetrics.primaryGoal.percentage.toFixed(1)}%
                    </div>
                  </div>
                  <div className="min-w-0">
                    <div className="text-gray-500 truncate">Meta Secundária 1:</div>
                    <div className="font-semibold text-green-600">
                      {cycle.finalMetrics.secondaryGoal1.percentage.toFixed(1)}%
                      {cycle.finalMetrics.secondaryGoal1.boostActive && (
                        <span className="ml-1 text-green-600">🚀</span>
                      )}
                    </div>
                  </div>
                  <div className="min-w-0">
                    <div className="text-gray-500 truncate">Meta Secundária 2:</div>
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
          
          {/* Performance Badge and Arrow */}
          <div className="flex items-center justify-between md:justify-end md:space-x-4">
            <div className="text-center">
              <div className={`px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-medium ${performanceColorClass}`}>
                {overallPerformance}%
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Performance
              </div>
            </div>
            
            <div className={`text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''} ml-2 md:ml-0`}>
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
        
        {/* Progress Timeline Preview */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="text-xs text-gray-500 mb-2">
            Evolução ({cycle.progressTimeline.length} pontos)
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(overallPerformance, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* ✅ Accordion Content - Simple timeline display */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-200 animate-in slide-in-from-top duration-200">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">
            📊 Relatórios do Ciclo {cycle.cycleNumber}
          </h4>
          
          {cycle.progressTimeline.length > 0 ? (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {cycle.progressTimeline.map((point, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-semibold">
                      {point.dayInCycle}
                    </div>
                    <div>
                      <div className="font-medium text-gray-700">
                        Dia {point.dayInCycle} do ciclo
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDate(point.date)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-4 text-xs">
                    <div className="text-center">
                      <div className="text-purple-600 font-semibold">
                        {point.metrics.primaryGoal?.toFixed(1) || '0.0'}%
                      </div>
                      <div className="text-gray-500">Meta 1</div>
                    </div>
                    <div className="text-center">
                      <div className="text-green-600 font-semibold">
                        {point.metrics.secondaryGoal1?.toFixed(1) || '0.0'}%
                      </div>
                      <div className="text-gray-500">Meta 2</div>
                    </div>
                    <div className="text-center">
                      <div className="text-blue-600 font-semibold">
                        {point.metrics.secondaryGoal2?.toFixed(1) || '0.0'}%
                      </div>
                      <div className="text-gray-500">Meta 3</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <div className="text-2xl mb-2">📋</div>
              <div>Nenhum relatório encontrado para este ciclo</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const CycleHistoryCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl p-4 md:p-6 shadow-lg border border-gray-200">
      <div className="animate-pulse">
        {/* Mobile: Stack vertically, Desktop: Horizontal layout */}
        <div className="space-y-4 md:space-y-0 md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <div className="space-y-3 md:space-y-0 md:flex md:items-start md:space-x-4">
              {/* Cycle info */}
              <div className="text-center md:text-left flex-shrink-0">
                <Skeleton className="h-6 md:h-8 w-16 mb-2 mx-auto md:mx-0" />
                <Skeleton className="h-3 md:h-4 w-12 mx-auto md:mx-0" />
              </div>
              
              {/* Dates and goals */}
              <div className="flex-1 min-w-0 space-y-3">
                {/* Dates */}
                <div className="space-y-1 md:space-y-0 md:grid md:grid-cols-2 md:gap-4">
                  <div>
                    <Skeleton className="h-3 md:h-4 w-16 md:w-20 mb-1" />
                    <Skeleton className="h-3 md:h-4 w-20 md:w-24" />
                  </div>
                  <div>
                    <Skeleton className="h-3 md:h-4 w-12 md:w-16 mb-1" />
                    <Skeleton className="h-3 md:h-4 w-20 md:w-24" />
                  </div>
                </div>
                
                {/* Goals */}
                <div className="space-y-2 md:space-y-0 md:grid md:grid-cols-3 md:gap-4">
                  <div>
                    <Skeleton className="h-3 md:h-4 w-16 md:w-20 mb-1" />
                    <Skeleton className="h-4 md:h-5 w-10 md:w-12" />
                  </div>
                  <div>
                    <Skeleton className="h-3 md:h-4 w-20 md:w-24 mb-1" />
                    <Skeleton className="h-4 md:h-5 w-10 md:w-12" />
                  </div>
                  <div>
                    <Skeleton className="h-3 md:h-4 w-20 md:w-24 mb-1" />
                    <Skeleton className="h-4 md:h-5 w-10 md:w-12" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Performance and arrow */}
          <div className="flex items-center justify-between md:justify-end md:space-x-4">
            <div className="text-center">
              <Skeleton className="h-5 md:h-6 w-10 md:w-12 rounded-full mb-1" />
              <Skeleton className="h-3 w-12 md:w-16" />
            </div>
            <Skeleton className="h-4 w-4 md:h-5 md:w-5" />
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <Skeleton className="h-3 w-24 md:w-32 mb-2" />
          <Skeleton className="h-2 w-full rounded-full" />
        </div>
      </div>
    </div>
  );
};