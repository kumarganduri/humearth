import { describe, expect, it } from 'vitest';
import { linear, niceMax, niceStep, ticks } from './scale';

describe('scale', () => {
  it('linear maps domain to range, including inverted ranges (SVG y grows downward)', () => {
    const y = linear(0, 2000, 300, 0);
    expect(y(0)).toBe(300);
    expect(y(1000)).toBe(150);
    expect(y(2000)).toBe(0);
    expect(linear(5, 5, 0, 10)(5)).toBe(0); // zero-width domain never divides by zero
  });

  it('picks 1-2-5 steps and a clean top', () => {
    expect(niceStep(1700)).toBe(500);
    expect(niceMax(1700)).toBe(2000);
    expect(niceMax(2081.468)).toBe(3000); // 2081 / 4 = 520 > 500, so the step is 1,000
    expect(niceStep(9)).toBe(5);
    expect(niceMax(0)).toBe(0);
    expect(niceStep(-3)).toBe(1);
  });

  it('ticks run from 0 to the clean top in equal steps', () => {
    expect(ticks(1700)).toEqual([0, 500, 1000, 1500, 2000]);
    expect(ticks(500)).toEqual([0, 200, 400, 600]);
    expect(ticks(0.9)).toEqual([0, 0.5, 1]);
  });
});
