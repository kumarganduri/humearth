import { describe, expect, it } from 'vitest';
import { fitGlobe, flashAt, HALO, hubRadius } from './earth';

describe('globe geometry', () => {
  it('phones: centred and nearly filling the square; wide screens: right of the headline, fully on screen', () => {
    for (const [w, h, wide] of [[375, 375, false], [320, 320, false], [1440, 820, true], [900, 700, true], [1920, 1080, true], [1100, 500, true]] as const) {
      const f = fitGlobe(w, h, wide);
      const reach = f.scale * HALO; // the glow, not just the globe, stays inside the canvas
      if (wide) expect(f.cx).toBeGreaterThan(w / 2);
      else expect(f.cx).toBe(w / 2);
      expect(f.cx + reach).toBeLessThanOrEqual(w);
      expect(f.cx - reach).toBeGreaterThanOrEqual(0);
      expect(f.cy + reach).toBeLessThanOrEqual(h);
      expect(f.cy - reach).toBeGreaterThanOrEqual(0);
    }
  });

  it('hub glows grow with the square root of capacity', () => {
    expect(hubRadius(100, 100)).toBe(11);
    expect(hubRadius(25, 100)).toBe(6.5);
    expect(hubRadius(-1, 100)).toBe(2);
  });

  it('a newly passed country flashes, then settles within 900 ms', () => {
    expect(flashAt(undefined, 5)).toBe(0);
    expect(flashAt(1000, 1000)).toBe(1);
    expect(flashAt(1000, 1450)).toBeCloseTo(0.5);
    expect(flashAt(1000, 2000)).toBe(0);
  });
});
