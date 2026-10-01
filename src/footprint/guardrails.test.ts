import { describe, expect, it } from 'vitest';
import { checkGuardrails, checkLevel, feasibleK, strictKRange, TEXT_HEAVY, VIDEO_HEAVY } from './guardrails';
import { footprint } from './engine';
import { realConstants } from './testing';
import { CHANNELS } from './types';

const c = realConstants();

describe('"no guilt" guardrails with the real sourced numbers', () => {
  it('pass at every level under the approved rule (strict at mid + high, order at low)', () => {
    const r = checkGuardrails(c);
    expect(r.levels.map((l) => [l.level, l.ok])).toEqual([
      ['mid', true],
      ['high', true],
      ['low', true],
    ]);
  });

  it('keep a 50+/day text-only user healthy and a video-heavy user stressed in the world kids actually see', () => {
    const t = footprint(TEXT_HEAVY, c);
    const v = footprint(VIDEO_HEAVY, c);
    for (const ch of CHANNELS) {
      expect(t.health[ch]).toBeGreaterThanOrEqual(0.8);
      expect(v.health[ch]).toBeLessThan(0.5);
    }
    expect(t.animals).toBe('present');
  });

  it('k sits inside the strict range', () => {
    const r = strictKRange(c);
    expect(c.mapping.k).toBeGreaterThanOrEqual(r.lo);
    expect(c.mapping.k).toBeLessThan(r.hi);
  });

  it('confirms all three levels cannot pass strictly (why low is order-only)', () => {
    const low = feasibleK(c, 'low');
    expect(low.lo).toBeGreaterThanOrEqual(low.hi);
  });

  it('fails loudly when k is pushed outside the range', () => {
    const r = strictKRange(c);
    expect(checkGuardrails({ ...c, mapping: { ...c.mapping, k: r.lo * 0.5 } }).ok).toBe(false);
    expect(checkGuardrails({ ...c, mapping: { ...c.mapping, k: r.hi * 2 } }).ok).toBe(false);
  });

  it('order-only check catches a video-heavy week that looks healthier', () => {
    // Make videos free at the low level: the video-heavy week is now lighter than the text-heavy one.
    const free = { ...c, values: { ...c.values, videoClipWh: { ...c.values.videoClipWh, low: 0 } } };
    expect(checkLevel(free, 'low').ok).toBe(false);
  });
});
