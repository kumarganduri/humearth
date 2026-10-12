import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { personalImagePath, resultRange, sharedPreview, type PreviewData } from './share-preview';

const read = <T>(p: string) => JSON.parse(readFileSync(p, 'utf8')) as T;
const d: PreviewData = { constants: read('public/data/constants.json'), series: read('public/data/series.json'), grids: read('public/data/grids.json') };

describe('shared /2030 link previews', () => {
  it('a link with choices gets its own result as the title, and the mix in words', () => {
    const p = sharedPreview('?mix=world:40,clean:60&eff=50', d)!;
    expect(p.title).toMatch(/^My 2030: [\d,.]+ million tonnes of CO2 from data centres$/);
    expect(p.description).toMatch(/^60% clean-power deals, 40% world average; 50% of the IEA's efficiency gains\. Emissions .+ Try yours on Hum\.$/);
  });
  it('matches what the page itself shows for the same link (same model)', () => {
    expect(sharedPreview('?mix=world:100', d)!.title).toBe('My 2030: 449 million tonnes of CO2 from data centres');
  });
  it('plain /2030 (no choices) keeps the page\'s own preview', () => {
    expect(sharedPreview('', d)).toBeNull();
    expect(sharedPreview('?utm_source=x', d)).toBeNull();
  });
  it('junk in the link cannot inject markup: only known grids and numbers are used', () => {
    const p = sharedPreview('?mix=<script>:50,clean:50"><b>&eff=1', d)!;
    expect(p.title + p.description).not.toMatch(/[<>"]/);
  });
});

describe('personal preview images', () => {
  it('a shared link points at the card for its whole-number result', () => {
    const p = sharedPreview('?mix=world:40,clean:60&eff=50', d)!;
    expect(p.image).toBe('/og/2030/227.png');
    expect(p.imageAlt).toContain('227 million tonnes of CO2 a year');
  });
  it('the range covers every result the page can make; values outside it are clamped', () => {
    const { min, max } = resultRange(d.series, d.constants, d.grids);
    expect(min).toBeGreaterThan(50);
    expect(max).toBeGreaterThan(600);
    expect(personalImagePath(min - 50, d)).toBe(`/og/2030/${min}.png`);
    expect(personalImagePath(max + 50, d)).toBe(`/og/2030/${max}.png`);
    for (const s of ['?mix=clean:100&eff=100', '?mix=india:100', '?mix=world:100']) {
      const n = Number(/\/(\d+)\.png$/.exec(sharedPreview(s, d)!.image)![1]);
      expect(n).toBeGreaterThanOrEqual(min);
      expect(n).toBeLessThanOrEqual(max);
    }
  });
});
