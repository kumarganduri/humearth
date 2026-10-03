// /live: "Since you opened this page, AI around the world has used..." A model of the yearly totals spread over
// every second (rates.ts), not a live feed; the page says so. Prebuilt: the per-second rates with their ranges
// (readable with scripts off); src/live.ts ticks the counters and fills the pool.
//
//   rates (Wh, L, g per second; low/mid/high) x seconds since {opened | midnight} -> totals
//   water -> Olympic pools: how many are full, how full the current one is

import type { Constants, Hub } from '../footprint/types';
import type { SeriesFile } from '../footprint/series-types';
import { aiRates, todayTWh, type Rates } from '../footprint/rates';
import { formatNumber } from './format';

export type Since = 'open' | 'midnight';

export const elapsedSeconds = (since: Since, openedAt: number, now: Date) => {
  if (since === 'open') return Math.max(0, (now.getTime() - openedAt) / 1000);
  const m = new Date(now);
  m.setHours(0, 0, 0, 0); // the visitor's own midnight
  return (now.getTime() - m.getTime()) / 1000;
};

export interface Totals {
  wh: number;
  litres: number;
  grams: number;
}
export const totalsAfter = (r: Rates, seconds: number): Totals => ({
  wh: r.whPerSecond[1] * seconds,
  litres: r.litresPerSecond[1] * seconds,
  grams: r.gramsCO2PerSecond[1] * seconds,
});

/** Energy in the unit that keeps the number readable: kWh, MWh, GWh. */
export function energyWords(wh: number): { n: string; unit: string } {
  if (wh >= 1e9) return { n: formatNumber(wh / 1e9), unit: 'GWh' };
  if (wh >= 1e6) return { n: formatNumber(wh / 1e6), unit: 'MWh' };
  return { n: formatNumber(wh / 1e3), unit: 'kWh' };
}
export const waterWords = (l: number) => ({ n: formatNumber(l), unit: 'litres' });
export function co2Words(g: number): { n: string; unit: string } {
  if (g >= 1e6) return { n: formatNumber(g / 1e6), unit: 'tonnes' };
  return { n: formatNumber(g / 1e3), unit: 'kg' };
}

/** Ticking counters: whole numbers in a fixed unit, so the last digits visibly move every tick. The middle rate
 *  only; the ranges are in "Every second" below. */
export function counterWords(t: Totals): { e: { n: string; unit: string }; w: { n: string; unit: string }; c: { n: string; unit: string } } {
  const whole = (n: number) => Math.floor(n).toLocaleString('en-US');
  return {
    e: t.wh >= 1e6 ? { n: whole(t.wh / 1e6), unit: 'MWh' } : { n: whole(t.wh / 1e3), unit: 'kWh' },
    w: { n: whole(t.litres), unit: 'litres' },
    c: t.grams >= 1e6 ? { n: whole(t.grams / 1e6), unit: 'tonnes' } : { n: whole(t.grams / 1e3), unit: 'kg' },
  };
}

/** Full pools so far, and how full the current one is (0..1). */
export function pools(litres: number, poolLitres: number): { full: number; frac: number } {
  const full = Math.floor(litres / poolLitres);
  return { full, frac: litres / poolLitres - full };
}

export const poolsWords = (full: number) => (full === 1 ? '1 Olympic pool filled' : `${formatNumber(full)} Olympic pools filled`);

/** AI's continuous power, and how many of the biggest hub that is. */
export function powerLine(r: Rates, hubs: Hub[]): string {
  const nova = hubs.find((h) => h.name === 'Northern Virginia');
  const gw = r.gigawatts[1];
  const like = nova ? `, about <span class="derived">${formatNumber((gw * 1000) / nova.mw.mid)}</span> times the data centres of Northern Virginia, the biggest hub Hum tracks (about ${formatNumber(nova.mw.mid)} MW)` : '';
  return `AI runs at about <span class="derived">${formatNumber(gw)} GW</span>, day and night${like}.`;
}

export function livePageHtml(c: Constants, s: SeriesFile, hubs: Hub[]): string {
  const r = aiRates(s, c);
  const { year } = todayTWh(s);
  const per = (t: [number, number, number], f: (x: number) => { n: string; unit: string }) => {
    const [lo, mid, hi] = t.map(f);
    return `<span><b class="derived">${mid!.n} ${mid!.unit}</b> <span class="rng">(${lo!.n} ${lo!.unit} to ${hi!.n} ${hi!.unit})</span></span>`;
  };
  const pool = c.values.olympicPoolLitres.mid;
  const secondsPerPool = pool / r.litresPerSecond[1];
  const counter = (k: 'e' | 'c', name: string) =>
    `<div class="count ${k}"><div class="k">${name}</div><div class="v"><span class="num" id="l-${k}">0</span> <small id="l-${k}u">${k === 'e' ? 'kWh' : 'kg'}</small></div></div>`;
  return `<section class="live-head" aria-labelledby="l-h">
  <h1 id="l-h"><span id="l-title">Since you opened this page</span>, AI around the world has used:</h1>
  <div class="since js-only" role="group" aria-label="Count from" id="since">
    <button type="button" class="kind" data-since="open" aria-pressed="true">Since you opened it</button>
    <button type="button" class="kind" data-since="midnight" aria-pressed="false">Since midnight</button>
  </div>
</section>
<div class="live-board js-only" id="board">
  <div class="pool-col">
    <div class="pool" aria-hidden="true"><div class="water" id="pool-fill"></div><span class="pool-label">one Olympic pool</span></div>
    <div class="count w"><div class="k">Water</div><div class="v"><span class="num" id="l-w">0</span> <small id="l-wu">litres</small></div><div class="sub" id="l-pools">0 Olympic pools filled</div></div>
  </div>
  <div class="counts">${counter('e', 'Electricity')}${counter('c', 'CO2')}</div>
</div>
<section class="col" aria-labelledby="ps-h">
  <h2 id="ps-h">Every second</h2>
  <ul class="per-sec">
    <li class="e"><span class="k">Electricity</span> ${per(r.whPerSecond, energyWords)}</li>
    <li class="w"><span class="k">Water</span> ${per(r.litresPerSecond, waterWords)}</li>
    <li class="c"><span class="k">CO2</span> ${per(r.gramsCO2PerSecond, co2Words)}</li>
  </ul>
  <p>${powerLine(r, hubs)} At this rate AI fills an Olympic pool (${formatNumber(pool / 1e6)} million litres) with the water it uses about every <span class="derived">${formatNumber(secondsPerPool / 60)} minutes</span>.</p>
  <p class="src">A model, not a live meter: the world's data-centre electricity in ${year} (IEA) times AI's share (${formatNumber(c.values.aiShareOfDataCentres.low * 100)}–${formatNumber(c.values.aiShareOfDataCentres.high * 100)}%, a United States figure used as a world estimate), spread evenly over the year. Water: on-site cooling plus power-plant water per kWh. CO2: world-average grid (middle). Dotted numbers are calculated. <a href="/how-we-know.html#numbers">How we know</a></p>
</section>`;
}
