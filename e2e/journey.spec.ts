import { expect, test } from '@playwright/test';
import { answerQuiz, code, fresh, landInWorld, stored, withSavedWorld, world } from './helpers';
import { decode } from '../src/share/codec';

test('first visit: poster first, then 3D; quiz -> dive -> my world, saved on this device', async ({ page }) => {
  await fresh(page);
  await expect(page.locator('#poster-earth')).toBeVisible(); // usable before three.js arrives
  await expect(page.locator('#primary')).toHaveText('Make my world');
  await expect(page.locator('body')).toHaveAttribute('data-view', '3d', { timeout: 30_000 });
  await page.click('#primary');
  await expect(page.locator('#quiz-ask')).toHaveText('How often do you ask an AI something?');
  await answerQuiz(page, [3, 0, 0]);
  await landInWorld(page);
  await expect(page.locator('#sentence')).toContainText('AI questions used most of it');
  const saved = decode((await stored(page))!);
  expect(saved.ok && saved.world.buckets).toEqual({ text: 3, images: 0, videos: 0 });
});

test('a video-heavy week looks stressed and names videos', async ({ page }) => {
  await withSavedWorld(page, world({ buckets: { text: 1, images: 1, videos: 2 } }));
  await page.click('#primary');
  await landInWorld(page);
  await expect(page.locator('#sentence')).toContainText('AI videos used most of it');
  await expect(page.locator('#world-desc')).toContainText('hiding');
});

test('returning visitor: one tap to "Visit my world"; change my answers keeps the seed', async ({ page }) => {
  const mine = world({ seed: 777 });
  await withSavedWorld(page, mine);
  await expect(page.locator('#primary')).toHaveText('Visit my world');
  await page.click('#primary');
  await landInWorld(page);
  await page.click('#change');
  await page.keyboard.press('Escape'); // skip the reverse dive
  await expect(page.locator('#quiz')).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('#quiz-picks .pick[aria-pressed="true"]')).toHaveCount(1); // prefilled
  await answerQuiz(page, [0, 0, 0]);
  const saved = decode((await stored(page))!);
  expect(saved.ok && saved.world.seed).toBe(777);
});

test("a friend's link never overwrites my world, and shows their plan only as a preview", async ({ page }) => {
  const mine = world({ seed: 111 });
  const friend = world({ seed: 222, buckets: { text: 1, images: 1, videos: 2 }, plan: { fewerPictures: false, fewerVideos: true, lighterAi: false } });
  await withSavedWorld(page, mine, `/?s=1#${code(friend)}`);
  await expect(page.locator('#primary')).toHaveText("Visit your friend's world");
  await expect(page.locator('#show-mine')).toBeVisible();
  await page.click('#primary');
  await landInWorld(page);
  await expect(page.locator('#friend-banner')).toContainText("A friend's world. Their plan: fewer AI videos.");
  await expect(page.locator('#sentence')).toContainText("Your friend's");
  await page.click('[data-preview]');
  await expect(page.locator('#trying')).toHaveText('Preview: what this world could be');
  expect(await stored(page)).toBe(code(mine));
});

test('share passes my REAL world plus my plan, with ?s=1', async ({ page }) => {
  await withSavedWorld(page, world({ seed: 4242 }));
  await page.click('#primary');
  await landInWorld(page);
  await page.click('[data-plan="fewerPictures"]');
  await page.evaluate(() => {
    (navigator as Navigator & { share: unknown }).share = (d: ShareData) => ((window as unknown as { __shared: ShareData }).__shared = d, Promise.resolve());
  });
  await page.click('#share');
  const shared = await page.evaluate(() => (window as unknown as { __shared: ShareData }).__shared.url!);
  expect(shared).toMatch(/\/\?s=1#w1\./);
  const w = decode(shared.split('#')[1]!);
  expect(w.ok && w.world).toEqual(world({ seed: 4242, plan: { fewerPictures: true, fewerVideos: false, lighterAi: false } }));
});

test('a broken link says the world moved away, with nothing from the link on the page', async ({ page }) => {
  await fresh(page, '/#w1.<img src=x onerror=alert(1)>');
  await expect(page.locator('#notice')).toHaveText('That world moved away. Make your own?');
  await expect(page.locator('img[src="x"]')).toHaveCount(0);
});

test('tap panel: range in kid words, why unsure, link to How We Know; Esc returns focus', async ({ page }) => {
  await withSavedWorld(page, world());
  await page.click('#primary');
  await landInWorld(page);
  await page.click('.glyph[data-channel="water"]');
  await expect(page.locator('#panel-title')).toHaveText('Your water this week');
  await expect(page.locator('#panel-why')).toContainText('cooled');
  await expect(page.locator('#panel a')).toHaveAttribute('href', '/how-we-know.html#numbers');
  await page.keyboard.press('Escape');
  await expect(page.locator('#panel')).toBeHidden();
  await expect(page.locator('.glyph[data-channel="water"]')).toBeFocused();
});

test('Earth ticker counts up and explains its range and caveat on tap', async ({ page }) => {
  await fresh(page);
  const amount = page.locator('#ticker-amount');
  const read = async () => Number((await amount.textContent())!.replace(/[^0-9.]/g, ''));
  await page.waitForTimeout(1500);
  const first = await read();
  await page.waitForTimeout(2200);
  expect(await read()).toBeGreaterThan(first);
  await page.click('#ticker');
  await expect(page.locator('#ticker')).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#ticker-note')).toContainText("America's AI share");
  await expect(page.locator('#ticker-note a')).toHaveAttribute('href', '/how-we-know.html#numbers');
});

test('sound is off by default, loads nothing until turned on, and is remembered', async ({ page }) => {
  const synthRequests: string[] = [];
  page.on('request', (r) => /\/synth[-.]/.test(r.url()) && synthRequests.push(r.url()));
  await fresh(page);
  await expect(page.locator('#sound')).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('#sound-label')).toHaveText('Sound off');
  await page.waitForTimeout(1500);
  expect(synthRequests).toEqual([]); // nothing loaded while off
  await page.click('#sound');
  await expect(page.locator('#sound-label')).toHaveText('Sound on');
  await expect.poll(() => synthRequests.length).toBeGreaterThan(0);
  await page.reload();
  await expect(page.locator('#sound')).toHaveAttribute('aria-pressed', 'true'); // remembered
});
