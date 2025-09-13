'use client';

import React, { useEffect, useState, memo } from 'react';
import { useRenderPerformance } from '../../hooks/usePerformance';

interface PerformanceMetrics {
  renderTime: number;
  renderCount: number;
  memoryUsage?: number;
  timestamp: number;
}

interface PerformanceMonitorProps {
  componentName: string;
  enabled?: boolean;
  showOverlay?: boolean;
  onMetrics?: (metrics: PerformanceMetrics) => void;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = memo(({
  componentName,
  enabled = process.env.NODE_ENV === 'development',
  showOverlay = false,
  onMetrics,
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const { renderCount } = useRenderPerformance(componentName);

  useEffect(() => {
    if (!enabled) return;

    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      const newMetric: PerformanceMetrics = {
        renderTime,
        renderCount,
        memoryUsage: (performance as any).memory?.usedJSHeapSize,
        timestamp: Date.now(),
      };

      setMetrics(prev => [...prev.slice(-9), newMetric]); // Keep last 10 metrics
      onMetrics?.(newMetric);
    };
  }, [enabled, renderCount, onMetrics]);

  if (!enabled || (!showOverlay && !isVisible)) {
    return null;
  }

  const latestMetric = metrics[metrics.length - 1];
  const averageRenderTime = metrics.length > 0 
    ? metrics.reduce((sum, m) => sum + m.renderTime, 0) / metrics.length 
    : 0;

  return (
    <>
      {/* Performance overlay toggle */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-4 right-4 z-50 bg-gray-800 text-white p-2 rounded-full shadow-lg hover:bg-gray-700 transition-colors"
        title="Toggle Performance Monitor"
      >
        📊
      </button>

      {/* Performance overlay */}
      {isVisible && (
        <div className="fixed bottom-16 right-4 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Performance Monitor</h3>
            <button
              onClick={() => setIsVisible(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Component:</span>
              <span className="font-mono">{componentName}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Renders:</span>
              <span className="font-mono">{renderCount}</span>
            </div>

            {latestMetric && (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Render:</span>
                  <span className={`font-mono ${latestMetric.renderTime > 16 ? 'text-red-600' : 'text-green-600'}`}>
                    {latestMetric.renderTime.toFixed(2)}ms
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Average:</span>
                  <span className={`font-mono ${averageRenderTime > 16 ? 'text-red-600' : 'text-green-600'}`}>
                    {averageRenderTime.toFixed(2)}ms
                  </span>
                </div>

                {latestMetric.memoryUsage && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Memory:</span>
                    <span className="font-mono">
                      {(latestMetric.memoryUsage / 1024 / 1024).toFixed(1)}MB
                    </span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Performance chart */}
          {metrics.length > 1 && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="text-xs text-gray-600 mb-2">Render Times (last 10)</div>
              <div className="flex items-end space-x-1 h-16">
                {metrics.map((metric, index) => (
                  <div
                    key={index}
                    className={`w-2 rounded-t ${
                      metric.renderTime > 16 ? 'bg-red-400' : 'bg-green-400'
                    }`}
                    style={{
                      height: `${Math.min((metric.renderTime / 50) * 100, 100)}%`,
                    }}
                    title={`${metric.renderTime.toFixed(2)}ms`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Performance tips */}
          {averageRenderTime > 16 && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="text-xs text-red-600 font-medium mb-1">
                ⚠️ Performance Warning
              </div>
              <div className="text-xs text-gray-600">
                Average render time exceeds 16ms. Consider:
                <ul className="mt-1 ml-3 list-disc">
                  <li>Using React.memo</li>
                  <li>Optimizing expensive calculations</li>
                  <li>Reducing component complexity</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
});

PerformanceMonitor.displayName = 'PerformanceMonitor';