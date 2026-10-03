import { expect, test } from '@playwright/test';

// /question (experiences E3): follow one request; meters fill where each cost is paid.

test('with JavaScript off: the stations and the full table are there; no fake zero meters', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto('/question');
  await expect(page.locator('h1')).toHaveText('Follow one AI request out of your phone.');
  await expect(page.locator('.per-req tbody tr')).toHaveCount(3);
  await expect(page.locator('.per-req')).toContainText('0.34');
  await expect(page.locator('#meters')).toBeHidden();
  await expect(page.locator('#q-send')).toBeDisabled();
  await ctx.close();
});

test('Send: the dot travels, stations light, meters fill in order, then the ranges and the sentence', async ({ page }) => {
  const sent: string[] = [];
  page.on('request', (r) => sent.push(`${r.method()} ${new URL(r.url()).pathname}`));
  await page.goto('/question');
  await expect(page.locator('#q-send')).toBeEnabled();
  await page.fill('#q-text', 'a private question that must never leave the page');
  const before = sent.length;
  await page.click('#q-send');
  await expect(page.locator('#q-send')).toBeDisabled();
  await expect(page.locator('.journey:visible .st.on')).not.toHaveCount(0);
  await expect(page.locator('#q-end')).toContainText('That was one question: about 0.34 Wh', { timeout: 10_000 });
  await expect(page.locator('.journey:visible .st.on')).toHaveCount(6);
  await expect(page.locator('#trip-status')).toHaveText('Reached: Cooling water.'); // screen readers hear each station
  await expect(page.locator('#m-e')).toHaveText('0.34');
  await expect(page.locator('#m-er')).toHaveText('range 0.24 to 1.86 Wh');
  await expect(page.locator('#m-c')).not.toHaveText('0');
  await expect(page.locator('#m-w')).not.toHaveText('0');
  await expect(page.locator('#q-send')).toBeEnabled();
  expect(sent.slice(before)).toEqual([]); // the typed text is never sent anywhere
});

test('switching to a short video resets the meters and the trip reports its own figure', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' }); // reduced motion: the trip completes at once
  await page.goto('/question');
  await expect(page.locator('#q-send')).toBeEnabled();
  await page.click('#q-send');
  await expect(page.locator('#m-e')).toHaveText('0.34');
  await page.click('.kind[data-kind="video"]');
  await expect(page.locator('.kind[data-kind="video"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#m-e')).toHaveText('0');
  await expect(page.locator('#q-end')).toHaveText('');
  await page.click('#q-send');
  await expect(page.locator('#m-e')).toHaveText('90');
  await expect(page.locator('#q-end')).toContainText('one short video: about 90 Wh');
});

for (const width of [320, 390]) {
  test(`/question fits a ${width}px phone with no sideways scroll`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/question');
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
    await expect(page.locator('.journey.tall')).toBeVisible();
    await expect(page.locator('.journey.wide')).toBeHidden();
  });
}
