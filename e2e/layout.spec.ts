import { expect, test } from '@playwright/test';

// Regressions found by /qa on 2026-10-03 (report: .gstack/qa-reports/qa-report-localhost-2026-10-03.md).

// Regression: ISSUE-002 — How We Know tables were wider than a phone, clipping the source quotes.
for (const width of [320, 390]) {
  test(`How We Know: every table fits the screen on a ${width}px phone`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/how-we-know.html');
    const tables = await page.$$eval('.table-wrap', (ws) => ws.map((w) => w.querySelector('table')!.scrollWidth - w.clientWidth));
    expect(tables.length).toBeGreaterThan(0);
    for (const extra of tables) expect(extra).toBeLessThanOrEqual(1);
  });
}

// Regression: ISSUE-003 — How We Know showed the wordmark as a plain underlined link.
test('How We Know: the wordmark looks like the app, not a plain link', async ({ page }) => {
  await page.goto('/how-we-know.html');
  const w = page.locator('.wordmark');
  await expect(w).toHaveCSS('text-decoration-line', 'none');
  await expect(w).toHaveCSS('font-family', /Instrument Serif/); // DESIGN.md v2 display face
});

// ui-ux-pro-max 'progressive-disclosure': every number's sources fold away on phones, stay open on desktop.
test('How We Know on a phone: sources start folded and open with one tap', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/how-we-know.html');
  const first = page.locator('details.src-fold').first();
  await expect(first).not.toHaveAttribute('open');
  await expect(first.locator('summary')).toHaveText(/^\d+ sources?/);
  await expect(first.locator('.sources')).toBeHidden();
  await first.locator('summary').click();
  await expect(first.locator('.sources')).toBeVisible();
  expect((await first.locator('summary').boundingBox())!.height).toBeGreaterThanOrEqual(44);
});

test('How We Know on desktop: every source is shown, no fold toggles', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/how-we-know.html');
  expect(await page.locator('details.src-fold:not([open])').count()).toBe(0);
  await expect(page.locator('details.src-fold summary').first()).toBeHidden();
  await expect(page.locator('.sources').first()).toBeVisible();
});

test('How We Know on a phone with scripts off: every source is shown (nothing becomes unreachable)', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto('/how-we-know.html');
  expect(await page.locator('details.src-fold:not([open])').count()).toBe(0);
  await ctx.close();
});

test('How We Know on a phone: the two-line header scrolls away; on desktop it stays', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/how-we-know.html');
  await expect(page.locator('.nav-read')).toHaveCSS('position', 'static');
  await page.evaluate(() => scrollTo(0, 1500));
  expect((await page.locator('.nav-read').boundingBox())!.y).toBeLessThan(0);
  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(page.locator('.nav-read')).toHaveCSS('position', 'sticky');
});
