// /live: counters tick at the middle rate (rates.ts) from the moment the page opened, or from midnight.
// The per-second figures and their ranges are prebuilt in the page; this only animates them.
//
//   every ~100 ms while visible: seconds since {open | midnight} -> totals -> counters, pool level, pools filled
import './analytics'; // visitor counts, real site only
import './base.css';
import './live.css';
import { cleanUpV1, safeLocalStorage } from './legacy';
import { aiRates } from './footprint/rates';
import { counterWords, elapsedSeconds, pools, poolsWords, totalsAfter, type Since } from './present/live';
import type { Constants } from './footprint/types';
import { gridHtml } from './livegrid/view';
import type { GridFile } from './livegrid/grid';
import type { SeriesFile } from './footprint/series-types';

cleanUpV1(safeLocalStorage(), globalThis.location, globalThis.history);

const $ = (id: string) => document.getElementById(id)!;
const openedAt = Date.now();
const TICK_MS = 100;

async function getJson<T>(name: string): Promise<T> {
  const r = await fetch(`/data/${name}.json`);
  if (!r.ok) throw new Error(`${name}.json ${r.status}`);
  return r.json() as Promise<T>;
}

function start(c: Constants, s: SeriesFile) {
  const rates = aiRates(s, c);
  const poolL = c.values.olympicPoolLitres.mid;
  let since: Since = 'midnight'; // opens with today's totals: big numbers and a part-filled pool at once
  const buttons = [...document.querySelectorAll<HTMLButtonElement>('#since [data-since]')];
  for (const b of buttons) {
    b.addEventListener('click', () => {
      since = b.dataset.since as Since;
      for (const x of buttons) x.setAttribute('aria-pressed', String(x === b));
      $('l-title').textContent = since === 'open' ? 'Since you opened this page' : 'Since midnight today';
      tick(); // shows the new total even while paused
    });
  }

  const tick = () => {
    const t = totalsAfter(rates, elapsedSeconds(since, openedAt, new Date()));
    const w = counterWords(t);
    for (const k of ['e', 'w', 'c'] as const) {
      $(`l-${k}`).textContent = w[k].n;
      $(`l-${k}u`).textContent = w[k].unit;
    }
    const p = pools(t.litres, poolL);
    $('l-pools').textContent = poolsWords(p.full);
    $('pool-fill').style.transform = `scaleY(${p.frac.toFixed(4)})`; // CSSOM: allowed by the CSP
  };

  let timer: number | undefined;
  // Paused by the visitor (the pause control moving content needs, WCAG 2.2.2) or by a hidden tab.
  let held = false;
  const run = () => {
    if (timer === undefined && !document.hidden && !held) timer = window.setInterval(tick, TICK_MS);
  };
  const pause = () => {
    clearInterval(timer);
    timer = undefined;
  };
  document.addEventListener('visibilitychange', () => (document.hidden ? pause() : (tick(), run())));
  const hold = document.getElementById('l-hold') as HTMLButtonElement;
  hold.addEventListener('click', () => {
    held = !held;
    hold.setAttribute('aria-pressed', String(held));
    hold.textContent = held ? 'Resume counting' : 'Pause counting';
    if (held) pause();
    else {
      tick();
      run();
    }
  });
  tick();
  run();
}

/** "Right now on the grid": fetched from our own /api/grid (the edge fetches the grid operators). */
async function startGrid(c: Constants) {
  const box = $('grid-now');
  const time = (iso: string) => new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' }).format(new Date(iso));
  const ctx = { whPerAnswer: c.values.textPromptWh.mid, worldG: c.values.gridGCO2PerKWh.mid, time };
  try {
    const r = await fetch('/api/grid');
    if (!r.ok) throw new Error(String(r.status));
    box.innerHTML = gridHtml((await r.json()) as GridFile, ctx);
  } catch {
    box.innerHTML = '<p class="g-none">The live grid figures couldn\'t load just now. Try again in a few minutes.</p>';
  }
}

Promise.all([getJson<Constants>('constants'), getJson<SeriesFile>('series')])
  .then(([c, s]) => (start(c, s), startGrid(c)))
  .catch(() => {
    /* the per-second figures below are prebuilt and still tell the story */
  });
