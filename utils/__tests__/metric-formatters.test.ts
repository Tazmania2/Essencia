import {
  MetricFormatter,
  MetricFormatters,
  getMetricFormatter,
  createGoalDetailMetric,
  FALLBACK_VALUES,
  type MetricFormatOptions,
  type FormattedMetricValue
} from '../metric-formatters';

describe('MetricFormatter', () => {
  describe('formatValue', () => {
    it('should format currency values correctly', () => {
      const result = MetricFormatter.formatValue(1234.56, { type: 'currency' });
      
      expect(result.type).toBe('currency');
      expect(result.rawValue).toBe(1234.56);
      expect(result.unit).toBe('R$');
      expect(result.displayValue).toContain('1.234,56');
    });

    it('should format percentage values correctly', () => {
      const result = MetricFormatter.formatValue(85.7, { type: 'percentage' });
      
      expect(result.type).toBe('percentage');
      expect(result.rawValue).toBe(85.7);
      expect(result.unit).toBe('%');
      expect(result.displayValue).toBe('85.7 %');
    });

    it('should format whole number percentages without decimals', () => {
      const result = MetricFormatter.formatValue(100, { type: 'percentage' });
      
      expect(result.displayValue).toBe('100 %');
    });

    it('should format numeric values with thousands separators', () => {
      const result = MetricFormatter.formatValue(12345, { type: 'numeric' });
      
      expect(result.displayValue).toBe('12.345');
    });

    it('should format points correctly', () => {
      const result = MetricFormatter.formatValue(1234.5, { type: 'points' });
      
      expect(result.displayValue).toBe('1.234,5 pontos');
    });

    it('should format ratio values correctly', () => {
      const result = MetricFormatter.formatValue(2.75, { type: 'ratio', unit: 'marcas/ativo' });
      
      expect(result.displayValue).toBe('2,75 marcas/ativo');
    });

    it('should handle custom decimals', () => {
      const result = MetricFormatter.formatValue(123.456789, { 
        type: 'numeric', 
        decimals: 3 
      });
      
      expect(result.displayValue).toBe('123,457');
    });

    it('should handle prefix and suffix', () => {
      const result = MetricFormatter.formatValue(100, { 
        type: 'numeric',
        prefix: 'Total: ',
        suffix: ' items'
      });
      
      expect(result.displayValue).toBe('Total: 100 items');
    });

    it('should handle showUnit = false', () => {
      const result = MetricFormatter.formatValue(100, { 
        type: 'currency',
        showUnit: false
      });
      
      expect(result.displayValue).not.toContain('R$');
      expect(result.unit).toBe('');
    });
  });

  describe('edge cases', () => {
    it('should handle zero values', () => {
      const result = MetricFormatter.formatValue(0, { type: 'percentage' });
      expect(result.displayValue).toBe('0 %');
    });

    it('should handle negative values', () => {
      const result = MetricFormatter.formatValue(-100, { type: 'currency' });
      expect(result.displayValue).toContain('-100,00');
    });

    it('should handle very large numbers', () => {
      const result = MetricFormatter.formatValue(1000000, { type: 'numeric' });
      expect(result.displayValue).toBe('1.000.000');
    });

    it('should handle very small numbers', () => {
      const result = MetricFormatter.formatValue(0.001, { type: 'ratio', decimals: 3 });
      expect(result.displayValue).toBe('0,001');
    });

    it('should handle Infinity', () => {
      const result = MetricFormatter.formatValue(Infinity, { type: 'percentage' });
      expect(result.displayValue).toBe('0 %');
    });

    it('should handle NaN', () => {
      const result = MetricFormatter.formatValue(NaN, { type: 'percentage' });
      expect(result.displayValue).toBe('0 %');
    });
  });
});

describe('MetricFormatters', () => {
  describe('predefined formatters', () => {
    it('should format faturamento correctly', () => {
      const result = MetricFormatters.faturamento(50000);
      
      expect(result.type).toBe('currency');
      expect(result.unit).toBe('R$');
      expect(result.displayValue).toContain('50.000,00');
    });

    it('should format reaisPorAtivo correctly', () => {
      const result = MetricFormatters.reaisPorAtivo(1250.75);
      
      expect(result.type).toBe('currency');
      expect(result.displayValue).toContain('1.250,75');
    });

    it('should format atividade correctly', () => {
      const result = MetricFormatters.atividade(85.5);
      
      expect(result.type).toBe('points');
      expect(result.unit).toBe('pontos');
      expect(result.displayValue).toBe('85,5 pontos');
    });

    it('should format multimarcasPorAtivo correctly', () => {
      const result = MetricFormatters.multimarcasPorAtivo(2.75);
      
      expect(result.type).toBe('ratio');
      expect(result.unit).toBe('marcas/ativo');
      expect(result.displayValue).toBe('2,75 marcas/ativo');
    });

    it('should format conversoes correctly', () => {
      const result = MetricFormatters.conversoes(150);
      
      expect(result.type).toBe('numeric');
      expect(result.unit).toBe('conversões');
      expect(result.displayValue).toBe('150 conversões');
    });

    it('should format upa correctly', () => {
      const result = MetricFormatters.upa(45.67);
      
      expect(result.type).toBe('numeric');
      expect(result.unit).toBe('UPA');
      expect(result.displayValue).toBe('45,67 UPA');
    });

    it('should format percentage correctly', () => {
      const result = MetricFormatters.percentage(87.3);
      
      expect(result.type).toBe('percentage');
      expect(result.displayValue).toBe('87.3 %');
    });
  });
});

describe('getMetricFormatter', () => {
  it('should return correct formatter for known metrics', () => {
    const formatter = getMetricFormatter('faturamento');
    const result = formatter(1000);
    
    expect(result.type).toBe('currency');
  });

  it('should return default formatter for unknown metrics', () => {
    const formatter = getMetricFormatter('unknownMetric');
    const result = formatter(100);
    
    expect(result.type).toBe('points'); // Default fallback
  });
});

describe('createGoalDetailMetric', () => {
  it('should create properly formatted goal detail metric', () => {
    const metric = createGoalDetailMetric(
      'faturamento',
      'Faturamento',
      100000,
      75000,
      '📈'
    );

    expect(metric.name).toBe('faturamento');
    expect(metric.displayName).toBe('Faturamento');
    expect(metric.emoji).toBe('📈');
    expect(metric.target.type).toBe('currency');
    expect(metric.current.type).toBe('currency');
    expect(metric.percentage.type).toBe('percentage');
    expect(metric.percentage.displayValue).toBe('75 %');
  });

  it('should handle zero target values', () => {
    const metric = createGoalDetailMetric(
      'atividade',
      'Atividade',
      0,
      50
    );

    expect(metric.percentage.displayValue).toBe('0 %');
  });

  it('should use default emoji when not provided', () => {
    const metric = createGoalDetailMetric(
      'atividade',
      'Atividade',
      100,
      80
    );

    expect(metric.emoji).toBe('🎯');
  });
});

describe('FALLBACK_VALUES', () => {
  it('should provide appropriate fallback values', () => {
    expect(FALLBACK_VALUES.unavailable.displayValue).toBe('Dados indisponíveis');
    expect(FALLBACK_VALUES.loading.displayValue).toBe('Carregando...');
    expect(FALLBACK_VALUES.error.displayValue).toBe('Erro ao carregar');
    
    // All should have consistent structure
    Object.values(FALLBACK_VALUES).forEach(fallback => {
      expect(fallback).toHaveProperty('displayValue');
      expect(fallback).toHaveProperty('rawValue');
      expect(fallback).toHaveProperty('unit');
      expect(fallback).toHaveProperty('type');
    });
  });
});

describe('formatting consistency', () => {
  it('should maintain consistent formatting across different values', () => {
    const values = [0, 100, 1000, 10000, 100000];
    
    values.forEach(value => {
      const currency = MetricFormatters.faturamento(value);
      const points = MetricFormatters.atividade(value);
      
      // All should have proper structure
      expect(currency).toHaveProperty('displayValue');
      expect(currency).toHaveProperty('rawValue', value);
      expect(points).toHaveProperty('displayValue');
      expect(points).toHaveProperty('rawValue', value);
    });
  });

  it('should handle decimal precision consistently', () => {
    const testValue = 1234.5678;
    
    const currency = MetricFormatters.faturamento(testValue);
    const ratio = MetricFormatters.multimarcasPorAtivo(testValue);
    
    // Currency should have 2 decimal places
    expect(currency.displayValue).toContain(',57'); // Rounded to 2 decimals
    
    // Ratio should have 2 decimal places
    expect(ratio.displayValue).toContain(',57'); // Rounded to 2 decimals
  });
});