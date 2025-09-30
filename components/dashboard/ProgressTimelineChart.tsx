'use client';

import React, { useMemo } from 'react';
import { ProgressDataPoint, CycleHistoryData } from '../../types';

interface ProgressTimelineChartProps {
  data: ProgressDataPoint[];
  cycleData: CycleHistoryData;
  height?: number;
}

export const ProgressTimelineChart: React.FC<ProgressTimelineChartProps> = ({
  data,
  cycleData,
  height = 400
}) => {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        points: [],
        maxValue: 100,
        minValue: 0
      };
    }

    // Sort data by upload sequence to ensure chronological order
    const sortedData = [...data].sort((a, b) => a.uploadSequence - b.uploadSequence);

    // Extract metric values for each data point
    const points = sortedData.map((point, index) => {
      const metrics = point.metrics || {};
      
      return {
        x: index,
        date: point.date,
        dayInCycle: point.dayInCycle,
        uploadSequence: point.uploadSequence,
        primaryGoal: metrics[cycleData.finalMetrics.primaryGoal.name] || 0,
        secondaryGoal1: metrics[cycleData.finalMetrics.secondaryGoal1.name] || 0,
        secondaryGoal2: metrics[cycleData.finalMetrics.secondaryGoal2.name] || 0
      };
    });

    // Calculate min and max values for scaling
    const allValues = points.flatMap(p => [p.primaryGoal, p.secondaryGoal1, p.secondaryGoal2]);
    const maxValue = Math.max(100, Math.max(...allValues) * 1.1);
    const minValue = Math.min(0, Math.min(...allValues));

    return {
      points,
      maxValue,
      minValue
    };
  }, [data, cycleData]);

  const { points, maxValue, minValue } = chartData;

  if (points.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <div className="text-4xl mb-2">📊</div>
          <p>Nenhum dado de progresso disponível</p>
          <p className="text-sm mt-2">Os dados aparecerão aqui quando houver uploads de progresso</p>
        </div>
      </div>
    );
  }

  const chartWidth = 800;
  const chartHeight = height - 100; // Leave space for labels
  const padding = 60;
  const plotWidth = chartWidth - (padding * 2);
  const plotHeight = chartHeight - (padding * 2);

  // Scale functions
  const scaleX = (index: number) => padding + (index / (points.length - 1)) * plotWidth;
  const scaleY = (value: number) => padding + plotHeight - ((value - minValue) / (maxValue - minValue)) * plotHeight;

  // Generate path for each metric
  const generatePath = (metricKey: 'primaryGoal' | 'secondaryGoal1' | 'secondaryGoal2') => {
    if (points.length === 0) return '';
    
    const pathData = points.map((point, index) => {
      const x = scaleX(index);
      const y = scaleY(point[metricKey]);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
    
    return pathData;
  };

  // Generate grid lines
  const gridLines = [];
  const numHorizontalLines = 5;
  const numVerticalLines = Math.min(points.length, 10);

  // Horizontal grid lines
  for (let i = 0; i <= numHorizontalLines; i++) {
    const y = padding + (i / numHorizontalLines) * plotHeight;
    const value = maxValue - (i / numHorizontalLines) * (maxValue - minValue);
    gridLines.push(
      <g key={`h-${i}`}>
        <line
          x1={padding}
          y1={y}
          x2={chartWidth - padding}
          y2={y}
          stroke="#e5e7eb"
          strokeWidth={1}
        />
        <text
          x={padding - 10}
          y={y + 4}
          textAnchor="end"
          className="text-xs fill-gray-500"
        >
          {value.toFixed(0)}%
        </text>
      </g>
    );
  }

  // Vertical grid lines
  for (let i = 0; i < numVerticalLines; i++) {
    const pointIndex = Math.floor((i / (numVerticalLines - 1)) * (points.length - 1));
    const x = scaleX(pointIndex);
    const point = points[pointIndex];
    
    if (point) {
      gridLines.push(
        <g key={`v-${i}`}>
          <line
            x1={x}
            y1={padding}
            x2={x}
            y2={chartHeight - padding}
            stroke="#e5e7eb"
            strokeWidth={1}
          />
          <text
            x={x}
            y={chartHeight - padding + 20}
            textAnchor="middle"
            className="text-xs fill-gray-500"
          >
            Dia {point.dayInCycle}
          </text>
        </g>
      );
    }
  }

  return (
    <div className="w-full">
      {/* Legend */}
      <div className="flex justify-center space-x-6 mb-4">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span className="text-sm text-gray-700">Meta Principal</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span className="text-sm text-gray-700">Meta Secundária 1</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-purple-500 rounded"></div>
          <span className="text-sm text-gray-700">Meta Secundária 2</span>
        </div>
      </div>

      {/* Chart */}
      <div className="overflow-x-auto">
        <svg width={chartWidth} height={height} className="border border-gray-200 rounded-lg bg-white">
          {/* Grid lines */}
          {gridLines}
          
          {/* Chart lines */}
          <path
            d={generatePath('primaryGoal')}
            fill="none"
            stroke="#3b82f6"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={generatePath('secondaryGoal1')}
            fill="none"
            stroke="#10b981"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={generatePath('secondaryGoal2')}
            fill="none"
            stroke="#8b5cf6"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Data points */}
          {points.map((point, index) => (
            <g key={index}>
              {/* Primary goal point */}
              <circle
                cx={scaleX(index)}
                cy={scaleY(point.primaryGoal)}
                r={4}
                fill="#3b82f6"
                className="hover:r-6 transition-all cursor-pointer"
              >
                <title>
                  Dia {point.dayInCycle}: {point.primaryGoal.toFixed(1)}%
                  {'\n'}Data: {new Date(point.date).toLocaleDateString('pt-BR')}
                </title>
              </circle>
              
              {/* Secondary goal 1 point */}
              <circle
                cx={scaleX(index)}
                cy={scaleY(point.secondaryGoal1)}
                r={4}
                fill="#10b981"
                className="hover:r-6 transition-all cursor-pointer"
              >
                <title>
                  Dia {point.dayInCycle}: {point.secondaryGoal1.toFixed(1)}%
                  {'\n'}Data: {new Date(point.date).toLocaleDateString('pt-BR')}
                </title>
              </circle>
              
              {/* Secondary goal 2 point */}
              <circle
                cx={scaleX(index)}
                cy={scaleY(point.secondaryGoal2)}
                r={4}
                fill="#8b5cf6"
                className="hover:r-6 transition-all cursor-pointer"
              >
                <title>
                  Dia {point.dayInCycle}: {point.secondaryGoal2.toFixed(1)}%
                  {'\n'}Data: {new Date(point.date).toLocaleDateString('pt-BR')}
                </title>
              </circle>
              
              {/* Boost indicators */}
              {cycleData.finalMetrics.secondaryGoal1.boostActive && point.secondaryGoal1 >= 100 && (
                <text
                  x={scaleX(index)}
                  y={scaleY(point.secondaryGoal1) - 15}
                  textAnchor="middle"
                  className="text-xs fill-green-600"
                >
                  🚀
                </text>
              )}
              {cycleData.finalMetrics.secondaryGoal2.boostActive && point.secondaryGoal2 >= 100 && (
                <text
                  x={scaleX(index)}
                  y={scaleY(point.secondaryGoal2) - 15}
                  textAnchor="middle"
                  className="text-xs fill-purple-600"
                >
                  🚀
                </text>
              )}
            </g>
          ))}
          
          {/* 100% reference line */}
          <line
            x1={padding}
            y1={scaleY(100)}
            x2={chartWidth - padding}
            y2={scaleY(100)}
            stroke="#ef4444"
            strokeWidth={2}
            strokeDasharray="5,5"
            opacity={0.7}
          />
          <text
            x={chartWidth - padding - 5}
            y={scaleY(100) - 5}
            textAnchor="end"
            className="text-xs fill-red-500 font-medium"
          >
            Meta (100%)
          </text>
          
          {/* Axis labels */}
          <text
            x={chartWidth / 2}
            y={height - 10}
            textAnchor="middle"
            className="text-sm fill-gray-700 font-medium"
          >
            Dias do Ciclo
          </text>
          <text
            x={20}
            y={height / 2}
            textAnchor="middle"
            transform={`rotate(-90, 20, ${height / 2})`}
            className="text-sm fill-gray-700 font-medium"
          >
            Percentual de Progresso (%)
          </text>
        </svg>
      </div>

      {/* Summary stats */}
      <div className="mt-4 grid grid-cols-3 gap-4 text-center">
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="text-lg font-semibold text-blue-600">
            {cycleData.finalMetrics.primaryGoal.percentage.toFixed(1)}%
          </div>
          <div className="text-sm text-blue-700">Meta Principal Final</div>
        </div>
        <div className="bg-green-50 p-3 rounded-lg">
          <div className="text-lg font-semibold text-green-600">
            {cycleData.finalMetrics.secondaryGoal1.percentage.toFixed(1)}%
          </div>
          <div className="text-sm text-green-700">Meta Secundária 1 Final</div>
        </div>
        <div className="bg-purple-50 p-3 rounded-lg">
          <div className="text-lg font-semibold text-purple-600">
            {cycleData.finalMetrics.secondaryGoal2.percentage.toFixed(1)}%
          </div>
          <div className="text-sm text-purple-700">Meta Secundária 2 Final</div>
        </div>
      </div>
    </div>
  );
};