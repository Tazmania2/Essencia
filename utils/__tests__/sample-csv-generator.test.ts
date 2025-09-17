import { SampleCSVGenerator, generateSampleCSV, generateTairaRabeloSample } from '../sample-csv-generator';

describe('SampleCSVGenerator', () => {
  describe('generateSampleCSV', () => {
    it('should generate valid CSV content with headers', () => {
      const csv = generateSampleCSV(['123456']);
      const lines = csv.split('\n');
      
      // Should have header + 1 data row
      expect(lines).toHaveLength(2);
      
      // Check header
      const header = lines[0];
      expect(header).toContain('Player ID');
      expect(header).toContain('Dia do Ciclo');
      expect(header).toContain('Faturamento Meta');
      expect(header).toContain('Reais por Ativo Meta');
      expect(header).toContain('Multimarcas por Ativo Meta');
      expect(header).toContain('Atividade Meta');
      
      // Check data row
      const dataRow = lines[1];
      expect(dataRow).toContain('123456');
      
      // Should have 21 columns (comma-separated) - includes new Conversões and UPA fields
      const columns = dataRow.split(',');
      expect(columns).toHaveLength(21);
    });

    it('should generate multiple player rows', () => {
      const playerIds = ['123456', 'player001', 'player002'];
      const csv = generateSampleCSV(playerIds);
      const lines = csv.split('\n');
      
      // Should have header + 3 data rows
      expect(lines).toHaveLength(4);
      
      // Check each player ID is present
      playerIds.forEach((playerId, index) => {
        expect(lines[index + 1]).toContain(playerId);
      });
    });

    it('should generate realistic data ranges', () => {
      const csv = generateSampleCSV(['test123']);
      const lines = csv.split('\n');
      const dataRow = lines[1].split(',');
      
      const playerId = dataRow[0];
      const diaDociclo = parseInt(dataRow[1]);
      const totalDiasCiclo = parseInt(dataRow[2]);
      const faturamentoMeta = parseInt(dataRow[3]);
      const reaisPorAtivoMeta = parseInt(dataRow[6]);
      
      expect(playerId).toBe('test123');
      expect(diaDociclo).toBeGreaterThanOrEqual(1);
      expect(diaDociclo).toBeLessThanOrEqual(21);
      expect(totalDiasCiclo).toBe(21);
      expect(faturamentoMeta).toBeGreaterThanOrEqual(100000);
      expect(faturamentoMeta).toBeLessThanOrEqual(150000);
      expect(reaisPorAtivoMeta).toBeGreaterThanOrEqual(1000);
      expect(reaisPorAtivoMeta).toBeLessThanOrEqual(1500);
    });
  });

  describe('generateSamplePlayerData', () => {
    it('should generate valid player data structure', () => {
      const playerData = SampleCSVGenerator.generateSamplePlayerData('test123');
      
      expect(playerData.playerId).toBe('test123');
      expect(playerData.diaDociclo).toBeGreaterThanOrEqual(1);
      expect(playerData.diaDociclo).toBeLessThanOrEqual(21);
      expect(playerData.totalDiasCiclo).toBe(21);
      
      // Check that percentages are calculated correctly
      const expectedFaturamentoPercentual = Math.round((playerData.faturamentoAtual / playerData.faturamentoMeta) * 100);
      expect(playerData.faturamentoPercentual).toBe(expectedFaturamentoPercentual);
      
      const expectedReaisPercentual = Math.round((playerData.reaisPorAtivoAtual / playerData.reaisPorAtivoMeta) * 100);
      expect(playerData.reaisPorAtivoPercentual).toBe(expectedReaisPercentual);
    });
  });

  describe('generateTairaRabeloSample', () => {
    it('should generate sample for Tairã Rabelo', () => {
      const csv = generateTairaRabeloSample();
      const lines = csv.split('\n');
      
      expect(lines).toHaveLength(2); // header + 1 data row
      expect(lines[1]).toContain('123456'); // Tairã's ID
    });
  });

  describe('CSV format validation', () => {
    it('should generate properly formatted CSV', () => {
      const csv = generateSampleCSV(['123456']);
      const lines = csv.split('\n');
      
      // Each line should have the same number of commas
      const headerCommas = (lines[0].match(/,/g) || []).length;
      const dataCommas = (lines[1].match(/,/g) || []).length;
      
      expect(headerCommas).toBe(dataCommas);
      expect(headerCommas).toBe(20); // 21 columns = 20 commas
    });

    it('should not contain invalid characters', () => {
      const csv = generateSampleCSV(['123456']);
      
      // Should not contain quotes, semicolons, or other problematic characters
      expect(csv).not.toContain('"');
      expect(csv).not.toContain(';');
      expect(csv).not.toContain('\r'); // Only \n line endings
    });
  });
});