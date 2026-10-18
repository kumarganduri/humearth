import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { evaluate, exprNumbers, numbersIn, validateAnswersSource } from './schema';
import type { AnswersSource } from './types';

const real = (): AnswersSource => JSON.parse(readFileSync('data/sources/answers.source.json', 'utf8'));
const answer = (s: AnswersSource, slug: string) => s.answers.find((a) => a.slug === slug)!;

describe('numbersIn / exprNumbers', () => {
  it('reads thousands separators and decimals', () => {
    expect(numbersIn('5,250 MW and 0.34 Wh, 2.9×')).toEqual([5250, 0.34, 2.9]);
  });
  it('reads 18e9 as one number in an expression', () => {
    expect(exprNumbers('18e9*52/(700*1e6)')).toEqual([18e9, 52, 700, 1e6]);
  });
  it('evaluates arithmetic and refuses anything else', () => {
    expect(evaluate('6706/3600')).toBeCloseTo(1.863, 3);
    expect(() => evaluate('alert(1)')).toThrow();
  });
});

describe('validateAnswersSource', () => {
  it('accepts the real answers file', () => {
    expect(validateAnswersSource(real())).toEqual([]);
  });

  it('fails a number a reader sees that no quote or sum contains', () => {
    const s = real();
    answer(s, 'netflix').answer += ' About 999 questions.';
    expect(validateAnswersSource(s)).toContain('answers[netflix].answer: 999 is not in any of its quotes or sums');
  });

  it('checks the right guess option but not the wrong ones', () => {
    const s = real();
    answer(s, 'world-share').guess!.options[0] = '7.77%';
    expect(validateAnswersSource(s)).toEqual([]);
    answer(s, 'world-share').guess!.options[1] = 'About 7.77%';
    expect(validateAnswersSource(s).join('\n')).toMatch(/guess\.options\[1\]: 7\.77/);
  });

  it('fails a sum that does not add up', () => {
    const s = real();
    s.calcs.netflix_q_mid!.result = 300;
    expect(validateAnswersSource(s).join('\n')).toMatch(/calcs\.netflix_q_mid: 77\/0\.34 = .* not 300/);
  });

  it('fails a sum that uses a number from nowhere', () => {
    const s = real();
    s.calcs.netflix_q_mid = { text: '77 Wh ÷ 0.4 Wh', expr: '77/0.4', result: 192.5 };
    expect(validateAnswersSource(s).join('\n')).toMatch(/0\.4 in "77\/0\.4" isn't in any quote/);
  });

  it('requires an assumption to be shown to readers', () => {
    const s = real();
    s.calcs.kettle_wh!.text = 'about 99 Wh';
    expect(validateAnswersSource(s).join('\n')).toMatch(/kettle_wh\.assume\.15: an assumption must be shown/);
  });

  it('requires quotes read on the page, over https', () => {
    const s = real();
    s.sources.altman!.url = 'http://blog.samaltman.com/the-gentle-singularity';
    (s.sources.google as { checked: string }).checked = 'search-summary';
    const errs = validateAnswersSource(s);
    expect(errs).toContain('sources.altman.url: must be https');
    expect(errs.join('\n')).toMatch(/sources\.google\.checked/);
  });

  it('fails a chart value whose source is not cited', () => {
    const s = real();
    answer(s, 'one-question').points!.items[0]!.source = 'li';
    expect(validateAnswersSource(s)).toContain('answers[one-question].points.items[0]: source "li" isn\'t in cites');
  });

  it('fails broken links between answers and unknown deck cards', () => {
    const s = real();
    answer(s, 'bills').next.deeper = 'nope';
    s.deck.push('missing');
    const errs = validateAnswersSource(s);
    expect(errs).toContain('answers[bills].next.deeper: no answer "nope"');
    expect(errs).toContain('deck: no answer "missing"');
  });

  it('gives verdict stamps to claims only', () => {
    const s = real();
    answer(s, 'power-mix').stamp = 'YES';
    expect(validateAnswersSource(s)).toContain('answers[power-mix].stamp: only claims get a verdict stamp');
  });

  it('requires a ladder rung converted by a sum when the unit differs from the quote', () => {
    const s = real();
    delete s.ladder.find((r) => r.key === 'phone')!.calc;
    expect(validateAnswersSource(s).join('\n')).toMatch(/ladder\[phone\]\.wh: 19 isn't in its quote/);
  });
});
