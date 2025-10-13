'use client';

import { AdminRoute } from '../../../components/auth/ProtectedRoute';
import { AdminLayout } from '../../../components/admin/AdminLayout';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { funifierApiService, FunifierPlayer, FunifierPlayerStatus } from '../../../services/funifier-api.service';
import { funifierDatabaseService } from '../../../services/funifier-database.service';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';

interface PlayerWithData extends FunifierPlayer {
  status?: FunifierPlayerStatus;
  teamNames: string[];
  totalPoints: number;
  lastActivity: Date;
  isAdmin: boolean;
  reportCount: number;
  hasImage: boolean;
  catalogItemsCount: number;
}

export default function AdminPlayers() {
  return (
    <AdminRoute>
      <AdminPlayersContent />
    </AdminRoute>
  );
}

function AdminPlayersContent() {
  const [players, setPlayers] = useState<PlayerWithData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [teamFilter, setTeamFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerWithData | null>(null);

  const breadcrumbItems = [
    { label: 'Dashboard', href: '/admin' },
    { label: 'Gerenciar Jogadores', isActive: true }
  ];

  useEffect(() => {
    loadPlayersData();
  }, []);

  const loadPlayersData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get all players and report data
      const [allPlayers, reportData] = await Promise.all([
        funifierApiService.getAllPlayers({ max_results: 500, orderby: 'name' }),
        funifierDatabaseService.getCollectionData()
      ]);

      // Create a map of player reports for quick lookup
      const playerReports = reportData.reduce((acc, report) => {
        if (!acc[report.playerId]) {
          acc[report.playerId] = [];
        }
        acc[report.playerId].push(report);
        return acc;
      }, {} as Record<string, any[]>);

      // Enrich player data with additional information
      const enrichedPlayers: PlayerWithData[] = await Promise.all(
        allPlayers.map(async (player) => {
          try {
            // Get player status for team and points info
            const status = await funifierApiService.getPlayerStatus(player._id);
            const teamInfo = funifierApiService.getPlayerTeamInfo(status);
            const playerReportList = playerReports[player._id] || [];

            return {
              ...player,
              status,
              teamNames: teamInfo.teamNames,
              totalPoints: status.total_points || 0,
              lastActivity: new Date(player.updated),
              isAdmin: teamInfo.isAdmin,
              reportCount: playerReportList.length,
              hasImage: !!(status.image?.original?.url || player.image?.original?.url),
              catalogItemsCount: status.total_catalog_items || 0
            };
          } catch (err) {
            // If we can't get status for a player, return basic info
            console.warn(`Could not get status for player ${player._id}:`, err);
            return {
              ...player,
              teamNames: ['Unknown'],
              totalPoints: 0,
              lastActivity: new Date(player.updated),
              isAdmin: false,
              reportCount: playerReports[player._id]?.length || 0,
              hasImage: !!(player.image?.original?.url),
              catalogItemsCount: 0
            };
          }
        })
      );

      setPlayers(enrichedPlayers);
    } catch (err) {
      console.error('Error loading players data:', err);
      setError('Erro ao carregar dados dos jogadores');
    } finally {
      setLoading(false);
    }
  };

  // Filter players based on search and team filter
  const filteredPlayers = players.filter(player => {
    const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         player._id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTeam = teamFilter === 'all' || 
                       player.teamNames.some(team => team.toLowerCase().includes(teamFilter.toLowerCase()));

    return matchesSearch && matchesTeam;
  });

  // Get unique teams for filter dropdown
  const availableTeams = Array.from(
    new Set(players.flatMap(player => player.teamNames))
  ).filter(team => team !== 'Unknown');

  // Handler functions
  const handleDeletePlayer = async (playerId: string) => {
    if (!confirm('Tem certeza que deseja excluir este jogador? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      await funifierApiService.deletePlayer(playerId);
      await loadPlayersData();
    } catch (error) {
      console.error('Error deleting player:', error);
      setError('Erro ao excluir jogador');
    }
  };

  const handleExportPlayer = async (player: PlayerWithData) => {
    try {
      // Get complete player data
      const [playerStatus, reportData] = await Promise.all([
        funifierApiService.getPlayerStatus(player._id),
        funifierDatabaseService.getCollectionData()
      ]);

      // Filter reports for this player
      const playerReports = reportData.filter(report => report.playerId === player._id);

      // Create export data
      const exportData = {
        player: {
          ...player,
          status: playerStatus
        },
        reports: playerReports,
        exportDate: new Date().toISOString(),
        totalReports: playerReports.length
      };

      // Create and download JSON file
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `player_${player._id}_${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    } catch (error) {
      console.error('Error exporting player data:', error);
      setError('Erro ao exportar dados do jogador');
    }
  };

  if (loading) {
    return (
      <AdminLayout currentSection="players" breadcrumbItems={breadcrumbItems}>
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout currentSection="players" breadcrumbItems={breadcrumbItems}>
      <style jsx>{`
        .table-container::-webkit-scrollbar {
          height: 8px;
        }
        .table-container::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }
        .table-container::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        .table-container::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Gerenciar Jogadores</h1>
                <p className="text-gray-600">Visualizar e gerenciar dados dos jogadores ({players.length} total)</p>
              </div>
            </div>
            <button 
              onClick={loadPlayersData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Atualizar
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
            <button 
              onClick={loadPlayersData}
              className="mt-2 text-red-600 hover:text-red-800 underline"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* Filters and Actions */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Filtros e Ações</h2>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Novo Jogador</span>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar Jogador
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nome ou ID do jogador..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Team Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filtrar por Equipe
              </label>
              <select
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Todas as Equipes</option>
                {availableTeams.map(team => (
                  <option key={team} value={team}>{team}</option>
                ))}
              </select>
            </div>

            {/* Actions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ações em Lote
              </label>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowTeamModal(true)}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Gerenciar Times
                </button>
                <button
                  onClick={loadPlayersData}
                  className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Players List */}
        <div className="bg-white rounded-2xl shadow-xl">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Lista de Jogadores ({filteredPlayers.length})
            </h2>
          </div>

          {filteredPlayers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Nenhum jogador encontrado com os filtros aplicados</p>
            </div>
          ) : (
            <div 
              className="overflow-x-scroll max-w-full table-container" 
              style={{ 
                scrollbarWidth: 'thin', 
                scrollbarColor: '#CBD5E0 #F7FAFC'
              }}
            >
              <div className="inline-block min-w-full align-middle">
                <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                      Ações
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Jogador
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Equipe(s)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pontos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Itens
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Última Atividade
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPlayers.map((player) => (
                    <tr key={player._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium sticky left-0 bg-white z-10">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedPlayer(player);
                              setShowEditModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 transition-colors p-1 rounded hover:bg-blue-50"
                            title="Editar jogador"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleExportPlayer(player)}
                            className="text-green-600 hover:text-green-900 transition-colors p-1 rounded hover:bg-green-50"
                            title="Exportar dados do jogador"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeletePlayer(player._id)}
                            className="text-red-600 hover:text-red-900 transition-colors p-1 rounded hover:bg-red-50"
                            title="Excluir jogador"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {player.hasImage ? (
                              <Image 
                                className="h-10 w-10 rounded-full" 
                                src={player.status?.image?.small?.url || player.status?.image?.original?.url || player.image?.small?.url || player.image?.original?.url || '/default-avatar.png'} 
                                alt={player.name}
                                width={40}
                                height={40}
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                <span className="text-sm font-medium text-gray-700">
                                  {player.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{player.name}</div>
                            <div className="text-sm text-gray-500">{player._id}</div>
                            {player.email && (
                              <div className="text-xs text-gray-400">{player.email}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          {player.teamNames.map((team, index) => (
                            <span
                              key={index}
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                team === 'Admin' 
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {team}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {player.totalPoints.toLocaleString('pt-BR')}
                        </div>
                        {player.status?.point_categories && Object.keys(player.status.point_categories).length > 0 && (
                          <div className="text-xs text-gray-500">
                            {Object.entries(player.status.point_categories).map(([category, points]) => (
                              <div key={category}>
                                {category}: {points}
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {player.catalogItemsCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {player.lastActivity.toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Ativo
                          </span>
                          {player.isAdmin && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              Admin
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Create Player Modal */}
        {showCreateModal && (
          <CreatePlayerModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
              setShowCreateModal(false);
              loadPlayersData();
            }}
          />
        )}

        {/* Edit Player Modal */}
        {showEditModal && selectedPlayer && (
          <EditPlayerModal
            player={selectedPlayer}
            onClose={() => {
              setShowEditModal(false);
              setSelectedPlayer(null);
            }}
            onSuccess={() => {
              setShowEditModal(false);
              setSelectedPlayer(null);
              loadPlayersData();
            }}
          />
        )}

        {/* Team Management Modal */}
        {showTeamModal && (
          <TeamManagementModal
            onClose={() => setShowTeamModal(false)}
            onSuccess={() => {
              setShowTeamModal(false);
              loadPlayersData();
            }}
          />
        )}
      </div>
    </AdminLayout>
  );
}

// Modal Components
interface CreatePlayerModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

function CreatePlayerModal({ onClose, onSuccess }: CreatePlayerModalProps) {
  const [formData, setFormData] = useState({
    _id: '',
    name: '',
    email: '',
    teams: [] as string[],
    extra: {}
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData._id || !formData.name) {
      setError('ID e Nome são obrigatórios');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await funifierApiService.createPlayer(formData);
      onSuccess();
    } catch (err) {
      console.error('Error creating player:', err);
      setError('Erro ao criar jogador');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Criar Novo Jogador</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ID do Jogador *</label>
            <input
              type="text"
              value={formData._id}
              onChange={(e) => setFormData({ ...formData, _id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="ex: joao.silva"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="João Silva"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="joao.silva@email.com"
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Criando...' : 'Criar Jogador'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface EditPlayerModalProps {
  player: PlayerWithData;
  onClose: () => void;
  onSuccess: () => void;
}

function EditPlayerModal({ player, onClose, onSuccess }: EditPlayerModalProps) {
  const [formData, setFormData] = useState({
    name: player.status?.name || player.name,
    email: player.email || '',
    imageUrl: player.status?.image?.original?.url || player.image?.original?.url || '',
    teams: player.status?.teams || [],
  });
  const [availableTeams, setAvailableTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAvailableTeams();
  }, []);

  const loadAvailableTeams = async () => {
    try {
      const teams = await funifierApiService.getAllTeams();
      setAvailableTeams(teams);
    } catch (error) {
      console.error('Error loading teams:', error);
    }
  };

  const handleImageUpdate = async () => {
    if (!formData.imageUrl) {
      setError('URL da imagem é obrigatória');
      return;
    }

    try {
      setImageLoading(true);
      await funifierApiService.updatePlayerImage(player._id, formData.imageUrl);
      setError(null);
    } catch (err) {
      console.error('Error updating player image:', err);
      setError('Erro ao atualizar imagem do jogador');
    } finally {
      setImageLoading(false);
    }
  };

  const handleTeamToggle = (teamId: string) => {
    const currentTeams = [...formData.teams];
    const teamIndex = currentTeams.indexOf(teamId);
    
    if (teamIndex > -1) {
      currentTeams.splice(teamIndex, 1);
    } else {
      currentTeams.push(teamId);
    }
    
    setFormData({ ...formData, teams: currentTeams });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      setError('Nome é obrigatório');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Update image if changed
      if (formData.imageUrl && formData.imageUrl !== player.image?.original?.url) {
        await funifierApiService.updatePlayerImage(player._id, formData.imageUrl);
      }

      // Handle team changes
      const currentTeams = player.status?.teams || [];
      const newTeams = formData.teams;
      
      // Remove from teams that are no longer selected
      for (const teamId of currentTeams) {
        if (!newTeams.includes(teamId)) {
          await funifierApiService.removePlayerFromTeam(teamId, player._id);
        }
      }
      
      // Add to new teams
      for (const teamId of newTeams) {
        if (!currentTeams.includes(teamId)) {
          await funifierApiService.addPlayerToTeam(teamId, player._id);
        }
      }

      // Update player status with new name if changed
      if (formData.name !== (player.status?.name || player.name)) {
        await funifierApiService.updatePlayerStatus(player._id, {
          name: formData.name
        });
      }

      onSuccess();
    } catch (err) {
      console.error('Error updating player:', err);
      setError('Erro ao atualizar jogador');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Editar Jogador</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ID do Jogador</label>
              <input
                type="text"
                value={player._id}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Image Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Imagem do Perfil</label>
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                {formData.imageUrl ? (
                  <Image
                    src={formData.imageUrl}
                    alt={player.name}
                    width={60}
                    height={60}
                    className="w-15 h-15 rounded-full"
                  />
                ) : (
                  <div className="w-15 h-15 rounded-full bg-gray-300 flex items-center justify-center">
                    <span className="text-lg font-medium text-gray-700">
                      {(player.status?.name || player.name).charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="URL da imagem do perfil"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={handleImageUpdate}
                  disabled={imageLoading || !formData.imageUrl}
                  className="mt-2 px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  {imageLoading ? 'Atualizando...' : 'Atualizar Imagem'}
                </button>
              </div>
            </div>
          </div>

          {/* Teams Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Equipes</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
              {availableTeams.map((team) => (
                <label key={team._id} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.teams.includes(team._id)}
                    onChange={() => handleTeamToggle(team._id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{team.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Player Stats (Read-only) */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Estatísticas do Jogador</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Pontos Totais:</span>
                <div className="font-medium">{player.totalPoints.toLocaleString('pt-BR')}</div>
              </div>
              <div>
                <span className="text-gray-500">Itens:</span>
                <div className="font-medium">{player.catalogItemsCount}</div>
              </div>
              <div>
                <span className="text-gray-500">Relatórios:</span>
                <div className="font-medium">{player.reportCount}</div>
              </div>
              <div>
                <span className="text-gray-500">Última Atividade:</span>
                <div className="font-medium">{player.lastActivity.toLocaleDateString('pt-BR')}</div>
              </div>
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{error}</div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface TeamManagementModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

function TeamManagementModal({ onClose, onSuccess }: TeamManagementModalProps) {
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    try {
      const teamsData = await funifierApiService.getAllTeams();
      setTeams(teamsData);
    } catch (error) {
      console.error('Error loading teams:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Gerenciar Times</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <LoadingSpinner size="md" />
          </div>
        ) : (
          <div className="space-y-4">
            {teams.map((team) => (
              <div key={team._id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{team.name}</h4>
                    <p className="text-sm text-gray-500">{team.description || 'Sem descrição'}</p>
                  </div>
                  <div className="text-sm text-gray-500">
                    ID: {team._id}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}