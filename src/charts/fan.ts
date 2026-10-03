// The fan chart (eng review D9, DESIGN.md "brightness means certainty"). Pure: series in, SVG string out.
//
//   TWh                                         ╱ high (dashed edge)
//    ▲                              ....▒▒▒▒▒▒▒╱  band = forecast range, dim
//    │               ●━━●  ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄  middle forecast: dim dashed
//    │   ╌╌╌╌╌╌╌╌╌╌╌╌        ╲▒▒▒▒▒▒▒▒▒▒▒▒▒╲  low (dashed edge; missing if never published)
//    │  calculated history (dashed, bright)
//    ──────────────────── Japan ─────────  country lines: quiet reference
//    └──────────────────────────────────▶ year
//   ● = a published figure (bright when measured, ringed when a forecast)

import type { CountryRow, MetricSeries, SeriesYear } from '../footprint/series-types';
import { esc, formatNumber, rangeText } from '../present/format';
import { linear, niceMax, ticks } from './scale';

export interface FanOptions {
  width?: number;
  height?: number;
  /** Horizontal reference lines (e.g. countries' yearly use). */
  references?: CountryRow[];
  /** Short unit for the top tick, e.g. "TWh". */
  unit: string;
  /** Accessible name of the chart. */
  title: string;
}

const M = { l: 56, r: 112, t: 30, b: 36 };
/** Reference labels closer than this (px) are pushed apart so they never overlap. */
export const LABEL_GAP = 14;
const r1 = (n: number) => Math.round(n * 10) / 10;

type SegClass = 'measured' | 'calculated' | 'forecast';
/** A segment is solid ("measured") only when BOTH ends are published measurements. */
const segClass = (from: SeriesYear, to: SeriesYear): SegClass =>
  to.phase === 'future' ? 'forecast' : from.mid.kind === 'published' && to.mid.kind === 'published' ? 'measured' : 'calculated';

/** Consecutive points with the same class become one path ("M x,y L x,y …"). */
function runs(points: { x: number; y: number; cls: SegClass }[]): { cls: SegClass; d: string }[] {
  const out: { cls: SegClass; d: string }[] = [];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]!, b = points[i]!;
    const last = out[out.length - 1];
    if (last && last.cls === b.cls) last.d += ` L${r1(b.x)},${r1(b.y)}`;
    else out.push({ cls: b.cls, d: `M${r1(a.x)},${r1(a.y)} L${r1(b.x)},${r1(b.y)}` });
  }
  return out;
}

/** Keeps label baselines at least `gap` apart, in their original order, moving as little as possible. */
export function spreadLabels(ys: number[], gap: number): number[] {
  const order = ys.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v);
  for (let k = 1; k < order.length; k++) if (order[k]!.v - order[k - 1]!.v < gap) order[k]!.v = order[k - 1]!.v + gap;
  const out = new Array<number>(ys.length);
  for (const o of order) out[o.i] = o.v;
  return out;
}

export function fanSvg(m: MetricSeries, o: FanOptions): string {
  const W = o.width ?? 1080, H = o.height ?? 380;
  const refs = o.references ?? [];
  const years = m.years.filter((y) => y.mid.value !== null);
  if (years.length < 2) return `<svg class="fan" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.title)}: not enough data"></svg>`;
  const first = years[0]!.year, last = years[years.length - 1]!.year;
  const peak = Math.max(...years.map((y) => y.high.value ?? y.mid.value!), ...refs.map((r) => r.demandTWh));
  const top = niceMax(peak);
  const x = linear(first, last, M.l, W - M.r);
  const y = linear(0, top, H - M.b, M.t);
  const parts: string[] = [];

  // Grid and axes: hairlines, unit only on the top tick (DESIGN.md chart grammar).
  for (const t of ticks(peak)) {
    parts.push(`<line class="grid" x1="${M.l}" x2="${W - M.r}" y1="${r1(y(t))}" y2="${r1(y(t))}"/>`);
    parts.push(`<text class="tick" x="${M.l - 8}" y="${r1(y(t)) + 4}" text-anchor="end">${formatNumber(t)}</text>`);
  }
  // The unit once, above the axis, where it can't be clipped.
  parts.push(`<text class="tick unit" x="${M.l - 8}" y="${M.t - 14}" text-anchor="start">${esc(o.unit)}</text>`);
  // Year ticks at the ends and every 5 years, skipping any within 3 years of an end (they'd collide).
  const yearTicks = [first, ...[2020, 2025, 2030].filter((t) => t > first + 2 && t < last - 2), last];
  for (const t of yearTicks) parts.push(`<text class="tick" x="${r1(x(t))}" y="${H - 12}" text-anchor="middle">${t}</text>`);

  // Reference lines (countries), labelled at the right end.
  const labelYs = spreadLabels(refs.map((r) => y(r.demandTWh) + 4), LABEL_GAP);
  refs.forEach((r, i) => {
    parts.push(`<line class="ref" x1="${M.l}" x2="${W - M.r}" y1="${r1(y(r.demandTWh))}" y2="${r1(y(r.demandTWh))}"/>`);
    parts.push(`<text class="ref-label" x="${W - M.r + 8}" y="${r1(labelYs[i]!)}">${esc(r.name)}</text>`);
  });

  // Forecast range: a filled band where both edges exist; a lone dashed edge where only one was published.
  const future = years.filter((yy) => yy.year >= m.latestMeasuredYear);
  const both = future.filter((yy) => yy.low.value !== null && yy.high.value !== null);
  if (both.length >= 2) {
    const upper = both.map((yy) => `${r1(x(yy.year))},${r1(y(yy.high.value!))}`);
    const lower = [...both].reverse().map((yy) => `${r1(x(yy.year))},${r1(y(yy.low.value!))}`);
    parts.push(`<path class="band" d="M${upper.join(' L')} L${lower.join(' L')} Z"/>`);
  }
  for (const edge of ['high', 'low'] as const) {
    const pts = future.filter((yy) => yy[edge].value !== null);
    if (pts.length >= 2) parts.push(`<path class="band-edge ${edge}" d="M${pts.map((yy) => `${r1(x(yy.year))},${r1(y(yy[edge].value!))}`).join(' L')}"/>`);
  }

  // The middle line, split by how sure it is.
  const pts = years.map((yy, i) => ({ x: x(yy.year), y: y(yy.mid.value!), cls: segClass(years[Math.max(0, i - 1)]!, yy) }));
  for (const run of runs(pts)) parts.push(`<path class="line ${run.cls}" d="${run.d}"/>`);

  // Published figures as dots: filled when measured, ringed when a forecast.
  for (const yy of years.filter((p) => p.mid.kind === 'published')) {
    const cls = yy.phase === 'past' ? 'dot measured' : 'dot forecast';
    parts.push(`<circle class="${cls}" cx="${r1(x(yy.year))}" cy="${r1(y(yy.mid.value!))}" r="5"/>`);
  }
  const today = years.find((yy) => yy.year === m.latestMeasuredYear);
  if (today) parts.push(`<text class="label today" x="${r1(x(today.year)) + 8}" y="${r1(y(today.mid.value!)) - 10}">today ${formatNumber(today.mid.value!)}</text>`);
  const end = years[years.length - 1]!;
  const summary = `${o.title}. ${first} to ${last}. Today (${m.latestMeasuredYear}): ${today ? rangeText({ low: today.low.value, mid: today.mid.value!, high: today.high.value }, o.unit) : 'no figure'}. ${end.year}: ${rangeText(
    { low: end.low.value, mid: end.mid.value!, high: end.high.value },
    o.unit,
  )}. Dashed lines are calculated; the dim range is a forecast.`;

  return `<svg class="fan" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(summary)}"><title>${esc(o.title)}</title>${parts.join('')}</svg>`;
}
