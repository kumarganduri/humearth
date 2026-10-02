// The footprint engine (eng review 5A). Pure: no three.js, no DOM.
// Every number on every screen, and the 3D world's health, comes from here.
//
//   buckets + plan + constants
//     -> weeklyUse(level)     per activity and per channel, for low / mid / high
//     -> health(channel)      0.15..1, from the MID weekly use (designed scale, see Mapping)
//     -> animals              present | some-hiding | hiding
//     -> dominantActivity     which activity used most (drives the sentence, OV #2)
//     -> comparisons          glasses / bathtubs / fridge-minutes / balloons

import {
  ACTIVITIES,
  CHANNELS,
  LEVELS,
  NO_PLAN,
  type Activity,
  type Buckets,
  type Channel,
  type Constants,
  type Level,
  type Plan,
} from './types';

export interface ChannelTotals {
  energy: number; // Wh
  co2: number; // g
  water: number; // mL
}

export interface WeeklyUse {
  perActivityWh: Record<Activity, number>;
  totals: ChannelTotals;
}

export type AnimalState = 'present' | 'some-hiding' | 'hiding';

export interface Footprint {
  weekly: Record<Level, WeeklyUse>;
  health: Record<Channel, number>;
  animals: AnimalState;
  dominantActivity: Activity | 'none';
}

const WEEK_DAYS = 7;
const WEEKS_PER_YEAR = 365 / WEEK_DAYS;

/** Applies the greener choices: each picture/video toggle lowers that answer by one bucket. */
export function applyPlan(buckets: Buckets, plan: Plan): Buckets {
  return {
    text: buckets.text,
    images: plan.fewerPictures ? (Math.max(0, buckets.images - 1) as Buckets['images']) : buckets.images,
    videos: plan.fewerVideos ? (Math.max(0, buckets.videos - 1) as Buckets['videos']) : buckets.videos,
  };
}

function pick(table: number[], index: number, name: string): number {
  const v = table[index];
  if (v === undefined) throw new RangeError(`quiz.${name} has no bucket ${index}`);
  return v;
}

/** Wh -> co2 / water / energy for one level, using that level's factors throughout. */
export function channelsFromWh(wh: number, c: Constants, level: Level): ChannelTotals {
  const v = c.values;
  const kWh = wh / 1000;
  return {
    energy: wh,
    co2: kWh * v.gridGCO2PerKWh[level],
    water: kWh * (v.onsiteWaterLPerKWh[level] + v.offsiteWaterLPerKWh[level]) * 1000,
  };
}

export function weeklyUse(buckets: Buckets, c: Constants, level: Level, plan: Plan = NO_PLAN): WeeklyUse {
  const b = applyPlan(buckets, plan);
  const v = c.values;
  // "A lighter AI" uses the lightest sourced figure for text and pictures at every level.
  const textWh = plan.lighterAi ? v.textPromptWh.low : v.textPromptWh[level];
  const imageWh = plan.lighterAi ? v.imageWh.low : v.imageWh[level];
  const perActivityWh: Record<Activity, number> = {
    text: pick(c.quiz.textPromptsPerDay, b.text, 'textPromptsPerDay') * WEEK_DAYS * textWh,
    images: pick(c.quiz.imagesPerWeek, b.images, 'imagesPerWeek') * imageWh,
    videos: pick(c.quiz.videosPerWeek, b.videos, 'videosPerWeek') * v.videoClipWh[level],
  };
  const total = perActivityWh.text + perActivityWh.images + perActivityWh.videos;
  return { perActivityWh, totals: channelsFromWh(total, c, level) };
}

/**
 * Weekly share of ALL data-centre electricity per person, as co2 / water / energy, using one
 * level's figures. The world on screen uses 'mid'; the guardrails compare like with like at each level.
 */
export function perPersonBaseline(c: Constants, level: Level = 'mid'): ChannelTotals {
  const v = c.values;
  const whPerYear = v.dataCentreTWhPerYear[level] * 1e12;
  const whPerPersonWeek = whPerYear / v.worldPopulation[level] / WEEKS_PER_YEAR;
  return channelsFromWh(whPerPersonWeek, c, level);
}

/** health = 1 - clamp(use / (k * baseline), 0, 1 - floor). A designed scale (Mapping), shown on How We Know. */
export function healthFor(use: ChannelTotals, c: Constants, level: Level = 'mid'): Record<Channel, number> {
  const base = perPersonBaseline(c, level);
  const { k, floor } = c.mapping;
  const out = {} as Record<Channel, number>;
  for (const ch of CHANNELS) {
    const ratio = use[ch] / (k * base[ch]);
    out[ch] = 1 - Math.min(Math.max(ratio, 0), 1 - floor);
  }
  return out;
}

// Averaging three equal values can land a hair under a threshold (0.7 -> 0.69999...).
const THRESHOLD_EPS = 1e-9;

export function animalsFor(health: Record<Channel, number>): AnimalState {
  const avg = CHANNELS.reduce((s, ch) => s + health[ch], 0) / CHANNELS.length + THRESHOLD_EPS;
  if (avg >= 0.7) return 'present';
  if (avg >= 0.4) return 'some-hiding';
  return 'hiding';
}

/** Below this weekly total nothing "used most of it"; the sentence just celebrates the world. */
export const NEGLIGIBLE_WH = 1;

export function dominantActivityOf(perActivityWh: Record<Activity, number>): Activity | 'none' {
  let best: Activity | 'none' = 'none';
  let bestWh = 0;
  for (const a of ACTIVITIES) {
    if (perActivityWh[a] > bestWh) {
      best = a;
      bestWh = perActivityWh[a];
    }
  }
  const total = ACTIVITIES.reduce((s, a) => s + perActivityWh[a], 0);
  return total < NEGLIGIBLE_WH ? 'none' : best;
}

export function footprint(buckets: Buckets, c: Constants, plan: Plan = NO_PLAN): Footprint {
  const weekly = {} as Record<Level, WeeklyUse>;
  for (const level of LEVELS) weekly[level] = weeklyUse(buckets, c, level, plan);
  const health = healthFor(weekly.mid.totals, c);
  return {
    weekly,
    health,
    animals: animalsFor(health),
    dominantActivity: dominantActivityOf(weekly.mid.perActivityWh),
  };
}

const SECONDS_PER_YEAR = 365 * 24 * 3600;

/**
 * The Earth ticker: AI's worldwide use per second, at one level's figures.
 * All data-centre electricity (IEA) x AI's share (US 2024 share as our world estimate).
 */
export function aiPerSecond(c: Constants, level: Level): ChannelTotals {
  const v = c.values;
  const whPerSecond = (v.dataCentreTWhPerYear[level] * 1e12 * v.aiShareOfDataCentres[level]) / SECONDS_PER_YEAR;
  return channelsFromWh(whPerSecond, c, level);
}

export interface KidComparisons {
  glasses: number;
  bathtubs: number;
  fridgeMinutes: number;
  balloons: number;
}

export function kidComparisons(t: ChannelTotals, c: Constants): KidComparisons {
  const k = c.comparisons;
  return {
    glasses: t.water / k.glassMl,
    bathtubs: t.water / 1000 / k.bathtubL,
    fridgeMinutes: (t.energy / k.fridgeWatts) * 60,
    balloons: t.co2 / k.balloonGCO2,
  };
}
