import { expect, test } from '@playwright/test';

// Hum v4: the front door's card deck, search, answer pages (prebuilt, readable with scripts off), Today, topics.

test('front door: the planet first, a counter that climbs, and the globe once the map arrives', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('about as much electricity as France');
  await expect(page.locator('#globe canvas')).toBeVisible();
  const first = Number((await page.locator('#ctr').textContent())!.replace(/,/g, ''));
  await page.waitForTimeout(600);
  expect(Number((await page.locator('#ctr').textContent())!.replace(/,/g, ''))).toBeGreaterThan(first);
  await expect(page.locator('#counter .how')).toContainText('Hum’s sum');
});

test('front door: the zoom steps from one question out to all the world’s data centres', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#zoom-steps li.now .what')).toHaveText('One short AI question');
  await page.locator('#steps button').last().click();
  await expect(page.locator('#zoom-steps li.now .what')).toContainText('All the world’s data centres');
  await expect(page.locator('#steps button').last()).toHaveAttribute('aria-current', 'step');
});

test('front door: tapping a claim stamps Hum’s verdict and links to the sources', async ({ page }) => {
  await page.goto('/');
  const card = page.locator('.fd-claim[data-slug="bottle-of-water"]');
  await card.locator('.tap').click();
  await expect(card.locator('.stamp-big')).toHaveText('NO');
  await expect(card.locator('.more')).toHaveAttribute('href', '/q/bottle-of-water');
  await expect(page.locator('#score')).toContainText('1 of 6 checked');
});

test('search finds a reviewed answer and links to it', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#picks a')).toHaveCount(3); // a list before anyone types, on the first screen
  await page.fill('#q', 'netflix streaming');
  await expect(page.locator('#picks a').first()).toHaveAttribute('href', '/q/netflix');
  await expect(page.locator('#q-note')).toContainText('for “netflix streaming”');
  await page.fill('#q', 'hello');
  await expect(page.locator('#q-note')).toContainText('nothing on “hello” yet');
  await expect(page.locator('#picks a')).toHaveCount(3); // never a dead end
});

test('search sends a place to The Earth, "who makes Hum" to the About page, and says what Hum covers when it has nothing', async ({ page }) => {
  await page.goto('/');
  await page.fill('#q', 'India');
  await expect(page.locator('#picks a').first()).toHaveAttribute('href', '/q/india');
  await page.fill('#q', 'Japan');
  await expect(page.locator('#picks a').first()).toHaveAttribute('href', '/earth');
  await page.fill('#q', 'who is behind Hum');
  await expect(page.locator('#picks a').first()).toHaveAttribute('href', '/about');
  await page.fill('#q', 'bottle of water');
  await expect(page.locator('#picks a').first()).toContainText('NO');
  await page.fill('#q', 'tiktok');
  await expect(page.locator('#q-note')).toContainText('Hum checks claims about the electricity, water and CO₂');
  await page.goto('/about');
  await expect(page.locator('h1')).toHaveText('Who makes Hum');
  await expect(page.locator('.lede')).toContainText('No AI company');
});

test('search engines get a sitemap, robots.txt and a fact-check record on a claim page', async ({ page, request }) => {
  const robots = await request.get('/robots.txt');
  expect(robots.headers()['content-type']).toContain('text/plain');
  expect(await robots.text()).toContain('Sitemap: https://humearth.org/sitemap.xml');
  expect(await (await request.get('/sitemap.xml')).text()).toContain('<loc>https://humearth.org/q/bottle-of-water</loc>');
  await page.goto('/q/bottle-of-water');
  const ld = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent())!);
  expect(ld['@type']).toBe('ClaimReview');
  expect(ld.reviewRating.alternateName).toBe('False');
});

test('an answer page has its verdict, the total, sources with check dates, and next questions', async ({ page }) => {
  await page.goto('/q/flight');
  await expect(page.locator('h1')).toHaveText('Is using AI worse for the climate than taking a flight?');
  await expect(page.locator('.verdict-row .stamp')).toContainText('NO');
  await expect(page.locator('.answer > .world')).toContainText('485 TWh');
  await page.locator('summary', { hasText: 'Sources' }).click();
  await expect(page.locator('.sources .checked').first()).toContainText(/Quote checked on the page, \d+ \w+ 20\d\d/);
  await expect(page.locator('.sums li')).not.toHaveCount(0);
  await expect(page.locator('.next a')).toHaveCount(3);
  await expect(page).toHaveTitle(/taking a flight\? · Hum/);
});

test('company figures are drawn hollow and never ranked against independent ones', async ({ page }) => {
  await page.goto('/q/one-question');
  await expect(page.locator('.fig-t')).toContainText('not comparable');
  await expect(page.locator('.fig .m-co')).toHaveCount(2);
  await expect(page.locator('.fig li', { hasText: 'OpenAI' })).toContainText('(company figure)');
});

test('the Share button copies the answer where there is no share sheet', async ({ page, context, browserName }) => {
  test.skip(browserName !== 'chromium');
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/q/netflix');
  await page.evaluate(() => Object.defineProperty(navigator, 'share', { value: undefined }));
  await page.locator('.answer .share button').click();
  await expect(page.locator('.answer .share-done')).toContainText(/Copied|Selected/);
});

test('/today shows a numbered question, and a share line after guessing', async ({ page }) => {
  await page.goto('/today');
  await expect(page.locator('#today-num')).toHaveText(/Hum #\d+/);
  await page.locator('#card .choices button').first().click();
  await expect(page.locator('#today-share')).toContainText('Challenge a friend');
});

test('topics list every reviewed answer, by category', async ({ page, request }) => {
  const total = (await (await request.get('/data/answers.json')).json()).answers.length;
  await page.goto('/topics');
  await expect(page.locator('.rows a')).toHaveCount(total);
  await page.goto('/topics/your-bills-and-the-grid');
  await expect(page.locator('.topic .muted').first()).toContainText('mostly from the US');
});

test.describe('with scripts off', () => {
  test.use({ javaScriptEnabled: false });
  test('answer pages and the front door read in full', async ({ page }) => {
    await page.goto('/q/bottle-of-water');
    await expect(page.locator('.lede')).toContainText('Li et al.');
    await expect(page.locator('.verdict-row .stamp')).toContainText('NO');
    await expect(page.locator('.short')).toContainText('one bottle per 10 to 50 answers');
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('#zoom-steps li')).toHaveCount(5); // the zoom reads as a list
    await expect(page.locator('.fd-claim[data-slug="bottle-of-water"] .stamp-big')).toHaveText('NO'); // verdicts show
    await expect(page.locator('#picks a').first()).toHaveAttribute('href', /^\/q\//);
    await page.goto('/today');
    await expect(page.locator('#card-h')).toBeVisible();
  });
});

// Regression: the daily CI rebuild failed for a week because a test assumed the deck's order, which changes with the
// date. Walk a whole cycle of days with a fixed clock: Today shows the day's number and a playable card.
test('every day of the card cycle: Today has the day’s number and a card to play', async ({ page }) => {
  const launch = Date.UTC(2026, 9, 18, 12);
  for (let day = 0; day < 26; day++) {
    await page.clock.setFixedTime(new Date(launch + day * 864e5));
    await page.goto('/today');
    await expect(page.locator('#today-num')).toHaveText(`Hum #${day + 1}`);
    await expect(page.locator('#card .choices button').first()).toBeVisible();
  }
});
