// Shareable links: what you set lives in the URL, so a link opens exactly that view. Nothing is stored
// anywhere; reading is forgiving (anything unknown or out of range is ignored), writing is minimal (the
// default view has a clean URL).
//
//   /?year=2030                         home at a year
//   /question?kind=video                /question with a request kind chosen
//   /2030?mix=clean:60,world:40&eff=50  /2030 with a grid mix and efficiency

import type { RequestKind } from '../footprint/rates';
import type { SimInput } from '../footprint/rates';

const KINDS: RequestKind[] = ['question', 'picture', 'video'];
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const int = (s: string | null) => (s !== null && /^\d{1,4}$/.test(s) ? Number(s) : null);

/** Replace the query with these params (dropping empty ones); returns the new search string ('' or '?...'). */
export function searchFor(params: Record<string, string | null>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== null && v !== '') q.set(k, v);
  const s = q.toString().replace(/%3A/g, ':').replace(/%2C/g, ','); // keep "clean:60,world:40" readable
  return s ? `?${s}` : '';
}

export function readYear(search: string, first: number, last: number): number | null {
  const y = int(new URLSearchParams(search).get('year'));
  return y !== null && y >= first && y <= last ? y : null;
}
export const yearSearch = (year: number, latest: number) => searchFor({ year: year === latest ? null : String(year) });

export function readKind(search: string): RequestKind | null {
  const k = new URLSearchParams(search).get('kind') as RequestKind | null;
  return k && KINDS.includes(k) ? k : null;
}
export const kindSearch = (kind: RequestKind) => searchFor({ kind: kind === 'question' ? null : kind });

/** Slider steps are 5, so values snap to them; unknown grids and junk are ignored. */
const snap5 = (n: number) => clamp(Math.round(n / 5) * 5, 0, 100);

export function readSim(search: string, gridKeys: string[]): SimInput | null {
  const q = new URLSearchParams(search);
  const mixRaw = q.get('mix');
  const effRaw = int(q.get('eff'));
  if (mixRaw === null && effRaw === null) return null;
  const mix: Record<string, number> = {};
  for (const part of (mixRaw ?? '').split(',')) {
    const [k, v] = part.split(':');
    const n = int(v ?? null);
    if (k && gridKeys.includes(k) && n !== null) mix[k] = snap5(n);
  }
  const anyWeight = Object.values(mix).some((v) => v > 0);
  return { mix: anyWeight ? mix : { world: 100 }, efficiency: effRaw === null ? 0 : snap5(effRaw) / 100 };
}

export function simSearch(mix: Record<string, number>, efficiencyPct: number, start: SimInput): string {
  const parts = Object.entries(mix).filter(([, v]) => v > 0).map(([k, v]) => `${k}:${v}`);
  const startParts = Object.entries(start.mix).filter(([, v]) => v > 0).map(([k, v]) => `${k}:${v}`);
  const isStart = parts.join(',') === startParts.join(',') && efficiencyPct === start.efficiency * 100;
  if (isStart) return '';
  return searchFor({ mix: parts.join(','), eff: efficiencyPct ? String(efficiencyPct) : null });
}
