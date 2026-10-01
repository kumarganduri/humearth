import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { esc, num, renderChangelog, renderHubs, renderMapping, renderPage, renderValues, type ChangelogEntry } from './render';
import { realConstants } from '../footprint/testing';
import { VALUE_KEYS, type Hub } from '../footprint/types';

const c = realConstants();
const hubs = (JSON.parse(readFileSync('data/sources/hubs.source.json', 'utf8')) as { hubs: Hub[] }).hubs;

describe('How We Know page', () => {
  it('publishes the health mapping: k, the baseline and both promises (OV #1)', () => {
    const h = renderMapping(c);
    expect(h).toContain(num(c.mapping.k));
    expect(h).toMatch(/a scale we designed/);
    expect(h).toMatch(/975 Wh a week/);
    expect(h).toMatch(/50\+ times a day/);
  });

  it('lists every value with low / middle / high and every source link', () => {
    const h = renderValues(c);
    for (const k of VALUE_KEYS) {
      expect(h).toContain(esc(c.values[k].label));
      for (const s of c.values[k].sources) expect(h).toContain(`href="${esc(s.url)}"`);
    }
  });

  it('flags sources we only saw in a search summary', () => {
    expect(renderValues(c)).toMatch(/needs re-checking/);
  });

  it('lists all hubs, biggest first, with what each figure counts', () => {
    const h = renderHubs(hubs);
    expect(h.indexOf('Northern Virginia')).toBeLessThan(h.indexOf('Santiago'));
    for (const hub of hubs) expect(h).toContain(esc(hub.measure));
    expect(h).toContain('3,046–11,300');
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
    const h = renderPage(c, hubs, log);
    for (const id of ['health', 'numbers', 'buildings', 'changes', 'privacy']) expect(h).toContain(`id="${id}"`);
  });

  it('formats numbers for reading', () => {
    expect(num(0.24)).toBe('0.24');
    expect(num(1.2)).toBe('1.2');
    expect(num(944)).toBe('944');
    expect(num(11300)).toBe('11,300');
    expect(num(8.16e9)).toBe('8.16 billion');
  });
});
