// "The hum" (design doc, stage 1b): an opt-in sound whose tone follows the year slider. Pure rules here,
// tested without audio; src/sound/synth.ts plays them.
//
//   year's middle figure  ──► loudness and fullness (more electricity, a louder, fuller hum)
//   year's low-high range ──► waver (a measured year is a steady tone; a wide forecast range beats audibly)
// The sound version of DESIGN.md's "brightness means certainty".

import type { MetricSeries } from '../footprint/series-types';

export interface HumTone {
  /** 0..1 loudness. */
  level: number;
  /** How many harmonics above the 100 Hz fundamental (1..4): fuller as use grows. */
  harmonics: number;
  /** Detune of the second voice, in cents: 0 for a single published figure, up to MAX_WAVER for the widest range. */
  waverCents: number;
}

export const FUNDAMENTAL_HZ = 100; // mains-like; phone speakers hear it through its harmonics
export const MAX_WAVER = 30;

export function humFor(m: MetricSeries, year: number): HumTone {
  const y = m.years.find((x) => x.year === year) ?? m.years.find((x) => x.year === m.latestMeasuredYear)!;
  const maxMid = Math.max(...m.years.map((x) => x.mid.value ?? 0));
  const share = (y.mid.value ?? 0) / maxMid;
  const lo = y.low.value ?? y.mid.value ?? 0;
  const hi = y.high.value ?? y.mid.value ?? 0;
  const spread = y.mid.value ? (hi - lo) / y.mid.value : 0; // 0 = single figure, ~1.0 = range as wide as the value
  return {
    level: 0.25 + 0.75 * share,
    harmonics: 1 + Math.round(3 * share),
    waverCents: Math.round(Math.min(1, spread) * MAX_WAVER),
  };
}

/** Beats per second the waver makes on the fundamental (what you hear as wobble). */
export const beatsPerSecond = (t: HumTone) => FUNDAMENTAL_HZ * (2 ** (t.waverCents / 1200) - 1);
