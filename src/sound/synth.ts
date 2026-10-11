// The hum, synthesised live with Web Audio: no sound files to license, host or download, and nothing loads
// until someone turns it on (main.ts imports this chunk on the first press).
//
//   voice A: 100 Hz + harmonics ──┐
//   voice B: same, detuned by     ├─ lowpass (soft, not buzzy) ─ master ─ speakers
//            waverCents (beats) ──┘
// Rebuilt from v1's engine (git 2c45f33): every change glides, and fast on/off taps end where the button says.

import { FUNDAMENTAL_HZ, type HumTone } from './hum';

export interface HumSynth {
  setTone(t: HumTone): void;
  setEnabled(on: boolean): void;
  dispose(): void;
}

const RAMP = 0.5; // seconds: nothing pops
const HARMONIC_GAIN = [0.5, 0.32, 0.2, 0.13, 0.08]; // fundamental, 2nd .. 5th

/** `ctx` is created inside the tap (Safari only starts audio from a user gesture); this code arrives later. */
export function createHumSynth(ctx: AudioContext): HumSynth {
  const master = ctx.createGain();
  master.gain.value = 0;
  const soft = ctx.createBiquadFilter();
  soft.type = 'lowpass';
  soft.frequency.value = 900;
  soft.connect(master).connect(ctx.destination);

  // Two identical voices; B is detuned to make the forecast waver audible as slow beats.
  const voices = [0, 1].map(() =>
    HARMONIC_GAIN.map((g, i) => {
      const osc = ctx.createOscillator();
      osc.frequency.value = FUNDAMENTAL_HZ * (i + 1);
      const gain = ctx.createGain();
      gain.gain.value = 0;
      osc.connect(gain).connect(soft);
      osc.start();
      return { osc, gain, base: g };
    }),
  );
  const glide = (p: AudioParam, v: number) => p.setTargetAtTime(v, ctx.currentTime, RAMP / 3);
  let level = 0;
  let enabled = false;
  let pauseTimer = 0;

  return {
    setTone(t) {
      level = t.level;
      voices.forEach((voice, v) =>
        voice.forEach(({ osc, gain, base }, i) => {
          glide(gain.gain, i <= t.harmonics ? base * 0.5 : 0); // two voices share the loudness
          if (v === 1) glide(osc.detune, t.waverCents);
        }),
      );
      if (enabled) glide(master.gain, 0.6 * level);
    },
    setEnabled(on) {
      enabled = on;
      window.clearTimeout(pauseTimer); // a pending pause from an earlier "off" must not silence this "on"
      if (on) void ctx.resume();
      glide(master.gain, on ? 0.6 * level : 0);
      if (!on) pauseTimer = window.setTimeout(() => void ctx.suspend(), RAMP * 1000 * 2);
    },
    dispose() {
      window.clearTimeout(pauseTimer);
      void ctx.close();
    },
  };
}
