// Opt-in sound (decision 13A), synthesised live with Web Audio: no sound files to license, host
// or download, and nothing loads until someone turns sound on. Loaded as its own chunk.
//
//   noise ─ lowpass (gusting) ─ windGain ─┐
//   noise ─ bandpass (rippling) ─ riverGain ┼─ master ─ speakers
//   chirps (scheduled by birdsPerMinute) ──┤
//   bloom chime (pentatonic bells) ────────┘

import type { Mix } from './mix';

export interface Synth {
  setMix(mix: Mix): void;
  chime(notesHz: number[]): void;
  setEnabled(on: boolean): void;
  dispose(): void;
}

const RAMP = 0.6; // seconds: every change glides, nothing pops

function noiseBuffer(ctx: AudioContext): AudioBuffer {
  const len = ctx.sampleRate * 2;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    // Brown-ish noise: softer than white, closer to wind and water.
    last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
    d[i] = last * 14; // about -12 dBFS before the filters: loud enough to hear on laptop speakers
  }
  return buf;
}

function loopNoise(ctx: AudioContext, buf: AudioBuffer): AudioBufferSourceNode {
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  src.start(0, Math.random() * 2);
  return src;
}

/** A slow wobble on an AudioParam (gusting wind, rippling water). */
function lfo(ctx: AudioContext, target: AudioParam, hz: number, depth: number): OscillatorNode {
  const osc = ctx.createOscillator();
  const amt = ctx.createGain();
  osc.frequency.value = hz;
  amt.gain.value = depth;
  osc.connect(amt).connect(target);
  osc.start();
  return osc;
}

export function createSynth(): Synth {
  const ctx = new AudioContext();
  const master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);
  const buf = noiseBuffer(ctx);

  const wind = ctx.createBiquadFilter();
  wind.type = 'lowpass';
  wind.frequency.value = 500;
  const windGain = ctx.createGain();
  windGain.gain.value = 0;
  loopNoise(ctx, buf).connect(wind).connect(windGain).connect(master);
  lfo(ctx, wind.frequency, 0.13, 260);

  const river = ctx.createBiquadFilter();
  river.type = 'bandpass';
  river.frequency.value = 900;
  river.Q.value = 0.8;
  const riverGain = ctx.createGain();
  riverGain.gain.value = 0;
  loopNoise(ctx, buf).connect(river).connect(riverGain).connect(master);
  lfo(ctx, river.frequency, 0.4, 180);

  const glide = (p: AudioParam, v: number) => p.setTargetAtTime(v, ctx.currentTime, RAMP / 3);

  function chirp(at: number) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    const f0 = 2400 + Math.random() * 900;
    osc.frequency.setValueAtTime(f0, at);
    osc.frequency.exponentialRampToValueAtTime(f0 * 1.6, at + 0.09);
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(0.05, at + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.12);
    osc.connect(g).connect(master);
    osc.start(at);
    osc.stop(at + 0.13);
  }

  let pauseTimer = 0;
  let birdsPerMinute = 0;
  const birdTimer = window.setInterval(() => {
    // Each 250 ms tick: chance of a little phrase of 2-3 chirps.
    if (birdsPerMinute > 0 && Math.random() < birdsPerMinute / 240) {
      const n = 2 + Math.floor(Math.random() * 2);
      for (let i = 0; i < n; i++) chirp(ctx.currentTime + i * 0.14);
    }
  }, 250);

  return {
    setMix(mix) {
      glide(windGain.gain, mix.wind * 0.6);
      glide(riverGain.gain, mix.river * 0.5);
      birdsPerMinute = mix.birdsPerMinute;
    },
    chime(notes) {
      notes.forEach((hz, i) => {
        const at = ctx.currentTime + i * 0.12;
        for (const [type, level] of [['sine', 0.08], ['triangle', 0.02]] as const) {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = type;
          osc.frequency.value = type === 'sine' ? hz : hz * 2;
          g.gain.setValueAtTime(0, at);
          g.gain.linearRampToValueAtTime(level, at + 0.01);
          g.gain.exponentialRampToValueAtTime(0.0001, at + 1.4);
          osc.connect(g).connect(master);
          osc.start(at);
          osc.stop(at + 1.5);
        }
      });
    },
    setEnabled(on) {
      // A pending pause from an earlier "off" must not silence a later "on" (fast taps).
      window.clearTimeout(pauseTimer);
      if (on) void ctx.resume();
      glide(master.gain, on ? 0.9 : 0);
      if (!on) pauseTimer = window.setTimeout(() => void ctx.suspend(), RAMP * 1000);
    },
    dispose() {
      window.clearInterval(birdTimer);
      void ctx.close();
    },
  };
}
