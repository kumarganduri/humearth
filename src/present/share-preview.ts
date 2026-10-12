// The link preview for a shared /2030 link: "My 2030: 227 million tonnes of CO2 from data centres".
// Crawlers (WhatsApp, X, ...) don't run JavaScript, so functions/2030.ts computes this at the edge with the
// same model as the page and rewrites the preview tags. Pure: tested in share-preview.test.ts.

import type { Constants, GridsFile } from '../footprint/types';
import type { SeriesFile } from '../footprint/series-types';
import { simGrids, simulate2030 } from '../footprint/rates';
import { readSim } from './links';
import { formatNumber } from './format';
import { verdict } from './sim';

export interface PreviewData {
  constants: Constants;
  series: SeriesFile;
  grids: GridsFile;
}

/** The range of results /2030 can produce, in whole million tonnes: cleanest grid with full efficiency to
 *  the dirtiest grid with none. scripts/build-og.ts pre-renders one personal card per whole number in it. */
export function resultRange(series: SeriesFile, constants: Constants, gridsFile: GridsFile): { min: number; max: number } {
  const grids = simGrids(gridsFile.grids, constants);
  const at = (key: string, eff: number) => simulate2030(series, constants, grids, { mix: { [key]: 1 }, efficiency: eff }).mtCO2;
  const byIntensity = [...grids].sort((a, b) => a.gCO2PerKWh - b.gCO2PerKWh);
  return { min: Math.floor(at(byIntensity[0]!.key, 1)), max: Math.ceil(at(byIntensity[byIntensity.length - 1]!.key, 0)) };
}

/** The pre-rendered card for a result: whole million tonnes, kept inside the rendered range. */
export function personalImagePath(mt: number, d: PreviewData): string {
  const { min, max } = resultRange(d.series, d.constants, d.grids);
  return `/og/2030/${Math.min(max, Math.max(min, Math.round(mt)))}.png`;
}

export function sharedPreview(search: string, d: PreviewData): { title: string; description: string; image: string; imageAlt: string } | null {
  const grids = simGrids(d.grids.grids, d.constants);
  const input = readSim(search, grids.map((g) => g.key));
  if (!input) return null;
  const r = simulate2030(d.series, d.constants, grids, input);
  const mix = grids
    .filter((g) => (r.shares[g.key] ?? 0) > 0)
    .sort((a, b) => (r.shares[b.key] ?? 0) - (r.shares[a.key] ?? 0))
    .map((g) => `${Math.round((r.shares[g.key] ?? 0) * 100)}% ${g.name.toLowerCase()}`)
    .join(', ');
  const eff = Math.round(input.efficiency * 100);
  return {
    image: personalImagePath(r.mtCO2, d),
    imageAlt: `My 2030 for the world's data centres: ${formatNumber(r.mtCO2)} million tonnes of CO2 a year, shown on a bar against ${d.series.metrics.co2.latestMeasuredYear}.`,
    title: `My 2030: ${formatNumber(r.mtCO2)} million tonnes of CO2 from data centres`,
    description: `${mix}; ${eff ? `${eff}% of the IEA's efficiency gains` : 'no extra efficiency'}. ${verdict(r, d.series)} Try yours on Hum.`,
  };
}
