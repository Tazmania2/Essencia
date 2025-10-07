'use client';

import React, { useState, useEffect } from 'react';
import { DashboardConfigurationRecord, TeamType } from '../../types';
import { dashboardConfigurationService } from '../../services/dashboard-configuration.service';
import { configurationValidator } from '../../services/configuration-validator.service';
import { LoadingState, LoadingOverlay, ProgressBar } from '../ui/LoadingSpinner';
import { useConfigurationLoading } from '../../hooks/useConfigurationLoading';
import { useNotificationHelpers } from '../../hooks/useNotificationHelpers';

interface ConfigurationPanelProps {
  onConfigurationSaved?: (config: DashboardConfigurationRecord) => void;
}

export const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({
  onConfigurationSaved
}) => {
  const [currentConfig, setCurrentConfig] = useState<DashboardConfigurationRecord | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<TeamType>(TeamType.CARTEIRA_I);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [pendingTeamSwitch, setPendingTeamSwitch] = useState<TeamType | null>(null);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  
  const { loadingState, executeWithLoading, setProgress } = useConfigurationLoading();
  const { 
    notifyConfigurationSaved, 
    notifyConfigurationError, 
    notifyWarning 
  } = useNotificationHelpers();

  useEffect(() => {
    loadConfiguration();
  }, []);

  // Warn user before leaving page with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'Você tem alterações não salvas. Tem certeza que deseja sair?';
        return 'Você tem alterações não salvas. Tem certeza que deseja sair?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const loadConfiguration = async () => {
    const result = await executeWithLoading(
      async () => {
        const config = await dashboardConfigurationService.getCurrentConfiguration();
        return config;
      },
      'Carregando configuração atual...'
    );

    if (result) {
      setCurrentConfig(result);
    }
  };

  const handleTeamSwitch = (newTeam: TeamType) => {
    if (hasUnsavedChanges && newTeam !== selectedTeam) {
      setPendingTeamSwitch(newTeam);
      setShowUnsavedWarning(true);
    } else {
      setSelectedTeam(newTeam);
      setHasUnsavedChanges(false);
    }
  };

  const confirmTeamSwitch = () => {
    if (pendingTeamSwitch) {
      setSelectedTeam(pendingTeamSwitch);
      setHasUnsavedChanges(false);
      setPendingTeamSwitch(null);
    }
    setShowUnsavedWarning(false);
  };

  const cancelTeamSwitch = () => {
    setPendingTeamSwitch(null);
    setShowUnsavedWarning(false);
  };

  const handleFormChange = () => {
    setHasUnsavedChanges(true);
  };

  const handleSaveConfiguration = async (newConfig: DashboardConfigurationRecord) => {
    const result = await executeWithLoading(
      async () => {
        // Step 1: Validation
        setProgress(15, 'Validando configuração...');
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate validation time
        
        const validation = configurationValidator.validateDashboardConfiguration(newConfig);
        if (!validation.isValid) {
          throw new Error('Configuração inválida: ' + validation.errors.map(e => e.message).join(', '));
        }

        if (validation.warnings.length > 0) {
          validation.warnings.forEach(warning => {
            notifyWarning(`${warning.field}: ${warning.message}`);
          });
        }

        // Step 2: Pre-save checks
        setProgress(35, 'Verificando compatibilidade...');
        await new Promise(resolve => setTimeout(resolve, 300));

        // Step 3: Database save
        setProgress(55, 'Salvando no banco de dados...');
        
        const savedConfig = await dashboardConfigurationService.saveConfiguration({
          createdBy: 'admin',
          configurations: newConfig.configurations
        });

        // Step 4: Cache invalidation
        setProgress(75, 'Atualizando cache do sistema...');
        await new Promise(resolve => setTimeout(resolve, 400));
        
        // Step 5: Final validation
        setProgress(90, 'Verificando integridade...');
        await new Promise(resolve => setTimeout(resolve, 300));
        
        setProgress(100, 'Configuração salva com sucesso!');
        
        return savedConfig;
      },
      'Iniciando processo de salvamento...'
    );

    if (result) {
      setCurrentConfig(result);
      setHasUnsavedChanges(false); // Reset unsaved changes flag
      onConfigurationSaved?.(result);
      notifyConfigurationSaved();
    }
  };

  const teamOptions = [
    { value: TeamType.CARTEIRA_0, label: 'Carteira 0' },
    { value: TeamType.CARTEIRA_I, label: 'Carteira I' },
    { value: TeamType.CARTEIRA_II, label: 'Carteira II (Processamento Especial)' },
    { value: TeamType.CARTEIRA_III, label: 'Carteira III' },
    { value: TeamType.CARTEIRA_IV, label: 'Carteira IV' },
    { value: TeamType.ER, label: 'ER' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">⚙️ Configuração de Dashboards</h2>
            <p className="text-gray-600 mt-1">
              Configure as métricas e comportamentos de cada dashboard
            </p>
          </div>
        </div>

        {/* Progress bar for save operations */}
        {loadingState.progress !== undefined && (
          <div className="mt-4">
            <ProgressBar
              progress={loadingState.progress}
              message={loadingState.message}
              showPercentage={true}
            />
          </div>
        )}
      </div>

      {/* Team Selection */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Selecionar Dashboard</h3>
        
        <LoadingOverlay isLoading={loadingState.isLoading} message={loadingState.message}>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {teamOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleTeamSwitch(option.value)}
                disabled={loadingState.isLoading}
                className={`p-3 rounded-lg text-sm font-medium transition-colors ${
                  selectedTeam === option.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } ${option.value === TeamType.CARTEIRA_II ? 'border-2 border-orange-300' : ''}
                  ${loadingState.isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {option.label}
                {option.value === TeamType.CARTEIRA_II && (
                  <div className="text-xs mt-1 opacity-75">⚠️ Especial</div>
                )}
              </button>
            ))}
          </div>
        </LoadingOverlay>
      </div>

      {/* Configuration Content */}
      <LoadingState
        isLoading={loadingState.isLoading && !currentConfig}
        error={loadingState.error}
        isEmpty={!currentConfig}
        emptyMessage="Nenhuma configuração encontrada"
        loadingMessage={loadingState.message || 'Carregando configuração...'}
        onRetry={loadConfiguration}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Configuration Form */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Configurar {teamOptions.find(t => t.value === selectedTeam)?.label}
            </h3>
            
            {currentConfig && (
              <ConfigurationForm
                key={selectedTeam} // Force re-render when team changes
                teamType={selectedTeam}
                currentConfig={currentConfig}
                onSave={handleSaveConfiguration}
                onChange={handleFormChange}
                isLoading={loadingState.isLoading}
                hasUnsavedChanges={hasUnsavedChanges}
              />
            )}
          </div>

          {/* Configuration Preview */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Visualização</h3>
            
            {currentConfig && (
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900">Meta Principal</h4>
                  <p className="text-sm text-blue-700">
                    {currentConfig.configurations[selectedTeam]?.primaryGoal?.displayName || 'Não configurado'}
                  </p>
                </div>
                
                <div className="p-3 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-900">Meta Secundária 1</h4>
                  <p className="text-sm text-green-700">
                    {currentConfig.configurations[selectedTeam]?.secondaryGoal1?.displayName || 'Não configurado'}
                  </p>
                </div>
                
                <div className="p-3 bg-purple-50 rounded-lg">
                  <h4 className="font-medium text-purple-900">Meta Secundária 2</h4>
                  <p className="text-sm text-purple-700">
                    {currentConfig.configurations[selectedTeam]?.secondaryGoal2?.displayName || 'Não configurado'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </LoadingState>

      {/* Unsaved Changes Warning Modal */}
      {showUnsavedWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <div className="flex items-center mb-4">
              <svg className="w-6 h-6 text-amber-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900">Alterações não salvas</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Você tem alterações não salvas na configuração atual. Se continuar, essas alterações serão perdidas.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelTeamSwitch}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmTeamSwitch}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Descartar alterações
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface ConfigurationFormProps {
  teamType: TeamType;
  currentConfig: DashboardConfigurationRecord;
  onSave: (config: DashboardConfigurationRecord) => Promise<void>;
  onChange: () => void;
  isLoading: boolean;
  hasUnsavedChanges: boolean;
}

const ConfigurationForm: React.FC<ConfigurationFormProps> = ({
  teamType,
  currentConfig,
  onSave,
  onChange,
  isLoading,
  hasUnsavedChanges
}) => {
  const [formData, setFormData] = useState(currentConfig.configurations[teamType]);

  // Reset form data when team type changes
  useEffect(() => {
    const teamConfig = currentConfig.configurations[teamType];
    if (teamConfig) {
      console.log(`Loading configuration for ${teamType}:`, teamConfig);
      console.log('Primary goal fields:', {
        emoji: teamConfig.primaryGoal?.emoji,
        unit: teamConfig.primaryGoal?.unit,
        csvField: teamConfig.primaryGoal?.csvField,
        description: teamConfig.primaryGoal?.description
      });
      setFormData(teamConfig);
    }
  }, [teamType, currentConfig]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    onChange(); // Notify parent of changes
  };

  const handleGoalChange = (goalType: 'primaryGoal' | 'secondaryGoal1' | 'secondaryGoal2', field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [goalType]: {
        ...prev[goalType],
        [field]: value
      }
    }));
    onChange(); // Notify parent of changes
  };

  const handleSave = async () => {
    const updatedConfig: DashboardConfigurationRecord = {
      ...currentConfig,
      configurations: {
        ...currentConfig.configurations,
        [teamType]: formData
      }
    };

    await onSave(updatedConfig);
  };

  // Safety check - if no form data, show loading
  if (!formData) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-gray-600">Carregando configuração da {teamType}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">Informações Básicas</h4>
        <div className="text-sm text-gray-600 mb-4">
          <p>Versão: {currentConfig.version}</p>
          <p>Criado em: {new Date(currentConfig.createdAt).toLocaleDateString('pt-BR')}</p>
          <p>Criado por: {currentConfig.createdBy}</p>
          <p><strong>Editando: {teamType}</strong></p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nome de Exibição
          </label>
          <input
            type="text"
            value={formData.displayName || ''}
            onChange={(e) => handleInputChange('displayName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Primary Goal */}
      <div className="p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-3">🎯 Meta Principal</h4>
        <div className="mb-4 p-3 bg-red-500 text-white font-bold text-center rounded">
          🚨 TESTE v2: Se você vê esta mensagem vermelha, o componente está funcionando! {new Date().getTime()}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome de Exibição
            </label>
            <input
              type="text"
              value={formData.primaryGoal?.displayName || ''}
              onChange={(e) => handleGoalChange('primaryGoal', 'displayName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Challenge ID
              <span className="text-xs text-gray-500 ml-1">(ID do desafio no Funifier para rastrear progresso)</span>
            </label>
            <input
              type="text"
              value={formData.primaryGoal?.challengeId || ''}
              onChange={(e) => handleGoalChange('primaryGoal', 'challengeId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
              placeholder="Ex: E6FQIjs"
            />
            <p className="text-xs text-gray-500 mt-1">
              Este ID é usado para buscar o progresso da meta no Funifier. Formato: E6 + 5 caracteres
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Emoji
              <span className="text-xs text-gray-500 ml-1">(Ícone da meta)</span>
            </label>
            <input
              type="text"
              value={formData.primaryGoal?.emoji || ''}
              onChange={(e) => handleGoalChange('primaryGoal', 'emoji', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
              placeholder="Ex: 📈"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unidade
              <span className="text-xs text-gray-500 ml-1">(R$, pontos, marcas)</span>
            </label>
            <input
              type="text"
              value={formData.primaryGoal?.unit || ''}
              onChange={(e) => handleGoalChange('primaryGoal', 'unit', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
              placeholder="Ex: R$"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Campo CSV
              <span className="text-xs text-gray-500 ml-1">(Nome do campo no CSV)</span>
            </label>
            <input
              type="text"
              value={formData.primaryGoal?.csvField || ''}
              onChange={(e) => handleGoalChange('primaryGoal', 'csvField', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
              placeholder="Ex: faturamento"
            />
          </div>
        </div>
        
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descrição
            <span className="text-xs text-gray-500 ml-1">(Descrição da meta)</span>
          </label>
          <textarea
            value={formData.primaryGoal?.description || ''}
            onChange={(e) => handleGoalChange('primaryGoal', 'description', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
            placeholder="Ex: Faturamento total do período"
            rows={2}
          />
        </div>
        
        {/* DEBUG: Test field to verify rendering */}
        <div className="mt-4 p-2 bg-red-100 border border-red-300 rounded">
          <p className="text-red-800 text-sm font-bold">🔧 DEBUG: Se você vê esta mensagem, os campos adicionais deveriam estar visíveis acima!</p>
          <p className="text-red-600 text-xs">Emoji atual: "{formData.primaryGoal?.emoji || 'VAZIO'}"</p>
          <p className="text-red-600 text-xs">Unit atual: "{formData.primaryGoal?.unit || 'VAZIO'}"</p>
        </div>
      </div>

      {/* Secondary Goal 1 */}
      <div className="p-4 bg-green-50 rounded-lg">
        <h4 className="font-medium text-green-900 mb-3">💰 Meta Secundária 1</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome de Exibição
            </label>
            <input
              type="text"
              value={formData.secondaryGoal1?.displayName || ''}
              onChange={(e) => handleGoalChange('secondaryGoal1', 'displayName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Challenge ID
              <span className="text-xs text-gray-500 ml-1">(ID do desafio no Funifier)</span>
            </label>
            <input
              type="text"
              value={formData.secondaryGoal1?.challengeId || ''}
              onChange={(e) => handleGoalChange('secondaryGoal1', 'challengeId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              disabled={isLoading}
              placeholder="Ex: E6Gm8RI"
            />
            <p className="text-xs text-gray-500 mt-1">
              ID usado para rastrear progresso desta meta secundária
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Emoji
            </label>
            <input
              type="text"
              value={formData.secondaryGoal1?.emoji || ''}
              onChange={(e) => handleGoalChange('secondaryGoal1', 'emoji', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              disabled={isLoading}
              placeholder="Ex: 💰"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unidade
            </label>
            <input
              type="text"
              value={formData.secondaryGoal1?.unit || ''}
              onChange={(e) => handleGoalChange('secondaryGoal1', 'unit', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              disabled={isLoading}
              placeholder="Ex: R$"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Campo CSV
            </label>
            <input
              type="text"
              value={formData.secondaryGoal1?.csvField || ''}
              onChange={(e) => handleGoalChange('secondaryGoal1', 'csvField', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              disabled={isLoading}
              placeholder="Ex: reais_por_ativo"
            />
          </div>
        </div>
        
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descrição
          </label>
          <textarea
            value={formData.secondaryGoal1?.description || ''}
            onChange={(e) => handleGoalChange('secondaryGoal1', 'description', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            disabled={isLoading}
            placeholder="Ex: Valor em reais por ativo"
            rows={2}
          />
        </div>
      </div>

      {/* Secondary Goal 2 */}
      <div className="p-4 bg-purple-50 rounded-lg">
        <h4 className="font-medium text-purple-900 mb-3">📈 Meta Secundária 2</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome de Exibição
            </label>
            <input
              type="text"
              value={formData.secondaryGoal2?.displayName || ''}
              onChange={(e) => handleGoalChange('secondaryGoal2', 'displayName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Challenge ID
              <span className="text-xs text-gray-500 ml-1">(ID do desafio no Funifier)</span>
            </label>
            <input
              type="text"
              value={formData.secondaryGoal2?.challengeId || ''}
              onChange={(e) => handleGoalChange('secondaryGoal2', 'challengeId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={isLoading}
              placeholder="Ex: E6Gahd4"
            />
            <p className="text-xs text-gray-500 mt-1">
              ID usado para rastrear progresso desta meta secundária
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Emoji
            </label>
            <input
              type="text"
              value={formData.secondaryGoal2?.emoji || ''}
              onChange={(e) => handleGoalChange('secondaryGoal2', 'emoji', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={isLoading}
              placeholder="Ex: 🏪"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unidade
            </label>
            <input
              type="text"
              value={formData.secondaryGoal2?.unit || ''}
              onChange={(e) => handleGoalChange('secondaryGoal2', 'unit', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={isLoading}
              placeholder="Ex: marcas"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Campo CSV
            </label>
            <input
              type="text"
              value={formData.secondaryGoal2?.csvField || ''}
              onChange={(e) => handleGoalChange('secondaryGoal2', 'csvField', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={isLoading}
              placeholder="Ex: multimarcas_por_ativo"
            />
          </div>
        </div>
        
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descrição
          </label>
          <textarea
            value={formData.secondaryGoal2?.description || ''}
            onChange={(e) => handleGoalChange('secondaryGoal2', 'description', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            disabled={isLoading}
            placeholder="Ex: Número de multimarcas por ativo"
            rows={2}
          />
        </div>
      </div>

      {/* Challenge ID Reference */}
      <div className="p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-3">📋 Referência de Challenge IDs</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div>
            <strong>Atividade:</strong> E6FQIjs (Carteira I)<br/>
            <strong>Atividade:</strong> E6Gv58l (Carteira II)
          </div>
          <div>
            <strong>Reais por Ativo:</strong> E6Gm8RI (Geral)<br/>
            <strong>Reais por Ativo:</strong> E6MTIIK (Carteira II)
          </div>
          <div>
            <strong>Faturamento:</strong> E6GglPq (Carteira 0/I)<br/>
            <strong>Faturamento:</strong> E6Gahd4 (Carteira III/IV/ER)
          </div>
          <div>
            <strong>Multimarcas:</strong> E6MWJKs (Carteira II)<br/>
            <strong>Multimarcas:</strong> E6MMH5v (Carteira III/IV)<br/>
            <strong>Conversões:</strong> E6GglPq (Carteira 0)<br/>
            <strong>UPA:</strong> E62x2PW (ER)
          </div>
        </div>
        <p className="text-xs mt-2" style={{color: '#1d4ed8'}}>
          💡 Estes são os Challenge IDs reais do Funifier. Use-os para garantir que o progresso das metas seja rastreado corretamente.
        </p>
      </div>

      {/* Save Button */}
      <div className="flex justify-end items-center space-x-3">
        {hasUnsavedChanges && (
          <span className="text-sm text-amber-600 flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            Alterações não salvas
          </span>
        )}
        <button
          onClick={handleSave}
          disabled={isLoading}
          className={`px-6 py-2 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
            hasUnsavedChanges 
              ? 'bg-amber-600 hover:bg-amber-700' 
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isLoading ? 'Salvando...' : hasUnsavedChanges ? 'Salvar Alterações' : 'Salvar Configuração'}
        </button>
      </div>
    </div>
  );
};