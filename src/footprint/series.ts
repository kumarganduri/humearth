// Every year of the story from a handful of published figures (eng review D2). Pure: runs at build time
// (scripts/build-data.ts writes public/data/series.json) and in the browser (crossings for the race).
//
//   published points  ●─────────●──────────────●─────────────●       (only what sources said)
//                    2024      2025           2030          2035
//   mid between points: constant growth (geometric)             → kind 'derived'
//   low/high between points: straight line between the nearest
//     points that published that edge; none later → 'none'      → kind 'derived' / 'none'
//   years before the first point: back-calculated at the
//     published growth rate (low = mid = high)                  → kind 'derived'
//   a published null edge stays null forever ("no published low")

import type {
  MetricKey,
  MetricSeries,
  MetricSource,
  PublishedPoint,
  SeriesSource,
  SeriesValue,
  SeriesYear,
  ValueKind,
} from './series-types';
import { METRIC_KEYS } from './series-types';

const v = (value: number | null, kind: ValueKind): SeriesValue => (value === null ? { value: null, kind: 'none' } : { value, kind });

const geo = (a: number, b: number, t: number) => a * Math.pow(b / a, t);
const lin = (a: number, b: number, t: number) => a + (b - a) * t;

/** Nearest published value of an edge at or before / at or after a year. */
function neighbours(points: PublishedPoint[], year: number, edge: 'low' | 'high') {
  let before: PublishedPoint | null = null;
  let after: PublishedPoint | null = null;
  for (const p of points) {
    if (p[edge] === null) continue;
    if (p.year <= year) before = p;
    if (p.year >= year && !after) after = p;
  }
  return { before, after };
}

/** A published null at the last point means "no published low/high" for the whole future: never filled in. */
function edgeAt(points: PublishedPoint[], year: number, edge: 'low' | 'high'): SeriesValue {
  const exact = points.find((p) => p.year === year);
  if (exact && exact[edge] !== null) return v(exact[edge], 'published');
  const { before, after } = neighbours(points, year, edge);
  if (!before || !after || before === after) return v(null, 'none');
  return v(lin(before[edge]!, after[edge]!, (year - before.year) / (after.year - before.year)), 'derived');
}

function midAt(points: PublishedPoint[], year: number): SeriesValue {
  const exact = points.find((p) => p.year === year);
  if (exact) return v(exact.mid, 'published');
  const before = [...points].reverse().find((p) => p.year < year);
  const after = points.find((p) => p.year > year);
  if (!before || !after) return v(null, 'none');
  return v(geo(before.mid, after.mid, (year - before.year) / (after.year - before.year)), 'derived');
}

function ruleFor(year: number, m: MetricSource, mid: SeriesValue, low: SeriesValue, high: SeriesValue): string {
  const pts = m.points;
  const exact = pts.find((p) => p.year === year);
  const first = pts[0]!;
  if (year < first.year) {
    return m.backfill
      ? `Calculated back from ${first.year} at about ${Math.round(m.backfill.rate * 100)}% growth a year`
      : 'No published figure';
  }
  const range =
    low.kind === 'none' && high.kind === 'none'
      ? ''
      : low.kind === 'none'
        ? '; no published low'
        : low.kind === 'derived' || high.kind === 'derived'
          ? '; range drawn as a straight line between published ranges'
          : '';
  if (exact) {
    const single = exact.low === exact.mid && exact.high === exact.mid;
    return `${exact.estimate === 'measured' ? 'Published figure' : 'Published forecast'}${single ? ' (single estimate)' : ''}${range}`;
  }
  if (mid.kind === 'none') return 'No published figure';
  const before = [...pts].reverse().find((p) => p.year < year)!;
  const after = pts.find((p) => p.year > year)!;
  return `Calculated: steady growth between the ${before.year} and ${after.year} figures${range}`;
}

export function deriveMetric(m: MetricSource, firstYear: number, lastYear: number): MetricSeries {
  const pts = m.points;
  const first = pts[0]!;
  const latestMeasuredYear = Math.max(...pts.filter((p) => p.estimate === 'measured').map((p) => p.year));
  const years: SeriesYear[] = [];
  for (let year = firstYear; year <= lastYear; year++) {
    let low: SeriesValue, mid: SeriesValue, high: SeriesValue;
    if (year < first.year) {
      const back = m.backfill ? first.mid / Math.pow(1 + m.backfill.rate, first.year - year) : null;
      low = mid = high = v(back, 'derived');
    } else {
      mid = midAt(pts, year);
      low = edgeAt(pts, year, 'low');
      high = edgeAt(pts, year, 'high');
      // A straight-line edge can cross a geometric middle; keep low <= mid <= high without hiding which is derived.
      if (mid.value !== null) {
        if (low.value !== null && low.value > mid.value) low = v(mid.value, low.kind);
        if (high.value !== null && high.value < mid.value) high = v(mid.value, high.kind);
      }
    }
    years.push({ year, phase: year <= latestMeasuredYear ? 'past' : 'future', low, mid, high, rule: ruleFor(year, m, mid, low, high) });
  }
  const sources = [...(m.backfill?.sources ?? []), ...pts.flatMap((p) => p.sources)];
  return { label: m.label, unit: m.unit, latestMeasuredYear, years, sources };
}

export function deriveSeries(src: SeriesSource): Record<MetricKey, MetricSeries> {
  return Object.fromEntries(METRIC_KEYS.map((k) => [k, deriveMetric(src.metrics[k], src.firstYear, src.lastYear)])) as Record<
    MetricKey,
    MetricSeries
  >;
}

/** When data centres pass a country's yearly electricity use (eng review D2, outside voice #3). */
export interface CrossingYear {
  year: number;
  kind: 'published' | 'derived';
}
export interface Crossing {
  country: string;
  demandTWh: number;
  /** Already above it in the latest measured year: the earliest year the middle figure passed it. */
  already: CrossingYear | null;
  /** Earliest possible (high edge), most likely (middle), latest (low edge); null = not by the last year. */
  earliest: CrossingYear | null;
  likely: CrossingYear | null;
  latest: CrossingYear | null;
}

function firstAtLeast(m: MetricSeries, pick: (y: SeriesYear) => SeriesValue, target: number, from: number): CrossingYear | null {
  for (const y of m.years) {
    if (y.year < from) continue;
    const val = pick(y);
    if (val.value !== null && val.value >= target) return { year: y.year, kind: val.kind === 'published' ? 'published' : 'derived' };
  }
  return null;
}

export function crossing(m: MetricSeries, country: string, demandTWh: number): Crossing {
  const latest = m.years.find((y) => y.year === m.latestMeasuredYear)!;
  if (latest.mid.value !== null && latest.mid.value >= demandTWh) {
    return { country, demandTWh, already: firstAtLeast(m, (y) => y.mid, demandTWh, m.years[0]!.year), earliest: null, likely: null, latest: null };
  }
  const from = m.latestMeasuredYear + 1;
  return {
    country,
    demandTWh,
    already: null,
    earliest: firstAtLeast(m, (y) => (y.high.value !== null ? y.high : y.mid), demandTWh, from),
    likely: firstAtLeast(m, (y) => y.mid, demandTWh, from),
    latest: firstAtLeast(m, (y) => y.low, demandTWh, from),
  };
}
