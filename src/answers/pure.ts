// Pure helpers for the front door and Today (no DOM), shared by the browser and the tests.

import type { Findable } from './types';

/** Days since launch, in UTC, so everyone gets the same card on the same day. */
export function dayNumber(launch: string, now: Date): number {
  const [y, m, d] = launch.split('-').map(Number);
  return Math.floor((Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - Date.UTC(y!, m! - 1, d!)) / 864e5);
}
/** Today starts one card in, so the front door keeps its lead card and the two never match on the same day. */
export const todayIndex = (day: number, n: number) => (((day + 1) % n) + n) % n;

/** Today's card: from the everyday rotation when there is one, else from the deck. */
export function todaySlug(d: { deck: string[]; today?: string[] }, day: number): string {
  const list = d.today?.length ? d.today : d.deck;
  return list[todayIndex(day, list.length)]!;
}

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/center/g, 'centre'); // US spelling finds UK text
const STOP = new Set('a an the is are do does did i my me of to in on for and or it its be can how what why will with by from than that this ai use uses using really much one any about there who'.split(' '));
const stem = (w: string) => (w.length > 3 && w.endsWith('s') ? w.slice(0, -1) : w);
const tokens = (s: string) => norm(s).split(/[^a-z0-9]+/).filter((w) => w.length > 1).map(stem);

/**
 * Search answers and pages. Whole words (a plural or a longer form counts), accents ignored. A rare word counts
 * for more than a common one, and a result must cover at least half of what was asked by that measure: "Singapore
 * data centres" finds nothing rather than every answer that says "data centres".
 */
export function matches<T extends Findable>(q: string, items: T[]): T[] {
  const words = [...new Set(tokens(q).filter((w) => !STOP.has(w)))];
  if (!words.length) return [];
  const hay = items.map((a) => new Set(tokens(`${a.q} ${a.cat ?? ''} ${a.keys ?? ''}`)));
  const has = (set: Set<string>, w: string) => set.has(w) || (w.length >= 4 && [...set].some((t) => t.startsWith(w)));
  const weight = new Map(words.map((w) => [w, Math.log((items.length + 1) / (Math.max(1, hay.filter((h) => has(h, w)).length) + 1))])); // a word found nowhere weighs as much as the rarest found word
  const total = words.reduce((n, w) => n + weight.get(w)!, 0);
  return items
    .map((a, i) => ({ a, s: words.reduce((n, w) => n + (has(hay[i]!, w) ? weight.get(w)! : 0), 0) }))
    .filter((x) => x.s > 0 && x.s >= total / 2)
    .sort((x, y) => y.s - x.s)
    .slice(0, 6)
    .map((x) => x.a);
}
