'use client';

import React, { useState, useEffect } from 'react';
import { CycleHistoryData, ProgressDataPoint } from '../../types';
import { historyService } from '../../services';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { ProgressTimelineChart } from './ProgressTimelineChart';
import { PrecisionMath } from '../../utils/precision-math';

interface CycleDetailsViewProps {
  cycleData: CycleHistoryData;
  playerId: string;
  playerName: string;
  onBack: () => void;
}

export const CycleDetailsView: React.FC<CycleDetailsViewProps> = ({
  cycleData,
  playerId,
  playerName,
  onBack
}) => {
  const [timelineData, setTimelineData] = useState<ProgressDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTimelineData();
  }, [playerId, cycleData.cycleNumber]);

  const loadTimelineData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const timeline = await historyService.getCycleProgressTimeline(
        playerId, 
        cycleData.cycleNumber
      );
      setTimelineData(timeline);
    } catch (err) {
      console.error('Failed to load timeline data:', err);
      setError('Erro ao carregar dados da linha do tempo.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatValue = (value: number, unit: string): string => {
    if (unit === 'R$') {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value);
    }
    
    if (unit === 'pontos') {
      return Math.round(value).toString();
    }
    
    return value.toFixed(1);
  };

  const getStatusColor = (percentage: number) => {
    if (percentage >= 100) return 'text-green-600 bg-green-100';
    if (percentage >= 90) return 'text-green-600 bg-green-50';
    if (percentage >= 70) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getStatusIcon = (percentage: number) => {
    if (percentage >= 100) return '🎯';
    if (percentage >= 90) return '✅';
    if (percentage >= 70) return '⚠️';
    return '❌';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                📊 Ciclo {cycleData.cycleNumber} - Detalhes
              </h1>
              <p className="text-gray-600 mt-1">
                Jogador: {playerName} | {formatDate(cycleData.startDate)} - {formatDate(cycleData.endDate)}
              </p>
            </div>
            <button
              onClick={onBack}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              ← Voltar ao Histórico
            </button>
          </div>
        </div>

        {/* Cycle Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Primary Goal */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                🎯 Meta Principal
              </h3>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(cycleData.finalMetrics.primaryGoal.percentage)}`}>
                {getStatusIcon(cycleData.finalMetrics.primaryGoal.percentage)} {PrecisionMath.fixExistingPercentage(cycleData.finalMetrics.primaryGoal.percentage).displayValue}
              </span>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-gray-600">
                <span className="font-medium">{cycleData.finalMetrics.primaryGoal.name}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500">Meta:</span>
                  <div className="font-semibold">
                    {formatValue(cycleData.finalMetrics.primaryGoal.target, cycleData.finalMetrics.primaryGoal.unit)}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Atingido:</span>
                  <div className="font-semibold">
                    {formatValue(cycleData.finalMetrics.primaryGoal.current, cycleData.finalMetrics.primaryGoal.unit)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Secondary Goal 1 */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                🎯 Meta Secundária 1
              </h3>
              <div className="flex items-center space-x-2">
                {cycleData.finalMetrics.secondaryGoal1.boostActive && (
                  <span className="text-green-600 text-sm">🚀 Boost</span>
                )}
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(cycleData.finalMetrics.secondaryGoal1.percentage)}`}>
                  {getStatusIcon(cycleData.finalMetrics.secondaryGoal1.percentage)} {PrecisionMath.fixExistingPercentage(cycleData.finalMetrics.secondaryGoal1.percentage).displayValue}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-gray-600">
                <span className="font-medium">{cycleData.finalMetrics.secondaryGoal1.name}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500">Meta:</span>
                  <div className="font-semibold">
                    {formatValue(cycleData.finalMetrics.secondaryGoal1.target, cycleData.finalMetrics.secondaryGoal1.unit)}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Atingido:</span>
                  <div className="font-semibold">
                    {formatValue(cycleData.finalMetrics.secondaryGoal1.current, cycleData.finalMetrics.secondaryGoal1.unit)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Secondary Goal 2 */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                🎯 Meta Secundária 2
              </h3>
              <div className="flex items-center space-x-2">
                {cycleData.finalMetrics.secondaryGoal2.boostActive && (
                  <span className="text-green-600 text-sm">🚀 Boost</span>
                )}
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(cycleData.finalMetrics.secondaryGoal2.percentage)}`}>
                  {getStatusIcon(cycleData.finalMetrics.secondaryGoal2.percentage)} {PrecisionMath.fixExistingPercentage(cycleData.finalMetrics.secondaryGoal2.percentage).displayValue}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-gray-600">
                <span className="font-medium">{cycleData.finalMetrics.secondaryGoal2.name}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500">Meta:</span>
                  <div className="font-semibold">
                    {formatValue(cycleData.finalMetrics.secondaryGoal2.target, cycleData.finalMetrics.secondaryGoal2.unit)}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Atingido:</span>
                  <div className="font-semibold">
                    {formatValue(cycleData.finalMetrics.secondaryGoal2.current, cycleData.finalMetrics.secondaryGoal2.unit)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cycle Information */}
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">📅 Informações do Ciclo</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-boticario-purple">
                {cycleData.totalDays}
              </div>
              <div className="text-sm text-gray-600">Dias Totais</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-boticario-purple">
                {timelineData.length}
              </div>
              <div className="text-sm text-gray-600">Uploads de Dados</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${cycleData.completionStatus === 'completed' ? 'text-green-600' : 'text-yellow-600'}`}>
                {cycleData.completionStatus === 'completed' ? '✅' : '⏳'}
              </div>
              <div className="text-sm text-gray-600">
                {cycleData.completionStatus === 'completed' ? 'Concluído' : 'Em Progresso'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-boticario-purple">
                {Math.round((
                  cycleData.finalMetrics.primaryGoal.percentage +
                  cycleData.finalMetrics.secondaryGoal1.percentage +
                  cycleData.finalMetrics.secondaryGoal2.percentage
                ) / 3)}%
              </div>
              <div className="text-sm text-gray-600">Performance Geral</div>
            </div>
          </div>
        </div>

        {/* Progress Timeline Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">📈 Evolução do Desempenho</h3>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="md" />
              <span className="ml-3 text-gray-600">Carregando gráfico...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-500 mb-2">❌ {error}</div>
              <button
                onClick={loadTimelineData}
                className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
              >
                Tentar Novamente
              </button>
            </div>
          ) : timelineData.length > 0 ? (
            <ProgressTimelineChart
              data={timelineData}
              cycleData={cycleData}
            />
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📊</div>
              <h4 className="text-lg font-semibold text-gray-800 mb-2">
                Nenhum Dado de Progresso
              </h4>
              <p className="text-gray-600">
                Não há dados de evolução disponíveis para este ciclo.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};