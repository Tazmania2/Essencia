import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication for consistent testing
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
  });

  test('should load login page within performance budget', async ({ page }) => {
    // Start performance measurement
    const startTime = Date.now();
    
    // Navigate to login page
    await page.goto('/login');
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Performance assertion: login page should load within 2 seconds
    expect(loadTime).toBeLessThan(2000);
    
    // Check that critical elements are visible
    await expect(page.locator('form')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    
    console.log(`Login page load time: ${loadTime}ms`);
  });

  test('should complete authentication flow within performance budget', async ({ page }) => {
    // Mock player status response
    await page.route('**/player_status*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          _id: 'perf_player',
          name: 'Performance Test Player',
          total_points: 1500,
          teams: ['team_carteira_i'],
          catalog_items: { 'E6F0O5f': 1 },
          level_progress: { percent_completed: 75, next_points: 500, total_levels: 10, percent: 0.75 },
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

    await page.goto('/login');
    
    // Start timing the authentication flow
    const startTime = Date.now();
    
    // Fill and submit login form
    await page.fill('input[type="text"], input[type="email"]', 'perf@test.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard to load
    await expect(page).toHaveURL('/dashboard');
    await page.waitForLoadState('networkidle');
    
    const authTime = Date.now() - startTime;
    
    // Performance assertion: authentication should complete within 3 seconds
    expect(authTime).toBeLessThan(3000);
    
    console.log(`Authentication flow time: ${authTime}ms`);
  });

  test('should load dashboard with realistic data within performance budget', async ({ page }) => {
    // Mock player status with realistic data size
    await page.route('**/player_status*', async route => {
      // Simulate larger response with more data
      const largePlayerData = {
        _id: 'large_data_player',
        name: 'Large Data Player',
        total_points: 15000,
        teams: ['team_carteira_i'],
        catalog_items: {
          'E6F0O5f': 1,
          'E6F0WGc': 1,
          'E6K79Mt': 1,
          // Add more catalog items to simulate realistic data size
          ...Array.from({ length: 50 }, (_, i) => ({ [`item_${i}`]: Math.floor(Math.random() * 10) })).reduce((acc, item) => ({ ...acc, ...item }), {})
        },
        level_progress: { percent_completed: 85, next_points: 300, total_levels: 20, percent: 0.85 },
        challenge_progress: Array.from({ length: 20 }, (_, i) => ({
          challenge_id: `challenge_${i}`,
          current_value: Math.floor(Math.random() * 100),
          target_value: 100,
          percentage: Math.floor(Math.random() * 150)
        })),
        total_challenges: 20,
        challenges: Array.from({ length: 20 }, (_, i) => ({ [`challenge_${i}`]: Math.floor(Math.random() * 100) })).reduce((acc, item) => ({ ...acc, ...item }), {}),
        point_categories: {
          'base_points': 10000,
          'bonus_points': 3000,
          'achievement_points': 2000
        },
        total_catalog_items: 53,
        positions: Array.from({ length: 10 }, (_, i) => ({ position: i + 1, category: `category_${i}` })),
        time: Date.now(),
        extra: {
          metadata: Array.from({ length: 100 }, (_, i) => ({ key: `meta_${i}`, value: `value_${i}` }))
        },
        pointCategories: {
          'base_points': 10000,
          'bonus_points': 3000,
          'achievement_points': 2000
        }
      };

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(largePlayerData)
      });
    });

    // Mock collection data with multiple records
    await page.route('**/database/essencia_reports__c*', async route => {
      const largeCollectionData = Array.from({ length: 30 }, (_, i) => ({
        _id: `large_data_player_2024-01-${String(i + 1).padStart(2, '0')}`,
        playerId: 'large_data_player',
        playerName: 'Large Data Player',
        team: 'CARTEIRA_I',
        atividade: 80 + Math.floor(Math.random() * 20),
        reaisPorAtivo: 100 + Math.floor(Math.random() * 30),
        faturamento: 90 + Math.floor(Math.random() * 25),
        currentCycleDay: i + 1,
        totalCycleDays: 30,
        reportDate: `2024-01-${String(i + 1).padStart(2, '0')}T00:00:00.000Z`
      }));

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(largeCollectionData)
      });
    });

    // Login first
    await page.goto('/login');
    await page.fill('input[type="text"], input[type="email"]', 'perf@test.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');

    // Measure dashboard load time with large data
    const startTime = Date.now();
    
    await expect(page).toHaveURL('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Wait for all dashboard elements to be visible
    await expect(page.locator('text=Large Data Player')).toBeVisible();
    await expect(page.locator('text=15.000, text=15000')).toBeVisible();
    
    const dashboardLoadTime = Date.now() - startTime;
    
    // Performance assertion: dashboard with large data should load within 4 seconds
    expect(dashboardLoadTime).toBeLessThan(4000);
    
    console.log(`Dashboard load time with large data: ${dashboardLoadTime}ms`);
  });

  test('should handle multiple rapid navigation actions efficiently', async ({ page }) => {
    // Mock basic player data
    await page.route('**/player_status*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          _id: 'nav_player',
          name: 'Navigation Test Player',
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

    await page.route('**/database/essencia_reports__c*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{
          _id: 'nav_player_2024-01-15',
          playerId: 'nav_player',
          playerName: 'Navigation Test Player',
          team: 'CARTEIRA_I',
          atividade: 75,
          reaisPorAtivo: 85,
          faturamento: 90,
          currentCycleDay: 15,
          totalCycleDays: 21,
          reportDate: '2024-01-15T00:00:00.000Z'
        }])
      });
    });

    // Login
    await page.goto('/login');
    await page.fill('input[type="text"], input[type="email"]', 'nav@test.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');

    // Perform rapid navigation actions
    const startTime = Date.now();
    
    // Simulate user interactions: clicking on goal cards, expanding details, etc.
    const goalCards = page.locator('[data-testid="goal-card"], .goal-card');
    
    for (let i = 0; i < 5; i++) {
      // Click on different goal cards rapidly
      if (await goalCards.nth(i % 3).isVisible()) {
        await goalCards.nth(i % 3).click();
        await page.waitForTimeout(100); // Small delay to simulate user behavior
      }
    }
    
    // Navigate back and forth
    await page.goBack();
    await page.goForward();
    
    // Refresh page
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    const navigationTime = Date.now() - startTime;
    
    // Performance assertion: rapid navigation should complete within 5 seconds
    expect(navigationTime).toBeLessThan(5000);
    
    console.log(`Rapid navigation time: ${navigationTime}ms`);
  });

  test('should measure memory usage during extended session', async ({ page }) => {
    // Mock player data
    await page.route('**/player_status*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          _id: 'memory_player',
          name: 'Memory Test Player',
          total_points: 1200,
          teams: ['team_carteira_i'],
          catalog_items: { 'E6F0O5f': 1 },
          level_progress: { percent_completed: 60, next_points: 800, total_levels: 10, percent: 0.6 },
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
        body: JSON.stringify([{
          _id: 'memory_player_2024-01-15',
          playerId: 'memory_player',
          playerName: 'Memory Test Player',
          team: 'CARTEIRA_I',
          atividade: 80,
          reaisPorAtivo: 90,
          faturamento: 85,
          currentCycleDay: 15,
          totalCycleDays: 21,
          reportDate: '2024-01-15T00:00:00.000Z'
        }])
      });
    });

    // Login
    await page.goto('/login');
    await page.fill('input[type="text"], input[type="email"]', 'memory@test.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');

    // Get initial memory usage
    const initialMemory = await page.evaluate(() => {
      return (performance as any).memory ? (performance as any).memory.usedJSHeapSize : 0;
    });

    // Simulate extended user session with multiple interactions
    for (let i = 0; i < 20; i++) {
      // Refresh data periodically (simulate real-time updates)
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Interact with elements
      const goalCards = page.locator('[data-testid="goal-card"], .goal-card');
      if (await goalCards.first().isVisible()) {
        await goalCards.first().click();
        await page.waitForTimeout(50);
      }
      
      await page.waitForTimeout(100);
    }

    // Get final memory usage
    const finalMemory = await page.evaluate(() => {
      return (performance as any).memory ? (performance as any).memory.usedJSHeapSize : 0;
    });

    if (initialMemory > 0 && finalMemory > 0) {
      const memoryIncrease = finalMemory - initialMemory;
      const memoryIncreasePercent = (memoryIncrease / initialMemory) * 100;
      
      console.log(`Initial memory: ${(initialMemory / 1024 / 1024).toFixed(2)} MB`);
      console.log(`Final memory: ${(finalMemory / 1024 / 1024).toFixed(2)} MB`);
      console.log(`Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)} MB (${memoryIncreasePercent.toFixed(2)}%)`);
      
      // Performance assertion: memory increase should be reasonable (less than 50MB or 100% increase)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // 50MB
      expect(memoryIncreasePercent).toBeLessThan(100); // 100% increase
    }
  });

  test('should handle concurrent API requests efficiently', async ({ page }) => {
    let requestCount = 0;
    const requestTimes: number[] = [];

    // Mock multiple API endpoints with timing
    await page.route('**/player_status*', async route => {
      const startTime = Date.now();
      requestCount++;
      
      await new Promise(resolve => setTimeout(resolve, 100)); // Simulate API delay
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          _id: `concurrent_player_${requestCount}`,
          name: `Concurrent Test Player ${requestCount}`,
          total_points: 1000 + requestCount * 100,
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
      
      requestTimes.push(Date.now() - startTime);
    });

    await page.route('**/database/essencia_reports__c*', async route => {
      await new Promise(resolve => setTimeout(resolve, 50)); // Simulate API delay
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{
          _id: `concurrent_player_${requestCount}_2024-01-15`,
          playerId: `concurrent_player_${requestCount}`,
          playerName: `Concurrent Test Player ${requestCount}`,
          team: 'CARTEIRA_I',
          atividade: 70 + requestCount * 2,
          reaisPorAtivo: 80 + requestCount * 3,
          faturamento: 75 + requestCount * 2,
          currentCycleDay: 15,
          totalCycleDays: 21,
          reportDate: '2024-01-15T00:00:00.000Z'
        }])
      });
    });

    // Login
    await page.goto('/login');
    await page.fill('input[type="text"], input[type="email"]', 'concurrent@test.com');
    await page.fill('input[type="password"]', 'password');
    
    const startTime = Date.now();
    await page.click('button[type="submit"]');
    
    // Wait for dashboard to load (this will trigger concurrent API calls)
    await expect(page).toHaveURL('/dashboard');
    await page.waitForLoadState('networkidle');
    
    const totalTime = Date.now() - startTime;
    
    // Performance assertions
    expect(requestCount).toBeGreaterThan(0);
    expect(totalTime).toBeLessThan(5000); // Total time should be reasonable
    
    // Check that requests were handled efficiently
    const avgRequestTime = requestTimes.reduce((sum, time) => sum + time, 0) / requestTimes.length;
    expect(avgRequestTime).toBeLessThan(1000); // Average request time should be reasonable
    
    console.log(`Concurrent requests: ${requestCount}`);
    console.log(`Total time: ${totalTime}ms`);
    console.log(`Average request time: ${avgRequestTime.toFixed(2)}ms`);
  });

  test('should measure Core Web Vitals', async ({ page }) => {
    // Mock basic data
    await page.route('**/player_status*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          _id: 'cwv_player',
          name: 'Core Web Vitals Player',
          total_points: 1300,
          teams: ['team_carteira_i'],
          catalog_items: { 'E6F0O5f': 1 },
          level_progress: { percent_completed: 65, next_points: 700, total_levels: 10, percent: 0.65 },
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
        body: JSON.stringify([{
          _id: 'cwv_player_2024-01-15',
          playerId: 'cwv_player',
          playerName: 'Core Web Vitals Player',
          team: 'CARTEIRA_I',
          atividade: 82,
          reaisPorAtivo: 95,
          faturamento: 88,
          currentCycleDay: 15,
          totalCycleDays: 21,
          reportDate: '2024-01-15T00:00:00.000Z'
        }])
      });
    });

    // Navigate to dashboard
    await page.goto('/login');
    await page.fill('input[type="text"], input[type="email"]', 'cwv@test.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
    await page.waitForLoadState('networkidle');

    // Measure Core Web Vitals
    const webVitals = await page.evaluate(() => {
      return new Promise((resolve) => {
        const vitals: any = {};
        
        // Largest Contentful Paint (LCP)
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          vitals.lcp = lastEntry.startTime;
        }).observe({ entryTypes: ['largest-contentful-paint'] });

        // First Input Delay (FID) - simulate with click
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          if (entries.length > 0) {
            vitals.fid = entries[0].processingStart - entries[0].startTime;
          }
        }).observe({ entryTypes: ['first-input'] });

        // Cumulative Layout Shift (CLS)
        let clsValue = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
          vitals.cls = clsValue;
        }).observe({ entryTypes: ['layout-shift'] });

        // Get navigation timing
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        vitals.ttfb = navigation.responseStart - navigation.requestStart;
        vitals.domContentLoaded = navigation.domContentLoadedEventEnd - navigation.navigationStart;
        vitals.loadComplete = navigation.loadEventEnd - navigation.navigationStart;

        setTimeout(() => resolve(vitals), 2000);
      });
    });

    console.log('Core Web Vitals:', webVitals);

    // Performance assertions based on Core Web Vitals thresholds
    if ((webVitals as any).lcp) {
      expect((webVitals as any).lcp).toBeLessThan(2500); // LCP should be < 2.5s
    }
    if ((webVitals as any).fid) {
      expect((webVitals as any).fid).toBeLessThan(100); // FID should be < 100ms
    }
    if ((webVitals as any).cls !== undefined) {
      expect((webVitals as any).cls).toBeLessThan(0.1); // CLS should be < 0.1
    }
    if ((webVitals as any).ttfb) {
      expect((webVitals as any).ttfb).toBeLessThan(800); // TTFB should be < 800ms
    }
  });
});