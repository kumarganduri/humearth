import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { esc, num, renderChangelog, renderCountries, renderGrowth, renderHubs, renderPage, renderValues, type ChangelogEntry } from './render';
import { realConstants } from '../footprint/testing';
import { VALUE_KEYS, type Hub } from '../footprint/types';

const c = realConstants();
const hubs = (JSON.parse(readFileSync('data/sources/hubs.source.json', 'utf8')) as { hubs: Hub[] }).hubs;

describe('How We Know page', () => {
  it('year by year: every year listed, calculated numbers marked, a missing low said in words', () => {
    const series = JSON.parse(readFileSync('public/data/series.json', 'utf8'));
    const h = renderGrowth(series);
    for (let y = 2017; y <= 2035; y++) expect(h).toContain(`<th scope="row">${y}</th>`);
    expect(h).toContain('<span class="derived" title="calculated">');
    expect(h).toMatch(/not published/); // CO2 has no published low
    expect(h).toMatch(/<strong>2017–2023<\/strong>: Calculated back from 2024/);
  });

  it('countries: names the dataset file, its licence and checksum, biggest first', () => {
    const countries = JSON.parse(readFileSync('public/data/countries.json', 'utf8'));
    const h = renderCountries(countries);
    expect(h).toContain('CC-BY-4.0');
    expect(h).toContain(countries.dataset.sha256.slice(0, 16));
    expect(h.indexOf('India')).toBeLessThan(h.indexOf('Netherlands'));
  });

  it('lists every value with low / middle / high and every source link', () => {
    const h = renderValues(c);
    for (const k of VALUE_KEYS) {
      expect(h).toContain(esc(c.values[k].label));
      for (const s of c.values[k].sources) expect(h).toContain(`href="${esc(s.url)}"`);
    }
  });

  it('flags sources we only saw in a search summary, and only those', () => {
    expect(renderValues(c)).not.toMatch(/needs re-checking/); // every numbers source was read (2026-10-02)
    const unverified = structuredClone(c);
    unverified.values.imageWh.sources[0]!.checked = 'search-summary';
    expect(renderValues(unverified)).toMatch(/needs re-checking/);
  });

  it('lists all hubs, biggest first, with what each figure counts', () => {
    const h = renderHubs(hubs);
    expect(h.indexOf('Northern Virginia')).toBeLessThan(h.indexOf('Santiago'));
    for (const hub of hubs) expect(h).toContain(esc(hub.measure));
    expect(h).toContain('2,552–11,300');
  });

  it('shows the change log newest first, with old → new values', () => {
    const log: ChangelogEntry[] = [
      { date: '2026-10-01', constantsVersion: 1, changes: [{ key: 'textPromptWh', from: null, to: [0.24, 0.34, 1.86] }], mappingChanged: true },
      { date: '2026-11-01', constantsVersion: 2, changes: [{ key: 'textPromptWh', from: [0.24, 0.34, 1.86], to: [0.24, 0.3, 1.86] }], mappingChanged: false },
      { date: '2026-12-01', constantsVersion: 3, changes: [], mappingChanged: false },
    ];
    const h = renderChangelog(log, c);
    expect(h.indexOf('2026-12-01')).toBeLessThan(h.indexOf('2026-11-01'));
    expect(h).toMatch(/0\.24 \/ 0\.34 \/ 1\.86 → <strong>0\.24 \/ 0\.3 \/ 1\.86<\/strong>/);
    expect(h).toMatch(/first version/);
    expect(h).toMatch(/Sources updated; no numbers changed/);
  });

  it('escapes everything that comes from data', () => {
    const evil: Hub = { ...hubs[0]!, name: '<img src=x onerror=alert(1)>', measure: '"><script>' };
    const h = renderHubs([evil]);
    expect(h).not.toContain('<img');
    expect(h).not.toContain('<script>');
    expect(esc(`<a href="x">'&`)).toBe('&lt;a href=&quot;x&quot;&gt;&#39;&amp;');
  });

  it('renders the full page from the real data files', () => {
    const log = JSON.parse(readFileSync('public/data/changelog.json', 'utf8')) as ChangelogEntry[];
    const read = <T>(p: string) => JSON.parse(readFileSync(p, 'utf8')) as T;
    const h = renderPage(c, hubs, log, read('public/data/series.json'), read('public/data/countries.json'));
    for (const id of ['numbers', 'growth', 'countries', 'buildings', 'changes', 'privacy']) expect(h).toContain(`id="${id}"`);
  });

  it('formats numbers for reading', () => {
    expect(num(0.24)).toBe('0.24');
    expect(num(1.2)).toBe('1.2');
    expect(num(944)).toBe('944');
    expect(num(11300)).toBe('11,300');
    expect(num(8.16e9)).toBe('8.16 billion');
  });
});

describe('prerendered How We Know', () => {
  it('src/how/content.generated.html is up to date with public/data (run `npm run build:data`)', () => {
    const read = <T>(p: string) => JSON.parse(readFileSync(p, 'utf8')) as T;
    const fresh = renderPage(
      read('public/data/constants.json'),
      read<{ hubs: Hub[] }>('public/data/hubs.json').hubs,
      read<ChangelogEntry[]>('public/data/changelog.json'),
      read('public/data/series.json'),
      read('public/data/countries.json'),
    );
    expect(readFileSync('src/how/content.generated.html', 'utf8')).toContain(fresh);
  });
});
