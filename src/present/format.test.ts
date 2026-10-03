import { describe, expect, it } from 'vitest';
import { captionFor, esc, formatNumber, rangeText, rangeWords, readingHtml } from './format';
import type { SeriesYear } from '../footprint/series-types';

describe('formatNumber: one rule everywhere', () => {
  it.each([
    [0, '0'],
    [0.24, '0.24'],
    [0.34, '0.34'],
    [1.86, '1.86'],
    [2.9, '2.9'],
    [25.3, '25.3'],
    [90, '90'],
    [99.95, '100'],
    [485, '485'],
    [480.57, '481'],
    [944, '944'],
    [1029.97, '1,030'],
    [11300, '11,300'],
    [8.2e9, '8.2 billion'],
    [8.16e9, '8.16 billion'],
    [-12.5, '-12.5'],
  ])('%s -> %s', (n, out) => expect(formatNumber(n)).toBe(out));

  it('never prints NaN or Infinity', () => {
    expect(formatNumber(Number.NaN)).toBe('–');
    expect(formatNumber(Infinity)).toBe('–');
  });
});

describe('rangeText / rangeWords: a range, never a lone number unless it is a single estimate', () => {
  it('a full range, a single estimate, and a missing low', () => {
    expect(rangeText({ low: 700, mid: 1200, high: 1700 }, 'TWh')).toBe('700 · 1,200 · 1,700 TWh');
    expect(rangeText({ low: 485, mid: 485, high: 485 }, 'TWh')).toBe('485 TWh');
    expect(rangeText({ low: null, mid: 350, high: 500 }, 'Mt')).toBe('– · 350 · 500 Mt');
  });
  it('reads naturally for screen readers', () => {
    expect(rangeWords({ low: 700, mid: 1200, high: 1700 }, 'terawatt-hours')).toBe('about 1,200 terawatt-hours, between 700 and 1,700');
    expect(rangeWords({ low: 485, mid: 485, high: 485 }, 'terawatt-hours')).toBe('about 485 terawatt-hours');
    expect(rangeWords({ low: null, mid: 350, high: 500 }, 'million tonnes')).toBe('about 350 million tonnes, up to 500; no published low');
  });
});

const year = (over: Partial<SeriesYear>): SeriesYear => ({
  year: 2025,
  phase: 'past',
  low: { value: 485, kind: 'published' },
  mid: { value: 485, kind: 'published' },
  high: { value: 485, kind: 'published' },
  rule: '',
  ...over,
});

describe('captionFor: how this year was obtained, in a few words', () => {
  it('single published estimate, published forecast, calculated past and future, none', () => {
    expect(captionFor(year({}), 'IEA')).toBe('2025 · single published estimate (IEA)');
    expect(captionFor(year({ year: 2035, phase: 'future', low: { value: 700, kind: 'published' }, high: { value: 1700, kind: 'published' } }), 'IEA')).toBe(
      '2035 · published forecast (IEA)',
    );
    expect(captionFor(year({ year: 2020, mid: { value: 264, kind: 'derived' } }))).toBe('2020 · calculated from the published growth rate');
    expect(captionFor(year({ year: 2028, phase: 'future', mid: { value: 726, kind: 'derived' } }))).toBe('2028 · calculated between published forecasts');
    expect(captionFor(year({ mid: { value: null, kind: 'none' } }))).toBe('2025 · no published figure');
  });
});

describe('readingHtml: the range reading component', () => {
  it('single estimate shows only the middle; screen readers get the sentence', () => {
    const h = readingHtml(year({}), 'TWh a year', 'terawatt-hours', 'IEA');
    expect(h).toContain('<span class="mid">485</span>');
    expect(h).not.toContain('class="lo');
    expect(h).toContain('<span class="sr-only">2025: about 485 terawatt-hours.</span>');
    expect(h).toContain('single published estimate (IEA)');
  });
  it('a forecast range marks calculated parts and the forecast phase; a missing low is a dash', () => {
    const h = readingHtml(
      year({ year: 2030, phase: 'future', low: { value: 592.5, kind: 'derived' }, mid: { value: 950, kind: 'published' }, high: { value: null, kind: 'none' } }),
      'TWh',
      'terawatt-hours',
    );
    expect(h).toContain('class="reading forecast"');
    expect(h).toContain('<span class="lo derived">593</span>');
    expect(h).toContain('<span class="hi none" aria-hidden="true">–</span>');
  });
  it('escapes units and sources', () => {
    expect(readingHtml(year({}), '<b>', 'x', '"><script>')).not.toMatch(/<b>|<script>/);
    expect(esc(`<a href="x">'&`)).toBe('&lt;a href=&quot;x&quot;&gt;&#39;&amp;');
  });
});
