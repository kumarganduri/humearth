import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { DATA_CENTRES_KEY, barKind, raceHtml, raceRows } from './race';
import type { CountriesFile, SeriesFile, SeriesYear } from '../footprint/series-types';

const series = JSON.parse(readFileSync('public/data/series.json', 'utf8')) as SeriesFile;
const countries = (JSON.parse(readFileSync('public/data/countries.json', 'utf8')) as CountriesFile).countries;
const e = series.metrics.electricity;
const at = (year: number) => e.years.find((y) => y.year === year)!;
const AI = { low: 0.265, mid: 0.32, high: 0.38 };
const input = (y: SeriesYear) => ({ year: y, latestMeasuredYear: e.latestMeasuredYear, aiShare: AI, countries });

describe('raceRows: one year of the race', () => {
  it('2025: data centres (485) sit just above France (481), below Germany (517)', () => {
    const rows = raceRows(input(at(2025)));
    const keys = rows.map((r) => r.label);
    expect(keys.indexOf('Germany')).toBeLessThan(keys.indexOf('Data centres'));
    expect(keys.indexOf('Data centres')).toBeLessThan(keys.indexOf('France'));
    expect(rows.every((r, i) => i === 0 || rows[i - 1]!.value >= r.value)).toBe(true);
  });

  it('kinds: measured (2025), calculated history (2020), forecast (2030)', () => {
    expect(barKind(at(2025))).toBe('measured');
    expect(barKind(at(2020))).toBe('calculated');
    expect(barKind(at(2030))).toBe('forecast');
  });

  it('the range band appears only when the year has a real range; the AI slice only in the latest measured year', () => {
    const dc = (y: number) => raceRows(input(at(y))).find((r) => r.key === DATA_CENTRES_KEY)!;
    expect(dc(2025).band).toBeNull(); // single estimate
    expect(dc(2025).ai).toEqual(AI);
    expect(dc(2035).band).toEqual({ low: 700, high: 1700 });
    expect(dc(2035).ai).toBeNull();
    expect(dc(2024).ai).toBeNull();
  });

  it('a tie keeps data centres above the country', () => {
    const y = { ...at(2025), mid: { value: 480.57, kind: 'published' as const } };
    const rows = raceRows({ ...input(y), countries: [{ name: 'France', demandTWh: 480.57 }] });
    expect(rows[0]!.key).toBe(DATA_CENTRES_KEY);
  });
});

describe('raceHtml', () => {
  it('keyed rows, widths as % of the scale, classes that carry the honesty rules', () => {
    const h = raceHtml(raceRows(input(at(2030))), 2000);
    expect(h).toContain('data-key="data-centres"');
    expect(h).toContain('class="row forecast dc"');
    expect(h).toContain('style="width:47.50%"'); // 950 / 2000
    expect(h).toContain('class="band"');
    expect(h).toContain('data-key="country-south-korea"');
  });

  it('screen readers hear every bar with its value, the range and the AI share', () => {
    const h = raceHtml(raceRows(input(at(2025))), 2000);
    expect(h).toContain('<span class="sr-only">Data centres: 485 TWh, of which AI about 26.5 to 38%</span>');
    expect(raceHtml(raceRows(input(at(2035))), 2000)).toContain('Data centres: about 1,200 TWh, between 700 and 1,700 (forecast)');
  });

  it('paints the AI slice after the bar so it is visible (band behind, bar, then AI)', () => {
    const h = raceHtml(raceRows(input(at(2025))), 2000);
    const dc = h.slice(h.indexOf('data-key="data-centres"'));
    expect(dc.indexOf('class="fill"')).toBeLessThan(dc.indexOf('class="ai"'));
  });

  it('widths are clamped to 0–100% and labels are escaped', () => {
    const rows = raceRows({ ...input(at(2025)), countries: [{ name: '<img src=x>', demandTWh: 99999 }] });
    const h = raceHtml(rows, 2000);
    expect(h).toContain('width:100.00%');
    expect(h).not.toContain('<img');
  });
});
