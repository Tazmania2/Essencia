'use client';

import React, { useState, useEffect } from 'react';
import { DashboardConfigurationRecord } from '../../types';
import { dashboardConfigurationService } from '../../services/dashboard-configuration.service';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface ConfigurationHistoryViewerProps {
  onRollback?: (config: DashboardConfigurationRecord) => void;
  onExport?: (config: DashboardConfigurationRecord) => void;
  currentConfigId?: string;
}

export const ConfigurationHistoryViewer: React.FC<ConfigurationHistoryViewerProps> = ({
  onRollback,
  onExport,
  currentConfigId
}) => {
  const [history, setHistory] = useState<DashboardConfigurationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedConfig, setSelectedConfig] = useState<DashboardConfigurationRecord | null>(null);
  const [showRollbackConfirm, setShowRollbackConfirm] = useState(false);

  useEffect(() => {
    loadConfigurationHistory();
  }, []);

  const loadConfigurationHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const configHistory = await dashboardConfigurationService.getConfigurationHistory();
      setHistory(configHistory.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (err) {
      console.error('Error loading configuration history:', err);
      setError('Erro ao carregar histórico de configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleRollback = (config: DashboardConfigurationRecord) => {
    setSelectedConfig(config);
    setShowRollbackConfirm(true);
  };

  const confirmRollback = () => {
    if (selectedConfig && onRollback) {
      onRollback(selectedConfig);
    }
    setShowRollbackConfirm(false);
    setSelectedConfig(null);
  };

  const cancelRollback = () => {
    setShowRollbackConfirm(false);
    setSelectedConfig(null);
  };

  const handleExport = (config: DashboardConfigurationRecord) => {
    if (onExport) {
      onExport(config);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getConfigurationSummary = (config: DashboardConfigurationRecord) => {
    const teamCount = Object.keys(config.configurations).length;
    const hasCarteiraII = 'CARTEIRA_II' in config.configurations;
    return { teamCount, hasCarteiraII };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner size="md" />
        <span className="ml-3 text-gray-600">Carregando histórico...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-red-800">{error}</span>
        </div>
        <button 
          onClick={loadConfigurationHistory}
          className="mt-3 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">📚 Histórico de Configurações</h3>
        <button
          onClick={loadConfigurationHistory}
          className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Atualizar
        </button>
      </div>

      {/* History List */}
      {history.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p>Nenhuma configuração encontrada no histórico</p>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((config, index) => {
            const { teamCount, hasCarteiraII } = getConfigurationSummary(config);
            const isCurrent = config._id === currentConfigId;
            
            return (
              <div
                key={config._id}
                className={`border rounded-lg p-4 transition-all ${
                  isCurrent 
                    ? 'border-boticario-pink bg-pink-50' 
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-semibold text-gray-900">
                        Versão {config.version}
                      </h4>
                      {isCurrent && (
                        <span className="px-2 py-1 bg-boticario-pink text-white text-xs rounded-full">
                          Atual
                        </span>
                      )}
                      {config.isActive && !isCurrent && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          Ativa
                        </span>
                      )}
                      {hasCarteiraII && (
                        <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                          ⚠️ Carteira II
                        </span>
                      )}
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>📅 {formatDate(config.createdAt)}</div>
                      <div>👤 Criado por: {config.createdBy}</div>
                      <div>🎯 {teamCount} dashboards configurados</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleExport(config)}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                      title="Exportar configuração"
                    >
                      📤 Exportar
                    </button>
                    
                    {!isCurrent && (
                      <button
                        onClick={() => handleRollback(config)}
                        className="px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors"
                        title="Reverter para esta configuração"
                      >
                        ↩️ Reverter
                      </button>
                    )}
                  </div>
                </div>

                {/* Configuration Preview */}
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                    {Object.entries(config.configurations).map(([teamType, teamConfig]) => (
                      <div
                        key={teamType}
                        className={`text-xs p-2 rounded ${
                          teamType === 'CARTEIRA_II' 
                            ? 'bg-orange-100 text-orange-800 border border-orange-200' 
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        <div className="font-medium">{teamConfig.displayName}</div>
                        <div className="opacity-75">
                          {teamConfig.primaryGoal.emoji} {teamConfig.primaryGoal.displayName}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Rollback Confirmation Modal */}
      {showRollbackConfirm && selectedConfig && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Confirmar Reversão</h3>
                  <p className="text-gray-600">Esta ação não pode ser desfeita</p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-gray-700 mb-3">
                  Você está prestes a reverter para a configuração:
                </p>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <div className="font-medium">Versão {selectedConfig.version}</div>
                  <div className="text-sm text-gray-600">
                    Criada em {formatDate(selectedConfig.createdAt)}
                  </div>
                  <div className="text-sm text-gray-600">
                    Por {selectedConfig.createdBy}
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-3">
                  A configuração atual será substituída e uma nova versão será criada.
                </p>
              </div>

              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={cancelRollback}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmRollback}
                  className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                >
                  Confirmar Reversão
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};