// How every number on Hum is written (eng review D7). Pure strings: used at build time (How We Know,
// prebuilt hero) and in the browser (slider), so the same figure always reads the same everywhere.
//
//   formatNumber      0.34 · 25.3 · 485 · 1,200 · 14.5 million · 8.2 billion
//   rangeText         "240 · 415 · 580 TWh"   (single estimate: "415 TWh")
//   readingHtml       the DESIGN.md range reading: big amber middle, muted low/high, caption under it
//   captionFor        "2028 · calculated: steady growth between published figures"

import type { SeriesValue, SeriesYear } from '../footprint/series-types';

const ESC: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ESC[c]!);

/** Whole numbers with commas from 100 up; 3 significant figures below; millions and billions in words. */
export function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return '–';
  const sign = n < 0 ? '-' : '';
  const a = Math.abs(n);
  // Round first, then pick the unit, so 999,999,999 reads "1 billion", not "1,000 million".
  const billions = Number((a / 1e9).toPrecision(3));
  if (billions >= 1) return `${sign}${billions} billion`;
  const millions = Number((a / 1e6).toPrecision(3));
  if (millions >= 1) return `${sign}${millions} million`;
  if (a >= 100) return sign + Math.round(a).toLocaleString('en-US');
  if (a === 0) return '0';
  return sign + String(Number(a.toPrecision(3)));
}

export interface Range {
  low: number | null;
  mid: number;
  high: number | null;
}

/** True when the source gave one figure (low = mid = high). */
export const isSingle = (r: Range) => r.low === r.mid && r.high === r.mid;

/** "240 · 415 · 580 TWh"; "415 TWh" for a single estimate; a missing edge reads "–". */
export function rangeText(r: Range, unit: string): string {
  if (isSingle(r)) return `${formatNumber(r.mid)} ${unit}`;
  const edge = (x: number | null) => (x === null ? '–' : formatNumber(x));
  return `${edge(r.low)} · ${formatNumber(r.mid)} · ${edge(r.high)} ${unit}`;
}

/** For screen readers and aria-valuetext: "about 945 terawatt-hours, between 700 and 1,700". */
export function rangeWords(r: Range, unitWords: string): string {
  const mid = `about ${formatNumber(r.mid)} ${unitWords}`;
  if (isSingle(r)) return mid;
  if (r.low !== null && r.high !== null) return `${mid}, between ${formatNumber(r.low)} and ${formatNumber(r.high)}`;
  if (r.high !== null) return `${mid}, up to ${formatNumber(r.high)}; no published low`;
  if (r.low !== null) return `${mid}, at least ${formatNumber(r.low)}; no published high`;
  return mid;
}

/** Short words for how a year's figure was obtained (the long rule lives in series.json / How We Know). */
export function captionFor(y: SeriesYear, source?: string): string {
  const from = source ? ` (${source})` : '';
  if (y.mid.kind === 'none') return `${y.year} · no published figure`;
  if (y.mid.kind === 'published') {
    const single = y.low.value === y.mid.value && y.high.value === y.mid.value;
    if (y.phase === 'past') return `${y.year} · ${single ? 'single published estimate' : 'published figure'}${from}`;
    return `${y.year} · published forecast${from}`;
  }
  return y.phase === 'past'
    ? `${y.year} · calculated from the published growth rate`
    : `${y.year} · calculated between published forecasts`;
}

const part = (cls: string, v: SeriesValue) =>
  v.value === null
    ? `<span class="${cls} none" aria-hidden="true">–</span>`
    : `<span class="${cls}${v.kind === 'derived' ? ' derived' : ''}">${formatNumber(v.value)}</span>`;

/**
 * The range reading (DESIGN.md Components): middle large, low and high muted beside it, caption under.
 * Single estimates show only the middle. A screen-reader sentence carries the full meaning.
 */
export function readingHtml(y: SeriesYear, unit: string, unitWords: string, source?: string): string {
  const r: Range = { low: y.low.value, mid: y.mid.value ?? 0, high: y.high.value };
  const visual = isSingle(r)
    ? `${part('mid', y.mid)}<span class="unit">${esc(unit)}</span>`
    : `${part('lo', y.low)}<span class="sep">·</span>${part('mid', y.mid)}<span class="sep">·</span>${part('hi', y.high)}<span class="unit">${esc(unit)}</span>`;
  const phase = y.phase === 'future' ? ' forecast' : '';
  return `<div class="reading${phase}"><div class="range" aria-hidden="true">${visual}</div><span class="sr-only">${esc(
    `${y.year}: ${rangeWords(r, unitWords)}.`,
  )}</span><div class="range-cap">${esc(captionFor(y, source))}</div></div>`;
}
