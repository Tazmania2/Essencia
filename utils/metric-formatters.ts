/**
 * Metric Value Formatting Utilities
 * 
 * Provides consistent formatting for different metric types across all dashboard components.
 * Handles currency, percentage, and numeric values with proper unit handling.
 */

export interface FormattedMetricValue {
  displayValue: string;
  rawValue: number;
  unit: string;
  type: MetricType;
}

export type MetricType = 'currency' | 'percentage' | 'numeric' | 'points' | 'ratio';

export interface MetricFormatOptions {
  type: MetricType;
  unit?: string;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  showUnit?: boolean;
}

/**
 * Main formatter class for metric values
 */
export class MetricFormatter {
  /**
   * Format a metric value based on its type and options
   */
  static formatValue(
    value: number, 
    options: MetricFormatOptions
  ): FormattedMetricValue {
    const { type, unit = '', decimals, prefix = '', suffix = '', showUnit = true } = options;
    
    let displayValue: string;
    let finalUnit = unit;

    switch (type) {
      case 'currency':
        displayValue = this.formatCurrency(value, decimals);
        finalUnit = showUnit ? (unit || 'R$') : '';
        break;
        
      case 'percentage':
        displayValue = this.formatPercentage(value, decimals);
        finalUnit = showUnit ? '%' : '';
        break;
        
      case 'numeric':
        displayValue = this.formatNumeric(value, decimals);
        finalUnit = showUnit ? unit : '';
        break;
        
      case 'points':
        displayValue = this.formatPoints(value);
        finalUnit = showUnit ? (unit || 'pontos') : '';
        break;
        
      case 'ratio':
        displayValue = this.formatRatio(value, decimals);
        finalUnit = showUnit ? unit : '';
        break;
        
      default:
        displayValue = this.formatNumeric(value, decimals);
        finalUnit = showUnit ? unit : '';
    }

    // Apply prefix and suffix
    const fullDisplayValue = `${prefix}${displayValue}${finalUnit ? ` ${finalUnit}` : ''}${suffix}`;

    return {
      displayValue: fullDisplayValue.trim(),
      rawValue: value,
      unit: finalUnit,
      type
    };
  }

  /**
   * Format currency values (Brazilian Real)
   */
  private static formatCurrency(value: number, decimals: number = 2): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value).replace('R$', '').trim();
  }

  /**
   * Format percentage values with proper precision
   */
  private static formatPercentage(value: number, decimals: number = 1): string {
    // Handle edge cases
    if (value === 0) return '0';
    if (!isFinite(value)) return '0';
    
    // Round to specified decimal places
    const rounded = Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
    
    // Format without decimals for whole numbers
    if (rounded % 1 === 0) {
      return Math.round(rounded).toString();
    }
    
    return rounded.toFixed(decimals);
  }

  /**
   * Format numeric values with thousands separators
   */
  private static formatNumeric(value: number, decimals: number = 0): string {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
  }

  /**
   * Format point values (activity points, etc.)
   */
  private static formatPoints(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1
    }).format(value);
  }

  /**
   * Format ratio values (e.g., brands per active)
   */
  private static formatRatio(value: number, decimals: number = 2): string {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
  }
}

/**
 * Predefined formatters for common metric types
 */
export const MetricFormatters = {
  // Currency formatters
  faturamento: (value: number): FormattedMetricValue => 
    MetricFormatter.formatValue(value, { type: 'currency', unit: 'R$' }),
    
  reaisPorAtivo: (value: number): FormattedMetricValue => 
    MetricFormatter.formatValue(value, { type: 'currency', unit: 'R$' }),

  // Activity points
  atividade: (value: number): FormattedMetricValue => 
    MetricFormatter.formatValue(value, { type: 'points', unit: 'pontos' }),

  // Ratio formatters
  multimarcasPorAtivo: (value: number): FormattedMetricValue => 
    MetricFormatter.formatValue(value, { type: 'ratio', unit: 'marcas/ativo', decimals: 2 }),

  // Numeric formatters
  conversoes: (value: number): FormattedMetricValue => 
    MetricFormatter.formatValue(value, { type: 'numeric', unit: 'conversões' }),

  upa: (value: number): FormattedMetricValue => 
    MetricFormatter.formatValue(value, { type: 'numeric', unit: 'UPA', decimals: 2 }),

  // Percentage formatter
  percentage: (value: number): FormattedMetricValue => 
    MetricFormatter.formatValue(value, { type: 'percentage' })
};

/**
 * Get appropriate formatter for a metric name
 */
export function getMetricFormatter(metricName: string): (value: number) => FormattedMetricValue {
  const formatter = MetricFormatters[metricName as keyof typeof MetricFormatters];
  return formatter || MetricFormatters.atividade; // Default fallback
}

/**
 * Format metric display for goal details
 */
export interface GoalDetailMetric {
  name: string;
  displayName: string;
  target: FormattedMetricValue;
  current: FormattedMetricValue;
  percentage: FormattedMetricValue;
  emoji: string;
}

/**
 * Create formatted goal detail metric
 */
export function createGoalDetailMetric(
  name: string,
  displayName: string,
  targetValue: number,
  currentValue: number,
  emoji: string = '🎯'
): GoalDetailMetric {
  const formatter = getMetricFormatter(name);
  
  return {
    name,
    displayName,
    target: formatter(targetValue),
    current: formatter(currentValue),
    percentage: MetricFormatters.percentage(targetValue > 0 ? (currentValue / targetValue) * 100 : 0),
    emoji
  };
}

/**
 * Fallback values when report data is unavailable
 */
export const FALLBACK_VALUES = {
  unavailable: {
    displayValue: 'Dados indisponíveis',
    rawValue: 0,
    unit: '',
    type: 'numeric' as MetricType
  },
  loading: {
    displayValue: 'Carregando...',
    rawValue: 0,
    unit: '',
    type: 'numeric' as MetricType
  },
  error: {
    displayValue: 'Erro ao carregar',
    rawValue: 0,
    unit: '',
    type: 'numeric' as MetricType
  }
};