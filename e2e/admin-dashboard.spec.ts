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
});