// GET /api/grid: live grid carbon at two hubs (stage 3), fetched here so visitors' browsers only ever talk to
// humearth.org (the CSP's connect-src stays 'self'). Cached at the edge for 15 minutes: the sources update
// every 30-60 minutes, and this keeps us far inside their fair-use limits.
//
//   NESO (London, no key)  ─┐
//   EIA (PJM, EIA_API_KEY) ─┴─► src/livegrid/grid.ts parse/calc ─► { fetchedAt, regions[] }  (cache 15 min)

import { eiaIntensity, factorsFromLb, last24h, parseNeso, type GridFile, type GridRegion } from '../../src/livegrid/grid';
import constants from '../../public/data/constants.json';

interface Env {
  EIA_API_KEY?: string;
}
interface Ctx {
  request: Request;
  env: Env;
  waitUntil: (p: Promise<unknown>) => void;
}
declare const caches: { default: { match(r: Request): Promise<Response | undefined>; put(r: Request, res: Response): Promise<void> } };

const CACHE_SECONDS = 900;
const v = (constants as { values: Record<string, { mid: number }> }).values;
const FACTORS = factorsFromLb(v.coalCO2LbPerKWh!.mid, v.gasCO2LbPerKWh!.mid, v.oilCO2LbPerKWh!.mid);

async function json(url: string): Promise<unknown> {
  const r = await fetch(url, { headers: { accept: 'application/json', 'user-agent': 'humearth.org (open-source data story)' } });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

async function london(now: Date): Promise<GridRegion> {
  const base: GridRegion = {
    key: 'london',
    hub: 'London',
    kind: 'estimate',
    source: { name: 'National Energy System Operator (NESO), Carbon Intensity API', url: 'https://carbonintensity.org.uk/', licence: 'CC BY 4.0' },
    points: [],
  };
  try {
    const from = now.toISOString().slice(0, 16) + 'Z';
    base.points = last24h(parseNeso(await json(`https://api.carbonintensity.org.uk/regional/intensity/${from}/pt24h/regionid/13`)));
    if (!base.points.length) base.unavailable = 'NESO sent no data just now';
  } catch {
    base.unavailable = "NESO's service didn't answer just now";
  }
  return base;
}

async function virginia(now: Date, key: string | undefined): Promise<GridRegion> {
  const base: GridRegion = {
    key: 'virginia',
    hub: 'Northern Virginia',
    kind: 'calculated',
    source: { name: 'U.S. Energy Information Administration (EIA), hourly generation by fuel for the PJM grid', url: 'https://www.eia.gov/electricity/gridmonitor/' },
    points: [],
  };
  if (!key) return { ...base, unavailable: 'not connected yet' };
  try {
    const start = new Date(now.getTime() - 48 * 3600e3).toISOString().slice(0, 13);
    const q = new URLSearchParams({ api_key: key, frequency: 'hourly', 'data[0]': 'value', 'facets[respondent][]': 'PJM', start, 'sort[0][column]': 'period', 'sort[0][direction]': 'desc', length: '1000' });
    base.points = last24h(eiaIntensity(await json(`https://api.eia.gov/v2/electricity/rto/fuel-type-data/data/?${q}`), FACTORS));
    if (!base.points.length) base.unavailable = 'EIA sent no data just now';
  } catch {
    base.unavailable = "EIA's service didn't answer just now";
  }
  return base;
}

export async function onRequestGet({ request, env, waitUntil }: Ctx): Promise<Response> {
  const cacheKey = new Request(new URL('/api/grid', request.url).toString());
  const hit = await caches.default.match(cacheKey);
  if (hit) return hit;
  const now = new Date();
  const body: GridFile = { fetchedAt: now.toISOString(), regions: await Promise.all([london(now), virginia(now, env.EIA_API_KEY)]) };
  // A source that just failed is retried in 2 minutes, not 15 ("not connected yet" isn't a failure).
  const failed = body.regions.some((r) => r.unavailable && r.unavailable !== 'not connected yet');
  const ttl = failed ? 120 : CACHE_SECONDS;
  const res = new Response(JSON.stringify(body), {
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': `public, max-age=${Math.min(300, ttl)}, s-maxage=${ttl}` },
  });
  waitUntil(caches.default.put(cacheKey, res.clone()));
  return res;
}
