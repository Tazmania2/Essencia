// Utility functions
export { PrecisionMath } from './precision-math';
export { CycleUtils } from './cycle-utils';
export { 
  DEFAULT_DASHBOARD_CONFIGURATIONS, 
  getDefaultDashboardConfig, 
  getAllDefaultConfigurations,
  validateConfigurationStructure 
} from './dashboard-defaults';
export { secureLogger } from './logger';
export {
  MetricFormatter,
  MetricFormatters,
  getMetricFormatter,
  createGoalDetailMetric,
  FALLBACK_VALUES,
  type MetricType,
  type MetricFormatOptions,
  type FormattedMetricValue,
  type GoalDetailMetric
} from './metric-formatters';