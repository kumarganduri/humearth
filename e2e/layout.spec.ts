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
