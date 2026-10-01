import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { answerQuiz, fresh, landInWorld, withSavedWorld, world } from './helpers';

async function noSeriousViolations(page: Page) {
  const r = await new AxeBuilder({ page }).analyze();
  const bad = r.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(bad.map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(' ')).join(', ')})`)).toEqual([]);
}

test('Earth, quiz, my world and How We Know have no serious accessibility problems', async ({ page }) => {
  await fresh(page);
  await noSeriousViolations(page);
  await page.click('#primary');
  await noSeriousViolations(page);
  await answerQuiz(page, [1, 1, 0]);
  await landInWorld(page);
  await page.click('.glyph[data-channel="energy"]');
  await noSeriousViolations(page);
  await page.goto('/how-we-know.html');
  await expect(page.locator('#numbers')).toBeVisible();
  await noSeriousViolations(page);
});

test('keyboard only: make a world, open a panel, go back to Earth', async ({ page }) => {
  await fresh(page);
  await expect(page.locator('body')).toHaveAttribute('data-view', '3d', { timeout: 30_000 });
  await page.locator('#primary').focus();
  await page.keyboard.press('Enter');
  for (let i = 0; i < 3; i++) {
    await expect(page.locator('#quiz-ask')).toBeFocused(); // each new question is announced
    await page.keyboard.press('Tab'); // -> first answer
    await expect(page.locator('#quiz-picks .pick').first()).toBeFocused();
    await page.keyboard.press('Enter');
  }
  await landInWorld(page);
  await page.locator('.glyph[data-channel="co2"]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#panel-title')).toBeFocused();
  await page.keyboard.press('Escape');
  await page.locator('#back').focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Escape');
  await expect(page.locator('#earth-zone')).toBeVisible({ timeout: 10_000 });
});

test('How We Know shows every section', async ({ page }) => {
  await withSavedWorld(page, world(), '/how-we-know.html');
  for (const id of ['health', 'numbers', 'buildings', 'changes', 'privacy']) await expect(page.locator(`#${id}`)).toBeVisible();
  await expect(page.locator('#content')).toContainText("Your world's health is a scale we designed");
});
