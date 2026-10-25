import { describe, expect, it } from 'vitest';
import { archiveAgeDays, collectQuotes, decide, DOWN_WEEKS, dropRunningHeaders, htmlText, issueBody, lacksArticle, looksBlocked, matchQuote, quotesInLabel, readState, type Result } from './freshness';

// Saved fragments of real pages Hum quotes (trimmed), so the matcher is tested against what sites actually serve.
const BLOGGER = `<html><head><script>var x = "Together with other work";</script></head><body><noscript><div class="post-body">The servers it touches each work on it for just a few thousandths of a second. Together with other work performed before your search even starts (such as building the search index) this amounts to 0.0003 kWh of energy per search, or 1 kJ.&nbsp; For comparison…</div></noscript></body></html>`;
const WIKI = `<p>2,500,000&nbsp;L (2,500&nbsp;m<sup>3</sup>; 660,000&nbsp;US&nbsp;gal), assuming a nominal depth of 2&nbsp;m.</p>`;
const EIA = `<td>U.S. utility-scale net electricity generation and resulting CO<sub>2</sub> emissions by fuel in 2023</td>`;
const HF = `<p>we can see a huge difference: between <strong>150 and 700 times</strong> more energy used by the same model with reasoning enabled compared to without:</p>`;
const MATHML = `<p>generating a single short video with WAN2.1–T2V–1.3B consumes nearly <math><mo>∼</mo><annotation encoding="application/x-tex">\\sim</annotation></math>90 Wh.</p>`;
const EPOCH = `<p>The average US household <sup>2</sup> uses 10,500 kilowatt-hours of electricity per year, or over 28,000 watt-hours per day.</p>`;

describe('matchQuote', () => {
  it('finds quotes through HTML noise: noscript articles, entities, sub/superscripts, MathML', () => {
    expect(matchQuote(htmlText(BLOGGER), 'Together with other work performed before your search even starts (such as building the search index) this amounts to 0.0003 kWh of energy per search, or 1 kJ.')).toBe('found');
    expect(matchQuote(htmlText(WIKI), '2,500,000 L (2,500 m3; 660,000 US gal), assuming a nominal depth of 2 m.')).toBe('found');
    expect(matchQuote(htmlText(EIA), 'U.S. utility-scale net electricity generation and resulting CO 2 emissions by fuel in 2023')).toBe('found');
    expect(matchQuote(htmlText(MATHML), 'generating a single short video with WAN2.1–T2V–1.3B consumes nearly ∼90 Wh')).toBe('found');
  });
  it('lets a quote end in a full stop the page doesn’t have, and skip words with an ellipsis', () => {
    expect(matchQuote(htmlText(HF), 'between 150 and 700 times more energy used by the same model with reasoning enabled compared to without.')).toBe('found');
    expect(matchQuote(htmlText(EPOCH), 'The average US household … uses 10,500 kilowatt-hours of electricity per year, or over 28,000 watt-hours per day.')).toBe('found');
    expect(matchQuote(htmlText(EPOCH), 'The average US household uses 10,500 kilowatt-hours of electricity per year')).toBe('changed'); // the footnote marker
  });
  it('says "changed" when a figure is still there but the wording moved, and "missing" when it is gone', () => {
    const page = 'Data centres accounted for roughly 1.5% of global electricity use in 2024, about 415 TWh.';
    expect(matchQuote(page, 'Data centres accounted for around 1.5% of the world’s electricity consumption in 2024, or 415 terawatt-hours (TWh).')).toBe('changed');
    expect(matchQuote(page, 'Data centres accounted for around 1.7% of the world’s electricity consumption in 2024, or 460 terawatt-hours (TWh).')).toBe('missing');
    expect(matchQuote('Our methodology page has moved.', 'the median Gemini Apps text prompt uses 0.24 watt-hours (Wh) of energy')).toBe('missing');
  });
});

describe('PDF text', () => {
  it('drops running headers that cross a sentence at a page break', () => {
    const pages = [1, 2, 3].map((n) => [`Ordinance No. 5033 Page ${n}`, n === 2 ? 'from the Data Center (as determined by a third-party acoustic' : 'Text.']);
    pages[2]!.splice(1, 0, 'engineer) from exceeding the ambient noise levels');
    const text = dropRunningHeaders(pages);
    expect(text).not.toContain('Ordinance No.');
    expect(matchQuote(text, '(as determined by a third-party acoustic engineer) from exceeding the ambient noise levels')).toBe('found');
  });
  it('removes e-signature stamps', () => {
    expect(dropRunningHeaders([['acoustic DocuSign Envelope ID: A7E42978-D6B7-49C6-A7BD-F602DBAB151F engineer']])).not.toContain('DocuSign');
  });
});

describe('collectQuotes', () => {
  it('takes quotes from answer sources and from labels, skips dataset rows and search summaries, and dedupes', () => {
    const files = {
      answers: { sources: {
        a: { quote: 'a quote that is long enough', url: 'https://x.org/a', checked: 'page' },
        b: { quote: 'a quote that is long enough', url: 'https://x.org/a', checked: 'page' },
        row: { quote: 'France, 2025, 480.6 TWh data row', url: 'https://ember.org/', checked: 'dataset' },
      } },
      constants: { values: { v: { sources: [
        { label: 'IEA (2025): "Data centres accounted for around 1.5%" and "a second quoted phrase"', url: 'https://iea.org/r', checked: 'page' },
        { label: 'Something: "only from a search summary page"', url: 'https://y.org', checked: 'search-summary' },
      ] } } },
    };
    const q = collectQuotes(files);
    expect(q.map((x) => x.quote)).toEqual(['a quote that is long enough', 'Data centres accounted for around 1.5%', 'a second quoted phrase']);
    expect(quotesInLabel('Ember: “Emissions intensity dropped by 2.3% to 473 grams”')).toEqual(['Emissions intensity dropped by 2.3% to 473 grams']);
  });
  it('finds every real quote Hum relies on', async () => {
    const { readFileSync, readdirSync } = await import('node:fs');
    const files = Object.fromEntries(readdirSync('data/sources').filter((f) => f.endsWith('.source.json')).map((f) => [f, JSON.parse(readFileSync(`data/sources/${f}`, 'utf8'))]));
    const q = collectQuotes(files);
    expect(q.length).toBeGreaterThan(150);
    expect(q.every((x) => x.url.startsWith('https://'))).toBe(true);
  });
});

describe('decide: what goes in the issue', () => {
  const base = { key: 'k', where: 'answers:sources.k', quote: 'q' };
  const r = (url: string, status: Result['status']): Result => ({ ...base, url, status });

  it('puts missing and changed quotes in the issue at once', () => {
    const d = decide([r('https://a', 'found'), r('https://b', 'missing'), r('https://c', 'changed')], { downWeeks: {} }, '2026-10-26');
    expect(d.problems.map((p) => p.status)).toEqual(['missing', 'changed']);
    expect(d.counts).toEqual({ found: 1, changed: 1, missing: 1, down: 0 });
  });
  it(`keeps a down page out of the issue until it has been down ${DOWN_WEEKS} weeks in a row`, () => {
    let state = { downWeeks: {} as Record<string, number> };
    for (let week = 1; week <= DOWN_WEEKS; week++) {
      const d = decide([r('https://cbre.com/x', 'down')], state, `2026-11-0${week}`);
      expect(d.problems.length).toBe(week >= DOWN_WEEKS ? 1 : 0);
      expect(d.downNotYet.length).toBe(week >= DOWN_WEEKS ? 0 : 1);
      state = d.state;
    }
    expect(decide([r('https://cbre.com/x', 'found')], state, '2026-11-30').state.downWeeks).toEqual({}); // back up: the count resets
    const again = decide([r('https://cbre.com/y', 'down')], { downWeeks: { 'https://cbre.com/y': 1 }, lastRun: '2026-12-07' }, '2026-12-07');
    expect(again.state.downWeeks['https://cbre.com/y']).toBe(1); // a re-run the same day isn't another week
  });
  it('keeps its state in the issue body, and reads it back', () => {
    const d = decide([r('https://cbre.com/x', 'down')], { downWeeks: { 'https://cbre.com/x': 1 } }, '2026-10-26');
    const body = issueBody(d, '2026-10-26');
    expect(readState(body).downWeeks).toEqual({ 'https://cbre.com/x': 2 });
    expect(readState('no state here')).toEqual({ downWeeks: {} });
    expect(issueBody(decide([r('https://a', 'found')], { downWeeks: {} }, '2026-10-26'), '2026-10-26')).toContain('Nothing to do');
  });
});

describe('looksBlocked', () => {
  it('treats errors and bot challenges as down, not as a missing quote', () => {
    expect(looksBlocked(403, '')).toBe(true);
    expect(looksBlocked(200, '<title>Just a moment...</title>')).toBe(true);
    expect(looksBlocked(200, '<p>A normal article about data centres.</p>')).toBe(false);
  });
});

describe('pages that send cloud servers something else', () => {
  it('tells a placeholder page from an article whose quote is gone', () => {
    const quote = 'We estimate that less than 16% of the carbon credits issued to the investigated projects constitute real emission reductions';
    expect(lacksArticle('Your privacy, your choice. We use essential cookies to make sure the site can function. Accept all cookies', quote)).toBe(true);
    expect(lacksArticle('Carbon credits issued to investigated projects: the share of real emission reductions was estimated at 12%.', quote)).toBe(false);
  });
  it('dates archive copies', () => {
    expect(archiveAgeDays('20260918120000', '2026-10-25')).toBe(37);
  });
});
