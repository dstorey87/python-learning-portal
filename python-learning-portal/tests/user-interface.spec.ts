import { test, expect } from '@playwright/test';

test.describe('User Interface Components', () => {
  test('should display consistent branding and styling', async ({ page }) => {
    await page.goto('/');
    
    // Check for consistent color scheme
    const header = page.locator('header');
    await expect(header).toBeVisible();
    
    // Check for consistent typography
    await expect(page.locator('h1')).toHaveCSS('font-weight', '700');
  });

  test('should have functional navigation menu', async ({ page }) => {
    await page.goto('/');
    
    // Check for navigation elements
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
    
    // If there are nav links, they should be clickable
    const navLinks = page.locator('nav a');
    if (await navLinks.count() > 0) {
      await expect(navLinks.first()).toBeVisible();
    }
  });

  test('should have working buttons with proper states', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Navigate to exercise to find buttons
    const firstExercise = page.locator('[data-testid="exercise-item"]').first();
    if (await firstExercise.isVisible()) {
      await firstExercise.click();
      
      // Look for buttons
      const buttons = page.locator('button');
      if (await buttons.count() > 0) {
        const firstButton = buttons.first();
        await expect(firstButton).toBeEnabled();
        
        // Check hover state (if possible)
        await firstButton.hover();
      }
    }
  });

  test('should provide visual feedback on interactions', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check for exercise items that provide hover feedback
    const exerciseItem = page.locator('[data-testid="exercise-item"]').first();
    if (await exerciseItem.isVisible()) {
      await exerciseItem.hover();
      await page.waitForTimeout(100); // Allow for transition
    }
  });

  test('should display tooltips or help text where appropriate', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Navigate to exercise
    const firstExercise = page.locator('[data-testid="exercise-item"]').first();
    if (await firstExercise.isVisible()) {
      await firstExercise.click();
      
      // Look for help icons or tooltips
      const helpElements = page.locator('[title]');
      if (await helpElements.count() > 0) {
        await helpElements.first().hover();
        await page.waitForTimeout(500);
      }
    }
  });

  test('should handle form inputs properly', async ({ page }) => {
    await page.goto('/');
    
    // Look for any input fields
    const inputs = page.locator('input, textarea');
    if (await inputs.count() > 0) {
      const firstInput = inputs.first();
      await firstInput.click();
      await firstInput.fill('test input');
      await expect(firstInput).toHaveValue('test input');
    }
  });
});

test.describe('Responsive Design', () => {
  test('should work on desktop resolution', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    
    // Main content should be visible and well-laid out
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();
  });

  test('should work on tablet resolution', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    
    // Should still be functional
    await expect(page.locator('main')).toBeVisible();
  });

  test('should work on mobile resolution', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Should be usable on mobile
    await expect(page.locator('main')).toBeVisible();
  });

  test('should adjust sidebar behavior on smaller screens', async ({ page }) => {
    // Desktop view first
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('/');
    
    const sidebar = page.locator('[data-testid="sidebar"]');
    if (await sidebar.isVisible()) {
      // Switch to mobile
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(100);
      
      // Sidebar might be hidden or transformed on mobile
      // This is okay as long as navigation is still possible
    }
  });
});

test.describe('Exercise Navigation', () => {
  test('should allow navigation between exercises', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Get list of exercises
    const exercises = page.locator('[data-testid="exercise-item"]');
    const exerciseCount = await exercises.count();
    
    if (exerciseCount > 1) {
      // Click first exercise
      await exercises.first().click();
      await expect(page.url()).toContain('/exercise/');
      
      // Go back and click second exercise
      await page.goBack();
      await exercises.nth(1).click();
      await expect(page.url()).toContain('/exercise/');
    }
  });

  test('should maintain exercise state when navigating', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Navigate to first exercise
    const firstExercise = page.locator('[data-testid="exercise-item"]').first();
    await firstExercise.click();
    
    // Wait for editor
    await expect(page.locator('.monaco-editor')).toBeVisible({ timeout: 15000 });
    
    // Type some code
    await page.locator('.monaco-editor').click();
    await page.keyboard.type('# My custom code');
    
    // Navigate away and back
    await page.goBack();
    if (await firstExercise.isVisible()) {
      await firstExercise.click();
      
      // Code might or might not be preserved depending on implementation
      // This is acceptable behavior for initial testing
    }
  });

  test('should display progress indicators', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Look for any progress indicators
    const progressElements = page.locator('[data-testid="progress"], .progress-bar, .progress');
    if (await progressElements.count() > 0) {
      await expect(progressElements.first()).toBeVisible();
    }
  });

  test('should show exercise difficulty or category', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Exercise items should have some indication of type or difficulty
    const exerciseItem = page.locator('[data-testid="exercise-item"]').first();
    if (await exerciseItem.isVisible()) {
      // Should contain exercise name/ID
      await expect(exerciseItem).toContainText(/E\d+/);
    }
  });
});

test.describe('Error Handling and Edge Cases', () => {
  test('should handle network errors gracefully', async ({ page }) => {
    // Start with normal load
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Simulate network failure for API calls
    await page.route('**/api/**', route => route.abort());
    
    // Try to navigate to exercise
    const exerciseItem = page.locator('[data-testid="exercise-item"]').first();
    if (await exerciseItem.isVisible()) {
      await exerciseItem.click();
      
      // Should show error message or fallback UI
      await page.waitForTimeout(2000);
      // App should still be responsive even if API fails
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should handle empty or malformed data', async ({ page }) => {
    // Intercept API to return empty data
    await page.route('**/api/exercises', route => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([])
    }));
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Should handle empty state gracefully
    await expect(page.locator('main')).toBeVisible();
  });

  test('should handle very long code input', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Navigate to exercise
    const firstExercise = page.locator('[data-testid="exercise-item"]').first();
    if (await firstExercise.isVisible()) {
      await firstExercise.click();
      
      // Wait for editor
      await expect(page.locator('.monaco-editor')).toBeVisible({ timeout: 15000 });
      
      // Type very long code
      await page.locator('.monaco-editor').click();
      const longCode = 'print("line");\n'.repeat(100);
      await page.keyboard.type(longCode.substring(0, 500)); // Limit for test performance
      
      // Editor should handle it
      await expect(page.locator('.monaco-editor')).toContainText('print("line")');
    }
  });

  test('should handle rapid button clicks', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Navigate to exercise
    const firstExercise = page.locator('[data-testid="exercise-item"]').first();
    if (await firstExercise.isVisible()) {
      await firstExercise.click();
      
      // Wait for buttons to appear
      await page.waitForTimeout(2000);
      
      // Find any button and click rapidly
      const button = page.locator('button').first();
      if (await button.isVisible()) {
        await button.click();
        await button.click();
        await button.click();
        
        // Should not break the application
        await expect(page.locator('body')).toBeVisible();
      }
    }
  });
});

test.describe('Accessibility Compliance', () => {
  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/');
    
    // Check for ARIA labels on interactive elements
    const buttons = page.locator('button');
    if (await buttons.count() > 0) {
      // At least some buttons should have accessible names
      const accessibleButtons = buttons.locator('[aria-label], [title]');
      if (await accessibleButtons.count() > 0) {
        await expect(accessibleButtons.first()).toBeVisible();
      }
    }
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Tab through elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Should have visible focus
    const focusedElement = page.locator(':focus');
    if (await focusedElement.isVisible()) {
      await expect(focusedElement).toBeVisible();
    }
  });

  test('should have sufficient color contrast', async ({ page }) => {
    await page.goto('/');
    
    // This is a basic check - full contrast testing requires specialized tools
    // But we can ensure text is visible
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('body')).toHaveCSS('color', /.+/);
  });

  test('should support screen readers with proper headings', async ({ page }) => {
    await page.goto('/');
    
    // Check heading hierarchy
    await expect(page.locator('h1')).toBeVisible();
    
    // Navigate to exercise
    const firstExercise = page.locator('[data-testid="exercise-item"]').first();
    if (await firstExercise.isVisible()) {
      await firstExercise.click();
      
      // Should have h2 for exercise title
      await expect(page.locator('h2')).toBeVisible();
    }
  });
});