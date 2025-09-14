'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { FunifierPlayerStatus, TeamType, FUNIFIER_CONFIG } from '../../types';
import { funifierPlayerService } from '../../services/funifier-player.service';
import { funifierDatabaseService } from '../../services/funifier-database.service';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { ErrorNotification } from '../error/ErrorNotification';

interface Player {
  id: string;
  name: string;
  team: TeamType | null;
  totalPoints: number;
  isActive: boolean;
  lastUpdated?: Date;
}

interface PlayerSelectorProps {
  onPlayerSelect: (player: Player | null) => void;
  selectedPlayer: Player | null;
  className?: string;
}

export const PlayerSelector: React.FC<PlayerSelectorProps> = ({
  onPlayerSelect,
  selectedPlayer,
  className = ''
}) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedPlayerData, setSelectedPlayerData] = useState<FunifierPlayerStatus | null>(null);
  const [loadingPlayerData, setLoadingPlayerData] = useState(false);

  // Filter players based on search term
  const filteredPlayers = useMemo(() => {
    if (!searchTerm.trim()) return players;
    
    const term = searchTerm.toLowerCase();
    return players.filter(player => 
      player.name.toLowerCase().includes(term) ||
      player.id.toLowerCase().includes(term) ||
      (player.team && player.team.toLowerCase().includes(term))
    );
  }, [players, searchTerm]);

  // Load players from Funifier database
  const loadPlayers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get all players from the custom collection
      const reportData = await funifierDatabaseService.getCollectionData();
      
      // Extract unique players from report data
      const uniquePlayers = new Map<string, Player>();
      
      reportData.forEach(record => {
        if (!uniquePlayers.has(record.playerId)) {
          uniquePlayers.set(record.playerId, {
            id: record.playerId,
            name: record.playerName,
            team: record.team,
            totalPoints: 0, // Will be updated when player is selected
            isActive: true,
            lastUpdated: new Date(record.updatedAt)
          });
        }
      });

      const playerList = Array.from(uniquePlayers.values()).sort((a, b) => 
        a.name.localeCompare(b.name)
      );

      setPlayers(playerList);
    } catch (err) {
      console.error('Error loading players:', err);
      setError('Erro ao carregar lista de jogadores. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Load detailed player data when a player is selected
  const loadPlayerData = async (player: Player) => {
    setLoadingPlayerData(true);
    setError(null);
    
    try {
      const playerData = await funifierPlayerService.getPlayerStatus(player.id);
      setSelectedPlayerData(playerData);
      
      // Update player with current points
      const updatedPlayer = {
        ...player,
        totalPoints: playerData.total_points || 0
      };
      
      onPlayerSelect(updatedPlayer);
    } catch (err) {
      console.error('Error loading player data:', err);
      setError('Erro ao carregar dados do jogador. Tente novamente.');
      setSelectedPlayerData(null);
    } finally {
      setLoadingPlayerData(false);
    }
  };

  // Handle player selection
  const handlePlayerSelect = (player: Player) => {
    setIsDropdownOpen(false);
    setSearchTerm(player.name);
    loadPlayerData(player);
  };

  // Clear selection
  const handleClearSelection = () => {
    setSearchTerm('');
    setSelectedPlayerData(null);
    onPlayerSelect(null);
    setIsDropdownOpen(false);
  };

  // Get team display name
  const getTeamDisplayName = (team: TeamType | null): string => {
    if (!team) return 'Sem time';
    
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

  // Get team color
  const getTeamColor = (team: TeamType | null): string => {
    if (!team) return 'bg-gray-100 text-gray-600';
    
    switch (team) {
      case TeamType.CARTEIRA_I:
        return 'bg-blue-100 text-blue-800';
      case TeamType.CARTEIRA_II:
        return 'bg-green-100 text-green-800';
      case TeamType.CARTEIRA_III:
        return 'bg-purple-100 text-purple-800';
      case TeamType.CARTEIRA_IV:
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  // Load players on component mount
  useEffect(() => {
    loadPlayers();
  }, []);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <label htmlFor="player-search" className="block text-sm font-medium text-gray-700 mb-2">
          Selecionar Jogador
        </label>
        
        <div className="relative">
          <input
            id="player-search"
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsDropdownOpen(true);
            }}
            onFocus={() => setIsDropdownOpen(true)}
            placeholder="Digite o nome do jogador..."
            className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-boticario-pink focus:border-transparent transition-colors"
            disabled={loading}
          />
          
          {/* Search Icon */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {loading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
          </div>
          
          {/* Clear Button */}
          {searchTerm && (
            <button
              onClick={handleClearSelection}
              className="absolute inset-y-0 right-8 flex items-center pr-2 text-gray-400 hover:text-gray-600"
              type="button"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Dropdown */}
        {isDropdownOpen && !loading && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {filteredPlayers.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                {searchTerm ? 'Nenhum jogador encontrado' : 'Nenhum jogador disponível'}
              </div>
            ) : (
              filteredPlayers.map((player) => (
                <button
                  key={player.id}
                  onClick={() => handlePlayerSelect(player)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{player.name}</div>
                      <div className="text-sm text-gray-500">ID: {player.id}</div>
                    </div>
                    <div className="ml-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTeamColor(player.team)}`}>
                        {getTeamDisplayName(player.team)}
                      </span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <ErrorNotification
          error={new Error(error)}
          onDismiss={() => setError(null)}
        />
      )}

      {/* Selected Player Information */}
      {selectedPlayer && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Informações do Jogador</h3>
            {loadingPlayerData && <LoadingSpinner size="sm" />}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Basic Info */}
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Nome</label>
                <p className="text-lg font-semibold text-gray-900">{selectedPlayer.name}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">ID do Jogador</label>
                <p className="text-sm text-gray-700 font-mono">{selectedPlayer.id}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Time</label>
                <div className="mt-1">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getTeamColor(selectedPlayer.team)}`}>
                    {getTeamDisplayName(selectedPlayer.team)}
                  </span>
                </div>
              </div>
            </div>

            {/* Points Info */}
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Pontos Totais</label>
                <p className="text-2xl font-bold text-boticario-pink">{selectedPlayer.totalPoints.toLocaleString()}</p>
              </div>
              
              {selectedPlayerData && (
                <>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status dos Pontos</label>
                    <div className="mt-1">
                      {funifierPlayerService.extractPointsLockStatus(selectedPlayerData.catalog_items).isUnlocked ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Desbloqueados
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                          </svg>
                          Bloqueados
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Boosts Ativos</label>
                    <div className="mt-1">
                      {(() => {
                        const boostStatus = funifierPlayerService.extractBoostStatus(selectedPlayerData.catalog_items);
                        return (
                          <span className="text-sm text-gray-700">
                            {boostStatus.totalActiveBoosts} de 2 boosts ativos
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Tipo de Usuário</label>
                    <div className="mt-1">
                      {funifierPlayerService.isPlayerAdmin(selectedPlayerData) ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-0.257-0.257A6 6 0 1118 8zM10 2a1 1 0 011 1v1.267a4.39 4.39 0 011.617.602l.894-.894a1 1 0 011.414 1.414l-.894.894A4.39 4.39 0 0115.267 7H17a1 1 0 110 2h-1.267a4.39 4.39 0 01-.602 1.617l.894.894a1 1 0 11-1.414 1.414l-.894-.894A4.39 4.39 0 0112 12.267V14a1 1 0 11-2 0v-1.733a4.39 4.39 0 01-1.617-.602l-.894.894a1 1 0 01-1.414-1.414l.894-.894A4.39 4.39 0 015.733 9H4a1 1 0 110-2h1.733a4.39 4.39 0 01.602-1.617l-.894-.894a1 1 0 111.414-1.414l.894.894A4.39 4.39 0 019 4.267V3a1 1 0 011-1z" clipRule="evenodd" />
                          </svg>
                          Administrador
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                          Jogador
                        </span>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Additional Details */}
          {selectedPlayerData && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Detalhes Adicionais</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Desafios:</span>
                  <span className="ml-2 font-medium">{selectedPlayerData.total_challenges || 0}</span>
                </div>
                <div>
                  <span className="text-gray-500">Itens do Catálogo:</span>
                  <span className="ml-2 font-medium">{selectedPlayerData.total_catalog_items || 0}</span>
                </div>
                <div>
                  <span className="text-gray-500">Nível:</span>
                  <span className="ml-2 font-medium">{selectedPlayerData.level_progress?.percent_completed || 0}%</span>
                </div>
                <div>
                  <span className="text-gray-500">Times:</span>
                  <span className="ml-2 font-medium">{selectedPlayerData.teams?.length || 0}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Refresh Button */}
      <div className="flex justify-end">
        <button
          onClick={loadPlayers}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-boticario-pink focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <svg className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {loading ? 'Carregando...' : 'Atualizar Lista'}
        </button>
      </div>
    </div>
  );
};