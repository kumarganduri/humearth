import { describe, expect, it } from 'vitest';
import {
  animalsFor,
  applyPlan,
  channelsFromWh,
  dominantActivityOf,
  footprint,
  healthFor,
  kidComparisons,
  NEGLIGIBLE_WH,
  perPersonBaseline,
  weeklyUse,
} from './engine';
import { realConstants } from './testing';
import { CHANNELS, LEVELS, NO_PLAN, type Buckets } from './types';

const c = realConstants();

const ALL_BUCKETS: Buckets[] = [];
for (const text of [0, 1, 2, 3] as const)
  for (const images of [0, 1, 2] as const) for (const videos of [0, 1, 2] as const) ALL_BUCKETS.push({ text, images, videos });

describe('weeklyUse', () => {
  it('computes text, pictures and videos from the quiz table and per-item energy', () => {
    const w = weeklyUse({ text: 1, images: 1, videos: 1 }, c, 'mid');
    expect(w.perActivityWh.text).toBeCloseTo(6 * 7 * 0.34);
    expect(w.perActivityWh.images).toBeCloseTo(3 * 1.22);
    expect(w.perActivityWh.videos).toBeCloseTo(1 * 944);
    expect(w.totals.energy).toBeCloseTo(6 * 7 * 0.34 + 3 * 1.22 + 944);
  });

  it('never decreases as any answer goes up, at every level', () => {
    for (const level of LEVELS)
      for (const b of ALL_BUCKETS) {
        const base = weeklyUse(b, c, level).totals.energy;
        if (b.text < 3) expect(weeklyUse({ ...b, text: (b.text + 1) as Buckets['text'] }, c, level).totals.energy).toBeGreaterThan(base);
        if (b.images < 2) expect(weeklyUse({ ...b, images: (b.images + 1) as Buckets['images'] }, c, level).totals.energy).toBeGreaterThanOrEqual(base);
        if (b.videos < 2) expect(weeklyUse({ ...b, videos: (b.videos + 1) as Buckets['videos'] }, c, level).totals.energy).toBeGreaterThan(base);
      }
  });

  it('orders low <= mid <= high for every answer combination', () => {
    for (const b of ALL_BUCKETS) {
      const [lo, mid, hi] = LEVELS.map((l) => weeklyUse(b, c, l).totals);
      for (const ch of CHANNELS) {
        expect(lo![ch]).toBeLessThanOrEqual(mid![ch]);
        expect(mid![ch]).toBeLessThanOrEqual(hi![ch]);
      }
    }
  });

  it('throws on a bucket the quiz table does not have', () => {
    expect(() => weeklyUse({ text: 9, images: 0, videos: 0 } as unknown as Buckets, c, 'mid')).toThrow(RangeError);
  });
});

describe('channelsFromWh', () => {
  it('converts with that level\'s factors', () => {
    const t = channelsFromWh(1000, c, 'mid');
    expect(t.energy).toBe(1000);
    expect(t.co2).toBeCloseTo(473);
    expect(t.water).toBeCloseTo((1.08 + 2.18) * 1000);
  });
  it('is zero for zero use', () => {
    expect(channelsFromWh(0, c, 'high')).toEqual({ energy: 0, co2: 0, water: 0 });
  });
});

describe('applyPlan (greener choices)', () => {
  it('lowers pictures and videos by one bucket, never below zero, and leaves text alone', () => {
    expect(applyPlan({ text: 3, images: 2, videos: 2 }, { fewerPictures: true, fewerVideos: true, lighterAi: false })).toEqual({ text: 3, images: 1, videos: 1 });
    expect(applyPlan({ text: 0, images: 0, videos: 0 }, { fewerPictures: true, fewerVideos: true, lighterAi: true })).toEqual({ text: 0, images: 0, videos: 0 });
  });
  it('"a lighter AI" uses the lightest sourced text and picture figures at every level', () => {
    const b: Buckets = { text: 3, images: 2, videos: 0 };
    for (const level of LEVELS) {
      const w = weeklyUse(b, c, level, { ...NO_PLAN, lighterAi: true });
      expect(w.perActivityWh.text).toBeCloseTo(80 * 7 * c.values.textPromptWh.low);
      expect(w.perActivityWh.images).toBeCloseTo(20 * c.values.imageWh.low);
    }
  });
  it('every greener choice makes the world at least as healthy', () => {
    const plans = [
      { ...NO_PLAN, fewerPictures: true },
      { ...NO_PLAN, fewerVideos: true },
      { ...NO_PLAN, lighterAi: true },
    ];
    for (const b of ALL_BUCKETS) {
      const before = footprint(b, c).health;
      for (const p of plans) {
        const after = footprint(b, c, p).health;
        for (const ch of CHANNELS) expect(after[ch]).toBeGreaterThanOrEqual(before[ch]);
      }
    }
  });
});

describe('health', () => {
  it('is 1 for zero use and never drops below the floor', () => {
    expect(healthFor({ energy: 0, co2: 0, water: 0 }, c)).toEqual({ co2: 1, water: 1, energy: 1 });
    const huge = healthFor({ energy: 1e9, co2: 1e9, water: 1e9 }, c);
    for (const ch of CHANNELS) expect(huge[ch]).toBeCloseTo(c.mapping.floor);
  });
  it('stays within [floor, 1] for every answer combination and plan', () => {
    for (const b of ALL_BUCKETS) {
      const h = footprint(b, c, { fewerPictures: true, fewerVideos: false, lighterAi: true }).health;
      for (const ch of CHANNELS) {
        expect(h[ch]).toBeGreaterThanOrEqual(c.mapping.floor);
        expect(h[ch]).toBeLessThanOrEqual(1);
      }
    }
  });
  it('baseline is all data-centre electricity per person per week (about 975 Wh)', () => {
    expect(perPersonBaseline(c).energy).toBeCloseTo((415e12 / 8.16e9) / (365 / 7), 0);
  });
});

describe('animals', () => {
  const h = (x: number) => ({ co2: x, water: x, energy: x });
  it('switches exactly at 0.7 and 0.4', () => {
    expect(animalsFor(h(0.7))).toBe('present');
    expect(animalsFor(h(0.6999))).toBe('some-hiding');
    expect(animalsFor(h(0.4))).toBe('some-hiding');
    expect(animalsFor(h(0.3999))).toBe('hiding');
  });
});

describe('dominantActivity (drives the sentence, OV #2)', () => {
  it('names the biggest activity', () => {
    expect(dominantActivityOf({ text: 5, images: 30, videos: 2 })).toBe('images');
    expect(footprint({ text: 1, images: 0, videos: 2 }, c).dominantActivity).toBe('videos');
    expect(footprint({ text: 3, images: 0, videos: 0 }, c).dominantActivity).toBe('text');
  });
  it('is "none" when the week is negligible', () => {
    expect(dominantActivityOf({ text: NEGLIGIBLE_WH / 2 - 0.01, images: 0, videos: 0 })).toBe('none');
    expect(dominantActivityOf({ text: 0, images: 0, videos: 0 })).toBe('none');
  });
});

describe('kidComparisons', () => {
  it('turns numbers into glasses, bathtubs, fridge minutes and balloons', () => {
    const k = kidComparisons({ energy: 50, co2: 20, water: 500 }, c);
    expect(k.glasses).toBeCloseTo(2);
    expect(k.bathtubs).toBeCloseTo(500 / 1000 / 150);
    expect(k.fridgeMinutes).toBeCloseTo(60);
    expect(k.balloons).toBeCloseTo(2);
  });
});
