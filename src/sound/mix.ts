// What the world sounds like (decision 13A), as pure rules so they can be tested without audio.
// Sound follows the same health as the picture: a healthy world is full of birdsong and a full
// river; a stressed world goes quiet (never alarming, never red).

import type { AnimalState } from '../footprint/engine';
import type { Channel } from '../footprint/types';

export type SoundPlace = 'earth' | 'quiz' | 'diving' | 'world' | 'returning';

export interface Mix {
  wind: number; // 0..1, the dive
  river: number; // 0..1, your world's river
  birdsPerMinute: number; // chirp rate
}

const avg = (h: Record<Channel, number>) => (h.co2 + h.water + h.energy) / 3;

export function mixFor(place: SoundPlace, health: Record<Channel, number> | null, animals: AnimalState | null): Mix {
  if (place === 'diving' || place === 'returning') return { wind: 0.5, river: 0, birdsPerMinute: 0 };
  if (place !== 'world' || !health) return { wind: 0.06, river: 0, birdsPerMinute: 0 }; // a soft breeze on Earth
  const birds = animals === 'present' ? 14 : animals === 'some-hiding' ? 4 : 0;
  return { wind: 0.04, river: 0.08 + 0.32 * health.water, birdsPerMinute: Math.round(birds * avg(health)) };
}

/** Bloom chime: a few rising notes of a C major pentatonic, more notes for a bigger improvement. */
export const PENTATONIC_HZ = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];

export function bloomNotes(healthGain: number): number[] {
  if (healthGain <= 0.01) return [];
  const n = Math.min(PENTATONIC_HZ.length, 2 + Math.round(healthGain * 10));
  return PENTATONIC_HZ.slice(0, n);
}

/** Remembered on this device only; storage may be blocked (private mode). */
export function readSoundPref(storage: Pick<Storage, 'getItem'> | null): boolean {
  try {
    return storage?.getItem('hum.sound') === 'on';
  } catch {
    return false;
  }
}

export function writeSoundPref(storage: Pick<Storage, 'setItem'> | null, on: boolean): void {
  try {
    storage?.setItem('hum.sound', on ? 'on' : 'off');
  } catch {
    /* not remembered, still works */
  }
}
