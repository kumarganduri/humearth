import { describe, expect, it } from 'vitest';
import { median, pickTier, SlowWatch, tierSettings } from './tier';

describe('quality tiers', () => {
  it('median handles odd, even and empty lists', () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([4, 1, 3, 2])).toBe(2.5);
    expect(median([])).toBe(0);
  });

  it('a 60 fps warmup is high; a 30 fps warmup is low; one hitch does not demote', () => {
    expect(pickTier(Array(60).fill(16.7))).toBe('high');
    expect(pickTier(Array(60).fill(33))).toBe('low');
    expect(pickTier([...Array(59).fill(16.7), 400])).toBe('high');
  });

  it('slow watch fires only after ~2 s under 24 fps, not on a short hitch', () => {
    const w = new SlowWatch();
    let fired = false;
    for (let i = 0; i < 40; i++) fired = w.push(50) || fired; // 20 fps for 2 s
    expect(fired).toBe(true);

    const ok = new SlowWatch();
    let okFired = false;
    for (let i = 0; i < 200; i++) okFired = ok.push(i === 50 ? 300 : 16.7) || okFired; // 60 fps + one hitch
    expect(okFired).toBe(false);
  });

  it('needs enough history before deciding', () => {
    const w = new SlowWatch();
    expect(w.push(100)).toBe(false);
    w.reset();
    expect(w.push(100)).toBe(false);
  });

  it('low tier drops pixel ratio to 1 and turns shadows off; phones cap high at 1.5', () => {
    expect(tierSettings('high', 3, true)).toEqual({ pixelRatio: 1.5, shadows: true });
    expect(tierSettings('high', 3, false)).toEqual({ pixelRatio: 2, shadows: true });
    expect(tierSettings('low', 3, true)).toEqual({ pixelRatio: 1, shadows: false });
  });
});
