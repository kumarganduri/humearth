// Stage 3 on /live: "Right now on the grid" cards, as pure HTML strings (tested in view.test.ts).
// Calculated figures (Virginia) are drawn dotted, per DESIGN.md; NESO's own figure is labelled an estimate.

import { esc, formatNumber } from '../present/format';
import { answerMg, latest, type GridFile, type GridPoint, type GridRegion } from './grid';

export interface GridViewContext {
  /** Electricity per AI answer, middle figure (constants.textPromptWh.mid). */
  whPerAnswer: number;
  /** World-average grid, middle figure (constants.gridGCO2PerKWh.mid, Ember). */
  worldG: number;
  /** "16:00" in the visitor's own time zone (the browser passes Intl; tests pass a fixed one). */
  time: (iso: string) => string;
}

const W = 280;
const H = 56;

/** The last 24 h as a line, with the newest point marked. SVG attributes only (CSP: no style). */
export function sparkline(points: GridPoint[], calculated: boolean): string {
  if (points.length < 2) return '';
  const gs = points.map((p) => p.g);
  const lo = Math.min(...gs);
  const hi = Math.max(...gs);
  const t0 = Date.parse(points[0]!.t);
  const t1 = Date.parse(points[points.length - 1]!.t);
  const x = (t: string) => ((Date.parse(t) - t0) / Math.max(1, t1 - t0)) * (W - 8) + 4;
  const y = (g: number) => (hi === lo ? H / 2 : H - 6 - ((g - lo) / (hi - lo)) * (H - 12));
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${x(p.t).toFixed(1)},${y(p.g).toFixed(1)}`).join('');
  const last = points[points.length - 1]!;
  return `<svg class="spark" viewBox="0 0 ${W} ${H}" role="img" aria-label="Last 24 hours: from ${formatNumber(lo)} to ${formatNumber(hi)} g CO2 per kWh"><path d="${d}" fill="none" stroke-width="2"${calculated ? ' stroke-dasharray="5 4"' : ''}/><circle cx="${x(last.t).toFixed(1)}" cy="${y(last.g).toFixed(1)}" r="4"/></svg>`;
}

export function regionHtml(r: GridRegion, c: GridViewContext): string {
  const head = `<h3>${esc(r.hub)}</h3>`;
  const src = `<p class="g-src">Source: <a href="${esc(r.source.url)}" rel="noopener noreferrer">${esc(r.source.name)}</a>${r.source.licence ? ` (${esc(r.source.licence)})` : ''}.</p>`;
  const now = latest(r);
  if (r.unavailable || !now) {
    const why = r.unavailable === 'not connected yet' ? 'Live data for this hub is being connected.' : `No live figure right now: ${esc(r.unavailable ?? 'no data')}.`;
    return `<div class="g-card off" data-key="${r.key}">${head}<p class="g-none">${why}</p>${src}</div>`;
  }
  const calc = r.kind === 'calculated';
  const num = calc ? `<span class="derived">${formatNumber(now.g)}</span>` : formatNumber(now.g);
  const vsWorld = now.g / c.worldG;
  const compare = vsWorld < 0.9 ? `${Math.round(vsWorld * 100)}% of the world average` : vsWorld <= 1.1 ? 'about the world average' : `${formatNumber(vsWorld)} times the world average`;
  const what = calc ? 'calculated by Hum from the grid operator\'s fuel mix (dotted)' : "NESO's estimate for the London region";
  return `<div class="g-card" data-key="${r.key}">${head}
  <p class="g-now"><span class="num g-big">${num}</span> <span class="g-unit">g CO2 per kWh</span></p>
  <p class="g-cmp">${esc(compare)} (${formatNumber(c.worldG)}). As of ${esc(c.time(now.t))}, ${what}.</p>
  ${sparkline(r.points, calc)}
  <p class="g-answer">One AI answer's electricity here, right now: about <b class="derived">${formatNumber(answerMg(now.g, c.whPerAnswer))} mg</b> of CO2.</p>
  ${src}
</div>`;
}

export function gridHtml(f: GridFile, c: GridViewContext): string {
  return f.regions.map((r) => regionHtml(r, c)).join('');
}

/** Shown before the data arrives: same card sizes, so nothing jumps when it lands. */
export function gridSkeleton(hubs: string[]): string {
  return hubs.map((h) => `<div class="g-card wait"><h3>${esc(h)}</h3><p class="g-none">Loading the latest figure…</p></div>`).join('');
}
