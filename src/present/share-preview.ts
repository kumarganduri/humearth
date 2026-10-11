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

export function sharedPreview(search: string, d: PreviewData): { title: string; description: string } | null {
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
    title: `My 2030: ${formatNumber(r.mtCO2)} million tonnes of CO2 from data centres`,
    description: `${mix}; ${eff ? `${eff}% of the IEA's efficiency gains` : 'no extra efficiency'}. ${verdict(r, d.series)} Try yours on Hum.`,
  };
}
