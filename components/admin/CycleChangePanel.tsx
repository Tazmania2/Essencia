'use client';

import React, { useState, useEffect } from 'react';
import { cycleChangeService, CycleChangeProgress, CycleChangeStep } from '../../services/cycle-change.service';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface CycleChangePanelProps {
  onClose?: () => void;
}

export const CycleChangePanel: React.FC<CycleChangePanelProps> = ({ onClose }) => {
  const [progress, setProgress] = useState<CycleChangeProgress | null>(null);
  const [selectedStepLogs, setSelectedStepLogs] = useState<any[] | null>(null);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    // Get current progress on mount
    const currentProgress = cycleChangeService.getCurrentProgress();
    setProgress(currentProgress);

    // Subscribe to progress updates
    const unsubscribe = cycleChangeService.onProgressUpdate((newProgress) => {
      setProgress(newProgress);
    });

    return unsubscribe;
  }, []);

  const handleInitialize = () => {
    const initialProgress = cycleChangeService.initializeCycleChange();
    setProgress(initialProgress);
  };

  const handleStart = async () => {
    if (!progress) return;
    
    try {
      await cycleChangeService.startCycleChange();
    } catch (error) {
      console.error('Error starting cycle change:', error);
    }
  };

  const handleCancel = () => {
    cycleChangeService.cancelCycleChange();
  };

  const handleReset = () => {
    cycleChangeService.resetCycleChange();
    setProgress(null);
    setSelectedStepLogs(null);
  };

  const handleViewLogs = async (stepIndex: number) => {
    setLoadingLogs(true);
    try {
      const logs = await cycleChangeService.getStepLogs(stepIndex);
      setSelectedStepLogs(logs);
    } catch (error) {
      console.error('Error loading logs:', error);
      setSelectedStepLogs([]);
    } finally {
      setLoadingLogs(false);
    }
  };

  const getStepStatusIcon = (status: CycleChangeStep['status']) => {
    switch (status) {
      case 'completed':
        return (
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'running':
        return (
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <LoadingSpinner size="sm" />
          </div>
        );
      case 'failed':
        return (
          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
          </div>
        );
    }
  };

  const getOverallStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'running':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Trocar o Ciclo</h2>
            <p className="text-gray-600">Executar processo de mudança de ciclo</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Progress Overview */}
      {progress && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progresso Geral</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getOverallStatusColor(progress.overallStatus)}`}>
              {progress.overallStatus === 'not_started' && 'Não Iniciado'}
              {progress.overallStatus === 'running' && 'Em Execução'}
              {progress.overallStatus === 'completed' && 'Concluído'}
              {progress.overallStatus === 'failed' && 'Falhou'}
              {progress.overallStatus === 'cancelled' && 'Cancelado'}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(progress.currentStep / progress.totalSteps) * 100}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>Etapa {progress.currentStep + 1} de {progress.totalSteps}</span>
            {progress.startTime && (
              <span>
                Iniciado: {progress.startTime.toLocaleTimeString('pt-BR')}
                {progress.endTime && ` - Finalizado: ${progress.endTime.toLocaleTimeString('pt-BR')}`}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Control Buttons */}
      <div className="flex space-x-3 mb-6">
        {!progress && (
          <button
            onClick={handleInitialize}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Inicializar Processo
          </button>
        )}
        
        {progress && progress.overallStatus === 'not_started' && (
          <button
            onClick={handleStart}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Iniciar Troca de Ciclo
          </button>
        )}
        
        {progress && progress.isRunning && (
          <button
            onClick={handleCancel}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Cancelar Processo
          </button>
        )}
        
        {progress && !progress.isRunning && (
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Resetar
          </button>
        )}
      </div>

      {/* Steps List */}
      {progress && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Etapas do Processo</h3>
          
          {progress.steps.map((step, index) => (
            <div key={step.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start space-x-4">
                {getStepStatusIcon(step.status)}
                
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-900">{step.name}</h4>
                    <div className="flex items-center space-x-2">
                      {step.startTime && step.endTime && (
                        <span className="text-xs text-gray-500">
                          {formatDuration(step.endTime.getTime() - step.startTime.getTime())}
                        </span>
                      )}
                      <button
                        onClick={() => handleViewLogs(index)}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        Ver Logs
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                  
                  {step.result && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                      <div className={`font-medium ${step.result.success ? 'text-green-700' : 'text-red-700'}`}>
                        {step.result.success ? '✓ Sucesso' : '✗ Falha'}: {step.result.message}
                      </div>
                    </div>
                  )}
                  
                  {step.validationResult && (
                    <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
                      <div className={`font-medium ${step.validationResult.success ? 'text-green-700' : 'text-red-700'}`}>
                        Validação: {step.validationResult.message}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Logs Modal */}
      {selectedStepLogs !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Logs do Scheduler</h3>
              <button
                onClick={() => setSelectedStepLogs(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="overflow-y-auto max-h-96">
              {loadingLogs ? (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner size="lg" />
                </div>
              ) : selectedStepLogs.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Nenhum log encontrado</p>
              ) : (
                <div className="space-y-2">
                  {selectedStepLogs.map((log, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded text-sm font-mono">
                      <div className="text-xs text-gray-500 mb-1">
                        {new Date(log.time || log.created).toLocaleString('pt-BR')}
                      </div>
                      <div className="text-gray-800">
                        {JSON.stringify(log, null, 2)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Warning Message */}
      {!progress && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex">
            <svg className="w-5 h-5 text-yellow-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Atenção</h3>
              <p className="text-sm text-yellow-700 mt-1">
                O processo de troca de ciclo executará schedulers que modificarão dados dos jogadores. 
                Certifique-se de que é seguro executar este processo antes de continuar.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};