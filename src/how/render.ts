// How We Know: pure functions from the same data files the site uses to escaped HTML, so this page can
// never disagree with the numbers on the main page.
//
//   constants.json ─────> "The numbers" (low / mid / high, unit, sources)
//   series.json ────────> "How it grows, year by year"
//   countries.json ─────> "The countries we compare with"
//   hubs.json ──────────> "Data-centre places" (MW range, what it measures, sources)
//   changelog.json ─────> "We changed our numbers"

import { VALUE_KEYS, type Constants, type Hub, type RangeValue, type Source } from '../footprint/types';
import type { CountriesFile, MetricSeries, SeriesFile, SeriesValue, SeriesYear } from '../footprint/series-types';
import { esc, formatNumber as num } from '../present/format';

export { esc };

export interface ChangelogEntry {
  date: string;
  constantsVersion: number;
  changes: { key: string; from: [number, number, number] | null; to: [number, number, number] }[];
  mappingChanged?: boolean;
}

function sourceList(sources: Source[]): string {
  return `<ul class="sources">${sources
    .map((s) => {
      const recheck = s.checked === 'search-summary' ? ' <span class="badge" title="We have not yet read this page itself, only a search summary of it.">needs re-checking</span>' : '';
      const note = s.note ? ` <span class="muted">(${esc(s.note)})</span>` : '';
      return `<li><a href="${esc(s.url)}" rel="noopener noreferrer">${esc(s.label)}</a> <span class="muted">· ${esc(s.supports)} · ${esc(s.retrieved)}</span>${recheck}${note}</li>`;
    })
    .join('')}</ul>`;
}

function valueRow(v: RangeValue): string {
  // On phones the unit column folds into the label (CSS), so the numbers get the room.
  return `<tr><th scope="row">${esc(v.label)}<span class="unit-inline muted"> · ${unitCell(v.unit)}</span></th><td class="num">${num(v.low)}</td><td class="num">${num(v.mid)}</td><td class="num">${num(v.high)}</td><td class="unit-col">${unitCell(v.unit)}</td></tr>
<tr class="src"><td colspan="5">${sourceList(v.sources)}</td></tr>`;
}

export function renderValues(c: Constants): string {
  return `
<h2 id="numbers">The numbers</h2>
<p>Nobody outside the AI companies can measure a single question exactly. So we start from what companies have published, add independent research, and always keep a low, middle and high estimate. Every number on the main page shows the whole range.</p>
<div class="table-wrap"><table>
<thead><tr><th scope="col">What</th><th scope="col">Low</th><th scope="col"><abbr title="Middle">Mid</abbr></th><th scope="col">High</th><th scope="col" class="unit-col">Unit</th></tr></thead>
<tbody>${VALUE_KEYS.map((k) => valueRow(c.values[k])).join('')}</tbody>
</table></div>
<p>AI's share of all data-centre electricity is the United States' 2024 share, ${num(c.values.aiShareOfDataCentres.low * 100)}–${num(c.values.aiShareOfDataCentres.high * 100)}%, used as our estimate for the world: nobody publishes a world figure in words. The real world share is probably lower.</p>
<p class="muted">Constants version ${c.constantsVersion} · ${esc(c.contentHash)} · built ${esc(c.builtAt)}</p>`;
}

export function renderHubs(hubs: Hub[]): string {
  const rows = [...hubs]
    .sort((a, b) => b.mw.mid - a.mw.mid)
    .map((h) => {
      const mw = h.mw.low === h.mw.high ? num(h.mw.mid) : `${num(h.mw.low)}–${num(h.mw.high)}`;
      return `<tr><th scope="row">${esc(h.name)}<span class="muted">, ${esc(h.country)}</span></th><td class="num">${mw}</td><td>${esc(h.measure)}</td></tr>
<tr class="src"><td colspan="3">${sourceList(h.sources)}</td></tr>`;
    })
    .join('');
  return `
<h2 id="buildings">Data-centre places</h2>
<p>Regions with many data centres, and their power capacity. Published figures measure different things, and we say which for each one.</p>
<div class="table-wrap"><table>
<thead><tr><th scope="col">Region</th><th scope="col">Megawatts</th><th scope="col">What the figure counts</th></tr></thead>
<tbody>${rows}</tbody>
</table></div>`;
}

export function renderChangelog(entries: ChangelogEntry[], c: Constants): string {
  const LABELS: Record<string, string> = Object.fromEntries(VALUE_KEYS.map((k) => [k, c.values[k].label]));
  const triple = (t: [number, number, number]) => t.map(num).join(' / ');
  const items = [...entries]
    .reverse()
    .map((e) => {
      const what =
        e.changes.length === 0
          ? '<li>Sources updated; no numbers changed.</li>'
          : e.changes
              .map((ch) =>
                ch.from
                  ? `<li>${esc(LABELS[ch.key] ?? ch.key)}: ${triple(ch.from)} → <strong>${triple(ch.to)}</strong></li>`
                  : `<li>${esc(LABELS[ch.key] ?? ch.key)}: <strong>${triple(ch.to)}</strong> (first version)</li>`,
              )
              .join('');
      const map = e.mappingChanged ? '<li>The (v1) world-health scale was re-derived.</li>' : '';
      return `<li><h3>${esc(e.date)} · version ${e.constantsVersion}</h3><ul>${what}${map}</ul></li>`;
    })
    .join('');
  return `
<h2 id="changes">We changed our numbers</h2>
<p>When better information comes out, we update. Every change is listed here, newest first. Numbers are low / middle / high.</p>
<ol class="changelog">${items}</ol>`;
}

export function renderPrivacy(): string {
  return `
<h2 id="privacy">Your privacy</h2>
<ul>
  <li>No accounts, no cookies, no tracking scripts, and nothing loaded from other companies' servers.</li>
  <li>The calculator runs in your browser. We never see what you enter.</li>
  <li>Hum's first version saved a "world" on your device; the current site removes it the next time you visit.</li>
</ul>`;
}

/** One cell value: published plain, derived marked (dotted underline + title), none as "not published". */
function cell(x: SeriesValue): string {
  // A dash keeps narrow phones readable; screen readers hear the words, and the rules list says it too.
  if (x.value === null) return '<span class="muted" aria-hidden="true">–</span><span class="sr-only">not published</span>';
  const n = num(x.value);
  return x.kind === 'derived' ? `<span class="derived" title="calculated">${n}</span>` : n;
}

function readingCells(y: SeriesYear): string {
  return `<td class="num">${cell(y.low)}</td><td class="num">${cell(y.mid)}</td><td class="num">${cell(y.high)}</td>`;
}

/** Consecutive years that share a rule, e.g. "2017–2023: Calculated back from 2024 ...". */
function ruleGroups(years: SeriesYear[]): { from: number; to: number; rule: string }[] {
  const groups: { from: number; to: number; rule: string }[] = [];
  for (const y of years) {
    const last = groups[groups.length - 1];
    if (last && last.rule === y.rule && last.to === y.year - 1) last.to = y.year;
    else groups.push({ from: y.year, to: y.year, rule: y.rule });
  }
  return groups;
}

function metricTable(m: MetricSeries, caption: string): string {
  const rows = m.years
    .map((y) => {
      const cls = y.year === m.latestMeasuredYear ? ' class="today"' : y.phase === 'future' ? ' class="future"' : '';
      return `<tr${cls}><th scope="row">${y.year}</th>${readingCells(y)}</tr>`;
    })
    .join('');
  const how = ruleGroups(m.years)
    .map((g) => `<li><strong>${g.from === g.to ? g.from : `${g.from}–${g.to}`}</strong>: ${esc(g.rule)}</li>`)
    .join('');
  return `<h3>${esc(caption)} <span class="muted">(${esc(m.unit)})</span></h3>
<div class="table-wrap" tabindex="0" role="region" aria-label="${esc(caption)}, by year"><table class="series">
<thead><tr><th scope="col">Year</th><th scope="col">Low</th><th scope="col"><abbr title="Middle">Mid</abbr></th><th scope="col">High</th></tr></thead>
<tbody>${rows}</tbody>
</table></div>
<ul class="rules">${how}</ul>
${sourceList(m.sources)}`;
}

export function renderGrowth(series: SeriesFile): string {
  const e = series.metrics.electricity, co2 = series.metrics.co2;
  return `
<h2 id="growth">How it grows, year by year</h2>
<p>Sources publish only a few years: what data centres used in 2024 and 2025, and forecasts for 2030 and 2035. We fill in the years between with plain rules and mark every filled-in number as <span class="derived">calculated</span>. Where a source gives no low estimate, we say so instead of inventing one. Years after ${e.latestMeasuredYear} are forecasts.</p>
${metricTable(e, e.label)}
${metricTable(co2, co2.label)}
<p class="muted">Series ${esc(series.contentHash)} · built ${esc(series.builtAt)}</p>`;
}

export function renderCountries(c: CountriesFile): string {
  const d = c.dataset;
  const rows = [...c.countries]
    .sort((a, b) => b.demandTWh - a.demandTWh)
    .map((r) => `<tr><th scope="row">${esc(r.name)}</th><td class="num">${num(r.demandTWh)}</td></tr>`)
    .join('');
  return `
<h2 id="countries">The countries we compare with</h2>
<p>Each country's total electricity use in ${c.year} (demand, not generation), copied from one dataset file. A check on every build downloads the file again, confirms it is the same file, and compares every number.</p>
<ul class="sources"><li><a href="${esc(d.page)}" rel="noopener noreferrer">${esc(d.name)}</a> <span class="muted">· ${esc(d.licence)} · retrieved ${esc(d.retrieved)}</span></li>
<li><span class="muted">File: <a href="${esc(d.url)}" rel="noopener noreferrer">${esc(d.url.split('/').pop()!)}</a> · sha256 <code>${esc(d.sha256.slice(0, 16))}…</code> · rows where "${esc(d.filter.sourceColumn)}" is "${esc(d.filter.sourceValue)}"</span></li></ul>
<div class="table-wrap"><table>
<thead><tr><th scope="col">Country</th><th scope="col">${c.year} use (${unitCell(c.unit)})</th></tr></thead>
<tbody>${rows}</tbody>
</table></div>`;
}

export function renderPage(c: Constants, hubs: Hub[], changelog: ChangelogEntry[], series: SeriesFile, countries: CountriesFile): string {
  return [renderValues(c), renderGrowth(series), renderCountries(countries), renderHubs(hubs), renderChangelog(changelog, c), renderPrivacy()].join('\n');
}

/** Long units like gCO2/kWh may wrap after the slash on small phones, never inside a word. */
const unitCell = (unit: string) => esc(unit).replaceAll('/', '/<wbr>');
