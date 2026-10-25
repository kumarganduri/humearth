import { expect, test } from '@playwright/test';

// Hum v4: the front door's card deck, search, answer pages (prebuilt, readable with scripts off), Today, topics.

test('front door: guess, see which answer was right, read the bigger picture, go to the next card', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('One AI question uses very little electricity');
  const first = await page.locator('#card-h').textContent();
  await page.locator('#card .choices button').nth(1).click(); // a wrong guess on the lead card
  await expect(page.locator('#rv-h')).toBeFocused();
  await expect(page.locator('#rv-h')).toContainText('Not quite.');
  await expect(page.locator('.choices .is-right')).toContainText('Right answer');
  await expect(page.locator('.choices .is-mine')).toContainText('Your guess');
  await expect(page.locator('#reveal .world')).toContainText('The bigger picture');
  await expect(page.locator('#reveal a.btn')).toHaveAttribute('href', /^\/q\//);
  await page.click('#next-card');
  await expect(page.locator('#card-h')).not.toHaveText(first!);
  await expect(page.locator('#card-h')).toBeFocused();
});

test('front door: a claim card shows Hum’s verdict stamp after the guess', async ({ page }) => {
  // Which cards come first depends on the day (the deck skips Today's card), so play on to the first claim card.
  await page.goto('/');
  for (let i = 0; i < 4 && !(await page.locator('#card .choices button[data-k]').count()); i++) {
    await page.locator('#card .choices button').first().click();
    await page.click('#next-card');
  }
  await page.locator('#card .choices button[data-k]').first().click();
  await expect(page.locator('#reveal .stamp')).toContainText('Hum’s verdict');
});

test('front door: playing every card ends on a score', async ({ page }) => {
  await page.goto('/');
  for (let i = 0; i < 20; i++) {
    const next = page.locator('#next-card');
    if (!(await page.locator('#card .choices button').count())) break;
    await page.locator('#card .choices button').first().click();
    await next.click();
  }
  await expect(page.locator('#card-h')).toContainText(/You got \d+ of \d+\./);
  await expect(page.locator('#card a[href="/today"]')).toBeVisible();
});

test('search finds a reviewed answer and links to it', async ({ page }) => {
  await page.goto('/');
  await page.fill('#q', 'netflix streaming');
  await expect(page.locator('#results a').first()).toHaveAttribute('href', '/q/netflix');
  await expect(page.locator('#q-count')).toContainText('match');
  await page.fill('#q', 'zzzz qqqq');
  await expect(page.locator('#results .none')).toContainText('No reviewed answer');
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

test('/today shows a numbered question that is not the front door’s first card, and a share line after guessing', async ({ page }) => {
  await page.goto('/');
  const front = await page.locator('#card-h').textContent();
  await page.goto('/today');
  await expect(page.locator('#today-num')).toHaveText(/Hum #\d+/);
  await expect(page.locator('#card-h')).not.toHaveText(front!);
  await page.locator('#card .choices button').first().click();
  await expect(page.locator('#today-share')).toContainText('Challenge a friend');
});

test('topics list every reviewed answer, by category', async ({ page }) => {
  await page.goto('/topics');
  await expect(page.locator('.rows a')).toHaveCount(11);
  await page.goto('/topics/your-bills-and-the-grid');
  await expect(page.locator('.topic .muted').first()).toContainText('mostly from the US');
});

test.describe('with scripts off', () => {
  test.use({ javaScriptEnabled: false });
  test('answer pages read in full and the front door card links to its answer', async ({ page }) => {
    await page.goto('/q/bottle-of-water');
    await expect(page.locator('.lede')).toContainText('Li et al.');
    await expect(page.locator('.verdict-row .stamp')).toContainText('NOBODY KNOWS');
    await page.goto('/');
    await expect(page.locator('#card-h')).toBeVisible();
    await expect(page.locator('#card .choices')).toBeHidden();
    await expect(page.locator('#card .tellme')).toHaveAttribute('href', /^\/q\//);
    await page.goto('/today');
    await expect(page.locator('#card-h')).toBeVisible();
  });
});

// Regression: the daily CI rebuild failed for a week because a test assumed the deck's order, which changes with the
// date. Walk a whole cycle of days with a fixed clock: Today shows the day's number and never the front door's first card.
test('every day of the card cycle: Today has the day’s number and differs from the front door’s first card', async ({ page }) => {
  const launch = Date.UTC(2026, 9, 18, 12);
  for (let day = 0; day < 12; day++) {
    await page.clock.setFixedTime(new Date(launch + day * 864e5));
    await page.goto('/');
    const front = await page.locator('#card-h').textContent();
    await page.goto('/today');
    await expect(page.locator('#today-num')).toHaveText(`Hum #${day + 1}`);
    await expect(page.locator('#card .choices button').first()).toBeVisible();
    expect(await page.locator('#card-h').textContent(), `day ${day}`).not.toBe(front);
  }
});
