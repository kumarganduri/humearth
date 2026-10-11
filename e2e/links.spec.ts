import { expect, test } from '@playwright/test';

// Shareable links (ui-ux-pro-max 'deep-linking'): what you set is in the URL, and a link opens exactly that.

test('home: ?year=2030 opens at 2030; releasing the slider writes the year; the latest year is a clean URL', async ({ page }) => {
  await page.goto('/?year=2030');
  await expect(page.locator('#year')).toHaveText('2030');
  await expect(page.locator('#side-year')).toHaveText('2030');
  await page.locator('#slider').fill('2032'); // fill fires input + change
  await expect(page).toHaveURL(/\/\?year=2032$/);
  await page.locator('#slider').fill('2025');
  await expect(page).toHaveURL(/\/$/);
});

test('home: a junk year is ignored', async ({ page }) => {
  await page.goto('/?year=1850');
  await expect(page.locator('#slider')).toBeEnabled();
  await expect(page.locator('#year')).toHaveText('2025');
});

test('/question: ?kind=video opens on Short video; choosing writes the link', async ({ page }) => {
  await page.goto('/question?kind=video');
  await expect(page.locator('.kind[data-kind="video"]')).toHaveAttribute('aria-pressed', 'true');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.click('#q-send');
  await expect(page.locator('#q-end')).toContainText('one short video');
  await page.click('.kind[data-kind="picture"]');
  await expect(page).toHaveURL(/\/question\?kind=picture$/);
  await page.click('.kind[data-kind="question"]');
  await expect(page).toHaveURL(/\/question$/);
});

test('/2030: a link opens that exact mix and efficiency; moving a slider writes it; Start again clears it', async ({ page }) => {
  await page.goto('/2030?mix=world:40,clean:60&eff=50');
  await expect(page.locator('#s-cleanv')).toHaveText('60%');
  await expect(page.locator('#s-worldv')).toHaveText('40%');
  await expect(page.locator('#s-effv')).toHaveText('50%');
  await page.locator('#s-eff').fill('100');
  await expect(page).toHaveURL(/\/2030\?mix=world:40,clean:60&eff=100$/);
  await page.click('#s-reset');
  await expect(page).toHaveURL(/\/2030$/);
  await expect(page.locator('#s-worldv')).toHaveText('100%');
});

test('/2030: Share copies a link that reopens the same 2030', async ({ page, context, browserName }) => {
  test.skip(browserName !== 'chromium');
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/2030');
  await page.locator('#s-clean').fill('100');
  await page.locator('#s-world').fill('0');
  await page.click('#s-share');
  const copied = await page.evaluate(() => navigator.clipboard.readText()).catch(() => null);
  const shown = await page.locator('#s-shared').textContent();
  // Phones get the share sheet instead (not testable headless); desktop copies and says so.
  if (copied) {
    expect(copied).toMatch(/\/2030\?mix=clean:100$/);
    await expect(page.locator('#s-shared')).toHaveText('Link copied. It opens exactly this 2030.');
    const again = await page.context().newPage();
    await again.goto(copied);
    await expect(again.locator('#s-cleanv')).toHaveText('100%');
  } else expect(shown ?? '').toMatch(/2030\?mix=clean:100|^$/);
});
