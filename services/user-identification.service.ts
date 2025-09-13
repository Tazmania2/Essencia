import { 
  FunifierPlayerStatus, 
  TeamType, 
  FUNIFIER_CONFIG,
  ApiError,
  ErrorType 
} from '../types';
import { funifierPlayerService } from './funifier-player.service';

export interface UserRole {
  isPlayer: boolean;
  isAdmin: boolean;
  role: 'player' | 'admin';
}

export interface UserTeamInfo {
  teamType: TeamType | null;
  teamId: string | null;
  allTeams: string[];
}

export interface UserIdentification {
  userId: string;
  userName: string;
  role: UserRole;
  teamInfo: UserTeamInfo;
  playerData?: FunifierPlayerStatus;
}

export class UserIdentificationService {
  private static instance: UserIdentificationService;

  private constructor() {}

  public static getInstance(): UserIdentificationService {
    if (!UserIdentificationService.instance) {
      UserIdentificationService.instance = new UserIdentificationService();
    }
    return UserIdentificationService.instance;
  }

  /**
   * Identify user role and team information from Funifier player data
   */
  public async identifyUser(username: string): Promise<UserIdentification> {
    try {
      // For this implementation, we'll use the username as the player ID
      // In a real scenario, you might need to search for the user first
      const playerData = await funifierPlayerService.getPlayerStatus(username);
      
      const role = this.determineUserRole(playerData);
      const teamInfo = this.extractTeamInformation(playerData);

      return {
        userId: playerData._id,
        userName: playerData.name,
        role,
        teamInfo,
        playerData
      };
    } catch (error) {
      throw this.handleIdentificationError(error, username);
    }
  }

  /**
   * Determine if user is a player or admin based on their data
   * For now, we'll consider all users as players unless they have specific admin indicators
   */
  public determineUserRole(playerData: FunifierPlayerStatus): UserRole {
    // Check if user has admin privileges
    // This could be based on specific teams, extra fields, or other indicators
    const isAdmin = this.checkAdminPrivileges(playerData);
    
    return {
      isPlayer: !isAdmin,
      isAdmin,
      role: isAdmin ? 'admin' : 'player'
    };
  }

  /**
   * Extract team information and map to TeamType enum
   */
  public extractTeamInformation(playerData: FunifierPlayerStatus): UserTeamInfo {
    const teams = playerData.teams || [];
    
    if (teams.length === 0) {
      return {
        teamType: null,
        teamId: null,
        allTeams: []
      };
    }

    // Get the primary team (first team in the array)
    const primaryTeamId = teams[0];
    const teamType = this.mapTeamIdToType(primaryTeamId);

    return {
      teamType,
      teamId: primaryTeamId,
      allTeams: teams
    };
  }

  /**
   * Map Funifier team ID to our TeamType enum
   */
  public mapTeamIdToType(teamId: string): TeamType | null {
    const teamMapping: Record<string, TeamType> = {
      [FUNIFIER_CONFIG.TEAM_IDS.CARTEIRA_I]: TeamType.CARTEIRA_I,
      [FUNIFIER_CONFIG.TEAM_IDS.CARTEIRA_II]: TeamType.CARTEIRA_II,
      [FUNIFIER_CONFIG.TEAM_IDS.CARTEIRA_III]: TeamType.CARTEIRA_III,
      [FUNIFIER_CONFIG.TEAM_IDS.CARTEIRA_IV]: TeamType.CARTEIRA_IV
    };

    return teamMapping[teamId] || null;
  }

  /**
   * Map TeamType enum back to Funifier team ID
   */
  public mapTeamTypeToId(teamType: TeamType): string {
    const typeMapping: Record<TeamType, string> = {
      [TeamType.CARTEIRA_I]: FUNIFIER_CONFIG.TEAM_IDS.CARTEIRA_I,
      [TeamType.CARTEIRA_II]: FUNIFIER_CONFIG.TEAM_IDS.CARTEIRA_II,
      [TeamType.CARTEIRA_III]: FUNIFIER_CONFIG.TEAM_IDS.CARTEIRA_III,
      [TeamType.CARTEIRA_IV]: FUNIFIER_CONFIG.TEAM_IDS.CARTEIRA_IV
    };

    return typeMapping[teamType];
  }

  /**
   * Get all available team types with their IDs
   */
  public getAllTeamMappings(): Array<{ teamType: TeamType; teamId: string; displayName: string }> {
    return [
      {
        teamType: TeamType.CARTEIRA_I,
        teamId: FUNIFIER_CONFIG.TEAM_IDS.CARTEIRA_I,
        displayName: 'Carteira I'
      },
      {
        teamType: TeamType.CARTEIRA_II,
        teamId: FUNIFIER_CONFIG.TEAM_IDS.CARTEIRA_II,
        displayName: 'Carteira II'
      },
      {
        teamType: TeamType.CARTEIRA_III,
        teamId: FUNIFIER_CONFIG.TEAM_IDS.CARTEIRA_III,
        displayName: 'Carteira III'
      },
      {
        teamType: TeamType.CARTEIRA_IV,
        teamId: FUNIFIER_CONFIG.TEAM_IDS.CARTEIRA_IV,
        displayName: 'Carteira IV'
      }
    ];
  }

  /**
   * Validate team assignment
   */
  public validateTeamAssignment(teamType: TeamType, playerData: FunifierPlayerStatus): boolean {
    const teamId = this.mapTeamTypeToId(teamType);
    return playerData.teams?.includes(teamId) || false;
  }

  /**
   * Get team display name
   */
  public getTeamDisplayName(teamType: TeamType): string {
    const displayNames: Record<TeamType, string> = {
      [TeamType.CARTEIRA_I]: 'Carteira I',
      [TeamType.CARTEIRA_II]: 'Carteira II',
      [TeamType.CARTEIRA_III]: 'Carteira III',
      [TeamType.CARTEIRA_IV]: 'Carteira IV'
    };

    return displayNames[teamType];
  }

  /**
   * Check if user has admin privileges
   * This is a placeholder implementation - adjust based on your business logic
   */
  private checkAdminPrivileges(playerData: FunifierPlayerStatus): boolean {
    // Example logic: Check if user has specific admin indicators
    // This could be based on:
    // 1. Specific team membership
    // 2. Extra fields in player data
    // 3. Special catalog items
    // 4. User roles from external system
    
    // For now, we'll check if the user has admin-specific extra fields
    const extraData = playerData.extra || {};
    
    // Check for admin role in extra data
    if (extraData.role === 'admin' || extraData.isAdmin === true) {
      return true;
    }

    // Check for admin team membership (if you have a specific admin team)
    // const adminTeamId = 'ADMIN_TEAM_ID'; // Define this if you have admin teams
    // if (playerData.teams?.includes(adminTeamId)) {
    //   return true;
    // }

    // Check for specific admin catalog items
    const catalogItems = playerData.catalog_items || {};
    const adminCatalogItems = ['ADMIN_ITEM_1', 'ADMIN_ITEM_2']; // Define admin-specific items
    
    for (const adminItem of adminCatalogItems) {
      if (catalogItems[adminItem] && catalogItems[adminItem] > 0) {
        return true;
      }
    }

    // Default to player role
    return false;
  }

  /**
   * Handle identification errors
   */
  private handleIdentificationError(error: unknown, username: string): ApiError {
    if (error instanceof ApiError) {
      return error;
    }

    return new ApiError({
      type: ErrorType.DATA_PROCESSING_ERROR,
      message: 'Failed to identify user role and team',
      details: { 
        username, 
        error: error instanceof Error ? error.message : String(error) 
      },
      timestamp: new Date()
    });
  }
}

// Export singleton instance
export const userIdentificationService = UserIdentificationService.getInstance();