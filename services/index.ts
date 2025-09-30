// Funifier API Services
export { FunifierAuthService, funifierAuthService } from './funifier-auth.service';
export { FunifierPlayerService, funifierPlayerService } from './funifier-player.service';
export { FunifierDatabaseService, funifierDatabaseService, type BulkInsertResult, type AggregationPipeline } from './funifier-database.service';
export { FunifierConfigService, funifierConfigService } from './funifier-config.service';
export { DashboardConfigurationService } from './dashboard-configuration.service';
export { ConfigurationValidator, configurationValidator } from './configuration-validator.service';
export { HistoryService, historyService } from './history.service';
export { CycleMigrationService, cycleMigrationService } from './cycle-migration.service';

// Team Processors
export { BaseTeamProcessor, TeamProcessorUtils, CHALLENGE_MAPPING } from './team-processor.service';
export { CarteiraIProcessor, carteiraIProcessor } from './carteira-i-processor.service';
export { CarteiraIIProcessor, carteiraIIProcessor } from './carteira-ii-processor.service';
export { CarteiraIIIIVProcessor, carteiraIIIProcessor, carteiraIVProcessor } from './carteira-iii-iv-processor.service';
export { TeamProcessorFactory, teamProcessorFactory } from './team-processor-factory.service';

// Re-export types for convenience
export type {
  FunifierAuthRequest,
  FunifierAuthResponse,
  FunifierPlayerStatus,
  EssenciaReportRecord,
  LoginCredentials,
  ApiError,
  ApiErrorData,
  ErrorType,
  TeamType,
  ImageInfo,
  TeamProcessor,
  PlayerMetrics,
  GoalMetric,
  ProgressBarConfig,
  ChallengeMapping
} from '../types';