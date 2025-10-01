/**
 * PrecisionMath utility class for handling floating-point arithmetic precision issues
 * Addresses the requirement to fix percentage calculations showing values like "13.219999999999999%"
 */
export class PrecisionMath {
  /**
   * Calculate percentage with proper precision handling
   * @param current - Current value
   * @param target - Target value
   * @param decimalPlaces - Number of decimal places (default: 1)
   * @returns Properly rounded percentage
   */
  static calculatePercentage(current: number, target: number, decimalPlaces: number = 1): number {
    if (target === 0) {
      return 0;
    }
    
    const percentage = (current / target) * 100;
    return this.roundToPrecision(percentage, decimalPlaces);
  }

  /**
   * Round a number to specified decimal places with proper precision
   * @param value - Value to round
   * @param decimalPlaces - Number of decimal places
   * @returns Properly rounded number
   */
  static roundToPrecision(value: number, decimalPlaces: number): number {
    const factor = Math.pow(10, decimalPlaces);
    return Math.round((value + Number.EPSILON) * factor) / factor;
  }

  /**
   * Format percentage for display
   * @param percentage - Percentage value
   * @param showDecimals - Whether to show decimal places for whole numbers
   * @returns Formatted percentage string
   */
  static formatPercentage(percentage: number, showDecimals: boolean = false): string {
    const rounded = this.roundToPrecision(percentage, 1);
    
    // Show whole numbers without decimals unless explicitly requested
    if (rounded % 1 === 0 && !showDecimals) {
      return `${Math.round(rounded)}%`;
    }
    
    return `${rounded.toFixed(1)}%`;
  }

  /**
   * Add two numbers with precision handling
   * @param a - First number
   * @param b - Second number
   * @param decimalPlaces - Number of decimal places for result
   * @returns Sum with proper precision
   */
  static add(a: number, b: number, decimalPlaces: number = 2): number {
    return this.roundToPrecision(a + b, decimalPlaces);
  }

  /**
   * Subtract two numbers with precision handling
   * @param a - First number
   * @param b - Second number
   * @param decimalPlaces - Number of decimal places for result
   * @returns Difference with proper precision
   */
  static subtract(a: number, b: number, decimalPlaces: number = 2): number {
    return this.roundToPrecision(a - b, decimalPlaces);
  }

  /**
   * Multiply two numbers with precision handling
   * @param a - First number
   * @param b - Second number
   * @param decimalPlaces - Number of decimal places for result
   * @returns Product with proper precision
   */
  static multiply(a: number, b: number, decimalPlaces: number = 2): number {
    return this.roundToPrecision(a * b, decimalPlaces);
  }

  /**
   * Divide two numbers with precision handling
   * @param a - Dividend
   * @param b - Divisor
   * @param decimalPlaces - Number of decimal places for result
   * @returns Quotient with proper precision
   */
  static divide(a: number, b: number, decimalPlaces: number = 2): number {
    if (b === 0) {
      return 0;
    }
    return this.roundToPrecision(a / b, decimalPlaces);
  }

  /**
   * Calculate average with precision handling
   * @param values - Array of numbers
   * @param decimalPlaces - Number of decimal places for result
   * @returns Average with proper precision
   */
  static average(values: number[], decimalPlaces: number = 2): number {
    if (values.length === 0) {
      return 0;
    }
    
    const sum = values.reduce((acc, val) => acc + val, 0);
    return this.divide(sum, values.length, decimalPlaces);
  }

  /**
   * Check if two numbers are equal within a precision tolerance
   * @param a - First number
   * @param b - Second number
   * @param tolerance - Tolerance for comparison (default: 0.001)
   * @returns True if numbers are equal within tolerance
   */
  static isEqual(a: number, b: number, tolerance: number = 0.001): boolean {
    return Math.abs(a - b) < tolerance;
  }
}

// Export singleton instance for convenience
export const precisionMath = PrecisionMath;