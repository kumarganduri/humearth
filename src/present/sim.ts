// /2030: "You run it". Choose which grids power 2030's data centres and how far efficiency goes; see the CO2,
// electricity and water. The model is rates.ts simulate2030; this file is the page's words and HTML.
// Prebuilt at the starting point (all world-average grid, no extra efficiency), readable with scripts off.
//
//   sliders (grid weights, efficiency) -> simulate2030 -> CO2 gauge (white line = latest published CO2 year), electricity, water, verdict

import type { Constants, Grid } from '../footprint/types';
import type { SeriesFile } from '../footprint/series-types';
import { simGrids, simulate2030, type SimGrid, type SimInput, type SimResult } from '../footprint/rates';
import { niceMax } from '../charts/scale';
import { esc, formatNumber } from './format';

export const START: SimInput = { mix: { world: 100 }, efficiency: 0 };

/** Where each grid's number comes from, shown under its slider. */
export const gridSource = (g: SimGrid) => (g.key === 'clean' ? `${g.gCO2PerKWh} g/kWh · Google, market-based` : `${g.gCO2PerKWh} g/kWh · Ember, 2024`);

/** The CO2 gauge's scale: every grid at full 2030 demand fits. */
export const gaugeMax = (r: SimResult, grids: SimGrid[]) => niceMax((r.baseTWh * 1e9 * Math.max(...grids.map((g) => g.gCO2PerKWh))) / 1e12);

const pct = (x: number) => `${Math.round(x * 100)}%`;

/** Both comparisons use the same year: the latest year with a published CO2 figure (and that year's electricity). */
export function baseline(s: SeriesFile): { year: number; twh: number } {
  const year = s.metrics.co2.latestMeasuredYear;
  return { year, twh: s.metrics.electricity.years.find((y) => y.year === year)!.mid.value! };
}

export function verdict(r: SimResult, s: SeriesFile): string {
  const b = baseline(s);
  const times = formatNumber(r.twh / b.twh);
  const d = r.mtCO2 / r.todayMtCO2;
  if (d < 0.9) return `You cut emissions to ${pct(d)} of ${b.year}'s, while data centres use ${times} times their ${b.year} electricity.`;
  if (d <= 1.1) return `Emissions about the same as ${b.year}, with ${times} times the electricity.`;
  return `Emissions ${formatNumber(d)} times ${b.year}'s. Where data centres plug in matters as much as how much they use.`;
}

export function outputsHtml(r: SimResult, grids: SimGrid[], co2Year: number): string {
  const max = gaugeMax(r, grids);
  const saved = r.baseTWh - r.twh;
  return `<div class="gauge"><div class="k">CO2 from data-centre electricity in 2030</div><div class="v c"><span class="derived">${formatNumber(r.mtCO2)}</span> <small>million tonnes a year</small></div><div class="bar"><i style="width:${((Math.min(r.mtCO2, max) / max) * 100).toFixed(2)}%"></i><b style="left:${((r.todayMtCO2 / max) * 100).toFixed(2)}%"></b></div><div class="ref">White line: ${co2Year}, ${formatNumber(r.todayMtCO2)} million tonnes (IEA)</div></div>
<div class="gauge"><div class="k">Electricity</div><div class="v e">${saved > 0 ? `<span class="derived">${formatNumber(r.twh)}</span>` : formatNumber(r.twh)} <small>TWh a year</small></div><div class="ref">${saved > 0 ? `IEA forecast ${formatNumber(r.baseTWh)}; your efficiency saves <span class="derived">${formatNumber(saved)}</span>` : 'IEA forecast for 2030'}</div></div>
<div class="gauge"><div class="k">Water (cooling + power plants)</div><div class="v w"><span class="derived">${formatNumber(r.waterBillionLitres[1])}</span> <small>billion litres</small></div><div class="ref">range <span class="derived">${formatNumber(r.waterBillionLitres[0])}</span> to <span class="derived">${formatNumber(r.waterBillionLitres[2])}</span></div></div>`;
}

export function stackHtml(r: SimResult, grids: SimGrid[]): string {
  return grids.map((g) => `<span class="g-${g.key}" style="width:${((r.shares[g.key] ?? 0) * 100).toFixed(2)}%"></span>`).join('');
}

export function simPageHtml(c: Constants, s: SeriesFile, gridList: Grid[]): string {
  const grids = simGrids(gridList, c);
  const r = simulate2030(s, c, grids, START);
  const co2Year = s.metrics.co2.latestMeasuredYear;
  const rows = grids
    .map((g) => {
      const v = START.mix[g.key] ?? 0;
      return `<div class="row"><label for="s-${g.key}">${esc(g.name)}<span class="g">${esc(gridSource(g))}</span></label><input type="range" id="s-${g.key}" data-grid="${g.key}" min="0" max="100" step="5" value="${v}" disabled><output class="num" id="s-${g.key}v" for="s-${g.key}">${pct(r.shares[g.key] ?? 0)}</output></div>`;
    })
    .join('');
  const each = grids
    .map((g) => {
      const one = simulate2030(s, c, grids, { mix: { [g.key]: 1 }, efficiency: 0 });
      return `<tr><th scope="row">${esc(g.name)}</th><td>${formatNumber(g.gCO2PerKWh)}</td><td><span class="derived">${formatNumber(one.mtCO2)}</span></td></tr>`;
    })
    .join('');
  return `<section class="sim-head" aria-labelledby="s-h">
  <h1 id="s-h">It's 2030. You decide where the world's data centres get their power.</h1>
  <p class="lede">The IEA expects data centres to need about ${formatNumber(r.baseTWh)} TWh in 2030. In ${co2Year} their electricity put out about ${formatNumber(r.todayMtCO2)} million tonnes of CO2. Mix the grids they plug into, and choose how efficient AI gets.</p>
</section>
<div class="sim">
  <form class="mix" id="mix" aria-labelledby="mix-h">
    <h2 id="mix-h" class="sr-only">Your choices</h2>
    <div class="stack" id="s-stack" aria-hidden="true">${stackHtml(r, grids)}</div>
    ${rows}
    <div class="row eff"><label for="s-eff">Efficiency<span class="g">lighter models, better chips</span></label><input type="range" id="s-eff" min="0" max="100" step="5" value="0" disabled><output class="num" id="s-effv" for="s-eff">0%</output></div>
    <button type="button" class="btn" id="s-reset" disabled>Start again</button>
  </form>
  <div class="out">
    <div id="s-out">${outputsHtml(r, grids, co2Year)}</div>
    <p class="verdict" id="s-verdict" aria-live="polite">${esc(verdict(r, s))}</p>
  </div>
</div>
<section class="col" aria-labelledby="e-h">
  <h2 id="e-h">One grid at a time</h2>
  <p>If all of 2030's ${formatNumber(r.baseTWh)} TWh came from one kind of grid, with no extra efficiency:</p>
  <div class="table-scroll"><table class="each"><thead><tr><th scope="col">Grid</th><th scope="col">g CO2 per kWh</th><th scope="col">Million tonnes CO2</th></tr></thead><tbody>${each}</tbody></table></div>
  <p class="src">Grid intensities are 2024 figures (Ember; clean-power deals: Google's market-based figure), so real 2030 grids will be somewhat cleaner. Efficiency at 100% is the IEA's High Efficiency case: about <span class="derived">${pct(r.efficiencyCut)}</span> less electricity than its base case (from its 2035 figures, ${formatNumber(c.values.dcHighEfficiency2035TWh.mid)} vs ${formatNumber(s.metrics.electricity.years.find((y) => y.year === 2035)!.mid.value!)} TWh). Water uses the middle litres per kWh. Dotted numbers are calculated. <a href="/how-we-know.html#grids">How we know</a></p>
</section>`;
}
