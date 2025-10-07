'use client';

import React, { useState, useEffect } from 'react';
import { CycleHistoryData, ProgressDataPoint } from '../../types';
import { historyService } from '../../services/history.service';
import { LoadingState } from '../ui/LoadingSpinner';
import { ProgressTimelineChart } from './ProgressTimelineChart';
import { useHistoryLoading } from '../../hooks/useLoadingState';
import { useNotificationHelpers } from '../ui/NotificationSystem';

interface CycleDetailsViewProps {
  cycle: CycleHistoryData;
  playerId: string;
  onBack: () => void;
}

export const CycleDetailsView: React.FC<CycleDetailsViewProps> = ({
  cycle,
  playerId,
  onBack
}) => {
  const [progressTimeline, setProgressTimeline] = useState<ProgressDataPoint[]>([]);
  const { loadingState, executeWithLoading, retry } = useHistoryLoading();
  const { notifyError } = useNotificationHelpers();

  useEffect(() => {
    const loadProgressTimeline = async () => {
      const result = await executeWithLoading(
        async () => {
          const timeline = await historyService.getCycleProgressTimeline(playerId, cycle.cycleNumber);
          return timeline;
        },
        'Carregando dados de progresso...'
      );

      if (result) {
        setProgressTimeline(result);
      } else {
        // Use the timeline from the cycle data as fallback
        setProgressTimeline(cycle.progressTimeline || []);
      }
    };

    loadProgressTimeline();
  }, [playerId, cycle.cycleNumber, executeWithLoading, cycle.progressTimeline]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getMetricColor = (metricName: string) => {
    switch (metricName) {
      case 'primaryGoal':
        return 'text-blue-600 bg-blue-100';
      case 'secondaryGoal1':
        return 'text-green-600 bg-green-100';
      case 'secondaryGoal2':
        return 'text-purple-600 bg-purple-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const handleRetry = async () => {
    await retry();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                📊 Detalhes do Ciclo {cycle.cycleNumber}
              </h1>
              <p className="text-gray-600 mt-1">
                {formatDate(cycle.startDate)} - {formatDate(cycle.endDate)} ({cycle.totalDays} dias)
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

        {/* Metrics Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <MetricCard
            title="Meta Principal"
            metric={cycle.finalMetrics.primaryGoal}
            color="blue"
          />
          <MetricCard
            title="Meta Secundária 1"
            metric={cycle.finalMetrics.secondaryGoal1}
            color="green"
          />
          <MetricCard
            title="Meta Secundária 2"
            metric={cycle.finalMetrics.secondaryGoal2}
            color="purple"
          />
        </div>

        {/* Progress Timeline Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            📈 Evolução do Progresso
          </h2>
          
          <LoadingState
            isLoading={loadingState.isLoading}
            error={loadingState.error}
            isEmpty={progressTimeline.length === 0}
            emptyMessage="Nenhum dado de progresso disponível para este ciclo"
            loadingMessage={loadingState.message || 'Carregando gráfico...'}
            onRetry={handleRetry}
            className="min-h-[400px]"
          >
            <ProgressTimelineChart
              data={progressTimeline}
              cycleData={cycle}
            />
          </LoadingState>
        </div>

        {/* Cycle Statistics */}
        <div className="mt-6 bg-white rounded-2xl p-6 shadow-lg">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            📋 Estatísticas do Ciclo
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-800">
                {cycle.totalDays}
              </div>
              <div className="text-sm text-gray-600">Dias Totais</div>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-800">
                {progressTimeline.length}
              </div>
              <div className="text-sm text-gray-600">Pontos de Dados</div>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-800">
                {cycle.completionStatus === 'completed' ? '✅' : '⏳'}
              </div>
              <div className="text-sm text-gray-600">
                {cycle.completionStatus === 'completed' ? 'Concluído' : 'Em Progresso'}
              </div>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-800">
                {[
                  cycle.finalMetrics.secondaryGoal1.boostActive,
                  cycle.finalMetrics.secondaryGoal2.boostActive
                ].filter(Boolean).length}
              </div>
              <div className="text-sm text-gray-600">Boosts Ativos</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface MetricCardProps {
  title: string;
  metric: {
    name: string;
    percentage: number;
    target: number;
    current: number;
    unit: string;
    boostActive?: boolean;
  };
  color: 'blue' | 'green' | 'purple';
}

const MetricCard: React.FC<MetricCardProps> = ({ title, metric, color }) => {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-100 border-blue-200',
    green: 'text-green-600 bg-green-100 border-green-200',
    purple: 'text-purple-600 bg-purple-100 border-purple-200'
  };

  const progressColorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600'
  };

  return (
    <div className={`bg-white rounded-2xl p-6 shadow-lg border-2 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        {metric.boostActive && (
          <span className="text-sm font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
            🚀 Boost Ativo
          </span>
        )}
      </div>
      
      <div className="space-y-3">
        <div className="text-center">
          <div className={`text-3xl font-bold ${colorClasses[color].split(' ')[0]}`}>
            {metric.percentage.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-600 capitalize">
            {metric.name.replace(/([A-Z])/g, ' $1').trim()}
          </div>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full bg-gradient-to-r ${progressColorClasses[color]} transition-all duration-300`}
            style={{ width: `${Math.min(metric.percentage, 100)}%` }}
          />
        </div>
        
        <div className="flex justify-between text-sm text-gray-600">
          <span>Atual: {metric.current.toLocaleString('pt-BR')} {metric.unit}</span>
          <span>Meta: {metric.target.toLocaleString('pt-BR')} {metric.unit}</span>
        </div>
      </div>
    </div>
  );
};