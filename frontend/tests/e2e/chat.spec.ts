import { test, expect } from '@playwright/test';

test.describe('Rememory Chat Flow', () => {
  test('displays countdown and closure messaging placeholders', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Rememory/);
    // Placeholder: assert login redirect
    await expect(page.getByText(/implement login screen/i)).toBeVisible();
  });
});

