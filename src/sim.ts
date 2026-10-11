// /2030: every slider re-runs the same model the page was prebuilt with (rates.ts simulate2030).
//
//   grid sliders + efficiency ──input──► simulate2030 ──► stack (shares), gauges, verdict (polite live region)
import './analytics'; // visitor counts, real site only
import './base.css';
import './sim.css';
import './sim.generated.css'; // the prebuilt starting point's widths (moved out of style="" for the CSP)
import { cleanUpV1 } from './legacy';
import { simGrids, simulate2030, type SimInput } from './footprint/rates';
import { outputsHtml, shareText, START, verdict } from './present/sim';
import { readSim, simSearch } from './present/links';
import { replaceSearch } from './present/url';
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

  let last: ReturnType<typeof simulate2030> | undefined;
  const update = () => {
    const r = (last = simulate2030(s, c, grids, {
      mix: Object.fromEntries(sliders.map((i) => [i.dataset.grid!, Number(i.value)])),
      efficiency: Number(eff.value) / 100,
    }));
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
  // Your choices live in the link (?mix=clean:60,world:40&eff=50), written when a slider is released.
  const mixNow = () => Object.fromEntries(sliders.map((i) => [i.dataset.grid!, Number(i.value)]));
  const syncUrl = () => replaceSearch(simSearch(mixNow(), Number(eff.value), START));
  const set = (input: SimInput) => {
    for (const i of sliders) i.value = String(input.mix[i.dataset.grid!] ?? 0);
    eff.value = String(Math.round(input.efficiency * 100));
    update();
  };
  const reset = () => {
    set(START);
    syncUrl();
    $('s-shared').textContent = '';
  };

  // Share: the phone's share sheet where there is one, otherwise copy the link.
  const share = $<HTMLButtonElement>('s-share');
  share.addEventListener('click', async () => {
    syncUrl();
    const url = location.href;
    try {
      if (navigator.share && matchMedia('(pointer: coarse)').matches) {
        await navigator.share({ title: 'My 2030 · Hum', text: shareText(last!), url });
        return;
      }
      await navigator.clipboard.writeText(url);
      $('s-shared').textContent = 'Link copied. It opens exactly this 2030.';
    } catch (e) {
      if ((e as Error).name === 'AbortError') return; // closed the share sheet
      $('s-shared').textContent = `Copy this link: ${url}`;
    }
  });

  for (const i of [...sliders, eff]) {
    i.addEventListener('input', update);
    i.addEventListener('change', syncUrl);
    i.disabled = false;
  }
  $<HTMLButtonElement>('s-reset').addEventListener('click', reset);
  for (const b of ['s-reset', 's-share']) $<HTMLButtonElement>(b).disabled = false;
  const linked = readSim(location.search, grids.map((x) => x.key));
  if (linked) set(linked);
  else update();
}

Promise.all([getJson<Constants>('constants'), getJson<SeriesFile>('series'), getJson<GridsFile>('grids')])
  .then(([c, s, g]) => start(c, s, g))
  .catch(() => {
    $('s-verdict').textContent = "The sliders couldn't load. The table below shows every grid on its own.";
  });
