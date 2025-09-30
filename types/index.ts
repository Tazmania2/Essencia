// Funifier API Types
export interface FunifierAuthRequest {
  apiKey: string;
  grant_type: 'password';
  username: string;
  password: string;
}

export interface FunifierAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
}

export interface FunifierPlayerStatus {
  name: string;
  image?: {
    small: ImageInfo;
    medium: ImageInfo;
    original: ImageInfo;
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
    total_levels: number;
    percent: number;
  };
  challenge_progress: any[];
  teams: string[];
  positions: any[];
  time: number;
  extra: Record<string, any>;
  pointCategories: Record<string, number>;
  _id: string;
}

export interface ImageInfo {
  url: string;
  size: number;
  width: number;
  height: number;
  depth: number;
}

export interface EssenciaReportRecord {
  _id: string;
  playerId: string;
  playerName: string;
  team: TeamType;
  atividade?: number;
  reaisPorAtivo?: number;
  faturamento?: number;
  multimarcasPorAtivo?: number;
  conversoes?: number;
  upa?: number;
  currentCycleDay?: number;
  totalCycleDays?: number;
  reportDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface EnhancedReportRecord {
  _id: string;
  playerId: string;
  reaisPorAtivoPercentual: number;
  diaDociclo: number;
  totalDiasCiclo: number;
  faturamentoPercentual: number;
  atividadePercentual: number;
  multimarcasPorAtivoPercentual: number;
  uploadUrl?: string;
  reportDate: string;
  createdAt: string;
  updatedAt: string;
  status: string;
  time?: number;
}

export interface CSVGoalData {
  playerId: string;
  cycleDay: number;
  totalCycleDays: number;
  faturamento: {
    target: number;
    current: number;
    percentage: number;
  };
  reaisPorAtivo: {
    target: number;
    current: number;
    percentage: number;
  };
  multimarcasPorAtivo: {
    target: number;
    current: number;
    percentage: number;
  };
  atividade: {
    target: number;
    current: number;
    percentage: number;
  };
  conversoes?: {
    target: number;
    current: number;
    percentage: number;
  };
  upa?: {
    target: number;
    current: number;
    percentage: number;
  };
}

export enum TeamType {
  CARTEIRA_0 = 'CARTEIRA_0',
  CARTEIRA_I = 'CARTEIRA_I',
  CARTEIRA_II = 'CARTEIRA_II',
  CARTEIRA_III = 'CARTEIRA_III',
  CARTEIRA_IV = 'CARTEIRA_IV',
  ER = 'ER'
}

export enum ErrorType {
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  FUNIFIER_API_ERROR = 'FUNIFIER_API_ERROR',
  DATA_PROCESSING_ERROR = 'DATA_PROCESSING_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR'
}

export interface ApiErrorData {
  type: ErrorType;
  message: string;
  details?: any;
  timestamp: Date;
}

export class ApiError extends Error {
  public readonly type: ErrorType;
  public readonly details?: any;
  public readonly timestamp: Date;

  constructor(data: ApiErrorData) {
    super(data.message);
    this.name = 'ApiError';
    this.type = data.type;
    this.details = data.details;
    this.timestamp = data.timestamp;
  }
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface PasswordResetRequest {
  userId: string;
}

export interface PasswordResetConfirm {
  userId: string;
  code: string;
  newPassword: string;
}

// Funifier Configuration Constants
// Team Processing Types
export interface GoalMetric {
  name: string;
  percentage: number;
  boostActive?: boolean;
  details: Record<string, any>;
}

export interface PlayerMetrics {
  playerName: string;
  totalPoints: number;
  pointsLocked: boolean;
  currentCycleDay: number;
  daysUntilCycleEnd: number;
  primaryGoal: GoalMetric;
  secondaryGoal1: GoalMetric;
  secondaryGoal2: GoalMetric;
}

export interface ProgressBarConfig {
  percentage: number;
  color: 'red' | 'yellow' | 'green';
  fillPercentage: number;
}

export interface TeamProcessor {
  processPlayerData(
    rawData: FunifierPlayerStatus, 
    reportData?: EssenciaReportRecord
  ): PlayerMetrics;
}

export interface ChallengeMapping {
  [TeamType.CARTEIRA_0]: {
    conversoes: string[];
    reaisPorAtivo: string[];
    faturamento: string[];
  };
  [TeamType.CARTEIRA_I]: {
    atividade: string[];
    reaisPorAtivo: string[];
    faturamento: string[];
  };
  [TeamType.CARTEIRA_II]: {
    reaisPorAtivo: string[];
    atividade: string[];
    multimarcasPorAtivo: string[];
  };
  [TeamType.CARTEIRA_III]: {
    faturamento: string[];
    reaisPorAtivo: string[];
    multimarcasPorAtivo: string[];
  };
  [TeamType.CARTEIRA_IV]: {
    faturamento: string[];
    reaisPorAtivo: string[];
    multimarcasPorAtivo: string[];
  };
  [TeamType.ER]: {
    faturamento: string[];
    reaisPorAtivo: string[];
    upa: string[];
  };
}

// Dashboard Component Types
export interface DashboardGoal {
  name: string;
  percentage: number;
  description: string;
  emoji: string;
  hasBoost?: boolean;
  isBoostActive?: boolean;
  // Enhanced fields for detailed goal information
  target?: number;
  current?: number;
  unit?: string;
  daysRemaining?: number;
}

export interface DashboardData {
  playerName: string;
  totalPoints: number;
  pointsLocked: boolean;
  currentCycleDay: number;
  totalCycleDays: number;
  isDataFromCollection: boolean;
  primaryGoal: DashboardGoal;
  secondaryGoal1: DashboardGoal & { hasBoost: true };
  secondaryGoal2: DashboardGoal & { hasBoost: true };
}

export interface GoalDetail {
  title: string;
  items: string[];
  bgColor: string;
  textColor: string;
}

export const FUNIFIER_CONFIG = {
  API_KEY: process.env.FUNIFIER_API_KEY || '',
  BASE_URL: process.env.FUNIFIER_BASE_URL || 'https://service2.funifier.com/v3',
  CUSTOM_COLLECTION: 'report__c',
  CATALOG_ITEMS: {
    UNLOCK_POINTS: 'E6F0O5f',
    LOCK_POINTS: 'E6F0MJ3',
    BOOST_SECONDARY_1: 'E6F0WGc',
    BOOST_SECONDARY_2: 'E6K79Mt'
  },
  TEAM_IDS: {
    CARTEIRA_0: 'E6F5k30',
    CARTEIRA_I: 'E6F4sCh',
    CARTEIRA_II: 'E6F4O1b', 
    CARTEIRA_III: 'E6F4Xf2',
    CARTEIRA_IV: 'E6F41Bb',
    ER: 'E500AbT',
    ADMIN: 'E6U1B1p'
  },
  ACTION_IDS: {
    ATIVIDADE: 'atividade',
    REAIS_POR_ATIVO: 'reais_por_ativo',
    FATURAMENTO: 'faturamento',
    MULTIMARCAS_POR_ATIVO: 'multimarcas_por_ativo',
    CONVERSOES: 'conversoes',
    UPA: 'upa'
  }
} as const;