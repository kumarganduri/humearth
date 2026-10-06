import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { countryNote, firstPassed, passedFor, passedListHtml, passedShort } from './earth';
import type { HeroData } from './hero';
import type { CountriesFile, SeriesFile } from '../footprint/series-types';
import type { Constants } from '../footprint/types';

const read = <T>(p: string) => JSON.parse(readFileSync(p, 'utf8')) as T;
const d: HeroData = {
  series: read<SeriesFile>('public/data/series.json'),
  countries: read<CountriesFile>('public/data/countries.json'),
  constants: read<Constants>('public/data/constants.json'),
};
const m = d.series.metrics.electricity;

describe('passedFor: which countries data centres have passed in a year', () => {
  it('lists every compared country, smallest first', () => {
    const rows = passedFor(d, 2025);
    expect(rows).toHaveLength(d.countries.countries.length);
    expect(rows.map((r) => r.demandTWh)).toEqual([...rows.map((r) => r.demandTWh)].sort((a, b) => a - b));
  });

  it('a country is lit exactly when the middle figure for that year reaches its use', () => {
    for (const year of [2017, 2025, 2030, 2035]) {
      const mid = m.years.find((y) => y.year === year)!.mid.value!;
      for (const r of passedFor(d, year)) expect(r.on).toBe(mid >= r.demandTWh);
    }
  });

  it('more countries are passed over time, never fewer', () => {
    const counts = m.years.map((y) => passedFor(d, y.year).filter((r) => r.on).length);
    for (let i = 1; i < counts.length; i++) expect(counts[i]).toBeGreaterThanOrEqual(counts[i - 1]!);
  });

  it('the passing year is the first year at or above it, tagged published or calculated', () => {
    const france = d.countries.countries.find((c) => c.name === 'France')!;
    const when = firstPassed(m, france.demandTWh)!;
    const before = m.years.find((y) => y.year === when.year - 1);
    expect(m.years.find((y) => y.year === when.year)!.mid.value!).toBeGreaterThanOrEqual(france.demandTWh);
    if (before) expect(before.mid.value!).toBeLessThan(france.demandTWh);
    expect(firstPassed(m, 1e9)).toBeNull();
  });
});

describe('the words', () => {
  it('the list says how many are passed and marks each one for screen readers', () => {
    const html = passedListHtml(d, 2025);
    const n = passedFor(d, 2025).filter((r) => r.on).length;
    expect(html).toContain(`<span class="num" id="passed-n">${n}</span> of 15 countries passed`);
    expect(html.match(/: passed<\/span>/g)).toHaveLength(n);
    expect(html.match(/: not (yet, expected around 20\d\d|expected by 2035)<\/span>/g)).toHaveLength(15 - n);
    expect(html).toContain('<span class="sr-only">: not expected by 2035</span>'); // India
    expect(html).toMatch(/<li data-key="Japan"><span>Japan<\/span><span class="num">1,027 · ~20\d\d<\/span>/);
    expect(html).toContain('<li data-key="France" class="on">');
  });

  it('a country passed in a calculated or forecast year is drawn dim', () => {
    const html = passedListHtml(d, 2035);
    const japan = passedFor(d, 2035).find((r) => r.name === 'Japan')!;
    expect(japan.on).toBe(true);
    expect(japan.when!.year).toBeGreaterThan(m.latestMeasuredYear);
    expect(html).toContain('<li data-key="Japan" class="on calc">');
  });

  it('phones get one line', () => {
    expect(passedShort(d, 2025)).toMatch(/^Passed \d+ of 15 countries\. Biggest so far: France\.$/);
  });

  it('the tooltip: past, expected, never, and not compared', () => {
    expect(countryNote(d, 'France')).toMatch(/^<b>France<\/b> uses [\d,]+ TWh of electricity a year \(Ember, \d{4}\)\. Data centres passed it (in|by) \d{4}/);
    expect(countryNote(d, 'Japan')).toMatch(/Data centres are expected to pass it around 20\d\d/);
    expect(countryNote(d, 'India')).toContain("aren't expected to pass it by 2035");
    expect(countryNote(d, 'Chad')).toBe("<b>Chad</b>: not in Hum's comparison set yet.");
    expect(countryNote(d, '<x>')).toContain('&lt;x&gt;');
  });
});
