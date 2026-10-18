import { expect, test } from '@playwright/test';

test('the story sections are on the page, in order, with their badges', async ({ page }) => {
  await page.goto('/earth');
  const order = await page.locator('main h2').allTextContents();
  expect(order).toEqual(['Countries passed', 'Side by side in 2025', "Where it's heading", 'Where the electricity goes', 'What it does to the world', 'Your part', 'What actually reduces it']);
  await expect(page.locator('.badge.m')).toHaveCount(3);
  await expect(page.locator('.split')).toHaveAttribute('aria-label', /AI's part: 26.5% to 38%/);
  await expect(page.locator('.growth')).toHaveAttribute('aria-label', /AI-focused data centres about 50%, all data centres about 16.9%/);
});

test('EXPLAINED tiles and claims: every case shows its sources, and the exact quotes open with one tap', async ({ page }) => {
  await page.goto('/earth');
  await expect(page.locator('.badge.e')).toHaveCount(5);
  await expect(page.locator('.claims .claim')).toHaveCount(6);
  const grid = page.locator('#case-grid');
  await expect(grid.locator('.case-src a')).toHaveCount(2);
  await expect(grid.locator('blockquote').first()).toBeHidden();
  await grid.locator('.quotes summary').click();
  await expect(grid.locator('blockquote').first()).toContainText('rose to 22% in 2024 from 5% in 2015');
});
