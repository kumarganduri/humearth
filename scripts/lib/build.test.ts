import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { buildConstants, buildCountries, buildGrids, buildHubs, buildSeries, canonical, DataValidationError } from './build';
import { readSource } from '../../src/footprint/testing';
import { VALUE_KEYS } from '../../src/footprint/types';

const clone = <T>(x: T): T => structuredClone(x);
const src = () => clone(readSource()) as any;

function problemsOf(fn: () => unknown): string[] {
  try {
    fn();
  } catch (e) {
    if (e instanceof DataValidationError) return e.problems;
    throw e;
  }
  return [];
}

describe('buildConstants: validation (the build must fail on any unsourced or broken number)', () => {
  it('accepts the real sourced data', () => {
    expect(problemsOf(() => buildConstants(src(), null, '2026-10-02'))).toEqual([]);
  });

  it('rejects low > mid', () => {
    const s = src();
    s.values.imageWh.low = 5;
    expect(problemsOf(() => buildConstants(s, null, '2026-10-02')).join()).toMatch(/imageWh: needs low <= mid <= high/);
  });

  it('rejects a value with no sources, or a level no source supports', () => {
    const s = src();
    s.values.textPromptWh.sources = [];
    s.values.imageWh.sources = s.values.imageWh.sources.filter((x: any) => !x.supports.includes('high'));
    const p = problemsOf(() => buildConstants(s, null, '2026-10-02')).join('\n');
    expect(p).toMatch(/textPromptWh.sources: at least one source required/);
    expect(p).toMatch(/imageWh: no source supports "high"/);
  });

  it('rejects non-https URLs, bad dates, missing values and negative numbers', () => {
    const s = src();
    s.values.gridGCO2PerKWh.sources[0].url = 'http://example.com';
    s.values.gridGCO2PerKWh.sources[0].retrieved = 'yesterday';
    delete s.values.worldPopulation;
    s.values.videoClipWh.low = -1;
    const p = problemsOf(() => buildConstants(s, null, '2026-10-02')).join('\n');
    expect(p).toMatch(/url: must be https/);
    expect(p).toMatch(/retrieved: YYYY-MM-DD/);
    expect(p).toMatch(/worldPopulation: missing/);
    expect(p).toMatch(/videoClipWh.low: must be a finite number >= 0/);
  });

});

describe('buildConstants: versioning and the change log', () => {
  it('first build is v1 and logs every value as new', () => {
    const { constants, changelog } = buildConstants(src(), null, '2026-10-02');
    expect(constants.constantsVersion).toBe(1);
    expect(changelog?.changes).toHaveLength(VALUE_KEYS.length);
    expect(changelog?.changes.every((x) => x.from === null)).toBe(true);
  });

  it('unchanged content keeps the version and writes no log entry', () => {
    const first = buildConstants(src(), null, '2026-10-02').constants;
    const again = buildConstants(src(), first, '2026-10-09');
    expect(again.changelog).toBeNull();
    expect(again.constants).toBe(first);
  });

  it('a changed number bumps the version and logs exactly that change', () => {
    const first = buildConstants(src(), null, '2026-10-02').constants;
    const s = src();
    s.values.textPromptWh.mid = 0.3;
    const { constants, changelog } = buildConstants(s, first, '2026-11-01');
    expect(constants.constantsVersion).toBe(2);
    expect(changelog?.changes).toEqual([{ key: 'textPromptWh', from: [0.24, 0.34, 1.86], to: [0.24, 0.3, 1.86] }]);
    expect(changelog).not.toHaveProperty('mappingChanged'); // v1-only field, never written by v2
  });

  it('ignores $comment and key order when hashing', () => {
    expect(canonical({ b: 1, a: [1, { d: 2, c: 3 }], $comment: 'x' })).toBe(canonical({ a: [1, { c: 3, d: 2 }], b: 1 }));
  });
});

describe('buildHubs', () => {
  const hubsSrc = () => JSON.parse(readFileSync('data/sources/hubs.source.json', 'utf8'));
  it('accepts the real sourced hubs (27, every one with a measure and page-checked sources)', () => {
    const out = buildHubs(hubsSrc(), null, '2026-10-02');
    expect(out?.hubs.length).toBe(27);
    expect(out?.hubs.every((h) => h.sources.every((s) => s.checked === 'page'))).toBe(true);
    expect(out?.hubs.every((h) => h.measure && h.sources.length > 0)).toBe(true);
  });
  it('returns null when nothing changed', () => {
    const first = buildHubs(hubsSrc(), null, '2026-10-02')!;
    expect(buildHubs(hubsSrc(), first, '2026-10-09')).toBeNull();
  });
  it('rejects bad coordinates, duplicates, a missing measure and out-of-order MW', () => {
    const s = hubsSrc();
    s.hubs[0].lat = 120;
    s.hubs[1].name = s.hubs[2].name;
    delete s.hubs[3].measure;
    s.hubs[4].mw = { low: 10, mid: 5, high: 20 };
    s.hubs[5].sources[0].checked = 'vibes';
    const p = problemsOf(() => buildHubs(s, null, '2026-10-02')).join('\n');
    expect(p).toMatch(/lat: must be in \[-90, 90\]/);
    expect(p).toMatch(/duplicate name/);
    expect(p).toMatch(/measure: required/);
    expect(p).toMatch(/mw: needs low <= mid <= high/);
    expect(p).toMatch(/checked: page \| search-summary/);
  });
  it('rejects an empty or missing hub list', () => {
    expect(problemsOf(() => buildHubs({ hubs: [] }, null, '2026-10-02')).join()).toMatch(/at least one hub/);
    expect(problemsOf(() => buildHubs(null, null, '2026-10-02')).join()).toMatch(/hubs: missing/);
  });
});

describe('buildSeries / buildCountries: the v2 data must be sourced and in order (eng review D2, D3)', () => {
  const seriesSrc = () => clone(JSON.parse(readFileSync('data/sources/series.source.json', 'utf8')));
  const countriesSrc = () => clone(JSON.parse(readFileSync('data/sources/countries.source.json', 'utf8')));

  it('accepts the real series and countries, and skips rewriting when nothing changed', () => {
    const s = buildSeries(seriesSrc(), null, '2026-10-03')!;
    expect(s.metrics.electricity.years).toHaveLength(2035 - 2017 + 1);
    expect(buildSeries(seriesSrc(), s, '2026-10-04')).toBeNull();
    const c = buildCountries(countriesSrc(), null, '2026-10-03')!;
    expect(c.countries.length).toBeGreaterThan(5);
    expect(buildCountries(countriesSrc(), c, '2026-10-04')).toBeNull();
  });

  it('rejects points out of year order, outside the year range, or with low > mid', () => {
    const s = seriesSrc();
    s.metrics.electricity.points[1].year = 2024; // duplicate of the previous year
    s.metrics.co2.points[1].year = 2040;
    s.metrics.electricity.points[3].low = 1300; // above the 1,200 middle
    const p = problemsOf(() => buildSeries(s, null, 'x')).join('\n');
    expect(p).toMatch(/electricity.points\[1\].year: points must be in increasing year order/);
    expect(p).toMatch(/co2.points\[1\].year: must be an integer in 2017..2035/);
    expect(p).toMatch(/electricity.points\[3\]: needs low <= mid/);
  });

  it('requires a source for every published level, but not for an unpublished (null) edge', () => {
    const s = seriesSrc();
    s.metrics.electricity.points[3].sources = s.metrics.electricity.points[3].sources.filter((x: any) => x.supports !== 'low,high');
    const p = problemsOf(() => buildSeries(s, null, 'x')).join('\n');
    expect(p).toMatch(/electricity.points\[3\]: no source supports "low"/);
    expect(p).not.toMatch(/co2.points\[1\]: no source supports "low"/); // co2 2035 low is null: nothing to source
  });

  it('rejects a series with no measured point, a last point that is not a forecast, or measured after forecast', () => {
    const s = seriesSrc();
    s.metrics.co2.points.forEach((p: any) => (p.estimate = 'forecast'));
    s.metrics.electricity.points[3].estimate = 'measured';
    const p = problemsOf(() => buildSeries(s, null, 'x')).join('\n');
    expect(p).toMatch(/co2: needs at least one measured point/);
    expect(p).toMatch(/electricity: the last point must be a forecast/);
    expect(p).toMatch(/electricity: measured points must come before forecasts/);
  });

  it('rejects a dataset without https, a bad sha256, a duplicate country or a non-positive value', () => {
    const c = countriesSrc();
    c.dataset.url = 'http://insecure.example/file.csv';
    c.dataset.sha256 = 'abc';
    c.dataset.checked = 'page';
    c.countries.push({ ...c.countries[0] });
    c.countries[1].demandTWh = 0;
    const p = problemsOf(() => buildCountries(c, null, 'x')).join('\n');
    expect(p).toMatch(/countries.dataset.url: must be https/);
    expect(p).toMatch(/sha256: 64 lowercase hex/);
    expect(p).toMatch(/checked: must be "dataset"/);
    expect(p).toMatch(/duplicate/);
    expect(p).toMatch(/demandTWh: must be > 0/);
  });
});

describe('buildGrids: the /2030 grid figures must be sourced', () => {
  const grids = () => clone(JSON.parse(readFileSync('data/sources/grids.source.json', 'utf8')));
  it('the checked-in grids build, and rebuild to nothing when unchanged', () => {
    const built = buildGrids(grids(), null, '2026-10-03')!;
    expect(built.grids.map((g) => g.key)).toEqual(['india', 'china', 'world', 'us']);
    expect(buildGrids(grids(), built, '2026-10-04')).toBeNull();
  });
  it('rejects a grid without a source, a duplicate key, or an impossible intensity', () => {
    const g = grids();
    g.grids[0].sources = [];
    g.grids[1].key = g.grids[2].key;
    g.grids[3].gCO2PerKWh = 5000;
    const p = problemsOf(() => buildGrids(g, null, '2026-10-03'));
    expect(p.some((x) => x.startsWith('grids[india]'))).toBe(true);
    expect(p).toContain('grids[world]: duplicate key');
    expect(p).toContain('grids[us].gCO2PerKWh: must be in 0..2000');
  });
});
