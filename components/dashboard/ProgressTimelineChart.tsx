'use client';

import React, { useState } from 'react';
import { ProgressDataPoint, CycleHistoryData } from '../../types';
import { PrecisionMath } from '../../utils/precision-math';

interface ProgressTimelineChartProps {
  data: ProgressDataPoint[];
  cycleData: CycleHistoryData;
  metricConfigurations?: Record<string, { name: string; color: string; emoji: string }>;
}

export const ProgressTimelineChart: React.FC<ProgressTimelineChartProps> = ({
  data,
  cycleData,
  metricConfigurations
}) => {
  const [selectedMetric, setSelectedMetric] = useState<string>('all');
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  // Get available metrics from the data
  const availableMetrics = data.length > 0 ? Object.keys(data[0].metrics) : [];
  
  // Metric configurations - use provided configurations or defaults
  const defaultMetricConfig = {
    atividade: { name: 'Atividade', color: '#8B5CF6', emoji: '🎯' },
    reaisPorAtivo: { name: 'Reais por Ativo', color: '#10B981', emoji: '💰' },
    faturamento: { name: 'Faturamento', color: '#F59E0B', emoji: '📈' },
    multimarcasPorAtivo: { name: 'Multimarcas por Ativo', color: '#EF4444', emoji: '🏷️' },
    conversoes: { name: 'Conversões', color: '#6366F1', emoji: '🔄' },
    upa: { name: 'UPA', color: '#EC4899', emoji: '📊' }
  };
  
  const metricConfig = metricConfigurations || defaultMetricConfig;

  // Calculate chart dimensions and scales
  const chartWidth = 800;
  const chartHeight = 400;
  const padding = { top: 20, right: 20, bottom: 60, left: 60 };
  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;

  // Find min/max values for scaling
  const allValues = data.flatMap(point => Object.values(point.metrics));
  const minValue = Math.min(0, ...allValues);
  const maxValue = Math.max(100, ...allValues);

  // Scale functions
  const xScale = (index: number) => (index / Math.max(1, data.length - 1)) * plotWidth;
  const yScale = (value: number) => plotHeight - ((value - minValue) / (maxValue - minValue)) * plotHeight;

  // Generate SVG path for a metric
  const generatePath = (metricName: string) => {
    if (data.length === 0) return '';
    
    const points = data.map((point, index) => {
      const x = xScale(index);
      const y = yScale(point.metrics[metricName] || 0);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
    
    return points;
  };

  // Generate grid lines
  const gridLines = [];
  for (let i = 0; i <= 10; i++) {
    const y = (i / 10) * plotHeight;
    const value = maxValue - (i / 10) * (maxValue - minValue);
    gridLines.push(
      <g key={i}>
        <line
          x1={0}
          y1={y}
          x2={plotWidth}
          y2={y}
          stroke="#E5E7EB"
          strokeWidth={1}
          strokeDasharray={i % 2 === 0 ? "none" : "2,2"}
        />
        <text
          x={-10}
          y={y + 4}
          textAnchor="end"
          fontSize="12"
          fill="#6B7280"
        >
          {Math.round(value)}%
        </text>
      </g>
    );
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit'
    });
  };

  return (
    <div className="space-y-4">
      {/* Metric Selector */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedMetric('all')}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            selectedMetric === 'all'
              ? 'bg-boticario-purple text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          📊 Todas as Métricas
        </button>
        {availableMetrics.map(metric => {
          const config = metricConfig[metric as keyof typeof metricConfig];
          if (!config) return null;
          
          return (
            <button
              key={metric}
              onClick={() => setSelectedMetric(metric)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedMetric === metric
                  ? 'bg-boticario-purple text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {config.emoji} {config.name}
            </button>
          );
        })}
      </div>

      {/* Chart Container */}
      <div className="relative bg-gray-50 rounded-lg p-4 overflow-x-auto">
        <svg
          width={chartWidth}
          height={chartHeight}
          className="mx-auto"
          style={{ minWidth: '600px' }}
        >
          {/* Chart background */}
          <rect
            x={padding.left}
            y={padding.top}
            width={plotWidth}
            height={plotHeight}
            fill="white"
            stroke="#E5E7EB"
            strokeWidth={1}
          />
          
          {/* Grid lines */}
          <g transform={`translate(${padding.left}, ${padding.top})`}>
            {gridLines}
          </g>
          
          {/* Chart content */}
          <g transform={`translate(${padding.left}, ${padding.top})`}>
            {/* Render lines based on selected metric */}
            {selectedMetric === 'all' ? (
              // Render all metrics
              availableMetrics.map(metric => {
                const config = metricConfig[metric as keyof typeof metricConfig];
                if (!config) return null;
                
                return (
                  <g key={metric}>
                    <path
                      d={generatePath(metric)}
                      fill="none"
                      stroke={config.color}
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {/* Data points */}
                    {data.map((point, index) => (
                      <circle
                        key={`${metric}-${index}`}
                        cx={xScale(index)}
                        cy={yScale(point.metrics[metric] || 0)}
                        r={4}
                        fill={config.color}
                        stroke="white"
                        strokeWidth={2}
                        className="cursor-pointer hover:r-6 transition-all"
                        onMouseEnter={() => setHoveredPoint(index)}
                        onMouseLeave={() => setHoveredPoint(null)}
                      />
                    ))}
                  </g>
                );
              })
            ) : (
              // Render single metric
              (() => {
                const config = metricConfig[selectedMetric as keyof typeof metricConfig];
                if (!config) return null;
                
                return (
                  <g>
                    <path
                      d={generatePath(selectedMetric)}
                      fill="none"
                      stroke={config.color}
                      strokeWidth={3}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {/* Data points */}
                    {data.map((point, index) => (
                      <circle
                        key={index}
                        cx={xScale(index)}
                        cy={yScale(point.metrics[selectedMetric] || 0)}
                        r={5}
                        fill={config.color}
                        stroke="white"
                        strokeWidth={2}
                        className="cursor-pointer hover:r-7 transition-all"
                        onMouseEnter={() => setHoveredPoint(index)}
                        onMouseLeave={() => setHoveredPoint(null)}
                      />
                    ))}
                  </g>
                );
              })()
            )}
            
            {/* X-axis labels */}
            {data.map((point, index) => (
              <g key={`x-label-${index}`}>
                <line
                  x1={xScale(index)}
                  y1={plotHeight}
                  x2={xScale(index)}
                  y2={plotHeight + 5}
                  stroke="#6B7280"
                  strokeWidth={1}
                />
                <text
                  x={xScale(index)}
                  y={plotHeight + 20}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#6B7280"
                  transform={`rotate(-45, ${xScale(index)}, ${plotHeight + 20})`}
                >
                  {formatDate(point.date)}
                </text>
                <text
                  x={xScale(index)}
                  y={plotHeight + 35}
                  textAnchor="middle"
                  fontSize="9"
                  fill="#9CA3AF"
                >
                  Dia {point.dayInCycle}
                </text>
              </g>
            ))}
          </g>
          
          {/* Y-axis label */}
          <text
            x={20}
            y={chartHeight / 2}
            textAnchor="middle"
            fontSize="12"
            fill="#6B7280"
            transform={`rotate(-90, 20, ${chartHeight / 2})`}
          >
            Percentual (%)
          </text>
          
          {/* X-axis label */}
          <text
            x={chartWidth / 2}
            y={chartHeight - 10}
            textAnchor="middle"
            fontSize="12"
            fill="#6B7280"
          >
            Evolução do Ciclo
          </text>
        </svg>
        
        {/* Tooltip */}
        {hoveredPoint !== null && (
          <div className="absolute bg-gray-800 text-white p-3 rounded-lg shadow-lg pointer-events-none z-10"
               style={{
                 left: `${padding.left + xScale(hoveredPoint) + 10}px`,
                 top: `${padding.top + 10}px`
               }}>
            <div className="text-sm font-medium mb-1">
              {formatDate(data[hoveredPoint].date)} - Dia {data[hoveredPoint].dayInCycle}
            </div>
            {selectedMetric === 'all' ? (
              <div className="space-y-1">
                {availableMetrics.map(metric => {
                  const config = metricConfig[metric as keyof typeof metricConfig];
                  if (!config) return null;
                  
                  const value = data[hoveredPoint].metrics[metric] || 0;
                  return (
                    <div key={metric} className="flex items-center space-x-2 text-xs">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: config.color }}
                      />
                      <span>{config.name}:</span>
                      <span className="font-medium">
                        {PrecisionMath.fixExistingPercentage(value).displayValue}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-sm">
                {metricConfig[selectedMetric as keyof typeof metricConfig]?.name}: {' '}
                <span className="font-medium">
                  {PrecisionMath.fixExistingPercentage(data[hoveredPoint].metrics[selectedMetric] || 0).displayValue}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      {selectedMetric === 'all' && (
        <div className="flex flex-wrap gap-4 justify-center">
          {availableMetrics.map(metric => {
            const config = metricConfig[metric as keyof typeof metricConfig];
            if (!config) return null;
            
            return (
              <div key={metric} className="flex items-center space-x-2">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: config.color }}
                />
                <span className="text-sm text-gray-700">
                  {config.emoji} {config.name}
                </span>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Chart Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-800 mb-2">📋 Resumo do Gráfico</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Pontos de Dados:</span>
            <span className="ml-1 font-medium">{data.length}</span>
          </div>
          <div>
            <span className="text-gray-600">Período:</span>
            <span className="ml-1 font-medium">
              {data.length > 0 && `${formatDate(data[0].date)} - ${formatDate(data[data.length - 1].date)}`}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Duração do Ciclo:</span>
            <span className="ml-1 font-medium">{cycleData.totalDays} dias</span>
          </div>
        </div>
      </div>
    </div>
  );
};