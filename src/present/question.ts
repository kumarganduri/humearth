// /question: "Follow your question". One AI request leaves your phone, crosses the internet to a data centre,
// runs on its servers, draws power from a plant and water for cooling. Three meters fill as it passes the place
// each cost is paid. Pure HTML/SVG strings: the build prebuilds the page (readable with scripts off) and
// src/question.ts animates it.
//
//   phone ── fibre ── data centre ── servers ──── power plant ──── cooling
//                                      electricity    CO2             water      <- where each meter fills

import type { Constants } from '../footprint/types';
import type { SeriesFile } from '../footprint/series-types';
import { aiRates, perRequest, requestsPerSecond, type RequestFootprint, type RequestKind, type Triple } from '../footprint/rates';
import { esc, formatNumber } from './format';

export const KINDS: { kind: RequestKind; label: string; noun: string }[] = [
  { kind: 'question', label: 'Question', noun: 'question' },
  { kind: 'picture', label: 'Picture', noun: 'picture' },
  { kind: 'video', label: 'Short video', noun: 'short video' },
];

export interface Station {
  key: 'phone' | 'fibre' | 'dc' | 'servers' | 'power' | 'cooling';
  label: string;
  icon: string;
}
export const STATIONS: Station[] = [
  { key: 'phone', label: 'Your phone', icon: 'M-8,-14h16v28h-16z M-3,10h6' },
  { key: 'fibre', label: 'The internet', icon: 'M-14,0c7,-10 21,10 28,0' },
  { key: 'dc', label: 'A data centre', icon: 'M-14,10v-16l14,-8l14,8v16z M-6,10v-8h12v8' },
  { key: 'servers', label: 'Its servers', icon: 'M-12,-12h24v8h-24z M-12,-2h24v8h-24z M-12,8h24v6h-24z' },
  { key: 'power', label: 'A power plant', icon: 'M-14,12v-12l8,-5v5l8,-5v5l8,-5v17z M8,-4v-10' },
  { key: 'cooling', label: 'Cooling water', icon: 'M0,-14c-6,8 -10,13 -10,18a10,10 0 0 0 20,0c0,-5 -4,-10 -10,-18z' },
];

/** Each meter fills on the stretch that ends at the station where that cost is paid. */
export const METER_SPANS = { e: ['dc', 'servers'], c: ['servers', 'power'], w: ['power', 'cooling'] } as const;

type Pt = [number, number];
/** Station positions: a wide zigzag for desktop, a tall one for phones (so labels stay readable). */
export const LAYOUTS = {
  wide: { w: 1000, h: 300, pts: [[70, 200], [230, 110], [400, 190], [570, 110], [740, 200], [910, 110]] as Pt[] },
  tall: { w: 360, h: 640, pts: [[90, 60], [260, 160], [90, 260], [260, 360], [90, 460], [260, 570]] as Pt[] },
};

/** A smooth path through the points (Catmull-Rom as cubic Béziers), so the trip curves between stations. */
export function smoothPath(pts: Pt[]): string {
  const p = (i: number) => pts[Math.max(0, Math.min(pts.length - 1, i))]!;
  let d = `M${p(0)[0]},${p(0)[1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const [a, b, c, e] = [p(i - 1), p(i), p(i + 1), p(i + 2)];
    const c1: Pt = [b[0] + (c[0] - a[0]) / 6, b[1] + (c[1] - a[1]) / 6];
    const c2: Pt = [c[0] - (e[0] - b[0]) / 6, c[1] - (e[1] - b[1]) / 6];
    d += ` C${r(c1[0])},${r(c1[1])} ${r(c2[0])},${r(c2[1])} ${c[0]},${c[1]}`;
  }
  return d;
}
const r = (n: number) => Math.round(n * 10) / 10;

export function journeySvg(layout: keyof typeof LAYOUTS): string {
  const L = LAYOUTS[layout];
  const d = smoothPath(L.pts);
  const st = STATIONS.map((s, i) => {
    const [x, y] = L.pts[i]!;
    return `<g class="st" data-key="${s.key}" transform="translate(${x},${y})"><circle r="30"></circle><path class="ico" d="${s.icon}"></path><text y="52">${esc(s.label)}</text></g>`;
  }).join('');
  return `<svg class="journey ${layout}" viewBox="0 0 ${L.w} ${L.h}" aria-hidden="true"><path class="path" d="${d}"></path><path class="lit" d="${d}" stroke-dasharray="0 100000"></path>${st}<circle class="dot" r="7" cx="${L.pts[0]![0]}" cy="${L.pts[0]![1]}" opacity="0"></circle></svg>`;
}

/** How far each meter has filled, given which stretch the request has reached (0..1 each). */
export function meterProgress(progressByStation: Record<Station['key'], number>, along: number): { e: number; c: number; w: number } {
  const fill = ([a, b]: readonly [Station['key'], Station['key']]) => {
    const from = progressByStation[a];
    const to = progressByStation[b];
    return Math.max(0, Math.min(1, (along - from) / (to - from)));
  };
  return { e: fill(METER_SPANS.e), c: fill(METER_SPANS.c), w: fill(METER_SPANS.w) };
}

const UNITS = { e: 'Wh', w: 'mL', c: 'g' } as const;
export const figureOf = (f: RequestFootprint, m: 'e' | 'w' | 'c'): Triple => (m === 'e' ? f.wh : m === 'w' ? f.waterMl : f.co2g);
export const rangeLine = (t: Triple, m: 'e' | 'w' | 'c') => `range ${formatNumber(t[0])} to ${formatNumber(t[2])} ${UNITS[m]}`;

/** "That was one question: about 0.34 Wh. Right now AI around the world uses about 4.92 MWh every second, ..." */
export function endSentence(kind: RequestKind, c: Constants, s: SeriesFile): string {
  const k = KINDS.find((x) => x.kind === kind)!;
  const f = perRequest(kind, c);
  const rates = aiRates(s, c);
  const per = requestsPerSecond(f, rates);
  return `That was one ${k.noun}: about <b>${formatNumber(f.wh[1])} Wh</b> of electricity. Right now AI around the world uses about <b class="derived">${formatNumber(rates.whPerSecond[1] / 1e6)} MWh every second</b>: the same as <b class="derived">${formatNumber(per)}</b> of your ${k.noun}s, every second.`;
}

function staticTable(c: Constants): string {
  const rows = KINDS.map(({ kind, label }) => {
    const f = perRequest(kind, c);
    const cell = (t: Triple) => `${formatNumber(t[1])} <span class="rng">(${formatNumber(t[0])}–${formatNumber(t[2])})</span>`;
    return `<tr><th scope="row">${label}</th><td>${cell(f.wh)}</td><td>${cell(f.waterMl)}</td><td>${cell(f.co2g)}</td></tr>`;
  }).join('');
  return `<div class="table-scroll"><table class="per-req"><caption>One request, at the data centre (middle, then the range)</caption><thead><tr><th scope="col">Request</th><th scope="col">Electricity (Wh)</th><th scope="col">Water (mL)</th><th scope="col">CO2 (g)</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

export function questionPageHtml(c: Constants, s: SeriesFile): string {
  const kinds = KINDS.map((k, i) => `<button type="button" class="kind" data-kind="${k.kind}" aria-pressed="${i === 0}" disabled>${k.label}</button>`).join('');
  const meter = (m: 'e' | 'w' | 'c', name: string) =>
    `<div class="meter ${m}"><div class="k">${name}</div><div class="v"><span class="num" id="m-${m}">0</span> <small>${UNITS[m]}</small></div><div class="r" id="m-${m}r"></div></div>`;
  return `<section class="ask" aria-labelledby="q-h">
  <h1 id="q-h">Follow one AI request out of your phone.</h1>
  <p class="lede">Type anything. It goes nowhere: this is a simulation of where a real one would go, and what it would use on the way.</p>
  <form class="q-ask" id="q-form">
    <label class="sr-only" for="q-text">Your question</label>
    <input type="text" id="q-text" placeholder="Ask anything" maxlength="120" autocomplete="off" disabled>
    <div class="kinds" role="group" aria-label="Kind of request">${kinds}</div>
    <button type="submit" class="btn solid" id="q-send" disabled>Send</button>
  </form>
</section>
<div class="trip" role="img" aria-label="Your request travels from your phone, across the internet, to a data centre and its servers. The servers draw electricity from a power plant, which makes CO2, and the data centre uses water for cooling.">${journeySvg('wide')}${journeySvg('tall')}</div>
<section class="meters-wrap js-only" id="meters" aria-labelledby="m-h">
  <h2 id="m-h" class="sr-only">What it used</h2>
  <div class="meters">${meter('e', 'Electricity')}${meter('c', 'CO2')}${meter('w', 'Water')}</div>
  <p class="sr-only" id="trip-status" aria-live="polite"></p>
  <p class="q-end" id="q-end" aria-live="polite"></p>
</section>
<section class="col" aria-labelledby="t-h">
  <h2 id="t-h">All three, side by side</h2>
  ${staticTable(c)}
  <p class="src">Per request, counted at the data centre (not your phone). Electricity: Google, OpenAI and MIT Technology Review (questions); MIT Technology Review and Hugging Face researchers (pictures, short videos). Water: on-site cooling plus water used at power plants. CO2: from a very clean grid to the world average (middle) and China's grid (Ember, Google). Real requests vary a lot, so every figure has a range. <a href="/how-we-know.html#numbers">How we know</a></p>
</section>`;
}
