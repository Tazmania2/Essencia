'use client';

import React from 'react';
import { Skeleton } from './LoadingSpinner';

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 min-h-screen">
      {/* Header Skeleton */}
      <div className="bg-white shadow-sm p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="flex items-center justify-between">
              <div>
                <Skeleton className="h-8 w-64 mb-2" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-10 w-24 rounded-lg" />
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Points and Cycle Cards Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PointsCardSkeleton />
          <CycleCardSkeleton />
        </div>

        {/* Primary Goal Skeleton */}
        <GoalCardSkeleton isPrimary />

        {/* Secondary Goals Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GoalCardSkeleton />
          <GoalCardSkeleton />
        </div>

        {/* Goal Details Accordion Skeleton */}
        <GoalDetailsAccordionSkeleton />

        {/* Quick Actions Skeleton */}
        <QuickActionsSkeleton />
      </main>
    </div>
  );
};

const PointsCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
      <div className="animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-6 rounded-full" />
        </div>
        <div className="text-center">
          <Skeleton className="h-12 w-32 mx-auto mb-2" />
          <Skeleton className="h-4 w-20 mx-auto" />
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100">
          <Skeleton className="h-4 w-full" />
        </div>
      </div>
    </div>
  );
};

const CycleCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
      <div className="animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-6 w-6 rounded-full" />
        </div>
        <div className="space-y-3">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-3 w-full rounded-full" />
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <Skeleton className="h-8 w-12 mx-auto mb-1" />
              <Skeleton className="h-3 w-16 mx-auto" />
            </div>
            <div className="text-center">
              <Skeleton className="h-8 w-12 mx-auto mb-1" />
              <Skeleton className="h-3 w-20 mx-auto" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface GoalCardSkeletonProps {
  isPrimary?: boolean;
}

const GoalCardSkeleton: React.FC<GoalCardSkeletonProps> = ({ isPrimary = false }) => {
  return (
    <div className={`bg-white rounded-2xl p-6 shadow-lg border-2 ${
      isPrimary ? 'border-blue-200' : 'border-gray-200'
    }`}>
      <div className="animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-6 w-32" />
          </div>
          {!isPrimary && <Skeleton className="h-6 w-16 rounded-full" />}
        </div>
        
        <div className="text-center mb-4">
          <Skeleton className="h-16 w-24 mx-auto mb-2" />
          <Skeleton className="h-4 w-48 mx-auto" />
        </div>
        
        <Skeleton className="h-4 w-full rounded-full mb-4" />
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <Skeleton className="h-4 w-16 mb-1" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div>
            <Skeleton className="h-4 w-12 mb-1" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      </div>
    </div>
  );
};

const GoalDetailsAccordionSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
      <div className="animate-pulse">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-5 w-5" />
          </div>
        </div>
        <div className="p-6 space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="p-4 rounded-lg bg-gray-50">
              <Skeleton className="h-5 w-32 mb-3" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const QuickActionsSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
      <div className="animate-pulse">
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="p-4 rounded-xl bg-gray-50">
              <Skeleton className="h-8 w-8 mx-auto mb-2 rounded-full" />
              <Skeleton className="h-4 w-16 mx-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Skeleton for individual dashboard components
export const GoalCardLoadingSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
      <div className="animate-pulse">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
          <div className="h-6 bg-gray-200 rounded w-32"></div>
        </div>
        <div className="text-center mb-4">
          <div className="h-16 bg-gray-200 rounded w-24 mx-auto mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-48 mx-auto"></div>
        </div>
        <div className="h-4 bg-gray-200 rounded-full mb-4"></div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="h-4 bg-gray-200 rounded w-16 mb-1"></div>
            <div className="h-4 bg-gray-200 rounded w-20"></div>
          </div>
          <div>
            <div className="h-4 bg-gray-200 rounded w-12 mb-1"></div>
            <div className="h-4 bg-gray-200 rounded w-16"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const HistoryLoadingSkeleton: React.FC = () => {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
          <div className="animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-12"></div>
                  </div>
                  <div className="flex-1">
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <div className="h-4 bg-gray-200 rounded w-20 mb-1"></div>
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                      </div>
                      <div>
                        <div className="h-4 bg-gray-200 rounded w-16 mb-1"></div>
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <div className="h-4 bg-gray-200 rounded w-20 mb-1"></div>
                        <div className="h-5 bg-gray-200 rounded w-12"></div>
                      </div>
                      <div>
                        <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                        <div className="h-5 bg-gray-200 rounded w-12"></div>
                      </div>
                      <div>
                        <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                        <div className="h-5 bg-gray-200 rounded w-12"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <div className="h-6 bg-gray-200 rounded-full w-12 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="h-5 bg-gray-200 rounded w-5"></div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="h-3 bg-gray-200 rounded w-32 mb-2"></div>
              <div className="h-2 bg-gray-200 rounded-full w-full"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export const ConfigurationLoadingSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="animate-pulse">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-48"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Team Selection Skeleton */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-40 mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-12 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>

      {/* Configuration Content Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="h-5 bg-gray-200 rounded w-32 mb-2"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                  <div className="h-4 bg-gray-200 rounded w-28"></div>
                </div>
              </div>
              <div className="h-10 bg-gray-200 rounded-lg w-full"></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <div className="h-5 bg-gray-200 rounded w-32 mb-1"></div>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
exp
ort const ChartLoadingSkeleton: React.FC = () => {
  return (
    <div className="w-full">
      {/* Legend Skeleton */}
      <div className="flex justify-center space-x-6 mb-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="flex items-center space-x-2">
            <Skeleton className="w-4 h-4 rounded" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>

      {/* Chart Skeleton */}
      <div className="animate-pulse">
        <div className="border border-gray-200 rounded-lg bg-white p-4">
          <div className="relative h-96 bg-gray-50 rounded">
            {/* Simulated grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between p-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-px bg-gray-200 w-full"></div>
              ))}
            </div>
            
            {/* Simulated chart lines */}
            <div className="absolute inset-4 flex items-end justify-between">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="flex flex-col items-center space-y-1">
                  <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
                  <div className="w-2 h-2 bg-green-300 rounded-full"></div>
                  <div className="w-2 h-2 bg-purple-300 rounded-full"></div>
                </div>
              ))}
            </div>
            
            {/* Loading indicator */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-sm text-gray-500">Carregando gráfico...</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary stats skeleton */}
      <div className="mt-4 grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="bg-gray-50 p-3 rounded-lg">
            <div className="animate-pulse">
              <Skeleton className="h-6 w-16 mx-auto mb-2" />
              <Skeleton className="h-4 w-24 mx-auto" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const SaveProgressIndicator: React.FC<{ 
  progress: number; 
  message: string; 
  isVisible: boolean 
}> = ({ progress, message, isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="text-center">
          <div className="mb-4">
            <div className="w-16 h-16 mx-auto mb-4">
              <svg className="w-full h-full animate-spin" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Salvando Configuração
          </h3>
          
          <p className="text-gray-600 mb-4">{message}</p>
          
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
            />
          </div>
          
          <p className="text-sm text-gray-500">{Math.round(progress)}% concluído</p>
        </div>
      </div>
    </div>
  );
};

export const DataUploadProgress: React.FC<{
  isVisible: boolean;
  progress: number;
  message: string;
  fileName?: string;
  onCancel?: () => void;
}> = ({ isVisible, progress, message, fileName, onCancel }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="text-center">
          <div className="mb-4">
            <div className="w-16 h-16 mx-auto mb-4 text-blue-600">
              <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Processando Upload
          </h3>
          
          {fileName && (
            <p className="text-sm text-gray-600 mb-2">
              Arquivo: {fileName}
            </p>
          )}
          
          <p className="text-gray-600 mb-4">{message}</p>
          
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
            />
          </div>
          
          <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
            <span>{Math.round(progress)}% concluído</span>
            <span>{progress < 100 ? 'Processando...' : 'Finalizando...'}</span>
          </div>
          
          {onCancel && progress < 90 && (
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};