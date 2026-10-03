import { expect, test } from '@playwright/test';
import { fresh, landInWorld, withSavedWorld, world } from './helpers';

// Regressions found by /qa on 2026-10-03 (report: .gstack/qa-reports/qa-report-localhost-2026-10-03.md).

// Regression: ISSUE-004 — after Back to Earth, keyboard focus fell to the top of the page.
test('Back to Earth from a world puts keyboard focus on the main button', async ({ page }) => {
  await withSavedWorld(page, world());
  await page.click('#primary');
  await landInWorld(page);
  await page.focus('#back');
  await page.keyboard.press('Enter');
  await expect(page.locator('#primary')).toBeFocused({ timeout: 10_000 });
  await expect(page.locator('#primary')).toHaveText('Visit my world');
});

test('leaving the quiz with its back button also puts focus on the main button', async ({ page }) => {
  await fresh(page);
  await page.click('#primary');
  await page.focus('#quiz-back');
  await page.keyboard.press('Enter');
  await expect(page.locator('#primary')).toBeFocused();
});
