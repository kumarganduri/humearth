import { expect, test } from '@playwright/test';

// /live (experiences E4): counters tick at the middle rate; the per-second ranges are always on the page.

const num = (s: string | null) => Number((s ?? '').replace(/,/g, ''));

test('with JavaScript off: the per-second figures and their ranges, no frozen counters', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto('/live');
  await expect(page.locator('.per-sec li')).toHaveCount(3);
  await expect(page.locator('.per-sec')).toContainText('4.92 MWh');
  await expect(page.locator('#board')).toBeHidden();
  await expect(page.locator('#since')).toBeHidden();
  await ctx.close();
});

test('counters tick up while you watch, and the pool fills', async ({ page }) => {
  await page.goto('/live');
  await expect(page.locator('#board')).toBeVisible();
  await page.waitForTimeout(1200);
  const w1 = num(await page.locator('#l-w').textContent());
  await page.waitForTimeout(1000);
  const w2 = num(await page.locator('#l-w').textContent());
  // About 12,500 litres a second at the middle rate.
  expect(w2 - w1).toBeGreaterThan(8_000);
  expect(w2 - w1).toBeLessThan(20_000);
  const h = await page.locator('#pool-fill').evaluate((el) => el.getBoundingClientRect().height);
  expect(h).toBeGreaterThan(0);
});

test('since midnight: a far bigger total, the heading says so, pools are counted', async ({ page }) => {
  await page.clock.setFixedTime(new Date(2026, 9, 3, 6, 0, 0)); // 6 am local: six hours of AI
  await page.goto('/live');
  await expect(page.locator('#board')).toBeVisible();
  await page.click('[data-since="midnight"]');
  await expect(page.locator('[data-since="midnight"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('h1')).toHaveText('Since midnight today, AI around the world has used:');
  await expect(page.locator('#l-eu')).toHaveText('MWh');
  // 6 h x 4.92 MWh/s = about 106,000 MWh
  expect(num(await page.locator('#l-e').textContent())).toBeGreaterThan(100_000);
  await expect(page.locator('#l-pools')).toHaveText(/^1\d\d Olympic pools filled$/);
});

for (const width of [320, 390]) {
  test(`/live fits a ${width}px phone with no sideways scroll`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.clock.setFixedTime(new Date(2026, 9, 3, 23, 59, 0)); // the biggest numbers of the day
    await page.goto('/live');
    await page.click('[data-since="midnight"]');
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  });
}
