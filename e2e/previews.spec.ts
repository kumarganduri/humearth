import { expect, test } from '@playwright/test';

// Link previews: every page names its card, and the card image is served (rendered at build time).
const PAGES: [string, string][] = [['/', 'home'], ['/question', 'question'], ['/live', 'live'], ['/2030', '2030'], ['/how-we-know.html', 'how']];

for (const [path, card] of PAGES) {
  test(`${path}: preview tags point at its card, and the card is a 1200x630 PNG`, async ({ page, request }) => {
    await page.goto(path);
    const meta = (sel: string) => page.locator(sel).getAttribute('content');
    expect(await meta('meta[property="og:image"]')).toBe(`https://humearth.org/og/${card}.png`);
    expect(await meta('meta[name="twitter:card"]')).toBe('summary_large_image');
    expect((await meta('meta[property="og:title"]'))!.length).toBeGreaterThan(10);
    expect(await meta('meta[property="og:description"]')).toBeTruthy();
    const png = await request.get(`/og/${card}.png`);
    expect(png.status()).toBe(200);
    const b = await png.body();
    expect(b.subarray(1, 4).toString()).toBe('PNG');
    expect([b.readUInt32BE(16), b.readUInt32BE(20)]).toEqual([1200, 630]);
  });
}

test('every personal /2030 card in the range exists as a 1200x630 PNG (spot-checked: ends and middle)', async ({ request }) => {
  const meta = await request.get('/og/2030/227.png');
  expect(meta.status()).toBe(200);
  for (const n of [227, 300, 449]) {
    const r = await request.get(`/og/2030/${n}.png`);
    expect(r.status(), `card ${n}`).toBe(200);
    const b = await r.body();
    expect(b.subarray(1, 4).toString()).toBe('PNG');
    expect([b.readUInt32BE(16), b.readUInt32BE(20)]).toEqual([1200, 630]);
  }
});
