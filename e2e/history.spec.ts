import { expect, test } from '@playwright/test';
import { code, fresh, landInWorld, withSavedWorld, world } from './helpers';

// Regression: ISSUE-006 — the phone/browser Back button left Hum from the quiz or a world.
// Found by /qa on 2026-10-03. Report: .gstack/qa-reports/qa-report-localhost-2026-10-03.md

const onEarth = async (page: import('@playwright/test').Page) => {
  await expect(page.locator('#earth-zone')).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('body')).not.toHaveClass(/landed|diving|quizzing/);
};

test('Back in the quiz goes to the previous question, then to Earth', async ({ page }) => {
  await fresh(page);
  await page.click('#primary');
  await page.locator('#quiz-picks .pick').nth(1).click();
  await expect(page.locator('#quiz-step')).toHaveText('question 2 of 3');
  await page.goBack();
  await expect(page.locator('#quiz-step')).toHaveText('question 1 of 3');
  await expect(page.locator('#quiz-picks .pick').nth(1)).toHaveAttribute('aria-pressed', 'true'); // answer kept
  await page.goBack();
  await onEarth(page);
  await expect(page).toHaveURL(/127\.0\.0\.1:4191\/$/); // still on Hum
  await expect(page.locator('#primary')).toHaveText('Make my world');
});

test('Back in a world flies home to Earth; Back on Earth then leaves Hum', async ({ page }) => {
  await page.addInitScript((c) => localStorage.setItem('hum.world', c), code(world()));
  await page.goto('about:blank');
  await page.goto('/'); // history: about:blank, Hum
  await page.click('#primary');
  await landInWorld(page);
  await page.goBack();
  await onEarth(page);
  await expect(page.locator('#primary')).toHaveText('Visit my world');
  await page.waitForTimeout(300);
  await page.goBack(); // the next Back leaves Hum as normal: no trapped history
  await expect(page).toHaveURL('about:blank');
});

test('Back to Earth with the button, then visit again: one Back still flies home', async ({ page }) => {
  await withSavedWorld(page, world());
  for (let i = 0; i < 2; i++) {
    await page.click('#primary');
    await landInWorld(page);
    await page.click('#back');
    await onEarth(page);
  }
  await page.click('#primary');
  await landInWorld(page);
  await page.goBack();
  await onEarth(page);
});

test("after making my own world from a friend's link, Back does not bring the friend's link back", async ({ page }) => {
  await fresh(page, `/#${code(world({ seed: 4242, buckets: { text: 3, images: 2, videos: 2 } }))}`);
  await page.click('#primary'); // visit the friend's world
  await landInWorld(page);
  await page.click('#make-mine');
  await expect(page.locator('#quiz')).toBeVisible({ timeout: 15_000 });
  for (const v of [1, 0, 0]) await page.locator(`#quiz-picks .pick[data-value="${v}"]`).click();
  await landInWorld(page);
  await page.goBack();
  await onEarth(page);
  await expect(page.locator('#primary')).toHaveText('Visit my world');
  await expect.poll(() => new URL(page.url()).hash).toBe('');
});
