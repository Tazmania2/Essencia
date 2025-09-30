'use client';

import React, { useState, useRef } from 'react';
import { DashboardConfigurationRecord } from '../../types';
import { configurationValidator } from '../../services/configuration-validator.service';

interface ConfigurationExportImportProps {
  currentConfiguration?: DashboardConfigurationRecord;
  onImport?: (config: DashboardConfigurationRecord) => void;
}

export const ConfigurationExportImport: React.FC<ConfigurationExportImportProps> = ({
  currentConfiguration,
  onImport
}) => {
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [validatingImport, setValidatingImport] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportCurrent = () => {
    if (!currentConfiguration) {
      alert('Nenhuma configuração atual disponível para exportar');
      return;
    }

    exportConfiguration(currentConfiguration, 'configuracao-atual');
  };

  const exportConfiguration = (config: DashboardConfigurationRecord, filename: string) => {
    try {
      // Create export data with metadata
      const exportData = {
        exportedAt: new Date().toISOString(),
        exportedBy: 'admin', // TODO: Get from auth context
        version: config.version,
        originalId: config._id,
        configuration: config
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}-v${config.version}-${new Date().toISOString().split('T')[0]}.json`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting configuration:', error);
      alert('Erro ao exportar configuração');
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportError(null);
    setImportSuccess(null);
    setValidatingImport(true);

    try {
      const fileContent = await readFileAsText(file);
      const importData = JSON.parse(fileContent);
      
      // Validate import data structure
      if (!importData.configuration) {
        throw new Error('Arquivo de configuração inválido: estrutura não reconhecida');
      }

      const config = importData.configuration as DashboardConfigurationRecord;
      
      // Validate configuration
      const validationResult = await configurationValidator.validateConfiguration(config);
      
      if (!validationResult.isValid) {
        const errorMessages = validationResult.errors
          .filter(e => e.severity === 'error')
          .map(e => e.message)
          .join(', ');
        throw new Error(`Configuração inválida: ${errorMessages}`);
      }

      // Prepare configuration for import (new version, new ID, etc.)
      const importConfig: DashboardConfigurationRecord = {
        ...config,
        _id: '', // Will be generated on save
        version: (currentConfiguration?.version || 0) + 1,
        createdAt: new Date().toISOString(),
        createdBy: 'admin', // TODO: Get from auth context
        isActive: true
      };

      setImportSuccess(`Configuração importada com sucesso! Versão ${importData.version} de ${new Date(importData.exportedAt).toLocaleDateString('pt-BR')}`);
      
      if (onImport) {
        onImport(importConfig);
      }

    } catch (error) {
      console.error('Error importing configuration:', error);
      setImportError(error instanceof Error ? error.message : 'Erro ao importar configuração');
    } finally {
      setValidatingImport(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(new Error('Erro ao ler arquivo'));
      reader.readAsText(file);
    });
  };

  const handleCreateTemplate = () => {
    // Create a template configuration with placeholder values
    const templateConfig: DashboardConfigurationRecord = {
      _id: 'template',
      version: 1,
      createdAt: new Date().toISOString(),
      createdBy: 'template',
      isActive: false,
      configurations: {
        CARTEIRA_I: {
          teamType: 'CARTEIRA_I' as any,
          displayName: 'Carteira I',
          primaryGoal: {
            name: 'atividade',
            displayName: 'Atividade',
            challengeId: 'CHALLENGE_ID_AQUI',
            actionId: 'atividade',
            emoji: '🎯',
            unit: 'pontos',
            calculationType: 'funifier_direct'
          },
          secondaryGoal1: {
            name: 'reaisPorAtivo',
            displayName: 'Reais por Ativo',
            challengeId: 'CHALLENGE_ID_AQUI',
            actionId: 'reais_por_ativo',
            emoji: '💰',
            unit: 'R$',
            calculationType: 'funifier_direct',
            boost: {
              catalogItemId: 'CATALOG_ITEM_ID_AQUI',
              name: 'Boost Reais por Ativo',
              description: 'Multiplicador ativo quando meta é atingida'
            }
          },
          secondaryGoal2: {
            name: 'faturamento',
            displayName: 'Faturamento',
            challengeId: 'CHALLENGE_ID_AQUI',
            actionId: 'faturamento',
            emoji: '📈',
            unit: 'R$',
            calculationType: 'funifier_direct',
            boost: {
              catalogItemId: 'CATALOG_ITEM_ID_AQUI',
              name: 'Boost Faturamento',
              description: 'Multiplicador ativo quando meta é atingida'
            }
          },
          unlockConditions: {
            catalogItemId: 'CATALOG_ITEM_ID_AQUI',
            description: 'Pontos desbloqueados quando condições são atendidas'
          }
        }
      }
    };

    exportConfiguration(templateConfig, 'template-configuracao');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">📦 Exportar / Importar Configurações</h3>
        <p className="text-gray-600 text-sm">
          Exporte configurações para backup ou compartilhamento, ou importe configurações de outros ambientes.
        </p>
      </div>

      {/* Export Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 12l3 3m0 0l3-3m-3 3V9" />
          </svg>
          Exportar Configurações
        </h4>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-blue-800">Configuração Atual</p>
              <p className="text-sm text-blue-600">
                {currentConfiguration 
                  ? `Versão ${currentConfiguration.version} - ${new Date(currentConfiguration.createdAt).toLocaleDateString('pt-BR')}`
                  : 'Nenhuma configuração carregada'
                }
              </p>
            </div>
            <button
              onClick={handleExportCurrent}
              disabled={!currentConfiguration}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                currentConfiguration
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              📤 Exportar
            </button>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-blue-200">
            <div>
              <p className="font-medium text-blue-800">Template de Configuração</p>
              <p className="text-sm text-blue-600">
                Baixe um template para criar novas configurações
              </p>
            </div>
            <button
              onClick={handleCreateTemplate}
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium"
            >
              📋 Template
            </button>
          </div>
        </div>
      </div>

      {/* Import Section */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h4 className="font-semibold text-green-900 mb-3 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          Importar Configuração
        </h4>

        <div className="space-y-3">
          <p className="text-sm text-green-700">
            Selecione um arquivo JSON de configuração exportado anteriormente.
          </p>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleImportClick}
              disabled={validatingImport}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                validatingImport
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {validatingImport ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500 inline" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Validando...
                </>
              ) : (
                <>📥 Selecionar Arquivo</>
              )}
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
            />

            <span className="text-sm text-green-600">
              Apenas arquivos .json são aceitos
            </span>
          </div>

          {/* Import Success */}
          {importSuccess && (
            <div className="bg-green-100 border border-green-300 rounded-lg p-3">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-green-800 font-medium">Sucesso!</span>
              </div>
              <p className="text-green-700 text-sm mt-1">{importSuccess}</p>
            </div>
          )}

          {/* Import Error */}
          {importError && (
            <div className="bg-red-100 border border-red-300 rounded-lg p-3">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-red-800 font-medium">Erro na Importação</span>
              </div>
              <p className="text-red-700 text-sm mt-1">{importError}</p>
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-3">📖 Instruções</h4>
        <div className="text-sm text-gray-700 space-y-2">
          <div className="flex items-start">
            <span className="font-medium mr-2">Exportar:</span>
            <span>Salva a configuração atual em um arquivo JSON que pode ser usado como backup ou compartilhado.</span>
          </div>
          <div className="flex items-start">
            <span className="font-medium mr-2">Importar:</span>
            <span>Carrega uma configuração de um arquivo JSON exportado. A configuração será validada antes da importação.</span>
          </div>
          <div className="flex items-start">
            <span className="font-medium mr-2">Template:</span>
            <span>Baixa um modelo de configuração que pode ser editado e importado posteriormente.</span>
          </div>
        </div>
      </div>
    </div>
  );
};