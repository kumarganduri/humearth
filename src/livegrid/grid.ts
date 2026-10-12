// Stage 3: live grid carbon at two hubs. Pure parsing and maths (tested in grid.test.ts); the Cloudflare
// function functions/api/grid.ts fetches the sources, caches, and calls these.
//
//   London: NESO Carbon Intensity API, regional estimate for London (gCO2/kWh, every 30 min, CC BY 4.0)
//   Northern Virginia: EIA hourly generation by fuel for the PJM grid  x  EIA's CO2 per kWh by fuel
//                      (calculated by Hum, so drawn as calculated)
// Both are generation-based: CO2 from making the electricity on that grid (NESO also counts imports).

export interface GridPoint {
  /** Start of the interval, ISO UTC. */
  t: string;
  /** gCO2 per kWh. */
  g: number;
}

export interface GridRegion {
  key: 'london' | 'virginia';
  hub: string;
  /** What the number is: NESO's regional estimate, or Hum's calculation from EIA's fuel mix. */
  kind: 'estimate' | 'calculated';
  source: { name: string; url: string; licence?: string };
  points: GridPoint[]; // oldest first, last 24 h
  /** Why there are no points (e.g. no API key yet, source down). */
  unavailable?: string;
}

export interface GridFile {
  fetchedAt: string;
  regions: GridRegion[];
}

// ---------- London (NESO) ----------

interface NesoRegional {
  data?: { data?: { from?: string; intensity?: { forecast?: number; actual?: number } }[] };
}

/** NESO's regional half-hours, oldest first; drops anything missing or implausible. */
export function parseNeso(json: unknown): GridPoint[] {
  const rows = (json as NesoRegional)?.data?.data ?? [];
  return rows
    .map((r) => ({ t: String(r.from ?? ''), g: Number(r.intensity?.actual ?? r.intensity?.forecast) }))
    .filter((p) => /^\d{4}-\d\d-\d\dT\d\d:\d\dZ$/.test(p.t) && Number.isFinite(p.g) && p.g >= 0 && p.g < 2000)
    .map((p) => ({ t: p.t.replace('Z', ':00Z'), g: p.g }))
    .sort((a, b) => a.t.localeCompare(b.t));
}

// ---------- Northern Virginia (EIA, PJM) ----------

export const LB_TO_G = 453.59237;

export interface FuelFactors {
  /** g CO2 per kWh generated, by EIA fuel-type code. Fuels not listed count as zero (EIA treats biomass,
   *  hydro, solar and wind as carbon neutral; nuclear emits none when generating). */
  COL: number;
  NG: number;
  OIL: number;
}

export const factorsFromLb = (coal: number, gas: number, oil: number): FuelFactors => ({ COL: coal * LB_TO_G, NG: gas * LB_TO_G, OIL: oil * LB_TO_G });

interface EiaRow {
  period?: string;
  fueltype?: string;
  value?: string | number | null;
}

/** EIA hourly generation by fuel (MWh) -> gCO2/kWh per hour, oldest first. Hours missing any data are
 *  dropped; negative generation (e.g. storage charging) isn't counted as generation. */
export function eiaIntensity(json: unknown, f: FuelFactors): GridPoint[] {
  const rows = ((json as { response?: { data?: EiaRow[] } })?.response?.data ?? []) as EiaRow[];
  const hours = new Map<string, { total: number; co2: number }>();
  for (const r of rows) {
    const mwh = Number(r.value);
    if (!r.period || !/^\d{4}-\d\d-\d\dT\d\d$/.test(r.period) || !Number.isFinite(mwh) || mwh <= 0) continue;
    const h = hours.get(r.period) ?? { total: 0, co2: 0 };
    h.total += mwh;
    h.co2 += mwh * (f[r.fueltype as keyof FuelFactors] ?? 0); // MWh x g/kWh = kg; ratio below is unit-free
    hours.set(r.period, h);
  }
  return [...hours.entries()]
    .filter(([, h]) => h.total > 0)
    .map(([p, h]) => ({ t: `${p}:00:00Z`, g: h.co2 / h.total }))
    .sort((a, b) => a.t.localeCompare(b.t));
}

// ---------- shared ----------

/** An AI answer's CO2 at this grid intensity, in milligrams: Wh x g/kWh = mg. */
export const answerMg = (g: number, whPerAnswer: number) => g * whPerAnswer;

export const latest = (r: GridRegion) => r.points[r.points.length - 1];

/** Keep only the last 24 hours up to the newest point. */
export function last24h(points: GridPoint[]): GridPoint[] {
  const end = points.length ? Date.parse(points[points.length - 1]!.t) : 0;
  return points.filter((p) => Date.parse(p.t) > end - 24 * 3600e3);
}
