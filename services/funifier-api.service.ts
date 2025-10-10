import axios from 'axios';
import {
  FUNIFIER_CONFIG
} from '../types';
import { errorHandlerService } from './error-handler.service';

export interface FunifierPlayer {
  _id: string;
  name: string;
  email?: string;
  image?: {
    small?: { url: string };
    medium?: { url: string };
    original?: { url: string };
  };
  teams?: string[];
  friends?: string[];
  extra?: Record<string, any>;
  created: number;
  updated: number;
}

export interface FunifierPlayerStatus {
  _id: string;
  name: string;
  image?: {
    small?: { url: string };
    medium?: { url: string };
    original?: { url: string };
  };
  total_challenges: number;
  challenges: Record<string, number>;
  total_points: number;
  point_categories: Record<string, number>;
  total_catalog_items: number;
  catalog_items: Record<string, number>;
  level_progress: {
    percent_completed: number;
    next_points: number;
    next_level?: {
      level: string;
      position: number;
      description: string;
      minPoints: number;
      _id: string;
    };
    total_levels: number;
    percent: number;
  };
  challenge_progress: any[];
  positions: any[];
  time: number;
  extra?: Record<string, any>;
  teams?: string[];
  friends?: string[];
}

export interface FunifierTeam {
  _id: string;
  name: string;
  description?: string;
  image?: {
    small?: { url: string };
    medium?: { url: string };
    original?: { url: string };
  };
  created: number;
  updated: number;
}

export interface FunifierScheduler {
  _id: string;
  name: string;
  active: boolean;
  cron: string;
  timezone: string;
  script: string;
  extra?: Record<string, any>;
  created: number;
  updated: number;
}

export interface SchedulerExecutionResult {
  success: boolean;
  message: string;
  executionTime: number;
  logs?: string[];
}

export class FunifierApiService {
  private static instance: FunifierApiService;

  private constructor() {}

  public static getInstance(): FunifierApiService {
    if (!FunifierApiService.instance) {
      FunifierApiService.instance = new FunifierApiService();
    }
    return FunifierApiService.instance;
  }

  /**
   * Get authorization header using basic auth token
   */
  private getBasicAuthHeader(): Record<string, string> {
    const basicToken = process.env.FUNIFIER_BASIC_TOKEN || '';
    return {
      'Authorization': basicToken,
      'Content-Type': 'application/json'
    };
  }

  // ==================== PLAYER OPERATIONS ====================

  /**
   * Create a new player
   */
  public async createPlayer(playerData: Partial<FunifierPlayer>): Promise<FunifierPlayer> {
    try {
      const response = await axios.post<FunifierPlayer>(
        `${FUNIFIER_CONFIG.BASE_URL}/player`,
        playerData,
        {
          headers: this.getBasicAuthHeader(),
          timeout: 15000,
        }
      );

      return response.data;
    } catch (error) {
      throw errorHandlerService.handleFunifierError(error, 'create_player');
    }
  }

  /**
   * Get all players
   */
  public async getAllPlayers(params?: {
    max_results?: number;
    orderby?: string;
    reverse?: boolean;
    q?: string;
  }): Promise<FunifierPlayer[]> {
    try {
      const response = await axios.get<FunifierPlayer[]>(
        `${FUNIFIER_CONFIG.BASE_URL}/player`,
        {
          headers: this.getBasicAuthHeader(),
          params,
          timeout: 20000,
        }
      );

      return response.data || [];
    } catch (error) {
      throw errorHandlerService.handleFunifierError(error, 'get_all_players');
    }
  }

  /**
   * Get player by ID
   */
  public async getPlayerById(playerId: string): Promise<FunifierPlayer> {
    try {
      const response = await axios.get<FunifierPlayer>(
        `${FUNIFIER_CONFIG.BASE_URL}/player/${playerId}`,
        {
          headers: this.getBasicAuthHeader(),
          timeout: 15000,
        }
      );

      return response.data;
    } catch (error) {
      throw errorHandlerService.handleFunifierError(error, `get_player:${playerId}`);
    }
  }

  /**
   * Get player status by ID
   */
  public async getPlayerStatus(playerId: string): Promise<FunifierPlayerStatus> {
    try {
      const response = await axios.get<FunifierPlayerStatus>(
        `${FUNIFIER_CONFIG.BASE_URL}/player/${playerId}/status`,
        {
          headers: this.getBasicAuthHeader(),
          timeout: 15000,
        }
      );

      return response.data;
    } catch (error) {
      throw errorHandlerService.handleFunifierError(error, `get_player_status:${playerId}`);
    }
  }

  /**
   * Get all players status
   */
  public async getAllPlayersStatus(params?: {
    max_results?: number;
    orderby?: string;
    reverse?: boolean;
    q?: string;
  }): Promise<FunifierPlayerStatus[]> {
    try {
      const response = await axios.get<FunifierPlayerStatus[]>(
        `${FUNIFIER_CONFIG.BASE_URL}/player/status`,
        {
          headers: this.getBasicAuthHeader(),
          params,
          timeout: 25000,
        }
      );

      return response.data || [];
    } catch (error) {
      throw errorHandlerService.handleFunifierError(error, 'get_all_players_status');
    }
  }

  /**
   * Delete player by ID
   */
  public async deletePlayer(playerId: string): Promise<void> {
    try {
      await axios.delete(
        `${FUNIFIER_CONFIG.BASE_URL}/player/${playerId}`,
        {
          headers: this.getBasicAuthHeader(),
          timeout: 15000,
        }
      );
    } catch (error) {
      throw errorHandlerService.handleFunifierError(error, `delete_player:${playerId}`);
    }
  }

  /**
   * Update player profile image
   */
  public async updatePlayerImage(playerId: string, imageUrl: string): Promise<void> {
    try {
      await axios.post(
        `${FUNIFIER_CONFIG.BASE_URL}/player/${playerId}/image`,
        { url: imageUrl },
        {
          headers: {
            ...this.getBasicAuthHeader(),
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          timeout: 15000,
        }
      );
    } catch (error) {
      throw errorHandlerService.handleFunifierError(error, `update_player_image:${playerId}`);
    }
  }

  /**
   * Update player status
   */
  public async updatePlayerStatus(playerId: string, statusData: Partial<FunifierPlayerStatus>): Promise<void> {
    try {
      await axios.post(
        `${FUNIFIER_CONFIG.BASE_URL}/player/${playerId}/status`,
        statusData,
        {
          headers: this.getBasicAuthHeader(),
          timeout: 15000,
        }
      );
    } catch (error) {
      throw errorHandlerService.handleFunifierError(error, `update_player_status:${playerId}`);
    }
  }

  // ==================== TEAM OPERATIONS ====================

  /**
   * Get all teams
   */
  public async getAllTeams(params?: {
    max_results?: number;
    orderby?: string;
    reverse?: boolean;
    q?: string;
  }): Promise<FunifierTeam[]> {
    try {
      const response = await axios.get<FunifierTeam[]>(
        `${FUNIFIER_CONFIG.BASE_URL}/team`,
        {
          headers: this.getBasicAuthHeader(),
          params,
          timeout: 15000,
        }
      );

      return response.data || [];
    } catch (error) {
      throw errorHandlerService.handleFunifierError(error, 'get_all_teams');
    }
  }

  /**
   * Get team by ID
   */
  public async getTeamById(teamId: string): Promise<FunifierTeam> {
    try {
      const response = await axios.get<FunifierTeam>(
        `${FUNIFIER_CONFIG.BASE_URL}/team/${teamId}`,
        {
          headers: this.getBasicAuthHeader(),
          timeout: 15000,
        }
      );

      return response.data;
    } catch (error) {
      throw errorHandlerService.handleFunifierError(error, `get_team:${teamId}`);
    }
  }

  /**
   * Get team members
   */
  public async getTeamMembers(teamId: string): Promise<string[]> {
    try {
      const response = await axios.get<string[]>(
        `${FUNIFIER_CONFIG.BASE_URL}/team/${teamId}/member`,
        {
          headers: this.getBasicAuthHeader(),
          timeout: 15000,
        }
      );

      return response.data || [];
    } catch (error) {
      throw errorHandlerService.handleFunifierError(error, `get_team_members:${teamId}`);
    }
  }

  /**
   * Add player to team
   */
  public async addPlayerToTeam(teamId: string, playerId: string): Promise<void> {
    try {
      await axios.post(
        `${FUNIFIER_CONFIG.BASE_URL}/team/${teamId}/member/add/${playerId}`,
        {},
        {
          headers: this.getBasicAuthHeader(),
          timeout: 15000,
        }
      );
    } catch (error) {
      throw errorHandlerService.handleFunifierError(error, `add_player_to_team:${teamId}:${playerId}`);
    }
  }

  /**
   * Remove player from team
   */
  public async removePlayerFromTeam(teamId: string, playerId: string): Promise<void> {
    try {
      await axios.post(
        `${FUNIFIER_CONFIG.BASE_URL}/team/${teamId}/member/remove/${playerId}`,
        {},
        {
          headers: this.getBasicAuthHeader(),
          timeout: 15000,
        }
      );
    } catch (error) {
      throw errorHandlerService.handleFunifierError(error, `remove_player_from_team:${teamId}:${playerId}`);
    }
  }

  // ==================== SCHEDULER OPERATIONS ====================

  /**
   * Get all schedulers
   */
  public async getAllSchedulers(params?: {
    max_results?: number;
    orderby?: string;
    reverse?: boolean;
    q?: string;
  }): Promise<FunifierScheduler[]> {
    try {
      const response = await axios.get<FunifierScheduler[]>(
        `${FUNIFIER_CONFIG.BASE_URL}/scheduler`,
        {
          headers: this.getBasicAuthHeader(),
          params,
          timeout: 15000,
        }
      );

      return response.data || [];
    } catch (error) {
      throw errorHandlerService.handleFunifierError(error, 'get_all_schedulers');
    }
  }

  /**
   * Get scheduler by ID
   */
  public async getSchedulerById(schedulerId: string): Promise<FunifierScheduler> {
    try {
      const response = await axios.get<FunifierScheduler>(
        `${FUNIFIER_CONFIG.BASE_URL}/scheduler/${schedulerId}`,
        {
          headers: this.getBasicAuthHeader(),
          timeout: 15000,
        }
      );

      return response.data;
    } catch (error) {
      throw errorHandlerService.handleFunifierError(error, `get_scheduler:${schedulerId}`);
    }
  }

  /**
   * Execute scheduler by ID
   */
  public async executeScheduler(schedulerId: string): Promise<SchedulerExecutionResult> {
    try {
      const response = await axios.get<any>(
        `${FUNIFIER_CONFIG.BASE_URL}/scheduler/execute/${schedulerId}`,
        {
          headers: this.getBasicAuthHeader(),
          timeout: 60000, // 1 minute timeout for scheduler execution
        }
      );

      return {
        success: true,
        message: 'Scheduler executed successfully',
        executionTime: Date.now(),
        logs: response.data?.logs || []
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          message: error.response?.data?.message || error.message,
          executionTime: Date.now(),
          logs: error.response?.data?.logs || []
        };
      }
      throw errorHandlerService.handleFunifierError(error, `execute_scheduler:${schedulerId}`);
    }
  }

  /**
   * Get scheduler execution logs
   */
  public async getSchedulerLogs(schedulerId: string, params?: {
    published_min?: string;
    published_max?: string;
    max_results?: number;
    orderby?: string;
    reverse?: boolean;
  }): Promise<any[]> {
    try {
      const response = await axios.get<any[]>(
        `${FUNIFIER_CONFIG.BASE_URL}/scheduler/log`,
        {
          headers: this.getBasicAuthHeader(),
          params: {
            item: schedulerId,
            ...params
          },
          timeout: 15000,
        }
      );

      return response.data || [];
    } catch (error) {
      throw errorHandlerService.handleFunifierError(error, `get_scheduler_logs:${schedulerId}`);
    }
  }

  /**
   * Get player achievements using aggregation
   */
  public async getPlayerAchievements(playerId: string, achievementType?: string): Promise<any[]> {
    try {
      const pipeline: any[] = [
        { "$match": { "player": playerId } },
        { "$sort": { "time": -1 } }
      ];

      // Add specific achievement type filter if provided
      if (achievementType) {
        pipeline.splice(1, 0, { "$match": { "type": parseInt(achievementType) } });
      }

      const response = await axios.post<any[]>(
        `${FUNIFIER_CONFIG.BASE_URL}/database/achievement/aggregate`,
        pipeline,
        {
          headers: this.getBasicAuthHeader(),
          timeout: 15000,
        }
      );

      return response.data || [];
    } catch (error) {
      throw errorHandlerService.handleFunifierError(error, `get_player_achievements:${playerId}`);
    }
  }

  /**
   * Get action logs
   */
  public async getActionLogs(params?: {
    max_results?: number;
    orderby?: string;
    reverse?: boolean;
    q?: string;
  }): Promise<any[]> {
    try {
      const response = await axios.get<any[]>(
        `${FUNIFIER_CONFIG.BASE_URL}/action/log`,
        {
          headers: this.getBasicAuthHeader(),
          params,
          timeout: 15000,
        }
      );

      return response.data || [];
    } catch (error) {
      throw errorHandlerService.handleFunifierError(error, 'get_action_logs');
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Get team name by ID
   */
  public getTeamNameById(teamId: string): string {
    const teamMap: Record<string, string> = {
      [FUNIFIER_CONFIG.TEAM_IDS.CARTEIRA_0]: 'Carteira 0',
      [FUNIFIER_CONFIG.TEAM_IDS.CARTEIRA_I]: 'Carteira I',
      [FUNIFIER_CONFIG.TEAM_IDS.CARTEIRA_II]: 'Carteira II',
      [FUNIFIER_CONFIG.TEAM_IDS.CARTEIRA_III]: 'Carteira III',
      [FUNIFIER_CONFIG.TEAM_IDS.CARTEIRA_IV]: 'Carteira IV',
      [FUNIFIER_CONFIG.TEAM_IDS.ER]: 'ER',
      [FUNIFIER_CONFIG.TEAM_IDS.ADMIN]: 'Admin'
    };

    return teamMap[teamId] || teamId;
  }

  /**
   * Get player team information
   */
  public getPlayerTeamInfo(playerStatus: FunifierPlayerStatus): {
    teams: string[];
    teamNames: string[];
    primaryTeam: string | null;
    isAdmin: boolean;
  } {
    const teams = playerStatus.teams || [];
    const teamNames = teams.map(teamId => this.getTeamNameById(teamId));
    const primaryTeam = teams.length > 0 ? teams[0] : null;
    const isAdmin = teams.includes(FUNIFIER_CONFIG.TEAM_IDS.ADMIN);

    return {
      teams,
      teamNames,
      primaryTeam,
      isAdmin
    };
  }

  /**
   * Check if all players have cleared points
   */
  public async checkAllPlayersPointsCleared(): Promise<{
    allCleared: boolean;
    playersWithPoints: string[];
    totalPlayersChecked: number;
  }> {
    try {
      const allPlayersStatus = await this.getAllPlayersStatus({ max_results: 1000 });
      const playersWithPoints: string[] = [];

      for (const player of allPlayersStatus) {
        // Check if player has any "points" (not locked_points or lost_points)
        const pointCategories = player.point_categories || {};
        const hasPoints = Object.keys(pointCategories).some(category => 
          category === 'points' && pointCategories[category] > 0
        );

        if (hasPoints) {
          // Double-check with fresh player status
          try {
            const freshStatus = await this.getPlayerStatus(player._id);
            const freshPointCategories = freshStatus.point_categories || {};
            const stillHasPoints = Object.keys(freshPointCategories).some(category => 
              category === 'points' && freshPointCategories[category] > 0
            );

            if (stillHasPoints) {
              // Final check using achievements
              try {
                const achievements = await this.getPlayerAchievements(player._id, '0'); // type 0 for points
                const recentPointAchievements = achievements.filter(achievement => 
                  achievement.item === 'points' && 
                  achievement.value > 0 &&
                  Date.now() - achievement.time < 300000 // Within last 5 minutes
                );

                if (recentPointAchievements.length === 0) {
                  // No recent point achievements, player should be cleared
                  continue;
                }
              } catch (achievementError) {
                console.warn(`Could not check achievements for player ${player._id}:`, achievementError);
              }

              playersWithPoints.push(player._id);
            }
          } catch (statusError) {
            console.warn(`Could not get fresh status for player ${player._id}:`, statusError);
            playersWithPoints.push(player._id);
          }
        }
      }

      return {
        allCleared: playersWithPoints.length === 0,
        playersWithPoints,
        totalPlayersChecked: allPlayersStatus.length
      };
    } catch (error) {
      throw errorHandlerService.handleFunifierError(error, 'check_all_players_points_cleared');
    }
  }

  /**
   * Check if all players have cleared locked points
   */
  public async checkAllPlayersLockedPointsCleared(): Promise<{
    allCleared: boolean;
    playersWithLockedPoints: string[];
    totalPlayersChecked: number;
  }> {
    try {
      const allPlayersStatus = await this.getAllPlayersStatus({ max_results: 1000 });
      const playersWithLockedPoints: string[] = [];

      for (const player of allPlayersStatus) {
        const pointCategories = player.point_categories || {};
        const hasLockedPoints = Object.keys(pointCategories).some(category => 
          category === 'locked_points' && pointCategories[category] > 0
        );

        if (hasLockedPoints) {
          // Double-check with fresh player status
          try {
            const freshStatus = await this.getPlayerStatus(player._id);
            const freshPointCategories = freshStatus.point_categories || {};
            const stillHasLockedPoints = Object.keys(freshPointCategories).some(category => 
              category === 'locked_points' && freshPointCategories[category] > 0
            );

            if (stillHasLockedPoints) {
              // Final check using achievements
              try {
                const achievements = await this.getPlayerAchievements(player._id, '0'); // type 0 for points
                const recentLockedPointAchievements = achievements.filter(achievement => 
                  achievement.item === 'locked_points' && 
                  achievement.value > 0 &&
                  Date.now() - achievement.time < 300000 // Within last 5 minutes
                );

                if (recentLockedPointAchievements.length === 0) {
                  // No recent locked point achievements, player should be cleared
                  continue;
                }
              } catch (achievementError) {
                console.warn(`Could not check achievements for player ${player._id}:`, achievementError);
              }

              playersWithLockedPoints.push(player._id);
            }
          } catch (statusError) {
            console.warn(`Could not get fresh status for player ${player._id}:`, statusError);
            playersWithLockedPoints.push(player._id);
          }
        }
      }

      return {
        allCleared: playersWithLockedPoints.length === 0,
        playersWithLockedPoints,
        totalPlayersChecked: allPlayersStatus.length
      };
    } catch (error) {
      throw errorHandlerService.handleFunifierError(error, 'check_all_players_locked_points_cleared');
    }
  }

  /**
   * Check if action log is cleared (for step 3: Resetar action_log em Troca de Ciclo)
   */
  public async checkActionLogCleared(): Promise<{
    allCleared: boolean;
    actionLogCount: number;
    message: string;
  }> {
    try {
      // Simply check if action log is empty
      const actionLogs = await this.getActionLogs({ max_results: 1 });
      const actionLogCount = actionLogs.length;
      
      return {
        allCleared: actionLogCount === 0,
        actionLogCount,
        message: actionLogCount === 0 
          ? 'Action log está vazio - validação bem-sucedida'
          : `Action log contém ${actionLogCount} entradas - ainda não foi limpo`
      };
    } catch (error) {
      throw errorHandlerService.handleFunifierError(error, 'check_action_log_cleared');
    }
  }

  /**
   * Check if all players have cleared challenge progress (legacy method - kept for compatibility)
   */
  public async checkAllPlayersChallengeProgressCleared(): Promise<{
    allCleared: boolean;
    playersWithProgress: string[];
    totalPlayersChecked: number;
  }> {
    try {
      // For step 3, we now use the simpler action log check
      const actionLogResult = await this.checkActionLogCleared();
      
      return {
        allCleared: actionLogResult.allCleared,
        playersWithProgress: actionLogResult.allCleared ? [] : ['action_log_not_empty'],
        totalPlayersChecked: 1 // We're checking the system, not individual players
      };
    } catch (error) {
      throw errorHandlerService.handleFunifierError(error, 'check_all_players_challenge_progress_cleared');
    }
  }

  /**
   * Check if all players have virtual goods items set to correct quantities (0 for all except E6F0MJ3 = 1)
   */
  public async checkAllPlayersVirtualGoodsCleared(): Promise<{
    allCleared: boolean;
    playersWithExtraItems: string[];
    totalPlayersChecked: number;
  }> {
    try {
      const allPlayersStatus = await this.getAllPlayersStatus({ max_results: 1000 });
      const playersWithExtraItems: string[] = [];

      for (const player of allPlayersStatus) {
        const catalogItems = player.catalog_items || {};
        
        // Check if player has incorrect item quantities
        const hasIncorrectItems = Object.keys(catalogItems).some(itemId => {
          if (itemId === 'E6F0MJ3') {
            // Bloqueado item should be exactly 1
            return catalogItems[itemId] !== 1;
          }
          // All other items should be 0 (not removed, just set to 0)
          return catalogItems[itemId] !== 0;
        });

        // Also check if E6F0MJ3 exists and equals 1
        const hasRequiredItem = catalogItems['E6F0MJ3'] === 1;

        if (hasIncorrectItems || !hasRequiredItem) {
          // Double-check with fresh player status
          try {
            const freshStatus = await this.getPlayerStatus(player._id);
            const freshCatalogItems = freshStatus.catalog_items || {};
            
            const stillHasIncorrectItems = Object.keys(freshCatalogItems).some(itemId => {
              if (itemId === 'E6F0MJ3') {
                return freshCatalogItems[itemId] !== 1;
              }
              return freshCatalogItems[itemId] !== 0;
            });

            const stillHasRequiredItem = freshCatalogItems['E6F0MJ3'] === 1;

            if (stillHasIncorrectItems || !stillHasRequiredItem) {
              // Final check using achievements - look for recent item quantity changes
              try {
                const achievements = await this.getPlayerAchievements(player._id, '0'); // type 0 for items
                const recentItemChanges = achievements.filter(achievement => 
                  achievement.item && 
                  achievement.item !== 'E6F0MJ3' && // Not the Bloqueado item
                  achievement.value === 0 && // Set to 0
                  Date.now() - achievement.time < 300000 // Within last 5 minutes
                );

                if (recentItemChanges.length > 0) {
                  // Recent item quantity changes found, player should be cleared
                  continue;
                }
              } catch (achievementError) {
                console.warn(`Could not check achievements for player ${player._id}:`, achievementError);
              }

              playersWithExtraItems.push(player._id);
            }
          } catch (statusError) {
            console.warn(`Could not get fresh status for player ${player._id}:`, statusError);
            playersWithExtraItems.push(player._id);
          }
        }
      }

      return {
        allCleared: playersWithExtraItems.length === 0,
        playersWithExtraItems,
        totalPlayersChecked: allPlayersStatus.length
      };
    } catch (error) {
      throw errorHandlerService.handleFunifierError(error, 'check_all_players_virtual_goods_cleared');
    }
  }
}

// Export singleton instance
export const funifierApiService = FunifierApiService.getInstance();