import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { crossing, deriveMetric, deriveSeries } from './series';
import type { MetricSeries, MetricSource, SeriesSource, SeriesYear } from './series-types';

// Fixture: shaped like the real data (single estimates, a mid-only forecast, a full range, a missing low).
const SRC = { label: 'x', url: 'https://example.org', retrieved: '2026-10-03', supports: 'low,mid,high' };
const metric = (over: Partial<MetricSource> = {}): MetricSource => ({
  label: 'Electricity',
  unit: 'TWh/yr',
  backfill: { rate: 0.1, sources: [SRC] },
  points: [
    { year: 2020, estimate: 'measured', low: 100, mid: 100, high: 100, sources: [SRC] },
    { year: 2021, estimate: 'measured', low: 120, mid: 120, high: 120, sources: [SRC] },
    { year: 2026, estimate: 'forecast', low: null, mid: 240, high: null, sources: [SRC] },
    { year: 2031, estimate: 'forecast', low: 170, mid: 300, high: 420, sources: [SRC] },
  ],
  ...over,
});
const at = (m: MetricSeries, year: number) => m.years.find((y) => y.year === year)!;
const vals = (y: SeriesYear) => [y.low.value, y.mid.value, y.high.value];
const kinds = (y: SeriesYear) => [y.low.kind, y.mid.kind, y.high.kind];

describe('deriveMetric: every year from a few published figures', () => {
  const m = deriveMetric(metric(), 2017, 2031);

  it('covers every year in order, and marks past vs future at the latest measured year', () => {
    expect(m.years.map((y) => y.year)).toEqual(Array.from({ length: 15 }, (_, i) => 2017 + i));
    expect(m.latestMeasuredYear).toBe(2021);
    expect(at(m, 2021).phase).toBe('past');
    expect(at(m, 2022).phase).toBe('future');
  });

  it('keeps published figures exactly, tagged published', () => {
    expect(vals(at(m, 2020))).toEqual([100, 100, 100]);
    expect(kinds(at(m, 2021))).toEqual(['published', 'published', 'published']);
    expect(vals(at(m, 2031))).toEqual([170, 300, 420]);
    expect(at(m, 2026).mid).toEqual({ value: 240, kind: 'published' });
  });

  it('back-calculates years before the first point at the published rate, all derived', () => {
    const y = at(m, 2018);
    expect(y.mid.value).toBeCloseTo(100 / 1.1 ** 2, 6);
    expect(vals(y)).toEqual([y.mid.value, y.mid.value, y.mid.value]);
    expect(kinds(y)).toEqual(['derived', 'derived', 'derived']);
    expect(y.rule).toMatch(/Calculated back from 2020 at about 10% growth a year/);
  });

  it('without a back-fill rate, years before the first point have no figure', () => {
    const y = at(deriveMetric(metric({ backfill: undefined }), 2017, 2031), 2018);
    expect(kinds(y)).toEqual(['none', 'none', 'none']);
    expect(y.rule).toBe('No published figure');
  });

  it('fills the middle between points with steady (geometric) growth', () => {
    expect(at(m, 2023).mid.value).toBeCloseTo(120 * (240 / 120) ** (2 / 5), 6);
    expect(at(m, 2023).mid.kind).toBe('derived');
  });

  it('draws range edges as straight lines between points that published that edge', () => {
    // low: 120 (2021) -> 170 (2031); 2026 is halfway and its own low was not published
    expect(at(m, 2026).low).toEqual({ value: 145, kind: 'derived' });
    expect(at(m, 2026).high).toEqual({ value: 270, kind: 'derived' });
    expect(at(m, 2026).rule).toMatch(/Published forecast; range drawn as a straight line/);
  });

  it('never lets a straight-line edge cross the middle (low <= mid <= high every year)', () => {
    for (const y of m.years) {
      const [lo, mid, hi] = vals(y) as [number | null, number | null, number | null];
      if (lo !== null && mid !== null) expect(lo).toBeLessThanOrEqual(mid);
      if (hi !== null && mid !== null) expect(hi).toBeGreaterThanOrEqual(mid);
    }
  });

  it('a low that was never published stays missing: never invented', () => {
    const co2 = deriveMetric(
      {
        label: 'CO2',
        unit: 'Mt',
        points: [
          { year: 2024, estimate: 'measured', low: 180, mid: 180, high: 180, sources: [SRC] },
          { year: 2035, estimate: 'forecast', low: null, mid: 350, high: 500, sources: [SRC] },
        ],
      },
      2017,
      2035,
    );
    for (const year of [2025, 2030, 2035]) expect(at(co2, year).low).toEqual({ value: null, kind: 'none' });
    expect(at(co2, 2030).high.kind).toBe('derived');
    expect(at(co2, 2035).rule).toMatch(/no published low/);
    expect(kinds(at(co2, 2020))).toEqual(['none', 'none', 'none']); // no CO2 back-fill rate was published
  });
});

describe('crossing: when data centres pass a country', () => {
  const m = deriveMetric(metric(), 2017, 2031);

  it('already passed: says since when, from the middle figure', () => {
    const c = crossing(m, 'Small', 110);
    expect(c.already).toEqual({ year: 2021, kind: 'published' });
    expect(c.earliest).toBeNull();
  });

  it('future: earliest from the high edge, likely from the middle, latest from the low edge', () => {
    const c = crossing(m, 'Mid', 250);
    expect(c.already).toBeNull();
    expect(c.earliest!.year).toBeLessThan(c.likely!.year);
    expect(c.likely!.year).toBeLessThanOrEqual(c.latest?.year ?? Infinity);
  });

  it('a crossing that rests on a calculated year is tagged derived; on a published year, published', () => {
    const c = crossing(m, 'Mid', 250);
    expect(c.likely).toEqual({ year: 2027, kind: 'derived' }); // between 240 (2026) and 300 (2031)
    expect(crossing(m, 'Exact', 240).likely).toEqual({ year: 2026, kind: 'published' });
  });

  it('never reached by the low edge: latest is null ("maybe not by the last year")', () => {
    expect(crossing(m, 'Big', 200).latest).toBeNull(); // low only reaches 170
    expect(crossing(m, 'Huge', 1000)).toMatchObject({ earliest: null, likely: null, latest: null });
  });
});

describe('the real series (data/sources/series.source.json)', () => {
  const src = JSON.parse(readFileSync('data/sources/series.source.json', 'utf8')) as SeriesSource;
  const s = deriveSeries(src);
  const e = s.electricity;

  it('today is the latest published measurement, and the IEA figures appear unchanged', () => {
    expect(e.latestMeasuredYear).toBe(2025);
    expect(at(e, 2025).mid).toEqual({ value: 485, kind: 'published' });
    expect(vals(at(e, 2035))).toEqual([700, 1200, 1700]);
    expect(at(e, 2030).mid).toEqual({ value: 950, kind: 'published' });
    expect(at(e, 2030).low.kind).toBe('derived'); // the IEA gives no 2030 range in text
  });

  it('data centres already passed France and will likely pass Japan, tagged honestly', () => {
    expect(crossing(e, 'France', 480.57).already).not.toBeNull();
    const japan = crossing(e, 'Japan', 1029.97);
    expect(japan.already).toBeNull();
    expect(japan.likely!.kind).toBe('derived');
    expect(japan.latest).toBeNull(); // the 2035 low (700) never reaches Japan
  });
});
