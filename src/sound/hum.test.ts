import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { beatsPerSecond, humFor, MAX_WAVER } from './hum';
import type { SeriesFile } from '../footprint/series-types';

const m = (JSON.parse(readFileSync('public/data/series.json', 'utf8')) as SeriesFile).metrics.electricity;

describe('the hum follows the year', () => {
  it('more electricity, a louder and fuller hum', () => {
    const t17 = humFor(m, 2017), t25 = humFor(m, 2025), t35 = humFor(m, 2035);
    expect(t17.level).toBeLessThan(t25.level);
    expect(t25.level).toBeLessThan(t35.level);
    expect(t35.level).toBeCloseTo(1, 9); // the biggest middle figure is full loudness
    expect(t17.harmonics).toBeLessThanOrEqual(t35.harmonics);
  });
  it('a single published figure is a steady tone; a forecast range wavers, more for a wider range', () => {
    expect(humFor(m, 2025).waverCents).toBe(0); // 485 TWh, one published estimate
    const t30 = humFor(m, 2030), t35 = humFor(m, 2035);
    expect(t30.waverCents).toBeGreaterThan(0);
    expect(t35.waverCents).toBeGreaterThan(0);
    expect(t35.waverCents).toBeLessThanOrEqual(MAX_WAVER);
    expect(beatsPerSecond(t35)).toBeGreaterThan(0.5); // audible wobble
    expect(beatsPerSecond(humFor(m, 2025))).toBe(0);
  });
  it('a year outside the series falls back to today', () => {
    expect(humFor(m, 1999)).toEqual(humFor(m, m.latestMeasuredYear));
  });
});
