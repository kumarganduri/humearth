// The dive timeline (eng review 1A). Pure: progress t in [0, 1] -> both cameras and the blend.
//
//   t: 0 ────────────────── 0.72 ──── 0.90 ──── 1.0
//   globeCam: orbit → descend to the seed spot ──┐
//                                                ├─ crossfade (both scenes rendered, blended)
//   worldCam:                    high above plot ┴→ settle at the clearing
//
// Skip jumps to t = 1. Reverse plays t from 1 to 0. Reduced motion uses a short crossfade instead.

import type { Vec3 } from './geo';

export const DIVE_MS = 3200;
export const REDUCED_MOTION_MS = 350;
export const BLEND_START = 0.72;
export const BLEND_END = 0.9;

export const ORBIT_DISTANCE = 6.2;
export const SURFACE_DISTANCE = 1.18; // low over your plot, the globe's curve still visible (radius 1)

export const WORLD_HIGH: Vec3 = [0, 14, 9];
export const WORLD_REST: Vec3 = [0, 4.2, 7.6];
export const WORLD_TARGET: Vec3 = [0, 0.2, 0];

/** DESIGN.md "move" easing, cubic-bezier(0.65, 0, 0.35, 1), approximated by ease-in-out cubic. */
export function easeInOut(x: number): number {
  const t = clamp01(x);
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

export function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}

function smoothstep(a: number, b: number, x: number): number {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerp3 = (a: Vec3, b: Vec3, t: number): Vec3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const len = (v: Vec3) => Math.hypot(v[0], v[1], v[2]);
const scale = (v: Vec3, s: number): Vec3 => [v[0] * s, v[1] * s, v[2] * s];
const norm = (v: Vec3): Vec3 => scale(v, 1 / (len(v) || 1));

/** Spherical interpolation between two unit directions. */
export function slerpDir(a: Vec3, b: Vec3, t: number): Vec3 {
  const an = norm(a);
  const bn = norm(b);
  const dot = Math.min(1, Math.max(-1, an[0] * bn[0] + an[1] * bn[1] + an[2] * bn[2]));
  const omega = Math.acos(dot);
  if (omega < 1e-6) return an;
  const s = Math.sin(omega);
  const wa = Math.sin((1 - t) * omega) / s;
  const wb = Math.sin(t * omega) / s;
  return norm([an[0] * wa + bn[0] * wb, an[1] * wa + bn[1] * wb, an[2] * wa + bn[2] * wb]);
}

export interface DiveFrame {
  globeCam: { position: Vec3; target: Vec3 };
  worldCam: { position: Vec3; target: Vec3 };
  /** 0 = only the globe scene, 1 = only the world scene. */
  blend: number;
  renderGlobe: boolean;
  renderWorld: boolean;
}

/**
 * @param t        dive progress in [0, 1]
 * @param startDir camera direction (from the globe centre) when the dive began
 * @param spotDir  unit direction of the seed spot on the globe surface
 */
export function diveFrame(t: number, startDir: Vec3, spotDir: Vec3): DiveFrame {
  const p = clamp01(t);
  // Turn toward the spot in the first 60%, while descending over the first 95%.
  const dir = slerpDir(startDir, spotDir, easeInOut(p / 0.6));
  const dist = lerp(ORBIT_DISTANCE, SURFACE_DISTANCE, easeInOut(p / BLEND_END));
  const spot = norm(spotDir);
  const globeTarget = lerp3([0, 0, 0], spot, easeInOut(p / BLEND_END));

  const w = easeInOut((p - BLEND_START) / (1 - BLEND_START));
  const blend = smoothstep(BLEND_START, BLEND_END, p);
  return {
    globeCam: { position: scale(dir, dist), target: globeTarget },
    worldCam: { position: lerp3(WORLD_HIGH, WORLD_REST, w), target: WORLD_TARGET },
    blend,
    renderGlobe: blend < 1,
    renderWorld: blend > 0,
  };
}

/** Advances dive progress by elapsed ms; direction -1 plays the reverse dive. */
export function advance(t: number, elapsedMs: number, direction: 1 | -1, durationMs = DIVE_MS): number {
  return clamp01(t + (direction * elapsedMs) / durationMs);
}
