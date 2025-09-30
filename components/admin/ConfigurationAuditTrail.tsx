'use client';

import React, { useState, useEffect } from 'react';
import { DashboardConfigurationRecord, TeamType } from '../../types';

interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: 'create' | 'update' | 'rollback' | 'import' | 'export';
  userId: string;
  configurationVersion: number;
  changes?: ConfigurationChange[];
  metadata?: Record<string, any>;
}

interface ConfigurationChange {
  teamType: TeamType;
  field: string;
  oldValue: any;
  newValue: any;
  changeType: 'added' | 'modified' | 'removed';
}

interface ConfigurationAuditTrailProps {
  configurationHistory: DashboardConfigurationRecord[];
}

export const ConfigurationAuditTrail: React.FC<ConfigurationAuditTrailProps> = ({
  configurationHistory
}) => {
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    generateAuditLog();
  }, [configurationHistory]);

  const generateAuditLog = () => {
    const log: AuditLogEntry[] = [];

    // Sort configurations by creation date
    const sortedConfigs = [...configurationHistory].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    sortedConfigs.forEach((config, index) => {
      const isFirst = index === 0;
      const previousConfig = isFirst ? null : sortedConfigs[index - 1];

      // Determine action type
      let action: AuditLogEntry['action'] = 'create';
      if (!isFirst && previousConfig) {
        action = 'update'; // Could be refined to detect rollback/import
      }

      // Generate changes if not the first configuration
      const changes: ConfigurationChange[] = [];
      if (previousConfig) {
        changes.push(...detectChanges(previousConfig, config));
      }

      const entry: AuditLogEntry = {
        id: config._id,
        timestamp: config.createdAt,
        action,
        userId: config.createdBy,
        configurationVersion: config.version,
        changes: changes.length > 0 ? changes : undefined,
        metadata: {
          isActive: config.isActive,
          teamCount: Object.keys(config.configurations).length,
          hasCarteiraII: 'CARTEIRA_II' in config.configurations
        }
      };

      log.push(entry);
    });

    setAuditLog(log.reverse()); // Most recent first
  };

  const detectChanges = (
    oldConfig: DashboardConfigurationRecord,
    newConfig: DashboardConfigurationRecord
  ): ConfigurationChange[] => {
    const changes: ConfigurationChange[] = [];

    // Compare each team configuration
    const allTeamTypes = new Set([
      ...Object.keys(oldConfig.configurations),
      ...Object.keys(newConfig.configurations)
    ]);

    allTeamTypes.forEach(teamType => {
      const oldTeamConfig = oldConfig.configurations[teamType as TeamType];
      const newTeamConfig = newConfig.configurations[teamType as TeamType];

      if (!oldTeamConfig && newTeamConfig) {
        // Team added
        changes.push({
          teamType: teamType as TeamType,
          field: 'team',
          oldValue: null,
          newValue: newTeamConfig.displayName,
          changeType: 'added'
        });
      } else if (oldTeamConfig && !newTeamConfig) {
        // Team removed
        changes.push({
          teamType: teamType as TeamType,
          field: 'team',
          oldValue: oldTeamConfig.displayName,
          newValue: null,
          changeType: 'removed'
        });
      } else if (oldTeamConfig && newTeamConfig) {
        // Compare team configurations
        changes.push(...compareTeamConfigurations(teamType as TeamType, oldTeamConfig, newTeamConfig));
      }
    });

    return changes;
  };

  const compareTeamConfigurations = (
    teamType: TeamType,
    oldConfig: any,
    newConfig: any
  ): ConfigurationChange[] => {
    const changes: ConfigurationChange[] = [];

    // Compare primary goal
    if (JSON.stringify(oldConfig.primaryGoal) !== JSON.stringify(newConfig.primaryGoal)) {
      changes.push({
        teamType,
        field: 'primaryGoal',
        oldValue: oldConfig.primaryGoal.displayName,
        newValue: newConfig.primaryGoal.displayName,
        changeType: 'modified'
      });
    }

    // Compare secondary goals
    if (JSON.stringify(oldConfig.secondaryGoal1) !== JSON.stringify(newConfig.secondaryGoal1)) {
      changes.push({
        teamType,
        field: 'secondaryGoal1',
        oldValue: oldConfig.secondaryGoal1.displayName,
        newValue: newConfig.secondaryGoal1.displayName,
        changeType: 'modified'
      });
    }

    if (JSON.stringify(oldConfig.secondaryGoal2) !== JSON.stringify(newConfig.secondaryGoal2)) {
      changes.push({
        teamType,
        field: 'secondaryGoal2',
        oldValue: oldConfig.secondaryGoal2.displayName,
        newValue: newConfig.secondaryGoal2.displayName,
        changeType: 'modified'
      });
    }

    return changes;
  };

  const getActionIcon = (action: AuditLogEntry['action']) => {
    switch (action) {
      case 'create':
        return '✨';
      case 'update':
        return '✏️';
      case 'rollback':
        return '↩️';
      case 'import':
        return '📥';
      case 'export':
        return '📤';
      default:
        return '📝';
    }
  };

  const getActionLabel = (action: AuditLogEntry['action']) => {
    switch (action) {
      case 'create':
        return 'Criação';
      case 'update':
        return 'Atualização';
      case 'rollback':
        return 'Reversão';
      case 'import':
        return 'Importação';
      case 'export':
        return 'Exportação';
      default:
        return 'Modificação';
    }
  };

  const getChangeTypeColor = (changeType: ConfigurationChange['changeType']) => {
    switch (changeType) {
      case 'added':
        return 'text-green-700 bg-green-100';
      case 'modified':
        return 'text-blue-700 bg-blue-100';
      case 'removed':
        return 'text-red-700 bg-red-100';
      default:
        return 'text-gray-700 bg-gray-100';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const handleViewDetails = (entry: AuditLogEntry) => {
    setSelectedEntry(entry);
    setShowDetails(true);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">🔍 Trilha de Auditoria</h3>
        <p className="text-gray-600 text-sm">
          Histórico detalhado de todas as mudanças nas configurações do sistema.
        </p>
      </div>

      {/* Audit Log */}
      {auditLog.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p>Nenhuma entrada de auditoria encontrada</p>
        </div>
      ) : (
        <div className="space-y-3">
          {auditLog.map((entry) => (
            <div
              key={entry.id}
              className="border border-gray-200 rounded-lg p-4 bg-white hover:border-gray-300 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-2xl">{getActionIcon(entry.action)}</span>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {getActionLabel(entry.action)} - Versão {entry.configurationVersion}
                      </h4>
                      <div className="text-sm text-gray-600">
                        {formatDate(entry.timestamp)} por {entry.userId}
                      </div>
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                    <span>🎯 {entry.metadata?.teamCount} dashboards</span>
                    {entry.metadata?.hasCarteiraII && (
                      <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs">
                        ⚠️ Carteira II
                      </span>
                    )}
                    {entry.metadata?.isActive && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                        Ativa
                      </span>
                    )}
                  </div>

                  {/* Changes Summary */}
                  {entry.changes && entry.changes.length > 0 && (
                    <div className="mb-3">
                      <div className="text-sm font-medium text-gray-700 mb-2">
                        Mudanças ({entry.changes.length}):
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {entry.changes.slice(0, 3).map((change, index) => (
                          <span
                            key={index}
                            className={`px-2 py-1 rounded text-xs font-medium ${getChangeTypeColor(change.changeType)}`}
                          >
                            {change.teamType} - {change.field}
                          </span>
                        ))}
                        {entry.changes.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                            +{entry.changes.length - 3} mais
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleViewDetails(entry)}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Ver Detalhes
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Details Modal */}
      {showDetails && selectedEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <span className="text-3xl">{getActionIcon(selectedEntry.action)}</span>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {getActionLabel(selectedEntry.action)} - Versão {selectedEntry.configurationVersion}
                    </h3>
                    <p className="text-gray-600">
                      {formatDate(selectedEntry.timestamp)} por {selectedEntry.userId}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Detailed Changes */}
              {selectedEntry.changes && selectedEntry.changes.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Mudanças Detalhadas:</h4>
                  <div className="space-y-3">
                    {selectedEntry.changes.map((change, index) => (
                      <div
                        key={index}
                        className="border border-gray-200 rounded-lg p-3"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900">
                            {change.teamType} - {change.field}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getChangeTypeColor(change.changeType)}`}>
                            {change.changeType === 'added' && 'Adicionado'}
                            {change.changeType === 'modified' && 'Modificado'}
                            {change.changeType === 'removed' && 'Removido'}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          {change.oldValue && (
                            <div>
                              <span className="font-medium">Anterior:</span> {JSON.stringify(change.oldValue)}
                            </div>
                          )}
                          {change.newValue && (
                            <div>
                              <span className="font-medium">Novo:</span> {JSON.stringify(change.newValue)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Metadados:</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">ID da Configuração:</span>
                    <div className="text-gray-600 font-mono text-xs">{selectedEntry.id}</div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Versão:</span>
                    <div className="text-gray-600">{selectedEntry.configurationVersion}</div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Dashboards:</span>
                    <div className="text-gray-600">{selectedEntry.metadata?.teamCount}</div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Status:</span>
                    <div className="text-gray-600">
                      {selectedEntry.metadata?.isActive ? 'Ativa' : 'Inativa'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};