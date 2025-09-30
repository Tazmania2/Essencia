'use client';

import React, { useState, useEffect } from 'react';
import { CycleHistoryData } from '../../types';
import { historyService } from '../../services';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { ErrorNotification } from '../error/ErrorNotification';
import { CycleDetailsView } from './CycleDetailsView';
import { CompatibilityIndicatorComponent } from '../compatibility/CompatibilityIndicator';
import { MixedDataIndicator } from '../compatibility/CompatibilityWarning';
import { MixedDataResult } from '../../utils/backward-compatibility';

interface CycleHistoryDashboardProps {
  playerId: string;
  playerName: string;
  onBack?: () => void;
}

export const CycleHistoryDashboard: React.FC<CycleHistoryDashboardProps> = ({
  playerId,
  playerName,
  onBack
}) => {
  const [cycles, setCycles] = useState<CycleHistoryData[]>([]);
  const [selectedCycle, setSelectedCycle] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [compatibilityResult, setCompatibilityResult] = useState<MixedDataResult<CycleHistoryData[]> | null>(null);

  useEffect(() => {
    loadCycleHistory();
  }, [playerId]);

  const loadCycleHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use the backward compatibility method
      const result = await historyService.getPlayerCycleHistoryWithCompatibility(playerId);
      setCompatibilityResult(result);
      setCycles(result.data);
      
      if (result.data.length === 0) {
        if (result.warnings.length > 0) {
          setError(`Nenhum histórico de ciclos encontrado. ${result.warnings.join(' ')}`);
        } else {
          setError('Nenhum histórico de ciclos encontrado para este jogador.');
        }
      }
    } catch (err) {
      console.error('Failed to load cycle history:', err);
      setError('Erro ao carregar histórico de ciclos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCycleSelect = (cycleNumber: number) => {
    setSelectedCycle(cycleNumber);
  };

  const handleBackToCycles = () => {
    setSelectedCycle(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getOverallPerformance = (cycle: CycleHistoryData) => {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <div className="flex items-center justify-center">
              <LoadingSpinner size="lg" />
              <span className="ml-3 text-lg text-gray-600">Carregando histórico...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (selectedCycle !== null) {
    const cycleData = cycles.find(c => c.cycleNumber === selectedCycle);
    if (cycleData) {
      return (
        <CycleDetailsView
          cycleData={cycleData}
          playerId={playerId}
          playerName={playerName}
          onBack={handleBackToCycles}
        />
      );
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">📈 Histórico de Ciclos</h1>
              <p className="text-gray-600 mt-1">Jogador: {playerName}</p>
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
          
          {/* Compatibility indicators */}
          {compatibilityResult && (
            <div className="mt-4 space-y-3">
              <CompatibilityIndicatorComponent
                compatibility={compatibilityResult.compatibility}
                context="history"
                showDetails={false}
              />
              
              {compatibilityResult.warnings.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-yellow-800 mb-2">Avisos de Compatibilidade:</h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    {compatibilityResult.warnings.map((warning, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="text-yellow-500 mt-0.5">•</span>
                        <span>{warning}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Error State */}
        {error && (
          <ErrorNotification
            message={error}
            onDismiss={() => setError(null)}
          />
        )}

        {/* Cycles List */}
        {cycles.length > 0 && (
          <div className="space-y-4">
            {cycles.map((cycle) => {
              const overallPerformance = getOverallPerformance(cycle);
              const performanceColorClass = getPerformanceColor(overallPerformance);
              
              return (
                <div
                  key={cycle.cycleNumber}
                  className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
                  onClick={() => handleCycleSelect(cycle.cycleNumber)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-boticario-purple">
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
                              <div className="font-semibold text-boticario-purple">
                                {cycle.finalMetrics.primaryGoal.percentage.toFixed(1)}%
                              </div>
                            </div>
                            <div>
                              <span className="text-gray-500">Meta Secundária 1:</span>
                              <div className="font-semibold text-boticario-purple">
                                {cycle.finalMetrics.secondaryGoal1.percentage.toFixed(1)}%
                                {cycle.finalMetrics.secondaryGoal1.boostActive && (
                                  <span className="ml-1 text-green-600">🚀</span>
                                )}
                              </div>
                            </div>
                            <div>
                              <span className="text-gray-500">Meta Secundária 2:</span>
                              <div className="font-semibold text-boticario-purple">
                                {cycle.finalMetrics.secondaryGoal2.percentage.toFixed(1)}%
                                {cycle.finalMetrics.secondaryGoal2.boostActive && (
                                  <span className="ml-1 text-green-600">🚀</span>
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
                        →
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
                        className="h-full bg-gradient-to-r from-boticario-purple to-boticario-pink rounded-full"
                        style={{ width: `${Math.min(overallPerformance, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {cycles.length === 0 && !error && (
          <div className="bg-white rounded-2xl p-12 shadow-lg text-center">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Nenhum Histórico Disponível
            </h2>
            <p className="text-gray-600">
              Este jogador ainda não possui ciclos concluídos para visualização.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};