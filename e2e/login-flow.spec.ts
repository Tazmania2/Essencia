import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the login page
    await page.goto('/login');
  });

  test('should display login form with correct elements', async ({ page }) => {
    // Check that login form is visible
    await expect(page.locator('form')).toBeVisible();
    
    // Check for username/email input
    await expect(page.locator('input[type="text"], input[type="email"]')).toBeVisible();
    
    // Check for password input
    await expect(page.locator('input[type="password"]')).toBeVisible();
    
    // Check for login button
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Check for O Boticário branding
    await expect(page.locator('text=Boticário')).toBeVisible();
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    // Try to submit empty form
    await page.click('button[type="submit"]');
    
    // Should show validation errors
    await expect(page.locator('text=obrigatório, text=required')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    // Fill in invalid credentials
    await page.fill('input[type="text"], input[type="email"]', 'invalid@test.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should show error message
    await expect(page.locator('text=inválido, text=erro, text=falhou')).toBeVisible();
  });

  test('should redirect to dashboard on successful player login', async ({ page }) => {
    // Mock successful authentication response
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

    // Mock player status response
    await page.route('**/player_status*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          _id: 'player_123',
          name: 'João Silva',
          total_points: 1500,
          teams: ['team_carteira_i'],
          catalog_items: {
            'E6F0O5f': 1 // Points unlocked
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
          total_catalog_items: 1,
          positions: [],
          time: Date.now(),
          extra: {},
          pointCategories: {}
        })
      });
    });

    // Fill in valid credentials
    await page.fill('input[type="text"], input[type="email"]', 'player@test.com');
    await page.fill('input[type="password"]', 'validpassword');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    
    // Should show player dashboard elements
    await expect(page.locator('text=João Silva')).toBeVisible();
    await expect(page.locator('text=1.500, text=1500')).toBeVisible(); // Points display
  });

  test('should redirect to admin dashboard on successful admin login', async ({ page }) => {
    // Mock successful authentication response
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

    // Mock admin user response (admin team only)
    await page.route('**/player_status*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          _id: 'admin_123',
          name: 'Admin User',
          total_points: 0,
          teams: ['E6U1B1p'], // Admin team ID only
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

    // Fill in admin credentials
    await page.fill('input[type="text"], input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'adminpassword');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should redirect to admin dashboard
    await expect(page).toHaveURL('/admin');
    
    // Should show admin dashboard elements
    await expect(page.locator('text=Admin, text=Administrador')).toBeVisible();
  });

  test('should redirect to Carteira 0 dashboard on single team login', async ({ page }) => {
    // Mock successful authentication response
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

    // Mock Carteira 0 player status response
    await page.route('**/player_status*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          _id: 'carteira_0_player',
          name: 'Ana Costa',
          total_points: 1200,
          teams: ['E6F5k30'], // Carteira 0 team ID only
          catalog_items: {
            'E6F0O5f': 1 // Points unlocked
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
          total_catalog_items: 1,
          positions: [],
          time: Date.now(),
          extra: {},
          pointCategories: {}
        })
      });
    });

    // Fill in valid credentials
    await page.fill('input[type="text"], input[type="email"]', 'carteira0@test.com');
    await page.fill('input[type="password"]', 'validpassword');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    
    // Should show Carteira 0 dashboard elements
    await expect(page.locator('text=Ana Costa')).toBeVisible();
    await expect(page.locator('text=1.200, text=1200')).toBeVisible(); // Points display
  });

  test('should redirect to ER dashboard on single team login', async ({ page }) => {
    // Mock successful authentication response
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

    // Mock ER player status response
    await page.route('**/player_status*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          _id: 'er_player',
          name: 'Carlos Mendes',
          total_points: 1800,
          teams: ['E500AbT'], // ER team ID only
          catalog_items: {
            'E6F0O5f': 1 // Points unlocked
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
          total_catalog_items: 1,
          positions: [],
          time: Date.now(),
          extra: {},
          pointCategories: {}
        })
      });
    });

    // Fill in valid credentials
    await page.fill('input[type="text"], input[type="email"]', 'er@test.com');
    await page.fill('input[type="password"]', 'validpassword');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    
    // Should show ER dashboard elements
    await expect(page.locator('text=Carlos Mendes')).toBeVisible();
    await expect(page.locator('text=1.800, text=1800')).toBeVisible(); // Points display
    await expect(page.locator('button:has-text("Medalhas"), button:has-text("Medals")')).toBeVisible();
  });

  test('should show team selection modal for multi-team users', async ({ page }) => {
    // Mock successful authentication response
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

    // Mock multi-team user response
    await page.route('**/player_status*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          _id: 'multi_user_123',
          name: 'Multi Team User',
          total_points: 1500,
          teams: ['E6F5k30', 'E500AbT', 'E6U1B1p'], // Carteira 0, ER, and Admin
          catalog_items: {
            'E6F0O5f': 1
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
          total_catalog_items: 1,
          positions: [],
          time: Date.now(),
          extra: {},
          pointCategories: {}
        })
      });
    });

    // Fill in credentials
    await page.fill('input[type="text"], input[type="email"]', 'multiuser@test.com');
    await page.fill('input[type="password"]', 'password');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should show team selection modal
    await expect(page.locator('text=Selecionar Equipe')).toBeVisible();
    await expect(page.locator('text=Carteira 0')).toBeVisible();
    await expect(page.locator('text=ER')).toBeVisible();
    await expect(page.locator('text=Administrador')).toBeVisible();
  });

  test('should route to Carteira 0 dashboard when selecting from modal', async ({ page }) => {
    // Mock successful authentication response
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

    // Mock multi-team user response
    await page.route('**/player_status*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          _id: 'multi_user_123',
          name: 'Multi Team User',
          total_points: 1500,
          teams: ['E6F5k30', 'E500AbT'], // Carteira 0 and ER
          catalog_items: {
            'E6F0O5f': 1
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
          total_catalog_items: 1,
          positions: [],
          time: Date.now(),
          extra: {},
          pointCategories: {}
        })
      });
    });

    // Mock collection data for Carteira 0
    await page.route('**/database/essencia_reports__c*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            _id: 'multi_user_123_2024-01-15',
            playerId: 'multi_user_123',
            playerName: 'Multi Team User',
            team: 'CARTEIRA_0',
            conversoes: 85,
            reaisPorAtivo: 110,
            faturamento: 95,
            currentCycleDay: 10,
            totalCycleDays: 21,
            reportDate: '2024-01-15T00:00:00.000Z'
          }
        ])
      });
    });

    // Fill in credentials and submit
    await page.fill('input[type="text"], input[type="email"]', 'multiuser@test.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    
    // Wait for team selection modal
    await expect(page.locator('text=Selecionar Equipe')).toBeVisible();
    
    // Select Carteira 0 team
    await page.click('text=Carteira 0');
    await page.click('text=Continuar');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    
    // Should show Carteira 0 specific content
    await expect(page.locator('text=Conversões')).toBeVisible();
    await expect(page.locator('text=85%')).toBeVisible();
  });

  test('should route to ER dashboard when selecting from modal', async ({ page }) => {
    // Mock successful authentication response
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

    // Mock multi-team user response
    await page.route('**/player_status*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          _id: 'multi_user_123',
          name: 'Multi Team User',
          total_points: 1500,
          teams: ['E6F5k30', 'E500AbT'], // Carteira 0 and ER
          catalog_items: {
            'E6F0O5f': 1
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
          total_catalog_items: 1,
          positions: [],
          time: Date.now(),
          extra: {},
          pointCategories: {}
        })
      });
    });

    // Mock collection data for ER
    await page.route('**/database/essencia_reports__c*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            _id: 'multi_user_123_2024-01-15',
            playerId: 'multi_user_123',
            playerName: 'Multi Team User',
            team: 'ER',
            faturamento: 120,
            reaisPorAtivo: 95,
            upa: 88,
            currentCycleDay: 15,
            totalCycleDays: 21,
            reportDate: '2024-01-15T00:00:00.000Z'
          }
        ])
      });
    });

    // Fill in credentials and submit
    await page.fill('input[type="text"], input[type="email"]', 'multiuser@test.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    
    // Wait for team selection modal
    await expect(page.locator('text=Selecionar Equipe')).toBeVisible();
    
    // Select ER team
    await page.click('text=ER');
    await page.click('text=Continuar');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    
    // Should show ER specific content
    await expect(page.locator('text=UPA')).toBeVisible();
    await expect(page.locator('text=88%')).toBeVisible();
    await expect(page.locator('button:has-text("Medalhas"), button:has-text("Medals")')).toBeVisible();
  });

  test('should route to admin when selecting admin from modal', async ({ page }) => {
    // Mock successful authentication response
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

    // Mock multi-team user with admin access
    await page.route('**/player_status*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          _id: 'admin_multi_123',
          name: 'Admin Multi User',
          total_points: 1500,
          teams: ['E6F5k30', 'E6U1B1p'], // Carteira 0 and Admin
          catalog_items: {
            'E6F0O5f': 1
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
          total_catalog_items: 1,
          positions: [],
          time: Date.now(),
          extra: {},
          pointCategories: {}
        })
      });
    });

    // Fill in credentials and submit
    await page.fill('input[type="text"], input[type="email"]', 'adminmulti@test.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    
    // Wait for team selection modal
    await expect(page.locator('text=Selecionar Equipe')).toBeVisible();
    
    // Select Admin
    await page.click('text=Administrador');
    await page.click('text=Continuar');
    
    // Should redirect to admin dashboard
    await expect(page).toHaveURL('/admin');
  });

  test('should logout when canceling team selection', async ({ page }) => {
    // Mock successful authentication response
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

    // Mock multi-team user response
    await page.route('**/player_status*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          _id: 'multi_user_123',
          name: 'Multi Team User',
          total_points: 1500,
          teams: ['E6F5k30', 'E500AbT'], // Carteira 0 and ER
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

    // Fill in credentials and submit
    await page.fill('input[type="text"], input[type="email"]', 'multiuser@test.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    
    // Wait for team selection modal
    await expect(page.locator('text=Selecionar Equipe')).toBeVisible();
    
    // Cancel team selection
    await page.click('text=Cancelar');
    
    // Should return to login page
    await expect(page).toHaveURL('/login');
    await expect(page.locator('form')).toBeVisible();
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Mock network error
    await page.route('**/auth/token', async route => {
      await route.abort('failed');
    });

    // Fill in credentials
    await page.fill('input[type="text"], input[type="email"]', 'test@test.com');
    await page.fill('input[type="password"]', 'password');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should show network error message
    await expect(page.locator('text=erro de rede, text=conexão, text=network')).toBeVisible();
  });

  test('should handle single team assignment scenarios for all team types', async ({ page }) => {
    const teamScenarios = [
      {
        teamId: 'E6F5k30',
        teamName: 'Carteira 0',
        playerName: 'Ana Costa',
        expectedMetric: 'Conversões'
      },
      {
        teamId: 'E500AbT',
        teamName: 'ER',
        playerName: 'Carlos Mendes',
        expectedMetric: 'UPA'
      },
      {
        teamId: 'team_carteira_i',
        teamName: 'Carteira I',
        playerName: 'João Silva',
        expectedMetric: 'Atividade'
      },
      {
        teamId: 'team_carteira_ii',
        teamName: 'Carteira II',
        playerName: 'Maria Santos',
        expectedMetric: 'Atividade'
      },
      {
        teamId: 'team_carteira_iii',
        teamName: 'Carteira III',
        playerName: 'Pedro Lima',
        expectedMetric: 'Faturamento'
      },
      {
        teamId: 'team_carteira_iv',
        teamName: 'Carteira IV',
        playerName: 'Laura Oliveira',
        expectedMetric: 'Faturamento'
      }
    ];

    for (const scenario of teamScenarios) {
      // Mock successful authentication response
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

      // Mock single team player status response
      await page.route('**/player_status*', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            _id: `${scenario.teamName.toLowerCase().replace(' ', '_')}_player`,
            name: scenario.playerName,
            total_points: 1500,
            teams: [scenario.teamId], // Single team only
            catalog_items: { 'E6F0O5f': 1 },
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
            total_catalog_items: 1,
            positions: [],
            time: Date.now(),
            extra: {},
            pointCategories: {}
          })
        });
      });

      // Mock dashboard data for specific team types
      if (scenario.teamId === 'E6F5k30' || scenario.teamId === 'E500AbT') {
        await page.route('**/database/essencia_reports__c*', async route => {
          const teamType = scenario.teamId === 'E6F5k30' ? 'CARTEIRA_0' : 'ER';
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([
              {
                _id: `${scenario.teamName.toLowerCase().replace(' ', '_')}_player_2024-01-15`,
                playerId: `${scenario.teamName.toLowerCase().replace(' ', '_')}_player`,
                playerName: scenario.playerName,
                team: teamType,
                ...(teamType === 'CARTEIRA_0' ? {
                  conversoes: 85,
                  reaisPorAtivo: 110,
                  faturamento: 95
                } : {
                  faturamento: 120,
                  reaisPorAtivo: 95,
                  upa: 88
                }),
                currentCycleDay: 10,
                totalCycleDays: 21,
                reportDate: '2024-01-15T00:00:00.000Z'
              }
            ])
          });
        });
      }

      // Navigate to login page
      await page.goto('/login');
      
      // Fill in credentials
      await page.fill('input[type="text"], input[type="email"]', `${scenario.teamName.toLowerCase().replace(' ', '')}@test.com`);
      await page.fill('input[type="password"]', 'password');
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Should redirect directly to dashboard (no team selection modal)
      await expect(page).toHaveURL('/dashboard');
      
      // Should show player name
      await expect(page.locator(`text=${scenario.playerName}`)).toBeVisible();
      
      // Should NOT show team selection modal
      await expect(page.locator('text=Selecionar Equipe')).not.toBeVisible();
      
      // For ER team, should show Medalhas button
      if (scenario.teamId === 'E500AbT') {
        await expect(page.locator('button:has-text("Medalhas"), button:has-text("Medals")')).toBeVisible();
      }
    }
  });

  test('should handle multiple team assignment scenarios', async ({ page }) => {
    const multiTeamScenarios = [
      {
        teams: ['E6F5k30', 'E500AbT'], // Carteira 0 + ER
        expectedOptions: ['Carteira 0', 'ER'],
        description: 'Carteira 0 and ER teams'
      },
      {
        teams: ['E6F5k30', 'E6U1B1p'], // Carteira 0 + Admin
        expectedOptions: ['Carteira 0', 'Administrador'],
        description: 'Carteira 0 and Admin teams'
      },
      {
        teams: ['E500AbT', 'team_carteira_i'], // ER + Carteira I
        expectedOptions: ['ER', 'Carteira I'],
        description: 'ER and Carteira I teams'
      },
      {
        teams: ['E500AbT', 'E6U1B1p'], // ER + Admin
        expectedOptions: ['ER', 'Administrador'],
        description: 'ER and Admin teams'
      },
      {
        teams: ['E6F5k30', 'team_carteira_i', 'team_carteira_ii'], // Carteira 0 + multiple existing
        expectedOptions: ['Carteira 0', 'Carteira I', 'Carteira II'],
        description: 'Carteira 0 with multiple existing teams'
      },
      {
        teams: ['E500AbT', 'team_carteira_iii', 'team_carteira_iv'], // ER + multiple existing
        expectedOptions: ['ER', 'Carteira III', 'Carteira IV'],
        description: 'ER with multiple existing teams'
      },
      {
        teams: ['E6F5k30', 'E500AbT', 'team_carteira_i', 'E6U1B1p'], // All new teams + existing + admin
        expectedOptions: ['Carteira 0', 'ER', 'Carteira I', 'Administrador'],
        description: 'All new teams with existing and admin'
      },
      {
        teams: ['E6F5k30', 'E500AbT', 'team_carteira_i', 'team_carteira_ii', 'team_carteira_iii', 'team_carteira_iv', 'E6U1B1p'], // All teams
        expectedOptions: ['Carteira 0', 'ER', 'Carteira I', 'Carteira II', 'Carteira III', 'Carteira IV', 'Administrador'],
        description: 'All teams including new ones'
      }
    ];

    for (const scenario of multiTeamScenarios) {
      // Mock successful authentication response
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

      // Mock multi-team user response
      await page.route('**/player_status*', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            _id: 'multi_team_user',
            name: 'Multi Team User',
            total_points: 1500,
            teams: scenario.teams,
            catalog_items: { 'E6F0O5f': 1 },
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
            total_catalog_items: 1,
            positions: [],
            time: Date.now(),
            extra: {},
            pointCategories: {}
          })
        });
      });

      // Navigate to login page
      await page.goto('/login');
      
      // Fill in credentials
      await page.fill('input[type="text"], input[type="email"]', 'multiuser@test.com');
      await page.fill('input[type="password"]', 'password');
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Should show team selection modal
      await expect(page.locator('text=Selecionar Equipe')).toBeVisible();
      
      // Should show all expected team options
      for (const option of scenario.expectedOptions) {
        await expect(page.locator(`text=${option}`)).toBeVisible();
      }
      
      // Should NOT redirect to dashboard automatically
      await expect(page).not.toHaveURL('/dashboard');
      await expect(page).not.toHaveURL('/admin');
      
      // Test modal functionality
      await expect(page.locator('button:has-text("Continuar")')).toBeDisabled(); // Should be disabled initially
      await expect(page.locator('button:has-text("Cancelar")')).toBeEnabled(); // Cancel should always be enabled
    }
  });

  test('should test team selection modal and dashboard routing', async ({ page }) => {
    // Mock successful authentication response
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

    // Mock multi-team user response
    await page.route('**/player_status*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          _id: 'routing_test_user',
          name: 'Routing Test User',
          total_points: 1500,
          teams: ['E6F5k30', 'E500AbT', 'E6U1B1p'], // Carteira 0, ER, Admin
          catalog_items: { 'E6F0O5f': 1 },
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
          total_catalog_items: 1,
          positions: [],
          time: Date.now(),
          extra: {},
          pointCategories: {}
        })
      });
    });

    // Navigate to login page
    await page.goto('/login');
    
    // Fill in credentials and submit
    await page.fill('input[type="text"], input[type="email"]', 'routingtest@test.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    
    // Should show team selection modal
    await expect(page.locator('text=Selecionar Equipe')).toBeVisible();
    
    // Test modal functionality
    await expect(page.locator('button:has-text("Continuar")')).toBeDisabled(); // Should be disabled initially
    
    // Select a team
    await page.click('text=Carteira 0');
    await expect(page.locator('button:has-text("Continuar")')).toBeEnabled(); // Should be enabled after selection
    
    // Test cancel functionality
    await page.click('button:has-text("Cancelar")');
    await expect(page).toHaveURL('/login'); // Should return to login
    
    // Login again and test successful routing
    await page.fill('input[type="text"], input[type="email"]', 'routingtest@test.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    
    // Wait for team selection modal
    await expect(page.locator('text=Selecionar Equipe')).toBeVisible();
    
    // Select Carteira 0 and continue
    await page.click('text=Carteira 0');
    await expect(page.locator('button:has-text("Continuar")')).toBeEnabled();
    await page.click('button:has-text("Continuar")');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
  });

  test('should test comprehensive team selection modal functionality', async ({ page }) => {
    // Mock successful authentication response
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

    // Mock multi-team user response with all teams
    await page.route('**/player_status*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          _id: 'comprehensive_test_user',
          name: 'Comprehensive Test User',
          total_points: 1500,
          teams: ['E6F5k30', 'E500AbT', 'team_carteira_i', 'team_carteira_ii', 'E6U1B1p'], // All new teams + existing + admin
          catalog_items: { 'E6F0O5f': 1 },
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
          total_catalog_items: 1,
          positions: [],
          time: Date.now(),
          extra: {},
          pointCategories: {}
        })
      });
    });

    // Mock dashboard data for different team selections
    await page.route('**/database/essencia_reports__c*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            _id: 'comprehensive_test_user_2024-01-15',
            playerId: 'comprehensive_test_user',
            playerName: 'Comprehensive Test User',
            team: 'CARTEIRA_0',
            conversoes: 85,
            reaisPorAtivo: 110,
            faturamento: 95,
            currentCycleDay: 10,
            totalCycleDays: 21,
            reportDate: '2024-01-15T00:00:00.000Z'
          }
        ])
      });
    });

    // Navigate to login page
    await page.goto('/login');
    
    // Fill in credentials and submit
    await page.fill('input[type="text"], input[type="email"]', 'comprehensive@test.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    
    // Should show team selection modal
    await expect(page.locator('text=Selecionar Equipe')).toBeVisible();
    
    // Test all expected team options are present
    await expect(page.locator('text=Carteira 0')).toBeVisible();
    await expect(page.locator('text=ER')).toBeVisible();
    await expect(page.locator('text=Carteira I')).toBeVisible();
    await expect(page.locator('text=Carteira II')).toBeVisible();
    await expect(page.locator('text=Administrador')).toBeVisible();
    
    // Test modal interaction states
    await expect(page.locator('button:has-text("Continuar")')).toBeDisabled(); // Initially disabled
    await expect(page.locator('button:has-text("Cancelar")')).toBeEnabled(); // Always enabled
    
    // Test team selection
    await page.click('text=Carteira 0');
    await expect(page.locator('button:has-text("Continuar")')).toBeEnabled(); // Enabled after selection
    
    // Test changing selection
    await page.click('text=ER');
    await expect(page.locator('button:has-text("Continuar")')).toBeEnabled(); // Still enabled
    
    // Test admin selection
    await page.click('text=Administrador');
    await expect(page.locator('button:has-text("Continuar")')).toBeEnabled(); // Enabled for admin
    
    // Go back to regular team and continue
    await page.click('text=Carteira 0');
    await page.click('button:has-text("Continuar")');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    
    // Should show dashboard content
    await expect(page.locator('text=Comprehensive Test User')).toBeVisible();
  });

  test('should test admin access through team selection', async ({ page }) => {
    // Mock successful authentication response
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

    // Mock multi-team user with admin access
    await page.route('**/player_status*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          _id: 'admin_access_user',
          name: 'Admin Access User',
          total_points: 1500,
          teams: ['E6F5k30', 'E500AbT', 'E6U1B1p'], // New teams + admin
          catalog_items: { 'E6F0O5f': 1 },
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
          total_catalog_items: 1,
          positions: [],
          time: Date.now(),
          extra: {},
          pointCategories: {}
        })
      });
    });

    // Navigate to login page
    await page.goto('/login');
    
    // Fill in credentials and submit
    await page.fill('input[type="text"], input[type="email"]', 'adminaccess@test.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    
    // Should show team selection modal with admin option
    await expect(page.locator('text=Selecionar Equipe')).toBeVisible();
    await expect(page.locator('text=Carteira 0')).toBeVisible();
    await expect(page.locator('text=ER')).toBeVisible();
    await expect(page.locator('text=Administrador')).toBeVisible();
    
    // Select admin
    await page.click('text=Administrador');
    await expect(page.locator('button:has-text("Continuar")')).toBeEnabled();
    await page.click('button:has-text("Continuar")');
    
    // Should redirect to admin dashboard
    await expect(page).toHaveURL('/admin');
    
    // Should show admin interface elements
    await expect(page.locator('text=Admin, text=Administrador')).toBeVisible();
  });

  test('should handle team selection routing for all new dashboard types', async ({ page }) => {
    const routingTests = [
      {
        teamName: 'Carteira 0',
        expectedUrl: '/dashboard',
        expectedContent: 'Conversões',
        teamData: {
          team: 'CARTEIRA_0',
          conversoes: 85,
          reaisPorAtivo: 110,
          faturamento: 95
        }
      },
      {
        teamName: 'ER',
        expectedUrl: '/dashboard',
        expectedContent: 'UPA',
        teamData: {
          team: 'ER',
          faturamento: 120,
          reaisPorAtivo: 95,
          upa: 88
        }
      }
    ];

    for (const test of routingTests) {
      // Mock successful authentication response
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

      // Mock multi-team user response
      await page.route('**/player_status*', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            _id: 'routing_test_user',
            name: 'Routing Test User',
            total_points: 1500,
            teams: ['E6F5k30', 'E500AbT'], // Both new teams
            catalog_items: { 'E6F0O5f': 1 },
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
            total_catalog_items: 1,
            positions: [],
            time: Date.now(),
            extra: {},
            pointCategories: {}
          })
        });
      });

      // Mock dashboard data for selected team
      await page.route('**/database/essencia_reports__c*', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              _id: 'routing_test_user_2024-01-15',
              playerId: 'routing_test_user',
              playerName: 'Routing Test User',
              ...test.teamData,
              currentCycleDay: 10,
              totalCycleDays: 21,
              reportDate: '2024-01-15T00:00:00.000Z'
            }
          ])
        });
      });

      // Navigate to login page
      await page.goto('/login');
      
      // Fill in credentials and submit
      await page.fill('input[type="text"], input[type="email"]', 'routingtest@test.com');
      await page.fill('input[type="password"]', 'password');
      await page.click('button[type="submit"]');
      
      // Should show team selection modal
      await expect(page.locator('text=Selecionar Equipe')).toBeVisible();
      
      // Select the team
      await page.click(`text=${test.teamName}`);
      await page.click('button:has-text("Continuar")');
      
      // Should redirect to expected URL
      await expect(page).toHaveURL(test.expectedUrl);
      
      // Should show expected content
      await expect(page.locator(`text=${test.expectedContent}`)).toBeVisible();
      
      // For ER team, should show Medalhas button
      if (test.teamName === 'ER') {
        await expect(page.locator('button:has-text("Medalhas"), button:has-text("Medals")')).toBeVisible();
      }
    }
  });

  test('should handle team selection cancellation and logout', async ({ page }) => {
    // Mock successful authentication response
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

    // Mock multi-team user response
    await page.route('**/player_status*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          _id: 'cancel_test_user',
          name: 'Cancel Test User',
          total_points: 1500,
          teams: ['E6F5k30', 'E500AbT'], // Both new teams
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

    // Navigate to login page
    await page.goto('/login');
    
    // Fill in credentials and submit
    await page.fill('input[type="text"], input[type="email"]', 'canceltest@test.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    
    // Should show team selection modal
    await expect(page.locator('text=Selecionar Equipe')).toBeVisible();
    
    // Test cancellation
    await page.click('button:has-text("Cancelar")');
    
    // Should return to login page
    await expect(page).toHaveURL('/login');
    await expect(page.locator('form')).toBeVisible();
    
    // Should not show team selection modal anymore
    await expect(page.locator('text=Selecionar Equipe')).not.toBeVisible();
    
    // Wait for team selection modal again
    await expect(page.locator('text=Selecionar Equipe')).toBeVisible();
    
    // Select ER team and continue
    await page.click('text=ER');
    await page.click('button:has-text("Continuar")');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
  });

  test('should handle team selection modal scenarios comprehensively', async ({ page }) => {
    // Mock successful authentication response
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

    // Test scenario 1: All new team types + admin
    await page.route('**/player_status*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          _id: 'comprehensive_user',
          name: 'Comprehensive User',
          total_points: 1500,
          teams: ['E6F5k30', 'E500AbT', 'team_carteira_i', 'E6U1B1p'], // All teams including new ones
          catalog_items: { 'E6F0O5f': 1 },
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
          total_catalog_items: 1,
          positions: [],
          time: Date.now(),
          extra: {},
          pointCategories: {}
        })
      });
    });

    // Fill in credentials and submit
    await page.fill('input[type="text"], input[type="email"]', 'comprehensive@test.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    
    // Should show team selection modal with all options
    await expect(page.locator('text=Selecionar Equipe')).toBeVisible();
    await expect(page.locator('text=Carteira 0')).toBeVisible();
    await expect(page.locator('text=ER')).toBeVisible();
    await expect(page.locator('text=Carteira I')).toBeVisible();
    await expect(page.locator('text=Administrador')).toBeVisible();
    
    // Test modal interaction - initially no selection
    await expect(page.locator('button:has-text("Continuar")')).toBeDisabled();
    
    // Select Carteira 0
    await page.click('text=Carteira 0');
    await expect(page.locator('button:has-text("Continuar")')).toBeEnabled();
    
    // Change selection to ER
    await page.click('text=ER');
    await expect(page.locator('button:has-text("Continuar")')).toBeEnabled();
    
    // Test cancel functionality
    await page.click('button:has-text("Cancelar")');
    await expect(page).toHaveURL('/login');
  });

  test('should test team selection modal with different team combinations', async ({ page }) => {
    const teamCombinations = [
      {
        teams: ['E6F5k30', 'E500AbT'], // Carteira 0 + ER
        expectedOptions: ['Carteira 0', 'ER'],
        description: 'New dashboard types only'
      },
      {
        teams: ['E6F5k30', 'team_carteira_i', 'team_carteira_ii'], // Carteira 0 + existing teams
        expectedOptions: ['Carteira 0', 'Carteira I', 'Carteira II'],
        description: 'Mixed new and existing teams'
      },
      {
        teams: ['E500AbT', 'team_carteira_iii', 'E6U1B1p'], // ER + Carteira III + Admin
        expectedOptions: ['ER', 'Carteira III', 'Administrador'],
        description: 'ER with existing team and admin'
      }
    ];

    for (const combination of teamCombinations) {
      // Mock successful authentication response
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

      // Mock multi-team user response
      await page.route('**/player_status*', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            _id: `combo_user_${combination.teams.join('_')}`,
            name: `Combo User ${combination.description}`,
            total_points: 1500,
            teams: combination.teams,
            catalog_items: { 'E6F0O5f': 1 },
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
            total_catalog_items: 1,
            positions: [],
            time: Date.now(),
            extra: {},
            pointCategories: {}
          })
        });
      });

      // Navigate to login page
      await page.goto('/login');
      
      // Fill in credentials
      await page.fill('input[type="text"], input[type="email"]', `combo@test.com`);
      await page.fill('input[type="password"]', 'password');
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Should show team selection modal
      await expect(page.locator('text=Selecionar Equipe')).toBeVisible();
      
      // Should show all expected team options
      for (const option of combination.expectedOptions) {
        await expect(page.locator(`text=${option}`)).toBeVisible();
      }
      
      // Should NOT show options not in the combination
      const allPossibleOptions = ['Carteira 0', 'ER', 'Carteira I', 'Carteira II', 'Carteira III', 'Carteira IV', 'Administrador'];
      const unexpectedOptions = allPossibleOptions.filter(option => !combination.expectedOptions.includes(option));
      
      for (const option of unexpectedOptions) {
        await expect(page.locator(`text=${option}`)).not.toBeVisible();
      }
    }
  });

  test('should handle edge cases in team identification', async ({ page }) => {
    // Mock successful authentication response
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

    // Test edge case: User with unknown team ID
    await page.route('**/player_status*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          _id: 'edge_case_user',
          name: 'Edge Case User',
          total_points: 1500,
          teams: ['unknown_team_id', 'E6F5k30'], // Unknown team + Carteira 0
          catalog_items: { 'E6F0O5f': 1 },
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
          total_catalog_items: 1,
          positions: [],
          time: Date.now(),
          extra: {},
          pointCategories: {}
        })
      });
    });

    // Fill in credentials and submit
    await page.fill('input[type="text"], input[type="email"]', 'edgecase@test.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    
    // Should show team selection modal with only recognized teams
    await expect(page.locator('text=Selecionar Equipe')).toBeVisible();
    await expect(page.locator('text=Carteira 0')).toBeVisible();
    
    // Should not show unknown team
    await expect(page.locator('text=unknown_team_id')).not.toBeVisible();
  });

  test('should test complete authentication flow with new dashboard routing', async ({ page }) => {
    // Test complete flow for Carteira 0 user
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

    await page.route('**/player_status*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          _id: 'auth_flow_carteira_0',
          name: 'Auth Flow Carteira 0',
          total_points: 1500,
          teams: ['E6F5k30'], // Single Carteira 0 team
          catalog_items: { 'E6F0O5f': 1 },
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
            _id: 'auth_flow_carteira_0_2024-01-15',
            playerId: 'auth_flow_carteira_0',
            playerName: 'Auth Flow Carteira 0',
            team: 'CARTEIRA_0',
            conversoes: 85,
            reaisPorAtivo: 110,
            faturamento: 95,
            currentCycleDay: 10,
            totalCycleDays: 21,
            reportDate: '2024-01-15T00:00:00.000Z'
          }
        ])
      });
    });

    // Fill in credentials and submit
    await page.fill('input[type="text"], input[type="email"]', 'authflow@test.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    
    // Should redirect directly to dashboard (single team)
    await expect(page).toHaveURL('/dashboard');
    
    // Should show Carteira 0 specific content
    await expect(page.locator('text=Auth Flow Carteira 0')).toBeVisible();
    await expect(page.locator('text=Conversões')).toBeVisible();
    await expect(page.locator('text=85%')).toBeVisible();
    
    // Should NOT show team selection modal
    await expect(page.locator('text=Selecionar Equipe')).not.toBeVisible();
    
    // Select team and continue
    await page.click('text=ER');
    await page.click('button:has-text("Continuar")');
    
    // Should route to dashboard
    await expect(page).toHaveURL('/dashboard');
  });


});