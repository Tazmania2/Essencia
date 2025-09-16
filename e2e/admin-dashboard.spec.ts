import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication for admin user
    await page.route('**/auth/token', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'mock-admin-token-123',
          token_type: 'Bearer',
          expires_in: 3600
        })
      });
    });

    // Mock admin user response (no teams = admin)
    await page.route('**/player_status*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          _id: 'admin_123',
          name: 'Admin User',
          total_points: 0,
          teams: [], // Empty teams array indicates admin
          catalog_items: {},
          level_progress: {
            percent_completed: 0,
            next_points: 0,
            total_levels: 0,
            percent: 0
          },
          challenge_progress: [],
          total_challenges: 0,
          challenges: {},
          point_categories: {},
          total_catalog_items: 0,
          positions: [],
          time: Date.now(),
          extra: {},
          pointCategories: {}
        })
      });
    });

    // Navigate to login and authenticate as admin
    await page.goto('/login');
    await page.fill('input[type="text"], input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'adminpassword');
    await page.click('button[type="submit"]');
    
    // Wait for admin dashboard to load
    await expect(page).toHaveURL('/admin');
  });

  test('should display admin dashboard layout', async ({ page }) => {
    // Check admin header
    await expect(page.locator('text=Admin, text=Administrador')).toBeVisible();
    
    // Check sidebar navigation
    await expect(page.locator('[data-testid="admin-sidebar"], .admin-sidebar')).toBeVisible();
    
    // Check main sections
    await expect(page.locator('text=Jogadores, text=Players')).toBeVisible();
    await expect(page.locator('text=Relatórios, text=Reports')).toBeVisible();
  });

  test('should load and display player list', async ({ page }) => {
    // Mock players list API
    await page.route('**/players*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            _id: 'player_1',
            name: 'João Silva',
            teams: ['team_carteira_i'],
            total_points: 1500
          },
          {
            _id: 'player_2',
            name: 'Maria Santos',
            teams: ['team_carteira_ii'],
            total_points: 2000
          },
          {
            _id: 'player_3',
            name: 'Pedro Costa',
            teams: ['team_carteira_iii'],
            total_points: 1200
          }
        ])
      });
    });

    // Navigate to players section or refresh if already there
    await page.click('text=Jogadores, text=Players');
    
    // Should show player list
    await expect(page.locator('text=João Silva')).toBeVisible();
    await expect(page.locator('text=Maria Santos')).toBeVisible();
    await expect(page.locator('text=Pedro Costa')).toBeVisible();
    
    // Should show player points
    await expect(page.locator('text=1.500, text=1500')).toBeVisible();
    await expect(page.locator('text=2.000, text=2000')).toBeVisible();
    await expect(page.locator('text=1.200, text=1200')).toBeVisible();
  });

  test('should allow searching for players', async ({ page }) => {
    // Mock players list API
    await page.route('**/players*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { _id: 'player_1', name: 'João Silva', teams: ['team_carteira_i'], total_points: 1500 },
          { _id: 'player_2', name: 'Maria Santos', teams: ['team_carteira_ii'], total_points: 2000 },
          { _id: 'player_3', name: 'Pedro Costa', teams: ['team_carteira_iii'], total_points: 1200 }
        ])
      });
    });

    // Navigate to players section
    await page.click('text=Jogadores, text=Players');
    
    // Find search input
    const searchInput = page.locator('input[placeholder*="jogador"], input[placeholder*="player"]');
    await expect(searchInput).toBeVisible();
    
    // Search for specific player
    await searchInput.fill('João');
    
    // Should show only matching player
    await expect(page.locator('text=João Silva')).toBeVisible();
    await expect(page.locator('text=Maria Santos')).not.toBeVisible();
    await expect(page.locator('text=Pedro Costa')).not.toBeVisible();
    
    // Clear search
    await searchInput.clear();
    
    // Should show all players again
    await expect(page.locator('text=João Silva')).toBeVisible();
    await expect(page.locator('text=Maria Santos')).toBeVisible();
    await expect(page.locator('text=Pedro Costa')).toBeVisible();
  });

  test('should display detailed player information when selected', async ({ page }) => {
    // Mock players list
    await page.route('**/players*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { _id: 'player_1', name: 'João Silva', teams: ['team_carteira_i'], total_points: 1500 }
        ])
      });
    });

    // Mock detailed player data
    await page.route('**/player_status?id=player_1', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          _id: 'player_1',
          name: 'João Silva',
          total_points: 1500,
          teams: ['team_carteira_i'],
          catalog_items: {
            'E6F0O5f': 1, // Points unlocked
            'E6F0WGc': 1, // Boost 1 active
            'E6K79Mt': 0  // Boost 2 inactive
          },
          level_progress: {
            percent_completed: 75,
            next_points: 500,
            total_levels: 10,
            percent: 0.75
          },
          challenge_progress: [],
          total_challenges: 3,
          challenges: {},
          point_categories: {},
          total_catalog_items: 2,
          positions: [],
          time: Date.now(),
          extra: {},
          pointCategories: {}
        })
      });
    });

    // Navigate to players section
    await page.click('text=Jogadores, text=Players');
    
    // Click on a player
    await page.click('text=João Silva');
    
    // Should show detailed player information
    await expect(page.locator('text=Carteira I')).toBeVisible();
    await expect(page.locator('text=Desbloqueados, text=Unlocked')).toBeVisible();
    await expect(page.locator('text=1 de 2 boosts ativos')).toBeVisible();
  });

  test('should allow exporting player data', async ({ page }) => {
    // Mock players list
    await page.route('**/players*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { _id: 'player_1', name: 'João Silva', teams: ['team_carteira_i'], total_points: 1500 },
          { _id: 'player_2', name: 'Maria Santos', teams: ['team_carteira_ii'], total_points: 2000 }
        ])
      });
    });

    // Mock export API
    await page.route('**/export/players*', async route => {
      await route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': 'attachment; filename="players-export.xlsx"'
        },
        body: Buffer.from('mock-excel-data')
      });
    });

    // Navigate to players section
    await page.click('text=Jogadores, text=Players');
    
    // Find and click export button
    const exportButton = page.locator('button:has-text("Exportar"), button:has-text("Export")');
    await expect(exportButton).toBeVisible();
    
    // Set up download handler
    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    
    // Verify download started
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('players');
  });

  test('should handle report upload workflow', async ({ page }) => {
    // Navigate to reports section
    await page.click('text=Relatórios, text=Reports');
    
    // Should show file upload area
    await expect(page.locator('text=Arraste arquivos, text=Drop files')).toBeVisible();
    
    // Mock file upload API
    await page.route('**/upload/report*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          processed: 10,
          changes: 5,
          actionLogsSubmitted: 5,
          errors: []
        })
      });
    });

    // Create a test file
    const fileContent = 'playerId,playerName,team,atividade,reaisPorAtivo,faturamento\nplayer_1,João Silva,CARTEIRA_I,85,120,95';
    
    // Upload file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-report.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(fileContent)
    });
    
    // Should show processing status
    await expect(page.locator('text=Processando, text=Processing')).toBeVisible();
    
    // Should show results after processing
    await expect(page.locator('text=10 registros processados')).toBeVisible();
    await expect(page.locator('text=5 alterações detectadas')).toBeVisible();
    await expect(page.locator('text=5 action logs enviados')).toBeVisible();
  });

  test('should handle CSV upload with new metrics (Conversões and UPA)', async ({ page }) => {
    // Navigate to reports section
    await page.click('text=Relatórios, text=Reports');
    
    // Mock file upload API for new metrics
    await page.route('**/upload/report*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          processed: 15,
          changes: 8,
          actionLogsSubmitted: 8,
          errors: [],
          newMetricsProcessed: {
            conversoes: 5,
            upa: 3
          },
          teamBreakdown: {
            'CARTEIRA_0': 5,
            'ER': 3,
            'CARTEIRA_I': 7
          }
        })
      });
    });

    // Create a test file with new metrics
    const fileContent = `playerId,playerName,team,atividade,reaisPorAtivo,faturamento,conversoes,upa
carteira_0_player_1,Ana Costa,CARTEIRA_0,85,120,95,92,
carteira_0_player_2,João Silva,CARTEIRA_0,78,115,88,85,
carteira_0_player_3,Maria Santos,CARTEIRA_0,90,125,102,95,
carteira_0_player_4,Pedro Lima,CARTEIRA_0,82,108,91,88,
carteira_0_player_5,Carlos Mendes,CARTEIRA_0,87,118,97,91,
er_player_1,Roberto Silva,ER,75,98,115,,87
er_player_2,Ana Oliveira,ER,82,105,122,,92
er_player_3,José Santos,ER,79,102,118,,89
player_1,Maria Silva,CARTEIRA_I,90,110,105,,
player_2,João Costa,CARTEIRA_I,85,115,98,,
player_3,Ana Lima,CARTEIRA_I,88,108,101,,
player_4,Pedro Santos,CARTEIRA_I,92,120,107,,
player_5,Carlos Silva,CARTEIRA_I,86,112,99,,
player_6,Maria Costa,CARTEIRA_I,89,117,103,,
player_7,João Lima,CARTEIRA_I,91,119,106,,`;
    
    // Upload file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-report-with-new-metrics.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(fileContent)
    });
    
    // Should show processing status
    await expect(page.locator('text=Processando, text=Processing')).toBeVisible();
    
    // Should show results after processing
    await expect(page.locator('text=15 registros processados')).toBeVisible();
    await expect(page.locator('text=8 alterações detectadas')).toBeVisible();
    await expect(page.locator('text=8 action logs enviados')).toBeVisible();
    
    // Should show new metrics processing confirmation
    await expect(page.locator('text=5 registros com Conversões processados')).toBeVisible();
    await expect(page.locator('text=3 registros com UPA processados')).toBeVisible();
    
    // Should show team breakdown
    await expect(page.locator('text=5 registros CARTEIRA_0')).toBeVisible();
    await expect(page.locator('text=3 registros ER')).toBeVisible();
    await expect(page.locator('text=7 registros CARTEIRA_I')).toBeVisible();
  });

  test('should validate new metrics format in CSV upload', async ({ page }) => {
    // Navigate to reports section
    await page.click('text=Relatórios, text=Reports');
    
    // Mock file upload validation error for invalid new metrics
    await page.route('**/upload/report*', async route => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Invalid metric values',
          details: 'Conversões and UPA values must be numeric',
          invalidRows: [
            { row: 2, field: 'conversoes', value: 'invalid', message: 'Must be a number', team: 'CARTEIRA_0' },
            { row: 3, field: 'upa', value: 'text', message: 'Must be a number', team: 'ER' },
            { row: 4, field: 'conversoes', value: '-5', message: 'Must be a positive number', team: 'CARTEIRA_0' },
            { row: 5, field: 'upa', value: '150.5', message: 'UPA values should typically be under 100', team: 'ER' }
          ]
        })
      });
    });

    // Create a test file with invalid new metrics
    const fileContent = `playerId,playerName,team,atividade,reaisPorAtivo,faturamento,conversoes,upa
carteira_0_player,Ana Costa,CARTEIRA_0,85,120,95,invalid,
er_player,Carlos Mendes,ER,75,98,115,,text
carteira_0_player_2,João Silva,CARTEIRA_0,78,115,88,-5,
er_player_2,Maria Santos,ER,82,105,122,,150.5`;
    
    // Upload file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'invalid-metrics.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(fileContent)
    });
    
    // Should show validation error messages
    await expect(page.locator('text=Valores de métrica inválidos, text=Invalid metric values')).toBeVisible();
    await expect(page.locator('text=Conversões e UPA devem ser numéricos')).toBeVisible();
    await expect(page.locator('text=Linha 2: conversoes deve ser um número')).toBeVisible();
    await expect(page.locator('text=Linha 3: upa deve ser um número')).toBeVisible();
    await expect(page.locator('text=Linha 4: conversoes deve ser um número positivo')).toBeVisible();
    await expect(page.locator('text=Linha 5: valores UPA devem ser tipicamente menores que 100')).toBeVisible();
    
    // Should show team-specific error context
    await expect(page.locator('text=CARTEIRA_0: 2 erros')).toBeVisible();
    await expect(page.locator('text=ER: 2 erros')).toBeVisible();
  });

  test('should handle backward compatibility with CSV without new metrics', async ({ page }) => {
    // Navigate to reports section
    await page.click('text=Relatórios, text=Reports');
    
    // Mock file upload API for legacy format
    await page.route('**/upload/report*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          processed: 12,
          changes: 6,
          actionLogsSubmitted: 6,
          errors: [],
          legacyFormat: true,
          message: 'Processed successfully with legacy format'
        })
      });
    });

    // Create a legacy test file (without new metrics)
    const fileContent = `playerId,playerName,team,atividade,reaisPorAtivo,faturamento,multimarcasPorAtivo
player_1,João Silva,CARTEIRA_I,85,120,95,
player_2,Maria Santos,CARTEIRA_II,75,110,88,92
player_3,Pedro Costa,CARTEIRA_III,90,105,115,85`;
    
    // Upload file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'legacy-format.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(fileContent)
    });
    
    // Should show processing status
    await expect(page.locator('text=Processando, text=Processing')).toBeVisible();
    
    // Should show results after processing
    await expect(page.locator('text=12 registros processados')).toBeVisible();
    await expect(page.locator('text=6 alterações detectadas')).toBeVisible();
    await expect(page.locator('text=Processado com sucesso usando formato legado')).toBeVisible();
  });

  test('should handle report upload errors', async ({ page }) => {
    // Navigate to reports section
    await page.click('text=Relatórios, text=Reports');
    
    // Mock file upload error
    await page.route('**/upload/report*', async route => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Invalid file format',
          details: 'File must be CSV or Excel format'
        })
      });
    });

    // Create an invalid file
    const fileContent = 'invalid file content';
    
    // Upload file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'invalid-file.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from(fileContent)
    });
    
    // Should show error message
    await expect(page.locator('text=Formato de arquivo inválido, text=Invalid file format')).toBeVisible();
  });

  test('should validate file format before upload', async ({ page }) => {
    // Navigate to reports section
    await page.click('text=Relatórios, text=Reports');
    
    // Try to upload unsupported file type
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'document.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('fake pdf content')
    });
    
    // Should show validation error
    await expect(page.locator('text=Formato não suportado, text=Unsupported format')).toBeVisible();
  });

  test('should show file size validation', async ({ page }) => {
    // Navigate to reports section
    await page.click('text=Relatórios, text=Reports');
    
    // Create a large file (simulate > 10MB)
    const largeContent = 'x'.repeat(11 * 1024 * 1024); // 11MB
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'large-file.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(largeContent)
    });
    
    // Should show size validation error
    await expect(page.locator('text=Arquivo muito grande, text=File too large')).toBeVisible();
  });

  test('should handle logout functionality', async ({ page }) => {
    // Find and click logout button
    const logoutButton = page.locator('button:has-text("Sair"), button:has-text("Logout"), [data-testid="logout"]');
    await expect(logoutButton).toBeVisible();
    await logoutButton.click();
    
    // Should redirect to login page
    await expect(page).toHaveURL('/login');
    
    // Should not be able to access admin page directly
    await page.goto('/admin');
    await expect(page).toHaveURL('/login'); // Should redirect back to login
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Mock network error for players API
    await page.route('**/players*', async route => {
      await route.abort('failed');
    });

    // Navigate to players section
    await page.click('text=Jogadores, text=Players');
    
    // Should show error message
    await expect(page.locator('text=Erro ao carregar, text=Failed to load')).toBeVisible();
    
    // Should show retry button
    const retryButton = page.locator('button:has-text("Tentar novamente"), button:has-text("Retry")');
    await expect(retryButton).toBeVisible();
  });

  test('should test complete CSV upload workflow with mixed team types', async ({ page }) => {
    // Navigate to reports section
    await page.click('text=Relatórios, text=Reports');
    
    // Mock comprehensive file upload API
    await page.route('**/upload/report*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          processed: 25,
          changes: 15,
          actionLogsSubmitted: 15,
          errors: [],
          newMetricsProcessed: {
            conversoes: 8,
            upa: 5
          },
          teamBreakdown: {
            'CARTEIRA_0': 8,
            'ER': 5,
            'CARTEIRA_I': 4,
            'CARTEIRA_II': 3,
            'CARTEIRA_III': 3,
            'CARTEIRA_IV': 2
          },
          metricsBreakdown: {
            'atividade': 25,
            'reaisPorAtivo': 25,
            'faturamento': 25,
            'multimarcasPorAtivo': 8,
            'conversoes': 8,
            'upa': 5
          }
        })
      });
    });

    // Create comprehensive test file with all team types and metrics
    const fileContent = `playerId,playerName,team,atividade,reaisPorAtivo,faturamento,multimarcasPorAtivo,conversoes,upa
carteira_0_1,Ana Costa,CARTEIRA_0,85,120,95,,92,
carteira_0_2,João Silva,CARTEIRA_0,78,115,88,,85,
carteira_0_3,Maria Santos,CARTEIRA_0,90,125,102,,95,
carteira_0_4,Pedro Lima,CARTEIRA_0,82,108,91,,88,
carteira_0_5,Carlos Mendes,CARTEIRA_0,87,118,97,,91,
carteira_0_6,Ana Oliveira,CARTEIRA_0,83,112,93,,89,
carteira_0_7,José Santos,CARTEIRA_0,86,116,96,,90,
carteira_0_8,Maria Lima,CARTEIRA_0,88,119,99,,93,
er_1,Roberto Silva,ER,75,98,115,,,87
er_2,Ana Oliveira,ER,82,105,122,,,92
er_3,José Santos,ER,79,102,118,,,89
er_4,Maria Costa,ER,84,107,125,,,94
er_5,João Lima,ER,81,103,120,,,91
carteira_i_1,Maria Silva,CARTEIRA_I,90,110,105,,,
carteira_i_2,João Costa,CARTEIRA_I,85,115,98,,,
carteira_i_3,Ana Lima,CARTEIRA_I,88,108,101,,,
carteira_i_4,Pedro Santos,CARTEIRA_I,92,120,107,,,
carteira_ii_1,Carlos Silva,CARTEIRA_II,86,112,99,85,,
carteira_ii_2,Maria Costa,CARTEIRA_II,89,117,103,88,,
carteira_ii_3,João Lima,CARTEIRA_II,91,119,106,90,,
carteira_iii_1,Ana Santos,CARTEIRA_III,87,113,100,82,,
carteira_iii_2,Pedro Costa,CARTEIRA_III,90,118,104,86,,
carteira_iii_3,Maria Silva,CARTEIRA_III,88,115,102,84,,
carteira_iv_1,João Santos,CARTEIRA_IV,85,110,97,80,,
carteira_iv_2,Ana Costa,CARTEIRA_IV,89,116,101,83,,`;
    
    // Upload file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'comprehensive-report.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(fileContent)
    });
    
    // Should show processing status
    await expect(page.locator('text=Processando, text=Processing')).toBeVisible();
    
    // Should show comprehensive results
    await expect(page.locator('text=25 registros processados')).toBeVisible();
    await expect(page.locator('text=15 alterações detectadas')).toBeVisible();
    await expect(page.locator('text=15 action logs enviados')).toBeVisible();
    
    // Should show new metrics processing
    await expect(page.locator('text=8 registros com Conversões processados')).toBeVisible();
    await expect(page.locator('text=5 registros com UPA processados')).toBeVisible();
    
    // Should show team breakdown
    await expect(page.locator('text=8 registros CARTEIRA_0')).toBeVisible();
    await expect(page.locator('text=5 registros ER')).toBeVisible();
    await expect(page.locator('text=4 registros CARTEIRA_I')).toBeVisible();
    await expect(page.locator('text=3 registros CARTEIRA_II')).toBeVisible();
    await expect(page.locator('text=3 registros CARTEIRA_III')).toBeVisible();
    await expect(page.locator('text=2 registros CARTEIRA_IV')).toBeVisible();
    
    // Should show metrics breakdown
    await expect(page.locator('text=25 registros com Atividade')).toBeVisible();
    await expect(page.locator('text=25 registros com Reais por Ativo')).toBeVisible();
    await expect(page.locator('text=25 registros com Faturamento')).toBeVisible();
    await expect(page.locator('text=8 registros com Multimarcas por Ativo')).toBeVisible();
  });

  test('should handle CSV format validation for new team types', async ({ page }) => {
    // Navigate to reports section
    await page.click('text=Relatórios, text=Reports');
    
    // Mock validation error for missing required metrics for new teams
    await page.route('**/upload/report*', async route => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Missing required metrics for team types',
          details: 'Carteira 0 requires Conversões metric, ER requires UPA metric',
          missingMetrics: [
            { team: 'CARTEIRA_0', playerId: 'carteira_0_1', missingMetric: 'conversoes', message: 'Conversões is required for Carteira 0 team' },
            { team: 'ER', playerId: 'er_1', missingMetric: 'upa', message: 'UPA is required for ER team' }
          ]
        })
      });
    });

    // Create test file missing required metrics for new teams
    const fileContent = `playerId,playerName,team,atividade,reaisPorAtivo,faturamento,multimarcasPorAtivo,conversoes,upa
carteira_0_1,Ana Costa,CARTEIRA_0,85,120,95,,,
er_1,Roberto Silva,ER,75,98,115,,,
carteira_i_1,Maria Silva,CARTEIRA_I,90,110,105,,,`;
    
    // Upload file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'missing-metrics.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(fileContent)
    });
    
    // Should show validation error messages
    await expect(page.locator('text=Métricas obrigatórias ausentes para tipos de equipe')).toBeVisible();
    await expect(page.locator('text=Carteira 0 requer métrica Conversões')).toBeVisible();
    await expect(page.locator('text=ER requer métrica UPA')).toBeVisible();
    await expect(page.locator('text=carteira_0_1: Conversões é obrigatório para equipe Carteira 0')).toBeVisible();
    await expect(page.locator('text=er_1: UPA é obrigatório para equipe ER')).toBeVisible();
  });

  test('should display new team types in player list with correct information', async ({ page }) => {
    // Mock players list API with new team types
    await page.route('**/players*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            _id: 'carteira_0_player',
            name: 'Ana Costa',
            teams: ['E6F5k30'], // Carteira 0
            total_points: 1200,
            teamType: 'CARTEIRA_0'
          },
          {
            _id: 'er_player',
            name: 'Carlos Mendes',
            teams: ['E500AbT'], // ER
            total_points: 1800,
            teamType: 'ER'
          },
          {
            _id: 'carteira_i_player',
            name: 'João Silva',
            teams: ['team_carteira_i'],
            total_points: 1500,
            teamType: 'CARTEIRA_I'
          }
        ])
      });
    });

    // Navigate to players section
    await page.click('text=Jogadores, text=Players');
    
    // Should show all players with their team types
    await expect(page.locator('text=Ana Costa')).toBeVisible();
    await expect(page.locator('text=Carteira 0')).toBeVisible();
    await expect(page.locator('text=1.200, text=1200')).toBeVisible();
    
    await expect(page.locator('text=Carlos Mendes')).toBeVisible();
    await expect(page.locator('text=ER')).toBeVisible();
    await expect(page.locator('text=1.800, text=1800')).toBeVisible();
    
    await expect(page.locator('text=João Silva')).toBeVisible();
    await expect(page.locator('text=Carteira I')).toBeVisible();
    await expect(page.locator('text=1.500, text=1500')).toBeVisible();
  });

  test('should handle detailed player information for new team types', async ({ page }) => {
    // Mock players list
    await page.route('**/players*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { _id: 'carteira_0_player', name: 'Ana Costa', teams: ['E6F5k30'], total_points: 1200, teamType: 'CARTEIRA_0' },
          { _id: 'er_player', name: 'Carlos Mendes', teams: ['E500AbT'], total_points: 1800, teamType: 'ER' }
        ])
      });
    });

    // Mock detailed player data for Carteira 0
    await page.route('**/player_status?id=carteira_0_player', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          _id: 'carteira_0_player',
          name: 'Ana Costa',
          total_points: 1200,
          teams: ['E6F5k30'],
          catalog_items: {
            'E6F0O5f': 1, // Points unlocked
            'E6F0WGc': 1, // Boost 1 active
            'E6K79Mt': 0  // Boost 2 inactive
          },
          level_progress: {
            percent_completed: 60,
            next_points: 800,
            total_levels: 10,
            percent: 0.6
          },
          challenge_progress: [],
          total_challenges: 3,
          challenges: {},
          point_categories: {},
          total_catalog_items: 2,
          positions: [],
          time: Date.now(),
          extra: {},
          pointCategories: {}
        })
      });
    });

    // Mock detailed player data for ER
    await page.route('**/player_status?id=er_player', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          _id: 'er_player',
          name: 'Carlos Mendes',
          total_points: 1800,
          teams: ['E500AbT'],
          catalog_items: {
            'E6F0O5f': 1, // Points unlocked
            'E6F0WGc': 0, // Boost 1 inactive
            'E6K79Mt': 1  // Boost 2 active
          },
          level_progress: {
            percent_completed: 90,
            next_points: 200,
            total_levels: 10,
            percent: 0.9
          },
          challenge_progress: [],
          total_challenges: 3,
          challenges: {},
          point_categories: {},
          total_catalog_items: 2,
          positions: [],
          time: Date.now(),
          extra: {},
          pointCategories: {}
        })
      });
    });

    // Navigate to players section
    await page.click('text=Jogadores, text=Players');
    
    // Click on Carteira 0 player
    await page.click('text=Ana Costa');
    
    // Should show Carteira 0 specific information
    await expect(page.locator('text=Carteira 0')).toBeVisible();
    await expect(page.locator('text=Desbloqueados, text=Unlocked')).toBeVisible();
    await expect(page.locator('text=1 de 2 boosts ativos')).toBeVisible();
    
    // Click on ER player
    await page.click('text=Carlos Mendes');
    
    // Should show ER specific information
    await expect(page.locator('text=ER')).toBeVisible();
    await expect(page.locator('text=Desbloqueados, text=Unlocked')).toBeVisible();
    await expect(page.locator('text=1 de 2 boosts ativos')).toBeVisible();
  });
});