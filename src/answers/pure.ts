// Pure helpers for the front door and Today (no DOM), shared by the browser and the tests.

import type { Answer } from './types';

/** Days since launch, in UTC, so everyone gets the same card on the same day. */
export function dayNumber(launch: string, now: Date): number {
  const [y, m, d] = launch.split('-').map(Number);
  return Math.floor((Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - Date.UTC(y!, m! - 1, d!)) / 864e5);
}
/** Today starts one card in, so the front door keeps its lead card and the two never match on the same day. */
export const todayIndex = (day: number, n: number) => (((day + 1) % n) + n) % n;

/** Search the reviewed answers: every word counts, accents ignored. */
export function matches(q: string, answers: Pick<Answer, 'q' | 'cat' | 'slug'>[]): Pick<Answer, 'q' | 'cat' | 'slug'>[] {
  const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const STOP = new Set('a an the is are do does did i my me of to in on for and or it its be can how what why will with by from than that this ai use uses using really much'.split(' '));
  const words = norm(q).split(/[^a-z0-9]+/).filter((w) => w.length > 1 && !STOP.has(w));
  if (!words.length) return [];
  return answers
    .map((a) => { const hay = norm(`${a.q} ${a.cat}`); return { a, s: words.filter((w) => hay.includes(w) || (w.length > 4 && hay.includes(w.slice(0, -1)))).length }; })
    .filter((x) => x.s > 0)
    .sort((x, y) => y.s - x.s)
    .slice(0, 6)
    .map((x) => x.a);
}
