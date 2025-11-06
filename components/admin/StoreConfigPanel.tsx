'use client';

import React, { useState, useEffect } from 'react';
import { storeService } from '../../services/store.service';
import { pointsService } from '../../services/points.service';
import { virtualGoodsService } from '../../services/virtual-goods.service';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { 
  StoreConfiguration, 
  LevelConfiguration, 
  Point, 
  Catalog,
  STORE_ERROR_MESSAGES 
} from '../../types';

interface StoreConfigPanelProps {
  onClose?: () => void;
}

export const StoreConfigPanel: React.FC<StoreConfigPanelProps> = ({ onClose }) => {
  // State for configuration
  const [configuration, setConfiguration] = useState<StoreConfiguration | null>(null);
  const [availablePoints, setAvailablePoints] = useState<Point[]>([]);
  const [availableCatalogs, setAvailableCatalogs] = useState<Catalog[]>([]);
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load data on mount
  useEffect(() => {
    loadConfigurationData();
  }, []);

  const loadConfigurationData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all required data in parallel
      const [config, points, catalogs] = await Promise.all([
        storeService.getStoreConfiguration(),
        pointsService.getAvailablePoints(),
        virtualGoodsService.getCatalogs()
      ]);

      setConfiguration(config);
      setAvailablePoints(points);
      
      // Merge fetched catalogs with saved configuration
      const mergedLevels = mergeCatalogsWithConfig(catalogs, config.levels);
      setConfiguration({ ...config, levels: mergedLevels });
      setAvailableCatalogs(catalogs);

    } catch (err) {
      console.error('Error loading store configuration:', err);
      setError(STORE_ERROR_MESSAGES.FETCH_CONFIG_FAILED);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Merge fetched catalogs with saved configuration
   * Ensures all catalogs are represented in the configuration
   */
  const mergeCatalogsWithConfig = (
    catalogs: Catalog[], 
    existingLevels: LevelConfiguration[]
  ): LevelConfiguration[] => {
    const levelMap = new Map(existingLevels.map(level => [level.catalogId, level]));
    
    return catalogs.map((catalog, index) => {
      const existing = levelMap.get(catalog._id);
      
      if (existing) {
        return existing;
      }
      
      // Create new level configuration for catalogs not in saved config
      return {
        catalogId: catalog._id,
        levelNumber: existingLevels.length + index + 1,
        levelName: catalog.catalog || `Nível ${existingLevels.length + index + 1}`,
        visible: false
      };
    });
  };

  const handleCurrencyChange = (currencyId: string) => {
    if (!configuration) return;
    
    setConfiguration({
      ...configuration,
      currencyId
    });
  };

  const handleCurrencyNameChange = (currencyName: string) => {
    if (!configuration) return;
    
    setConfiguration({
      ...configuration,
      currencyName
    });
  };

  const handleGrayOutLockedChange = (checked: boolean) => {
    if (!configuration) return;
    
    setConfiguration({
      ...configuration,
      grayOutLocked: checked
    });
  };

  const handleLevelChange = (catalogId: string, field: keyof LevelConfiguration, value: any) => {
    if (!configuration) return;
    
    const updatedLevels = configuration.levels.map(level => {
      if (level.catalogId === catalogId) {
        return { ...level, [field]: value };
      }
      return level;
    });
    
    setConfiguration({
      ...configuration,
      levels: updatedLevels
    });
  };

  const handleSave = async () => {
    if (!configuration) return;
    
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      // Validate configuration
      if (!storeService.validateConfiguration(configuration)) {
        setError(STORE_ERROR_MESSAGES.INVALID_CONFIGURATION);
        return;
      }

      // Save configuration
      await storeService.saveStoreConfiguration(configuration);
      
      setSuccessMessage('Configuração salva com sucesso!');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);

    } catch (err) {
      console.error('Error saving store configuration:', err);
      setError(STORE_ERROR_MESSAGES.SAVE_CONFIG_FAILED);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (!configuration) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <div className="text-center py-12">
          <p className="text-red-600">Erro ao carregar configuração</p>
          <button
            onClick={loadConfigurationData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Configuração da Loja</h2>
            <p className="text-gray-600">Configure moedas, catálogos e opções de exibição</p>
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

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-green-800">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Currency Settings */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">💰 Configurações de Moeda</h3>
        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Moeda
            </label>
            <select
              value={configuration.currencyId}
              onChange={(e) => handleCurrencyChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 bg-white"
            >
              {availablePoints.map(point => (
                <option key={point._id} value={point._id}>
                  {point.category} ({point._id})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome de Exibição da Moeda
            </label>
            <input
              type="text"
              value={configuration.currencyName}
              onChange={(e) => handleCurrencyNameChange(e.target.value)}
              placeholder="Ex: Moedas, Pontos, Créditos"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Display Options */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🎨 Opções de Exibição</h3>
        <div className="bg-gray-50 rounded-lg p-4">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={configuration.grayOutLocked}
              onChange={(e) => handleGrayOutLockedChange(e.target.checked)}
              className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            <div>
              <span className="text-sm font-medium text-gray-900">
                Desbotar itens bloqueados
              </span>
              <p className="text-xs text-gray-600">
                Itens de níveis superiores serão exibidos com opacidade reduzida
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Catalog Configuration */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📚 Configuração de Catálogos</h3>
        <p className="text-sm text-gray-600 mb-3">
          Configure o item de desbloqueio para cada nível. Jogadores só verão itens de níveis cujo item de desbloqueio eles possuem. Deixe em branco para níveis sempre acessíveis.
        </p>
        <div className="bg-gray-50 rounded-lg p-4 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-300">
                <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">ID do Catálogo</th>
                <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">Nível</th>
                <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">Nome</th>
                <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">Item de Desbloqueio</th>
                <th className="text-center py-3 px-2 text-sm font-semibold text-gray-700">Visível</th>
              </tr>
            </thead>
            <tbody>
              {configuration.levels
                .sort((a, b) => a.levelNumber - b.levelNumber)
                .map((level) => (
                  <tr key={level.catalogId} className="border-b border-gray-200 last:border-b-0">
                    <td className="py-3 px-2 text-sm text-gray-900">{level.catalogId}</td>
                    <td className="py-3 px-2">
                      <input
                        type="number"
                        value={level.levelNumber}
                        onChange={(e) => handleLevelChange(level.catalogId, 'levelNumber', parseInt(e.target.value) || 0)}
                        min="0"
                        className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm text-gray-900 bg-white"
                      />
                    </td>
                    <td className="py-3 px-2">
                      <input
                        type="text"
                        value={level.levelName}
                        onChange={(e) => handleLevelChange(level.catalogId, 'levelName', e.target.value)}
                        placeholder="Nome do nível"
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                      />
                    </td>
                    <td className="py-3 px-2">
                      <input
                        type="text"
                        value={level.unlockItemId || ''}
                        onChange={(e) => handleLevelChange(level.catalogId, 'unlockItemId', e.target.value)}
                        placeholder="Ex: E6F0O5f (opcional)"
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                      />
                    </td>
                    <td className="py-3 px-2 text-center">
                      <input
                        type="checkbox"
                        checked={level.visible}
                        onChange={(e) => handleLevelChange(level.catalogId, 'visible', e.target.checked)}
                        className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end space-x-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {saving ? (
            <>
              <LoadingSpinner size="sm" />
              <span>Salvando...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              <span>Salvar Configuração</span>
            </>
          )}
        </button>
      </div>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex">
          <svg className="w-5 h-5 text-blue-400 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h4 className="text-sm font-medium text-blue-800">Informações</h4>
            <p className="text-sm text-blue-700 mt-1">
              As alterações serão aplicadas imediatamente após salvar. Os jogadores verão a nova configuração na próxima vez que acessarem a loja.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
