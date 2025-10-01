/**
 * Performance tests for PrecisionMath utility
 * Tests performance of mathematical operations with large datasets
 */

import { PrecisionMath } from '../precision-math';

describe('PrecisionMath Performance Tests', () => {
  describe('Calculation Performance', () => {
    it('should handle large-scale percentage calculations efficiently', () => {
      const iterations = 10000;
      const testData = Array.from({ length: iterations }, () => ({
        current: Math.random() * 1000,
        target: Math.random() * 1000 + 100 // Ensure target is not zero
      }));

      const startTime = performance.now();
      
      const results = testData.map(({ current, target }) => 
        PrecisionMath.calculatePercentage(current, target)
      );
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      const averageTime = executionTime / iterations;

      expect(results).toHaveLength(iterations);
      results.forEach(result => {
        expect(typeof result).toBe('number');
        expect(result).toBeGreaterThanOrEqual(0);
      });

      expect(averageTime).toBeLessThan(0.01); // Each calculation should be under 0.01ms
      expect(executionTime).toBeLessThan(100); // Total should be under 100ms
    });

    it('should handle precision rounding operations efficiently', () => {
      const iterations = 50000;
      const testValues = Array.from({ length: iterations }, () => 
        Math.random() * 1000 + Math.random() * 0.999999999
      );

      const startTime = performance.now();
      
      const results = testValues.map(value => 
        PrecisionMath.roundToPrecision(value, 2)
      );
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      const averageTime = executionTime / iterations;

      expect(results).toHaveLength(iterations);
      results.forEach(result => {
        expect(typeof result).toBe('number');
        expect(Number.isFinite(result)).toBe(true);
      });

      expect(averageTime).toBeLessThan(0.005); // Each rounding should be under 0.005ms
      expect(executionTime).toBeLessThan(250); // Total should be under 250ms
    });

    it('should handle percentage formatting efficiently', () => {
      const iterations = 20000;
      const testPercentages = Array.from({ length: iterations }, () => 
        Math.random() * 200 - 50 // Range from -50 to 150
      );

      const startTime = performance.now();
      
      const results = testPercentages.map(percentage => 
        PrecisionMath.formatPercentage(percentage)
      );
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      const averageTime = executionTime / iterations;

      expect(results).toHaveLength(iterations);
      results.forEach(result => {
        expect(typeof result).toBe('string');
        expect(result).toMatch(/^-?\d+(\.\d)?%$/);
      });

      expect(averageTime).toBeLessThan(0.01); // Each formatting should be under 0.01ms
      expect(executionTime).toBeLessThan(200); // Total should be under 200ms
    });
  });

  describe('Arithmetic Operations Performance', () => {
    it('should handle large-scale addition operations efficiently', () => {
      const iterations = 25000;
      const testPairs = Array.from({ length: iterations }, () => ({
        a: Math.random() * 1000,
        b: Math.random() * 1000
      }));

      const startTime = performance.now();
      
      const results = testPairs.map(({ a, b }) => 
        PrecisionMath.add(a, b)
      );
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      const averageTime = executionTime / iterations;

      expect(results).toHaveLength(iterations);
      results.forEach((result, i) => {
        expect(typeof result).toBe('number');
        expect(result).toBeCloseTo(testPairs[i].a + testPairs[i].b, 2);
      });

      expect(averageTime).toBeLessThan(0.008); // Each addition should be under 0.008ms
      expect(executionTime).toBeLessThan(200); // Total should be under 200ms
    });

    it('should handle complex arithmetic chains efficiently', () => {
      const iterations = 5000;
      const testData = Array.from({ length: iterations }, () => ({
        values: Array.from({ length: 10 }, () => Math.random() * 100)
      }));

      const startTime = performance.now();
      
      const results = testData.map(({ values }) => {
        // Perform a chain of operations: add, subtract, multiply, divide
        let result = values[0];
        for (let i = 1; i < values.length; i++) {
          switch (i % 4) {
            case 1:
              result = PrecisionMath.add(result, values[i]);
              break;
            case 2:
              result = PrecisionMath.subtract(result, values[i]);
              break;
            case 3:
              result = PrecisionMath.multiply(result, values[i]);
              break;
            case 0:
              result = PrecisionMath.divide(result, values[i] || 1); // Avoid division by zero
              break;
          }
        }
        return result;
      });
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      const averageTime = executionTime / iterations;

      expect(results).toHaveLength(iterations);
      results.forEach(result => {
        expect(typeof result).toBe('number');
        expect(Number.isFinite(result)).toBe(true);
      });

      expect(averageTime).toBeLessThan(0.1); // Each chain should be under 0.1ms
      expect(executionTime).toBeLessThan(500); // Total should be under 500ms
    });
  });

  describe('Statistical Operations Performance', () => {
    it('should handle large array averages efficiently', () => {
      const arraySize = 1000;
      const iterations = 1000;
      
      const testArrays = Array.from({ length: iterations }, () => 
        Array.from({ length: arraySize }, () => Math.random() * 100)
      );

      const startTime = performance.now();
      
      const results = testArrays.map(array => 
        PrecisionMath.average(array)
      );
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      const averageTime = executionTime / iterations;

      expect(results).toHaveLength(iterations);
      results.forEach((result, i) => {
        expect(typeof result).toBe('number');
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThanOrEqual(100);
        
        // Verify correctness
        const expectedAverage = testArrays[i].reduce((a, b) => a + b, 0) / testArrays[i].length;
        expect(result).toBeCloseTo(expectedAverage, 2);
      });

      expect(averageTime).toBeLessThan(1); // Each average should be under 1ms
      expect(executionTime).toBeLessThan(1000); // Total should be under 1 second
    });

    it('should handle equality comparisons efficiently', () => {
      const iterations = 100000;
      const testPairs = Array.from({ length: iterations }, () => {
        const base = Math.random() * 1000;
        const variation = Math.random() * 0.002 - 0.001; // Small variation
        return {
          a: base,
          b: base + variation
        };
      });

      const startTime = performance.now();
      
      const results = testPairs.map(({ a, b }) => 
        PrecisionMath.isEqual(a, b, 0.001)
      );
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      const averageTime = executionTime / iterations;

      expect(results).toHaveLength(iterations);
      results.forEach(result => {
        expect(typeof result).toBe('boolean');
      });

      expect(averageTime).toBeLessThan(0.002); // Each comparison should be under 0.002ms
      expect(executionTime).toBeLessThan(200); // Total should be under 200ms
    });
  });

  describe('Real-world Scenario Performance', () => {
    it('should handle dashboard percentage calculations at scale', () => {
      // Simulate calculating percentages for 1000 players across 6 team types with 3 metrics each
      const playerCount = 1000;
      const teamTypes = 6;
      const metricsPerTeam = 3;
      const totalCalculations = playerCount * teamTypes * metricsPerTeam;

      const testData = Array.from({ length: totalCalculations }, () => ({
        current: Math.random() * 1000,
        target: Math.random() * 1000 + 100,
        playerId: `player_${Math.floor(Math.random() * playerCount)}`,
        teamType: `team_${Math.floor(Math.random() * teamTypes)}`,
        metric: `metric_${Math.floor(Math.random() * metricsPerTeam)}`
      }));

      const startTime = performance.now();
      
      const results = testData.map(({ current, target }) => {
        const percentage = PrecisionMath.calculatePercentage(current, target);
        return PrecisionMath.formatPercentage(percentage);
      });
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      const averageTime = executionTime / totalCalculations;

      expect(results).toHaveLength(totalCalculations);
      results.forEach(result => {
        expect(typeof result).toBe('string');
        expect(result).toMatch(/^\d+(\.\d)?%$/);
      });

      expect(averageTime).toBeLessThan(0.01); // Each calculation+format should be under 0.01ms
      expect(executionTime).toBeLessThan(1000); // Total should be under 1 second
    });

    it('should handle cycle comparison calculations efficiently', () => {
      // Simulate comparing 100 cycles with 3 metrics each
      const cycleCount = 100;
      const metricsPerCycle = 3;
      
      const cycles = Array.from({ length: cycleCount }, (_, i) => ({
        cycleNumber: i + 1,
        metrics: Array.from({ length: metricsPerCycle }, () => Math.random() * 100)
      }));

      const startTime = performance.now();
      
      // Calculate improvements between consecutive cycles
      const improvements = [];
      for (let i = 1; i < cycles.length; i++) {
        const currentCycle = cycles[i];
        const previousCycle = cycles[i - 1];
        
        const cycleImprovement = currentCycle.metrics.map((current, metricIndex) => {
          const previous = previousCycle.metrics[metricIndex];
          return PrecisionMath.subtract(current, previous, 1);
        });
        
        const averageImprovement = PrecisionMath.average(cycleImprovement, 1);
        improvements.push(averageImprovement);
      }
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;

      expect(improvements).toHaveLength(cycleCount - 1);
      improvements.forEach(improvement => {
        expect(typeof improvement).toBe('number');
        expect(Number.isFinite(improvement)).toBe(true);
      });

      expect(executionTime).toBeLessThan(50); // Should complete within 50ms
    });

    it('should handle financial calculations with precision', () => {
      // Simulate financial calculations for revenue, costs, and profits
      const transactionCount = 10000;
      
      const transactions = Array.from({ length: transactionCount }, () => ({
        revenue: Math.random() * 10000,
        cost: Math.random() * 5000,
        taxRate: Math.random() * 0.3 + 0.1 // 10-40% tax rate
      }));

      const startTime = performance.now();
      
      const results = transactions.map(({ revenue, cost, taxRate }) => {
        const grossProfit = PrecisionMath.subtract(revenue, cost, 2);
        const tax = PrecisionMath.multiply(grossProfit, taxRate, 2);
        const netProfit = PrecisionMath.subtract(grossProfit, tax, 2);
        const profitMargin = PrecisionMath.calculatePercentage(netProfit, revenue, 2);
        
        return {
          grossProfit,
          tax,
          netProfit,
          profitMargin
        };
      });
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      const averageTime = executionTime / transactionCount;

      expect(results).toHaveLength(transactionCount);
      results.forEach(result => {
        expect(typeof result.grossProfit).toBe('number');
        expect(typeof result.tax).toBe('number');
        expect(typeof result.netProfit).toBe('number');
        expect(typeof result.profitMargin).toBe('number');
        
        expect(Number.isFinite(result.grossProfit)).toBe(true);
        expect(Number.isFinite(result.tax)).toBe(true);
        expect(Number.isFinite(result.netProfit)).toBe(true);
        expect(Number.isFinite(result.profitMargin)).toBe(true);
      });

      expect(averageTime).toBeLessThan(0.05); // Each transaction should be under 0.05ms
      expect(executionTime).toBeLessThan(500); // Total should be under 500ms
    });
  });

  describe('Memory Usage Performance', () => {
    it('should not cause memory leaks with repeated operations', () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Perform many operations that could potentially cause memory leaks
      for (let i = 0; i < 10000; i++) {
        const values = Array.from({ length: 100 }, () => Math.random() * 1000);
        
        // Perform various operations
        PrecisionMath.average(values);
        values.forEach(value => {
          PrecisionMath.roundToPrecision(value, 2);
          PrecisionMath.formatPercentage(value);
          PrecisionMath.calculatePercentage(value, 100);
        });
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be minimal (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });

    it('should handle concurrent operations efficiently', async () => {
      const concurrentOperations = 100;
      const operationsPerTask = 1000;
      
      const tasks = Array.from({ length: concurrentOperations }, async (_, taskId) => {
        const results = [];
        
        for (let i = 0; i < operationsPerTask; i++) {
          const a = Math.random() * 1000;
          const b = Math.random() * 1000;
          
          const sum = PrecisionMath.add(a, b);
          const percentage = PrecisionMath.calculatePercentage(sum, 2000);
          const formatted = PrecisionMath.formatPercentage(percentage);
          
          results.push({ taskId, operation: i, result: formatted });
        }
        
        return results;
      });

      const startTime = performance.now();
      const allResults = await Promise.all(tasks);
      const endTime = performance.now();
      
      const executionTime = endTime - startTime;
      const totalOperations = concurrentOperations * operationsPerTask;
      const averageTime = executionTime / totalOperations;

      expect(allResults).toHaveLength(concurrentOperations);
      allResults.forEach((taskResults, taskId) => {
        expect(taskResults).toHaveLength(operationsPerTask);
        taskResults.forEach(result => {
          expect(result.taskId).toBe(taskId);
          expect(typeof result.result).toBe('string');
        });
      });

      expect(averageTime).toBeLessThan(0.01); // Each operation should be under 0.01ms
      expect(executionTime).toBeLessThan(2000); // Total should be under 2 seconds
    });
  });
});