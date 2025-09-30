'use client';

import React, { useState, useEffect } from 'react';
import { DashboardConfig, TeamType, DashboardMetricConfig, BoostConfig } from '../../types';
import { CarteiraIISpecialValidator } from './CarteiraIISpecialValidator';
import { CarteiraIIWarningBanner } from './CarteiraIIBadge';

interface MetricConfigurationFormProps {
  teamType: TeamType;
  configuration: DashboardConfig;
  onChange: (newConfiguration: DashboardConfig) => void;
}

export const MetricConfigurationForm: React.FC<MetricConfigurationFormProps> = ({
  teamType,
  configuration,
  onChange
}) => {
  const [formData, setFormData] = useState<DashboardConfig>(configuration);

  useEffect(() => {
    setFormData(configuration);
  }, [configuration]);

  const handleMetricChange = (
    goalType: 'primaryGoal' | 'secondaryGoal1' | 'secondaryGoal2',
    field: keyof DashboardMetricConfig,
    value: string
  ) => {
    const updatedConfig = {
      ...formData,
      [goalType]: {
        ...formData[goalType],
        [field]: value
      }
    };
    setFormData(updatedConfig);
    onChange(updatedConfig);
  };

  const handleBoostChange = (
    goalType: 'secondaryGoal1' | 'secondaryGoal2',
    field: keyof BoostConfig,
    value: string
  ) => {
    const updatedConfig = {
      ...formData,
      [goalType]: {
        ...formData[goalType],
        boost: {
          ...formData[goalType].boost,
          [field]: value
        }
      }
    };
    setFormData(updatedConfig);
    onChange(updatedConfig);
  };

  const handleUnlockConditionsChange = (field: string, value: string) => {
    const updatedConfig = {
      ...formData,
      unlockConditions: {
        ...formData.unlockConditions,
        [field]: value
      }
    };
    setFormData(updatedConfig);
    onChange(updatedConfig);
  };

  const isCarteiraII = teamType === TeamType.CARTEIRA_II;

  const metricOptions = [
    { value: 'atividade', label: 'Atividade', emoji: '🎯', unit: 'pontos' },
    { value: 'reaisPorAtivo', label: 'Reais por Ativo', emoji: '💰', unit: 'R$' },
    { value: 'faturamento', label: 'Faturamento', emoji: '📈', unit: 'R$' },
    { value: 'multimarcasPorAtivo', label: 'Multimarcas por Ativo', emoji: '🏷️', unit: 'marcas' },
    { value: 'conversoes', label: 'Conversões', emoji: '🎯', unit: 'conversões' },
    { value: 'upa', label: 'UPA', emoji: '📊', unit: 'UPA' }
  ];

  const emojiOptions = ['🎯', '💰', '📈', '🏷️', '📊', '🔥', '⭐', '🚀', '💎', '🏆'];

  return (
    <div className="space-y-6">
      {/* Special Processing Warning for Carteira II */}
      {isCarteiraII && (
        <>
          <CarteiraIIWarningBanner />
          <CarteiraIISpecialValidator 
            configuration={formData}
            onValidationChange={(isValid, warnings) => {
              // You can handle validation state here if needed
              console.log('Carteira II validation:', { isValid, warnings });
            }}
          />
        </>
      )}

      {/* Primary Goal Configuration */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
          <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
          Meta Principal
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Métrica
            </label>
            <select
              value={formData.primaryGoal.name}
              onChange={(e) => {
                const selectedMetric = metricOptions.find(m => m.value === e.target.value);
                if (selectedMetric) {
                  handleMetricChange('primaryGoal', 'name', selectedMetric.value);
                  handleMetricChange('primaryGoal', 'displayName', selectedMetric.label);
                  handleMetricChange('primaryGoal', 'emoji', selectedMetric.emoji);
                  handleMetricChange('primaryGoal', 'unit', selectedMetric.unit);
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-boticario-pink focus:border-transparent"
            >
              {metricOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.emoji} {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome de Exibição
            </label>
            <input
              type="text"
              value={formData.primaryGoal.displayName}
              onChange={(e) => handleMetricChange('primaryGoal', 'displayName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-boticario-pink focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Emoji
            </label>
            <select
              value={formData.primaryGoal.emoji}
              onChange={(e) => handleMetricChange('primaryGoal', 'emoji', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-boticario-pink focus:border-transparent"
            >
              {emojiOptions.map((emoji) => (
                <option key={emoji} value={emoji}>
                  {emoji}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Unidade
            </label>
            <input
              type="text"
              value={formData.primaryGoal.unit}
              onChange={(e) => handleMetricChange('primaryGoal', 'unit', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-boticario-pink focus:border-transparent"
              placeholder="Ex: R$, pontos, marcas"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Challenge ID
            </label>
            <input
              type="text"
              value={formData.primaryGoal.challengeId}
              onChange={(e) => handleMetricChange('primaryGoal', 'challengeId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-boticario-pink focus:border-transparent"
              placeholder="Ex: E6FQIjs"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Action ID
            </label>
            <input
              type="text"
              value={formData.primaryGoal.actionId}
              onChange={(e) => handleMetricChange('primaryGoal', 'actionId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-boticario-pink focus:border-transparent"
              placeholder="Ex: atividade"
            />
          </div>
        </div>
      </div>

      {/* Secondary Goal 1 Configuration */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
          <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
          Meta Secundária 1 (com Boost)
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Métrica
            </label>
            <select
              value={formData.secondaryGoal1.name}
              onChange={(e) => {
                const selectedMetric = metricOptions.find(m => m.value === e.target.value);
                if (selectedMetric) {
                  handleMetricChange('secondaryGoal1', 'name', selectedMetric.value);
                  handleMetricChange('secondaryGoal1', 'displayName', selectedMetric.label);
                  handleMetricChange('secondaryGoal1', 'emoji', selectedMetric.emoji);
                  handleMetricChange('secondaryGoal1', 'unit', selectedMetric.unit);
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-boticario-pink focus:border-transparent"
            >
              {metricOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.emoji} {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome de Exibição
            </label>
            <input
              type="text"
              value={formData.secondaryGoal1.displayName}
              onChange={(e) => handleMetricChange('secondaryGoal1', 'displayName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-boticario-pink focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Challenge ID
            </label>
            <input
              type="text"
              value={formData.secondaryGoal1.challengeId}
              onChange={(e) => handleMetricChange('secondaryGoal1', 'challengeId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-boticario-pink focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Action ID
            </label>
            <input
              type="text"
              value={formData.secondaryGoal1.actionId}
              onChange={(e) => handleMetricChange('secondaryGoal1', 'actionId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-boticario-pink focus:border-transparent"
            />
          </div>
        </div>

        {/* Boost Configuration */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <h5 className="font-medium text-green-800 mb-3">🚀 Configuração do Boost</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-green-700 mb-1">
                Catalog Item ID
              </label>
              <input
                type="text"
                value={formData.secondaryGoal1.boost.catalogItemId}
                onChange={(e) => handleBoostChange('secondaryGoal1', 'catalogItemId', e.target.value)}
                className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-green-700 mb-1">
                Nome do Boost
              </label>
              <input
                type="text"
                value={formData.secondaryGoal1.boost.name}
                onChange={(e) => handleBoostChange('secondaryGoal1', 'name', e.target.value)}
                className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="mt-3">
            <label className="block text-sm font-medium text-green-700 mb-1">
              Descrição
            </label>
            <textarea
              value={formData.secondaryGoal1.boost.description}
              onChange={(e) => handleBoostChange('secondaryGoal1', 'description', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Secondary Goal 2 Configuration */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
          <span className="w-3 h-3 bg-purple-500 rounded-full mr-2"></span>
          Meta Secundária 2 (com Boost)
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Métrica
            </label>
            <select
              value={formData.secondaryGoal2.name}
              onChange={(e) => {
                const selectedMetric = metricOptions.find(m => m.value === e.target.value);
                if (selectedMetric) {
                  handleMetricChange('secondaryGoal2', 'name', selectedMetric.value);
                  handleMetricChange('secondaryGoal2', 'displayName', selectedMetric.label);
                  handleMetricChange('secondaryGoal2', 'emoji', selectedMetric.emoji);
                  handleMetricChange('secondaryGoal2', 'unit', selectedMetric.unit);
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-boticario-pink focus:border-transparent"
            >
              {metricOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.emoji} {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome de Exibição
            </label>
            <input
              type="text"
              value={formData.secondaryGoal2.displayName}
              onChange={(e) => handleMetricChange('secondaryGoal2', 'displayName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-boticario-pink focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Challenge ID
            </label>
            <input
              type="text"
              value={formData.secondaryGoal2.challengeId}
              onChange={(e) => handleMetricChange('secondaryGoal2', 'challengeId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-boticario-pink focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Action ID
            </label>
            <input
              type="text"
              value={formData.secondaryGoal2.actionId}
              onChange={(e) => handleMetricChange('secondaryGoal2', 'actionId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-boticario-pink focus:border-transparent"
            />
          </div>
        </div>

        {/* Boost Configuration */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
          <h5 className="font-medium text-purple-800 mb-3">🚀 Configuração do Boost</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-purple-700 mb-1">
                Catalog Item ID
              </label>
              <input
                type="text"
                value={formData.secondaryGoal2.boost.catalogItemId}
                onChange={(e) => handleBoostChange('secondaryGoal2', 'catalogItemId', e.target.value)}
                className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-purple-700 mb-1">
                Nome do Boost
              </label>
              <input
                type="text"
                value={formData.secondaryGoal2.boost.name}
                onChange={(e) => handleBoostChange('secondaryGoal2', 'name', e.target.value)}
                className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="mt-3">
            <label className="block text-sm font-medium text-purple-700 mb-1">
              Descrição
            </label>
            <textarea
              value={formData.secondaryGoal2.boost.description}
              onChange={(e) => handleBoostChange('secondaryGoal2', 'description', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Unlock Conditions */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
          <span className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
          Condições de Desbloqueio
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Catalog Item ID
            </label>
            <input
              type="text"
              value={formData.unlockConditions.catalogItemId}
              onChange={(e) => handleUnlockConditionsChange('catalogItemId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-boticario-pink focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição
            </label>
            <input
              type="text"
              value={formData.unlockConditions.description}
              onChange={(e) => handleUnlockConditionsChange('description', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-boticario-pink focus:border-transparent"
            />
          </div>
        </div>
      </div>
    </div>
  );
};