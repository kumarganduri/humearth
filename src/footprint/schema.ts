// Validation for data/sources/constants.source.json (eng review 4A).
// The build fails on any problem, so an unsourced or out-of-order number can never ship.

import { VALUE_KEYS, type RangeValue } from './types';
import { METRIC_KEYS } from './series-types';

const DATE = /^\d{4}-\d{2}-\d{2}$/;

function isObj(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x);
}

function finitePositive(x: unknown): x is number {
  return typeof x === 'number' && Number.isFinite(x) && x >= 0;
}

const CHECKED = new Set(['page', 'search-summary']);

/** Every source needs a label, https URL, retrieved date and which levels it supports; each required level must be covered. */
export function validateSources(key: string, sources: unknown, required: readonly string[] = ['low', 'mid', 'high']): string[] {
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
  for (const l of required) if (!covered.has(l)) errs.push(`${key}: no source supports "${l}"`);
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

/** Returns every problem found; empty means valid. */
export function validateSource(src: unknown): string[] {
  if (!isObj(src)) return ['root: must be an object'];
  const errs: string[] = [];
  const values = src.values;
  if (!isObj(values)) errs.push('values: missing');
  else for (const key of VALUE_KEYS) errs.push(...validateRange(key, values[key]));
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

/**
 * data/sources/series.source.json (eng review D2): published points per metric, in year order, inside
 * firstYear..lastYear, low <= mid <= high where published (null = not published), and a source for every
 * published level. The last point must be a forecast and at least one measured point must exist.
 */
export function validateSeriesSource(src: unknown): string[] {
  if (!isObj(src)) return ['series: must be an object'];
  const errs: string[] = [];
  const first = src.firstYear, last = src.lastYear;
  if (!Number.isInteger(first) || !Number.isInteger(last) || (first as number) >= (last as number)) {
    return ['series: firstYear < lastYear (integers) required'];
  }
  if (!isObj(src.metrics)) return ['series.metrics: missing'];
  for (const m of METRIC_KEYS) {
    const metric = src.metrics[m];
    const key = `series.${m}`;
    if (!isObj(metric)) { errs.push(`${key}: missing`); continue; }
    for (const f of ['label', 'unit'] as const) if (typeof metric[f] !== 'string' || !metric[f]) errs.push(`${key}.${f}: required`);
    if (metric.backfill !== undefined) {
      const b = metric.backfill;
      if (!isObj(b) || !(typeof b.rate === 'number' && b.rate > 0 && b.rate < 1)) errs.push(`${key}.backfill.rate: must be in (0, 1)`);
      else errs.push(...validateSources(`${key}.backfill`, b.sources));
    }
    if (!Array.isArray(metric.points) || metric.points.length === 0) { errs.push(`${key}.points: at least one required`); continue; }
    let prevYear = -Infinity;
    metric.points.forEach((p, i) => {
      const pk = `${key}.points[${i}]`;
      if (!isObj(p)) return errs.push(`${pk}: must be an object`);
      const y = p.year as number;
      if (!Number.isInteger(y) || y < (first as number) || y > (last as number)) errs.push(`${pk}.year: must be an integer in ${first}..${last}`);
      else if (y <= prevYear) errs.push(`${pk}.year: points must be in increasing year order`);
      else prevYear = y;
      if (p.estimate !== 'measured' && p.estimate !== 'forecast') errs.push(`${pk}.estimate: measured | forecast`);
      if (!finitePositive(p.mid)) errs.push(`${pk}.mid: must be a finite number >= 0`);
      const required = ['mid'];
      for (const edge of ['low', 'high'] as const) {
        if (p[edge] === null) continue;
        if (!finitePositive(p[edge])) errs.push(`${pk}.${edge}: a number >= 0 or null (not published)`);
        else required.push(edge);
      }
      if (finitePositive(p.mid)) {
        if (finitePositive(p.low) && (p.low as number) > (p.mid as number)) errs.push(`${pk}: needs low <= mid`);
        if (finitePositive(p.high) && (p.mid as number) > (p.high as number)) errs.push(`${pk}: needs mid <= high`);
      }
      errs.push(...validateSources(pk, p.sources, required));
    });
    const pts = metric.points.filter(isObj);
    if (!pts.some((p) => p.estimate === 'measured')) errs.push(`${key}: needs at least one measured point`);
    if (pts.length && pts[pts.length - 1]!.estimate !== 'forecast') errs.push(`${key}: the last point must be a forecast`);
    const firstForecast = pts.findIndex((p) => p.estimate === 'forecast');
    if (firstForecast >= 0 && pts.slice(firstForecast).some((p) => p.estimate === 'measured')) errs.push(`${key}: measured points must come before forecasts`);
  }
  return errs;
}

const SHA256 = /^[0-9a-f]{64}$/;

/** data/sources/countries.source.json (eng review D3): rows copied from a named dataset file. */
export function validateCountriesSource(src: unknown): string[] {
  if (!isObj(src)) return ['countries: must be an object'];
  const errs: string[] = [];
  const d = src.dataset;
  if (!isObj(d)) errs.push('countries.dataset: missing');
  else {
    for (const f of ['name', 'licence'] as const) if (typeof d[f] !== 'string' || !d[f]) errs.push(`countries.dataset.${f}: required`);
    for (const f of ['page', 'url'] as const) if (typeof d[f] !== 'string' || !/^https:\/\//.test(d[f] as string)) errs.push(`countries.dataset.${f}: must be https`);
    if (typeof d.retrieved !== 'string' || !DATE.test(d.retrieved)) errs.push('countries.dataset.retrieved: YYYY-MM-DD');
    if (typeof d.sha256 !== 'string' || !SHA256.test(d.sha256)) errs.push('countries.dataset.sha256: 64 lowercase hex characters');
    if (d.checked !== 'dataset') errs.push('countries.dataset.checked: must be "dataset"');
    const f = d.filter;
    if (!isObj(f)) errs.push('countries.dataset.filter: missing');
    else for (const k of ['areaColumn', 'yearColumn', 'sourceColumn', 'sourceValue', 'valueColumn']) {
      if (typeof f[k] !== 'string' || !f[k]) errs.push(`countries.dataset.filter.${k}: required`);
    }
  }
  if (!Number.isInteger(src.year)) errs.push('countries.year: integer required');
  if (typeof src.unit !== 'string' || !src.unit) errs.push('countries.unit: required');
  if (!Array.isArray(src.countries) || src.countries.length === 0) errs.push('countries.countries: at least one required');
  else {
    const names = new Set<string>();
    src.countries.forEach((c, i) => {
      if (!isObj(c) || typeof c.name !== 'string' || !c.name) return errs.push(`countries[${i}].name: required`);
      if (names.has(c.name)) errs.push(`countries[${c.name}]: duplicate`);
      names.add(c.name);
      if (!(finitePositive(c.demandTWh) && (c.demandTWh as number) > 0)) errs.push(`countries[${c.name}].demandTWh: must be > 0`);
    });
  }
  return errs;
}

/** data/sources/grids.source.json: one sourced carbon intensity per grid. */
export function validateGrids(src: unknown): string[] {
  if (!isObj(src) || !Array.isArray(src.grids) || src.grids.length === 0) return ['grids: at least one required'];
  const errs: string[] = [];
  const keys = new Set<string>();
  src.grids.forEach((g, i) => {
    const k = isObj(g) && typeof g.key === 'string' && g.key ? `grids[${g.key}]` : `grids[${i}]`;
    if (!isObj(g)) return errs.push(`${k}: must be an object`);
    if (typeof g.key !== 'string' || !/^[a-z]+$/.test(g.key)) errs.push(`${k}.key: lowercase letters required`);
    else if (keys.has(g.key)) errs.push(`${k}: duplicate key`);
    else keys.add(g.key);
    if (typeof g.name !== 'string' || !g.name) errs.push(`${k}.name: required`);
    if (!(finitePositive(g.gCO2PerKWh) && (g.gCO2PerKWh as number) < 2000)) errs.push(`${k}.gCO2PerKWh: must be in 0..2000`);
    if (!Number.isInteger(g.year)) errs.push(`${k}.year: integer required`);
    errs.push(...validateSources(k, g.sources));
  });
  return errs;
}

export type { RangeValue };
