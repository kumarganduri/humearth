import { expect, test } from '@playwright/test';

// v1 share links ("?s=1#w1.…") and saved worlds are cleaned up quietly (eng review D5).
test('an old v1 share link opens the normal page, with the hash and stored world removed', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.setItem('hum.world', 'w1.BYPm9wAAAQIA');
    localStorage.setItem('hum.sound', 'on');
  });
  await page.goto('/?s=1#w1.BYPm9wAAAQIA');
  await expect(page.locator('h1')).toBeVisible();
  await expect.poll(() => page.url()).toMatch(/\/$/);
  expect(await page.evaluate(() => [localStorage.getItem('hum.world'), localStorage.getItem('hum.sound')])).toEqual([null, null]);
});
