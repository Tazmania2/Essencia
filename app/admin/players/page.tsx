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
              hasImage: !!(player.image?.original?.url),
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

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>
        </div>

        {/* Players List */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
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
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
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
                      Desafios
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Itens
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Relatórios
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {player.hasImage ? (
                              <Image 
                                className="h-10 w-10 rounded-full" 
                                src={player.image?.small?.url || player.image?.original?.url || '/default-avatar.png'} 
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
                        <div>{player.status?.total_challenges || 0}</div>
                        {player.status?.challenge_progress && player.status.challenge_progress.length > 0 && (
                          <div className="text-xs text-gray-500">
                            {player.status.challenge_progress.length} em progresso
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {player.catalogItemsCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {player.reportCount}
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
          )}
        </div>
      </div>
    </AdminLayout>
  );
}