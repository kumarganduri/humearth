// Validation for data/sources/constants.source.json (eng review 4A).
// The build fails on any problem, so an unsourced or out-of-order number can never ship.

import { VALUE_KEYS, type RangeValue } from './types';

const DATE = /^\d{4}-\d{2}-\d{2}$/;

function isObj(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x);
}

function finitePositive(x: unknown): x is number {
  return typeof x === 'number' && Number.isFinite(x) && x >= 0;
}

const CHECKED = new Set(['page', 'search-summary']);

/** Every source needs a label, https URL, retrieved date and which levels it supports; low, mid and high must each be covered. */
export function validateSources(key: string, sources: unknown): string[] {
  const errs: string[] = [];
  if (!Array.isArray(sources) || sources.length === 0) return [`${key}.sources: at least one source required`];
  const covered = new Set<string>();
  sources.forEach((s, i) => {
    if (!isObj(s)) return errs.push(`${key}.sources[${i}]: must be an object`);
    if (typeof s.label !== 'string' || !s.label) errs.push(`${key}.sources[${i}].label: required`);
    if (typeof s.url !== 'string' || !/^https:\/\//.test(s.url)) errs.push(`${key}.sources[${i}].url: must be https`);
    if (typeof s.retrieved !== 'string' || !DATE.test(s.retrieved)) errs.push(`${key}.sources[${i}].retrieved: YYYY-MM-DD`);
    if (s.checked !== undefined && !CHECKED.has(s.checked as string)) errs.push(`${key}.sources[${i}].checked: page | search-summary`);
    if (typeof s.supports === 'string') s.supports.split(',').forEach((l) => covered.add(l.trim()));
    else errs.push(`${key}.sources[${i}].supports: required`);
  });
  for (const l of ['low', 'mid', 'high']) if (!covered.has(l)) errs.push(`${key}: no source supports "${l}"`);
  return errs;
}

function validateTriple(key: string, v: Record<string, unknown>): string[] {
  const errs: string[] = [];
  for (const f of ['low', 'mid', 'high'] as const) {
    if (!finitePositive(v[f])) errs.push(`${key}.${f}: must be a finite number >= 0`);
  }
  if (finitePositive(v.low) && finitePositive(v.mid) && finitePositive(v.high)) {
    if (!(v.low <= v.mid && v.mid <= v.high)) errs.push(`${key}: needs low <= mid <= high (got ${v.low}, ${v.mid}, ${v.high})`);
  }
  return errs;
}

export function validateRange(key: string, v: unknown): string[] {
  const errs: string[] = [];
  if (!isObj(v)) return [`${key}: missing`];
  for (const f of ['label', 'unit'] as const) {
    if (typeof v[f] !== 'string' || (v[f] as string).length === 0) errs.push(`${key}.${f}: required`);
  }
  errs.push(...validateTriple(key, v));
  if (v.unit === 'share' && typeof v.high === 'number' && v.high > 1) errs.push(`${key}: a share must be <= 1`);
  errs.push(...validateSources(key, v.sources));
  return errs;
}

function validateIntTable(name: string, t: unknown, len: number): string[] {
  if (!Array.isArray(t) || t.length !== len) return [`quiz.${name}: needs ${len} entries`];
  const errs: string[] = [];
  t.forEach((x, i) => {
    if (!finitePositive(x)) errs.push(`quiz.${name}[${i}]: must be a number >= 0`);
    if (i > 0 && finitePositive(x) && finitePositive(t[i - 1]) && x < (t[i - 1] as number)) errs.push(`quiz.${name}: must not decrease`);
  });
  return errs;
}

/** Returns every problem found; empty means valid. */
export function validateSource(src: unknown): string[] {
  if (!isObj(src)) return ['root: must be an object'];
  const errs: string[] = [];
  const values = src.values;
  if (!isObj(values)) errs.push('values: missing');
  else for (const key of VALUE_KEYS) errs.push(...validateRange(key, values[key]));
  const quiz = src.quiz;
  if (!isObj(quiz)) errs.push('quiz: missing');
  else {
    errs.push(...validateIntTable('textPromptsPerDay', quiz.textPromptsPerDay, 4));
    errs.push(...validateIntTable('imagesPerWeek', quiz.imagesPerWeek, 3));
    errs.push(...validateIntTable('videosPerWeek', quiz.videosPerWeek, 3));
  }
  const cmp = src.comparisons;
  if (!isObj(cmp)) errs.push('comparisons: missing');
  else for (const f of ['glassMl', 'bathtubL', 'fridgeWatts', 'balloonGCO2']) {
    if (!(finitePositive(cmp[f]) && (cmp[f] as number) > 0)) errs.push(`comparisons.${f}: must be > 0`);
  }
  return errs;
}

export function validateMapping(m: unknown): string[] {
  if (!isObj(m)) return ['mapping: missing (run `npm run derive:k`)'];
  const errs: string[] = [];
  if (!(finitePositive(m.k) && (m.k as number) > 0)) errs.push('mapping.k: must be > 0');
  if (!(finitePositive(m.floor) && (m.floor as number) < 1)) errs.push('mapping.floor: must be in [0, 1)');
  if (typeof m.derivedOn !== 'string' || !DATE.test(m.derivedOn)) errs.push('mapping.derivedOn: YYYY-MM-DD');
  if (typeof m.note !== 'string') errs.push('mapping.note: required');
  return errs;
}

/** data/sources/hubs.source.json: AI-building hub regions shown as lanterns (OV #7). */
export function validateHubs(src: unknown): string[] {
  if (!isObj(src) || !Array.isArray(src.hubs)) return ['hubs: missing'];
  if (src.hubs.length === 0) return ['hubs: at least one hub required'];
  const errs: string[] = [];
  const names = new Set<string>();
  src.hubs.forEach((h, i) => {
    const key = isObj(h) && typeof h.name === 'string' && h.name ? `hubs[${h.name}]` : `hubs[${i}]`;
    if (!isObj(h)) return errs.push(`${key}: must be an object`);
    if (typeof h.name !== 'string' || !h.name) errs.push(`${key}.name: required`);
    else if (names.has(h.name)) errs.push(`${key}: duplicate name`);
    else names.add(h.name);
    if (typeof h.country !== 'string' || !h.country) errs.push(`${key}.country: required`);
    if (typeof h.lat !== 'number' || h.lat < -90 || h.lat > 90) errs.push(`${key}.lat: must be in [-90, 90]`);
    if (typeof h.lon !== 'number' || h.lon < -180 || h.lon > 180) errs.push(`${key}.lon: must be in [-180, 180]`);
    if (typeof h.measure !== 'string' || !h.measure) errs.push(`${key}.measure: required (what the MW figure counts)`);
    if (!isObj(h.mw)) errs.push(`${key}.mw: missing`);
    else errs.push(...validateTriple(`${key}.mw`, h.mw));
    errs.push(...validateSources(key, h.sources));
  });
  return errs;
}

export type { RangeValue };
