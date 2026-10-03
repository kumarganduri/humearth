import { expect, test } from '@playwright/test';

// /2030 (experiences E5): you choose the grids and the efficiency; the model is rates.ts simulate2030.

test('with JavaScript off: the starting point and the one-grid table, sliders disabled', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto('/2030');
  await expect(page.locator('#s-out .v.c')).toContainText('449');
  await expect(page.locator('.each tbody tr')).toHaveCount(5);
  await expect(page.locator('#s-world')).toBeDisabled();
  await ctx.close();
});

test('moving to clean power and full efficiency cuts emissions below 2024; Start again restores', async ({ page }) => {
  await page.goto('/2030');
  await expect(page.locator('#s-eff')).toBeEnabled();
  await expect(page.locator('#s-verdict')).toHaveText("Emissions 2.5 times 2024's. Where data centres plug in matters as much as how much they use.");
  await page.locator('#s-world').fill('0');
  await page.locator('#s-clean').fill('100');
  await page.locator('#s-eff').fill('100');
  await expect(page.locator('#s-cleanv')).toHaveText('100%');
  await expect(page.locator('#s-effv')).toHaveText('100%');
  await expect(page.locator('#s-verdict')).toHaveText(/^You cut emissions to \d+% of 2024's/);
  await expect(page.locator('#s-out')).toContainText('your efficiency saves');
  await expect // the stack animates its widths
    .poll(() => page.locator('.stack .g-clean').evaluate((e) => e.getBoundingClientRect().width / e.parentElement!.getBoundingClientRect().width))
    .toBeGreaterThan(0.95);
  await page.click('#s-reset');
  await expect(page.locator('#s-worldv')).toHaveText('100%');
  await expect(page.locator('#s-out .v.c')).toContainText('449');
});

test('every slider at zero falls back to an even split instead of breaking', async ({ page }) => {
  await page.goto('/2030');
  await expect(page.locator('#s-eff')).toBeEnabled();
  await page.locator('#s-world').fill('0');
  await expect(page.locator('#s-indiav')).toHaveText('20%');
  await expect(page.locator('#s-out .v.c')).not.toContainText('NaN');
});

for (const width of [320, 390]) {
  test(`/2030 fits a ${width}px phone with no sideways scroll`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/2030');
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  });
}
