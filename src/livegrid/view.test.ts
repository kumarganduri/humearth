import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { gridHtml, regionHtml, sparkline } from './view';
import { parseNeso, type GridRegion } from './grid';

const ctx = { whPerAnswer: 0.34, worldG: 473, time: (iso: string) => iso.slice(11, 16) };
const london: GridRegion = {
  key: 'london', hub: 'London', kind: 'estimate',
  source: { name: 'NESO', url: 'https://carbonintensity.org.uk/', licence: 'CC BY 4.0' },
  points: parseNeso(JSON.parse(readFileSync('src/livegrid/fixtures/neso-london.json', 'utf8'))),
};

describe('live grid cards', () => {
  it('London: the latest figure, compared with the world average, the answer in mg, a 24 h line, the source and licence', () => {
    const last = london.points[london.points.length - 1]!;
    const h = regionHtml(london, ctx);
    expect(h).toContain(`<span class="num g-big">${last.g}</span>`);
    expect(h).toMatch(/(\d+% of the world average|about the world average|[\d.]+ times the world average) \(473\)/);
    expect(h).toContain(`about <b class="derived">${Number((last.g * 0.34).toPrecision(3))} mg</b> of CO2`);
    expect(h).toContain('<svg class="spark"');
    expect(h).toContain('(CC BY 4.0)');
    expect(h).not.toMatch(/\sstyle="/); // CSP
  });
  it('a calculated hub is drawn dotted: dotted number and a dashed line', () => {
    const v: GridRegion = { ...london, key: 'virginia', hub: 'Northern Virginia', kind: 'calculated' };
    const h = regionHtml(v, ctx);
    expect(h).toMatch(/<span class="derived">\d+<\/span>/);
    expect(h).toContain('stroke-dasharray="5 4"');
    expect(h).toContain("calculated by Hum from the grid operator's fuel mix");
  });
  it('not connected yet, or a source down: says so plainly, never a zero', () => {
    const off: GridRegion = { ...london, points: [], unavailable: 'not connected yet' };
    expect(regionHtml(off, ctx)).toContain('Live data for this hub is being connected.');
    const down: GridRegion = { ...london, points: [], unavailable: "NESO's service didn't answer just now" };
    expect(regionHtml(down, ctx)).toContain("No live figure right now: NESO&#39;s service didn&#39;t answer just now.");
    expect(regionHtml(down, ctx)).not.toContain('g-big');
  });
  it('the sparkline needs two points; its label gives the 24 h range', () => {
    expect(sparkline(london.points.slice(0, 1), false)).toBe('');
    expect(sparkline(london.points, false)).toMatch(/aria-label="Last 24 hours: from \d+ to \d+ g CO2 per kWh"/);
  });
  it('renders every region in order', () => {
    const h = gridHtml({ fetchedAt: '', regions: [london, { ...london, key: 'virginia', hub: 'Northern Virginia', points: [], unavailable: 'not connected yet' }] }, ctx);
    expect(h.indexOf('London')).toBeLessThan(h.indexOf('Northern Virginia'));
  });
});
