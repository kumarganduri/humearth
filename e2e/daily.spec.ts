import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { buildPool, dayNumber, questionFor } from '../src/daily/pool';

const r = (p: string) => JSON.parse(readFileSync(p, 'utf8'));
const pool = buildPool({ series: r('public/data/series.json'), countries: r('public/data/countries.json'), constants: r('public/data/constants.json'), grids: r('public/data/grids.json'), hubs: r('public/data/hubs.json') });

// Hum Daily (stage 4). The clock is fixed so the day (and so the question) is the same on every run.
const DAY3 = new Date(2026, 9, 14, 10, 0, 0); // #3 in the visitor's own calendar

test('today: a question, two answers; answering reveals both figures, the source and your streak', async ({ page }) => {
  await page.clock.setFixedTime(DAY3);
  await page.goto('/daily');
  await expect(page.locator('#dq-n')).toHaveText(' #3');
  await expect(page.locator('.dq-ask')).toContainText('more or less?');
  await page.click('[data-pick="more"]');
  await expect(page.locator('.dq-verdict')).toContainText(/^. (Right|Not quite)\. It's (more|less)\.$/);
  await expect(page.locator('.dq-reveal')).not.toBeEmpty();
  await expect(page.locator('.dq-src a')).toHaveAttribute('href', /^\/how-we-know\.html#/);
  await expect(page.locator('.dq-stats')).toContainText('1 played');
});

test('your answer is kept on this device: coming back the same day shows the result, not a second try', async ({ page }) => {
  await page.clock.setFixedTime(DAY3);
  await page.goto('/daily');
  await page.click('[data-pick="less"]');
  const verdict = await page.locator('.dq-verdict').textContent();
  await page.reload();
  await expect(page.locator('.dq-verdict')).toHaveText(verdict!);
  await expect(page.locator('[data-pick]')).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('hum.daily'))).toContain('"lastDay":3');
});

test('right two days running is a streak of 2; the share text has no spoiler', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  for (const day of [DAY3, new Date(2026, 9, 15, 10, 0, 0)]) {
    await page.clock.setFixedTime(day);
    await page.goto('/daily');
    await page.click(`[data-pick="${questionFor(dayNumber(day), pool).answer}"]`); // the same pool the page builds
    await expect(page.locator('.dq-verdict')).toContainText('Right');
  }
  await expect(page.locator('.dq-stats')).toContainText('2 in a row');
  await page.click('#dq-share');
  const copied = await page.evaluate(() => navigator.clipboard.readText()).catch(() => '');
  if (copied) expect(copied).toBe('Hum Daily #4 ✅ · 2 in a row\nhumearth.org/daily');
});

test('blocked storage (private browsing) still lets you play', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new Error('blocked'); } });
  });
  await page.clock.setFixedTime(DAY3);
  await page.goto('/daily');
  await page.click('[data-pick="more"]');
  await expect(page.locator('.dq-verdict')).toBeVisible();
});

test('with scripts off: it explains why it needs them', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto('/daily');
  await expect(page.locator('main')).toContainText('the question depends on today', { useInnerText: true }); // what's visible
  await expect(page.locator('#dq')).toBeHidden();
  await ctx.close();
});

test('two tabs: the first answer of the day stands', async ({ context }) => {
  const [a, b] = [await context.newPage(), await context.newPage()];
  for (const p of [a, b]) await p.clock.setFixedTime(DAY3);
  await a.goto('/daily');
  await b.goto('/daily');
  await a.click('[data-pick="more"]');
  const first = await a.locator('.dq-verdict').textContent();
  await b.click('[data-pick="less"]'); // too late: tab A already answered today
  await expect(b.locator('.dq-verdict')).toHaveText(first!);
});

// Regression: on days with a long question, /daily's largest text was drawn by the script after its data loaded and
// Lighthouse failed the daily rebuild (27 and 31 Oct). The day's question is now in the page as served.
test('the day’s question is in the page as served, before any script runs', async ({ request, page }) => {
  const html = await (await request.get('/daily')).text();
  expect(html).toMatch(/<div class="dq-card js-only" id="dq" data-day="\d+"[^>]*><p class="dq-a">[^<]{10,}<\/p>/);
  await page.goto('/daily');
  await expect(page.locator('[data-pick="more"]')).toBeVisible();
});
