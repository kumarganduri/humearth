import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { parseNeso } from '../src/livegrid/grid';

// Stage 3 on /live: "Right now on the grid". The test server has no Cloudflare functions, so /api/grid is
// answered with a real NESO response (fixture) plus Virginia "not connected yet".
const london = parseNeso(JSON.parse(readFileSync('src/livegrid/fixtures/neso-london.json', 'utf8')));
const body = {
  fetchedAt: '2026-10-12T15:42:00Z',
  regions: [
    { key: 'london', hub: 'London', kind: 'estimate', source: { name: 'NESO', url: 'https://carbonintensity.org.uk/', licence: 'CC BY 4.0' }, points: london },
    { key: 'virginia', hub: 'Northern Virginia', kind: 'calculated', source: { name: 'EIA', url: 'https://www.eia.gov/electricity/gridmonitor/' }, points: [], unavailable: 'not connected yet' },
  ],
};

test('London shows its live figure, the answer in mg and a 24 h line; Virginia says it is being connected', async ({ page }) => {
  await page.route('**/api/grid', (r) => r.fulfill({ json: body }));
  await page.goto('/live');
  const l = page.locator('.g-card[data-key="london"]');
  await expect(l.locator('.g-big')).toHaveText(String(london[london.length - 1]!.g));
  await expect(l.locator('.spark')).toBeVisible();
  await expect(l).toContainText('mg of CO2');
  await expect(page.locator('.g-card[data-key="virginia"]')).toContainText('being connected');
});

test('if /api/grid fails, the section says so instead of showing zeros', async ({ page }) => {
  await page.route('**/api/grid', (r) => r.fulfill({ status: 502, body: '' }));
  await page.goto('/live');
  await expect(page.locator('#grid-now')).toContainText("couldn't load just now");
  await expect(page.locator('.g-big')).toHaveCount(0);
});

test('the cards keep their size when the data lands (no layout shift)', async ({ page }) => {
  let release!: () => void;
  const gate = new Promise<void>((r) => (release = r));
  await page.route('**/api/grid', async (r) => (await gate, r.fulfill({ json: body })));
  await page.goto('/live');
  const before = await page.locator('#grid-now').boundingBox();
  release();
  await expect(page.locator('.g-big')).toHaveCount(1);
  const after = await page.locator('#grid-now').boundingBox();
  expect(Math.abs(after!.height - before!.height)).toBeLessThanOrEqual(2);
});
