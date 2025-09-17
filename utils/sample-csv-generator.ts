/**
 * Sample CSV Generator for Report Upload Testing
 * 
 * This utility generates sample CSV files with the expected format for testing
 * the report upload functionality.
 */

export interface SamplePlayerData {
  playerId: string;
  diaDociclo: number;
  totalDiasCiclo: number;
  faturamentoMeta: number;
  faturamentoAtual: number;
  faturamentoPercentual: number;
  reaisPorAtivoMeta: number;
  reaisPorAtivoAtual: number;
  reaisPorAtivoPercentual: number;
  multimarcasPorAtivoMeta: number;
  multimarcasPorAtivoAtual: number;
  multimarcasPorAtivoPercentual: number;
  atividadeMeta: number;
  atividadeAtual: number;
  atividadePercentual: number;
  conversoesMeta: number;
  conversoesAtual: number;
  conversoesPercentual: number;
  upaMeta: number;
  upaAtual: number;
  upaPercentual: number;
}

export class SampleCSVGenerator {
  /**
   * Generate sample CSV content with realistic data
   */
  static generateSampleCSV(playerIds: string[] = ['123456']): string {
    const headers = [
      'Player ID',
      'Dia do Ciclo',
      'Total Dias Ciclo',
      'Faturamento Meta',
      'Faturamento Atual',
      'Faturamento %',
      'Reais por Ativo Meta',
      'Reais por Ativo Atual',
      'Reais por Ativo %',
      'Multimarcas por Ativo Meta',
      'Multimarcas por Ativo Atual',
      'Multimarcas por Ativo %',
      'Atividade Meta',
      'Atividade Atual',
      'Atividade %',
      'Conversões Meta',
      'Conversões Atual',
      'Conversões %',
      'UPA Meta',
      'UPA Atual',
      'UPA %'
    ];

    const rows = [headers.join(',')];

    playerIds.forEach(playerId => {
      const sampleData = SampleCSVGenerator.generateSamplePlayerData(playerId);
      const row = [
        sampleData.playerId,
        sampleData.diaDociclo,
        sampleData.totalDiasCiclo,
        sampleData.faturamentoMeta,
        sampleData.faturamentoAtual,
        sampleData.faturamentoPercentual,
        sampleData.reaisPorAtivoMeta,
        sampleData.reaisPorAtivoAtual,
        sampleData.reaisPorAtivoPercentual,
        sampleData.multimarcasPorAtivoMeta,
        sampleData.multimarcasPorAtivoAtual,
        sampleData.multimarcasPorAtivoPercentual,
        sampleData.atividadeMeta,
        sampleData.atividadeAtual,
        sampleData.atividadePercentual,
        sampleData.conversoesMeta,
        sampleData.conversoesAtual,
        sampleData.conversoesPercentual,
        sampleData.upaMeta,
        sampleData.upaAtual,
        sampleData.upaPercentual
      ].join(',');
      
      rows.push(row);
    });

    return rows.join('\n');
  }

  /**
   * Generate realistic sample data for a player
   */
  static generateSamplePlayerData(playerId: string): SamplePlayerData {
    // Simulate current cycle day (between 1 and 21)
    const diaDociclo = Math.floor(Math.random() * 21) + 1;
    const totalDiasCiclo = 21;

    // Generate realistic meta values
    const faturamentoMeta = Math.floor(Math.random() * 50000) + 100000; // 100k-150k
    const reaisPorAtivoMeta = Math.floor(Math.random() * 500) + 1000; // 1000-1500
    const multimarcasPorAtivoMeta = Math.floor(Math.random() * 20) + 30; // 30-50
    const atividadeMeta = Math.floor(Math.random() * 20) + 80; // 80-100

    // Generate current values (with some variation)
    const faturamentoAtual = Math.floor(faturamentoMeta * (0.7 + Math.random() * 0.6)); // 70%-130% of meta
    const reaisPorAtivoAtual = Math.floor(reaisPorAtivoMeta * (0.8 + Math.random() * 0.4)); // 80%-120% of meta
    const multimarcasPorAtivoAtual = Math.floor(multimarcasPorAtivoMeta * (0.6 + Math.random() * 0.8)); // 60%-140% of meta
    const atividadeAtual = Math.floor(atividadeMeta * (0.5 + Math.random() * 1.0)); // 50%-150% of meta

    // Generate new metrics (Conversões and UPA)
    const conversoesMeta = Math.floor(Math.random() * 50) + 100; // 100-150 conversões
    const conversoesAtual = Math.floor(conversoesMeta * (0.6 + Math.random() * 0.8)); // 60%-140% of meta
    const conversoesPercentual = Math.round((conversoesAtual / conversoesMeta) * 100);

    const upaMeta = Math.floor(Math.random() * 20) + 80; // 80-100 UPA
    const upaAtual = Math.floor(upaMeta * (0.7 + Math.random() * 0.6)); // 70%-130% of meta
    const upaPercentual = Math.round((upaAtual / upaMeta) * 100);

    // Calculate percentages
    const faturamentoPercentual = Math.round((faturamentoAtual / faturamentoMeta) * 100);
    const reaisPorAtivoPercentual = Math.round((reaisPorAtivoAtual / reaisPorAtivoMeta) * 100);
    const multimarcasPorAtivoPercentual = Math.round((multimarcasPorAtivoAtual / multimarcasPorAtivoMeta) * 100);
    const atividadePercentual = Math.round((atividadeAtual / atividadeMeta) * 100);

    return {
      playerId,
      diaDociclo,
      totalDiasCiclo,
      faturamentoMeta,
      faturamentoAtual,
      faturamentoPercentual,
      reaisPorAtivoMeta,
      reaisPorAtivoAtual,
      reaisPorAtivoPercentual,
      multimarcasPorAtivoMeta,
      multimarcasPorAtivoAtual,
      multimarcasPorAtivoPercentual,
      atividadeMeta,
      atividadeAtual,
      atividadePercentual,
      conversoesMeta,
      conversoesAtual,
      conversoesPercentual,
      upaMeta,
      upaAtual,
      upaPercentual
    };
  }

  /**
   * Download sample CSV file
   */
  static downloadSampleCSV(playerIds: string[] = ['123456'], filename: string = 'sample-report.csv'): void {
    const csvContent = this.generateSampleCSV(playerIds);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }

  /**
   * Generate sample data for Tairã Rabelo (the admin user example)
   */
  static generateTairaRabeloSample(): string {
    return SampleCSVGenerator.generateSampleCSV(['123456']); // Using the ID from your example
  }

  /**
   * Generate sample data for multiple players
   */
  static generateMultiPlayerSample(): string {
    const playerIds = [
      '123456', // Tairã Rabelo
      'player001',
      'player002',
      'player003',
      'player004'
    ];
    return SampleCSVGenerator.generateSampleCSV(playerIds);
  }
}

// Export the class and utility functions for easy use
export { SampleCSVGenerator };
export const generateSampleCSV = SampleCSVGenerator.generateSampleCSV;
export const downloadSampleCSV = SampleCSVGenerator.downloadSampleCSV;
export const generateTairaRabeloSample = SampleCSVGenerator.generateTairaRabeloSample;
export const generateMultiPlayerSample = SampleCSVGenerator.generateMultiPlayerSample;