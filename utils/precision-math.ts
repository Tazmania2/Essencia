import { PrecisionMetric } from '../types';

/**
 * PrecisionMath utility class to fix floating-point calculation issues
 * Replicates the working approach from Carteira I implementation
 */
export class PrecisionMath {
  /**
   * Fix floating-point precision issues in percentage calculations
   * Uses the same approach as the working Carteira I implementation
   */
  static calculatePercentage(current: number, target: number): PrecisionMetric {
    if (target === 0) {
      return {
        value: 0,
        displayValue: '0%',
        rawCalculation: 0
      };
    }
    
    // Use the same approach as working Carteira I implementation
    const rawCalculation = (current / target) * 100;
    
    // Round to 1 decimal place for calculations
    const roundedValue = Math.round(rawCalculation * 10) / 10;
    
    // Format for display (no decimals for whole numbers)
    const displayValue = roundedValue % 1 === 0 
      ? `${Math.round(roundedValue)}%`
      : `${roundedValue}%`;
    
    return {
      value: roundedValue,
      displayValue,
      rawCalculation
    };
  }

  /**
   * Calculate percentage with custom precision
   */
  static calculatePercentageWithPrecision(current: number, target: number, decimalPlaces: number = 1): PrecisionMetric {
    if (target === 0) {
      return {
        value: 0,
        displayValue: '0%',
        rawCalculation: 0
      };
    }
    
    const rawCalculation = (current / target) * 100;
    const multiplier = Math.pow(10, decimalPlaces);
    const roundedValue = Math.round(rawCalculation * multiplier) / multiplier;
    
    // Format for display
    let displayValue: string;
    if (decimalPlaces === 0 || roundedValue % 1 === 0) {
      displayValue = `${Math.round(roundedValue)}%`;
    } else {
      displayValue = `${roundedValue.toFixed(decimalPlaces)}%`;
    }
    
    return {
      value: roundedValue,
      displayValue,
      rawCalculation
    };
  }

  /**
   * Safe division with precision handling
   */
  static safeDivide(numerator: number, denominator: number, defaultValue: number = 0): number {
    if (denominator === 0 || !isFinite(denominator) || !isFinite(numerator)) {
      return defaultValue;
    }
    
    const result = numerator / denominator;
    return isFinite(result) ? result : defaultValue;
  }

  /**
   * Round number to specified decimal places
   */
  static roundToPrecision(value: number, decimalPlaces: number = 1): number {
    if (!isFinite(value)) {
      return 0;
    }
    
    const multiplier = Math.pow(10, decimalPlaces);
    return Math.round(value * multiplier) / multiplier;
  }

  /**
   * Format currency values with proper precision
   */
  static formatCurrency(value: number, locale: string = 'pt-BR', currency: string = 'BRL'): string {
    if (!isFinite(value)) {
      return 'R$ 0';
    }
    
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value);
    } catch (error) {
      // Fallback formatting
      return `R$ ${Math.round(value).toLocaleString('pt-BR')}`;
    }
  }

  /**
   * Format numeric values with proper precision
   */
  static formatNumber(value: number, decimalPlaces: number = 0, locale: string = 'pt-BR'): string {
    if (!isFinite(value)) {
      return '0';
    }
    
    try {
      return new Intl.NumberFormat(locale, {
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces
      }).format(value);
    } catch (error) {
      // Fallback formatting
      return decimalPlaces === 0 
        ? Math.round(value).toString()
        : value.toFixed(decimalPlaces);
    }
  }

  /**
   * Validate numeric input and return safe value
   */
  static validateNumber(value: any, defaultValue: number = 0): number {
    if (typeof value === 'number' && isFinite(value)) {
      return value;
    }
    
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      if (isFinite(parsed)) {
        return parsed;
      }
    }
    
    return defaultValue;
  }

  /**
   * Calculate progress bar fill percentage with proper bounds
   */
  static calculateProgressFill(current: number, target: number): number {
    if (target <= 0) {
      return 0;
    }
    
    const percentage = (current / target) * 100;
    
    // Ensure percentage is within bounds (0-100)
    return Math.max(0, Math.min(100, percentage));
  }

  /**
   * Determine progress bar color based on percentage
   */
  static getProgressColor(percentage: number): 'red' | 'yellow' | 'green' {
    if (percentage >= 100) {
      return 'green';
    } else if (percentage >= 70) {
      return 'yellow';
    } else {
      return 'red';
    }
  }

  /**
   * Calculate multiple percentages consistently
   */
  static calculateMultiplePercentages(
    values: Array<{ current: number; target: number; name: string }>
  ): Array<{ name: string; metric: PrecisionMetric }> {
    return values.map(({ current, target, name }) => ({
      name,
      metric: this.calculatePercentage(current, target)
    }));
  }

  /**
   * Apply precision fixes to existing percentage data
   */
  static fixExistingPercentage(percentage: number): PrecisionMetric {
    // Handle cases where percentage is already calculated but has precision issues
    const roundedValue = Math.round(percentage * 10) / 10;
    
    const displayValue = roundedValue % 1 === 0 
      ? `${Math.round(roundedValue)}%`
      : `${roundedValue}%`;
    
    return {
      value: roundedValue,
      displayValue,
      rawCalculation: percentage
    };
  }
}