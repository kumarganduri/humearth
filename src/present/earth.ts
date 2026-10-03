// The Earth home's words, as pure functions (the globe itself is src/globe/earth.ts). The build prerenders
// the list for the latest year, so with scripts off it still says which countries data centres have passed.
//
//   passedFor(d, year)  ->  every compared country, smallest first: lit? and the year the middle figure passed it
//   passedListHtml      ->  the "Passed so far" list (the globe's text equivalent)
//   passedShort         ->  one line for phones, where the list doesn't fit beside the globe
//   countryNote         ->  the tooltip when someone taps a country

import type { CountryRow, MetricSeries } from '../footprint/series-types';
import type { CrossingYear } from '../footprint/series';
import type { HeroData } from './hero';
import { yearOf } from './hero';
import { esc, formatNumber } from './format';

export interface PassedRow {
  name: string;
  demandTWh: number;
  /** Data centres' middle figure is at or above this country's yearly use in the chosen year. */
  on: boolean;
  /** The first year the middle figure reaches it (null = not by the last year shown). */
  when: CrossingYear | null;
}

export function firstPassed(m: MetricSeries, demandTWh: number): CrossingYear | null {
  for (const y of m.years) {
    if (y.mid.value !== null && y.mid.value >= demandTWh) return { year: y.year, kind: y.mid.kind === 'published' ? 'published' : 'derived' };
  }
  return null;
}

export function passedFor(d: HeroData, year: number): PassedRow[] {
  const m = d.series.metrics.electricity;
  const mid = yearOf(m, year).mid.value ?? 0;
  return [...d.countries.countries]
    .sort((a, b) => a.demandTWh - b.demandTWh)
    .map((c: CountryRow) => ({ name: c.name, demandTWh: c.demandTWh, on: mid >= c.demandTWh, when: firstPassed(m, c.demandTWh) }));
}

/** "2023", "by 2017" (already above it in the first year shown), or "" when not passed. */
export function whenWords(m: MetricSeries, when: CrossingYear | null): string {
  if (!when) return '';
  return when.year === m.years[0]!.year ? `by ${when.year}` : String(when.year);
}

export function passedListHtml(d: HeroData, year: number): string {
  const m = d.series.metrics.electricity;
  const rows = passedFor(d, year);
  const n = rows.filter((r) => r.on).length;
  const items = rows
    .map((r) => {
      const cls = r.on ? (r.when?.kind === 'derived' || r.when!.year > m.latestMeasuredYear ? 'on calc' : 'on') : '';
      // Not yet passed: the year the middle figure is expected to pass it, so the list carries everything the
      // globe's tap notes say (keyboard and screen-reader users get the same facts).
      const when = r.on ? ` · ${whenWords(m, r.when)}` : r.when ? ` · ~${r.when.year}` : '';
      const said = r.on ? 'passed' : r.when ? `not yet, expected around ${r.when.year}` : `not expected by ${m.years[m.years.length - 1]!.year}`;
      return `<li data-key="${esc(r.name)}"${cls ? ` class="${cls}"` : ''}><span>${esc(r.name)}</span><span class="num">${formatNumber(r.demandTWh)}${when}</span><span class="sr-only">: ${said}</span></li>`;
    })
    .join('');
  return `<p class="passed-count"><span class="num" id="passed-n">${n}</span> of ${rows.length} countries passed</p><ol class="passed-list">${items}</ol>`;
}

/** For the slider's aria-valuetext: "8 of 15 countries passed". */
export function passedCount(d: HeroData, year: number): string {
  const rows = passedFor(d, year);
  return `${rows.filter((r) => r.on).length} of ${rows.length} countries passed`;
}

export function passedShort(d: HeroData, year: number): string {
  const rows = passedFor(d, year);
  const on = rows.filter((r) => r.on);
  const latest = on[on.length - 1];
  return latest ? `Passed ${on.length} of ${rows.length} countries. Biggest so far: ${latest.name}.` : `Not yet past any of the ${rows.length} countries.`;
}

/** Tooltip for a tapped country. Countries outside the comparison set say so instead of guessing. */
export function countryNote(d: HeroData, name: string): string {
  const c = d.countries.countries.find((x) => x.name === name);
  if (!c) return `<b>${esc(name)}</b>: not in Hum's comparison set yet.`;
  const m = d.series.metrics.electricity;
  const when = firstPassed(m, c.demandTWh);
  const head = `<b>${esc(c.name)}</b> uses ${formatNumber(c.demandTWh)} TWh of electricity a year (Ember, ${d.countries.year}).`;
  if (!when) return `${head} Data centres aren't expected to pass it by ${m.years[m.years.length - 1]!.year} (middle forecast).`;
  const calc = when.kind === 'derived' ? ' (a calculated year)' : '';
  if (when.year <= m.latestMeasuredYear) return `${head} Data centres passed it ${when.year === m.years[0]!.year ? 'by' : 'in'} ${when.year}${calc}.`;
  return `${head} Data centres are expected to pass it around ${when.year}${calc}.`;
}
