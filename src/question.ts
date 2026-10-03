// /question: the request's trip, animated. The page (stations, meters, table) is prebuilt; this wakes the form.
//
//   Send ──► dot travels phone → cooling (5.2 s, eased; instant with reduced motion)
//            ├ stations light as it passes
//            ├ meters fill on their stretch (electricity: servers, CO2: power plant, water: cooling)
//            └ end: ranges under each meter + "AI around the world, every second" sentence
//
// Nothing typed ever leaves the page: there is no request, and the CSP (form-action 'none') forbids one.
import './base.css';
import './question.css';
import { cleanUpV1 } from './legacy';
import { formatNumber } from './present/format';
import { endSentence, figureOf, meterProgress, rangeLine, STATIONS, type Station } from './present/question';
import { perRequest, type RequestKind } from './footprint/rates';
import type { Constants } from './footprint/types';
import type { SeriesFile } from './footprint/series-types';

cleanUpV1(globalThis.localStorage, globalThis.location, globalThis.history);

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const TRIP_MS = 5200;
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

async function getJson<T>(name: string): Promise<T> {
  const r = await fetch(`/data/${name}.json`);
  if (!r.ok) throw new Error(`${name}.json ${r.status}`);
  return r.json() as Promise<T>;
}

/** The journey drawn at this screen size (wide or tall; CSS shows one). */
function visibleTrip() {
  const svg = [...document.querySelectorAll<SVGSVGElement>('.trip svg')].find((s) => s.getBoundingClientRect().width > 0)!;
  const lit = svg.querySelector<SVGPathElement>('.lit')!;
  const total = lit.getTotalLength();
  const stations = [...svg.querySelectorAll<SVGGElement>('.st')];
  // How far along the path each station sits (nearest point, sampled every 4 units).
  const at = {} as Record<Station['key'], number>;
  for (const g of stations) {
    const m = /translate\(([\d.]+),([\d.]+)\)/.exec(g.getAttribute('transform')!)!;
    const [x, y] = [Number(m[1]), Number(m[2])];
    let best = 0;
    let bd = Infinity;
    for (let l = 0; l <= total; l += 4) {
      const p = lit.getPointAtLength(l);
      const d = Math.hypot(p.x - x, p.y - y);
      if (d < bd) [bd, best] = [d, l];
    }
    at[g.dataset.key as Station['key']] = best;
  }
  return { svg, lit, total, stations, at, dot: svg.querySelector<SVGCircleElement>('.dot')! };
}

function start(c: Constants, s: SeriesFile) {
  let kind: RequestKind = 'question';
  let running = false;
  const kinds = [...document.querySelectorAll<HTMLButtonElement>('.kind')];
  const send = $<HTMLButtonElement>('q-send');

  const setMeters = (k: { e: number; c: number; w: number }) => {
    const f = perRequest(kind, c);
    for (const m of ['e', 'c', 'w'] as const) {
      $(`m-${m}`).textContent = formatNumber(figureOf(f, m)[1] * k[m]);
      $(`m-${m}r`).textContent = k[m] === 1 ? rangeLine(figureOf(f, m), m) : '';
    }
  };
  const reset = () => {
    setMeters({ e: 0, c: 0, w: 0 });
    $('q-end').textContent = '';
    $('trip-status').textContent = '';
    for (const svg of document.querySelectorAll('.trip svg')) {
      svg.querySelector('.lit')!.setAttribute('stroke-dasharray', '0 100000');
      svg.querySelector('.dot')!.setAttribute('opacity', '0');
      for (const g of svg.querySelectorAll('.st')) g.classList.remove('on');
    }
  };

  for (const b of kinds) {
    b.addEventListener('click', () => {
      if (running) return;
      kind = b.dataset.kind as RequestKind;
      for (const x of kinds) x.setAttribute('aria-pressed', String(x === b));
      reset();
    });
  }

  $('q-form').addEventListener('submit', (e) => {
    e.preventDefault();
    if (running) return;
    running = true;
    send.disabled = true;
    reset();
    const trip = visibleTrip();
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dur = reduce ? 0 : TRIP_MS;
    // On phones the trip starts below the form: bring it into view so the send is seen, not just heard.
    const top = trip.svg.getBoundingClientRect().top;
    if (top > innerHeight * 0.6 || top < 0) trip.svg.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
    const t0 = performance.now();
    let announced = -1;
    const step = (t: number) => {
      const k = dur ? Math.min(1, (t - t0) / dur) : 1;
      const along = ease(k) * trip.total;
      const p = trip.lit.getPointAtLength(along);
      trip.dot.setAttribute('cx', String(p.x));
      trip.dot.setAttribute('cy', String(p.y));
      trip.dot.setAttribute('opacity', '1');
      trip.lit.setAttribute('stroke-dasharray', `${along} ${trip.total}`);
      let reached = -1;
      trip.stations.forEach((g, i) => {
        const on = along >= trip.at[g.dataset.key as Station['key']] - 2;
        g.classList.toggle('on', on);
        if (on) reached = i;
      });
      // Screen readers hear the trip too: one polite line per station, as the dot reaches it.
      if (reached > announced && dur) {
        announced = reached;
        $('trip-status').textContent = `Reached: ${STATIONS[reached]!.label}.`;
      }
      setMeters(meterProgress(trip.at, along));
      if (k < 1) return void requestAnimationFrame(step);
      setMeters({ e: 1, c: 1, w: 1 });
      $('q-end').innerHTML = endSentence(kind, c, s);
      running = false;
      send.disabled = false;
    };
    requestAnimationFrame(step);
  });

  for (const el of [...kinds, send, $<HTMLInputElement>('q-text')]) el.disabled = false;
  reset();
}

Promise.all([getJson<Constants>('constants'), getJson<SeriesFile>('series')])
  .then(([c, s]) => start(c, s))
  .catch(() => {
    $('q-end').textContent = "The animation couldn't load. The table below has every figure.";
  });

