import { test, expect } from '@playwright/test';

test.describe('Player Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.route('**/auth/token', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'mock-token-123',
          token_type: 'Bearer',
          expires_in: 3600
        })
      });
    });

    // Navigate to login and authenticate
    await page.goto('/login');
    await page.fill('input[type="text"], input[type="email"]', 'player@test.com');
    await page.fill('input[type="password"]', 'password');
  });

  test('should display Carteira I dashboard with correct metrics', async ({ page }) => {
    // Mock Carteira I player data
    await page.route('**/player_status*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          _id: 'carteira_i_player',
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

    // Mock collection data for goals
    await page.route('**/database/essencia_reports__c*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            _id: 'carteira_i_player_2024-01-15',
            playerId: 'carteira_i_player',
            playerName: 'João Silva',
            team: 'CARTEIRA_I',
            atividade: 85,
            reaisPorAtivo: 120,
            faturamento: 95,
            currentCycleDay: 15,
            totalCycleDays: 21,
            reportDate: '2024-01-15T00:00:00.000Z'
          }
        ])
      });
    });

    // Submit login
    await page.click('button[type="submit"]');
    
    // Wait for dashboard to load
    await expect(page).toHaveURL('/dashboard');
    
    // Check player name
    await expect(page.locator('text=João Silva')).toBeVisible();
    
    // Check points display (should be unlocked - blue background)
    const pointsCard = page.locator('[data-testid="points-card"], .points-card');
    await expect(pointsCard).toBeVisible();
    await expect(pointsCard.locator('text=1.500, text=1500')).toBeVisible();
    
    // Check cycle information
    await expect(page.locator('text=15, text=Dia 15')).toBeVisible();
    await expect(page.locator('text=6, text=restam')).toBeVisible(); // 21 - 15 = 6 days remaining
    
    // Check primary goal (Atividade)
    const primaryGoal = page.locator('[data-testid="primary-goal"], .primary-goal');
    await expect(primaryGoal.locator('text=Atividade')).toBeVisible();
    await expect(primaryGoal.locator('text=85%')).toBeVisible();
    
    // Check secondary goals
    const secondaryGoal1 = page.locator('[data-testid="secondary-goal-1"], .secondary-goal:first-of-type');
    await expect(secondaryGoal1.locator('text=Reais por Ativo')).toBeVisible();
    await expect(secondaryGoal1.locator('text=120%')).toBeVisible();
    
    const secondaryGoal2 = page.locator('[data-testid="secondary-goal-2"], .secondary-goal:last-of-type');
    await expect(secondaryGoal2.locator('text=Faturamento')).toBeVisible();
    await expect(secondaryGoal2.locator('text=95%')).toBeVisible();
    
    // Check boost indicators
    await expect(page.locator('[data-testid="boost-active"], .boost-active')).toBeVisible();
  });

  test('should display Carteira II dashboard with local calculations', async ({ page }) => {
    // Mock Carteira II player data
    await page.route('**/player_status*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          _id: 'carteira_ii_player',
          name: 'Maria Santos',
          total_points: 1000, // Base points
          teams: ['team_carteira_ii'],
          catalog_items: {
            'E6F0O5f': 0, // Points locked initially
            'E6F0WGc': 1, // Boost 1 active (+100%)
            'E6K79Mt': 1  // Boost 2 active (+100%)
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

    // Mock collection data with Reais por Ativo >= 100% (unlocks points)
    await page.route('**/database/essencia_reports__c*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            _id: 'carteira_ii_player_2024-01-15',
            playerId: 'carteira_ii_player',
            playerName: 'Maria Santos',
            team: 'CARTEIRA_II',
            atividade: 75,
            reaisPorAtivo: 110, // >= 100%, so points unlock
            multimarcasPorAtivo: 88,
            currentCycleDay: 10,
            totalCycleDays: 21,
            reportDate: '2024-01-15T00:00:00.000Z'
          }
        ])
      });
    });

    // Submit login
    await page.click('button[type="submit"]');
    
    // Wait for dashboard to load
    await expect(page).toHaveURL('/dashboard');
    
    // Check player name
    await expect(page.locator('text=Maria Santos')).toBeVisible();
    
    // Check calculated points (1000 * (1 + 1 + 1) = 3000 with both boosts)
    await expect(page.locator('text=3.000, text=3000')).toBeVisible();
    
    // Check primary goal (Reais por Ativo - controls unlock)
    const primaryGoal = page.locator('[data-testid="primary-goal"], .primary-goal');
    await expect(primaryGoal.locator('text=Reais por Ativo')).toBeVisible();
    await expect(primaryGoal.locator('text=110%')).toBeVisible();
    
    // Check secondary goals
    await expect(page.locator('text=Atividade')).toBeVisible();
    await expect(page.locator('text=75%')).toBeVisible();
    await expect(page.locator('text=Multimarcas por Ativo')).toBeVisible();
    await expect(page.locator('text=88%')).toBeVisible();
  });

  test('should display locked points when conditions not met', async ({ page }) => {
    // Mock player with locked points
    await page.route('**/player_status*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          _id: 'locked_player',
          name: 'Pedro Costa',
          total_points: 500,
          teams: ['team_carteira_i'],
          catalog_items: {
            'E6F0O5f': 0, // Points locked
            'E6F0WGc': 0, // No boosts
            'E6K79Mt': 0
          },
          level_progress: {
            percent_completed: 25,
            next_points: 1500,
            total_levels: 10,
            percent: 0.25
          },
          challenge_progress: [],
          total_challenges: 3,
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

    // Mock collection data with low performance
    await page.route('**/database/essencia_reports__c*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            _id: 'locked_player_2024-01-15',
            playerId: 'locked_player',
            playerName: 'Pedro Costa',
            team: 'CARTEIRA_I',
            atividade: 45,
            reaisPorAtivo: 60,
            faturamento: 55,
            currentCycleDay: 5,
            totalCycleDays: 21,
            reportDate: '2024-01-15T00:00:00.000Z'
          }
        ])
      });
    });

    // Submit login
    await page.click('button[type="submit"]');
    
    // Wait for dashboard to load
    await expect(page).toHaveURL('/dashboard');
    
    // Check locked points display (should have different styling)
    const pointsCard = page.locator('[data-testid="points-card"], .points-card');
    await expect(pointsCard.locator('text=500')).toBeVisible();
    await expect(pointsCard.locator('text=Bloqueados, text=Locked')).toBeVisible();
    
    // Check progress bars show red color for low performance
    const progressBars = page.locator('[data-testid="progress-bar"], .progress-bar');
    await expect(progressBars.first()).toHaveClass(/red/);
  });

  test('should show progress bar colors based on performance', async ({ page }) => {
    // Mock player data
    await page.route('**/player_status*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          _id: 'progress_player',
          name: 'Ana Silva',
          total_points: 1200,
          teams: ['team_carteira_i'],
          catalog_items: { 'E6F0O5f': 1 },
          level_progress: { percent_completed: 70, next_points: 600, total_levels: 10, percent: 0.7 },
          challenge_progress: [],
          total_challenges: 3,
          challenges: {},
          point_categories: {},
          total_catalog_items: 1,
          positions: [],
          time: Date.now(),
          extra: {},
          pointCategories: {}
        })
      });
    });

    // Mock collection data with different performance levels
    await page.route('**/database/essencia_reports__c*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            _id: 'progress_player_2024-01-15',
            playerId: 'progress_player',
            playerName: 'Ana Silva',
            team: 'CARTEIRA_I',
            atividade: 45,      // Red (0-50%)
            reaisPorAtivo: 75,  // Yellow (50-100%)
            faturamento: 125,   // Green (100-150%)
            currentCycleDay: 12,
            totalCycleDays: 21,
            reportDate: '2024-01-15T00:00:00.000Z'
          }
        ])
      });
    });

    // Submit login
    await page.click('button[type="submit"]');
    
    // Wait for dashboard to load
    await expect(page).toHaveURL('/dashboard');
    
    // Check different progress bar colors
    const goals = page.locator('[data-testid="goal-card"], .goal-card');
    
    // First goal (45%) should be red
    await expect(goals.nth(0).locator('.progress-bar')).toHaveClass(/red/);
    
    // Second goal (75%) should be yellow
    await expect(goals.nth(1).locator('.progress-bar')).toHaveClass(/yellow/);
    
    // Third goal (125%) should be green
    await expect(goals.nth(2).locator('.progress-bar')).toHaveClass(/green/);
  });

  test('should handle goal details accordion', async ({ page }) => {
    // Mock basic player data
    await page.route('**/player_status*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          _id: 'accordion_player',
          name: 'Carlos Lima',
          total_points: 800,
          teams: ['team_carteira_i'],
          catalog_items: { 'E6F0O5f': 1 },
          level_progress: { percent_completed: 40, next_points: 1200, total_levels: 10, percent: 0.4 },
          challenge_progress: [],
          total_challenges: 3,
          challenges: {},
          point_categories: {},
          total_catalog_items: 1,
          positions: [],
          time: Date.now(),
          extra: {},
          pointCategories: {}
        })
      });
    });

    await page.route('**/database/essencia_reports__c*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            _id: 'accordion_player_2024-01-15',
            playerId: 'accordion_player',
            playerName: 'Carlos Lima',
            team: 'CARTEIRA_I',
            atividade: 80,
            reaisPorAtivo: 90,
            faturamento: 85,
            currentCycleDay: 8,
            totalCycleDays: 21,
            reportDate: '2024-01-15T00:00:00.000Z'
          }
        ])
      });
    });

    // Submit login
    await page.click('button[type="submit"]');
    
    // Wait for dashboard to load
    await expect(page).toHaveURL('/dashboard');
    
    // Find and click on a goal card to expand details
    const goalCard = page.locator('[data-testid="goal-card"], .goal-card').first();
    await goalCard.click();
    
    // Should show expanded details
    await expect(page.locator('[data-testid="goal-details"], .goal-details')).toBeVisible();
    
    // Click again to collapse
    await goalCard.click();
    
    // Details should be hidden
    await expect(page.locator('[data-testid="goal-details"], .goal-details')).not.toBeVisible();
  });

  test('should display Carteira 0 dashboard with Conversões metric', async ({ page }) => {
    // Mock Carteira 0 player data
    await page.route('**/player_status*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          _id: 'carteira_0_player',
          name: 'Ana Costa',
          total_points: 1200,
          teams: ['E6F5k30'], // Carteira 0 team ID
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

    // Mock collection data for Carteira 0 with Conversões
    await page.route('**/database/essencia_reports__c*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            _id: 'carteira_0_player_2024-01-15',
            playerId: 'carteira_0_player',
            playerName: 'Ana Costa',
            team: 'CARTEIRA_0',
            conversoes: 92, // Primary goal for Carteira 0
            reaisPorAtivo: 105,
            faturamento: 88,
            currentCycleDay: 12,
            totalCycleDays: 21,
            reportDate: '2024-01-15T00:00:00.000Z'
          }
        ])
      });
    });

    // Submit login
    await page.click('button[type="submit"]');
    
    // Wait for dashboard to load
    await expect(page).toHaveURL('/dashboard');
    
    // Check player name
    await expect(page.locator('text=Ana Costa')).toBeVisible();
    
    // Check points display (should be unlocked - blue background)
    const pointsCard = page.locator('[data-testid="points-card"], .points-card');
    await expect(pointsCard).toBeVisible();
    await expect(pointsCard.locator('text=1.200, text=1200')).toBeVisible();
    
    // Check cycle information
    await expect(page.locator('text=12, text=Dia 12')).toBeVisible();
    await expect(page.locator('text=9, text=restam')).toBeVisible(); // 21 - 12 = 9 days remaining
    
    // Check primary goal (Conversões)
    const primaryGoal = page.locator('[data-testid="primary-goal"], .primary-goal');
    await expect(primaryGoal.locator('text=Conversões')).toBeVisible();
    await expect(primaryGoal.locator('text=92%')).toBeVisible();
    
    // Check secondary goals
    const secondaryGoal1 = page.locator('[data-testid="secondary-goal-1"], .secondary-goal:first-of-type');
    await expect(secondaryGoal1.locator('text=Reais por Ativo')).toBeVisible();
    await expect(secondaryGoal1.locator('text=105%')).toBeVisible();
    
    const secondaryGoal2 = page.locator('[data-testid="secondary-goal-2"], .secondary-goal:last-of-type');
    await expect(secondaryGoal2.locator('text=Faturamento')).toBeVisible();
    await expect(secondaryGoal2.locator('text=88%')).toBeVisible();
    
    // Check boost indicators
    await expect(page.locator('[data-testid="boost-active"], .boost-active')).toBeVisible();
    
    // Verify identical UI structure to existing Carteira dashboards
    await expect(page.locator('[data-testid="dashboard-header"], .dashboard-header')).toBeVisible();
    await expect(page.locator('[data-testid="cycle-card"], .cycle-card')).toBeVisible();
    await expect(page.locator('[data-testid="goal-card"], .goal-card')).toHaveCount(3); // Primary + 2 secondary
  });

  test('should display ER dashboard with UPA metric and Medalhas button', async ({ page }) => {
    // Mock ER player data
    await page.route('**/player_status*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          _id: 'er_player',
          name: 'Carlos Mendes',
          total_points: 1800,
          teams: ['E500AbT'], // ER team ID
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

    // Mock collection data for ER with UPA
    await page.route('**/database/essencia_reports__c*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            _id: 'er_player_2024-01-15',
            playerId: 'er_player',
            playerName: 'Carlos Mendes',
            team: 'ER',
            faturamento: 115, // Primary goal for ER
            reaisPorAtivo: 98,
            upa: 87, // UPA metric specific to ER
            currentCycleDay: 18,
            totalCycleDays: 21,
            reportDate: '2024-01-15T00:00:00.000Z'
          }
        ])
      });
    });

    // Submit login
    await page.click('button[type="submit"]');
    
    // Wait for dashboard to load
    await expect(page).toHaveURL('/dashboard');
    
    // Check player name
    await expect(page.locator('text=Carlos Mendes')).toBeVisible();
    
    // Check points display
    const pointsCard = page.locator('[data-testid="points-card"], .points-card');
    await expect(pointsCard).toBeVisible();
    await expect(pointsCard.locator('text=1.800, text=1800')).toBeVisible();
    
    // Check cycle information
    await expect(page.locator('text=18, text=Dia 18')).toBeVisible();
    await expect(page.locator('text=3, text=restam')).toBeVisible(); // 21 - 18 = 3 days remaining
    
    // Check primary goal (Faturamento)
    const primaryGoal = page.locator('[data-testid="primary-goal"], .primary-goal');
    await expect(primaryGoal.locator('text=Faturamento')).toBeVisible();
    await expect(primaryGoal.locator('text=115%')).toBeVisible();
    
    // Check secondary goals
    const secondaryGoal1 = page.locator('[data-testid="secondary-goal-1"], .secondary-goal:first-of-type');
    await expect(secondaryGoal1.locator('text=Reais por Ativo')).toBeVisible();
    await expect(secondaryGoal1.locator('text=98%')).toBeVisible();
    
    const secondaryGoal2 = page.locator('[data-testid="secondary-goal-2"], .secondary-goal:last-of-type');
    await expect(secondaryGoal2.locator('text=UPA')).toBeVisible();
    await expect(secondaryGoal2.locator('text=87%')).toBeVisible();
    
    // Check that Medalhas button is present alongside Histórico and Ranking
    await expect(page.locator('button:has-text("Histórico"), button:has-text("History")')).toBeVisible();
    await expect(page.locator('button:has-text("Ranking")')).toBeVisible();
    await expect(page.locator('button:has-text("Medalhas"), button:has-text("Medals")')).toBeVisible();
    
    // Verify identical UI structure to existing dashboards
    await expect(page.locator('[data-testid="dashboard-header"], .dashboard-header')).toBeVisible();
    await expect(page.locator('[data-testid="cycle-card"], .cycle-card')).toBeVisible();
    await expect(page.locator('[data-testid="goal-card"], .goal-card')).toHaveCount(3); // Primary + 2 secondary
    
    // Click Medalhas button and check "Em Breve" message
    await page.click('button:has-text("Medalhas"), button:has-text("Medals")');
    await expect(page.locator('text=Em Breve, text=Coming Soon')).toBeVisible();
    
    // Verify Medalhas button positioning alongside other buttons
    const actionButtons = page.locator('[data-testid="action-buttons"], .action-buttons');
    await expect(actionButtons.locator('button')).toHaveCount(3); // Histórico, Ranking, Medalhas
  });

  test('should handle data loading errors gracefully', async ({ page }) => {
    // Mock authentication success
    await page.route('**/player_status*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          _id: 'error_player',
          name: 'Error Player',
          total_points: 1000,
          teams: ['team_carteira_i'],
          catalog_items: { 'E6F0O5f': 1 },
          level_progress: { percent_completed: 50, next_points: 1000, total_levels: 10, percent: 0.5 },
          challenge_progress: [],
          total_challenges: 3,
          challenges: {},
          point_categories: {},
          total_catalog_items: 1,
          positions: [],
          time: Date.now(),
          extra: {},
          pointCategories: {}
        })
      });
    });

    // Mock collection data error
    await page.route('**/database/essencia_reports__c*', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });

    // Submit login
    await page.click('button[type="submit"]');
    
    // Wait for dashboard to load
    await expect(page).toHaveURL('/dashboard');
    
    // Should show error message or fallback data
    await expect(page.locator('text=erro, text=error, text=falha')).toBeVisible();
  });

  test('should test complete user flows for new dashboard types', async ({ page }) => {
    // Test complete Carteira 0 user flow
    await page.route('**/player_status*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          _id: 'carteira_0_flow_user',
          name: 'Flow Test User',
          total_points: 1500,
          teams: ['E6F5k30'], // Carteira 0 team ID
          catalog_items: {
            'E6F0O5f': 1, // Points unlocked
            'E6F0WGc': 1, // Boost 1 active
            'E6K79Mt': 0  // Boost 2 inactive
          },
          level_progress: {
            percent_completed: 70,
            next_points: 600,
            total_levels: 10,
            percent: 0.7
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

    await page.route('**/database/essencia_reports__c*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            _id: 'carteira_0_flow_user_2024-01-15',
            playerId: 'carteira_0_flow_user',
            playerName: 'Flow Test User',
            team: 'CARTEIRA_0',
            conversoes: 78, // Primary goal
            reaisPorAtivo: 95,
            faturamento: 102,
            currentCycleDay: 14,
            totalCycleDays: 21,
            reportDate: '2024-01-15T00:00:00.000Z'
          }
        ])
      });
    });

    // Submit login
    await page.click('button[type="submit"]');
    
    // Wait for dashboard to load
    await expect(page).toHaveURL('/dashboard');
    
    // Verify complete Carteira 0 dashboard functionality
    await expect(page.locator('text=Flow Test User')).toBeVisible();
    await expect(page.locator('text=Conversões')).toBeVisible(); // Primary goal
    await expect(page.locator('text=78%')).toBeVisible(); // Primary goal value
    await expect(page.locator('text=Reais por Ativo')).toBeVisible(); // Secondary goal 1
    await expect(page.locator('text=95%')).toBeVisible(); // Secondary goal 1 value
    await expect(page.locator('text=Faturamento')).toBeVisible(); // Secondary goal 2
    await expect(page.locator('text=102%')).toBeVisible(); // Secondary goal 2 value
    
    // Test goal details accordion functionality
    const primaryGoalCard = page.locator('[data-testid="primary-goal"], .primary-goal');
    await primaryGoalCard.click();
    await expect(page.locator('[data-testid="goal-details"], .goal-details')).toBeVisible();
    
    // Test refresh functionality
    const refreshButton = page.locator('[data-testid="refresh-button"], button:has-text("Atualizar")');
    if (await refreshButton.isVisible()) {
      await refreshButton.click();
      await expect(page.locator('text=Conversões')).toBeVisible(); // Should still show after refresh
    }
    
    // Test navigation buttons (Histórico, Ranking)
    await expect(page.locator('button:has-text("Histórico"), button:has-text("History")')).toBeVisible();
    await expect(page.locator('button:has-text("Ranking")')).toBeVisible();
    
    // Verify no Medalhas button for Carteira 0 (only for ER)
    await expect(page.locator('button:has-text("Medalhas"), button:has-text("Medals")')).not.toBeVisible();
  });

  test('should test complete ER user flow with Medalhas functionality', async ({ page }) => {
    // Test complete ER user flow
    await page.route('**/player_status*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          _id: 'er_flow_user',
          name: 'ER Flow User',
          total_points: 2200,
          teams: ['E500AbT'], // ER team ID
          catalog_items: {
            'E6F0O5f': 1, // Points unlocked
            'E6F0WGc': 0, // Boost 1 inactive
            'E6K79Mt': 1  // Boost 2 active
          },
          level_progress: {
            percent_completed: 85,
            next_points: 300,
            total_levels: 10,
            percent: 0.85
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

    await page.route('**/database/essencia_reports__c*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            _id: 'er_flow_user_2024-01-15',
            playerId: 'er_flow_user',
            playerName: 'ER Flow User',
            team: 'ER',
            faturamento: 118, // Primary goal for ER
            reaisPorAtivo: 92,
            upa: 84, // UPA metric specific to ER
            currentCycleDay: 16,
            totalCycleDays: 21,
            reportDate: '2024-01-15T00:00:00.000Z'
          }
        ])
      });
    });

    // Submit login
    await page.click('button[type="submit"]');
    
    // Wait for dashboard to load
    await expect(page).toHaveURL('/dashboard');
    
    // Verify complete ER dashboard functionality
    await expect(page.locator('text=ER Flow User')).toBeVisible();
    await expect(page.locator('text=Faturamento')).toBeVisible(); // Primary goal
    await expect(page.locator('text=118%')).toBeVisible(); // Primary goal value
    await expect(page.locator('text=Reais por Ativo')).toBeVisible(); // Secondary goal 1
    await expect(page.locator('text=92%')).toBeVisible(); // Secondary goal 1 value
    await expect(page.locator('text=UPA')).toBeVisible(); // Secondary goal 2 (ER specific)
    await expect(page.locator('text=84%')).toBeVisible(); // Secondary goal 2 value
    
    // Test all three action buttons for ER
    await expect(page.locator('button:has-text("Histórico"), button:has-text("History")')).toBeVisible();
    await expect(page.locator('button:has-text("Ranking")')).toBeVisible();
    await expect(page.locator('button:has-text("Medalhas"), button:has-text("Medals")')).toBeVisible();
    
    // Test Medalhas button functionality
    await page.click('button:has-text("Medalhas"), button:has-text("Medals")');
    await expect(page.locator('text=Em Breve, text=Coming Soon')).toBeVisible();
    
    // Test goal details accordion for ER dashboard
    const primaryGoalCard = page.locator('[data-testid="primary-goal"], .primary-goal');
    await primaryGoalCard.click();
    await expect(page.locator('[data-testid="goal-details"], .goal-details')).toBeVisible();
    
    // Verify cycle information
    await expect(page.locator('text=16, text=Dia 16')).toBeVisible();
    await expect(page.locator('text=5, text=restam')).toBeVisible(); // 21 - 16 = 5 days remaining
    
    // Verify points calculation with boost
    await expect(page.locator('text=2.200, text=2200')).toBeVisible();
    await expect(page.locator('[data-testid="boost-active"], .boost-active')).toBeVisible();
  });
});