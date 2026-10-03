// /live: counters tick at the middle rate (rates.ts) from the moment the page opened, or from midnight.
// The per-second figures and their ranges are prebuilt in the page; this only animates them.
//
//   every ~100 ms while visible: seconds since {open | midnight} -> totals -> counters, pool level, pools filled
import './base.css';
import './live.css';
import { cleanUpV1 } from './legacy';
import { aiRates } from './footprint/rates';
import { counterWords, elapsedSeconds, pools, poolsWords, totalsAfter, type Since } from './present/live';
import type { Constants } from './footprint/types';
import type { SeriesFile } from './footprint/series-types';

cleanUpV1(globalThis.localStorage, globalThis.location, globalThis.history);

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
  let since: Since = 'open';
  const buttons = [...document.querySelectorAll<HTMLButtonElement>('#since .kind')];
  for (const b of buttons) {
    b.addEventListener('click', () => {
      since = b.dataset.since as Since;
      for (const x of buttons) x.setAttribute('aria-pressed', String(x === b));
      $('l-title').textContent = since === 'open' ? 'Since you opened this page' : 'Since midnight today';
      tick();
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
    $('pool-fill').style.height = `${(p.frac * 100).toFixed(2)}%`; // CSSOM: allowed by the CSP
  };

  let timer: number | undefined;
  const run = () => {
    if (timer === undefined && !document.hidden) timer = window.setInterval(tick, TICK_MS);
  };
  const pause = () => {
    clearInterval(timer);
    timer = undefined;
  };
  document.addEventListener('visibilitychange', () => (document.hidden ? pause() : (tick(), run())));

  $('board').hidden = false;
  $('since').hidden = false;
  tick();
  run();
}

Promise.all([getJson<Constants>('constants'), getJson<SeriesFile>('series')])
  .then(([c, s]) => start(c, s))
  .catch(() => {
    /* the per-second figures below are prebuilt and still tell the story */
  });
