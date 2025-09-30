'use client';

import React, { useState, useEffect } from 'react';
import { DashboardConfigurationRecord } from '../../types';
import { dashboardConfigurationService } from '../../services/dashboard-configuration.service';
import { ConfigurationHistoryViewer } from './ConfigurationHistoryViewer';
import { ConfigurationExportImport } from './ConfigurationExportImport';
import { ConfigurationAuditTrail } from './ConfigurationAuditTrail';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface ConfigurationManagementInterfaceProps {
  currentConfiguration?: DashboardConfigurationRecord;
  onConfigurationChange?: (config: DashboardConfigurationRecord) => void;
}

export const ConfigurationManagementInterface: React.FC<ConfigurationManagementInterfaceProps> = ({
  currentConfiguration,
  onConfigurationChange
}) => {
  const [activeTab, setActiveTab] = useState<'history' | 'export-import' | 'audit'>('history');
  const [configurationHistory, setConfigurationHistory] = useState<DashboardConfigurationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadConfigurationHistory();
  }, []);

  const loadConfigurationHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const history = await dashboardConfigurationService.getConfigurationHistory();
      setConfigurationHistory(history);
    } catch (err) {
      console.error('Error loading configuration history:', err);
      setError('Erro ao carregar histórico de configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleRollback = async (config: DashboardConfigurationRecord) => {
    try {
      // Create new configuration based on the selected one
      const rollbackConfig: DashboardConfigurationRecord = {
        ...config,
        _id: '', // Will be generated on save
        version: (currentConfiguration?.version || 0) + 1,
        createdAt: new Date().toISOString(),
        createdBy: 'admin', // TODO: Get from auth context
        isActive: true
      };

      await dashboardConfigurationService.saveConfiguration(rollbackConfig);
      
      // Refresh history and notify parent
      await loadConfigurationHistory();
      onConfigurationChange?.(rollbackConfig);
      
    } catch (err) {
      console.error('Error rolling back configuration:', err);
      setError('Erro ao reverter configuração');
    }
  };

  const handleExport = (config: DashboardConfigurationRecord) => {
    // Export functionality is handled by the ConfigurationExportImport component
    console.log('Exporting configuration:', config._id);
  };

  const handleImport = async (config: DashboardConfigurationRecord) => {
    try {
      await dashboardConfigurationService.saveConfiguration(config);
      
      // Refresh history and notify parent
      await loadConfigurationHistory();
      onConfigurationChange?.(config);
      
    } catch (err) {
      console.error('Error importing configuration:', err);
      setError('Erro ao importar configuração');
    }
  };

  const tabs = [
    {
      id: 'history' as const,
      label: 'Histórico',
      icon: '📚',
      description: 'Visualizar versões anteriores e reverter mudanças'
    },
    {
      id: 'export-import' as const,
      label: 'Exportar/Importar',
      icon: '📦',
      description: 'Backup e compartilhamento de configurações'
    },
    {
      id: 'audit' as const,
      label: 'Auditoria',
      icon: '🔍',
      description: 'Trilha detalhada de mudanças'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600">Carregando gerenciamento de configurações...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">⚙️ Gerenciamento de Configurações</h2>
            <p className="text-gray-600 mt-1">
              Gerencie versões, histórico e auditoria das configurações de dashboard
            </p>
          </div>
          <div className="text-sm text-gray-500">
            {configurationHistory.length} configurações no histórico
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-800">{error}</span>
            </div>
            <button 
              onClick={() => setError(null)}
              className="mt-2 text-red-600 hover:text-red-800 underline text-sm"
            >
              Dispensar
            </button>
          </div>
        )}

        {/* Current Configuration Info */}
        {currentConfiguration && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-blue-900">Configuração Atual</h3>
                <div className="text-sm text-blue-700 mt-1">
                  Versão {currentConfiguration.version} • 
                  Criada em {new Date(currentConfiguration.createdAt).toLocaleDateString('pt-BR')} • 
                  Por {currentConfiguration.createdBy}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {Object.keys(currentConfiguration.configurations).length} Dashboards
                </span>
                {currentConfiguration.isActive && (
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    Ativa
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-lg">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-boticario-pink text-boticario-pink'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{tab.icon}</span>
                  <span>{tab.label}</span>
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {tab.description}
                </div>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'history' && (
            <ConfigurationHistoryViewer
              onRollback={handleRollback}
              onExport={handleExport}
              currentConfigId={currentConfiguration?._id}
            />
          )}

          {activeTab === 'export-import' && (
            <ConfigurationExportImport
              currentConfiguration={currentConfiguration}
              onImport={handleImport}
            />
          )}

          {activeTab === 'audit' && (
            <ConfigurationAuditTrail
              configurationHistory={configurationHistory}
            />
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
              <span className="text-2xl">📊</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Total de Versões</h3>
              <p className="text-2xl font-bold text-blue-600">{configurationHistory.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
              <span className="text-2xl">✅</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Configuração Ativa</h3>
              <p className="text-2xl font-bold text-green-600">
                v{currentConfiguration?.version || 'N/A'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Carteira II</h3>
              <p className="text-2xl font-bold text-orange-600">
                {currentConfiguration && 'CARTEIRA_II' in currentConfiguration.configurations ? 'Ativa' : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};