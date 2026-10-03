// The country race (eng review D9): data centres among real countries, for one year. Pure; returns rows
// (tested) and an HTML string (prebuilt at build time, re-rendered by the slider). Rows are keyed so the
// page can move them with transforms instead of rebuilding (DESIGN.md: 350ms reorder).
//
//   data centres  ███████████▒▒░░░  ← bright = measured, dashed = calculated, dim = forecast; ░ range band
//                 └ AI slice ┘       only in the latest measured year (share is a 2024 US figure)
//   Japan         ██████████████

import type { CountryRow, SeriesYear } from '../footprint/series-types';
import { esc, formatNumber, rangeWords } from '../present/format';

export type BarKind = 'measured' | 'calculated' | 'forecast' | 'country';

export interface RaceRow {
  key: string;
  label: string;
  value: number;
  kind: BarKind;
  /** Range band for the data-centre bar (null when single estimate or unpublished). */
  band: { low: number; high: number } | null;
  /** AI's share of the data-centre bar, as fractions; only in the latest measured year. */
  ai: { low: number; mid: number; high: number } | null;
}

export interface RaceInput {
  year: SeriesYear;
  latestMeasuredYear: number;
  aiShare: { low: number; mid: number; high: number };
  countries: CountryRow[];
}

export const DATA_CENTRES_KEY = 'data-centres';

export function barKind(y: SeriesYear): BarKind {
  if (y.phase === 'future') return 'forecast';
  return y.mid.kind === 'published' ? 'measured' : 'calculated';
}

/** Sorted, biggest first. Ties keep data centres above the country. */
export function raceRows(input: RaceInput): RaceRow[] {
  const { year: y } = input;
  const mid = y.mid.value ?? 0;
  const lo = y.low.value, hi = y.high.value;
  const hasBand = lo !== null && hi !== null && (lo !== mid || hi !== mid);
  const dc: RaceRow = {
    key: DATA_CENTRES_KEY,
    label: 'Data centres',
    value: mid,
    kind: barKind(y),
    band: hasBand ? { low: lo!, high: hi! } : null,
    ai: y.year === input.latestMeasuredYear ? input.aiShare : null,
  };
  const countries: RaceRow[] = input.countries.map((c) => ({
    key: `country-${c.name.toLowerCase().replace(/[^a-z]+/g, '-')}`,
    label: c.name,
    value: c.demandTWh,
    kind: 'country',
    band: null,
    ai: null,
  }));
  return [dc, ...countries].sort((a, b) => b.value - a.value || (a.key === DATA_CENTRES_KEY ? -1 : 1));
}

const pct = (v: number, max: number) => `${Math.max(0, Math.min(100, (v / max) * 100)).toFixed(2)}%`;

/** One <li> per row; widths are percentages of scaleMax so bars grow as the slider moves. */
export function raceHtml(rows: RaceRow[], scaleMax: number, unit = 'TWh'): string {
  const items = rows
    .map((r) => {
      const width = pct(r.value, scaleMax);
      // Paint order: range band behind, the bar, then the AI slice on top of the bar's end.
      let band = '';
      let ai = '';
      let sr = `${r.label}: ${formatNumber(r.value)} ${unit}`;
      if (r.key === DATA_CENTRES_KEY) {
        if (r.band) {
          band = `<span class="band" style="left:${pct(r.band.low, scaleMax)};width:${pct(r.band.high - r.band.low, scaleMax)}"></span>`;
          sr = `Data centres: ${rangeWords({ low: r.band.low, mid: r.value, high: r.band.high }, unit)}`;
        }
        if (r.ai) {
          const aiW = (r.value * r.ai.mid) / scaleMax;
          ai = `<span class="ai" style="left:calc(${pct(r.value, scaleMax)} - ${(aiW * 100).toFixed(2)}%);width:${(aiW * 100).toFixed(2)}%"></span>`;
          sr += `, of which AI about ${formatNumber(r.ai.low * 100)} to ${formatNumber(r.ai.high * 100)}%`;
        }
        if (r.kind === 'calculated' || r.kind === 'forecast') sr += ` (${r.kind === 'forecast' ? 'forecast' : 'calculated'})`;
      }
      return `<li class="row ${r.kind}${r.key === DATA_CENTRES_KEY ? ' dc' : ''}" data-key="${esc(r.key)}"><span class="name">${esc(r.label)}</span><span class="bar" aria-hidden="true">${band}<span class="fill" style="width:${width}"></span>${ai}</span><span class="v num" aria-hidden="true">${formatNumber(r.value)}</span><span class="sr-only">${esc(sr)}</span></li>`;
    })
    .join('');
  return `<ol class="race" aria-label="Electricity use in a year: data centres compared with countries">${items}</ol>`;
}
