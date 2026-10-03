// App state machine (eng review 2A + OV #10). Pure: no DOM, no three.js. main.ts performs effects.
//
//   boot ─┬─ hash valid & seed≠mine ──> earth(viewing friend)
//         ├─ hash valid & seed=mine ──> earth(viewing mine)
//         ├─ hash invalid/old ────────> earth(notice "moved away")
//         ├─ saved world ─────────────> earth(viewing mine, "Visit my world")
//         └─ nothing ─────────────────> earth("Make my world")
//   earth ─MAKE─> quiz(1..3, seed chosen now so the globe can turn toward it) ─last ANSWER─> diving ─LANDED─> world ─BACK─> returning ─ON_EARTH─> earth
//   earth ─VISIT─> diving (viewing world)
//   earth(friend) ─SHOW_MINE─> earth(mine)
//   world(friend) ─MAKE_MINE─> returning ─ON_EARTH─> quiz(1, fresh)
//   world(me) ─CHANGE_ANSWERS─> returning ─ON_EARTH─> quiz(1, prefilled) ─save─> same seed
//
// Rule: storage holds MY world only. A link is a view-only friend world, never written to storage.

import { decode, encode, type SharedWorld } from '../share/codec';
import { NO_PLAN, type Buckets, type Plan } from '../footprint/types';

export type Place = 'earth' | 'quiz' | 'diving' | 'world' | 'returning';
export type Owner = 'me' | 'friend';
export const QUIZ_STEPS = ['text', 'images', 'videos'] as const;
export type QuizStep = (typeof QUIZ_STEPS)[number];

export interface AppState {
  place: Place;
  mine: SharedWorld | null; // what's (to be) saved on this device
  viewing: { world: SharedWorld; owner: Owner } | null; // the world on the globe / being visited
  quiz: { step: number; answers: Partial<Buckets>; seed: number; keepPlan: boolean } | null;
  afterReturn: 'quiz-fresh' | 'quiz-prefilled' | null;
  notice: 'moved-away' | null;
  /** Friend view only: show "what my world could be" with their plan applied (clearly a preview). */
  previewPlan: boolean;
}

export type AppEvent =
  | { type: 'MAKE'; newSeed: number }
  | { type: 'ANSWER'; value: number }
  | { type: 'QUIZ_BACK' }
  /** The phone's or browser's Back button (ISSUE-006). */
  | { type: 'HISTORY_BACK' }
  | { type: 'VISIT' }
  | { type: 'LANDED' }
  | { type: 'BACK' }
  | { type: 'ON_EARTH'; newSeed: number }
  | { type: 'SHOW_MINE' }
  | { type: 'MAKE_MINE' }
  | { type: 'CHANGE_ANSWERS' }
  | { type: 'TOGGLE_PLAN'; key: keyof Plan }
  | { type: 'TOGGLE_PREVIEW' }
  | { type: 'DISMISS_NOTICE' };

const STORAGE_KEY = 'hum.world';

/** Storage can throw (private mode, blocked site data). Every access is guarded. */
export interface Store {
  get(): string | null;
  set(v: string): void;
}

export function safeStore(s: Pick<Storage, 'getItem' | 'setItem'> | null | undefined): Store {
  return {
    get() {
      try {
        return s?.getItem(STORAGE_KEY) ?? null;
      } catch {
        return null;
      }
    },
    set(v) {
      try {
        s?.setItem(STORAGE_KEY, v);
      } catch {
        /* not remembered, but the site still works */
      }
    },
  };
}

export function loadMine(store: Store): SharedWorld | null {
  const raw = store.get();
  if (!raw) return null;
  const r = decode(raw);
  return r.ok ? r.world : null; // corrupt storage is treated as nothing
}

export function saveMine(store: Store, w: SharedWorld): void {
  store.set(encode(w));
}

export function boot(hash: string, mine: SharedWorld | null): AppState {
  const base: AppState = { place: 'earth', mine, viewing: null, quiz: null, afterReturn: null, notice: null, previewPlan: false };
  const h = hash.replace(/^#/, '');
  if (h) {
    const r = decode(h);
    if (!r.ok) return { ...base, viewing: mine ? { world: mine, owner: 'me' } : null, notice: 'moved-away' };
    if (mine && r.world.seed === mine.seed) return { ...base, viewing: { world: mine, owner: 'me' } };
    return { ...base, viewing: { world: r.world, owner: 'friend' } };
  }
  return { ...base, viewing: mine ? { world: mine, owner: 'me' } : null };
}

function startQuiz(s: AppState, prefilled: boolean, newSeed: number): AppState {
  const keep = prefilled && s.mine !== null;
  return {
    ...s,
    place: 'quiz',
    notice: null,
    previewPlan: false,
    quiz: { step: 0, answers: keep ? { ...s.mine!.buckets } : {}, seed: keep ? s.mine!.seed : newSeed, keepPlan: keep },
  };
}

const MAX: Record<QuizStep, number> = { text: 3, images: 2, videos: 2 };

export function reduce(s: AppState, e: AppEvent): AppState {
  switch (e.type) {
    case 'MAKE':
      return s.place === 'earth' ? startQuiz(s, false, e.newSeed) : s;
    case 'ANSWER': {
      if (s.place !== 'quiz' || !s.quiz) return s;
      const key = QUIZ_STEPS[s.quiz.step]!;
      if (!Number.isInteger(e.value) || e.value < 0 || e.value > MAX[key]) return s;
      const answers = { ...s.quiz.answers, [key]: e.value };
      if (s.quiz.step < QUIZ_STEPS.length - 1) return { ...s, quiz: { ...s.quiz, step: s.quiz.step + 1, answers } };
      // Last answer: save my world. "Change my answers" keeps the seed (same layout, new health).
      const mine: SharedWorld = {
        seed: s.quiz.seed,
        biome: 'forest',
        buckets: answers as Buckets,
        plan: s.quiz.keepPlan ? (s.mine?.plan ?? NO_PLAN) : NO_PLAN,
      };
      return { ...s, place: 'diving', mine, viewing: { world: mine, owner: 'me' }, quiz: null };
    }
    case 'QUIZ_BACK':
      if (s.place !== 'quiz' || !s.quiz) return s;
      return s.quiz.step === 0 ? { ...s, place: 'earth', quiz: null } : { ...s, quiz: { ...s.quiz, step: s.quiz.step - 1 } };
    case 'HISTORY_BACK':
      // Back steps back inside Hum: the previous question, or home to Earth from a world.
      // Mid-dive or mid-return it does nothing (the flight is about 3 seconds).
      if (s.place === 'quiz') return reduce(s, { type: 'QUIZ_BACK' });
      if (s.place === 'world') return reduce(s, { type: 'BACK' });
      return s;
    case 'VISIT':
      return s.place === 'earth' && s.viewing ? { ...s, place: 'diving', notice: null } : s;
    case 'LANDED':
      return s.place === 'diving' ? { ...s, place: 'world' } : s;
    case 'BACK':
      return s.place === 'world' ? { ...s, place: 'returning', previewPlan: false } : s;
    case 'ON_EARTH': {
      if (s.place !== 'returning') return s;
      const earth: AppState = { ...s, place: 'earth', afterReturn: null };
      if (s.afterReturn === 'quiz-fresh') return startQuiz(earth, false, e.newSeed);
      if (s.afterReturn === 'quiz-prefilled') return startQuiz(earth, true, e.newSeed);
      return earth;
    }
    case 'MAKE_MINE':
      return s.place === 'world' && s.viewing?.owner === 'friend' ? { ...s, place: 'returning', afterReturn: 'quiz-fresh', previewPlan: false } : s;
    case 'CHANGE_ANSWERS':
      return s.place === 'world' && s.viewing?.owner === 'me' ? { ...s, place: 'returning', afterReturn: 'quiz-prefilled' } : s;
    case 'TOGGLE_PLAN': {
      if (s.place !== 'world' || s.viewing?.owner !== 'me' || !s.mine) return s;
      const mine = { ...s.mine, plan: { ...s.mine.plan, [e.key]: !s.mine.plan[e.key] } };
      return { ...s, mine, viewing: { world: mine, owner: 'me' } };
    }
    case 'TOGGLE_PREVIEW':
      return s.viewing?.owner === 'friend' ? { ...s, previewPlan: !s.previewPlan } : s;
    case 'SHOW_MINE':
      return s.place === 'earth' && s.mine && s.viewing?.owner === 'friend' ? { ...s, viewing: { world: s.mine, owner: 'me' } } : s;
    case 'DISMISS_NOTICE':
      return { ...s, notice: null };
  }
}

export function hasPlan(p: Plan): boolean {
  return p.fewerPictures || p.fewerVideos || p.lighterAi;
}

/** The seed whose spot the globe should show: the quiz's pending world, else the world being viewed. */
export function activeSeed(s: AppState): number | null {
  return s.quiz?.seed ?? s.viewing?.world.seed ?? null;
}

/**
 * Which plan the world on screen should apply. My own world: my plan (trying a greener week).
 * A friend's world: their REAL world by default; their plan only as a labelled preview (4A).
 */
export function displayedPlan(s: AppState): Plan {
  if (!s.viewing) return NO_PLAN;
  if (s.viewing.owner === 'me') return s.viewing.world.plan;
  return s.previewPlan ? s.viewing.world.plan : NO_PLAN;
}

/** A fresh, non-zero 32-bit seed. */
export function newSeed(random: () => number = Math.random): number {
  return (Math.floor(random() * 0xfffffffe) + 1) >>> 0;
}
