'use client';

import React, { useState, useEffect } from 'react';
import { DashboardConfigurationRecord, TeamType, ValidationResult } from '../../types';
import { dashboardConfigurationService } from '../../services/dashboard-configuration.service';
import { configurationValidator } from '../../services/configuration-validator.service';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { MetricConfigurationForm } from './MetricConfigurationForm';
import { ConfigurationPreview } from './ConfigurationPreview';
import { CarteiraIIWarningModal } from './CarteiraIIWarningModal';
import { ConfigurationManagementInterface } from './ConfigurationManagementInterface';

interface DashboardConfigurationPanelProps {
  onConfigurationSaved?: (config: DashboardConfigurationRecord) => void;
}

export const DashboardConfigurationPanel: React.FC<DashboardConfigurationPanelProps> = ({
  onConfigurationSaved
}) => {
  const [currentConfig, setCurrentConfig] = useState<DashboardConfigurationRecord | null>(null);
  const [editingConfig, setEditingConfig] = useState<DashboardConfigurationRecord | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<TeamType>(TeamType.CARTEIRA_I);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [showCarteiraIIWarning, setShowCarteiraIIWarning] = useState(false);
  const [pendingCarteiraIIChanges, setPendingCarteiraIIChanges] = useState<any>(null);

  useEffect(() => {
    loadCurrentConfiguration();
  }, []);

  const loadCurrentConfiguration = async () => {
    try {
      setLoading(true);
      setError(null);
      const config = await dashboardConfigurationService.getCurrentConfiguration();
      setCurrentConfig(config);
      setEditingConfig(JSON.parse(JSON.stringify(config))); // Deep clone
    } catch (err) {
      console.error('Error loading configuration:', err);
      setError('Erro ao carregar configuração atual');
    } finally {
      setLoading(false);
    }
  };

  const handleTeamConfigurationChange = (teamType: TeamType, newConfig: any) => {
    if (!editingConfig) return;

    // Check if this is Carteira II and show warning
    if (teamType === TeamType.CARTEIRA_II) {
      setPendingCarteiraIIChanges({ teamType, newConfig });
      setShowCarteiraIIWarning(true);
      return;
    }

    // Apply changes for other teams
    applyTeamConfigurationChange(teamType, newConfig);
  };

  const applyTeamConfigurationChange = (teamType: TeamType, newConfig: any) => {
    if (!editingConfig) return;

    const updatedConfig = {
      ...editingConfig,
      configurations: {
        ...editingConfig.configurations,
        [teamType]: newConfig
      }
    };

    setEditingConfig(updatedConfig);
    validateConfiguration(updatedConfig);
  };

  const handleCarteiraIIConfirm = () => {
    if (pendingCarteiraIIChanges) {
      applyTeamConfigurationChange(
        pendingCarteiraIIChanges.teamType,
        pendingCarteiraIIChanges.newConfig
      );
    }
    setShowCarteiraIIWarning(false);
    setPendingCarteiraIIChanges(null);
  };

  const handleCarteiraIICancel = () => {
    setShowCarteiraIIWarning(false);
    setPendingCarteiraIIChanges(null);
  };

  const validateConfiguration = async (config: DashboardConfigurationRecord) => {
    try {
      const result = await configurationValidator.validateConfiguration(config);
      setValidationResult(result);
    } catch (err) {
      console.error('Error validating configuration:', err);
      setValidationResult({
        isValid: false,
        errors: [{ field: 'general', message: 'Erro na validação', severity: 'error' }],
        warnings: []
      });
    }
  };

  const handleSaveConfiguration = async () => {
    if (!editingConfig || !validationResult?.isValid) return;

    try {
      setSaving(true);
      setError(null);

      const configToSave = {
        ...editingConfig,
        version: (currentConfig?.version || 0) + 1,
        createdAt: new Date().toISOString(),
        createdBy: 'admin', // TODO: Get from auth context
        isActive: true
      };

      await dashboardConfigurationService.saveConfiguration(configToSave);
      setCurrentConfig(configToSave);
      onConfigurationSaved?.(configToSave);
      
      // Show success message
      setError(null);
    } catch (err) {
      console.error('Error saving configuration:', err);
      setError('Erro ao salvar configuração');
    } finally {
      setSaving(false);
    }
  };

  const handleResetChanges = () => {
    if (currentConfig) {
      setEditingConfig(JSON.parse(JSON.stringify(currentConfig)));
      setValidationResult(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600">Carregando configuração...</span>
      </div>
    );
  }

  if (error && !editingConfig) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-red-800">{error}</span>
        </div>
        <button 
          onClick={loadCurrentConfiguration}
          className="mt-3 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  const teamOptions = [
    { value: TeamType.CARTEIRA_0, label: 'Carteira 0' },
    { value: TeamType.CARTEIRA_I, label: 'Carteira I' },
    { value: TeamType.CARTEIRA_II, label: 'Carteira II (Processamento Especial)' },
    { value: TeamType.CARTEIRA_III, label: 'Carteira III' },
    { value: TeamType.CARTEIRA_IV, label: 'Carteira IV' },
    { value: TeamType.ER, label: 'ER' }
  ];

  const hasChanges = editingConfig && currentConfig && 
    JSON.stringify(editingConfig.configurations) !== JSON.stringify(currentConfig.configurations);

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
          <div className="flex items-center space-x-3">
            {hasChanges && (
              <button
                onClick={handleResetChanges}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Descartar Alterações
              </button>
            )}
            <button
              onClick={handleSaveConfiguration}
              disabled={!hasChanges || !validationResult?.isValid || saving}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                hasChanges && validationResult?.isValid && !saving
                  ? 'bg-boticario-pink text-white hover:bg-boticario-purple'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {saving ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Salvando...
                </>
              ) : (
                'Salvar Configuração'
              )}
            </button>
          </div>
        </div>

        {/* Validation Results */}
        {validationResult && (
          <div className="mt-4">
            {validationResult.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-3">
                <h4 className="font-medium text-red-800 mb-2">Erros de Validação:</h4>
                <ul className="space-y-1">
                  {validationResult.errors.map((error, index) => (
                    <li key={index} className="text-sm text-red-700">
                      • {error.field}: {error.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {validationResult.warnings.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800 mb-2">Avisos:</h4>
                <ul className="space-y-1">
                  {validationResult.warnings.map((warning, index) => (
                    <li key={index} className="text-sm text-yellow-700">
                      • {warning.field}: {warning.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}
      </div>

      {/* Team Selection */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Selecionar Dashboard</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {teamOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setSelectedTeam(option.value)}
              className={`p-3 rounded-lg text-sm font-medium transition-colors ${
                selectedTeam === option.value
                  ? 'bg-boticario-pink text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } ${option.value === TeamType.CARTEIRA_II ? 'border-2 border-orange-300' : ''}`}
            >
              {option.label}
              {option.value === TeamType.CARTEIRA_II && (
                <div className="text-xs mt-1 opacity-75">⚠️ Especial</div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Configuration Forms */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration Form */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Configurar {teamOptions.find(t => t.value === selectedTeam)?.label}
          </h3>
          
          {editingConfig && (
            <MetricConfigurationForm
              teamType={selectedTeam}
              configuration={editingConfig.configurations[selectedTeam]}
              onChange={(newConfig) => handleTeamConfigurationChange(selectedTeam, newConfig)}
            />
          )}
        </div>

        {/* Configuration Preview */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Visualização</h3>
          
          {editingConfig && (
            <ConfigurationPreview
              configuration={editingConfig.configurations[selectedTeam]}
            />
          )}
        </div>
      </div>

      {/* Configuration Management Interface */}
      <ConfigurationManagementInterface
        currentConfiguration={currentConfig}
        onConfigurationChange={(config) => {
          setCurrentConfig(config);
          setEditingConfig(JSON.parse(JSON.stringify(config)));
          onConfigurationSaved?.(config);
        }}
      />

      {/* Carteira II Warning Modal */}
      {showCarteiraIIWarning && (
        <CarteiraIIWarningModal
          onConfirm={handleCarteiraIIConfirm}
          onCancel={handleCarteiraIICancel}
        />
      )}
    </div>
  );
};