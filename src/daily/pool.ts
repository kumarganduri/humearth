// Hum Daily (stage 4): the question pool, built from the data files (never typed in). Each question is
// "A is X. Is B more or less?" and is kept only if the answer is the same across both figures' whole ranges,
// so no question depends on which estimate you trust.
//
//   countries (Ember)            data centres vs a country, by year; country vs country
//   per-use figures (constants)  one short AI video vs N AI questions, a picture vs N questions
//   grids (Ember)                which grid puts out more CO2 per kWh
//   hubs (capacity, MW)          which hub is bigger, only where the ranges don't overlap

import type { CountriesFile, SeriesFile } from '../footprint/series-types';
import type { Constants, GridsFile, HubsFile } from '../footprint/types';
import { formatNumber } from '../present/format';

export interface Side {
  label: string;
  /** "use" rather than "uses" ("10 AI questions", "the world's data centres"). */
  plural?: boolean;
  /** Middle figure, and the low-high range (equal for a single published figure). */
  mid: number;
  low: number;
  high: number;
  unit: string;
}

export interface Question {
  id: string; // stable across builds while the data is the same
  topic: 'countries' | 'per-use' | 'grids' | 'hubs';
  /** "uses ... a year", "puts out ... per kWh": the verb phrase that follows each label. */
  measure: 'electricity' | 'CO2' | 'capacity';
  a: Side;
  b: Side;
  answer: 'more' | 'less';
  /** Where the reveal links ("Every number on How we know"). */
  source: { label: string; href: string };
}

export interface PoolData {
  series: SeriesFile;
  countries: CountriesFile;
  constants: Constants;
  grids: GridsFile;
  hubs: HubsFile;
}

const single = (label: string, v: number, unit: string): Side => ({ label, mid: v, low: v, high: v, unit });

/** Unambiguous: B is above (or below) A at every point of both ranges, and their middle figures are at least
 *  20% apart (876 vs 865 MW is technically settled but a coin toss, not a fact worth testing). */
export const MIN_GAP = 0.2;
export function settled(a: Side, b: Side): 'more' | 'less' | null {
  if (Math.abs(a.mid - b.mid) / Math.min(a.mid, b.mid) < MIN_GAP) return null;
  if (b.low > a.high) return 'more';
  if (b.high < a.low) return 'less';
  return null;
}

function push(out: Question[], q: Omit<Question, 'answer'>) {
  const answer = settled(q.a, q.b);
  if (answer) out.push({ ...q, answer });
}

export function buildPool(d: PoolData): Question[] {
  const out: Question[] = [];
  const m = d.series.metrics.electricity;
  const cs = [...d.countries.countries].sort((x, y) => x.name.localeCompare(y.name));
  const country = (c: (typeof cs)[number]) => single(c.name, c.demandTWh, 'TWh a year');
  const countriesSrc = { label: `Ember (${d.countries.year}) and the IEA`, href: '/how-we-know.html#countries' };

  // Data centres (published years only) vs each country.
  for (const y of m.years.filter((x) => x.mid.kind === 'published' && x.mid.value !== null)) {
    const dc: Side = { label: `The world's data centres in ${y.year}${y.phase === 'future' ? ' (forecast)' : ''}`, plural: true, mid: y.mid.value!, low: y.low.value ?? y.mid.value!, high: y.high.value ?? y.mid.value!, unit: 'TWh a year' };
    for (const c of cs) {
      push(out, { id: `dc${y.year}-vs-${c.name}`, topic: 'countries', measure: 'electricity', a: country(c), b: dc, source: countriesSrc });
    }
  }
  // Country vs country, each pair once.
  for (const [i, x] of cs.entries()) for (const y of cs.slice(i + 1)) {
    push(out, { id: `${x.name}-vs-${y.name}`, topic: 'countries', measure: 'electricity', a: country(x), b: country(y), source: countriesSrc });
  }

  // Per-use: one video or picture vs N questions (ranges, so only settled N survive).
  const v = d.constants.values;
  const r = (label: string, k: 'textPromptWh' | 'imageWh' | 'videoClipWh', n = 1): Side => ({ label, plural: n > 1, mid: v[k].mid * n, low: v[k].low * n, high: v[k].high * n, unit: 'Wh' });
  const perUseSrc = { label: 'company disclosures and researchers (How we know)', href: '/how-we-know.html#numbers' };
  for (const n of [5, 10, 13, 20, 50, 100]) {
    push(out, { id: `video-vs-${n}q`, topic: 'per-use', measure: 'electricity', a: r(`${n} AI questions`, 'textPromptWh', n), b: r('One short AI video', 'videoClipWh'), source: perUseSrc });
  }
  for (const n of [1, 2, 3]) {
    push(out, { id: `${n}q-vs-video`, topic: 'per-use', measure: 'electricity', a: r('One short AI video', 'videoClipWh'), b: r(n === 1 ? 'One AI question' : `${n} AI questions`, 'textPromptWh', n), source: perUseSrc });
  }

  // Grids: CO2 per kWh (single published figures).
  const gs = [...d.grids.grids].sort((x, y) => x.key.localeCompare(y.key));
  // "An India-like grid", "A US-like grid" (said "you"), "The world-average grid".
  const gridLabel = (name: string) => (/^world average$/i.test(name) ? 'The world-average grid' : `${/^[AEIO]/i.test(name) ? 'An' : 'A'} ${name}`);
  for (const [i, x] of gs.entries()) for (const y of gs.slice(i + 1)) {
    push(out, { id: `grid-${x.key}-vs-${y.key}`, topic: 'grids', measure: 'CO2', a: single(gridLabel(x.name), x.gCO2PerKWh, 'g CO2 per kWh'), b: single(gridLabel(y.name), y.gCO2PerKWh, 'g CO2 per kWh'), source: { label: 'Ember (2024)', href: '/how-we-know.html#grids' } });
  }

  // Hubs: power capacity, only between hubs measured the same way (sources count different things:
  // colocation space, operating capacity, a 2024 ranking) and only where the ranges don't overlap.
  const hs = [...d.hubs.hubs].sort((x, y) => x.name.localeCompare(y.name));
  const hub = (h: (typeof hs)[number]): Side => ({ label: h.name, mid: h.mw.mid, low: h.mw.low, high: h.mw.high, unit: `MW of data centres (${h.measure.replace(/[()]/g, '')})` });
  for (const [i, x] of hs.entries()) for (const y of hs.slice(i + 1)) {
    if (x.measure !== y.measure) continue;
    push(out, { id: `hub-${x.name}-vs-${y.name}`, topic: 'hubs', measure: 'capacity', a: hub(x), b: hub(y), source: { label: 'industry surveys (How we know)', href: '/how-we-know.html#buildings' } });
  }

  return out.sort((x, y) => x.id.localeCompare(y.id));
}

/** "485 TWh a year" or "0.24 to 1.86 Wh (about 0.34)". */
export function sideWords(s: Side): string {
  if (s.low === s.high) return `${formatNumber(s.mid)} ${s.unit}`;
  return `about ${formatNumber(s.mid)} ${s.unit} (${formatNumber(s.low)} to ${formatNumber(s.high)})`;
}

const VERB: Record<string, [string, string]> = {
  electricity: ['uses', 'use'],
  CO2: ['puts out', 'put out'],
  capacity: ['has', 'have'],
};
const verbFor = (q: Question, s: Side) => (VERB[q.measure] ?? ['has', 'have'])[s.plural ? 1 : 0];

/** "Germany uses 517 TWh a year." */
export const statement = (q: Question) => `${q.a.label} ${verbFor(q, q.a)} ${sideWords(q.a)}.`;
/** The reveal: "The world's data centres in 2025 use 485 TWh a year." */
export const revealB = (q: Question) => `${q.b.label} ${verbFor(q, q.b)} ${sideWords(q.b)}.`;
/** "Do the world's data centres in 2025 use more or less?" */
export const ask = (q: Question) => `${q.b.label}: more or less?`;

// ---------- the day's question ----------

export const TOPICS: Question['topic'][] = ['countries', 'per-use', 'grids', 'hubs'];
/** Day 1 of Hum Daily. Days count in the visitor's own calendar, like Wordle. */
export const EPOCH = { y: 2026, m: 10, d: 12 };

/** Hum Daily number for a local calendar date (1 = launch day). */
export function dayNumber(local: Date): number {
  const today = Date.UTC(local.getFullYear(), local.getMonth(), local.getDate());
  return Math.max(1, Math.floor((today - Date.UTC(EPOCH.y, EPOCH.m - 1, EPOCH.d)) / 86_400_000) + 1); // a clock set before launch still gets #1
}

/** Small deterministic shuffle (mulberry32), so everyone gets the same order. */
function shuffled<T>(xs: T[], seed: number): T[] {
  let a = seed >>> 0;
  const rnd = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const out = [...xs];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/** Topics take turns day by day; within a topic every question comes up once before any repeats. */
export function questionFor(day: number, pool: Question[]): Question {
  const topics = TOPICS.filter((t) => pool.some((q) => q.topic === t));
  const n = Math.max(1, day);
  const topic = topics[(n - 1) % topics.length]!;
  const round = Math.floor((n - 1) / topics.length);
  const list = shuffled(pool.filter((q) => q.topic === topic), 7919 * (TOPICS.indexOf(topic) + 1));
  return list[round % list.length]!;
}
