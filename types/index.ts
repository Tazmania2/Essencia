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
  // Percentage fields
  reaisPorAtivoPercentual: number;
  faturamentoPercentual: number;
  atividadePercentual: number;
  multimarcasPorAtivoPercentual: number;
  // Target (Meta) fields
  faturamentoMeta?: number;
  reaisPorAtivoMeta?: number;
  multimarcasPorAtivoMeta?: number;
  atividadeMeta?: number;
  // Current (Atual) fields
  faturamentoAtual?: number;
  reaisPorAtivoAtual?: number;
  multimarcasPorAtivoAtual?: number;
  atividadeAtual?: number;
  // Cycle information
  diaDociclo: number;
  totalDiasCiclo: number;
  cycleNumber?: number;
  // Optional new metrics
  conversoesMeta?: number;
  conversoesAtual?: number;
  conversoesPercentual?: number;
  upaMeta?: number;
  upaAtual?: number;
  upaPercentual?: number;
  // System fields
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
  ER = 'ER',
}

export enum ErrorType {
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  FUNIFIER_API_ERROR = 'FUNIFIER_API_ERROR',
  DATA_PROCESSING_ERROR = 'DATA_PROCESSING_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
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
  playerId: string;
  playerName: string;
  totalPoints: number;
  pointsLocked: boolean;
  currentCycleDay: number;
  totalCycleDays: number;
  isDataFromCollection: boolean;
  primaryGoal: DashboardGoal;
  secondaryGoal1: DashboardGoal & { hasBoost: true };
  secondaryGoal2: DashboardGoal & { hasBoost: true };
  goalDetails?: Array<{
    title: string;
    items: string[];
    bgColor: string;
    textColor: string;
  }>;
}

export interface GoalDetail {
  title: string;
  items: string[];
  bgColor: string;
  textColor: string;
}

// Validation Types
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationWarning {
  field: string;
  message: string;
  type: 'business_rule' | 'compatibility' | 'validation_error';
}

// Configuration Types
export interface DashboardConfig {
  teamType: TeamType;
  displayName: string;
  primaryGoal: GoalConfig;
  secondaryGoal1: GoalConfig;
  secondaryGoal2: GoalConfig;
  unlockConditions: UnlockConfig;
  specialProcessing?: SpecialProcessingConfig;
}

export interface GoalConfig {
  name: string;
  displayName: string;
  metric: string;
  challengeId: string;
  actionId: string;
  calculationType: 'funifier_api' | 'local_processing';
  boost?: BoostConfig;
  // Display configuration
  emoji?: string;
  unit?: string;
  targetValue?: number;
  csvField?: string; // Field name in CSV data
  description?: string;
}

export interface BoostConfig {
  catalogItemId: string;
  name: string;
  description: string;
}

export interface UnlockConfig {
  catalogItemId: string;
  description: string;
}

export interface SpecialProcessingConfig {
  type: 'carteira_ii_local' | 'standard';
  warnings?: string[];
}

export interface DashboardConfigurationRecord {
  _id?: string;
  version: string;
  createdAt: string;
  updatedAt?: string;
  createdBy: string;
  configurations: {
    [key in TeamType]: DashboardConfig;
  };
}

// History and Cycle Types
export interface CycleHistoryData {
  cycleNumber: number;
  startDate: string;
  endDate: string;
  totalDays: number;
  completionStatus: 'completed' | 'in_progress' | 'cancelled';
  finalMetrics: {
    primaryGoal: {
      name: string;
      percentage: number;
      target: number;
      current: number;
      unit: string;
      boostActive: boolean;
    };
    secondaryGoal1: {
      name: string;
      percentage: number;
      target: number;
      current: number;
      unit: string;
      boostActive: boolean;
    };
    secondaryGoal2: {
      name: string;
      percentage: number;
      target: number;
      current: number;
      unit: string;
      boostActive: boolean;
    };
  };
  progressTimeline: ProgressDataPoint[];
}

export interface ProgressDataPoint {
  date: string;
  dayInCycle: number;
  uploadSequence: number;
  metrics: {
    primaryGoal?: number;
    secondaryGoal1?: number;
    secondaryGoal2?: number;
  };
}

// Store/Storefront Types
export interface ImageData {
  url: string;
  size: number;
  width: number;
  height: number;
  depth: number;
}

export interface Requirement {
  total: number;
  type: number;
  item: string;
  operation: number;
  extra: Record<string, any>;
  restrict: boolean;
  perPlayer: boolean;
}

export interface VirtualGoodItem {
  _id: string;
  catalogId: string;
  name: string;
  description?: string;
  amount: number;
  active: boolean;
  created: number;
  image?: {
    small?: ImageData;
    medium?: ImageData;
    original?: ImageData;
  };
  requires: Requirement[];
  rewards: any[];
  notifications: any[];
  limit: {
    total: number;
    per: string;
    every: string;
  };
  extra: Record<string, any>;
  i18n: Record<string, any>;
  techniques: string[];
  owned: number;
}

export interface Catalog {
  _id: string;
  catalog: string;
  extra: Record<string, any>;
  created: number;
  i18n: Record<string, any>;
}

export interface Point {
  _id: string;
  category: string;
  shortName: string;
  extra: Record<string, any>;
  techniques: string[];
}

export interface LevelConfiguration {
  catalogId: string;
  levelNumber: number;
  levelName: string;
  visible: boolean;
}

export interface StoreConfiguration {
  currencyId: string;
  currencyName: string;
  grayOutLocked: boolean;
  levels: LevelConfiguration[];
}

// Default Store Configuration
export const DEFAULT_STORE_CONFIG: StoreConfiguration = {
  currencyId: 'coins',
  currencyName: 'Moedas',
  grayOutLocked: false,
  levels: [
    {
      catalogId: 'loja_de_recompensas',
      levelNumber: 1,
      levelName: 'Nível 1',
      visible: true,
    },
    {
      catalogId: 'loja_de_recompensas_2',
      levelNumber: 2,
      levelName: 'Nível 2',
      visible: true,
    },
    {
      catalogId: 'loja_de_recompensas_3',
      levelNumber: 3,
      levelName: 'Nível 3',
      visible: true,
    },
    {
      catalogId: 'backend_tools',
      levelNumber: 999,
      levelName: 'Internal',
      visible: false,
    },
  ],
};

// Store Error Messages
export const STORE_ERROR_MESSAGES = {
  FETCH_ITEMS_FAILED: 'Não foi possível carregar os itens da loja. Tente novamente.',
  FETCH_CONFIG_FAILED: 'Erro ao carregar configuração da loja. Usando configuração padrão.',
  SAVE_CONFIG_FAILED: 'Não foi possível salvar a configuração. Tente novamente.',
  FETCH_BALANCE_FAILED: 'Não foi possível carregar seu saldo.',
  NO_ITEMS_AVAILABLE: 'Nenhum item disponível no momento.',
  FETCH_CATALOGS_FAILED: 'Não foi possível carregar os catálogos.',
  FETCH_POINTS_FAILED: 'Não foi possível carregar as moedas disponíveis.',
  INVALID_CONFIGURATION: 'Configuração inválida. Verifique os dados e tente novamente.',
} as const;

export const FUNIFIER_CONFIG = {
  API_KEY: process.env.FUNIFIER_API_KEY || '',
  BASE_URL: process.env.FUNIFIER_BASE_URL || 'https://service2.funifier.com/v3',
  CUSTOM_COLLECTION: 'report__c',
  STORE_COLLECTION: 'store__c',
  CATALOG_ITEMS: {
    UNLOCK_POINTS: 'E6F0O5f',
    LOCK_POINTS: 'E6F0MJ3',
    BOOST_SECONDARY_1: 'E6F0WGc',
    BOOST_SECONDARY_2: 'E6K79Mt',
  },
  TEAM_IDS: {
    CARTEIRA_0: 'E6F5k30',
    CARTEIRA_I: 'E6F4sCh',
    CARTEIRA_II: 'E6F4O1b',
    CARTEIRA_III: 'E6F4Xf2',
    CARTEIRA_IV: 'E6F41Bb',
    ER: 'E500AbT',
    ADMIN: 'E6U1B1p',
  },
  ACTION_IDS: {
    ATIVIDADE: 'atividade',
    REAIS_POR_ATIVO: 'reais_por_ativo',
    FATURAMENTO: 'faturamento',
    MULTIMARCAS_POR_ATIVO: 'multimarcas_por_ativo',
    CONVERSOES: 'conversoes',
    UPA: 'upa',
  },
} as const;
