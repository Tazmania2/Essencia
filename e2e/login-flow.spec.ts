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

  test('should show loading state during authentication', async ({ page }) => {
    // Mock slow response
    await page.route('**/auth/token', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000));
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

    // Fill in credentials
    await page.fill('input[type="text"], input[type="email"]', 'test@test.com');
    await page.fill('input[type="password"]', 'password');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should show loading state
    await expect(page.locator('text=carregando, text=loading, [data-testid="loading"]')).toBeVisible();
    
    // Loading should disappear after response
    await expect(page.locator('text=carregando, text=loading, [data-testid="loading"]')).not.toBeVisible();
  });
});