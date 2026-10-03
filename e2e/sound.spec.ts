import { expect, test, type Page } from '@playwright/test';

// Sound is checked by measuring what actually reaches the speakers, not by reading the button:
// an analyser is tapped onto whatever connects to the audio output, and __level() returns dB.

const SILENT = -70; // dB: nothing a person can hear
const AUDIBLE = -40;

async function withMeter(page: Page, remembered: 'on' | 'off' | null = null) {
  await page.addInitScript((pref) => {
    if (pref) localStorage.setItem('hum.sound', pref);
    const w = window as unknown as { __level: () => number };
    const meters: AnalyserNode[] = [];
    const connect = AudioNode.prototype.connect as (this: AudioNode, ...a: unknown[]) => unknown;
    AudioNode.prototype.connect = function (this: AudioNode, dest: unknown, ...rest: unknown[]) {
      if (dest instanceof AudioDestinationNode) {
        const a = this.context.createAnalyser();
        a.fftSize = 2048;
        connect.call(this, a);
        meters.push(a);
      }
      return connect.call(this, dest, ...rest);
    } as typeof AudioNode.prototype.connect;
    w.__level = () => {
      let sum = 0;
      let n = 0;
      for (const a of meters) {
        if (a.context.state !== 'running') continue; // a paused context plays nothing (its analyser keeps old samples)
        const b = new Float32Array(a.fftSize);
        a.getFloatTimeDomainData(b);
        for (const x of b) sum += x * x;
        n += b.length;
      }
      return n && sum ? 10 * Math.log10(sum / n) : -Infinity; // -Infinity = silence
    };
  }, remembered);
  await page.goto('/', { waitUntil: 'commit' });
  await page.locator('#sound').waitFor();
}

const level = (page: Page) => page.evaluate(() => (window as unknown as { __level: () => number }).__level());
const expectLevel = (page: Page, cmp: 'above' | 'below', db: number) =>
  expect
    .poll(() => level(page), { timeout: 3_000, intervals: [100] })
    [cmp === 'above' ? 'toBeGreaterThan' : 'toBeLessThan'](db);

test('Sound on is heard; Sound off goes silent', async ({ page }) => {
  await withMeter(page);
  await expect(page.locator('#sound')).toHaveAttribute('aria-pressed', 'false');
  await page.click('#sound');
  await expect(page.locator('#sound')).toHaveAttribute('aria-pressed', 'true');
  await expectLevel(page, 'above', AUDIBLE);
  await page.click('#sound');
  await expect(page.locator('#sound')).toHaveAttribute('aria-pressed', 'false');
  await expectLevel(page, 'below', SILENT);
  await page.waitForTimeout(1_500); // and it stays off
  expect(await level(page)).toBeLessThan(SILENT);
});

test('remembered "on": the first tap is Sound off, and it really turns off', async ({ page }) => {
  await withMeter(page, 'on');
  await expect(page.locator('#sound')).toHaveAttribute('aria-pressed', 'true');
  await page.click('#sound'); // this tap is also the page's first tap
  await expect(page.locator('#sound')).toHaveAttribute('aria-pressed', 'false');
  await page.waitForTimeout(2_000);
  expect(await level(page)).toBeLessThan(SILENT);
});

test('remembered "on": any other first tap starts the sound', async ({ page }) => {
  await withMeter(page, 'on');
  await page.mouse.click(5, 300);
  await expectLevel(page, 'above', AUDIBLE);
});

test('the button works while the numbers are still loading (slow phone)', async ({ page }) => {
  await page.route('**/data/*.json', async (r) => {
    await new Promise((done) => setTimeout(done, 3_000));
    await r.continue();
  });
  await withMeter(page);
  await page.click('#sound');
  await expect(page.locator('#sound')).toHaveAttribute('aria-pressed', 'true');
  await expectLevel(page, 'above', AUDIBLE);
});

test('fast taps always end where the button says', async ({ page }) => {
  await withMeter(page);
  for (let i = 0; i < 4; i++) await page.click('#sound'); // on, off, on, off
  await expect(page.locator('#sound')).toHaveAttribute('aria-pressed', 'false');
  await page.waitForTimeout(1_500);
  expect(await level(page)).toBeLessThan(SILENT);

  for (let i = 0; i < 3; i++) await page.click('#sound'); // on, off, on
  await expect(page.locator('#sound')).toHaveAttribute('aria-pressed', 'true');
  await page.waitForTimeout(1_500); // past the moment a stale "off" would have paused the audio
  expect(await level(page)).toBeGreaterThan(AUDIBLE);
});
