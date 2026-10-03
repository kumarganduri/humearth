// The first screen (eng review D4) and "Where it's heading", as pure HTML. `npm run build:data` writes
// src/hero.generated.html from exactly the data the site ships, and vite inlines it into index.html,
// so the scale shock is in the very first paint, even with JavaScript off. main.ts then wakes the slider
// and re-renders the same pieces with the same functions.

import type { CountriesFile, CountryRow, MetricSeries, SeriesFile, SeriesYear } from '../footprint/series-types';
import type { Constants } from '../footprint/types';
import { crossing } from '../footprint/series';
import { raceHtml, raceRows } from '../charts/race';
import { fanSvg } from '../charts/fan';
import { niceMax } from '../charts/scale';
import { esc, formatNumber, readingHtml } from './format';
import { calculatorHtml } from './calculator';
import { impactsHtml, whereItGoesHtml } from './story';

/** Countries shown in the race: the ones data centres pass (or approach) between 2017 and 2035. */
export const RACE_COUNTRIES = ['Russia', 'Japan', 'Canada', 'Germany', 'France', 'United Kingdom', 'Netherlands'] as const;
/** Reference lines on the fan chart. */
export const FAN_COUNTRIES = ['Japan', 'Germany', 'France'] as const;

export const UNIT = 'TWh a year';
export const UNIT_WORDS = 'terawatt-hours a year';
export const SOURCE = 'IEA';

export interface HeroData {
  series: SeriesFile;
  countries: CountriesFile;
  constants: Constants;
}

const aiShareOf = (d: HeroData) => d.constants.values.aiShareOfDataCentres;

export const pick = (all: CountryRow[], names: readonly string[]) =>
  names.map((n) => all.find((c) => c.name === n)).filter((c): c is CountryRow => Boolean(c));

/** One scale for every year, so bars visibly grow as the slider moves. */
export function raceScaleMax(m: MetricSeries, countries: CountryRow[]): number {
  return niceMax(Math.max(...m.years.map((y) => y.high.value ?? y.mid.value ?? 0), ...countries.map((c) => c.demandTWh)));
}

export function yearOf(m: MetricSeries, year: number): SeriesYear {
  return m.years.find((y) => y.year === year) ?? m.years.find((y) => y.year === m.latestMeasuredYear)!;
}

/** The race for one year, as HTML. Used by the build and by the slider. */
export function raceFor(d: HeroData, year: number): string {
  const m = d.series.metrics.electricity;
  const countries = pick(d.countries.countries, RACE_COUNTRIES);
  const rows = raceRows({ year: yearOf(m, year), latestMeasuredYear: m.latestMeasuredYear, aiShare: aiShareOf(d), countries });
  return raceHtml(rows, raceScaleMax(m, countries), 'TWh');
}

export const readingFor = (d: HeroData, year: number) => readingHtml(yearOf(d.series.metrics.electricity, year), UNIT, UNIT_WORDS, SOURCE);

/** "In 2025 they used about 485 TWh: more than France. The IEA expects about 950 TWh by 2030, close to Japan." */
export function ledeFor(d: HeroData): string {
  const m = d.series.metrics.electricity;
  const today = yearOf(m, m.latestMeasuredYear);
  const all = d.countries.countries;
  const passed = [...all]
    .filter((c) => crossing(m, c.name, c.demandTWh).already)
    .sort((a, b) => b.demandTWh - a.demandTWh)[0];
  const forecast = m.years.find((y) => y.phase === 'future' && y.mid.kind === 'published');
  const near = forecast
    ? [...all].sort((a, b) => Math.abs(a.demandTWh - forecast.mid.value!) - Math.abs(b.demandTWh - forecast.mid.value!))[0]
    : undefined;
  const first = `In ${today.year} they used about ${formatNumber(today.mid.value!)} TWh${passed ? `, more than ${passed.name} uses in a year` : ''}.`;
  const second = forecast
    ? ` The ${SOURCE} expects about ${formatNumber(forecast.mid.value!)} TWh by ${forecast.year}${near ? `, close to ${near.name}'s ${formatNumber(near.demandTWh)}` : ''}.`
    : '';
  return first + second;
}

/** "The IEA's main forecast almost doubles it by 2030. Its scenarios for 2035 span 700 to 1,700 TWh, so we show all of it." */
export function futureSentence(m: MetricSeries): string {
  const today = yearOf(m, m.latestMeasuredYear);
  const next = m.years.find((y) => y.phase === 'future' && y.mid.kind === 'published');
  const end = m.years[m.years.length - 1]!;
  const a = next ? `The ${SOURCE}'s main forecast ${growthWords(today.mid.value!, next.mid.value!)} data-centre electricity by ${next.year}.` : '';
  const b =
    end.low.value !== null && end.high.value !== null
      ? ` Its scenarios for ${end.year} span ${formatNumber(end.low.value)} to ${formatNumber(end.high.value)} TWh, so we show all of it.`
      : '';
  return (a + b).trim();
}

/** The rule for the calculated years before the first published figure, from series.json (dashed on the chart). */
export function historyNote(m: MetricSeries): string {
  const back = m.years.filter((y) => y.mid.kind === 'derived' && y.phase === 'past');
  if (!back.length) return '';
  return `${back[0]!.year}–${back[back.length - 1]!.year}: ${back[0]!.rule} (dashed).`;
}

function noscriptTable(m: MetricSeries): string {
  const rows = m.years
    .filter((y) => y.mid.kind === 'published')
    .map((y) => {
      const r = [y.low, y.mid, y.high].map((v) => (v.value === null ? '–' : formatNumber(v.value)));
      return `<tr><th scope="row">${y.year}${y.phase === 'future' ? ' (forecast)' : ''}</th><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`;
    })
    .join('');
  return `<noscript><table class="static"><caption>Data-centre electricity, published figures (${esc(UNIT)})</caption><thead><tr><th scope="col">Year</th><th scope="col">Low</th><th scope="col">Mid</th><th scope="col">High</th></tr></thead><tbody>${rows}</tbody></table></noscript>`;
}

/** "almost doubles", "more than doubles", "triples", or "grows by 40%": from the numbers, never typed in. */
export function growthWords(from: number, to: number): string {
  const r = to / from;
  if (r >= 2.9 && r < 3.1) return 'triples';
  if (r >= 2.5) return `grows about ${formatNumber(r)} times`;
  if (r >= 2) return 'more than doubles';
  if (r >= 1.85) return 'almost doubles';
  return `grows by about ${Math.round((r - 1) * 100)}%`;
}

export function renderHero(d: HeroData): string {
  const m = d.series.metrics.electricity;
  const latest = m.latestMeasuredYear;
  const share = `${formatNumber(aiShareOf(d).low * 100)}–${formatNumber(aiShareOf(d).high * 100)}%`;
  const fan = fanSvg(m, { unit: 'TWh', title: "Data-centre electricity, measured and forecast", references: pick(d.countries.countries, FAN_COUNTRIES) });
  return `<section class="poster" aria-labelledby="headline">
  <div class="poster-text">
    <h1 id="headline">The world's <span class="dc">data centres</span> already use as much electricity as a country. <span class="ai">AI</span> is the <span class="nowrap">fastest-growing</span> part.</h1>
    <div id="reading">${readingFor(d, latest)}</div>
    <p class="lede">${esc(ledeFor(d))}</p>
  </div>
  <div class="poster-chart">
    <div id="race">${raceFor(d, latest)}</div>
    <p class="ai-note"><span class="ai-key" aria-hidden="true"></span>AI's part, about ${share}: the United States' share, used as a world estimate.</p>
    <div class="controls">
      <output class="year num" id="year" for="slider">${latest}</output>
      <input type="range" id="slider" min="${m.years[0]!.year}" max="${m.years[m.years.length - 1]!.year}" step="1" value="${latest}" aria-label="Year" aria-valuetext="${latest}" disabled>
      <button type="button" class="btn" id="play" disabled>Play ${m.years[0]!.year} to ${m.years[m.years.length - 1]!.year}</button>
    </div>
    <p class="note" id="slider-note" hidden>The year slider couldn't load. The numbers above are for ${latest}.</p>
    ${noscriptTable(m)}
    <p class="src">Data centres: ${esc(SOURCE)}, Energy and AI (2025) and its 2026 update. Countries: Ember (${d.countries.year}). Dashed means calculated; dim means forecast. <a href="/how-we-know.html#growth">How we know</a></p>
  </div>
</section>
<section class="col" aria-labelledby="heading-future">
  <h2 id="heading-future">Where it's heading</h2>
  <p>${esc(futureSentence(m))} The bright line is measured; the dim range hasn't happened yet.</p>
</section>
<figure class="fanwrap">${fan}<figcaption class="src">${esc(historyNote(m))} Country lines show each country's electricity use in ${d.countries.year}. <a href="/how-we-know.html#growth">Every year, and how we got it</a></figcaption></figure>
${whereItGoesHtml(d)}
${impactsHtml(d)}
${calculatorHtml(d.constants)}`;
}
