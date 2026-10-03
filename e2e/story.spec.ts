import { expect, test } from '@playwright/test';

test('the story sections are on the page, in order, with their badges', async ({ page }) => {
  await page.goto('/');
  const order = await page.locator('main h2').allTextContents();
  expect(order).toEqual(["Where it's heading", 'Where the electricity goes', 'What it does to the world', 'Your part']);
  await expect(page.locator('.badge.m')).toHaveCount(3);
  await expect(page.locator('.split')).toHaveAttribute('aria-label', /AI's part: 26.5% to 38%/);
  await expect(page.locator('.growth')).toHaveAttribute('aria-label', /AI-focused data centres about 50%, all data centres about 16.9%/);
});
