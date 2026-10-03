import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { futureSentence, growthWords, historyNote, ledeFor, raceFor, raceScaleMax, renderHero, RACE_COUNTRIES, pick, type HeroData } from './hero';
import type { CountriesFile, SeriesFile } from '../footprint/series-types';
import type { Constants } from '../footprint/types';

const read = <T>(p: string) => JSON.parse(readFileSync(p, 'utf8')) as T;
const data = (): HeroData => ({
  series: read<SeriesFile>('public/data/series.json'),
  countries: read<CountriesFile>('public/data/countries.json'),
  constants: read<Constants>('public/data/constants.json'),
});

describe('renderHero: the first screen, prebuilt from the shipped data', () => {
  const h = renderHero(data());

  it('opens at the latest measured year: headline, reading, race and a disabled slider (JS wakes it)', () => {
    expect(h).toContain('<h1 id="headline">');
    expect(h).toContain('<span class="mid">485</span>');
    expect(h).toContain('2025 · single published estimate (IEA)');
    expect(h).toMatch(/<input type="range" id="slider" min="2017" max="2035" step="1" value="2025" aria-label="Year" aria-valuetext="2025" disabled>/);
    expect(h).toMatch(/<button type="button" class="btn" id="play" disabled>Play 2017 to 2035<\/button>/);
    expect(h).toContain('id="slider-note" hidden');
  });

  it('has a no-JS table of every published year, forecasts labelled', () => {
    const t = h.slice(h.indexOf('<noscript>'), h.indexOf('</noscript>'));
    for (const y of ['2024', '2025', '2030 (forecast)', '2035 (forecast)']) expect(t).toContain(`<th scope="row">${y}</th>`);
    expect(t).not.toContain('2020'); // calculated years are not in the published table
  });

  it('includes the fan chart with its accessible summary and the history rule', () => {
    expect(h).toContain('<svg class="fan"');
    expect(h).toContain('2017–2023: Calculated back from 2024 at about 12% growth a year (dashed).');
  });
});

describe('sentences come from the data, never typed-in numbers', () => {
  it('lede: passed France, near Japan by 2030', () => {
    expect(ledeFor(data())).toBe("In 2025 they used about 485 TWh, more than France uses in a year. The IEA expects about 950 TWh by 2030, close to Japan's 1,030.");
  });
  it('future sentence and growth words', () => {
    expect(futureSentence(data().series.metrics.electricity)).toBe(
      "The IEA's main forecast almost doubles data-centre electricity by 2030. Its scenarios for 2035 span 700 to 1,700 TWh, so we show all of it.",
    );
    expect(growthWords(485, 950)).toBe('almost doubles');
    expect(growthWords(400, 820)).toBe('more than doubles');
    expect(growthWords(100, 300)).toBe('triples');
    expect(growthWords(100, 140)).toBe('grows by about 40%');
    expect(growthWords(100, 450)).toBe('grows about 4.5 times');
  });
  it('a history note only when there are calculated past years', () => {
    const m = data().series.metrics.electricity;
    expect(historyNote({ ...m, years: m.years.filter((y) => y.year >= 2024) })).toBe('');
  });
});

describe('race for the slider', () => {
  it('one scale for all years (bars visibly grow) and only the chosen countries', () => {
    const d = data();
    const countries = pick(d.countries.countries, RACE_COUNTRIES);
    expect(countries.map((c) => c.name)).toEqual([...RACE_COUNTRIES]);
    expect(raceScaleMax(d.series.metrics.electricity, countries)).toBe(2000);
    expect(raceFor(d, 2035)).toContain('class="row forecast dc"');
    expect(raceFor(d, 2020)).toContain('class="row calculated dc"');
  });
  it('an unknown year falls back to the latest measured year, never throws', () => {
    expect(raceFor(data(), 1999)).toContain('class="row measured dc"');
  });
});

describe('prerendered hero', () => {
  it('src/hero.generated.html is up to date with public/data (run `npm run build:data`)', () => {
    expect(readFileSync('src/hero.generated.html', 'utf8')).toContain(renderHero(data()));
  });
});
