import { PrecisionMath, precisionMath } from '../precision-math';

describe('PrecisionMath', () => {
  describe('calculatePercentage', () => {
    it('should calculate percentage correctly', () => {
      expect(PrecisionMath.calculatePercentage(50, 100)).toBe(50.0);
      expect(PrecisionMath.calculatePercentage(75, 100)).toBe(75.0);
      expect(PrecisionMath.calculatePercentage(33.33, 100)).toBe(33.3);
    });

    it('should handle floating-point precision issues', () => {
      // This would normally result in 13.219999999999999
      expect(PrecisionMath.calculatePercentage(13.22, 100)).toBe(13.2);
      expect(PrecisionMath.calculatePercentage(66.66666, 100)).toBe(66.7);
    });

    it('should handle zero target gracefully', () => {
      expect(PrecisionMath.calculatePercentage(50, 0)).toBe(0);
    });

    it('should respect decimal places parameter', () => {
      expect(PrecisionMath.calculatePercentage(33.333, 100, 0)).toBe(33);
      expect(PrecisionMath.calculatePercentage(33.333, 100, 2)).toBe(33.33);
      expect(PrecisionMath.calculatePercentage(33.333, 100, 3)).toBe(33.333);
    });

    it('should handle values over 100%', () => {
      expect(PrecisionMath.calculatePercentage(150, 100)).toBe(150.0);
      expect(PrecisionMath.calculatePercentage(125.5, 100)).toBe(125.5);
    });
  });

  describe('roundToPrecision', () => {
    it('should round to specified decimal places', () => {
      expect(PrecisionMath.roundToPrecision(3.14159, 2)).toBe(3.14);
      expect(PrecisionMath.roundToPrecision(3.14159, 3)).toBe(3.142);
      expect(PrecisionMath.roundToPrecision(3.14159, 0)).toBe(3);
    });

    it('should handle floating-point precision issues', () => {
      expect(PrecisionMath.roundToPrecision(0.1 + 0.2, 1)).toBe(0.3);
      expect(PrecisionMath.roundToPrecision(1.005, 2)).toBe(1.01); // Proper rounding
    });

    it('should handle negative numbers', () => {
      expect(PrecisionMath.roundToPrecision(-3.14159, 2)).toBe(-3.14);
      expect(PrecisionMath.roundToPrecision(-0.1 - 0.2, 1)).toBe(-0.3);
    });

    it('should handle zero and whole numbers', () => {
      expect(PrecisionMath.roundToPrecision(0, 2)).toBe(0);
      expect(PrecisionMath.roundToPrecision(5, 2)).toBe(5);
      expect(PrecisionMath.roundToPrecision(5.0, 2)).toBe(5);
    });
  });

  describe('formatPercentage', () => {
    it('should format whole percentages without decimals by default', () => {
      expect(PrecisionMath.formatPercentage(100)).toBe('100%');
      expect(PrecisionMath.formatPercentage(50)).toBe('50%');
      expect(PrecisionMath.formatPercentage(0)).toBe('0%');
    });

    it('should format decimal percentages with one decimal place', () => {
      expect(PrecisionMath.formatPercentage(50.5)).toBe('50.5%');
      expect(PrecisionMath.formatPercentage(33.3)).toBe('33.3%');
      expect(PrecisionMath.formatPercentage(66.7)).toBe('66.7%');
    });

    it('should show decimals for whole numbers when requested', () => {
      expect(PrecisionMath.formatPercentage(100, true)).toBe('100.0%');
      expect(PrecisionMath.formatPercentage(50, true)).toBe('50.0%');
    });

    it('should handle precision issues in formatting', () => {
      expect(PrecisionMath.formatPercentage(13.219999999999999)).toBe('13.2%');
      expect(PrecisionMath.formatPercentage(99.99999999999999)).toBe('100%');
    });

    it('should handle negative percentages', () => {
      expect(PrecisionMath.formatPercentage(-10.5)).toBe('-10.5%');
      expect(PrecisionMath.formatPercentage(-100)).toBe('-100%');
    });
  });

  describe('add', () => {
    it('should add numbers with precision handling', () => {
      expect(PrecisionMath.add(0.1, 0.2)).toBe(0.3);
      expect(PrecisionMath.add(1.1, 2.2)).toBe(3.3);
    });

    it('should respect decimal places parameter', () => {
      expect(PrecisionMath.add(1.111, 2.222, 1)).toBe(3.3);
      expect(PrecisionMath.add(1.111, 2.222, 3)).toBe(3.333);
    });

    it('should handle negative numbers', () => {
      expect(PrecisionMath.add(-1.1, 2.2)).toBe(1.1);
      expect(PrecisionMath.add(-1.1, -2.2)).toBe(-3.3);
    });
  });

  describe('subtract', () => {
    it('should subtract numbers with precision handling', () => {
      expect(PrecisionMath.subtract(0.3, 0.1)).toBe(0.2);
      expect(PrecisionMath.subtract(2.2, 1.1)).toBe(1.1);
    });

    it('should respect decimal places parameter', () => {
      expect(PrecisionMath.subtract(3.333, 1.111, 1)).toBe(2.2);
      expect(PrecisionMath.subtract(3.333, 1.111, 3)).toBe(2.222);
    });

    it('should handle negative results', () => {
      expect(PrecisionMath.subtract(1.1, 2.2)).toBe(-1.1);
      expect(PrecisionMath.subtract(-1.1, 2.2)).toBe(-3.3);
    });
  });

  describe('multiply', () => {
    it('should multiply numbers with precision handling', () => {
      expect(PrecisionMath.multiply(0.1, 3)).toBe(0.3);
      expect(PrecisionMath.multiply(1.1, 2)).toBe(2.2);
    });

    it('should respect decimal places parameter', () => {
      expect(PrecisionMath.multiply(1.111, 2, 1)).toBe(2.2);
      expect(PrecisionMath.multiply(1.111, 2, 3)).toBe(2.222);
    });

    it('should handle negative numbers', () => {
      expect(PrecisionMath.multiply(-1.1, 2)).toBe(-2.2);
      expect(PrecisionMath.multiply(-1.1, -2)).toBe(2.2);
    });
  });

  describe('divide', () => {
    it('should divide numbers with precision handling', () => {
      expect(PrecisionMath.divide(0.3, 3)).toBe(0.1);
      expect(PrecisionMath.divide(2.2, 2)).toBe(1.1);
    });

    it('should handle division by zero', () => {
      expect(PrecisionMath.divide(10, 0)).toBe(0);
      expect(PrecisionMath.divide(0, 0)).toBe(0);
    });

    it('should respect decimal places parameter', () => {
      expect(PrecisionMath.divide(1, 3, 1)).toBe(0.3);
      expect(PrecisionMath.divide(1, 3, 3)).toBe(0.333);
    });

    it('should handle negative numbers', () => {
      expect(PrecisionMath.divide(-2.2, 2)).toBe(-1.1);
      expect(PrecisionMath.divide(-2.2, -2)).toBe(1.1);
    });
  });

  describe('average', () => {
    it('should calculate average with precision handling', () => {
      expect(PrecisionMath.average([0.1, 0.2, 0.3])).toBe(0.2);
      expect(PrecisionMath.average([1.1, 2.2, 3.3])).toBe(2.2);
    });

    it('should handle empty array', () => {
      expect(PrecisionMath.average([])).toBe(0);
    });

    it('should handle single value', () => {
      expect(PrecisionMath.average([5.5])).toBe(5.5);
    });

    it('should respect decimal places parameter', () => {
      expect(PrecisionMath.average([1, 2, 3], 0)).toBe(2);
      expect(PrecisionMath.average([1.111, 2.222, 3.333], 1)).toBe(2.2);
    });

    it('should handle negative numbers', () => {
      expect(PrecisionMath.average([-1.1, 1.1, 0])).toBe(0);
      expect(PrecisionMath.average([-1, -2, -3])).toBe(-2);
    });
  });

  describe('isEqual', () => {
    it('should compare numbers within tolerance', () => {
      expect(PrecisionMath.isEqual(0.1 + 0.2, 0.3)).toBe(true);
      expect(PrecisionMath.isEqual(1.0, 1.0001, 0.001)).toBe(true);
      expect(PrecisionMath.isEqual(1.0, 1.1, 0.001)).toBe(false);
    });

    it('should use default tolerance', () => {
      expect(PrecisionMath.isEqual(1.0, 1.0005)).toBe(true);
      expect(PrecisionMath.isEqual(1.0, 1.002)).toBe(false);
    });

    it('should handle negative numbers', () => {
      expect(PrecisionMath.isEqual(-0.1 - 0.2, -0.3)).toBe(true);
      expect(PrecisionMath.isEqual(-1.0, -1.0001, 0.001)).toBe(true);
    });

    it('should handle zero', () => {
      expect(PrecisionMath.isEqual(0, 0.0001, 0.001)).toBe(true);
      expect(PrecisionMath.isEqual(0, 0.002)).toBe(false);
    });
  });

  describe('singleton instance', () => {
    it('should export singleton instance', () => {
      expect(precisionMath).toBe(PrecisionMath);
    });
  });

  describe('edge cases and real-world scenarios', () => {
    it('should handle typical dashboard percentage calculations', () => {
      // Simulate real dashboard calculations that were causing precision issues
      const target = 1000;
      const current = 132.2;
      const percentage = PrecisionMath.calculatePercentage(current, target);
      expect(percentage).toBe(13.2);
      expect(PrecisionMath.formatPercentage(percentage)).toBe('13.2%');
    });

    it('should handle currency calculations', () => {
      const price1 = 19.99;
      const price2 = 29.99;
      const total = PrecisionMath.add(price1, price2);
      expect(total).toBe(49.98);
    });

    it('should handle percentage differences', () => {
      const oldValue = 85.5;
      const newValue = 92.3;
      const difference = PrecisionMath.subtract(newValue, oldValue, 1);
      expect(difference).toBe(6.8);
    });

    it('should handle complex calculations', () => {
      // Simulate a complex calculation that might have precision issues
      const values = [13.219999999999999, 66.66666666666667, 99.99999999999999];
      const average = PrecisionMath.average(values, 1);
      expect(average).toBe(60.0); // Should be properly rounded
    });
  });
});