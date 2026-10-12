// Hum Daily's record of your answers: kept on this device only (localStorage), never sent anywhere.
// Pure functions; the store is passed in so tests (and private browsing, where storage can throw) work.

export interface DailyRecord {
  /** Day number -> right or wrong, for the most recent days played. */
  played: Record<number, 'right' | 'wrong'>;
  /** Days in a row answered right, ending with the last day played. */
  streak: number;
  best: number;
  lastDay: number;
}

export const KEY = 'hum.daily';
const KEEP = 60;
export const EMPTY: DailyRecord = { played: {}, streak: 0, best: 0, lastDay: 0 };

export function load(store: Pick<Storage, 'getItem'> | null): DailyRecord {
  try {
    const r = JSON.parse(store?.getItem(KEY) ?? 'null') as Partial<DailyRecord> | null;
    if (!r || typeof r !== 'object' || !r.played || typeof r.played !== 'object' || Array.isArray(r.played)) return { ...EMPTY, played: {} };
    // Keep only well-formed entries: a damaged record must never break the page.
    const played: DailyRecord['played'] = {};
    for (const [d, v] of Object.entries(r.played)) if (/^\d+$/.test(d) && (v === 'right' || v === 'wrong')) played[Number(d)] = v;
    return { played, streak: Number(r.streak) || 0, best: Number(r.best) || 0, lastDay: Number(r.lastDay) || 0 };
  } catch {
    return { ...EMPTY, played: {} };
  }
}

export function save(store: Pick<Storage, 'setItem'> | null, r: DailyRecord): void {
  try {
    store?.setItem(KEY, JSON.stringify(r));
  } catch {
    /* blocked (private mode): still works for this visit */
  }
}

/** Record today's answer once; a second answer on the same day changes nothing. */
export function answer(r: DailyRecord, day: number, right: boolean): DailyRecord {
  if (r.played[day]) return r;
  const continues = r.lastDay === day - 1 && r.played[day - 1] === 'right';
  const streak = right ? (continues ? r.streak + 1 : 1) : 0;
  const played = { ...r.played, [day]: right ? ('right' as const) : ('wrong' as const) };
  for (const d of Object.keys(played).map(Number)) if (d <= day - KEEP) delete played[d];
  return { played, streak, best: Math.max(r.best, streak), lastDay: day };
}

/** The streak as it stands today: a missed day breaks it. */
export const currentStreak = (r: DailyRecord, today: number) => (r.lastDay >= today - 1 ? r.streak : 0);

/** No spoilers: the day, right or wrong, the streak, the link. */
export function shareText(day: number, right: boolean, streak: number): string {
  return `Hum Daily #${day} ${right ? '✅' : '❌'}${streak > 1 ? ` · ${streak} in a row` : ''}\nhumearth.org/daily`;
}
