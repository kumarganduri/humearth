// /2030: every slider re-runs the same model the page was prebuilt with (rates.ts simulate2030).
//
//   grid sliders + efficiency ──input──► simulate2030 ──► stack (shares), gauges, verdict (polite live region)
import './analytics'; // visitor counts, real site only
import './base.css';
import './sim.css';
import './sim.generated.css'; // the prebuilt starting point's widths (moved out of style="" for the CSP)
import { cleanUpV1 } from './legacy';
import { simGrids, simulate2030 } from './footprint/rates';
import { outputsHtml, START, verdict } from './present/sim';
import { applyStyleData, stylesToData } from './present/inline-styles';
import type { Constants, GridsFile } from './footprint/types';
import type { SeriesFile } from './footprint/series-types';

cleanUpV1(globalThis.localStorage, globalThis.location, globalThis.history);

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;

async function getJson<T>(name: string): Promise<T> {
  const r = await fetch(`/data/${name}.json`);
  if (!r.ok) throw new Error(`${name}.json ${r.status}`);
  return r.json() as Promise<T>;
}

function start(c: Constants, s: SeriesFile, g: GridsFile) {
  const grids = simGrids(g.grids, c);
  const sliders = [...document.querySelectorAll<HTMLInputElement>('#mix input[data-grid]')];
  const eff = $<HTMLInputElement>('s-eff');
  const co2Year = s.metrics.co2.latestMeasuredYear;

  const update = () => {
    const r = simulate2030(s, c, grids, {
      mix: Object.fromEntries(sliders.map((i) => [i.dataset.grid!, Number(i.value)])),
      efficiency: Number(eff.value) / 100,
    });
    for (const i of sliders) $(`s-${i.dataset.grid}v`).textContent = `${Math.round((r.shares[i.dataset.grid!] ?? 0) * 100)}%`;
    $('s-effv').textContent = `${eff.value}%`;
    for (const span of $('s-stack').querySelectorAll<HTMLElement>('span')) {
      const key = /g-(\w+)/.exec(span.className)![1]!;
      span.style.width = `${((r.shares[key] ?? 0) * 100).toFixed(2)}%`; // CSSOM: allowed by the CSP
    }
    const out = $('s-out');
    out.innerHTML = stylesToData(outputsHtml(r, grids, co2Year)); // never hand style="" to the parser
    applyStyleData(out);
    const v = verdict(r, s);
    if ($('s-verdict').textContent !== v) $('s-verdict').textContent = v;
  };
  const reset = () => {
    for (const i of sliders) i.value = String(START.mix[i.dataset.grid!] ?? 0);
    eff.value = String(START.efficiency * 100);
    update();
  };

  for (const i of [...sliders, eff]) {
    i.addEventListener('input', update);
    i.disabled = false;
  }
  $<HTMLButtonElement>('s-reset').addEventListener('click', reset);
  $<HTMLButtonElement>('s-reset').disabled = false;
  update();
}

Promise.all([getJson<Constants>('constants'), getJson<SeriesFile>('series'), getJson<GridsFile>('grids')])
  .then(([c, s, g]) => start(c, s, g))
  .catch(() => {
    $('s-verdict').textContent = "The sliders couldn't load. The table below shows every grid on its own.";
  });
