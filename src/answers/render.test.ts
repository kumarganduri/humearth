import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { answerPage, cardHtml, dateWords, energy, figureHtml, isRightChoice, ladderHtml, revealHtml, timesWords } from './render';
import { answerPages, homeBody } from './pages';
import { answerCardSvg, wrap } from './og';
import { dayNumber, matches, todayIndex } from './pure';
import type { AnswersSource } from './types';

const src: AnswersSource = JSON.parse(readFileSync('data/sources/answers.source.json', 'utf8'));
const get = (slug: string) => src.answers.find((a) => a.slug === slug)!;
const companies = new Set(Object.entries(src.sources).filter(([, s]) => s.kind === 'company_claim').map(([k]) => k));

describe('words for numbers', () => {
  it('writes energy without thousands separators', () => {
    expect(energy(0.34)).toBe('0.34 Wh');
    expect(energy(28000)).toBe('28 kWh');
    expect(energy(4.85e14)).toBe('485 TWh');
  });
  it('says how much bigger a rung is in words', () => {
    expect(timesWords(1.1)).toBe('about the same as the line above');
    expect(timesWords(4.7)).toBe('about 4.7× the line above');
    expect(timesWords(56)).toBe('about 56× the line above');
    expect(timesWords(1.5e7)).toBe('about 15 million times the line above');
  });
  it('writes dates the same everywhere', () => expect(dateWords('2026-10-18')).toBe('18 Oct 2026'));
});

describe('cards', () => {
  it('a claim card offers the four verdicts; a how-much card its four options', () => {
    expect(cardHtml(get('flight'))).toContain('data-k="NOBODY KNOWS"');
    expect(cardHtml(get('one-question')).match(/data-i="/g)).toHaveLength(4);
  });
  it('knows the right choice', () => {
    expect(isRightChoice(get('flight'), { k: 'NO' })).toBe(true);
    expect(isRightChoice(get('flight'), { k: 'YES' })).toBe(false);
    expect(isRightChoice(get('one-question'), { i: 0 })).toBe(true);
  });
  it('the reveal carries the bigger picture, and "what this means for you" only on personal answers', () => {
    expect(revealHtml(get('one-question'), true, companies)).toContain('What this means for you');
    expect(revealHtml(get('bills'), true, companies)).not.toContain('What this means for you');
    expect(revealHtml(get('flight'), false, companies)).toMatch(/Not quite\..*Hum’s verdict|Hum’s verdict.*Not quite\./s);
  });
  it('with scripts off the card links to its answer', () => {
    expect(cardHtml(get('netflix'))).toContain('href="/q/netflix"');
    expect(cardHtml(get('netflix'))).toContain('class="choices js-only"');
  });
});

describe('figures', () => {
  it('draws company figures hollow and labels them, and never as low / middle / high', () => {
    const html = figureHtml(get('one-question'), companies);
    expect(html.match(/class="m-co"/g)).toHaveLength(2);
    expect(html).toContain('(company figure)');
    expect(html).toContain('not comparable');
    expect(html).not.toMatch(/\b(low|middle|high)\b/i);
  });
  it('uses no inline styles anywhere (the CSP refuses them)', () => {
    for (const html of [...Object.values(answerPages(src)), homeBody(src)]) expect(html).not.toMatch(/\sstyle=/);
  });
  it('puts every ladder rung on one axis and marks this answer’s rung', () => {
    const html = ladderHtml(src.ladder, 'question');
    expect(html.match(/<li[ >]/g)).toHaveLength(src.ladder.length);
    expect(html).toContain('<li class="me">');
  });
});

describe('answer pages', () => {
  it('give every claim its verdict, the total, sources with check dates, sums and three next questions', () => {
    const html = answerPage(get('flight'), src);
    expect(html).toContain('Hum’s verdict');
    expect(html).toContain('The bigger picture');
    expect(html).toMatch(/Quote checked on the page, \d+ \w{3} 20\d\d/);
    expect(html).toContain('Hum’s sums');
    expect(html.match(/<span class="k">(Go deeper|Zoom out|Closer to home)<\/span>/g)).toHaveLength(3);
  });
  it('show a data row as a data row, not as a quote', () => {
    const html = answerPage(get('world-share'), src);
    expect(html).toContain('Row checked against the published file');
  });
  it('generate one page per answer plus topic pages, each with its own preview card', () => {
    const pages = answerPages(src);
    expect(Object.keys(pages).filter((k) => k.startsWith('q/'))).toHaveLength(src.answers.length);
    expect(pages['q/flight.html']).toContain('https://humearth.org/og/q/flight.png');
    expect(pages['topics.html']).toBeTruthy();
  });
});

describe('preview cards', () => {
  it('wrap long questions and show the verdict', () => {
    expect(wrap('one two three four five', 9)).toEqual(['one two', 'three', 'four five']);
    expect(answerCardSvg(get('flight'))).toContain('>NO<');
  });
});

describe('Today and search', () => {
  it('counts days from launch in UTC', () => {
    expect(dayNumber('2026-10-18', new Date('2026-10-18T23:30:00Z'))).toBe(0);
    expect(dayNumber('2026-10-18', new Date('2026-10-20T00:10:00Z'))).toBe(2);
  });
  it('starts Today one card in, so the front door keeps its lead card most days (it skips Today’s card)', () => {
    expect(todayIndex(0, 11)).toBe(1);
    expect(todayIndex(-1, 11)).toBe(0);
    expect(todayIndex(10, 11)).toBe(0);
  });
  it('finds answers by any word, ignoring accents and small words', () => {
    expect(matches('is AI raising my bill?', src.answers)[0]!.slug).toBe('bills');
    expect(matches('agua? water bottle', src.answers)[0]!.slug).toBe('bottle-of-water');
    expect(matches('the and of', src.answers)).toEqual([]);
  });
});
