import { describe, expect, it } from 'vitest';
import { boot, reduce, type AppEvent, type AppState } from './state';
import { encode, type SharedWorld } from '../share/codec';
import { NO_PLAN } from '../footprint/types';

// Regression: ISSUE-006 — the phone/browser Back button left the site from the quiz or a world.
// Found by /qa on 2026-10-03. Report: .gstack/qa-reports/qa-report-localhost-2026-10-03.md

const mine: SharedWorld = { seed: 111, biome: 'forest', buckets: { text: 1, images: 1, videos: 0 }, plan: NO_PLAN };
const friend: SharedWorld = { seed: 222, biome: 'forest', buckets: { text: 3, images: 2, videos: 2 }, plan: NO_PLAN };
const run = (s: AppState, ...events: AppEvent[]) => events.reduce(reduce, s);
const BACK: AppEvent = { type: 'HISTORY_BACK' };

describe('phone/browser Back (HISTORY_BACK)', () => {
  it('in the quiz: steps to the previous question, then to Earth', () => {
    const q2 = run(boot('', null), { type: 'MAKE', newSeed: 5 }, { type: 'ANSWER', value: 1 });
    expect(q2.quiz?.step).toBe(1);
    const q1 = reduce(q2, BACK);
    expect(q1).toMatchObject({ place: 'quiz', quiz: { step: 0, answers: { text: 1 } } });
    expect(reduce(q1, BACK)).toMatchObject({ place: 'earth', quiz: null });
  });

  it('in my world or a friend world: flies home to Earth, like Back to Earth', () => {
    const inMine = run(boot('', mine), { type: 'VISIT' }, { type: 'LANDED' });
    expect(reduce(inMine, BACK)).toEqual(reduce(inMine, { type: 'BACK' }));
    expect(reduce(inMine, BACK).place).toBe('returning');
    const inFriend = run(boot(`#${encode(friend)}`, mine), { type: 'VISIT' }, { type: 'LANDED' });
    expect(reduce(inFriend, BACK)).toMatchObject({ place: 'returning', mine });
  });

  it('mid-dive, mid-return and on Earth it does nothing', () => {
    const diving = run(boot('', mine), { type: 'VISIT' });
    expect(diving.place).toBe('diving');
    expect(reduce(diving, BACK)).toBe(diving);
    const returning = run(diving, { type: 'LANDED' }, { type: 'BACK' });
    expect(reduce(returning, BACK)).toBe(returning);
    const earth = boot('', mine);
    expect(reduce(earth, BACK)).toBe(earth);
  });
});
