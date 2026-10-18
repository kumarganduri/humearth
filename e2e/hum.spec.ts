import { expect, test, type Page } from '@playwright/test';

// "The hum" (stage 1b). Checked by measuring what reaches the speakers (an analyser tapped onto anything that
// connects to the audio output), not by reading the button. Rebuilt from v1's sound tests.

const SILENT = -70; // dB: nothing a person can hear
const AUDIBLE = -45;

async function withMeter(page: Page) {
  await page.addInitScript(() => {
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
        if (a.context.state !== 'running') continue;
        const b = new Float32Array(a.fftSize);
        a.getFloatTimeDomainData(b);
        for (const x of b) sum += x * x;
        n += b.length;
      }
      return n && sum ? 10 * Math.log10(sum / n) : -Infinity;
    };
  });
  await page.goto('/earth');
  await expect(page.locator('#slider')).toBeEnabled();
}
const level = (page: Page) => page.evaluate(() => (window as unknown as { __level: () => number }).__level());
const settle = (page: Page) => page.waitForTimeout(1_200); // glides take ~0.5 s

test('off by default; on is heard; off goes silent and stays silent', async ({ page }) => {
  await withMeter(page);
  await expect(page.locator('#hum')).toHaveAttribute('aria-pressed', 'false');
  expect(await level(page)).toBeLessThan(SILENT);
  await page.click('#hum');
  await expect(page.locator('#hum')).toHaveAttribute('aria-label', 'Turn off the hum');
  await expect.poll(() => level(page), { timeout: 4_000 }).toBeGreaterThan(AUDIBLE);
  await page.click('#hum');
  await expect.poll(() => level(page), { timeout: 4_000 }).toBeLessThan(SILENT);
  await page.waitForTimeout(1_500);
  expect(await level(page)).toBeLessThan(SILENT);
});

test('the hum follows the year: 2035 is louder than 2017', async ({ page }) => {
  await withMeter(page);
  await page.click('#hum');
  await page.locator('#slider').fill('2017');
  await settle(page);
  const quiet = await level(page);
  await page.locator('#slider').fill('2035');
  await settle(page);
  const loud = await level(page);
  expect(loud).toBeGreaterThan(quiet + 3); // at least 3 dB louder
});

test('fast taps always end where the button says', async ({ page }) => {
  await withMeter(page);
  for (let i = 0; i < 4; i++) await page.click('#hum'); // on, off, on, off
  await expect(page.locator('#hum')).toHaveAttribute('aria-pressed', 'false');
  await page.waitForTimeout(1_800);
  expect(await level(page)).toBeLessThan(SILENT);
  for (let i = 0; i < 3; i++) await page.click('#hum'); // on, off, on
  await expect(page.locator('#hum')).toHaveAttribute('aria-pressed', 'true');
  await page.waitForTimeout(1_800); // past the moment a stale "off" would have paused the audio
  expect(await level(page)).toBeGreaterThan(AUDIBLE);
});

test('no sound code loads until the hum is turned on', async ({ page }) => {
  const scripts: string[] = [];
  page.on('request', (r) => r.resourceType() === 'script' && scripts.push(r.url()));
  await page.goto('/earth');
  await expect(page.locator('#slider')).toBeEnabled();
  await page.waitForTimeout(800);
  expect(scripts.some((u) => /synth/.test(u))).toBe(false);
  await page.click('#hum');
  await expect.poll(() => scripts.some((u) => /synth/.test(u))).toBe(true);
});
