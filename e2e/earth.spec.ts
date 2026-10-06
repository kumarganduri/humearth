import { expect, test } from '@playwright/test';

// The Earth home (stage 1a experiences, E2): the globe, the passed list and the race all follow one year.

const ready = async (page: import('@playwright/test').Page) => {
  await page.goto('/');
  await expect(page.locator('#slider')).toBeEnabled({ timeout: 10_000 });
  await expect(page.locator('#globe canvas')).toHaveCount(1, { timeout: 10_000 });
};
const countPassed = (page: import('@playwright/test').Page) => page.locator('#passed li.on').count();

test('with JavaScript off: no globe, but the list still says which countries are passed', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto('/');
  await expect(page.locator('#globe canvas')).toHaveCount(0);
  await expect(page.locator('#passed li')).toHaveCount(15);
  await expect(page.locator('#passed li[data-key="France"]')).toHaveClass('on');
  await expect(page.locator('#passed-n')).toHaveText('8');
  await ctx.close();
});

test('the globe draws: a sized canvas with lit pixels in the amber of the data-centre colour', async ({ page }) => {
  await ready(page);
  const box = (await page.locator('#globe canvas').boundingBox())!;
  expect(box.width).toBeGreaterThan(250);
  expect(box.height).toBeGreaterThan(250);
  // Sample a 96x96 copy, not the full canvas (millions of pixels at phone DPR): reading the whole buffer on
  // every poll starved CI's software renderer, timing this test out and stalling the browser for others.
  await expect
    .poll(
      () =>
        page.locator('#globe canvas').evaluate((c: HTMLCanvasElement) => {
          const small = document.createElement('canvas');
          small.width = small.height = 96;
          const ctx = small.getContext('2d')!;
          ctx.drawImage(c, 0, 0, 96, 96);
          const px = ctx.getImageData(0, 0, 96, 96).data;
          let amber = 0;
          for (let i = 0; i < px.length; i += 4) if (px[i]! > 160 && px[i + 1]! > 90 && px[i + 1]! < 200 && px[i + 2]! < 110) amber++;
          return amber;
        }),
      { timeout: 20_000, intervals: [250, 500, 1000] },
    )
    .toBeGreaterThan(8);
});

test('moving the year lights more countries, updates the list, the phone line and the race heading', async ({ page }) => {
  await ready(page);
  expect(await countPassed(page)).toBe(8);
  await page.locator('#slider').fill('2035');
  await expect(page.locator('#passed-n')).toHaveText(String(await countPassed(page)));
  expect(await countPassed(page)).toBeGreaterThan(8);
  await expect(page.locator('#passed li[data-key="Japan"]')).toHaveClass('on calc'); // passed in a forecast year: dim
  await expect(page.locator('#side-year')).toHaveText('2035');
  await expect(page.locator('#passed-short')).toContainText(/^Passed \d+ of 15 countries/);
  await page.locator('#slider').fill('2017');
  await expect(page.locator('#passed li[data-key="France"]')).not.toHaveClass(/on/);
});

test('tapping a country explains it; dragging turns the globe and hides the note', async ({ page }) => {
  await ready(page);
  const canvas = page.locator('#globe canvas');
  const box = (await canvas.boundingBox())!;
  // Tap points across the globe until one lands on a country (the globe turns, so don't hard-code one).
  let shown = false;
  for (let i = 0; i < 25 && !shown; i++) {
    const a = (i / 25) * Math.PI * 2;
    const r = Math.min(box.width, box.height) * 0.18 * ((i % 3) + 1) / 3;
    await canvas.click({ position: { x: box.width * (page.viewportSize()!.width >= 860 ? 0.64 : 0.5) + Math.cos(a) * r, y: box.height / 2 + Math.sin(a) * r } });
    shown = await page.locator('#tip').isVisible();
  }
  expect(shown).toBe(true);
  await expect(page.locator('#tip')).toContainText(/(uses [\d,]+ TWh|not in Hum's comparison set)/);
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx + 80, cy, { steps: 6 });
  await page.mouse.up();
  await expect(page.locator('#tip')).toBeHidden();
});

test('if the map fails to load, the page still works without the globe', async ({ page }) => {
  await page.route('**/data/world.json', (r) => r.fulfill({ status: 500, body: '' }));
  await page.goto('/');
  await expect(page.locator('#slider')).toBeEnabled({ timeout: 10_000 });
  await page.locator('#slider').fill('2030');
  await expect(page.locator('#side-year')).toHaveText('2030');
  await expect(page.locator('#globe canvas')).toHaveCount(0);
});
