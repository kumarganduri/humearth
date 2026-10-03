// Numbers for the experiences (/question, /live, /2030). Pure; every input is a sourced figure, every output
// is a low / mid / high triple so the page can always show the range.
//
//   aiRates         AI worldwide per second: today's data-centre electricity x AI's share
//   perRequest      one question / picture / short video: Wh, mL of water, g of CO2
//   simulate2030    a grid mix + an efficiency choice -> 2030 electricity, CO2, water

import type { Constants, Grid, Level } from './types';
import type { SeriesFile } from './series-types';

export type Triple = [low: number, mid: number, high: number];
const tri = (f: (l: Level, i: 0 | 1 | 2) => number): Triple => [f('low', 0), f('mid', 1), f('high', 2)];

export const SECONDS_PER_YEAR = 365.25 * 24 * 3600;
/** Litres of water per kWh: cooling on site + at the power plant. */
export const waterLPerKWh = (c: Constants): Triple => tri((l) => c.values.onsiteWaterLPerKWh[l] + c.values.offsiteWaterLPerKWh[l]);

/** Today's (latest measured) data-centre electricity, TWh a year. */
export function todayTWh(s: SeriesFile): { year: number; twh: number } {
  const e = s.metrics.electricity;
  const y = e.years.find((x) => x.year === e.latestMeasuredYear)!;
  return { year: y.year, twh: y.mid.value! };
}

export interface Rates {
  whPerSecond: Triple;
  litresPerSecond: Triple;
  gramsCO2PerSecond: Triple;
  /** Continuous power, in GW (mid uses the mid share). */
  gigawatts: Triple;
}

/** AI around the world, per second (AI's share is a US figure used as a world estimate). */
export function aiRates(s: SeriesFile, c: Constants): Rates {
  const { twh } = todayTWh(s);
  const whPerSecond = tri((l) => (twh * 1e12 * c.values.aiShareOfDataCentres[l]) / SECONDS_PER_YEAR);
  const water = waterLPerKWh(c);
  return {
    whPerSecond,
    litresPerSecond: tri((_, i) => (whPerSecond[i] / 1000) * water[i]),
    gramsCO2PerSecond: tri((l, i) => (whPerSecond[i] / 1000) * c.values.gridGCO2PerKWh[l]),
    gigawatts: tri((_, i) => (whPerSecond[i] * 3600) / 1e9),
  };
}

export type RequestKind = 'question' | 'picture' | 'video';
const KIND_KEY = { question: 'textPromptWh', picture: 'imageWh', video: 'videoClipWh' } as const;

export interface RequestFootprint {
  wh: Triple;
  waterMl: Triple;
  co2g: Triple;
}

/** One request, counted at the data centre (not your phone). */
export function perRequest(kind: RequestKind, c: Constants): RequestFootprint {
  const v = c.values[KIND_KEY[kind]];
  const water = waterLPerKWh(c);
  const wh = tri((l) => v[l]);
  return {
    wh,
    waterMl: tri((_, i) => wh[i] * water[i]),
    co2g: tri((l, i) => (wh[i] / 1000) * c.values.gridGCO2PerKWh[l]),
  };
}

/** How many of this request AI worldwide does every second, in electricity terms (mid / mid). */
export const requestsPerSecond = (r: RequestFootprint, rates: Rates) => rates.whPerSecond[1] / r.wh[1];

export interface SimInput {
  /** Relative weights per grid key (normalised to shares); "clean" = clean-power deals. */
  mix: Record<string, number>;
  /** 0..1: how much of the IEA's High Efficiency saving is achieved. */
  efficiency: number;
}

export interface SimGrid {
  key: string;
  name: string;
  gCO2PerKWh: number;
}

/** The grids on offer: the sourced grids plus "clean-power deals" at the lowest published intensity. */
export function simGrids(grids: Grid[], c: Constants): SimGrid[] {
  return [...grids.map(({ key, name, gCO2PerKWh }) => ({ key, name, gCO2PerKWh })), { key: 'clean', name: 'Clean-power deals', gCO2PerKWh: c.values.gridGCO2PerKWh.low }];
}

export interface SimResult {
  twh: number;
  baseTWh: number;
  /** Fraction of electricity the full efficiency path saves (IEA 2035 High Efficiency vs base). */
  efficiencyCut: number;
  gramsPerKWh: number;
  mtCO2: number;
  waterBillionLitres: Triple;
  shares: Record<string, number>;
  todayMtCO2: number;
}

export function simulate2030(s: SeriesFile, c: Constants, grids: SimGrid[], input: SimInput): SimResult {
  const e = s.metrics.electricity;
  const at = (y: number) => e.years.find((x) => x.year === y)!;
  const baseTWh = at(2030).mid.value!;
  const efficiencyCut = 1 - c.values.dcHighEfficiency2035TWh.mid / at(2035).mid.value!;
  const eff = Math.min(1, Math.max(0, Number.isFinite(input.efficiency) ? input.efficiency : 0));
  const twh = baseTWh * (1 - efficiencyCut * eff);
  const weights = grids.map((g) => Math.max(0, input.mix[g.key] ?? 0));
  const total = weights.reduce((a, b) => a + b, 0);
  const shares = Object.fromEntries(grids.map((g, i) => [g.key, total ? weights[i]! / total : 1 / grids.length]));
  const gramsPerKWh = grids.reduce((a, g) => a + shares[g.key]! * g.gCO2PerKWh, 0);
  const water = waterLPerKWh(c);
  const co2 = s.metrics.co2;
  const todayCO2 = co2.years.find((y) => y.year === co2.latestMeasuredYear)!.mid.value!;
  return {
    twh,
    baseTWh,
    efficiencyCut,
    gramsPerKWh,
    mtCO2: (twh * 1e9 * gramsPerKWh) / 1e12,
    waterBillionLitres: water.map((w) => (twh * 1e9 * w) / 1e9) as Triple,
    shares,
    todayMtCO2: todayCO2,
  };
}
