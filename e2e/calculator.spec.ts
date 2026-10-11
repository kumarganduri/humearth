import { expect, test } from '@playwright/test';

// "Your part" (eng review D8): sliders recompute the week; ranges throughout.
const q = '#u-questionsPerDay', p = '#u-picturesPerWeek', v = '#u-videosPerWeek';

test('the default week is shown before JS; sliders wake up and recompute', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator(v)).toBeEnabled({ timeout: 10_000 });
  await expect(page.locator('#calc-say')).toContainText('Your videos: 90 Wh');
  await page.locator(v).fill('0');
  await expect(page.locator('#v-videosPerWeek')).toHaveText('0');
  await expect(page.locator('#calc-say')).not.toContainText('Your videos');
  await expect(page.locator('#calc-out [data-ch="energy"]')).toContainText(' · ');
});

test('an empty week says so, and the maximum week switches to kWh', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator(q)).toBeEnabled({ timeout: 10_000 });
  for (const s of [q, p, v]) await page.locator(s).fill('0');
  await expect(page.locator('#calc-say')).toHaveText('No AI this week, so nothing to add up.');
  await expect(page.locator('#calc-out [data-ch="energy"]')).toContainText('0 Wh');
  await page.locator(q).fill('100');
  await page.locator(p).fill('40');
  await page.locator(v).fill('10');
  await expect(page.locator('#calc-out [data-ch="energy"]')).toContainText('kWh');
});

test('keyboard: arrow keys change a slider and the sentence is announced (aria-live)', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator(v)).toBeEnabled({ timeout: 10_000 });
  await page.locator(v).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#v-videosPerWeek')).toHaveText('2');
  await expect(page.locator('#calc-say')).toContainText('Your videos: 180 Wh');
  await expect(page.locator('#calc-say')).toHaveAttribute('aria-live', 'polite');
});

test('"What actually reduces it" ranks your own week and follows the sliders', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#u-videosPerWeek')).toBeEnabled();
  await expect(page.locator('#cuts .cut').first()).toHaveAttribute('data-key', 'videos'); // default: 1 video is the biggest saving
  await page.locator('#u-videosPerWeek').fill('0');
  await expect(page.locator('#cuts .cut[data-key="videos"]')).toHaveClass(/none/);
  await expect(page.locator('#cuts .cut[data-key="videos"]')).toContainText("You don't make any videos");
  await page.locator('#u-picturesPerWeek').fill('40');
  await expect(page.locator('#cuts .cut').first()).toHaveAttribute('data-key', 'pictures'); // 20 fewer pictures now beats the rest
  const w = await page.locator('#cuts .cut').first().locator('.cut-fill').evaluate((e) => e.getBoundingClientRect().width / e.parentElement!.getBoundingClientRect().width);
  expect(w).toBeGreaterThan(0.95);
});
