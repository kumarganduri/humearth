import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { co2Words, counterWords, elapsedSeconds, energyWords, livePageHtml, pools, poolsWords, powerLine, totalsAfter } from './live';
import { aiRates } from '../footprint/rates';
import type { Constants, HubsFile } from '../footprint/types';
import type { SeriesFile } from '../footprint/series-types';

const read = <T>(p: string) => JSON.parse(readFileSync(p, 'utf8')) as T;
const c = read<Constants>('public/data/constants.json');
const s = read<SeriesFile>('public/data/series.json');
const hubs = read<HubsFile>('public/data/hubs.json').hubs;
const r = aiRates(s, c);

describe('counting', () => {
  it('since opening counts from the moment the page opened; since midnight from the visitor\'s own midnight', () => {
    const now = new Date(2026, 9, 3, 1, 30, 0);
    expect(elapsedSeconds('open', now.getTime() - 12_000, now)).toBe(12);
    expect(elapsedSeconds('open', now.getTime() + 5, now)).toBe(0);
    expect(elapsedSeconds('midnight', 0, now)).toBe(5400);
  });

  it('a minute of AI: about 295 MWh, and the totals scale with time', () => {
    const t = totalsAfter(r, 60);
    expect(energyWords(t.wh)).toEqual({ n: '295', unit: 'MWh' });
    expect(totalsAfter(r, 120).litres).toBeCloseTo(t.litres * 2, 6);
  });

  it('units stay readable', () => {
    expect(energyWords(5_000)).toEqual({ n: '5', unit: 'kWh' });
    expect(energyWords(2.5e9)).toEqual({ n: '2.5', unit: 'GWh' });
    expect(co2Words(2_330)).toEqual({ n: '2.33', unit: 'kg' });
    expect(co2Words(4.2e6)).toEqual({ n: '4.2', unit: 'tonnes' });
  });

  it('counters tick in whole numbers so the last digits move', () => {
    expect(counterWords({ wh: 310_452_123_456, litres: 787_123_456.7, grams: 146_559_900_000 })).toEqual({
      e: { n: '310,452', unit: 'MWh' },
      w: { n: '787,123,456', unit: 'litres' },
      c: { n: '146,559', unit: 'tonnes' },
    });
    expect(counterWords({ wh: 500_000, litres: 3, grams: 900_000 }).e).toEqual({ n: '500', unit: 'kWh' });
    expect(counterWords({ wh: 500_000, litres: 3, grams: 900_000 }).c).toEqual({ n: '900', unit: 'kg' });
  });

  it('pools: full ones counted, the current one partly full', () => {
    expect(pools(6_250_000, 2_500_000)).toEqual({ full: 2, frac: 0.5 });
    expect(pools(0, 2_500_000)).toEqual({ full: 0, frac: 0 });
    expect(poolsWords(1)).toBe('1 Olympic pool filled');
    expect(poolsWords(12)).toBe('12 Olympic pools filled');
  });
});

describe('the words', () => {
  it('power: about 17.7 GW, about 5.81 Northern Virginias, both marked calculated', () => {
    expect(powerLine(r, hubs)).toBe(
      'AI runs at about <span class="derived">17.7 GW</span>, day and night, about <span class="derived">5.81</span> times the data centres of Northern Virginia, the biggest hub Hum tracks (about 3,046 MW).',
    );
  });

  it('prebuilt page: per-second rates with ranges; counters hidden until JS; no style attributes', () => {
    const h = livePageHtml(c, s, hubs);
    expect(h).toContain('<b class="derived">4.92 MWh</b>');
    expect(h).toMatch(/id="board" hidden/);
    expect(h).toContain('2.5 million litres');
    expect(h).not.toMatch(/\sstyle="/);
  });
});

describe('prebuilt page', () => {
  it('src/live.generated.html is up to date with public/data (run `npm run build:data`)', () => {
    expect(readFileSync('src/live.generated.html', 'utf8')).toContain(livePageHtml(c, s, hubs));
  });
});
