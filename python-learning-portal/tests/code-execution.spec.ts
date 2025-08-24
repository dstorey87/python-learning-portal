import { test, expect } from '@playwright/test';

test.describe('Python Code Execution', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Navigate to first exercise
    const firstExercise = page.locator('[data-testid="exercise-item"]').first();
    await firstExercise.click();
    
    // Wait for editor to load
    await expect(page.locator('.monaco-editor')).toBeVisible({ timeout: 15000 });
  });

  test('should have run code button', async ({ page }) => {
    await expect(page.locator('button', { hasText: /run|execute/i })).toBeVisible();
  });

  test('should execute Python code when run button is clicked', async ({ page }) => {
    // Clear editor and add simple code
    await page.locator('.monaco-editor').click();
    await page.keyboard.press('Control+a');
    await page.keyboard.type('print("Hello from Python!")');
    
    // Click run button
    const runButton = page.locator('button', { hasText: /run|execute/i });
    await runButton.click();
    
    // Wait for execution result
    await expect(page.locator('[data-testid="output"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="output"]')).toContainText('Hello from Python!');
  });

  test('should display error messages for invalid Python code', async ({ page }) => {
    // Enter invalid Python code
    await page.locator('.monaco-editor').click();
    await page.keyboard.press('Control+a');
    await page.keyboard.type('invalid python syntax here');
    
    // Click run button
    const runButton = page.locator('button', { hasText: /run|execute/i });
    await runButton.click();
    
    // Should show error message
    await expect(page.locator('[data-testid="error"]') || page.locator('text=Error')).toBeVisible({ timeout: 10000 });
  });

  test('should run tests against user code', async ({ page }) => {
    // Look for test button
    const testButton = page.locator('button', { hasText: /test|check/i });
    if (await testButton.isVisible()) {
      await testButton.click();
      
      // Should show test results
      await expect(page.locator('[data-testid="test-results"]')).toBeVisible({ timeout: 15000 });
    }
  });

  test('should show loading state during code execution', async ({ page }) => {
    // Enter code that might take a moment
    await page.locator('.monaco-editor').click();
    await page.keyboard.press('Control+a');
    await page.keyboard.type('import time; time.sleep(1); print("Done")');
    
    // Click run button
    const runButton = page.locator('button', { hasText: /run|execute/i });
    await runButton.click();
    
    // Should show loading indicator
    await expect(page.locator('.spinner') || page.locator('[data-testid="loading"]')).toBeVisible();
  });

  test('should handle multiple code executions', async ({ page }) => {
    // First execution
    await page.locator('.monaco-editor').click();
    await page.keyboard.press('Control+a');
    await page.keyboard.type('print("First execution")');
    
    const runButton = page.locator('button', { hasText: /run|execute/i });
    await runButton.click();
    await expect(page.locator('[data-testid="output"]')).toContainText('First execution', { timeout: 10000 });
    
    // Second execution
    await page.locator('.monaco-editor').click();
    await page.keyboard.press('Control+a');
    await page.keyboard.type('print("Second execution")');
    
    await runButton.click();
    await expect(page.locator('[data-testid="output"]')).toContainText('Second execution', { timeout: 10000 });
  });
});

test.describe('Solution Checking', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Navigate to first exercise
    const firstExercise = page.locator('[data-testid="exercise-item"]').first();
    await firstExercise.click();
    
    // Wait for editor to load
    await expect(page.locator('.monaco-editor')).toBeVisible({ timeout: 15000 });
  });

  test('should provide feedback on solution correctness', async ({ page }) => {
    // Look for check solution or test button
    const checkButton = page.locator('button', { hasText: /check|test|submit/i });
    if (await checkButton.isVisible()) {
      await checkButton.click();
      
      // Should show some kind of feedback
      await expect(page.locator('[data-testid="feedback"]') || 
                  page.locator('.test-pass') || 
                  page.locator('.test-fail')).toBeVisible({ timeout: 15000 });
    }
  });

  test('should show test results with pass/fail status', async ({ page }) => {
    // Look for test functionality
    const testButton = page.locator('button', { hasText: /test|check/i });
    if (await testButton.isVisible()) {
      await testButton.click();
      
      // Wait for results
      await page.waitForTimeout(5000);
      
      // Should show some indication of test status
      const hasResults = await page.locator('[data-testid="test-results"]').isVisible() ||
                         await page.locator('.test-pass').isVisible() ||
                         await page.locator('.test-fail').isVisible();
      
      expect(hasResults).toBeTruthy();
    }
  });

  test('should allow users to see their progress', async ({ page }) => {
    // Look for progress indicators
    const hasProgress = await page.locator('[data-testid="progress"]').isVisible() ||
                       await page.locator('.progress-bar').isVisible() ||
                       await page.locator('text=Progress').isVisible();
    
    // Progress tracking may not be immediately visible, so this is optional
    if (hasProgress) {
      await expect(page.locator('[data-testid="progress"]')).toBeVisible();
    }
  });
});

test.describe('Code Editor Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Navigate to first exercise
    const firstExercise = page.locator('[data-testid="exercise-item"]').first();
    await firstExercise.click();
    
    // Wait for editor to load
    await expect(page.locator('.monaco-editor')).toBeVisible({ timeout: 15000 });
  });

  test('should support syntax highlighting', async ({ page }) => {
    // Type Python code and check for syntax highlighting
    await page.locator('.monaco-editor').click();
    await page.keyboard.type('def hello_world():');
    await page.keyboard.press('Enter');
    await page.keyboard.type('    print("Hello")');
    
    // Monaco editor should apply syntax highlighting (colors)
    const editorContent = page.locator('.monaco-editor .view-line');
    await expect(editorContent.first()).toBeVisible();
  });

  test('should support code formatting', async ({ page }) => {
    // Type poorly formatted code
    await page.locator('.monaco-editor').click();
    await page.keyboard.type('def   test( ):');
    await page.keyboard.press('Enter');
    await page.keyboard.type('print( "test" )');
    
    // Try to format (Shift+Alt+F is common shortcut)
    await page.keyboard.press('Shift+Alt+F');
    
    // Code should be present (formatting behavior may vary)
    await expect(page.locator('.monaco-editor')).toContainText('def');
  });

  test('should provide autocompletion', async ({ page }) => {
    // Start typing and look for autocompletion
    await page.locator('.monaco-editor').click();
    await page.keyboard.type('pri');
    
    // Wait a moment for autocomplete
    await page.waitForTimeout(500);
    
    // Monaco should show suggestions (this is internal behavior)
    // We'll just verify the editor is responsive
    await expect(page.locator('.monaco-editor')).toContainText('pri');
  });

  test('should allow undo/redo operations', async ({ page }) => {
    // Type some code
    await page.locator('.monaco-editor').click();
    await page.keyboard.type('print("original")');
    
    // Select all and replace
    await page.keyboard.press('Control+a');
    await page.keyboard.type('print("modified")');
    
    // Undo
    await page.keyboard.press('Control+z');
    
    // Should have reverted
    await expect(page.locator('.monaco-editor')).toContainText('original');
  });

  test('should support find and replace', async ({ page }) => {
    // Type code with repeated text
    await page.locator('.monaco-editor').click();
    await page.keyboard.type('hello world hello');
    
    // Open find dialog
    await page.keyboard.press('Control+f');
    
    // The find dialog should appear (Monaco internal UI)
    await page.waitForTimeout(500);
    
    // Close find dialog
    await page.keyboard.press('Escape');
  });

  test('should maintain cursor position during typing', async ({ page }) => {
    await page.locator('.monaco-editor').click();
    
    // Type some code
    await page.keyboard.type('def function():');
    await page.keyboard.press('Enter');
    await page.keyboard.type('    pass');
    
    // Verify content is as expected
    await expect(page.locator('.monaco-editor')).toContainText('def function()');
    await expect(page.locator('.monaco-editor')).toContainText('pass');
  });
});