import { expect, test, type Page } from '@playwright/test';

// Regression: ISSUE-005 — nav links (26-30px) and "See the full story" (22px) were under DESIGN.md's 44px targets.
// Found by /qa on 2026-10-03. Report: .gstack/qa-reports/qa-report-localhost-2026-10-03.md
// Links inside running text (the ticker note, the source lists) are exempt, as WCAG 2.5.8 allows.

const tooSmall = (page: Page, scope: string) =>
  page.$$eval(`${scope} :is(button, a)`, (els) =>
    els
      .filter((e) => {
        const b = e.getBoundingClientRect();
        return b.width > 0 && !e.closest('[hidden], .ticker-note, .sources, p, li');
      })
      .map((e) => ({ name: (e.id || e.textContent!.trim()).slice(0, 30), h: Math.round(e.getBoundingClientRect().height) }))
      .filter((x) => x.h < 44),
  );

test('every standalone link on the home page is at least 44px tall', async ({ page }) => {
  await page.goto('/');
  expect(await tooSmall(page, 'body')).toEqual([]);
});

test('How We Know nav targets are at least 44px tall', async ({ page }) => {
  await page.goto('/how-we-know.html');
  expect(await tooSmall(page, '.nav')).toEqual([]);
});
