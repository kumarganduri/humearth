import { describe, expect, it } from 'vitest';
import {
  advance,
  BLEND_END,
  BLEND_START,
  diveFrame,
  DIVE_MS,
  easeInOut,
  ORBIT_DISTANCE,
  slerpDir,
  SURFACE_DISTANCE,
  WORLD_HIGH,
  WORLD_REST,
} from './dive';
import { latLonToVec3, rng, seedSpot, FOREST_BANDS, type Vec3 } from './geo';

const len = (v: Vec3) => Math.hypot(...v);
const start: Vec3 = [0, 0.3, 1];
const spot = latLonToVec3(45, 10);

describe('dive timeline', () => {
  it('t = 0: orbiting the globe, only the globe scene renders', () => {
    const f = diveFrame(0, start, spot);
    expect(len(f.globeCam.position)).toBeCloseTo(ORBIT_DISTANCE);
    expect(f.blend).toBe(0);
    expect(f.renderGlobe).toBe(true);
    expect(f.renderWorld).toBe(false);
  });

  it('blend start: right above the spot, crossfade just starting', () => {
    const f = diveFrame(BLEND_START, start, spot);
    expect(f.blend).toBe(0);
    const dir = f.globeCam.position.map((x) => x / len(f.globeCam.position));
    dir.forEach((x, i) => expect(x).toBeCloseTo(spot[i]!, 5));
    expect(f.worldCam.position).toEqual(WORLD_HIGH);
  });

  it('blend end: low over the plot and fully blended to the world', () => {
    const f = diveFrame(BLEND_END, start, spot);
    expect(len(f.globeCam.position)).toBeCloseTo(SURFACE_DISTANCE);
    expect(f.blend).toBe(1);
    expect(f.renderGlobe).toBe(false);
  });

  it('t = 1: the world camera has settled at the clearing', () => {
    const f = diveFrame(1, start, spot);
    f.worldCam.position.forEach((x, i) => expect(x).toBeCloseTo(WORLD_REST[i]!));
    expect(f.renderWorld).toBe(true);
  });

  it('distance to the globe never increases during the dive', () => {
    let prev = Infinity;
    for (let t = 0; t <= 1; t += 0.01) {
      const d = len(diveFrame(t, start, spot).globeCam.position);
      expect(d).toBeLessThanOrEqual(prev + 1e-9);
      prev = d;
    }
  });

  it('clamps out-of-range progress', () => {
    expect(diveFrame(-1, start, spot)).toEqual(diveFrame(0, start, spot));
    expect(diveFrame(2, start, spot)).toEqual(diveFrame(1, start, spot));
  });

  it('skip and reverse via advance()', () => {
    expect(advance(0.3, DIVE_MS * 10, 1)).toBe(1); // skip-like overshoot clamps to landed
    expect(advance(1, DIVE_MS / 2, -1)).toBeCloseTo(0.5); // reverse dive
    expect(advance(0, 100, -1)).toBe(0);
  });

  it('easing starts at 0, ends at 1 and is symmetric', () => {
    expect(easeInOut(0)).toBe(0);
    expect(easeInOut(1)).toBe(1);
    expect(easeInOut(0.25) + easeInOut(0.75)).toBeCloseTo(1);
  });

  it('slerp keeps unit length and handles identical directions', () => {
    expect(len(slerpDir([1, 0, 0], [0, 1, 0], 0.5))).toBeCloseTo(1);
    expect(slerpDir([0, 0, 1], [0, 0, 1], 0.7)).toEqual([0, 0, 1]);
  });
});

describe('seed spot (where the dive lands)', () => {
  it('is deterministic for a seed and always inside a forest band', () => {
    expect(seedSpot(42)).toEqual(seedSpot(42));
    for (let s = 0; s < 500; s++) {
      const { lat, lon } = seedSpot(s * 7919);
      expect(FOREST_BANDS.some(([a, b]) => lat >= a && lat <= b)).toBe(true);
      expect(lon).toBeGreaterThanOrEqual(-180);
      expect(lon).toBeLessThanOrEqual(180);
    }
  });
  it('lands on land when an isLand check is given, deterministically', () => {
    const land = (lat: number, lon: number) => lon > 0 && lon < 40; // a pretend continent
    for (let s = 1; s < 200; s++) {
      const a = seedSpot(s, FOREST_BANDS, land);
      expect(land(a.lat, a.lon)).toBe(true);
      expect(seedSpot(s, FOREST_BANDS, land)).toEqual(a);
    }
  });
  it('falls back to the first draw if no land is ever found', () => {
    expect(seedSpot(9, FOREST_BANDS, () => false)).toEqual(seedSpot(9));
  });
  it('different seeds give different spots', () => {
    expect(seedSpot(1)).not.toEqual(seedSpot(2));
  });
  it('rng stays in [0, 1)', () => {
    const r = rng(123);
    for (let i = 0; i < 1000; i++) {
      const x = r();
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
    }
  });
  it('latLonToVec3 puts the north pole on +y and keeps the radius', () => {
    const [x, y, z] = latLonToVec3(90, 0, 2);
    expect(x).toBeCloseTo(0);
    expect(y).toBeCloseTo(2);
    expect(z).toBeCloseTo(0);
    expect(Math.hypot(...latLonToVec3(-33, 151, 1))).toBeCloseTo(1);
  });
});
