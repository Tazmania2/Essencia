import { PrecisionMath } from '../precision-math';

describe('PrecisionMath', () => {
  describe('calculatePercentage', () => {
    it('should calculate percentage correctly', () => {
      const result = PrecisionMath.calculatePercentage(50, 100);
      expect(result.value).toBe(50);
      expect(result.displayValue).toBe('50%');
    });

    it('should handle zero target', () => {
      const result = PrecisionMath.calculatePercentage(50, 0);
      expect(result.value).toBe(0);
      expect(result.displayValue).toBe('0%');
    });

    it('should format whole numbers without decimals', () => {
      const result = PrecisionMath.calculatePercentage(100, 100);
      expect(result.value).toBe(100);
      expect(result.displayValue).toBe('100%');
    });

    it('should format decimal numbers with one decimal place', () => {
      const result = PrecisionMath.calculatePercentage(33, 100);
      expect(result.value).toBe(33);
      expect(result.displayValue).toBe('33%');
    });

    it('should fix floating point precision issues', () => {
      const result = PrecisionMath.calculatePercentage(1, 3);
      expect(result.displayValue).toBe('33.3%');
      expect(result.value).toBe(33.3);
    });
  });

  describe('formatCurrency', () => {
    it('should format currency correctly', () => {
      const result = PrecisionMath.formatCurrency(1000);
      expect(result).toMatch(/R\$.*1\.000/);
    });

    it('should handle zero values', () => {
      const result = PrecisionMath.formatCurrency(0);
      expect(result).toBe('R$ 0');
    });

    it('should handle invalid values', () => {
      const result = PrecisionMath.formatCurrency(NaN);
      expect(result).toBe('R$ 0');
    });
  });

  describe('validateNumber', () => {
    it('should return valid numbers unchanged', () => {
      expect(PrecisionMath.validateNumber(42)).toBe(42);
      expect(PrecisionMath.validateNumber(0)).toBe(0);
      expect(PrecisionMath.validateNumber(-10)).toBe(-10);
    });

    it('should parse valid string numbers', () => {
      expect(PrecisionMath.validateNumber('42')).toBe(42);
      expect(PrecisionMath.validateNumber('3.14')).toBe(3.14);
    });

    it('should return default for invalid inputs', () => {
      expect(PrecisionMath.validateNumber('invalid')).toBe(0);
      expect(PrecisionMath.validateNumber(null)).toBe(0);
      expect(PrecisionMath.validateNumber(undefined)).toBe(0);
      expect(PrecisionMath.validateNumber(NaN)).toBe(0);
    });

    it('should use custom default value', () => {
      expect(PrecisionMath.validateNumber('invalid', 100)).toBe(100);
    });
  });
});