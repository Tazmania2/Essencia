'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { CycleHistoryData, FunifierPlayerStatus } from '../../types';
import { historyService } from '../../services/history.service';
import { funifierPlayerService } from '../../services/funifier-player.service';
import { LoadingState, Skeleton } from '../ui/LoadingSpinner';

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
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Back Button - Always visible */}
              <button
                onClick={() => {
                  if (onBack) {
                    onBack();
                  } else {
                    // Default back behavior - go to dashboard
                    window.location.href = '/dashboard';
                  }
                }}
                className="flex items-center px-4 py-2 bg-boticario-pink hover:bg-boticario-purple text-white rounded-lg transition-colors shadow-md hover:shadow-lg"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Voltar ao Dashboard
              </button>
              
              <div>
                <h1 className="text-2xl font-bold text-gray-800">📈 Histórico de Ciclos</h1>
                {playerName && (
                  <p className="text-gray-600 mt-1">Jogador: {playerName}</p>
                )}
              </div>
            </div>
            
            {/* Current Player Points Information */}
            {playerData && (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">💰 Pontuação Atual</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Pontos da Temporada:</span>
                    <div className="font-bold text-purple-600 text-lg">
                      {playerData.point_categories?.pontos_da_temporada?.toLocaleString('pt-BR') || '0'}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Pontos Bloqueados:</span>
                    <div className="font-bold text-orange-600 text-lg">
                      {playerData.point_categories?.locked_points?.toLocaleString('pt-BR') || '0'}
                    </div>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-purple-200">
                  <span className="text-gray-600 text-xs">Total Acumulado:</span>
                  <span className="ml-2 font-semibold text-gray-800">
                    {playerData.total_points?.toLocaleString('pt-BR') || '0'}
                  </span>
                </div>
              </div>
            )}
            
            {/* Loading state for player data */}
            {playerDataLoading && (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="h-3 bg-gray-200 rounded w-24 mb-1"></div>
                      <div className="h-6 bg-gray-200 rounded w-20"></div>
                    </div>
                    <div>
                      <div className="h-3 bg-gray-200 rounded w-24 mb-1"></div>
                      <div className="h-6 bg-gray-200 rounded w-20"></div>
                    </div>
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
    <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-200 hover:border-blue-300">
      {/* Main Card Content - Clickable */}
      <div
        className="cursor-pointer"
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
            
            <div className={`text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>
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