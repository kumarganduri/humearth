import { describe, expect, it } from 'vitest';
import { kindSearch, readKind, readSim, readYear, simSearch, yearSearch } from './links';

const GRIDS = ['india', 'china', 'world', 'us', 'clean'];
const START = { mix: { world: 100 }, efficiency: 0 };

describe('home: the year', () => {
  it('round-trips, and the latest year has a clean URL', () => {
    expect(yearSearch(2030, 2025)).toBe('?year=2030');
    expect(yearSearch(2025, 2025)).toBe('');
    expect(readYear('?year=2030', 2017, 2035)).toBe(2030);
  });
  it('ignores years out of range and junk', () => {
    for (const s of ['?year=1999', '?year=2036', '?year=abc', '?year=', '', '?year=20300']) expect(readYear(s, 2017, 2035)).toBeNull();
  });
});

describe('/question: the request kind', () => {
  it('round-trips; the default kind has a clean URL; unknown kinds are ignored', () => {
    expect(kindSearch('video')).toBe('?kind=video');
    expect(kindSearch('question')).toBe('');
    expect(readKind('?kind=picture')).toBe('picture');
    expect(readKind('?kind=<script>')).toBeNull();
    expect(readKind('')).toBeNull();
  });
});

describe('/2030: the mix and efficiency', () => {
  it('round-trips a readable link', () => {
    const s = simSearch({ india: 0, china: 0, world: 40, us: 0, clean: 60 }, 50, START);
    expect(s).toBe('?mix=world:40,clean:60&eff=50');
    expect(readSim(s, GRIDS)).toEqual({ mix: { world: 40, clean: 60 }, efficiency: 0.5 });
  });
  it('the starting point has a clean URL', () => {
    expect(simSearch({ india: 0, china: 0, world: 100, us: 0, clean: 0 }, 0, START)).toBe('');
    expect(readSim('', GRIDS)).toBeNull();
  });
  it('snaps to the sliders\' 5% steps, clamps, and ignores unknown grids and junk', () => {
    expect(readSim('?mix=clean:63,us:500,mars:50,world:x&eff=999', GRIDS)).toEqual({ mix: { clean: 65, us: 100 }, efficiency: 1 });
  });
  it('a link with no usable weights falls back to the world average instead of breaking', () => {
    expect(readSim('?mix=india:0&eff=20', GRIDS)).toEqual({ mix: { world: 100 }, efficiency: 0.2 });
  });
});
