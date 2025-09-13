import { test, expect } from '@playwright/test';

test.describe('Error Scenarios and Recovery', () => {
  test('should handle authentication token expiration', async ({ page }) => {
    // Mock initial successful authentication
    await page.route('**/auth/token', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'mock-token-123',
          token_type: 'Bearer',
          expires_in: 1 // Very short expiry
        })
      });
    });

    // Mock player status for initial load
    await page.route('**/player_status*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          _id: 'player_123',
          name: 'Test Player',
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

    // Login successfully
    await page.goto('/login');
    await page.fill('input[type="text"], input[type="email"]', 'test@test.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    
    // Should reach dashboard
    await expect(page).toHaveURL('/dashboard');
    
    // Wait for token to expire and mock 401 response
    await page.waitForTimeout(2000);
    
    // Mock 401 unauthorized response for subsequent requests
    await page.route('**/database/essencia_reports__c*', async route => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'unauthorized',
          message: 'Token expired'
        })
      });
    });

    // Try to refresh or navigate
    await page.reload();
    
    // Should redirect to login page
    await expect(page).toHaveURL('/login');
    
    // Should show session expired message
    await expect(page.locator('text=sessão expirou, text=session expired')).toBeVisible();
  });

  test('should handle Funifier API server errors', async ({ page }) => {
    // Mock authentication success
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

    // Mock server error for player status
    await page.route('**/player_status*', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'internal_server_error',
          message: 'Funifier API is temporarily unavailable'
        })
      });
    });

    // Login
    await page.goto('/login');
    await page.fill('input[type="text"], input[type="email"]', 'test@test.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    
    // Should show error message
    await expect(page.locator('text=Erro no servidor, text=Server error')).toBeVisible();
    
    // Should show retry button
    const retryButton = page.locator('button:has-text("Tentar novamente"), button:has-text("Retry")');
    await expect(retryButton).toBeVisible();
    
    // Mock successful response for retry
    await page.route('**/player_status*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          _id: 'player_123',
          name: 'Test Player',
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

    // Click retry
    await retryButton.click();
    
    // Should successfully load dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('text=Test Player')).toBeVisible();
  });

  test('should handle network connectivity issues', async ({ page }) => {
    // Mock authentication success
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

    // Login successfully
    await page.goto('/login');
    await page.fill('input[type="text"], input[type="email"]', 'test@test.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    
    // Simulate network failure
    await page.route('**/player_status*', async route => {
      await route.abort('failed');
    });

    // Should show network error
    await expect(page.locator('text=Erro de conexão, text=Connection error, text=Network error')).toBeVisible();
    
    // Should show offline indicator
    await expect(page.locator('[data-testid="offline-indicator"], .offline-indicator')).toBeVisible();
  });

  test('should handle malformed API responses', async ({ page }) => {
    // Mock authentication success
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

    // Mock malformed player status response
    await page.route('**/player_status*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: 'invalid json response'
      });
    });

    // Login
    await page.goto('/login');
    await page.fill('input[type="text"], input[type="email"]', 'test@test.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    
    // Should show data parsing error
    await expect(page.locator('text=Erro ao processar dados, text=Data processing error')).toBeVisible();
  });

  test('should handle rate limiting gracefully', async ({ page }) => {
    // Mock authentication success
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

    // Mock rate limiting response
    await page.route('**/player_status*', async route => {
      await route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'rate_limit_exceeded',
          message: 'Too many requests',
          retry_after: 60
        })
      });
    });

    // Login
    await page.goto('/login');
    await page.fill('input[type="text"], input[type="email"]', 'test@test.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    
    // Should show rate limit message
    await expect(page.locator('text=Muitas tentativas, text=Rate limit, text=Tente novamente em')).toBeVisible();
    
    // Should show countdown timer
    await expect(page.locator('text=60, text=segundos')).toBeVisible();
  });

  test('should handle unauthorized access attempts', async ({ page }) => {
    // Try to access dashboard without authentication
    await page.goto('/dashboard');
    
    // Should redirect to login
    await expect(page).toHaveURL('/login');
    
    // Try to access admin without authentication
    await page.goto('/admin');
    
    // Should redirect to login
    await expect(page).toHaveURL('/login');
  });

  test('should handle player accessing admin area', async ({ page }) => {
    // Mock authentication for regular player
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

    // Mock player (not admin) response
    await page.route('**/player_status*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          _id: 'player_123',
          name: 'Regular Player',
          total_points: 1000,
          teams: ['team_carteira_i'], // Has team = not admin
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

    // Login as player
    await page.goto('/login');
    await page.fill('input[type="text"], input[type="email"]', 'player@test.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    
    // Should go to player dashboard
    await expect(page).toHaveURL('/dashboard');
    
    // Try to access admin area
    await page.goto('/admin');
    
    // Should redirect to unauthorized page or back to dashboard
    await expect(page).toHaveURL('/unauthorized');
    
    // Should show access denied message
    await expect(page.locator('text=Acesso negado, text=Access denied')).toBeVisible();
  });

  test('should handle missing player data gracefully', async ({ page }) => {
    // Mock authentication success
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

    // Mock player status with minimal data
    await page.route('**/player_status*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          _id: 'minimal_player',
          name: 'Minimal Player',
          total_points: 0,
          teams: ['team_carteira_i'],
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

    // Mock empty collection data
    await page.route('**/database/essencia_reports__c*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });

    // Login
    await page.goto('/login');
    await page.fill('input[type="text"], input[type="email"]', 'test@test.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    
    // Should load dashboard with default values
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('text=Minimal Player')).toBeVisible();
    
    // Should show default cycle info (21 days)
    await expect(page.locator('text=21')).toBeVisible();
    
    // Should show zero or default values gracefully
    await expect(page.locator('text=0%')).toBeVisible();
  });

  test('should recover from temporary API failures', async ({ page }) => {
    let requestCount = 0;
    
    // Mock authentication success
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

    // Mock player status with failure then success
    await page.route('**/player_status*', async route => {
      requestCount++;
      
      if (requestCount === 1) {
        // First request fails
        await route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'service_unavailable',
            message: 'Service temporarily unavailable'
          })
        });
      } else {
        // Subsequent requests succeed
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            _id: 'recovery_player',
            name: 'Recovery Player',
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
      }
    });

    // Login
    await page.goto('/login');
    await page.fill('input[type="text"], input[type="email"]', 'test@test.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    
    // Should show error initially
    await expect(page.locator('text=Serviço indisponível, text=Service unavailable')).toBeVisible();
    
    // Should show retry button
    const retryButton = page.locator('button:has-text("Tentar novamente"), button:has-text("Retry")');
    await expect(retryButton).toBeVisible();
    
    // Click retry
    await retryButton.click();
    
    // Should successfully load dashboard on retry
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('text=Recovery Player')).toBeVisible();
  });
});