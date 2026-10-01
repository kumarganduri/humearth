import { expect, type Page } from '@playwright/test';
import { encode, type SharedWorld } from '../src/share/codec';

export const NO_PLAN = { fewerPictures: false, fewerVideos: false, lighterAi: false };
export const world = (over: Partial<SharedWorld> = {}): SharedWorld => ({
  seed: 20261002,
  biome: 'forest',
  buckets: { text: 1, images: 1, videos: 0 },
  plan: NO_PLAN,
  ...over,
});
export const code = (w: SharedWorld) => encode(w);

/** Fresh visitor: no saved world. */
export async function fresh(page: Page, path = '/') {
  await page.goto(path);
  await page.evaluate(() => localStorage.clear());
  await page.goto(path);
}

export async function withSavedWorld(page: Page, w: SharedWorld, path = '/') {
  await page.goto('/');
  await page.evaluate((c) => localStorage.setItem('hum.world', c), code(w));
  await page.goto(path);
}

export const stored = (page: Page) => page.evaluate(() => localStorage.getItem('hum.world'));

export async function answerQuiz(page: Page, values: [number, number, number]) {
  for (const v of values) await page.locator(`#quiz-picks .pick[data-value="${v}"]`).click();
}

/** Wait for the world, skipping the dive (Esc) to keep tests fast. */
export async function landInWorld(page: Page) {
  await page.keyboard.press('Escape');
  await expect(page.locator('body')).toHaveClass(/landed/, { timeout: 15_000 });
  await expect(page.locator('#world-ui')).toHaveClass(/show/, { timeout: 6_000 });
  await expect(page.locator('#world-ui')).toHaveCSS('opacity', '1'); // fade-in finished
}
