import { expect, test } from '@playwright/test';
import { answerQuiz, fresh, landInWorld, withSavedWorld, world } from './helpers';

test('reduced motion: a short crossfade instead of the dive, and the world UI right away', async ({ browser }) => {
  const page = await browser.newPage({ reducedMotion: 'reduce' });
  await withSavedWorld(page, world());
  await expect(page.locator('body')).toHaveAttribute('data-view', '3d', { timeout: 30_000 });
  await page.click('#primary');
  // Landing time depends on the test machine's software WebGL under load (it takes <0.5 s alone),
  // so the strict check is the reduced-motion behaviour itself: no 3 s "world speaks first" wait.
  await expect(page.locator('body')).toHaveClass(/landed/, { timeout: 10_000 });
  await expect(page.locator('#world-ui')).toHaveClass(/show/, { timeout: 500 });
  await page.close();
});

test('AI-building data fails to load: globe still shows and the numbers still work', async ({ page }) => {
  await page.route('**/data/hubs.json', (r) => r.fulfill({ status: 404, body: '' }));
  await withSavedWorld(page, world());
  await expect(page.locator('body')).toHaveAttribute('data-view', '3d', { timeout: 30_000 });
  await page.click('#primary');
  await landInWorld(page);
  await expect(page.locator('.glyph')).toHaveCount(3);
});

test('no WebGL: the poster view works end to end', async ({ page }) => {
  await page.addInitScript(() => {
    const orig = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
      if (type.startsWith('webgl')) return null;
      return (orig as (...a: unknown[]) => unknown).call(this, type, ...rest);
    } as typeof orig;
  });
  await fresh(page);
  await expect(page.locator('body')).toHaveAttribute('data-view', 'poster-no-webgl', { timeout: 10_000 });
  await page.click('#primary');
  await answerQuiz(page, [1, 2, 2]);
  await expect(page.locator('body')).toHaveClass(/landed/, { timeout: 5_000 });
  await expect(page.locator('#poster-world')).toBeVisible();
  await expect(page.locator('#poster-world')).toHaveCSS('filter', /saturate/); // stress still shows
  await expect(page.locator('#world-ui')).toHaveClass(/show/, { timeout: 6_000 });
});

test('the GPU drops the 3D: posters take over, then the 3D comes back', async ({ page }) => {
  await withSavedWorld(page, world());
  await expect(page.locator('body')).toHaveAttribute('data-view', '3d', { timeout: 30_000 });
  await page.evaluate(() => {
    const gl = (document.getElementById('stage') as HTMLCanvasElement).getContext('webgl2')!;
    (window as unknown as { __lose: WEBGL_lose_context }).__lose = gl.getExtension('WEBGL_lose_context')!;
    (window as unknown as { __lose: WEBGL_lose_context }).__lose.loseContext();
  });
  await expect(page.locator('body')).toHaveAttribute('data-view', 'poster-context-lost');
  await expect(page.locator('#poster-earth')).toBeVisible();
  await page.evaluate(() => (window as unknown as { __lose: WEBGL_lose_context }).__lose.restoreContext());
  await expect(page.locator('body')).toHaveAttribute('data-view', '3d', { timeout: 10_000 });
  await page.click('#primary');
  await landInWorld(page);
});

test('nothing loads from anyone else\'s servers', async ({ page }) => {
  const foreign: string[] = [];
  page.on('request', (r) => {
    if (!r.url().startsWith('http://127.0.0.1:4173') && !r.url().startsWith('data:')) foreign.push(r.url());
  });
  await withSavedWorld(page, world());
  await page.click('#primary');
  await landInWorld(page);
  await page.goto('/how-we-know.html');
  await expect(page.locator('#numbers')).toBeVisible();
  expect(foreign).toEqual([]);
});
