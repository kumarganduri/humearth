import { expect, test, type Page } from '@playwright/test';
import { landInWorld, withSavedWorld, world } from './helpers';

// Regressions found by /qa on 2026-10-03 (report: .gstack/qa-reports/qa-report-localhost-2026-10-03.md).

/** Pairs of visible boxes (by selector) that overlap by more than a couple of pixels. */
const overlaps = (page: Page, selectors: string[]) =>
  page.evaluate((sels) => {
    const boxes = sels
      .map((s) => ({ s, el: document.querySelector<HTMLElement>(s) }))
      .filter(({ el }) => el && !el.closest('[hidden]') && el.getBoundingClientRect().height > 0)
      .map(({ s, el }) => ({ s, b: el!.getBoundingClientRect() }));
    const hits: string[] = [];
    for (let i = 0; i < boxes.length; i++)
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i]!.b, c = boxes[j]!.b;
        const x = Math.min(a.right, c.right) - Math.max(a.left, c.left);
        const y = Math.min(a.bottom, c.bottom) - Math.max(a.top, c.top);
        if (x > 2 && y > 2) hits.push(`${boxes[i]!.s} x ${boxes[j]!.s}`);
      }
    return hits;
  }, selectors);

// Regression: ISSUE-001 — on phones the greener-choice buttons covered the world's sentence.
test('world: the sentence, the choices and the corner buttons never overlap', async ({ page }) => {
  await withSavedWorld(page, world({ buckets: { text: 3, images: 2, videos: 2 } }));
  await page.click('#primary');
  await landInWorld(page);
  const parts = ['.sentence-wrap', '#choices', '.corner', '.glyphs'];
  expect(await overlaps(page, parts)).toEqual([]);
  for (const c of await page.locator('#choices .choice').all()) await c.click(); // "Trying a greener week" adds a line
  expect(await overlaps(page, parts)).toEqual([]);
});

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
  await expect(w).toHaveCSS('font-family', /Grandstander/);
  await expect(w.locator('.dot')).toBeVisible();
});
