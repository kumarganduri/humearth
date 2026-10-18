import { expect, test, type Page } from '@playwright/test';

// Regression: ISSUE-005 — nav links (26-30px) and "See the full story" (22px) were under DESIGN.md's 44px targets.
// Found by /qa on 2026-10-03. Report: .gstack/qa-reports/qa-report-localhost-2026-10-03.md
// Links inside running text (sentences, source lists, chart captions) are exempt, as WCAG 2.5.8 allows.

const tooSmall = (page: Page, scope: string) =>
  page.$$eval(`${scope} :is(button, a)`, (els) =>
    els
      .filter((e) => {
        const b = e.getBoundingClientRect();
        return b.width > 0 && !e.closest('[hidden], .sources, p, li, figcaption');
      })
      .map((e) => ({ name: (e.id || e.textContent!.trim()).slice(0, 30), h: Math.round(e.getBoundingClientRect().height) }))
      .filter((x) => x.h < 44),
  );

test('every standalone link on the home page is at least 44px tall', async ({ page }) => {
  await page.goto('/earth');
  expect(await tooSmall(page, 'body')).toEqual([]);
});

test('How We Know nav targets are at least 44px tall', async ({ page }) => {
  await page.goto('/how-we-know.html');
  expect(await tooSmall(page, '.nav')).toEqual([]);
});

test('every standalone control on /question is at least 44px tall', async ({ page }) => {
  await page.goto('/question');
  await expect(page.locator('#q-send')).toBeEnabled();
  expect(await tooSmall(page, 'body')).toEqual([]);
});

test('every standalone control on /live is at least 44px tall', async ({ page }) => {
  await page.goto('/live');
  await expect(page.locator('#board')).toBeVisible();
  expect(await tooSmall(page, 'body')).toEqual([]);
});

test('every standalone control on /2030 is at least 44px tall', async ({ page }) => {
  await page.goto('/2030');
  await expect(page.locator('#s-eff')).toBeEnabled();
  expect(await tooSmall(page, 'body')).toEqual([]);
});

test('the nav on a phone: one row of four, every link a 44px target', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto('/2030');
  const tops = await page.$$eval('.nav-links a', (as) => as.map((a) => Math.round(a.getBoundingClientRect().top)));
  expect(new Set(tops).size).toBe(1);
  expect(tops.length).toBe(4);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
});

test('every standalone control on /daily is at least 44px tall', async ({ page }) => {
  await page.goto('/daily');
  await expect(page.locator('[data-pick="more"]')).toBeVisible();
  expect(await tooSmall(page, 'body')).toEqual([]);
});

for (const path of ['/', '/q/flight', '/today', '/topics']) {
  test(`every standalone control on ${path} is at least 44px tall`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator('h1')).toBeVisible();
    expect(await tooSmall(page, 'main')).toEqual([]);
  });
}
