import { expect, test } from '@playwright/test';
import { geoOrthographic } from 'd3-geo';
import { fitGlobe, START_ROTATION } from '../src/globe/earth';

// The Earth home (stage 1a experiences, E2): the globe, the passed list and the race all follow one year.

const ready = async (page: import('@playwright/test').Page) => {
  await page.goto('/earth');
  await expect(page.locator('#slider')).toBeEnabled({ timeout: 10_000 });
  await expect(page.locator('#globe canvas')).toHaveCount(1, { timeout: 10_000 });
};
const countPassed = (page: import('@playwright/test').Page) => page.locator('#passed li.on').count();

test('with JavaScript off: no globe, but the list still says which countries are passed', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto('/earth');
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
  // Reduced motion: the globe stays at its starting rotation, so we can compute exactly where Brazil is with
  // the page's own projection and tap it (tapping fixed points on a spinning globe was luck: ocean or land).
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await ready(page);
  const canvas = page.locator('#globe canvas');
  const box = (await canvas.boundingBox())!;
  const f = fitGlobe(box.width, box.height, page.viewportSize()!.width >= 860);
  const brazil = geoOrthographic().clipAngle(90).scale(f.scale).translate([f.cx, f.cy]).rotate(START_ROTATION)([-51, -10])!;
  await canvas.click({ position: { x: brazil[0], y: brazil[1] } });
  await expect(page.locator('#tip')).toBeVisible();
  await expect(page.locator('#tip')).toContainText(/^Brazil uses [\d,]+ TWh of electricity a year/);
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
  await page.goto('/earth');
  await expect(page.locator('#slider')).toBeEnabled({ timeout: 10_000 });
  await page.locator('#slider').fill('2030');
  await expect(page.locator('#side-year')).toHaveText('2030');
  await expect(page.locator('#globe canvas')).toHaveCount(0);
  await expect(page.locator('#globe')).toBeHidden(); // no empty placeholder left behind
});

test('the globe can be stopped and turned without dragging (WCAG 2.2.2, 2.5.7)', async ({ page }) => {
  await ready(page);
  const spin = page.locator('#globe-spin');
  await expect(spin).toHaveAttribute('aria-label', 'Stop turning');
  await spin.click();
  await expect(spin).toHaveAttribute('aria-label', 'Start turning');
  const snap = () =>
    page.locator('#globe canvas').evaluate((c: HTMLCanvasElement) => {
      const d = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data;
      let h = 0;
      for (let i = 0; i < d.length; i += 97) h = (h * 31 + d[i]!) | 0;
      return h;
    });
  // The 'just passed' flash fades over 900 ms of wall-clock time; under load frames arrive late, so wait it
  // out, then compare only after the browser has really drawn new frames (two animation frames each time).
  const frames = () => page.evaluate(() => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))));
  await page.waitForTimeout(1000);
  await frames();
  const a = await snap();
  await page.waitForTimeout(800);
  await frames();
  expect(await snap()).toBe(a); // stopped means stopped
  await page.locator('#globe-east').click();
  await expect.poll(snap).not.toBe(a); // the button turned it
  await page.keyboard.press('Shift+Tab'); // keyboard reachable: focus moves back to the pause button
  await expect(spin).toBeFocused();
});

test('reduced motion: the globe starts still, and the button offers to start it', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await ready(page);
  await expect(page.locator('#globe-spin')).toHaveAttribute('aria-label', 'Start turning');
});

test('a "See the data" link under the globe takes you to the comparison below', async ({ page }) => {
  await page.goto('/earth');
  await page.click('.scroll-cue');
  await expect(page).toHaveURL(/#heading-side$/);
  await expect(page.locator('#heading-side')).toBeInViewport();
});

test('landscape phone: headline and globe share the first screen', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto('/earth');
  const g = await page.locator('#globe').boundingBox();
  const h = await page.locator('h1').boundingBox();
  expect(g!.y).toBeLessThan(390);
  expect(g!.x).toBeGreaterThan(h!.x + h!.width - 1);
});
