import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { aiRates, perRequest, requestsPerSecond, simGrids, simulate2030, todayTWh, waterLPerKWh } from './rates';
import type { SeriesFile } from './series-types';
import type { Constants, GridsFile } from './types';

const read = <T>(p: string) => JSON.parse(readFileSync(p, 'utf8')) as T;
const s = read<SeriesFile>('public/data/series.json');
const c = read<Constants>('public/data/constants.json');
const grids = simGrids(read<GridsFile>('public/data/grids.json').grids, c);

describe('aiRates: AI worldwide, per second', () => {
  const r = aiRates(s, c);
  it('today is the latest published year', () => expect(todayTWh(s)).toEqual({ year: 2025, twh: 485 }));
  it('about 4.9 MWh a second and 17.7 GW at the middle; low <= mid <= high everywhere', () => {
    expect(r.whPerSecond[1] / 1e6).toBeCloseTo(4.92, 2);
    expect(r.gigawatts[1]).toBeCloseTo(17.7, 1);
    for (const t of [r.whPerSecond, r.litresPerSecond, r.gramsCO2PerSecond, r.gigawatts]) {
      expect(t[0]).toBeLessThanOrEqual(t[1]);
      expect(t[1]).toBeLessThanOrEqual(t[2]);
    }
  });
});

describe('perRequest: one request at the data centre', () => {
  it('a question: 0.34 Wh, about 0.86 mL of water, 0.16 g CO2 at the middle', () => {
    const q = perRequest('question', c);
    expect(q.wh[1]).toBe(0.34);
    expect(q.waterMl[1]).toBeCloseTo(0.34 * waterLPerKWh(c)[1], 6);
    expect(q.co2g[1]).toBeCloseTo((0.34 / 1000) * 473, 6);
  });
  it('a short video uses far more than a question, and AI does ~14.5 million questions\' worth a second', () => {
    expect(perRequest('video', c).wh[1] / perRequest('question', c).wh[1]).toBeGreaterThan(200);
    expect(requestsPerSecond(perRequest('question', c), aiRates(s, c)) / 1e6).toBeCloseTo(14.5, 1);
  });
});

describe('simulate2030: you run it', () => {
  it('offers the four sourced grids plus clean-power deals at the lowest published intensity', () => {
    expect(grids.map((g) => g.key)).toEqual(['india', 'china', 'world', 'us', 'clean']);
    expect(grids.find((g) => g.key === 'clean')!.gCO2PerKWh).toBe(c.values.gridGCO2PerKWh.low);
  });

  it('all on the world-average grid, no efficiency: 950 TWh x 473 g = ~449 Mt', () => {
    const r = simulate2030(s, c, grids, { mix: { world: 1 }, efficiency: 0 });
    expect(r.twh).toBe(950);
    expect(r.mtCO2).toBeCloseTo((950e9 * 473) / 1e12, 6);
    expect(r.shares.world).toBe(1);
  });

  it('full efficiency cuts electricity by the IEA High Efficiency ratio (970 / 1,200 in 2035)', () => {
    const r = simulate2030(s, c, grids, { mix: { world: 1 }, efficiency: 1 });
    expect(r.efficiencyCut).toBeCloseTo(1 - 970 / 1200, 9);
    expect(r.twh).toBeCloseTo(950 * (970 / 1200), 6);
  });

  it('clean deals + efficiency can bring emissions below today; shares are normalised; junk input is safe', () => {
    const clean = simulate2030(s, c, grids, { mix: { clean: 3, us: 1 }, efficiency: 1 });
    expect(clean.shares.clean).toBeCloseTo(0.75, 9);
    expect(clean.mtCO2).toBeLessThan(clean.todayMtCO2);
    const junk = simulate2030(s, c, grids, { mix: { world: -5 }, efficiency: Number.NaN });
    expect(junk.twh).toBe(950);
    expect(Object.values(junk.shares).every((x) => Math.abs(x - 1 / grids.length) < 1e-9)).toBe(true); // no weights -> even split
  });
});
