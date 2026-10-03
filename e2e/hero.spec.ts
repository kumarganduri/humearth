import { expect, test } from '@playwright/test';

// The first screen (eng review D4, stage 1a plan "Tests").

const slider = '#slider';
const ready = async (page: import('@playwright/test').Page) => {
  await page.goto('/');
  await expect(page.locator(slider)).toBeEnabled({ timeout: 10_000 });
};

test('with JavaScript off: headline, today\'s figure and a table of published years are all there', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('as much electricity as a country');
  await expect(page.locator('#reading .mid')).toHaveText('485');
  await expect(page.locator('table.static')).toBeVisible();
  await expect(page.locator('table.static')).toContainText('2035 (forecast)');
  await expect(page.locator(slider)).toBeDisabled();
  await ctx.close();
});

test('opens at the latest measured year with the slider awake', async ({ page }) => {
  await ready(page);
  await expect(page.locator('#year')).toHaveText('2025');
  await expect(page.locator(slider)).toHaveAttribute('aria-valuetext', /^2025: about 485 terawatt-hours a year; single published estimate/);
  await expect(page.locator('.row.dc')).toHaveClass(/measured/);
  await expect(page.locator('.row.dc .ai')).toBeVisible();
});

test('dragging the slider updates the reading, caption, race and what screen readers hear', async ({ page }) => {
  await ready(page);
  await page.locator(slider).fill('2030');
  await expect(page.locator('#year')).toHaveText('2030');
  await expect(page.locator('#reading .range-cap')).toHaveText('2030 · published forecast (IEA)');
  await expect(page.locator(slider)).toHaveAttribute('aria-valuetext', /^2030: about 950 terawatt-hours a year, between 593 and 1,093; published forecast; \d+ of 15 countries passed$/);
  await expect(page.locator('.row.dc')).toHaveClass(/forecast/);
  await expect(page.locator('.row.dc .band')).toHaveCount(1);
  await expect(page.locator('.row.dc .ai')).toHaveCount(0); // the AI share is a today-only figure
  // In 2030 data centres sit between Japan and Canada.
  const order = await page.locator('.race li .name').allTextContents();
  expect(order.indexOf('Japan')).toBeLessThan(order.indexOf('Data centres'));
  expect(order.indexOf('Data centres')).toBeLessThan(order.indexOf('Canada'));
});

test('arrow keys step one year at a time', async ({ page }) => {
  await ready(page);
  await page.locator(slider).focus();
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('#year')).toHaveText('2024');
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('#year')).toHaveText('2023');
  await expect(page.locator('#reading .range-cap')).toHaveText('2023 · calculated from the published growth rate');
  await expect(page.locator('.row.dc')).toHaveClass(/calculated/);
});

test('Play runs 2017 to 2035 and Pause stops it', async ({ page }) => {
  await ready(page);
  await page.click('#play');
  await expect(page.locator('#play')).toHaveText('Pause');
  await expect(page.locator('#year')).toHaveText(/^20(1[89]|2\d)$/, { timeout: 3_000 });
  await page.click('#play');
  await expect(page.locator('#play')).toHaveText('Play 2017 to 2035');
  const paused = await page.locator('#year').textContent();
  await page.waitForTimeout(900);
  await expect(page.locator('#year')).toHaveText(paused!);
  await page.click('#play'); // resume, then let it finish
  await expect(page.locator('#year')).toHaveText('2035', { timeout: 15_000 });
  await expect(page.locator('#play')).toHaveText('Play 2017 to 2035');
});

test('reduced motion: Play jumps straight to 2035, no animation', async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await ready(page);
  await page.click('#play');
  await expect(page.locator('#year')).toHaveText('2035');
  await expect(page.locator('#play')).toHaveText('Play 2017 to 2035');
  await ctx.close();
});

test('if the data fails to load, the prebuilt hero stays and the slider says why it is off', async ({ page }) => {
  await page.route('**/data/series.json', (r) => r.fulfill({ status: 404, body: '' }));
  await page.goto('/');
  await expect(page.locator('#slider-note')).toBeVisible();
  await expect(page.locator('#slider-note')).toContainText("couldn't load");
  await expect(page.locator(slider)).toBeDisabled();
  await expect(page.locator('#reading .mid')).toHaveText('485');
  await expect(page.locator('.race li')).toHaveCount(8);
});
