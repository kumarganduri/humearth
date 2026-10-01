// The "no guilt" guardrails. Shared by scripts/derive-k.ts and the tests, so the rule that
// picks k and the rule that checks it are the same code.
//
// Decided 2026-10-02 (eng build): the world is drawn from MID figures. The guardrails must hold
// if the world were drawn from MID or HIGH figures. At LOW they cannot both hold (the lowest
// published video figure is from an older, tiny model), so LOW only requires the order to hold:
// a video-heavy week is never healthier than a text-heavy week.

import { healthFor, perPersonBaseline, weeklyUse } from './engine';
import { CHANNELS, type Buckets, type Constants, type Level } from './types';

/** "50+ questions a day, no pictures, no videos" must stay healthy. */
export const TEXT_HEAVY: Buckets = { text: 3, images: 0, videos: 0 };
/** "A few questions a day, some pictures, a lot of videos" must look visibly stressed. */
export const VIDEO_HEAVY: Buckets = { text: 1, images: 1, videos: 2 };

export const TEXT_HEAVY_MIN_HEALTH = 0.8;
export const VIDEO_HEAVY_MAX_HEALTH = 0.5;
export const STRICT_LEVELS: readonly Level[] = ['mid', 'high'];
export const ORDER_ONLY_LEVELS: readonly Level[] = ['low'];

export interface LevelCheck {
  level: Level;
  textHeavyHealth: number; // worst channel
  videoHeavyHealth: number; // best channel
  ok: boolean;
}

/** Health a persona would get if the world were drawn from `level` figures. */
export function healthAtLevel(b: Buckets, c: Constants, level: Level) {
  return healthFor(weeklyUse(b, c, level).totals, c);
}

export function checkLevel(c: Constants, level: Level): LevelCheck {
  const t = healthAtLevel(TEXT_HEAVY, c, level);
  const v = healthAtLevel(VIDEO_HEAVY, c, level);
  const textHeavyHealth = Math.min(...CHANNELS.map((ch) => t[ch]));
  const videoHeavyHealth = Math.max(...CHANNELS.map((ch) => v[ch]));
  const ok = STRICT_LEVELS.includes(level)
    ? textHeavyHealth >= TEXT_HEAVY_MIN_HEALTH && videoHeavyHealth < VIDEO_HEAVY_MAX_HEALTH
    : CHANNELS.every((ch) => v[ch] <= t[ch]); // order only, compared channel by channel
  return { level, textHeavyHealth, videoHeavyHealth, ok };
}

export function checkGuardrails(c: Constants): { ok: boolean; levels: LevelCheck[] } {
  const levels = [...STRICT_LEVELS, ...ORDER_ONLY_LEVELS].map((l) => checkLevel(c, l));
  return { ok: levels.every((l) => l.ok), levels };
}

/**
 * For the linear health curve, the k range where both guardrails hold at `level`, taking the worst
 * channel each way (water and CO2 factors vary by level, so channels differ). Empty when lo >= hi.
 *   text-heavy:  1 - T_c/(k B_c) >= 0.8   =>  k >= T_c / (0.2 B_c)   for every channel c
 *   video-heavy: 1 - V_c/(k B_c) <  0.5   =>  k <  V_c / (0.5 B_c)   for every channel c
 */
export function feasibleK(c: Constants, level: Level): { lo: number; hi: number; textWh: number; videoWh: number } {
  const base = perPersonBaseline(c);
  const text = weeklyUse(TEXT_HEAVY, c, level).totals;
  const video = weeklyUse(VIDEO_HEAVY, c, level).totals;
  return {
    lo: Math.max(...CHANNELS.map((ch) => text[ch] / ((1 - TEXT_HEAVY_MIN_HEALTH) * base[ch]))),
    hi: Math.min(...CHANNELS.map((ch) => video[ch] / ((1 - VIDEO_HEAVY_MAX_HEALTH) * base[ch]))),
    textWh: text.energy,
    videoWh: video.energy,
  };
}

/** Intersection of the feasible ranges at the strict levels. */
export function strictKRange(c: Constants): { lo: number; hi: number } {
  const ranges = STRICT_LEVELS.map((l) => feasibleK(c, l));
  return { lo: Math.max(...ranges.map((r) => r.lo)), hi: Math.min(...ranges.map((r) => r.hi)) };
}
