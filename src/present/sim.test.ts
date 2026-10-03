import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { gaugeMax, gridSource, outputsHtml, simPageHtml, START, verdict } from './sim';
import { simGrids, simulate2030 } from '../footprint/rates';
import type { Constants, GridsFile } from '../footprint/types';
import type { SeriesFile } from '../footprint/series-types';
import { extractInlineStyles } from './inline-styles';

const read = <T>(p: string) => JSON.parse(readFileSync(p, 'utf8')) as T;
const c = read<Constants>('public/data/constants.json');
const s = read<SeriesFile>('public/data/series.json');
const gl = read<GridsFile>('public/data/grids.json').grids;
const grids = simGrids(gl, c);
const at = (mix: Record<string, number>, efficiency = 0) => simulate2030(s, c, grids, { mix, efficiency });

describe('verdicts come from the numbers', () => {
  it('starting point (world-average grid): about 2.5 times 2024\'s emissions; both comparisons use 2024', () => {
    expect(verdict(at(START.mix), s)).toBe("Emissions 2.5 times 2024's. Where data centres plug in matters as much as how much they use.");
  });
  it('clean deals + full efficiency: a cut, with more electricity than today', () => {
    expect(verdict(at({ clean: 1 }, 1), s)).toMatch(/^You cut emissions to \d+% of 2024's, while data centres use 1\.\d+ times their 2024 electricity\.$/);
  });
  it('within 10% of today: "about the same"; just outside it: not', () => {
    const r = at(START.mix);
    expect(verdict({ ...r, mtCO2: r.todayMtCO2 * 1.1 }, s)).toMatch(/^Emissions about the same as 2024, with 2\.29 times the electricity\.$/);
    expect(verdict({ ...r, mtCO2: r.todayMtCO2 * 0.91 }, s)).toMatch(/^Emissions about the same/);
    expect(verdict({ ...r, mtCO2: r.todayMtCO2 * 0.89 }, s)).toMatch(/^You cut emissions to 89%/);
  });
});

describe('the outputs', () => {
  it('the gauge fits every all-one-grid case; today\'s line sits inside it', () => {
    const r = at(START.mix);
    const max = gaugeMax(r, grids);
    for (const g of grids) expect(at({ [g.key]: 1 }).mtCO2).toBeLessThanOrEqual(max);
    expect(r.todayMtCO2).toBeLessThan(max);
  });
  it('efficiency shows what it saved, marked calculated', () => {
    expect(outputsHtml(at(START.mix), grids, 2024)).toContain('IEA forecast for 2030');
    expect(outputsHtml(at(START.mix, 1), grids, 2024)).toMatch(/your efficiency saves <span class="derived">\d+<\/span>/);
  });
  it('every grid names its source', () => {
    expect(grids.map(gridSource)).toEqual(['708 g/kWh · Ember, 2024', '560 g/kWh · Ember, 2024', '473 g/kWh · Ember, 2024', '384 g/kWh · Ember, 2024', '125 g/kWh · Google, market-based']);
  });
});

describe('prebuilt page', () => {
  const h = simPageHtml(c, s, gl);
  it('starts at the world average, controls disabled until JS, one-grid-at-a-time table', () => {
    expect(h).toContain('id="s-world" data-grid="world" min="0" max="100" step="5" value="100" disabled');
    expect(h).toContain('<output class="num" id="s-worldv" for="s-world">100%</output>');
    expect(h.match(/<tr><th scope="row">/g)).toHaveLength(5);
    expect(h).toContain('970 vs 1,200 TWh');
  });
  it('src/sim.generated.html + .css are up to date (run `npm run build:data`)', () => {
    const { html, css } = extractInlineStyles(h);
    expect(readFileSync('src/sim.generated.html', 'utf8')).toContain(html);
    expect(readFileSync('src/sim.generated.css', 'utf8')).toContain(css);
  });
});
