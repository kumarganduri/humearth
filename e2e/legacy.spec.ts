import { expect, test } from '@playwright/test';

// v1 share links ("?s=1#w1.…") and saved worlds are cleaned up quietly (eng review D5).
test('an old v1 share link opens the normal page, with the hash and stored world removed', async ({ page }) => {
  await page.goto('/earth');
  await page.evaluate(() => {
    localStorage.setItem('hum.world', 'w1.BYPm9wAAAQIA');
    localStorage.setItem('hum.sound', 'on');
  });
  await page.goto('/?s=1#w1.BYPm9wAAAQIA');
  await expect(page.locator('h1')).toBeVisible();
  await expect.poll(() => page.url()).toMatch(/\/earth$/);
  expect(await page.evaluate(() => [localStorage.getItem('hum.world'), localStorage.getItem('hum.sound')])).toEqual([null, null]);
});

// Regression: reading window.localStorage throws where the browser blocks site storage (e.g. cookies blocked);
// that stopped every page's script before it started. Each page must still come to life.
for (const [path, ready] of [['/', '#card .choices button:first-child'], ['/earth', '#slider'], ['/question', '#q-send'], ['/live', '#l-hold'], ['/2030', '#s-eff']] as const) {
  test(`${path} still works when the browser blocks site storage`, async ({ page }) => {
    await page.addInitScript(() => Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('blocked', 'SecurityError'); } }));
    await page.goto(path);
    await expect(page.locator(ready)).toBeEnabled();
  });
}
