import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { endSentence, journeySvg, LAYOUTS, meterProgress, questionPageHtml, smoothPath, STATIONS } from './question';
import type { Constants } from '../footprint/types';
import type { SeriesFile } from '../footprint/series-types';

const read = <T>(p: string) => JSON.parse(readFileSync(p, 'utf8')) as T;
const c = read<Constants>('public/data/constants.json');
const s = read<SeriesFile>('public/data/series.json');

describe('the journey', () => {
  it('a smooth path starts at the phone and ends at cooling, passing every station', () => {
    const d = smoothPath(LAYOUTS.wide.pts);
    expect(d.startsWith('M70,200 C')).toBe(true);
    expect(d.endsWith(' 910,110')).toBe(true);
    expect(d.match(/C/g)).toHaveLength(LAYOUTS.wide.pts.length - 1);
  });

  it('both layouts have a station for every point, and fit their view box', () => {
    for (const k of ['wide', 'tall'] as const) {
      const L = LAYOUTS[k];
      expect(L.pts).toHaveLength(STATIONS.length);
      for (const [x, y] of L.pts) {
        expect(x - 30).toBeGreaterThanOrEqual(0);
        expect(x + 30).toBeLessThanOrEqual(L.w);
        expect(y + 60).toBeLessThanOrEqual(L.h); // circle + label below it
      }
      expect(journeySvg(k).match(/class="st"/g)).toHaveLength(STATIONS.length);
    }
  });

  it('meters fill on their own stretch: electricity at the servers, CO2 at the plant, water at cooling', () => {
    const at = { phone: 0, fibre: 100, dc: 200, servers: 300, power: 400, cooling: 500 };
    expect(meterProgress(at, 150)).toEqual({ e: 0, c: 0, w: 0 });
    expect(meterProgress(at, 250)).toEqual({ e: 0.5, c: 0, w: 0 });
    expect(meterProgress(at, 350)).toEqual({ e: 1, c: 0.5, w: 0 });
    expect(meterProgress(at, 500)).toEqual({ e: 1, c: 1, w: 1 });
  });
});

describe('the words', () => {
  it('the end sentence: the request, then AI worldwide per second as calculated figures', () => {
    expect(endSentence('question', c, s)).toBe(
      'That was one question: about <b>0.34 Wh</b> of electricity. Right now AI around the world uses about <b class="derived">4.92 MWh every second</b>: the same as <b class="derived">14.5 million</b> of your questions, every second.',
    );
    expect(endSentence('video', c, s)).toContain('one short video: about <b>90 Wh</b>');
  });

  it('the page works without scripts: a table of all three kinds, controls disabled until JS wakes them', () => {
    const h = questionPageHtml(c, s);
    expect(h).toContain('<th scope="row">Question</th><td>0.34 <span class="rng">(0.24–1.86)</span></td>');
    expect(h).toContain('<th scope="row">Short video</th><td>90 <span class="rng">(25.3–944)</span></td>');
    expect(h).toMatch(/id="q-send" disabled/);
    expect(h).not.toMatch(/\sstyle="/); // CSP: style-src 'self'
  });
});

describe('prebuilt page', () => {
  it('src/question.generated.html is up to date with public/data (run `npm run build:data`)', () => {
    expect(readFileSync('src/question.generated.html', 'utf8')).toContain(questionPageHtml(c, s));
  });
});
