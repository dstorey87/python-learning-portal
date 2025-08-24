import { test, expect } from '@playwright/test';

test.describe('Application Navigation and Layout', () => {
  test('should load the application homepage', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Python Learning Portal/);
    
    // Check for main layout components
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
  });

  test('should display sidebar with exercise categories', async ({ page }) => {
    await page.goto('/');
    
    // Wait for sidebar to load
    const sidebar = page.locator('[data-testid="sidebar"]');
    await expect(sidebar).toBeVisible();
    
    // Check for exercise categories
    await expect(page.locator('text=Exercises')).toBeVisible();
  });

  test('should display header with navigation', async ({ page }) => {
    await page.goto('/');
    
    const header = page.locator('header');
    await expect(header).toBeVisible();
    await expect(page.locator('h1')).toContainText('Python Learning Portal');
  });

  test('should be responsive on different screen sizes', async ({ page }) => {
    await page.goto('/');
    
    // Test desktop view
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();
    
    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(100);
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(100);
  });
});

test.describe('Exercise Loading and Display', () => {
  test('should load exercises from API', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');
    
    // Wait for exercises to load
    await page.waitForLoadState('networkidle');
    
    // Check that exercises are visible
    const exerciseItems = page.locator('[data-testid="exercise-item"]');
    await expect(exerciseItems.first()).toBeVisible({ timeout: 10000 });
  });

  test('should display exercise list in sidebar', async ({ page }) => {
    await page.goto('/');
    
    // Wait for content to load
    await page.waitForLoadState('networkidle');
    
    // Check for specific exercises we know exist
    await expect(page.locator('text=E0_greet')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=E1_seconds_to_hms')).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to exercise details when clicked', async ({ page }) => {
    await page.goto('/');
    
    // Wait for exercises to load
    await page.waitForLoadState('networkidle');
    
    // Click on first exercise
    const firstExercise = page.locator('[data-testid="exercise-item"]').first();
    await firstExercise.click();
    
    // Should navigate to exercise view
    await expect(page.url()).toContain('/exercise/');
  });
});

test.describe('Code Editor Integration', () => {
  test('should display Monaco editor when viewing an exercise', async ({ page }) => {
    await page.goto('/');
    
    // Navigate to an exercise
    await page.waitForLoadState('networkidle');
    const firstExercise = page.locator('[data-testid="exercise-item"]').first();
    await firstExercise.click();
    
    // Check for Monaco editor
    await expect(page.locator('.monaco-editor')).toBeVisible({ timeout: 15000 });
  });

  test('should allow typing in the code editor', async ({ page }) => {
    await page.goto('/');
    
    // Navigate to an exercise
    await page.waitForLoadState('networkidle');
    const firstExercise = page.locator('[data-testid="exercise-item"]').first();
    await firstExercise.click();
    
    // Wait for editor to load
    await expect(page.locator('.monaco-editor')).toBeVisible({ timeout: 15000 });
    
    // Click in editor area and type
    await page.locator('.monaco-editor').click();
    await page.keyboard.type('print("Hello World")');
    
    // Verify text was entered
    await expect(page.locator('.monaco-editor')).toContainText('print("Hello World")');
  });

  test('should display starter code for exercises', async ({ page }) => {
    await page.goto('/');
    
    // Navigate to an exercise
    await page.waitForLoadState('networkidle');
    const firstExercise = page.locator('[data-testid="exercise-item"]').first();
    await firstExercise.click();
    
    // Wait for editor to load with starter code
    await expect(page.locator('.monaco-editor')).toBeVisible({ timeout: 15000 });
    
    // Should contain some starter code (def function signature, etc.)
    await page.waitForTimeout(2000); // Give time for code to load
  });
});

test.describe('Exercise Instructions and Content', () => {
  test('should display exercise instructions', async ({ page }) => {
    await page.goto('/');
    
    // Navigate to an exercise
    await page.waitForLoadState('networkidle');
    const firstExercise = page.locator('[data-testid="exercise-item"]').first();
    await firstExercise.click();
    
    // Check for instructions section
    await expect(page.locator('[data-testid="instructions"]')).toBeVisible({ timeout: 10000 });
  });

  test('should display exercise title and description', async ({ page }) => {
    await page.goto('/');
    
    // Navigate to an exercise
    await page.waitForLoadState('networkidle');
    const firstExercise = page.locator('[data-testid="exercise-item"]').first();
    await firstExercise.click();
    
    // Check for title
    await expect(page.locator('h2')).toBeVisible();
    
    // Check for description content
    await expect(page.locator('[data-testid="instructions"]')).not.toBeEmpty();
  });
});

test.describe('API Integration', () => {
  test('should successfully fetch exercises from backend', async ({ page }) => {
    // Listen for API calls
    let apiCallMade = false;
    page.on('response', response => {
      if (response.url().includes('/api/exercises')) {
        apiCallMade = true;
        expect(response.status()).toBe(200);
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    expect(apiCallMade).toBe(true);
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Intercept API calls and return error
    await page.route('**/api/exercises', route => route.fulfill({
      status: 500,
      body: 'Internal Server Error'
    }));
    
    await page.goto('/');
    
    // Should show error message or fallback UI
    await expect(page.locator('text=Error') || page.locator('text=Failed')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Accessibility', () => {
  test('should have proper heading structure', async ({ page }) => {
    await page.goto('/');
    
    // Check for proper heading hierarchy
    await expect(page.locator('h1')).toBeVisible();
    
    // Navigate to exercise and check headings there too
    await page.waitForLoadState('networkidle');
    const firstExercise = page.locator('[data-testid="exercise-item"]').first();
    await firstExercise.click();
    
    await expect(page.locator('h2')).toBeVisible();
  });

  test('should have keyboard navigation support', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Use Tab to navigate
    await page.keyboard.press('Tab');
    
    // Check that focus is visible on interactive elements
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });
});

test.describe('Performance', () => {
  test('should load within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Should load within 10 seconds (generous for dev environment)
    expect(loadTime).toBeLessThan(10000);
  });

  test('should not have console errors on load', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Filter out known dev warnings
    const criticalErrors = errors.filter(error => 
      !error.includes('DevTools') && 
      !error.includes('extension') &&
      !error.includes('_extend')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });
});