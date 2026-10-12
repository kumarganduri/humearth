import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { ask, buildPool, dayNumber, MIN_GAP, questionFor, revealB, settled, statement, TOPICS, type PoolData } from './pool';
import { answer, currentStreak, EMPTY, load, save, shareText } from './streak';

const r = (p: string) => JSON.parse(readFileSync(p, 'utf8'));
const data: PoolData = { series: r('public/data/series.json'), countries: r('public/data/countries.json'), constants: r('public/data/constants.json'), grids: r('public/data/grids.json'), hubs: r('public/data/hubs.json') };
const pool = buildPool(data);

describe('the question pool', () => {
  it('every question is settled across both whole ranges, with middle figures at least 20% apart', () => {
    for (const q of pool) {
      expect(settled(q.a, q.b)).toBe(q.answer);
      if (q.answer === 'more') expect(q.b.low).toBeGreaterThan(q.a.high);
      else expect(q.b.high).toBeLessThan(q.a.low);
      expect(Math.abs(q.a.mid - q.b.mid) / Math.min(q.a.mid, q.b.mid)).toBeGreaterThanOrEqual(MIN_GAP);
    }
  });
  it('covers every topic, ids are unique, and each pair appears once', () => {
    for (const t of TOPICS) expect(pool.some((q) => q.topic === t)).toBe(true);
    expect(new Set(pool.map((q) => q.id)).size).toBe(pool.length);
    const pairs = pool.map((q) => [q.a.label, q.b.label].sort().join('|'));
    expect(new Set(pairs).size).toBe(pairs.length);
  });
  it('hubs are only compared with hubs measured the same way', () => {
    for (const q of pool.filter((x) => x.topic === 'hubs')) expect(q.a.unit).toBe(q.b.unit);
  });
  it('reads as English: verbs agree, grids have the right article', () => {
    const all = pool.map((q) => `${statement(q)} ${ask(q)} ${revealB(q)}`).join('\n');
    expect(all).not.toMatch(/questions uses|data centres in \d{4}( \(forecast\))? uses|An US/);
    expect(all).toContain('A US-like grid');
  });
});

describe('the day', () => {
  it('day 1 is 12 October 2026 (launch) in your own calendar; an earlier clock still gets #1', () => {
    expect(dayNumber(new Date(2026, 9, 12, 0, 5))).toBe(1);
    expect(dayNumber(new Date(2026, 9, 12, 23, 55))).toBe(1);
    expect(dayNumber(new Date(2026, 9, 13, 0, 0))).toBe(2);
    expect(dayNumber(new Date(2026, 0, 1))).toBe(1);
  });
  it('the same day always gives the same question; topics take turns', () => {
    expect(questionFor(5, pool).id).toBe(questionFor(5, pool).id);
    const topics = [1, 2, 3, 4].map((d) => questionFor(d, pool).topic);
    expect(new Set(topics).size).toBe(4);
  });
  it('within a topic, nothing repeats until every question has come up', () => {
    const grids = pool.filter((q) => q.topic === 'grids').length;
    const days = Array.from({ length: grids }, (_, i) => 3 + i * 4); // every grids day
    expect(new Set(days.map((d) => questionFor(d, pool).id)).size).toBe(grids);
  });
});

describe('your streak, on this device only', () => {
  it('days in a row answered right; a wrong answer or a missed day resets it', () => {
    let s = answer(EMPTY, 1, true);
    s = answer(s, 2, true);
    expect(s.streak).toBe(2);
    expect(answer(s, 3, false).streak).toBe(0);
    expect(answer(s, 4, true).streak).toBe(1); // skipped day 3
    expect(currentStreak(s, 3)).toBe(2);
    expect(currentStreak(s, 4)).toBe(0);
    expect(answer(s, 3, true).best).toBe(3);
  });
  it('answering twice on one day changes nothing', () => {
    const s = answer(EMPTY, 1, false);
    expect(answer(s, 1, true)).toBe(s);
  });
  it('blocked or broken storage never breaks the page', () => {
    const bad = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } };
    expect(load(bad)).toEqual(EMPTY);
    expect(() => save(bad, EMPTY)).not.toThrow();
    expect(load({ getItem: () => '{oops' })).toEqual(EMPTY);
    expect(load({ getItem: () => '{"played":null,"streak":3}' })).toEqual(EMPTY);
    expect(load({ getItem: () => '{"played":{"2":"right","x":"right","3":"maybe"},"streak":1,"lastDay":2}' }).played).toEqual({ 2: 'right' });
  });
  it('the share text has no spoiler', () => {
    expect(shareText(12, true, 4)).toBe('Hum Daily #12 ✅ · 4 in a row\nhumearth.org/daily');
    expect(shareText(12, false, 0)).toBe('Hum Daily #12 ❌\nhumearth.org/daily');
  });
});
