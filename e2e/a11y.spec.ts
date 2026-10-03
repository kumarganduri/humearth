import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

async function noSeriousViolations(page: Page) {
  const r = await new AxeBuilder({ page }).analyze();
  const bad = r.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(bad.map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(' ')).join(', ')})`)).toEqual([]);
}

test('home and How We Know have no serious accessibility problems', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toBeVisible();
  await noSeriousViolations(page);
  await page.goto('/how-we-know.html');
  await expect(page.locator('#numbers')).toBeVisible();
  await noSeriousViolations(page);
});

test('/question has no serious accessibility problems, before and after a trip', async ({ page }) => {
  await page.goto('/question');
  await expect(page.locator('#q-send')).toBeEnabled();
  await noSeriousViolations(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.click('#q-send');
  await expect(page.locator('#q-end')).toContainText('That was one question');
  await noSeriousViolations(page);
});

test('How We Know shows every section, including year by year and the countries', async ({ page }) => {
  await page.goto('/how-we-know.html');
  for (const id of ['numbers', 'growth', 'countries', 'buildings', 'changes', 'privacy']) await expect(page.locator(`#${id}`)).toBeVisible();
  await expect(page.locator('#content')).toContainText('How it grows, year by year');
  await expect(page.locator('#content')).not.toContainText("Your world's health"); // v1 is gone
});
