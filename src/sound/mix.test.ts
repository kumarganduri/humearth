import { describe, expect, it } from 'vitest';
import { bloomNotes, mixFor, PENTATONIC_HZ, readSoundPref, writeSoundPref } from './mix';

const h = (x: number) => ({ co2: x, water: x, energy: x });

describe('sound mix (13A)', () => {
  it('the dive is wind, with no river or birds', () => {
    expect(mixFor('diving', h(1), 'present')).toEqual({ wind: 0.35, river: 0, birdsPerMinute: 0 });
  });
  it('a healthy world has a full river and birdsong; a stressed world goes quiet', () => {
    const healthy = mixFor('world', h(1), 'present');
    const stressed = mixFor('world', h(0.2), 'hiding');
    expect(healthy.river).toBeGreaterThan(stressed.river);
    expect(healthy.birdsPerMinute).toBe(14);
    expect(stressed.birdsPerMinute).toBe(0);
    expect(stressed.river).toBeGreaterThan(0); // quiet, never silent: the world rests
  });
  it('Earth is a soft breeze', () => {
    expect(mixFor('earth', null, null)).toEqual({ wind: 0.1, river: 0, birdsPerMinute: 0 });
  });
  it('bloom chime grows with the improvement, nothing for no change', () => {
    expect(bloomNotes(0)).toEqual([]);
    expect(bloomNotes(0.1)).toHaveLength(3);
    expect(bloomNotes(1)).toEqual(PENTATONIC_HZ);
  });
  it('preference defaults to off and survives blocked storage', () => {
    expect(readSoundPref(null)).toBe(false);
    const store = new Map<string, string>();
    const s = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v) };
    writeSoundPref(s, true);
    expect(readSoundPref(s)).toBe(true);
    const blocked = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } };
    expect(readSoundPref(blocked)).toBe(false);
    expect(() => writeSoundPref(blocked, true)).not.toThrow();
  });
});
