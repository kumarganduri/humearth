// The footprint engine (eng review 5A, v2 D8). Pure: no DOM. The calculator's numbers come from here.
//
//   usage (questions/day, pictures/week, videos/week) + constants
//     -> weeklyUse(level)   Wh per activity, then electricity / CO2 / water, for low / mid / high
//     -> weeklyRange        all three levels at once (every number on the page is a range)

import { ACTIVITIES, LEVELS, type Activity, type Constants, type Level, type Usage } from './types';

/** One week's totals. energy in Wh, co2 in grams, water in millilitres. */
export interface ChannelTotals {
  energy: number;
  co2: number;
  water: number;
}

export interface WeeklyUse {
  perActivityWh: Record<Activity, number>;
  totals: ChannelTotals;
}

const WEEK_DAYS = 7;

/** Electricity -> CO2 (grid intensity) and water (cooling on site + at the power plant). */
export function channelsFromWh(wh: number, c: Constants, level: Level): ChannelTotals {
  const v = c.values;
  const kWh = wh / 1000;
  return {
    energy: wh,
    co2: kWh * v.gridGCO2PerKWh[level],
    water: kWh * (v.onsiteWaterLPerKWh[level] + v.offsiteWaterLPerKWh[level]) * 1000,
  };
}

const count = (n: number) => (Number.isFinite(n) && n > 0 ? n : 0);

export function weeklyUse(u: Usage, c: Constants, level: Level): WeeklyUse {
  const v = c.values;
  const perActivityWh: Record<Activity, number> = {
    text: count(u.questionsPerDay) * WEEK_DAYS * v.textPromptWh[level],
    images: count(u.picturesPerWeek) * v.imageWh[level],
    videos: count(u.videosPerWeek) * v.videoClipWh[level],
  };
  const total = ACTIVITIES.reduce((sum, a) => sum + perActivityWh[a], 0);
  return { perActivityWh, totals: channelsFromWh(total, c, level) };
}

export function weeklyRange(u: Usage, c: Constants): Record<Level, WeeklyUse> {
  return Object.fromEntries(LEVELS.map((l) => [l, weeklyUse(u, c, l)])) as Record<Level, WeeklyUse>;
}

/** Share of the week's electricity that went to videos, at the middle figures (0..1). */
export function videoShare(u: Usage, c: Constants): number {
  const w = weeklyUse(u, c, 'mid');
  return w.totals.energy > 0 ? w.perActivityWh.videos / w.totals.energy : 0;
}
