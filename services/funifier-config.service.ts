import axios from 'axios';
import { FUNIFIER_CONFIG, TeamType, ChallengeMapping } from '../types';
import { funifierAuthService } from './funifier-auth.service';

/**
 * Funifier Configuration Service
 * 
 * Helps with fetching and configuring actual Funifier IDs for teams, challenges, etc.
 */
export class FunifierConfigService {
  private static instance: FunifierConfigService;

  private constructor() {}

  public static getInstance(): FunifierConfigService {
    if (!FunifierConfigService.instance) {
      FunifierConfigService.instance = new FunifierConfigService();
    }
    return FunifierConfigService.instance;
  }

  /**
   * Fetch all teams from Funifier API
   */
  public async fetchTeams(): Promise<any[]> {
    try {
      const token = await funifierAuthService.getAccessToken();
      if (!token) {
        throw new Error('No valid authentication token available');
      }

      const response = await axios.get(`${FUNIFIER_CONFIG.BASE_URL}/team`, {
        headers: funifierAuthService.getAuthHeader(),
        timeout: 10000
      });

      return response.data || [];
    } catch (error) {
      console.error('Error fetching teams:', error);
      throw error;
    }
  }

  /**
   * Fetch all challenges from Funifier API
   */
  public async fetchChallenges(): Promise<any[]> {
    try {
      const token = await funifierAuthService.getAccessToken();
      if (!token) {
        throw new Error('No valid authentication token available');
      }

      const response = await axios.get(`${FUNIFIER_CONFIG.BASE_URL}/challenge`, {
        headers: funifierAuthService.getAuthHeader(),
        timeout: 10000
      });

      return response.data || [];
    } catch (error) {
      console.error('Error fetching challenges:', error);
      throw error;
    }
  }

  /**
   * Fetch all catalog items from Funifier API
   */
  public async fetchCatalogItems(): Promise<any[]> {
    try {
      const token = await funifierAuthService.getAccessToken();
      if (!token) {
        throw new Error('No valid authentication token available');
      }

      const response = await axios.get(`${FUNIFIER_CONFIG.BASE_URL}/virtualgoods/item`, {
        headers: funifierAuthService.getAuthHeader(),
        timeout: 10000
      });

      return response.data || [];
    } catch (error) {
      console.error('Error fetching catalog items:', error);
      throw error;
    }
  }

  /**
   * Verify current team configuration against Funifier API
   */
  public async verifyTeamConfiguration(): Promise<{
    isValid: boolean;
    actualTeams: any[];
    configuredTeams: Record<string, string>;
    missingTeams: string[];
    extraTeams: string[];
  }> {
    try {
      const actualTeams = await this.fetchTeams();
      const configuredTeams = FUNIFIER_CONFIG.TEAM_IDS;
      
      const actualTeamIds = actualTeams.map(team => team._id);
      const configuredTeamIds = Object.values(configuredTeams);
      
      const missingTeams = configuredTeamIds.filter(id => !actualTeamIds.includes(id));
      const extraTeams = actualTeamIds.filter(id => !configuredTeamIds.includes(id));
      
      return {
        isValid: missingTeams.length === 0,
        actualTeams,
        configuredTeams,
        missingTeams,
        extraTeams
      };
    } catch (error) {
      console.error('Error verifying team configuration:', error);
      return {
        isValid: false,
        actualTeams: [],
        configuredTeams: FUNIFIER_CONFIG.TEAM_IDS,
        missingTeams: Object.values(FUNIFIER_CONFIG.TEAM_IDS),
        extraTeams: []
      };
    }
  }

  /**
   * Generate challenge mapping based on actual Funifier challenges
   * This is a helper function to assist with configuration
   */
  public async generateChallengeMappingSuggestion(): Promise<{
    challenges: any[];
    suggestions: {
      teamType: TeamType;
      goalType: string;
      possibleChallenges: any[];
    }[];
    mapping: Partial<ChallengeMapping>;
  }> {
    try {
      const challenges = await this.fetchChallenges();
      const suggestions: any[] = [];
      const mapping: Partial<ChallengeMapping> = {};

      // Define goal keywords to search for in challenge names/descriptions
      const goalKeywords = {
        atividade: ['atividade', 'activity', 'ação', 'action'],
        reaisPorAtivo: ['reais', 'ativo', 'real', 'asset', 'revenue'],
        faturamento: ['faturamento', 'billing', 'invoice', 'revenue', 'sales'],
        multimarcasPorAtivo: ['multimarcas', 'multi', 'marca', 'brand', 'ativo', 'asset']
      };

      // Search for challenges that might match each goal type
      Object.entries(goalKeywords).forEach(([goalType, keywords]) => {
        const possibleChallenges = challenges.filter(challenge => {
          const searchText = `${challenge.challenge || ''} ${challenge.description || ''}`.toLowerCase();
          return keywords.some(keyword => searchText.includes(keyword.toLowerCase()));
        });

        suggestions.push({
          teamType: 'ALL' as any,
          goalType,
          possibleChallenges
        });
      });

      return {
        challenges,
        suggestions,
        mapping
      };
    } catch (error) {
      console.error('Error generating challenge mapping suggestion:', error);
      return {
        challenges: [],
        suggestions: [],
        mapping: {}
      };
    }
  }

  /**
   * Verify catalog items configuration
   */
  public async verifyCatalogItemsConfiguration(): Promise<{
    isValid: boolean;
    actualItems: any[];
    configuredItems: Record<string, string>;
    missingItems: string[];
    foundItems: any[];
  }> {
    try {
      const actualItems = await this.fetchCatalogItems();
      const configuredItems = FUNIFIER_CONFIG.CATALOG_ITEMS;
      
      const actualItemIds = actualItems.map(item => item._id);
      const configuredItemIds = Object.values(configuredItems);
      
      const missingItems = configuredItemIds.filter(id => !actualItemIds.includes(id));
      const foundItems = actualItems.filter(item => configuredItemIds.includes(item._id));
      
      return {
        isValid: missingItems.length === 0,
        actualItems,
        configuredItems,
        missingItems,
        foundItems
      };
    } catch (error) {
      console.error('Error verifying catalog items configuration:', error);
      return {
        isValid: false,
        actualItems: [],
        configuredItems: FUNIFIER_CONFIG.CATALOG_ITEMS,
        missingItems: Object.values(FUNIFIER_CONFIG.CATALOG_ITEMS),
        foundItems: []
      };
    }
  }

  /**
   * Get comprehensive configuration report
   */
  public async getConfigurationReport(): Promise<{
    teams: {
      isValid: boolean;
      actualTeams: any[];
      configuredTeams: Record<string, string>;
      missingTeams: string[];
      extraTeams: string[];
    };
    catalogItems: {
      isValid: boolean;
      actualItems: any[];
      configuredItems: Record<string, string>;
      missingItems: string[];
      foundItems: any[];
    };
    challenges: {
      challenges: any[];
      suggestions: {
        teamType: TeamType;
        goalType: string;
        possibleChallenges: any[];
      }[];
      mapping: Partial<ChallengeMapping>;
    };
    summary: {
      isFullyConfigured: boolean;
      issues: string[];
      recommendations: string[];
    };
  }> {
    const [teams, catalogItems, challenges] = await Promise.all([
      this.verifyTeamConfiguration(),
      this.verifyCatalogItemsConfiguration(),
      this.generateChallengeMappingSuggestion()
    ]);

    const issues: string[] = [];
    const recommendations: string[] = [];

    if (!teams.isValid) {
      issues.push(`Missing teams: ${teams.missingTeams.join(', ')}`);
      recommendations.push('Update FUNIFIER_CONFIG.TEAM_IDS with actual team IDs from Funifier');
    }

    if (!catalogItems.isValid) {
      issues.push(`Missing catalog items: ${catalogItems.missingItems.join(', ')}`);
      recommendations.push('Update FUNIFIER_CONFIG.CATALOG_ITEMS with actual catalog item IDs from Funifier');
    }

    if (challenges.challenges.length === 0) {
      issues.push('No challenges found in Funifier');
      recommendations.push('Create challenges in Funifier for each team goal');
    } else {
      recommendations.push('Update CHALLENGE_MAPPING with actual challenge IDs from the suggestions');
    }

    return {
      teams,
      catalogItems,
      challenges,
      summary: {
        isFullyConfigured: teams.isValid && catalogItems.isValid && challenges.challenges.length > 0,
        issues,
        recommendations
      }
    };
  }
}

// Export singleton instance
export const funifierConfigService = FunifierConfigService.getInstance();