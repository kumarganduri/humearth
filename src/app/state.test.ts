import { describe, expect, it } from 'vitest';
import { activeSeed, boot, displayedPlan, loadMine, newSeed, reduce, safeStore, saveMine, type AppEvent, type AppState } from './state';
import { encode, type SharedWorld } from '../share/codec';
import { NO_PLAN } from '../footprint/types';

const mine: SharedWorld = { seed: 111, biome: 'forest', buckets: { text: 1, images: 1, videos: 0 }, plan: { ...NO_PLAN, fewerPictures: true } };
const friend: SharedWorld = { seed: 222, biome: 'forest', buckets: { text: 3, images: 2, videos: 2 }, plan: { ...NO_PLAN, fewerVideos: true } };

function memoryStore(initial: string | null = null) {
  let v = initial;
  const writes: string[] = [];
  return {
    store: safeStore({ getItem: () => v, setItem: (_k: string, x: string) => (writes.push(x), (v = x)) }),
    writes,
  };
}

const run = (s: AppState, ...events: AppEvent[]) => events.reduce(reduce, s);
const answer = (value: number): AppEvent => ({ type: 'ANSWER', value });
const MAKE = (newSeed = 999): AppEvent => ({ type: 'MAKE', newSeed });
const ON_EARTH = (newSeed = 888): AppEvent => ({ type: 'ON_EARTH', newSeed });

describe('boot table (2A)', () => {
  it('nothing saved, no link -> "Make my world"', () => {
    expect(boot('', null)).toMatchObject({ place: 'earth', viewing: null, notice: null });
  });
  it('saved world -> my world on the globe, "Visit my world"', () => {
    expect(boot('', mine).viewing).toEqual({ world: mine, owner: 'me' });
  });
  it("a friend's link -> view-only friend world, my saved world untouched", () => {
    const s = boot(`#${encode(friend)}`, mine);
    expect(s.viewing).toEqual({ world: friend, owner: 'friend' });
    expect(s.mine).toBe(mine);
  });
  it('my own link -> my world', () => {
    expect(boot(`#${encode(mine)}`, mine).viewing?.owner).toBe('me');
  });
  it('a bad or old link -> "moved away", still showing my world if I have one', () => {
    expect(boot('#w1.garbage', null)).toMatchObject({ notice: 'moved-away', viewing: null });
    expect(boot('#w9.AAAA', mine)).toMatchObject({ notice: 'moved-away', viewing: { owner: 'me' } });
  });
});

describe('storage', () => {
  it('round-trips my world and treats corrupt storage as nothing', () => {
    const m = memoryStore();
    saveMine(m.store, mine);
    expect(loadMine(m.store)).toEqual(mine);
    expect(loadMine(memoryStore('not a world').store)).toBeNull();
  });
  it('never throws when storage is blocked (private mode)', () => {
    const blocked = safeStore({
      getItem: () => {
        throw new Error('SecurityError');
      },
      setItem: () => {
        throw new Error('QuotaExceeded');
      },
    });
    expect(blocked.get()).toBeNull();
    expect(() => saveMine(blocked, mine)).not.toThrow();
    expect(loadMine(safeStore(null))).toBeNull();
  });
});

describe('first visit: quiz -> dive -> world', () => {
  it('3 answers create my world with a new seed and no plan, then dive', () => {
    const s = run(boot('', null), MAKE(4242), answer(3), answer(0), answer(2));
    expect(s.place).toBe('diving');
    expect(s.mine).toEqual({ seed: 4242, biome: 'forest', buckets: { text: 3, images: 0, videos: 2 }, plan: NO_PLAN });
    expect(s.viewing).toEqual({ world: s.mine, owner: 'me' });
    expect(run(s, { type: 'LANDED' }).place).toBe('world');
  });
  it('ignores out-of-range answers', () => {
    const s = run(boot('', null), MAKE(), answer(4));
    expect(s.quiz?.step).toBe(0);
    expect(run(s, answer(1), answer(3)).quiz?.step).toBe(1); // images max is 2
  });
  it('quiz back steps back, and from the first question returns to Earth', () => {
    const s = run(boot('', null), MAKE(), answer(1), { type: 'QUIZ_BACK' });
    expect(s.quiz?.step).toBe(0);
    expect(run(s, { type: 'QUIZ_BACK' })).toMatchObject({ place: 'earth', quiz: null });
  });
});

describe("friend's world never overwrites mine (2A)", () => {
  it('visiting, toggling plans and previewing never change my saved world', () => {
    let s = run(boot(`#${encode(friend)}`, mine), { type: 'VISIT' }, { type: 'LANDED' });
    s = run(s, { type: 'TOGGLE_PLAN', key: 'lighterAi' }, { type: 'TOGGLE_PREVIEW' });
    expect(s.mine).toBe(mine);
    expect(s.viewing?.world).toEqual(friend);
  });
  it("shows the friend's REAL world by default and their plan only as a preview (4A)", () => {
    let s = run(boot(`#${encode(friend)}`, null), { type: 'VISIT' }, { type: 'LANDED' });
    expect(displayedPlan(s)).toEqual(NO_PLAN);
    s = reduce(s, { type: 'TOGGLE_PREVIEW' });
    expect(displayedPlan(s)).toEqual(friend.plan);
    expect(reduce(s, { type: 'BACK' }).previewPlan).toBe(false);
  });
  it('"Make mine" goes back to Earth, then a fresh quiz with a new seed', () => {
    let s = run(boot(`#${encode(friend)}`, null), { type: 'VISIT' }, { type: 'LANDED' }, { type: 'MAKE_MINE' });
    expect(s.place).toBe('returning');
    s = run(s, ON_EARTH());
    expect(s).toMatchObject({ place: 'quiz', quiz: { step: 0, answers: {} } });
    s = run(s, answer(0), answer(0), answer(0));
    expect(s.mine?.seed).toBe(888);
    expect(s.viewing?.owner).toBe('me');
  });
});

describe('"Change my answers" keeps the seed (OV #10)', () => {
  it('prefills my answers, keeps my seed and my plan, updates the buckets', () => {
    let s = run(boot('', mine), { type: 'VISIT' }, { type: 'LANDED' }, { type: 'CHANGE_ANSWERS' }, ON_EARTH());
    expect(s.quiz?.answers).toEqual(mine.buckets);
    s = run(s, answer(0), answer(0), answer(0));
    expect(s.mine).toEqual({ ...mine, buckets: { text: 0, images: 0, videos: 0 } });
  });
  it('is not offered on a friend world', () => {
    const s = run(boot(`#${encode(friend)}`, mine), { type: 'VISIT' }, { type: 'LANDED' });
    expect(reduce(s, { type: 'CHANGE_ANSWERS' })).toBe(s);
  });
});

describe('seed is known from the first question (the globe turns toward it)', () => {
  it('new quiz uses the MAKE seed; change-answers uses my seed', () => {
    expect(activeSeed(run(boot('', null), MAKE(31)))).toBe(31);
    expect(activeSeed(run(boot('', mine), { type: 'VISIT' }, { type: 'LANDED' }, { type: 'CHANGE_ANSWERS' }, ON_EARTH(5)))).toBe(111);
  });
});

describe('"or visit my world" from a friend link', () => {
  it('switches the globe to my world, only on Earth with a friend world and my own', () => {
    const s = boot(`#${encode(friend)}`, mine);
    expect(reduce(s, { type: 'SHOW_MINE' }).viewing).toEqual({ world: mine, owner: 'me' });
    const noMine = boot(`#${encode(friend)}`, null);
    expect(reduce(noMine, { type: 'SHOW_MINE' })).toBe(noMine);
  });
});

describe('greener choices on my world', () => {
  it('toggle my plan and apply it to my world', () => {
    const s = run(boot('', mine), { type: 'VISIT' }, { type: 'LANDED' }, { type: 'TOGGLE_PLAN', key: 'fewerVideos' });
    expect(s.mine?.plan).toEqual({ fewerPictures: true, fewerVideos: true, lighterAi: false });
    expect(displayedPlan(s)).toEqual(s.mine?.plan);
  });
});

describe('events in the wrong place are ignored', () => {
  it('no state change', () => {
    const s = boot('', null);
    for (const e of [{ type: 'VISIT' }, { type: 'LANDED' }, { type: 'BACK' }, ON_EARTH(), answer(1), { type: 'SHOW_MINE' }] as AppEvent[]) {
      expect(reduce(s, e)).toBe(s);
    }
  });
});

describe('newSeed', () => {
  it('is a non-zero uint32', () => {
    expect(newSeed(() => 0)).toBe(1);
    expect(newSeed(() => 0.999999999)).toBeLessThanOrEqual(0xffffffff);
    expect(newSeed(() => 0.5)).toBeGreaterThan(0);
  });
});
