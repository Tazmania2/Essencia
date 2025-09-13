'use client';

import React, { useState, useEffect } from 'react';
import { TeamType, FunifierPlayerStatus, EssenciaReportRecord } from '../../types';
import { funifierPlayerService } from '../../services/funifier-player.service';
import { funifierDatabaseService } from '../../services/funifier-database.service';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { ErrorNotification } from '../error/ErrorNotification';

interface ExportFilter {
  teams: TeamType[];
  dateRange: {
    start: string;
    end: string;
  };
  includePlayerDetails: boolean;
  includeGoalMetrics: boolean;
  includeBoostStatus: boolean;
  includeLevelProgress: boolean;
}

interface ExportData {
  playerId: string;
  playerName: string;
  team: string;
  totalPoints: number;
  pointsStatus: string;
  atividade?: number;
  reaisPorAtivo?: number;
  faturamento?: number;
  multimarcasPorAtivo?: number;
  currentCycleDay?: number;
  totalCycleDays?: number;
  boostStatus?: string;
  levelProgress?: number;
  totalChallenges?: number;
  catalogItems?: number;
  reportDate?: string;
  lastUpdated?: string;
}

interface DataExportProps {
  className?: string;
}

export const DataExport: React.FC<DataExportProps> = ({ className = '' }) => {
  const [filters, setFilters] = useState<ExportFilter>({
    teams: [],
    dateRange: {
      start: '',
      end: ''
    },
    includePlayerDetails: true,
    includeGoalMetrics: true,
    includeBoostStatus: true,
    includeLevelProgress: false
  });

  const [exportData, setExportData] = useState<ExportData[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exportProgress, setExportProgress] = useState(0);
  const [totalPlayers, setTotalPlayers] = useState(0);

  // Set default date range (last 30 days)
  useEffect(() => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    setFilters(prev => ({
      ...prev,
      dateRange: {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0]
      }
    }));
  }, []);

  // Get team display name
  const getTeamDisplayName = (team: TeamType): string => {
    switch (team) {
      case TeamType.CARTEIRA_I:
        return 'Carteira I';
      case TeamType.CARTEIRA_II:
        return 'Carteira II';
      case TeamType.CARTEIRA_III:
        return 'Carteira III';
      case TeamType.CARTEIRA_IV:
        return 'Carteira IV';
      default:
        return team;
    }
  };

  // Handle team selection
  const handleTeamToggle = (team: TeamType) => {
    setFilters(prev => ({
      ...prev,
      teams: prev.teams.includes(team)
        ? prev.teams.filter(t => t !== team)
        : [...prev.teams, team]
    }));
  };

  // Handle select all teams
  const handleSelectAllTeams = () => {
    const allTeams = Object.values(TeamType);
    setFilters(prev => ({
      ...prev,
      teams: prev.teams.length === allTeams.length ? [] : allTeams
    }));
  };

  // Load and prepare export data
  const loadExportData = async () => {
    setLoading(true);
    setError(null);
    setExportProgress(0);

    try {
      // Get report data from collection
      const reportData = await funifierDatabaseService.getCollectionData();
      
      // Filter by date range
      const filteredReports = reportData.filter(record => {
        const recordDate = new Date(record.reportDate);
        const startDate = new Date(filters.dateRange.start);
        const endDate = new Date(filters.dateRange.end);
        
        return recordDate >= startDate && recordDate <= endDate;
      });

      // Filter by teams if specified
      const teamFilteredReports = filters.teams.length > 0
        ? filteredReports.filter(record => filters.teams.includes(record.team))
        : filteredReports;

      // Get unique players
      const uniquePlayers = new Map<string, EssenciaReportRecord>();
      teamFilteredReports.forEach(record => {
        const existing = uniquePlayers.get(record.playerId);
        if (!existing || new Date(record.updatedAt) > new Date(existing.updatedAt)) {
          uniquePlayers.set(record.playerId, record);
        }
      });

      const playerRecords = Array.from(uniquePlayers.values());
      setTotalPlayers(playerRecords.length);

      // Prepare export data
      const exportDataArray: ExportData[] = [];

      for (let i = 0; i < playerRecords.length; i++) {
        const record = playerRecords[i];
        setExportProgress(Math.round(((i + 1) / playerRecords.length) * 100));

        let playerDetails: FunifierPlayerStatus | null = null;
        
        // Load detailed player data if requested
        if (filters.includePlayerDetails || filters.includeBoostStatus || filters.includeLevelProgress) {
          try {
            playerDetails = await funifierPlayerService.getPlayerStatus(record.playerId);
          } catch (err) {
            console.warn(`Failed to load details for player ${record.playerId}:`, err);
          }
        }

        // Build export data
        const exportItem: ExportData = {
          playerId: record.playerId,
          playerName: record.playerName,
          team: getTeamDisplayName(record.team),
          totalPoints: playerDetails?.total_points || 0,
          pointsStatus: playerDetails 
            ? (funifierPlayerService.extractPointsLockStatus(playerDetails.catalog_items).isUnlocked ? 'Desbloqueados' : 'Bloqueados')
            : 'N/A'
        };

        // Add goal metrics if requested
        if (filters.includeGoalMetrics) {
          exportItem.atividade = record.atividade;
          exportItem.reaisPorAtivo = record.reaisPorAtivo;
          exportItem.faturamento = record.faturamento;
          exportItem.multimarcasPorAtivo = record.multimarcasPorAtivo;
          exportItem.currentCycleDay = record.currentCycleDay;
          exportItem.totalCycleDays = record.totalCycleDays;
        }

        // Add boost status if requested
        if (filters.includeBoostStatus && playerDetails) {
          const boostStatus = funifierPlayerService.extractBoostStatus(playerDetails.catalog_items);
          exportItem.boostStatus = `${boostStatus.totalActiveBoosts}/2 boosts ativos`;
        }

        // Add level progress if requested
        if (filters.includeLevelProgress && playerDetails) {
          exportItem.levelProgress = playerDetails.level_progress?.percent_completed || 0;
        }

        // Add player details if requested
        if (filters.includePlayerDetails && playerDetails) {
          exportItem.totalChallenges = playerDetails.total_challenges;
          exportItem.catalogItems = playerDetails.total_catalog_items;
        }

        // Add timestamps
        exportItem.reportDate = record.reportDate;
        exportItem.lastUpdated = record.updatedAt;

        exportDataArray.push(exportItem);
      }

      setExportData(exportDataArray);
    } catch (err) {
      console.error('Error loading export data:', err);
      setError('Erro ao carregar dados para exportação. Tente novamente.');
    } finally {
      setLoading(false);
      setExportProgress(0);
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    if (exportData.length === 0) {
      setError('Nenhum dado disponível para exportação.');
      return;
    }

    setExporting(true);

    try {
      // Prepare CSV headers
      const headers = [
        'ID do Jogador',
        'Nome do Jogador',
        'Time',
        'Pontos Totais',
        'Status dos Pontos'
      ];

      if (filters.includeGoalMetrics) {
        headers.push(
          'Atividade (%)',
          'Reais por Ativo (%)',
          'Faturamento (%)',
          'Multimarcas por Ativo (%)',
          'Dia do Ciclo',
          'Total de Dias do Ciclo'
        );
      }

      if (filters.includeBoostStatus) {
        headers.push('Status dos Boosts');
      }

      if (filters.includeLevelProgress) {
        headers.push('Progresso do Nível (%)');
      }

      if (filters.includePlayerDetails) {
        headers.push('Total de Desafios', 'Itens do Catálogo');
      }

      headers.push('Data do Relatório', 'Última Atualização');

      // Prepare CSV rows
      const rows = exportData.map(item => {
        const row = [
          item.playerId,
          item.playerName,
          item.team,
          item.totalPoints.toString(),
          item.pointsStatus
        ];

        if (filters.includeGoalMetrics) {
          row.push(
            item.atividade?.toString() || '',
            item.reaisPorAtivo?.toString() || '',
            item.faturamento?.toString() || '',
            item.multimarcasPorAtivo?.toString() || '',
            item.currentCycleDay?.toString() || '',
            item.totalCycleDays?.toString() || ''
          );
        }

        if (filters.includeBoostStatus) {
          row.push(item.boostStatus || '');
        }

        if (filters.includeLevelProgress) {
          row.push(item.levelProgress?.toString() || '');
        }

        if (filters.includePlayerDetails) {
          row.push(
            item.totalChallenges?.toString() || '',
            item.catalogItems?.toString() || ''
          );
        }

        row.push(
          item.reportDate || '',
          item.lastUpdated || ''
        );

        return row;
      });

      // Create CSV content
      const csvContent = [headers, ...rows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `dados_jogadores_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting CSV:', err);
      setError('Erro ao exportar dados. Tente novamente.');
    } finally {
      setExporting(false);
    }
  };

  // Export to JSON
  const exportToJSON = () => {
    if (exportData.length === 0) {
      setError('Nenhum dado disponível para exportação.');
      return;
    }

    setExporting(true);

    try {
      const jsonContent = JSON.stringify({
        exportDate: new Date().toISOString(),
        filters: filters,
        totalRecords: exportData.length,
        data: exportData
      }, null, 2);

      const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `dados_jogadores_${new Date().toISOString().split('T')[0]}.json`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting JSON:', err);
      setError('Erro ao exportar dados. Tente novamente.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Filters Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtros de Exportação</h3>
        
        {/* Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-2">
              Data Inicial
            </label>
            <input
              id="start-date"
              type="date"
              value={filters.dateRange.start}
              onChange={(e) => setFilters(prev => ({
                ...prev,
                dateRange: { ...prev.dateRange, start: e.target.value }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-boticario-pink focus:border-transparent"
            />
          </div>
          
          <div>
            <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-2">
              Data Final
            </label>
            <input
              id="end-date"
              type="date"
              value={filters.dateRange.end}
              onChange={(e) => setFilters(prev => ({
                ...prev,
                dateRange: { ...prev.dateRange, end: e.target.value }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-boticario-pink focus:border-transparent"
            />
          </div>
        </div>

        {/* Team Selection */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700">Times</label>
            <button
              onClick={handleSelectAllTeams}
              className="text-sm text-boticario-pink hover:text-boticario-dark transition-colors"
            >
              {filters.teams.length === Object.values(TeamType).length ? 'Desmarcar Todos' : 'Selecionar Todos'}
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.values(TeamType).map(team => (
              <label key={team} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.teams.includes(team)}
                  onChange={() => handleTeamToggle(team)}
                  className="rounded border-gray-300 text-boticario-pink focus:ring-boticario-pink"
                />
                <span className="text-sm text-gray-700">{getTeamDisplayName(team)}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Data Options */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">Dados a Incluir</label>
          
          <div className="space-y-3">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.includePlayerDetails}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  includePlayerDetails: e.target.checked
                }))}
                className="rounded border-gray-300 text-boticario-pink focus:ring-boticario-pink"
              />
              <span className="text-sm text-gray-700">Detalhes do Jogador (desafios, itens do catálogo)</span>
            </label>
            
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.includeGoalMetrics}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  includeGoalMetrics: e.target.checked
                }))}
                className="rounded border-gray-300 text-boticario-pink focus:ring-boticario-pink"
              />
              <span className="text-sm text-gray-700">Métricas das Metas (atividade, faturamento, etc.)</span>
            </label>
            
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.includeBoostStatus}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  includeBoostStatus: e.target.checked
                }))}
                className="rounded border-gray-300 text-boticario-pink focus:ring-boticario-pink"
              />
              <span className="text-sm text-gray-700">Status dos Boosts</span>
            </label>
            
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.includeLevelProgress}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  includeLevelProgress: e.target.checked
                }))}
                className="rounded border-gray-300 text-boticario-pink focus:ring-boticario-pink"
              />
              <span className="text-sm text-gray-700">Progresso de Nível</span>
            </label>
          </div>
        </div>

        {/* Load Data Button */}
        <button
          onClick={loadExportData}
          disabled={loading}
          className="w-full md:w-auto inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-lg text-sm font-medium text-white bg-boticario-pink hover:bg-boticario-dark focus:outline-none focus:ring-2 focus:ring-boticario-pink focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              Carregando Dados...
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Carregar Dados
            </>
          )}
        </button>
      </div>

      {/* Progress Bar */}
      {loading && exportProgress > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Carregando dados dos jogadores...</span>
            <span className="text-sm text-gray-500">{exportProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-boticario-pink h-2 rounded-full transition-all duration-300"
              style={{ width: `${exportProgress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Processando {totalPlayers} jogadores...
          </p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <ErrorNotification
          message={error}
          onClose={() => setError(null)}
        />
      )}

      {/* Export Results */}
      {exportData.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Dados Prontos para Exportação</h3>
              <p className="text-sm text-gray-600">{exportData.length} registros encontrados</p>
            </div>
          </div>

          {/* Preview Table */}
          <div className="overflow-x-auto mb-6">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Jogador
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pontos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  {filters.includeGoalMetrics && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Metas
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {exportData.slice(0, 5).map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{item.playerName}</div>
                        <div className="text-sm text-gray-500">{item.playerId}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.team}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.totalPoints.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        item.pointsStatus === 'Desbloqueados' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {item.pointsStatus}
                      </span>
                    </td>
                    {filters.includeGoalMetrics && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {[item.atividade, item.reaisPorAtivo, item.faturamento, item.multimarcasPorAtivo]
                          .filter(val => val !== undefined)
                          .map(val => `${val}%`)
                          .join(', ') || 'N/A'}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            
            {exportData.length > 5 && (
              <div className="text-center py-3 text-sm text-gray-500">
                ... e mais {exportData.length - 5} registros
              </div>
            )}
          </div>

          {/* Export Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={exportToCSV}
              disabled={exporting}
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {exporting ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : (
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              )}
              Exportar CSV
            </button>
            
            <button
              onClick={exportToJSON}
              disabled={exporting}
              className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-boticario-pink focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {exporting ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : (
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              )}
              Exportar JSON
            </button>
          </div>
        </div>
      )}
    </div>
  );
};