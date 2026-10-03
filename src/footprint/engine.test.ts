import { describe, expect, it } from 'vitest';
import { channelsFromWh, videoShare, weeklyRange, weeklyUse } from './engine';
import { realConstants } from './testing';

const c = realConstants();
const v = c.values;

describe('weeklyUse: plain counts in, Wh / CO2 / water out', () => {
  it('nothing used is zero, not NaN (empty week)', () => {
    const w = weeklyUse({ questionsPerDay: 0, picturesPerWeek: 0, videosPerWeek: 0 }, c, 'mid');
    expect(w.totals).toEqual({ energy: 0, co2: 0, water: 0 });
  });

  it('adds questions (per day x 7), pictures and videos at the chosen level', () => {
    const w = weeklyUse({ questionsPerDay: 20, picturesPerWeek: 3, videosPerWeek: 1 }, c, 'mid');
    expect(w.perActivityWh.text).toBeCloseTo(20 * 7 * v.textPromptWh.mid, 9);
    expect(w.perActivityWh.images).toBeCloseTo(3 * v.imageWh.mid, 9);
    expect(w.perActivityWh.videos).toBeCloseTo(v.videoClipWh.mid, 9);
    expect(w.totals.energy).toBeCloseTo(w.perActivityWh.text + w.perActivityWh.images + w.perActivityWh.videos, 9);
  });

  it('treats negative, NaN or infinite inputs as zero (a slider or URL can never produce nonsense)', () => {
    const w = weeklyUse({ questionsPerDay: -5, picturesPerWeek: Number.NaN, videosPerWeek: Infinity }, c, 'mid');
    expect(w.totals.energy).toBe(0);
  });

  it('low <= mid <= high for every channel, at slider maximums too', () => {
    for (const u of [{ questionsPerDay: 1, picturesPerWeek: 0, videosPerWeek: 0 }, { questionsPerDay: 100, picturesPerWeek: 40, videosPerWeek: 10 }]) {
      const r = weeklyRange(u, c);
      for (const ch of ['energy', 'co2', 'water'] as const) {
        expect(r.low.totals[ch]).toBeLessThanOrEqual(r.mid.totals[ch]);
        expect(r.mid.totals[ch]).toBeLessThanOrEqual(r.high.totals[ch]);
      }
    }
  });
});

describe('channelsFromWh', () => {
  it('1 kWh gives the grid intensity in grams and the water use in millilitres', () => {
    const t = channelsFromWh(1000, c, 'mid');
    expect(t.co2).toBeCloseTo(v.gridGCO2PerKWh.mid, 9);
    expect(t.water).toBeCloseTo((v.onsiteWaterLPerKWh.mid + v.offsiteWaterLPerKWh.mid) * 1000, 9);
  });
});

describe('videoShare: "your typing is small, your video isn\'t"', () => {
  it('one video a week is most of a heavy-ish texting week at the middle figures', () => {
    expect(videoShare({ questionsPerDay: 20, picturesPerWeek: 3, videosPerWeek: 1 }, c)).toBeGreaterThan(0.5);
  });
  it('no use at all is 0, and text only is 0', () => {
    expect(videoShare({ questionsPerDay: 0, picturesPerWeek: 0, videosPerWeek: 0 }, c)).toBe(0);
    expect(videoShare({ questionsPerDay: 50, picturesPerWeek: 0, videosPerWeek: 0 }, c)).toBe(0);
  });
});
