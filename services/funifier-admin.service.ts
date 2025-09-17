import axios, { AxiosError } from 'axios';
import {
  ApiError,
  ErrorType,
  FUNIFIER_CONFIG
} from '../types';
import { errorHandlerService } from './error-handler.service';

export interface FunifierPlayer {
  _id: string;
  name: string;
  email?: string;
  extra?: Record<string, any>;
  created: number;
  updated: number;
}

export interface PlayerListResponse {
  players: FunifierPlayer[];
  total: number;
}

export class FunifierAdminService {
  private static instance: FunifierAdminService;

  private constructor() {}

  public static getInstance(): FunifierAdminService {
    if (!FunifierAdminService.instance) {
      FunifierAdminService.instance = new FunifierAdminService();
    }
    return FunifierAdminService.instance;
  }

  /**
   * Get authorization header for admin API requests using basic token
   */
  private getAdminAuthHeader(): Record<string, string> {
    return {
      'Authorization': `Basic ${Buffer.from(FUNIFIER_CONFIG.API_KEY).toString('base64')}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Fetch all players from Funifier API using admin token
   */
  public async getAllPlayers(): Promise<FunifierPlayer[]> {
    try {
      const response = await axios.get<FunifierPlayer[]>(
        `${FUNIFIER_CONFIG.BASE_URL}/player`,
        {
          headers: this.getAdminAuthHeader(),
          timeout: 15000, // 15 second timeout
        }
      );

      return response.data || [];
    } catch (error) {
      const apiError = errorHandlerService.handleFunifierError(error, 'admin_get_all_players');
      throw apiError;
    }
  }

  /**
   * Get player details by ID using admin token
   */
  public async getPlayerById(playerId: string): Promise<FunifierPlayer> {
    try {
      const response = await axios.get<FunifierPlayer>(
        `${FUNIFIER_CONFIG.BASE_URL}/player/${playerId}`,
        {
          headers: this.getAdminAuthHeader(),
          timeout: 15000,
        }
      );

      return response.data;
    } catch (error) {
      const apiError = errorHandlerService.handleFunifierError(error, `admin_get_player:${playerId}`);
      throw apiError;
    }
  }

  /**
   * Get player status by ID using admin token
   */
  public async getPlayerStatus(playerId: string): Promise<any> {
    try {
      const response = await axios.get(
        `${FUNIFIER_CONFIG.BASE_URL}/player/${playerId}/status`,
        {
          headers: this.getAdminAuthHeader(),
          timeout: 15000,
        }
      );

      return response.data;
    } catch (error) {
      const apiError = errorHandlerService.handleFunifierError(error, `admin_get_player_status:${playerId}`);
      throw apiError;
    }
  }

  /**
   * Get team information for a player
   */
  public getPlayerTeamInfo(playerStatus: any): {
    teams: string[];
    teamNames: string[];
    primaryTeam: string | null;
    isAdmin: boolean;
  } {
    const teams = playerStatus.teams || [];
    const teamNames = teams.map((teamId: string) => this.getTeamNameById(teamId));
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
   * Convert team ID to readable name
   */
  private getTeamNameById(teamId: string): string {
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
   * Get comprehensive player data for admin dashboard
   */
  public async getPlayerAdminData(playerId: string): Promise<{
    basicInfo: FunifierPlayer;
    status: any;
    teamInfo: {
      teams: string[];
      teamNames: string[];
      primaryTeam: string | null;
      isAdmin: boolean;
    };
    points: {
      total: number;
      categories: Record<string, number>;
    };
    activity: {
      lastUpdated: Date;
      totalChallenges: number;
    };
  }> {
    try {
      const [basicInfo, status] = await Promise.all([
        this.getPlayerById(playerId),
        this.getPlayerStatus(playerId)
      ]);

      const teamInfo = this.getPlayerTeamInfo(status);

      return {
        basicInfo,
        status,
        teamInfo,
        points: {
          total: status.total_points || 0,
          categories: status.point_categories || {}
        },
        activity: {
          lastUpdated: new Date(basicInfo.updated),
          totalChallenges: status.total_challenges || 0
        }
      };
    } catch (error) {
      const apiError = errorHandlerService.handleFunifierError(error, `admin_get_comprehensive_data:${playerId}`);
      throw apiError;
    }
  }
}

// Export singleton instance
export const funifierAdminService = FunifierAdminService.getInstance();